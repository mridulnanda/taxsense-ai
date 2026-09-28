/**
 * Feature Engineering Pipeline
 * Converts TaxProfile → TaxpayerFeatures for ML models
 */

import { type TaxProfile } from "../../tax-engine";
import { type TaxpayerFeatures } from "../types";

const SECTION_80C_CAP = 150000;
const SECTION_80D_SELF_FAMILY_CAP = 25000;
const SECTION_80D_PARENTS_CAP = 25000;
const SECTION_80D_SENIOR_PARENTS_CAP = 50000;
const SECTION_80E_CAP = Infinity; // No cap
const SECTION_80G_CAP = Infinity; // No cap

export class FeatureEngineer {
  /**
   * Extract features from a TaxProfile for ML models
   */
  static extractFeatures(profile: TaxProfile, historicalData?: { prevRegime?: string; incomeHistory?: number[] }): TaxpayerFeatures {
    const salary = profile.salary || { grossSalary: 0, basicPlusDA: 0, hraReceived: 0, rentPaid: 0, isMetroCity: false, employerNpsContribution: 0, professionalTax: 0 };
    const capitalGains = profile.capitalGains || { stcg111A: 0, stcgOther: 0, ltcg112A: 0, ltcgOther: 0 };
    const business = profile.business || { netIncome: 0, presumptive: false };
    const otherSources = profile.otherSources || { savingsInterest: 0, fdInterest: 0, dividends: 0, familyPension: 0, other: 0 };

    // Income features
    const gross_salary = salary.grossSalary;
    const investment_income = capitalGains.stcg111A + capitalGains.stcgOther + capitalGains.ltcg112A + capitalGains.ltcgOther;
    const capital_gains = capitalGains.stcg111A + capitalGains.stcgOther + capitalGains.ltcg112A + capitalGains.ltcgOther;
    const business_income = business.netIncome;
    const other_income = otherSources.savingsInterest + otherSources.fdInterest + otherSources.dividends + otherSources.familyPension + otherSources.other;
    const total_income = gross_salary + investment_income + business_income + other_income;

    // Deduction features
    const section_80c_used = Math.min(profile.deductions.section80C, SECTION_80C_CAP);
    const section_80c_capacity_used_pct = total_income > 0 ? (section_80c_used / SECTION_80C_CAP) * 100 : 0;

    const section_80d_cap = profile.deductions.parentsAreSenior ? SECTION_80D_SENIOR_PARENTS_CAP : SECTION_80D_PARENTS_CAP;
    const section_80d_used = Math.min(profile.deductions.section80D_selfFamily, SECTION_80D_SELF_FAMILY_CAP) + Math.min(profile.deductions.section80D_parents, section_80d_cap);

    const section_80e_used = profile.deductions.section80E;
    const section_80g_used = profile.deductions.section80G;

    const total_deductions = section_80c_used + section_80d_used + section_80e_used + section_80g_used + (profile.deductions.section80CCD1B || 0);
    const deduction_ratio = total_income > 0 ? total_deductions / total_income : 0;

    // Profile features
    const age = profile.age;
    const age_group = this.getAgeGroup(age);
    const is_senior = age >= 60 ? 1 : 0;
    const is_metro = profile.salary?.isMetroCity ? 1 : 0;
    const residential_status = profile.residentialStatus === "nri" ? 1 : 0;

    // Income volatility (if history provided)
    const income_growth_yoy = historicalData?.incomeHistory && historicalData.incomeHistory.length >= 2 ? ((total_income - historicalData.incomeHistory[historicalData.incomeHistory.length - 1]) / historicalData.incomeHistory[historicalData.incomeHistory.length - 1]) * 100 : 0;

    const income_stability_score = this.calculateIncomeStability(historicalData?.incomeHistory || [total_income]);

    // Regime features
    const regime_preference = historicalData?.prevRegime === "old" ? 1 : 0;
    const regime_changes_count = 0; // Would be tracked from history
    const previous_regime = regime_preference;

    // House property features
    const has_house_property = profile.houseProperties.length > 0 ? 1 : 0;
    const house_property_count = profile.houseProperties.length;
    let house_property_income = 0;
    let house_property_loss = 0;

    for (const prop of profile.houseProperties) {
      const netIncome = prop.annualRent - prop.municipalTaxes - prop.homeLoanInterest;
      if (netIncome > 0) {
        house_property_income += netIncome;
      } else {
        house_property_loss += Math.abs(netIncome);
      }
    }

    // Risk features
    const income_concentration = this.calculateIncomeConcentration([gross_salary, investment_income, business_income, other_income]);

    // Audit risk flags
    const audit_risk_flags = this.calculateAuditRiskFlags(profile);

    return {
      gross_salary,
      investment_income,
      capital_gains,
      business_income,
      other_income,
      total_income,
      section_80c_used,
      section_80c_capacity_used_pct,
      section_80d_used,
      section_80e_used,
      section_80g_used,
      total_deductions,
      deduction_ratio,
      age,
      age_group,
      is_senior,
      is_metro,
      residential_status,
      income_growth_yoy,
      income_stability_score,
      regime_preference,
      regime_changes_count,
      previous_regime,
      has_house_property,
      house_property_count,
      house_property_income,
      house_property_loss,
      income_concentration,
      audit_risk_flags,
    };
  }

  private static getAgeGroup(age: number): number {
    if (age < 25) return 0;
    if (age < 35) return 1;
    if (age < 50) return 2;
    if (age < 65) return 3;
    return 4;
  }

  private static calculateIncomeStability(incomeHistory: number[]): number {
    if (incomeHistory.length < 2) return 100;

    // Calculate coefficient of variation
    const mean = incomeHistory.reduce((a, b) => a + b, 0) / incomeHistory.length;
    const variance = incomeHistory.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / incomeHistory.length;
    const stdDev = Math.sqrt(variance);

    // Convert to stability score (0-100, higher is more stable)
    const cv = mean === 0 ? 0 : stdDev / mean;
    return Math.max(0, 100 - cv * 100);
  }

  private static calculateIncomeConcentration(incomes: number[]): number {
    const total = incomes.reduce((a, b) => a + b, 0);
    if (total === 0) return 0;

    // Herfindahl-Hirschman Index (HHI)
    const hhi = incomes.reduce((acc, income) => {
      const share = income / total;
      return acc + share * share;
    }, 0);

    // Normalize to 0-1 (0 = perfectly diversified, 1 = completely concentrated)
    return (hhi - 0.25) / 0.75; // 0.25 is min for 4 sources, 1 is max
  }

  private static calculateAuditRiskFlags(profile: TaxProfile): number {
    let flags = 0;

    // Flag: Large deductions relative to income
    const total_income =
      (profile.salary?.grossSalary || 0) +
      (profile.capitalGains?.stcg111A || 0) +
      (profile.capitalGains?.stcgOther || 0) +
      (profile.capitalGains?.ltcg112A || 0) +
      (profile.capitalGains?.ltcgOther || 0) +
      (profile.business?.netIncome || 0) +
      (profile.otherSources?.savingsInterest || 0) +
      (profile.otherSources?.fdInterest || 0) +
      (profile.otherSources?.dividends || 0) +
      (profile.otherSources?.familyPension || 0) +
      (profile.otherSources?.other || 0);

    const total_deductions =
      profile.deductions.section80C +
      (profile.deductions.section80CCD1B || 0) +
      profile.deductions.section80D_selfFamily +
      profile.deductions.section80D_parents +
      profile.deductions.section80E +
      profile.deductions.section80G;

    if (total_income > 0 && total_deductions / total_income > 0.3) flags++;

    // Flag: Multiple income sources (higher complexity = higher audit risk)
    const income_sources = [
      profile.salary?.grossSalary || 0,
      profile.capitalGains?.stcg111A || 0,
      profile.business?.netIncome || 0,
      profile.houseProperties.length > 0 ? 1 : 0,
    ].filter((x) => x > 0).length;

    if (income_sources > 2) flags++;

    // Flag: High capital gains
    const cg = (profile.capitalGains?.stcg111A || 0) + (profile.capitalGains?.stcgOther || 0) + (profile.capitalGains?.ltcg112A || 0) + (profile.capitalGains?.ltcgOther || 0);
    if (cg > total_income * 0.1) flags++;

    // Flag: Business income with presumptive scheme
    if (profile.business?.presumptive) flags++;

    // Flag: NRI status (higher scrutiny)
    if (profile.residentialStatus === "nri") flags++;

    return flags;
  }
}

/**
 * Data normalization and scaling
 */
export class FeatureScaler {
  private mean: Record<string, number> = {};
  private std: Record<string, number> = {};
  private min: Record<string, number> = {};
  private max: Record<string, number> = {};
  private scaler_type: "standard" | "minmax" = "standard";

  constructor(scaler_type: "standard" | "minmax" = "standard") {
    this.scaler_type = scaler_type;
  }

  /**
   * Fit the scaler on training data
   */
  fit(features: TaxpayerFeatures[]): void {
    if (features.length === 0) return;

    const keys = Object.keys(features[0]) as (keyof TaxpayerFeatures)[];

    for (const key of keys) {
      const values = features.map((f) => f[key] as number).filter((v) => !isNaN(v) && v !== null);

      if (this.scaler_type === "standard") {
        this.mean[key] = values.reduce((a, b) => a + b, 0) / values.length;
        this.std[key] = Math.sqrt(values.reduce((acc, val) => acc + Math.pow(val - this.mean[key], 2), 0) / values.length) || 1;
      } else {
        this.min[key] = Math.min(...values);
        this.max[key] = Math.max(...values);
      }
    }
  }

  /**
   * Transform features using fitted scaler
   */
  transform(features: TaxpayerFeatures): TaxpayerFeatures {
    const result = { ...features };
    const keys = Object.keys(features) as (keyof TaxpayerFeatures)[];

    for (const key of keys) {
      const value = features[key] as number;

      if (this.scaler_type === "standard") {
        result[key] = (value - this.mean[key]) / this.std[key];
      } else {
        const range = this.max[key] - this.min[key];
        result[key] = range === 0 ? 0 : (value - this.min[key]) / range;
      }
    }

    return result;
  }

  /**
   * Fit and transform in one step
   */
  fitTransform(features: TaxpayerFeatures[]): TaxpayerFeatures[] {
    this.fit(features);
    return features.map((f) => this.transform(f));
  }

  /**
   * Save scaler parameters for reuse
   */
  getParams(): { scaler_type: string; mean: Record<string, number>; std: Record<string, number>; min: Record<string, number>; max: Record<string, number> } {
    return {
      scaler_type: this.scaler_type,
      mean: this.mean,
      std: this.std,
      min: this.min,
      max: this.max,
    };
  }

  /**
   * Load saved scaler parameters
   */
  loadParams(params: { scaler_type: string; mean: Record<string, number>; std: Record<string, number>; min: Record<string, number>; max: Record<string, number> }): void {
    this.scaler_type = (params.scaler_type as "standard" | "minmax") || "standard";
    this.mean = params.mean;
    this.std = params.std;
    this.min = params.min;
    this.max = params.max;
  }
}

/**
 * Train/test split generator
 */
export class DataSplitter {
  static splitData(data: any[], trainRatio = 0.7, validationRatio = 0.15, shuffle = true): { train: any[]; test: any[]; validation: any[] } {
    let dataToSplit = [...data];

    if (shuffle) {
      // Fisher-Yates shuffle
      for (let i = dataToSplit.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [dataToSplit[i], dataToSplit[j]] = [dataToSplit[j], dataToSplit[i]];
      }
    }

    const trainSize = Math.floor(dataToSplit.length * trainRatio);
    const validationSize = Math.floor(dataToSplit.length * validationRatio);

    const train = dataToSplit.slice(0, trainSize);
    const validation = dataToSplit.slice(trainSize, trainSize + validationSize);
    const test = dataToSplit.slice(trainSize + validationSize);

    return { train, validation, test };
  }

  static stratifiedSplit(data: any[], labelKey: string, trainRatio = 0.7, validationRatio = 0.15): { train: any[]; test: any[]; validation: any[] } {
    // Group by label
    const groups: Record<string, any[]> = {};
    for (const item of data) {
      const label = item[labelKey];
      if (!groups[label]) groups[label] = [];
      groups[label].push(item);
    }

    const train: any[] = [];
    const validation: any[] = [];
    const test: any[] = [];

    // Split each group
    for (const group of Object.values(groups)) {
      const shuffled = [...group].sort(() => Math.random() - 0.5);
      const trainSize = Math.floor(shuffled.length * trainRatio);
      const validationSize = Math.floor(shuffled.length * validationRatio);

      train.push(...shuffled.slice(0, trainSize));
      validation.push(...shuffled.slice(trainSize, trainSize + validationSize));
      test.push(...shuffled.slice(trainSize + validationSize));
    }

    return { train, validation, test };
  }
}
