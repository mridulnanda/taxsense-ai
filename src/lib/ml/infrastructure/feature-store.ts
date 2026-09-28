/**
 * Feature Store - Centralized Feature Engineering & Caching
 *
 * Manages:
 * - Feature computation and caching
 * - Feature versioning and lineage
 * - Feature sharing across models
 * - Online (real-time) and offline (batch) feature serving
 * - Feature monitoring and drift detection
 *
 * Benefits:
 * - Eliminate duplicate feature computation
 * - Ensure consistency across models
 * - Enable feature reuse across teams
 * - Version control for features
 * - Track feature lineage and dependencies
 */

import { TaxProfile } from "@/lib/types";

export interface FeatureDefinition {
  name: string;
  description: string;
  data_type: "numeric" | "categorical" | "string";
  version: string;
  depends_on: string[]; // feature dependencies
  computation_time_ms: number;
  last_updated: Date;
  owner: string;
  tags: string[];
}

export interface FeatureValue {
  feature_name: string;
  value: any;
  timestamp: Date;
  version: string;
  valid_until?: Date;
}

export interface FeatureSet {
  entity_id: string; // user_id or profile_id
  entity_type: string; // "user", "profile", "transaction"
  features: Record<string, FeatureValue>;
  timestamp: Date;
  version: string;
}

export interface FeatureStoreConfig {
  cache_ttl_ms: number; // Time-to-live for cached features
  enable_online_serving: boolean;
  enable_offline_batch: boolean;
  max_cache_size_mb: number;
  feature_monitoring_enabled: boolean;
}

/**
 * Centralized Feature Store
 * Manages all feature engineering, computation, caching, and serving
 */
export class FeatureStore {
  private static instance: FeatureStore;
  private featureCache: Map<string, FeatureSet> = new Map();
  private featureRegistry: Map<string, FeatureDefinition> = new Map();
  private featureLineage: Map<string, Set<string>> = new Map(); // feature -> dependencies
  private config: FeatureStoreConfig;
  private computationStats: Map<string, number> = new Map(); // feature -> avg computation time
  private accessLog: Array<{ feature: string; timestamp: Date; hit: boolean }> = [];
  private driftDetectionStats: Map<string, any> = new Map();

  private constructor(config?: Partial<FeatureStoreConfig>) {
    this.config = {
      cache_ttl_ms: 3600000, // 1 hour default
      enable_online_serving: true,
      enable_offline_batch: true,
      max_cache_size_mb: 1000,
      feature_monitoring_enabled: true,
      ...config,
    };

    this.initializeFeatureRegistry();
  }

  /**
   * Get or create singleton instance
   */
  static getInstance(config?: Partial<FeatureStoreConfig>): FeatureStore {
    if (!FeatureStore.instance) {
      FeatureStore.instance = new FeatureStore(config);
    }
    return FeatureStore.instance;
  }

  /**
   * Initialize with all known features
   */
  private initializeFeatureRegistry(): void {
    // Income Features
    this.registerFeature("annual_salary", "Annual salary income", "numeric", ["raw_salary"]);
    this.registerFeature("investment_income", "Investment income (dividends, interest)", "numeric", []);
    this.registerFeature("capital_gains", "Capital gains from investments", "numeric", []);
    this.registerFeature("business_income", "Business or self-employed income", "numeric", []);
    this.registerFeature("total_income", "Total annual income", "numeric", [
      "annual_salary",
      "investment_income",
      "capital_gains",
      "business_income",
    ]);

    // Deduction Features
    this.registerFeature("deduction_80c_capacity", "80C deduction capacity (₹1.5L)", "numeric", []);
    this.registerFeature("deduction_80c_used", "80C deduction already used", "numeric", []);
    this.registerFeature("deduction_80d_used", "80D (health insurance) used", "numeric", []);
    this.registerFeature("deduction_80g_used", "80G (charitable) used", "numeric", []);
    this.registerFeature("total_deductions", "Total deductions available", "numeric", [
      "deduction_80c_used",
      "deduction_80d_used",
      "deduction_80g_used",
    ]);

    // Profile Features
    this.registerFeature("age", "Age of taxpayer", "numeric", []);
    this.registerFeature("metro_resident", "Metropolitan area resident", "categorical", []);
    this.registerFeature("residency_years", "Years as tax resident", "numeric", []);
    this.registerFeature("employment_type", "Employment type (Salaried/Business/Both)", "categorical", []);

    // Volatility & Stability Features
    this.registerFeature("income_volatility", "Income stability score (0-1)", "numeric", ["salary_history"]);
    this.registerFeature("income_growth_rate", "YoY income growth percentage", "numeric", ["salary_history"]);
    this.registerFeature("expense_consistency", "Expense consistency score", "numeric", ["expense_history"]);

    // Risk Features
    this.registerFeature("audit_risk_score", "Audit risk probability (0-1)", "numeric", []);
    this.registerFeature("income_concentration", "Income concentration ratio", "numeric", []);
    this.registerFeature("deduction_aggressiveness", "Aggressiveness of deductions (0-1)", "numeric", []);
  }

  /**
   * Register a feature in the store
   */
  registerFeature(
    name: string,
    description: string,
    data_type: "numeric" | "categorical" | "string",
    dependencies: string[] = []
  ): void {
    const definition: FeatureDefinition = {
      name,
      description,
      data_type,
      version: "1.0",
      depends_on: dependencies,
      computation_time_ms: 0,
      last_updated: new Date(),
      owner: "system",
      tags: [],
    };

    this.featureRegistry.set(name, definition);

    // Track lineage
    if (!this.featureLineage.has(name)) {
      this.featureLineage.set(name, new Set(dependencies));
    }
  }

  /**
   * Compute features for an entity (online serving)
   * Returns computed features for real-time use
   */
  async getFeatures(entityId: string, entityType: string, profile: TaxProfile): Promise<FeatureSet> {
    const cacheKey = `${entityType}:${entityId}`;
    const cachedFeatures = this.featureCache.get(cacheKey);

    // Return cached features if valid
    if (cachedFeatures && this.isCacheValid(cachedFeatures)) {
      this.recordAccess(cacheKey, true);
      return cachedFeatures;
    }

    // Compute features from profile
    const features = await this.computeFeatures(profile);
    const featureSet: FeatureSet = {
      entity_id: entityId,
      entity_type: entityType,
      features,
      timestamp: new Date(),
      version: "1.0",
    };

    // Cache the result
    this.cacheFeatures(cacheKey, featureSet);
    this.recordAccess(cacheKey, false);

    return featureSet;
  }

  /**
   * Batch feature computation (offline)
   * Efficiently compute features for multiple profiles
   */
  async batchComputeFeatures(profiles: Array<{ id: string; profile: TaxProfile }>): Promise<FeatureSet[]> {
    const results: FeatureSet[] = [];

    for (const { id, profile } of profiles) {
      const features = await this.computeFeatures(profile);
      results.push({
        entity_id: id,
        entity_type: "profile",
        features,
        timestamp: new Date(),
        version: "1.0",
      });
    }

    return results;
  }

  /**
   * Compute individual features from profile data
   */
  private async computeFeatures(profile: TaxProfile): Promise<Record<string, FeatureValue>> {
    const features: Record<string, FeatureValue> = {};
    const startTime = Date.now();

    // Income Features
    const salary = profile.salary || 0;
    const investments = profile.investments || 0;
    const capital_gains = profile.capital_gains || 0;
    const business_income = profile.business_income || 0;
    const total = salary + investments + capital_gains + business_income;

    features["annual_salary"] = this.createFeatureValue("annual_salary", salary);
    features["investment_income"] = this.createFeatureValue("investment_income", investments);
    features["capital_gains"] = this.createFeatureValue("capital_gains", capital_gains);
    features["business_income"] = this.createFeatureValue("business_income", business_income);
    features["total_income"] = this.createFeatureValue("total_income", total);

    // Deduction Features
    const deduction_80c_used = profile.deduction_80c || 0;
    const deduction_80d_used = profile.deduction_80d || 0;
    const deduction_80g_used = profile.deduction_80g || 0;
    const total_deductions = deduction_80c_used + deduction_80d_used + deduction_80g_used;

    features["deduction_80c_used"] = this.createFeatureValue("deduction_80c_used", deduction_80c_used);
    features["deduction_80c_capacity"] = this.createFeatureValue("deduction_80c_capacity", 150000);
    features["deduction_80d_used"] = this.createFeatureValue("deduction_80d_used", deduction_80d_used);
    features["deduction_80g_used"] = this.createFeatureValue("deduction_80g_used", deduction_80g_used);
    features["total_deductions"] = this.createFeatureValue("total_deductions", total_deductions);

    // Profile Features
    const age = profile.age || 35;
    const metro = profile.is_metro_resident ? 1 : 0;
    const years = profile.residency_years || 10;
    const emp_type = profile.employment_type || "salaried";

    features["age"] = this.createFeatureValue("age", age);
    features["metro_resident"] = this.createFeatureValue("metro_resident", metro);
    features["residency_years"] = this.createFeatureValue("residency_years", years);
    features["employment_type"] = this.createFeatureValue("employment_type", emp_type);

    // Volatility Features
    const income_volatility = this.computeIncomeVolatility(profile);
    const income_growth = this.computeIncomeGrowth(profile);
    const expense_consistency = this.computeExpenseConsistency(profile);

    features["income_volatility"] = this.createFeatureValue("income_volatility", income_volatility);
    features["income_growth_rate"] = this.createFeatureValue("income_growth_rate", income_growth);
    features["expense_consistency"] = this.createFeatureValue("expense_consistency", expense_consistency);

    // Risk Features
    const concentration = salary > 0 ? salary / (total + 1) : 0;
    const aggressiveness = total > 0 ? total_deductions / total : 0;

    features["income_concentration"] = this.createFeatureValue("income_concentration", concentration);
    features["deduction_aggressiveness"] = this.createFeatureValue("deduction_aggressiveness", Math.min(1, aggressiveness));

    // Record computation time
    const computationTime = Date.now() - startTime;
    this.recordComputationTime("compute_features", computationTime);

    // Check for data drift
    if (this.config.feature_monitoring_enabled) {
      this.detectDrift(features);
    }

    return features;
  }

  /**
   * Compute income volatility (0-1 scale)
   */
  private computeIncomeVolatility(profile: TaxProfile): number {
    // Simulated based on profile variability
    const salary = profile.salary || 0;
    const investments = profile.investments || 0;

    // Higher income diversity = lower volatility
    const diversification = investments > 0 ? Math.min(1, investments / (salary + 1)) : 0;
    const volatility = Math.max(0, 1 - diversification);

    return volatility;
  }

  /**
   * Compute income growth rate
   */
  private computeIncomeGrowth(profile: TaxProfile): number {
    // Simulated growth rate (-1 to 1 scale)
    const salary = profile.salary || 0;
    const prev_salary = (profile as any).prev_year_salary || salary * 0.9;

    const growth = (salary - prev_salary) / (prev_salary + 1);
    return Math.max(-0.5, Math.min(0.5, growth));
  }

  /**
   * Compute expense consistency score
   */
  private computeExpenseConsistency(profile: TaxProfile): number {
    // Simulated based on expense patterns
    return 0.75 + Math.random() * 0.2;
  }

  /**
   * Detect data drift in features
   */
  private detectDrift(features: Record<string, FeatureValue>): void {
    for (const [name, value] of Object.entries(features)) {
      if (typeof value.value === "number") {
        const stats = this.driftDetectionStats.get(name) || { mean: 0, stddev: 0, n: 0 };

        // Simple drift detection using running statistics
        const delta = (value.value - stats.mean) / (stats.stddev + 1);
        if (Math.abs(delta) > 3) {
          // 3-sigma rule
          console.warn(`Data drift detected in feature ${name}: value ${value.value} is ${Math.abs(delta).toFixed(1)}σ from mean`);
        }

        // Update running stats
        stats.n++;
        stats.mean = (stats.mean * (stats.n - 1) + value.value) / stats.n;
      }
    }
  }

  /**
   * Create a feature value object
   */
  private createFeatureValue(name: string, value: any): FeatureValue {
    return {
      feature_name: name,
      value,
      timestamp: new Date(),
      version: "1.0",
      valid_until: new Date(Date.now() + this.config.cache_ttl_ms),
    };
  }

  /**
   * Cache a feature set
   */
  private cacheFeatures(key: string, featureSet: FeatureSet): void {
    this.featureCache.set(key, featureSet);

    // Check cache size
    const cacheSize = this.estimateCacheSize();
    if (cacheSize > this.config.max_cache_size_mb) {
      this.evictOldestFeatures();
    }
  }

  /**
   * Check if cached features are still valid
   */
  private isCacheValid(featureSet: FeatureSet): boolean {
    const now = new Date();
    const age = now.getTime() - featureSet.timestamp.getTime();
    return age < this.config.cache_ttl_ms;
  }

  /**
   * Estimate cache size in MB
   */
  private estimateCacheSize(): number {
    let size = 0;
    for (const features of this.featureCache.values()) {
      size += JSON.stringify(features).length / (1024 * 1024);
    }
    return size;
  }

  /**
   * Evict oldest features from cache (LRU)
   */
  private evictOldestFeatures(): void {
    const entriesToRemove = Math.ceil(this.featureCache.size * 0.1); // Remove 10%
    const sorted = Array.from(this.featureCache.entries()).sort(
      (a, b) => a[1].timestamp.getTime() - b[1].timestamp.getTime()
    );

    for (let i = 0; i < entriesToRemove; i++) {
      this.featureCache.delete(sorted[i][0]);
    }
  }

  /**
   * Record cache access for monitoring
   */
  private recordAccess(key: string, hit: boolean): void {
    this.accessLog.push({
      feature: key,
      timestamp: new Date(),
      hit,
    });

    // Keep only last 10000 entries
    if (this.accessLog.length > 10000) {
      this.accessLog = this.accessLog.slice(-10000);
    }
  }

  /**
   * Record feature computation time
   */
  private recordComputationTime(feature: string, time: number): void {
    const current = this.computationStats.get(feature) || 0;
    const n = (this.computationStats.get(`${feature}_count`) || 0) + 1;
    const avg = (current * (n - 1) + time) / n;

    this.computationStats.set(feature, avg);
    this.computationStats.set(`${feature}_count`, n);
  }

  /**
   * Get feature store statistics
   */
  getStats(): {
    cache_size: number;
    cache_entries: number;
    hit_rate: number;
    total_accesses: number;
    features_registered: number;
  } {
    const hits = this.accessLog.filter((a) => a.hit).length;
    const total = this.accessLog.length;

    return {
      cache_size: this.estimateCacheSize(),
      cache_entries: this.featureCache.size,
      hit_rate: total > 0 ? hits / total : 0,
      total_accesses: total,
      features_registered: this.featureRegistry.size,
    };
  }

  /**
   * Clear all caches
   */
  clearCache(): void {
    this.featureCache.clear();
    this.accessLog = [];
  }

  /**
   * Get feature metadata
   */
  getFeatureMetadata(featureName: string): FeatureDefinition | null {
    return this.featureRegistry.get(featureName) || null;
  }

  /**
   * List all registered features
   */
  listFeatures(): FeatureDefinition[] {
    return Array.from(this.featureRegistry.values());
  }
}

export default FeatureStore;
