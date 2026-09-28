/**
 * A/B Testing Framework for ML Model Selection
 *
 * Enables:
 * - Multi-armed bandit algorithms for model selection
 * - Thompson sampling for efficient exploration-exploitation
 * - Experiment tracking and result analysis
 * - Statistical significance testing
 * - Model performance comparison
 * - Automatic winner selection
 *
 * Use Cases:
 * - Compare new tax optimization models vs current best
 * - Test different model versions
 * - Multi-armed bandit for best model selection
 * - Gradually roll out improvements
 */

export interface ModelVariant {
  model_id: string;
  model_name: string;
  description: string;
  weight: number; // Traffic allocation (0-1)
  version: string;
  created_at: Date;
  status: "active" | "paused" | "archived";
}

export interface ExperimentConfig {
  experiment_id: string;
  name: string;
  description: string;
  variants: ModelVariant[];
  metric_type: "accuracy" | "f1" | "rmse" | "revenue" | "user_satisfaction";
  start_date: Date;
  end_date: Date;
  min_samples_per_variant: number;
  statistical_significance_level: number; // 0.05 for 95% confidence
  traffic_allocation: Record<string, number>; // model_id -> percentage
}

export interface ExperimentResult {
  variant_id: string;
  total_samples: number;
  success_count: number;
  success_rate: number;
  mean_value: number;
  std_dev: number;
  confidence_interval: { lower: number; upper: number };
  is_winner: boolean;
  p_value: number;
}

export interface BanditArm {
  variant_id: string;
  alpha: number; // Beta distribution alpha (successes)
  beta: number; // Beta distribution beta (failures)
  total_samples: number;
  estimated_value: number;
}

/**
 * Thompson Sampling Multi-Armed Bandit
 * Dynamically allocates traffic to best performing models
 */
export class ThompsonSamplingBandit {
  private arms: Map<string, BanditArm> = new Map();
  private config: ExperimentConfig;

  constructor(config: ExperimentConfig) {
    this.config = config;
    this.initializeArms();
  }

  /**
   * Initialize bandit arms for each variant
   */
  private initializeArms(): void {
    for (const variant of this.config.variants) {
      this.arms.set(variant.model_id, {
        variant_id: variant.model_id,
        alpha: 1, // Beta(1,1) = uniform prior
        beta: 1,
        total_samples: 0,
        estimated_value: 0.5,
      });
    }
  }

  /**
   * Select variant using Thompson sampling
   * Samples from Beta distribution for each arm and picks best
   */
  selectVariant(): string {
    const samples: Array<{ variant: string; sample: number }> = [];

    for (const [variantId, arm] of this.arms) {
      const sample = this.sampleBeta(arm.alpha, arm.beta);
      samples.push({ variant: variantId, sample });
    }

    // Select variant with highest sample
    const selected = samples.reduce((a, b) => (a.sample > b.sample ? a : b));
    return selected.variant;
  }

  /**
   * Record experiment result (0 = failure, 1 = success)
   */
  recordResult(variantId: string, success: boolean): void {
    const arm = this.arms.get(variantId);
    if (!arm) return;

    if (success) {
      arm.alpha++;
    } else {
      arm.beta++;
    }
    arm.total_samples++;
    arm.estimated_value = arm.alpha / (arm.alpha + arm.beta);
  }

  /**
   * Get current traffic allocation based on posterior distributions
   */
  getTrafficAllocation(): Record<string, number> {
    const allocation: Record<string, number> = {};
    const samples: Array<{ variant: string; mean: number }> = [];

    for (const [variantId, arm] of this.arms) {
      const mean = arm.alpha / (arm.alpha + arm.beta);
      samples.push({ variant: variantId, mean });
    }

    // Allocate traffic proportional to estimated value (softmax)
    const total = samples.reduce((sum, s) => sum + Math.exp(s.mean * 5), 0);
    for (const sample of samples) {
      allocation[sample.variant] = Math.exp(sample.mean * 5) / total;
    }

    return allocation;
  }

  /**
   * Sample from Beta distribution using Marsaglia and Tsang method
   */
  private sampleBeta(alpha: number, beta: number): number {
    const X = this.sampleGamma(alpha, 1);
    const Y = this.sampleGamma(beta, 1);
    return X / (X + Y);
  }

  /**
   * Sample from Gamma distribution
   */
  private sampleGamma(shape: number, scale: number): number {
    if (shape < 1) {
      return this.sampleGamma(shape + 1, scale) * Math.pow(Math.random(), 1 / shape);
    }

    const d = shape - 1 / 3;
    const c = 1 / Math.sqrt(9 * d);

    while (true) {
      let x = this.standardNormal();
      let v = 1 + c * x;

      while (v <= 0) {
        x = this.standardNormal();
        v = 1 + c * x;
      }

      v = v * v * v;
      const u = Math.random();

      if (u < 1 - 0.0331 * x * x * x * x) {
        return d * v * scale;
      }

      if (Math.log(u) < 0.5 * x * x + d * (1 - v + Math.log(v))) {
        return d * v * scale;
      }
    }
  }

  /**
   * Sample from standard normal distribution
   */
  private standardNormal(): number {
    let u = 0,
      v = 0;
    while (u === 0) u = Math.random();
    while (v === 0) v = Math.random();
    return Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
  }

  /**
   * Get arm statistics
   */
  getArmStats(): Record<string, any> {
    const stats: Record<string, any> = {};

    for (const [variantId, arm] of this.arms) {
      stats[variantId] = {
        alpha: arm.alpha,
        beta: arm.beta,
        total_samples: arm.total_samples,
        estimated_value: arm.estimated_value,
        confidence_interval: {
          lower: this.betaQuantile(arm.alpha, arm.beta, 0.025),
          upper: this.betaQuantile(arm.alpha, arm.beta, 0.975),
        },
      };
    }

    return stats;
  }

  /**
   * Calculate quantile of Beta distribution (approximation)
   */
  private betaQuantile(alpha: number, beta: number, p: number): number {
    const mean = alpha / (alpha + beta);
    const variance = (alpha * beta) / ((alpha + beta) ** 2 * (alpha + beta + 1));
    const stddev = Math.sqrt(variance);
    return mean + stddev * this.inverseNormal(p);
  }

  /**
   * Inverse normal CDF (approximation using rational approximation)
   */
  private inverseNormal(p: number): number {
    // Wichura's algorithm approximation
    const c = [2.515517, 0.802853, 0.010328];
    const d = [1.432788, 0.189269, 0.001308];

    if (p < 0.5) {
      const t = Math.sqrt(-2.0 * Math.log(p));
      return -((c[0] + c[1] * t + c[2] * t * t) / (1 + d[0] * t + d[1] * t * t + d[2] * t * t * t));
    } else {
      const t = Math.sqrt(-2.0 * Math.log(1 - p));
      return (c[0] + c[1] * t + c[2] * t * t) / (1 + d[0] * t + d[1] * t * t + d[2] * t * t * t);
    }
  }

  /**
   * Get confidence intervals for each variant
   */
  getConfidenceIntervals(): Record<string, { lower: number; upper: number }> {
    const intervals: Record<string, { lower: number; upper: number }> = {};

    for (const [variantId, arm] of this.arms) {
      intervals[variantId] = {
        lower: this.betaQuantile(arm.alpha, arm.beta, 0.025),
        upper: this.betaQuantile(arm.alpha, arm.beta, 0.975),
      };
    }

    return intervals;
  }
}

/**
 * A/B Testing Manager
 * Manages experiments, tracks results, determines winners
 */
export class ABTestingManager {
  private experiments: Map<string, ExperimentConfig> = new Map();
  private results: Map<string, Map<string, ExperimentResult>> = new Map(); // exp_id -> variant_results
  private bandits: Map<string, ThompsonSamplingBandit> = new Map();

  /**
   * Create a new experiment
   */
  createExperiment(config: ExperimentConfig): void {
    this.experiments.set(config.experiment_id, config);
    this.results.set(config.experiment_id, new Map());

    // Initialize bandit for this experiment
    const bandit = new ThompsonSamplingBandit(config);
    this.bandits.set(config.experiment_id, bandit);

    // Initialize results for each variant
    for (const variant of config.variants) {
      const result: ExperimentResult = {
        variant_id: variant.model_id,
        total_samples: 0,
        success_count: 0,
        success_rate: 0,
        mean_value: 0,
        std_dev: 0,
        confidence_interval: { lower: 0, upper: 0 },
        is_winner: false,
        p_value: 1,
      };
      this.results.get(config.experiment_id)?.set(variant.model_id, result);
    }
  }

  /**
   * Select variant for a user (respects traffic allocation)
   */
  selectVariant(experimentId: string): string | null {
    const bandit = this.bandits.get(experimentId);
    if (!bandit) return null;

    return bandit.selectVariant();
  }

  /**
   * Record a result for an experiment
   */
  recordResult(experimentId: string, variantId: string, success: boolean, value: number = 0): void {
    const bandit = this.bandits.get(experimentId);
    if (!bandit) return;

    bandit.recordResult(variantId, success);

    const result = this.results.get(experimentId)?.get(variantId);
    if (result) {
      result.total_samples++;
      if (success) {
        result.success_count++;
      }
      result.success_rate = result.success_count / result.total_samples;
      result.mean_value = value;
    }
  }

  /**
   * Get current experiment results
   */
  getResults(experimentId: string): ExperimentResult[] {
    return Array.from(this.results.get(experimentId)?.values() || []);
  }

  /**
   * Determine winner using statistical significance
   */
  determineWinner(experimentId: string): string | null {
    const resultMap = this.results.get(experimentId);
    if (!resultMap) return null;

    const results = Array.from(resultMap.values());

    // Check if any variant has sufficient samples
    const experiment = this.experiments.get(experimentId);
    if (!experiment) return null;

    const readyResults = results.filter((r) => r.total_samples >= experiment.min_samples_per_variant);
    if (readyResults.length === 0) return null;

    // Find variant with highest success rate
    let winner = readyResults[0];
    for (const result of readyResults) {
      if (result.success_rate > winner.success_rate) {
        winner = result;
      }
    }

    // Perform t-test for statistical significance
    let isSignificant = true;
    for (const result of readyResults) {
      if (result.variant_id !== winner.variant_id) {
        const tStat = this.calculateTStat(winner, result);
        const pValue = this.tTestPValue(tStat, winner.total_samples + result.total_samples - 2);

        if (pValue > experiment.statistical_significance_level) {
          isSignificant = false;
          break;
        }
      }
    }

    return isSignificant ? winner.variant_id : null;
  }

  /**
   * Calculate t-statistic for two samples
   */
  private calculateTStat(sample1: ExperimentResult, sample2: ExperimentResult): number {
    const diff = sample1.success_rate - sample2.success_rate;
    const se = Math.sqrt((sample1.success_rate * (1 - sample1.success_rate)) / sample1.total_samples +
      (sample2.success_rate * (1 - sample2.success_rate)) / sample2.total_samples);

    return Math.abs(diff) / se;
  }

  /**
   * Approximate p-value from t-statistic
   */
  private tTestPValue(tStat: number, df: number): number {
    // Approximation using normal distribution for large df
    if (df > 30) {
      // Two-tailed
      return 2 * (1 - this.normalCDF(Math.abs(tStat)));
    }

    // For small df, use approximation
    const x = df / (tStat * tStat + df);
    return this.incompleteBeta(x, df / 2, 0.5);
  }

  /**
   * Normal CDF approximation
   */
  private normalCDF(z: number): number {
    return 0.5 * (1 + this.erf(z / Math.sqrt(2)));
  }

  /**
   * Error function approximation
   */
  private erf(x: number): number {
    const a1 = 0.254829592;
    const a2 = -0.284496736;
    const a3 = 1.421413741;
    const a4 = -1.453152027;
    const a5 = 1.061405429;
    const p = 0.3275911;

    const sign = x < 0 ? -1 : 1;
    x = Math.abs(x);

    const t = 1.0 / (1.0 + p * x);
    const t2 = t * t;
    const t3 = t2 * t;
    const t4 = t3 * t;
    const t5 = t4 * t;

    const y = 1.0 - (((((a5 * t5 + a4 * t4) + a3 * t3) + a2 * t2) + a1 * t) * t * Math.exp(-x * x));

    return sign * y;
  }

  /**
   * Incomplete beta function (for p-value calculation)
   */
  private incompleteBeta(x: number, a: number, b: number): number {
    // Simplified approximation
    return x > 0.5 ? 1 - this.normalCDF((x - 0.5) / Math.sqrt(x * (1 - x) / 100)) : this.normalCDF((x - 0.5) / Math.sqrt(x * (1 - x) / 100));
  }

  /**
   * Get traffic allocation for an experiment
   */
  getTrafficAllocation(experimentId: string): Record<string, number> {
    const bandit = this.bandits.get(experimentId);
    if (!bandit) return {};

    return bandit.getTrafficAllocation();
  }

  /**
   * Get detailed statistics for an experiment
   */
  getExperimentStats(experimentId: string): {
    experiment_config: ExperimentConfig | undefined;
    results: ExperimentResult[];
    traffic_allocation: Record<string, number>;
    winner: string | null;
    bandit_stats: Record<string, any>;
  } {
    const config = this.experiments.get(experimentId);
    const results = this.getResults(experimentId);
    const allocation = this.getTrafficAllocation(experimentId);
    const winner = this.determineWinner(experimentId);
    const bandit = this.bandits.get(experimentId);

    return {
      experiment_config: config,
      results,
      traffic_allocation: allocation,
      winner,
      bandit_stats: bandit?.getArmStats() || {},
    };
  }

  /**
   * Conclude experiment and get winner
   */
  concludeExperiment(experimentId: string): {
    winner_id: string | null;
    winner_performance: number;
    confidence_level: number;
  } {
    const winner = this.determineWinner(experimentId);
    const results = this.getResults(experimentId);
    const winnerResult = results.find((r) => r.variant_id === winner);

    return {
      winner_id: winner,
      winner_performance: winnerResult?.success_rate || 0,
      confidence_level: 0.95,
    };
  }
}

export default ABTestingManager;
