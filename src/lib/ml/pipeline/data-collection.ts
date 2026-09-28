/**
 * Data Collection Pipeline
 * Gathers and organizes taxpayer data from computations for ML training
 */

import { type TaxProfile } from "../../tax-engine";
import { type DataPoint, type DatasetStats, type TaxpayerFeatures } from "../types";
import { FeatureEngineer, DataSplitter } from "./feature-engineering";

export class DataCollector {
  /**
   * Convert raw computation data to data points for ML
   */
  static collectDataPoint(
    profileId: string,
    profile: TaxProfile,
    fy: string,
    groundTruth?: {
      actual_tax_liability?: number;
      actual_regime?: "old" | "new";
      actual_deductions?: number;
      [key: string]: any;
    },
    historicalData?: { prevRegime?: string; incomeHistory?: number[] }
  ): DataPoint {
    const features = FeatureEngineer.extractFeatures(profile, historicalData);

    return {
      profile_id: profileId,
      fy,
      timestamp: new Date(),
      features,
      ground_truth: groundTruth,
      split: "train", // Will be assigned during split
    };
  }

  /**
   * Clean and validate data points
   */
  static cleanData(dataPoints: DataPoint[]): DataPoint[] {
    return dataPoints
      .map((point) => {
        // Remove rows with critical null values
        const features = { ...point.features };
        let hasNulls = false;

        for (const [key, value] of Object.entries(features)) {
          if (value === null || value === undefined || isNaN(value as number)) {
            // Try to impute with 0 for financial features
            if (key.includes("income") || key.includes("deduction") || key.includes("salary")) {
              features[key as keyof TaxpayerFeatures] = 0;
            } else {
              hasNulls = true;
            }
          }
        }

        return hasNulls ? null : { ...point, features };
      })
      .filter((p) => p !== null) as DataPoint[];
  }

  /**
   * Detect and handle outliers using IQR method
   */
  static removeOutliers(dataPoints: DataPoint[], iqrMultiplier = 1.5, featureKey: keyof TaxpayerFeatures = "total_income"): DataPoint[] {
    const values = dataPoints.map((p) => p.features[featureKey] as number).sort((a, b) => a - b);

    if (values.length < 4) return dataPoints;

    const q1Idx = Math.floor(values.length * 0.25);
    const q3Idx = Math.floor(values.length * 0.75);
    const q1 = values[q1Idx];
    const q3 = values[q3Idx];
    const iqr = q3 - q1;

    const lowerBound = q1 - iqrMultiplier * iqr;
    const upperBound = q3 + iqrMultiplier * iqr;

    return dataPoints.filter((p) => {
      const value = p.features[featureKey] as number;
      return value >= lowerBound && value <= upperBound;
    });
  }

  /**
   * Generate comprehensive dataset statistics
   */
  static computeStats(dataPoints: DataPoint[]): DatasetStats {
    const featureNames = Object.keys(dataPoints[0]?.features || {}) as (keyof TaxpayerFeatures)[];
    const null_value_pct: Record<string, number> = {};
    const outlier_pct: Record<string, number> = {};
    const feature_distributions: Record<string, { min: number; max: number; mean: number; std: number }> = {};

    for (const featureName of featureNames) {
      const values = dataPoints.map((p) => p.features[featureName] as number).filter((v) => !isNaN(v) && v !== null && v !== undefined);

      if (values.length === 0) {
        null_value_pct[featureName] = 100;
        continue;
      }

      null_value_pct[featureName] = ((dataPoints.length - values.length) / dataPoints.length) * 100;

      const sorted = [...values].sort((a, b) => a - b);
      const min = sorted[0];
      const max = sorted[sorted.length - 1];
      const mean = values.reduce((a, b) => a + b, 0) / values.length;
      const std = Math.sqrt(values.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / values.length);

      feature_distributions[featureName] = { min, max, mean, std };

      // Calculate outlier percentage using IQR
      const q1Idx = Math.floor(values.length * 0.25);
      const q3Idx = Math.floor(values.length * 0.75);
      const q1 = sorted[q1Idx];
      const q3 = sorted[q3Idx];
      const iqr = q3 - q1;
      const outlierCount = values.filter((v) => v < q1 - 1.5 * iqr || v > q3 + 1.5 * iqr).length;
      outlier_pct[featureName] = (outlierCount / values.length) * 100;
    }

    return {
      total_samples: dataPoints.length,
      train_samples: dataPoints.filter((p) => p.split === "train").length,
      test_samples: dataPoints.filter((p) => p.split === "test").length,
      validation_samples: dataPoints.filter((p) => p.split === "validation").length,
      feature_count: featureNames.length,
      null_value_pct,
      outlier_pct,
      feature_distributions,
    };
  }

  /**
   * Validate data quality
   */
  static validateQuality(stats: DatasetStats, minSamplesPerSplit = 100): { valid: boolean; issues: string[] } {
    const issues: string[] = [];

    if (stats.total_samples < minSamplesPerSplit * 3) {
      issues.push(`Insufficient samples: ${stats.total_samples} (need at least ${minSamplesPerSplit * 3})`);
    }

    if (stats.train_samples < minSamplesPerSplit) {
      issues.push(`Insufficient training samples: ${stats.train_samples}`);
    }

    if (stats.test_samples < minSamplesPerSplit) {
      issues.push(`Insufficient test samples: ${stats.test_samples}`);
    }

    // Check for features with too many nulls
    for (const [feature, pct] of Object.entries(stats.null_value_pct)) {
      if (pct > 30) {
        issues.push(`Feature ${feature} has ${pct.toFixed(1)}% null values`);
      }
    }

    return {
      valid: issues.length === 0,
      issues,
    };
  }
}

/**
 * Synthetic data generation for testing and augmentation
 */
export class SyntheticDataGenerator {
  /**
   * Generate synthetic tax profiles for training
   */
  static generateProfiles(count: number): TaxProfile[] {
    const profiles: TaxProfile[] = [];

    for (let i = 0; i < count; i++) {
      const age = Math.floor(Math.random() * 40) + 25; // 25-65
      const isSenior = age >= 60;
      const isMetro = Math.random() > 0.6;
      const residentialStatus = Math.random() > 0.95 ? "nri" : "resident";

      // Generate income components
      const grossSalary = Math.floor(Math.random() * 50) * 100000 + 500000; // 5L-55L
      const businessIncome = Math.random() > 0.7 ? Math.floor(Math.random() * 30) * 100000 : 0;
      const capitalGains = Math.random() > 0.6 ? Math.floor(Math.random() * 20) * 100000 : 0;
      const otherIncome = Math.random() > 0.8 ? Math.floor(Math.random() * 10) * 10000 : 0;

      const profile: TaxProfile = {
        age,
        residentialStatus: residentialStatus as "resident" | "nri",
        salary: {
          grossSalary,
          basicPlusDA: grossSalary * 0.6,
          hraReceived: grossSalary * 0.15,
          rentPaid: grossSalary * 0.15,
          isMetroCity: isMetro,
          employerNpsContribution: Math.random() > 0.7 ? grossSalary * 0.05 : 0,
          professionalTax: 2500,
        },
        houseProperties: Math.random() > 0.7 ? [{ use: "let-out", annualRent: Math.floor(Math.random() * 24) * 10000 + 120000, municipalTaxes: 5000, homeLoanInterest: 0 }] : [],
        capitalGains: {
          stcg111A: capitalGains * 0.3,
          stcgOther: capitalGains * 0.1,
          ltcg112A: capitalGains * 0.4,
          ltcgOther: capitalGains * 0.2,
        },
        business: businessIncome > 0 ? { netIncome: businessIncome, presumptive: Math.random() > 0.7 } : undefined,
        otherSources: {
          savingsInterest: Math.random() > 0.8 ? Math.floor(Math.random() * 50) * 100 : 0,
          fdInterest: Math.random() > 0.7 ? Math.floor(Math.random() * 100) * 100 : 0,
          dividends: Math.random() > 0.75 ? Math.floor(Math.random() * 50) * 1000 : 0,
          familyPension: Math.random() > 0.95 ? Math.floor(Math.random() * 200) * 100 : 0,
          other: 0,
        },
        deductions: {
          section80C: Math.min(Math.random() * 150000, 150000),
          section80CCD1B: Math.random() > 0.7 ? Math.random() * 50000 : 0,
          section80D_selfFamily: Math.random() > 0.5 ? Math.random() * 25000 : 0,
          section80D_parents: isSenior ? Math.random() * 50000 : Math.random() * 25000,
          parentsAreSenior: isSenior,
          section80E: Math.random() > 0.85 ? Math.random() * 150000 : 0,
          section80G: Math.random() > 0.85 ? Math.random() * 100000 : 0,
        },
        taxesPaid: 0,
      };

      profiles.push(profile);
    }

    return profiles;
  }

  /**
   * Augment training data with variations
   */
  static augmentProfiles(profiles: TaxProfile[], augmentationFactor = 2): TaxProfile[] {
    const augmented: TaxProfile[] = [...profiles];

    for (const profile of profiles) {
      for (let i = 0; i < augmentationFactor - 1; i++) {
        const variation = { ...profile };

        // Add small random variations (±10%)
        if (variation.salary) {
          variation.salary = { ...variation.salary };
          variation.salary.grossSalary = Math.floor(variation.salary.grossSalary * (0.9 + Math.random() * 0.2));
          variation.salary.rentPaid = Math.floor(variation.salary.rentPaid * (0.9 + Math.random() * 0.2));
        }

        variation.deductions = { ...variation.deductions };
        const deductionKeys = Object.keys(variation.deductions) as (keyof typeof variation.deductions)[];
        for (const key of deductionKeys) {
          if (key !== "parentsAreSenior" && typeof variation.deductions[key] === "number") {
            const val = variation.deductions[key] as number;
            variation.deductions[key] = Math.floor(val * (0.9 + Math.random() * 0.2));
          }
        }

        augmented.push(variation);
      }
    }

    return augmented;
  }
}

/**
 * Export collected data to various formats
 */
export class DataExporter {
  /**
   * Export as JSONL (one JSON per line) for streaming
   */
  static toJSONL(dataPoints: DataPoint[]): string {
    return dataPoints.map((point) => JSON.stringify(point)).join("\n");
  }

  /**
   * Export as CSV for Excel/analysis
   */
  static toCSV(dataPoints: DataPoint[]): string {
    if (dataPoints.length === 0) return "";

    const headers = Object.keys(dataPoints[0].features) as (keyof TaxpayerFeatures)[];
    const csvHeaders = ["profile_id", "fy", "split", ...headers, "ground_truth"];

    const rows = dataPoints.map((point) => {
      const featureValues = headers.map((h) => point.features[h]);
      return [point.profile_id, point.fy, point.split, ...featureValues, JSON.stringify(point.ground_truth || "")].map((v) => `"${v}"`).join(",");
    });

    return [csvHeaders.join(","), ...rows].join("\n");
  }

  /**
   * Export as Arrow/Parquet-compatible format
   */
  static toArrowFormat(dataPoints: DataPoint[]): { schema: string[]; data: any[] } {
    if (dataPoints.length === 0) return { schema: [], data: [] };

    const headers = Object.keys(dataPoints[0].features) as (keyof TaxpayerFeatures)[];

    const data = dataPoints.map((point) => ({
      profile_id: point.profile_id,
      fy: point.fy,
      split: point.split,
      ...point.features,
      ground_truth: point.ground_truth,
    }));

    return {
      schema: ["profile_id", "fy", "split", ...headers, "ground_truth"],
      data,
    };
  }
}
