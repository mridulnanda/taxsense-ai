/**
 * Synthetic Training Data Generator
 * Generates realistic tax profiles for model training
 */

import { type TaxpayerFeatures, type DataPoint } from "../types";

export interface GenerationConfig {
  totalSamples: number;
  countrySample?: "IN" | "US" | "UK" | "CA" | "AU" | "SG";
  ageDistribution?: "young" | "balanced" | "senior";
  incomeRange?: "low" | "medium" | "high" | "mixed";
  seed?: number;
}

class RandomGenerator {
  private seed: number;

  constructor(seed = 42) {
    this.seed = seed;
  }

  private next(): number {
    this.seed = (this.seed * 9301 + 49297) % 233280;
    return this.seed / 233280;
  }

  random(min = 0, max = 1): number {
    return min + this.next() * (max - min);
  }

  randomInt(min: number, max: number): number {
    return Math.floor(this.random(min, max + 1));
  }

  randomGaussian(mean = 0, std = 1): number {
    // Box-Muller transform
    const u1 = this.next();
    const u2 = this.next();
    const z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
    return mean + z * std;
  }
}

export class SyntheticDataGenerator {
  private rng: RandomGenerator;

  constructor(config: GenerationConfig = { totalSamples: 10000, countrySample: "IN" }) {
    this.rng = new RandomGenerator(config.seed || 42);
  }

  /**
   * Generate synthetic tax profiles
   */
  generateProfiles(count: number, ageGroup: number = -1): TaxpayerFeatures[] {
    const profiles: TaxpayerFeatures[] = [];

    for (let i = 0; i < count; i++) {
      profiles.push(this.generateSingleProfile(ageGroup));
    }

    return profiles;
  }

  /**
   * Generate a single realistic tax profile
   */
  private generateSingleProfile(ageGroupOverride: number = -1): TaxpayerFeatures {
    // Age group distribution: 0: <25, 1: 25-35, 2: 35-50, 3: 50-65, 4: 65+
    const ageGroup = ageGroupOverride >= 0 ? ageGroupOverride : this.randomizeAgeGroup();
    const age = this.getAgeFromGroup(ageGroup);
    const isSenior = ageGroup === 4 ? 1 : 0;

    // Income generation
    const incomeProfile = this.generateIncomeProfile(ageGroup);

    // Deductions based on income level
    const deductionProfile = this.generateDeductionProfile(incomeProfile);

    // Risk and stability factors
    const riskProfile = this.generateRiskProfile();

    return {
      // Income features
      gross_salary: incomeProfile.salary,
      investment_income: incomeProfile.investment,
      capital_gains: incomeProfile.capGains,
      business_income: incomeProfile.business,
      other_income: incomeProfile.other,
      total_income: incomeProfile.total,

      // Deduction features
      section_80c_used: deductionProfile.section80C,
      section_80c_capacity_used_pct: Math.min(100, (deductionProfile.section80C / 150000) * 100),
      section_80d_used: deductionProfile.section80D,
      section_80e_used: deductionProfile.section80E,
      section_80g_used: deductionProfile.section80G,
      total_deductions: deductionProfile.total,
      deduction_ratio: deductionProfile.total / incomeProfile.total,

      // Profile features
      age,
      age_group: ageGroup,
      is_senior: isSenior,
      is_metro: this.rng.random() > 0.4 ? 1 : 0,
      residential_status: this.rng.random() > 0.9 ? 1 : 0, // 10% NRI

      // Income volatility
      income_growth_yoy: this.rng.randomGaussian(0.12, 0.08), // 12% +/- 8%
      income_stability_score: this.rng.random(0.3, 1.0),

      // History features
      regime_preference: this.rng.random() > 0.5 ? 0 : 1,
      regime_changes_count: this.rng.randomInt(0, 3),
      previous_regime: this.rng.random() > 0.5 ? 0 : 1,

      // House property features
      has_house_property: this.rng.random() > 0.6 ? 1 : 0,
      house_property_count: this.rng.randomInt(0, 2),
      house_property_income: incomeProfile.total > 2000000 ? this.rng.random(100000, 500000) : 0,
      house_property_loss: Math.random() > 0.7 ? this.rng.random(-100000, 0) : 0,

      // Risk features
      income_concentration: this.rng.random(0.2, 1.0),
      audit_risk_flags: this.rng.randomInt(0, 3),
    };
  }

  /**
   * Generate income profile
   */
  private generateIncomeProfile(ageGroup: number) {
    // Base salary by age
    const baseSalaryByAge = [400000, 700000, 1200000, 1800000, 1500000];
    const baseSalary = baseSalaryByAge[ageGroup];
    const salary = baseSalary + this.rng.randomGaussian(0, baseSalary * 0.3);

    // Investment income (typically 10-30% of salary)
    const investmentRatio = this.rng.random(0.05, 0.3);
    const investment = salary * investmentRatio;

    // Capital gains (lower probability, higher amount)
    const hasCapGains = this.rng.random() > 0.7;
    const capGains = hasCapGains ? this.rng.random(50000, 500000) : 0;

    // Business income (lower probability, significant amount)
    const hasBusiness = this.rng.random() > 0.85;
    const business = hasBusiness ? this.rng.random(200000, 2000000) : 0;

    // Other income
    const other = this.rng.random(0, 50000);

    const total = salary + investment + capGains + business + other;

    return { salary, investment, capGains, business, other, total };
  }

  /**
   * Generate deduction profile
   */
  private generateDeductionProfile(income: any) {
    // Section 80C (Max 150,000)
    const section80CUsageRatio = this.rng.random(0.2, 0.9);
    const section80C = Math.min(150000, income.salary * section80CUsageRatio * 0.15);

    // Section 80D (Health insurance)
    const section80D = income.salary > 1000000 ? this.rng.random(10000, 50000) : this.rng.random(5000, 25000);

    // Section 80E (Education loan)
    const hasEducationLoan = this.rng.random() > 0.9;
    const section80E = hasEducationLoan ? this.rng.random(20000, 200000) : 0;

    // Section 80G (Charitable donation)
    const hasCharitableDonation = this.rng.random() > 0.8;
    const section80G = hasCharitableDonation ? this.rng.random(5000, 50000) : 0;

    const total = section80C + section80D + section80E + section80G;

    return { section80C, section80D, section80E, section80G, total };
  }

  /**
   * Generate risk profile
   */
  private generateRiskProfile() {
    return {
      incomeConcentration: this.rng.random(0.2, 1.0),
      auditRiskFlags: this.rng.randomInt(0, 3),
    };
  }

  /**
   * Get age from age group
   */
  private getAgeFromGroup(ageGroup: number): number {
    const ranges = [[20, 24], [25, 35], [35, 50], [50, 65], [65, 75]];
    const [min, max] = ranges[ageGroup] || [30, 40];
    return this.rng.randomInt(min, max);
  }

  /**
   * Randomize age group with realistic distribution
   */
  private randomizeAgeGroup(): number {
    const rand = this.rng.random();
    if (rand < 0.15) return 0; // <25: 15%
    if (rand < 0.35) return 1; // 25-35: 20%
    if (rand < 0.55) return 2; // 35-50: 20%
    if (rand < 0.75) return 3; // 50-65: 20%
    return 4; // 65+: 25%
  }

  /**
   * Generate complete training dataset with train/test splits
   */
  generateDataset(config: GenerationConfig) {
    const profiles = this.generateProfiles(config.totalSamples);

    // Generate ground truth tax liabilities
    const dataPoints: DataPoint[] = profiles.map((features, index) => {
      // Calculate approximate tax liability
      const taxableIncome = Math.max(0, features.total_income - features.total_deductions);
      const taxLiability = this.calculateApproximateTax(taxableIncome, features.age_group);

      // Split: 70% train, 15% validation, 15% test
      let split: "train" | "test" | "validation" = "train";
      const rand = Math.random();
      if (rand < 0.15) split = "validation";
      else if (rand < 0.30) split = "test";

      return {
        profile_id: `profile_${index}`,
        fy: "2025-26",
        timestamp: new Date(),
        features,
        ground_truth: {
          tax_liability: taxLiability,
          after_deduction_income: taxableIncome,
        },
        split,
      };
    });

    return dataPoints;
  }

  /**
   * Calculate approximate tax (for ground truth)
   */
  private calculateApproximateTax(taxableIncome: number, ageGroup: number): number {
    if (taxableIncome <= 250000) return 0;

    let tax = 0;
    const brackets = [
      { limit: 250000, rate: 0 },
      { limit: 500000, rate: 0.05 },
      { limit: 750000, rate: 0.1 },
      { limit: 1000000, rate: 0.15 },
      { limit: 1250000, rate: 0.2 },
      { limit: 1500000, rate: 0.25 },
      { limit: Infinity, rate: 0.3 },
    ];

    let prevLimit = 0;
    for (const bracket of brackets) {
      if (taxableIncome > bracket.limit) {
        tax += (bracket.limit - prevLimit) * bracket.rate;
        prevLimit = bracket.limit;
      } else {
        tax += Math.max(0, taxableIncome - prevLimit) * bracket.rate;
        break;
      }
    }

    // Add surcharge and cess
    const surcharge = tax * 0.15; // 15% surcharge for high earners
    const cess = tax * 0.04; // 4% cess

    return tax + surcharge + cess;
  }

  /**
   * Generate country-specific dataset
   */
  generateCountrySpecificData(country: "IN" | "US" | "UK" | "CA" | "AU" | "SG", count: number): TaxpayerFeatures[] {
    // Adjust parameters based on country
    const countryConfigs: Record<string, any> = {
      IN: { incomeFactor: 1.0, deductionCap: 150000 },
      US: { incomeFactor: 2.0, deductionCap: 13850 },
      UK: { incomeFactor: 1.5, deductionCap: 0 },
      CA: { incomeFactor: 1.7, deductionCap: 18000 },
      AU: { incomeFactor: 1.6, deductionCap: 0 },
      SG: { incomeFactor: 1.8, deductionCap: 0 },
    };

    const config = countryConfigs[country];
    const profiles: TaxpayerFeatures[] = [];

    for (let i = 0; i < count; i++) {
      const profile = this.generateSingleProfile();
      // Adjust income based on country
      profile.total_income *= config.incomeFactor;
      profile.gross_salary *= config.incomeFactor;
      profiles.push(profile);
    }

    return profiles;
  }
}

/**
 * Convenience function to generate training data
 */
export async function generateTrainingData(config: GenerationConfig) {
  const generator = new SyntheticDataGenerator(config);
  return generator.generateDataset(config);
}

/**
 * Generate balanced training set
 */
export async function generateBalancedTrainingSet(totalSamples: number) {
  const generator = new SyntheticDataGenerator({ totalSamples });
  const dataPoints: DataPoint[] = [];

  // Generate data for each age group
  const samplesPerGroup = Math.floor(totalSamples / 5);
  for (let ageGroup = 0; ageGroup < 5; ageGroup++) {
    const profiles = generator.generateProfiles(samplesPerGroup, ageGroup);
    profiles.forEach((features, index) => {
      const taxableIncome = Math.max(0, features.total_income - features.total_deductions);
      const taxLiability = generator["calculateApproximateTax"](taxableIncome, ageGroup);

      const rand = Math.random();
      let split: "train" | "test" | "validation" = "train";
      if (rand < 0.15) split = "validation";
      else if (rand < 0.30) split = "test";

      dataPoints.push({
        profile_id: `profile_${ageGroup}_${index}`,
        fy: "2025-26",
        timestamp: new Date(),
        features,
        ground_truth: { tax_liability: taxLiability },
        split,
      });
    });
  }

  return dataPoints;
}
