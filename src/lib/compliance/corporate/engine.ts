import {
  CorporateTaxComputation,
  CorporateDeduction,
  DividendTaxation,
  BusinessIncomeVsLTCG,
  CorporateTransferPricing,
  StartupTaxBenefits,
  CorporateSurcharge,
  DividendReceivedExemption,
} from './types';

// Corporate Tax Computation Engine
export class CorporateTaxEngine {
  /**
   * Calculate corporate tax liability for Indian companies
   * Standard rate: 35% (30% + 4% cess) as of FY 2025-26
   * References: Sections 112, 115BAA, etc.
   */
  calculateCorporateTax(data: {
    profitBeforeTax: number;
    taxableIncome: number;
    isDomestic: boolean;
    isStartup: boolean;
    assessmentYear: number;
  }): CorporateTaxComputation {
    let incomeTaxRate = 0.30; // Base rate 30%
    let surchargeRate = 0;
    let companyCategory = data.isDomestic ? 'DOMESTIC_COMPANY' : 'FOREIGN_COMPANY';

    if (data.isStartup && data.assessmentYear - 2015 <= 7) {
      incomeTaxRate = 0.25; // Startup rate: 25%
      companyCategory = 'STARTUP';
    }

    // Surcharge (not applicable if profit < 1 crore usually)
    if (data.taxableIncome > 100000000) {
      surchargeRate = 0.07; // 7% surcharge on cess base if income > 1 crore
    }

    const incomeTax = data.taxableIncome * incomeTaxRate;
    const cess = (incomeTax + (incomeTax * surchargeRate)) * 0.04; // 4% cess
    const surcharge = incomeTax * surchargeRate;
    const cessOnSurcharge = surcharge * 0.04;

    const totalTaxLiability = incomeTax + surcharge + cess + cessOnSurcharge;
    const effectiveTaxRate = data.taxableIncome > 0
      ? (totalTaxLiability / data.taxableIncome) * 100
      : 0;

    return {
      computationId: `corp_tax_${Date.now()}`,
      panNumber: '',
      companyName: '',
      assessmentYear: data.assessmentYear,
      profitBeforeTax: data.profitBeforeTax,
      totalIncome: data.taxableIncome,
      taxableIncome: data.taxableIncome,
      totalIncomeTax: incomeTax,
      surcharge,
      cessOnSurcharge,
      totalTaxLiability,
      effectiveTaxRate,
      companyCategory,
    };
  }

  /**
   * Calculate Book Profit for MAT (Minimum Alternate Tax)
   * References: Section 115JB - Applicable if book profit > tax liability
   */
  calculateMAT(data: {
    bookProfit: number;
    incomeTaxLiability: number;
    carryForwardLossFromPreviousYear: number;
  }): {
    bookProfit: number;
    matRate: number;
    matAmount: number;
    taxLiability: number;
    matCredit: number;
  } {
    const matRate = 0.15; // 15% MAT
    const matAmount = data.bookProfit * matRate;
    const matCredit = Math.max(0, matAmount - data.incomeTaxLiability);

    return {
      bookProfit: data.bookProfit,
      matRate: matRate * 100,
      matAmount,
      taxLiability: Math.max(data.incomeTaxLiability, matAmount),
      matCredit, // Can be carried forward for 15 years
    };
  }
}

// Corporate Deductions Engine
export class CorporateDeductionsEngine {
  /**
   * Calculate eligible deductions under Chapters VI-A
   * References: Sections 80G, 80IA, 80IB, 80IC, 80ID, 80IE, etc.
   */
  calculateDeduction(deduction: CorporateDeduction): {
    claimedAmount: number;
    eligibleAmount: number;
    disallowedAmount: number;
    remarks: string;
    section: string;
  } {
    const deductionRules: Record<string, {
      percentage: number;
      maxLimit?: number;
      conditions: string[];
    }> = {
      'SECTION_80G': {
        percentage: 100,
        conditions: ['Donation to approved charitable trust', 'Receipted payment'],
      },
      'SECTION_80IA': {
        percentage: 100,
        conditions: ['New business undertaking', 'Profit from specified business'],
      },
      'SECTION_80IB': {
        percentage: 100,
        maxLimit: 10000000,
        conditions: ['Industrial undertaking', 'Manufacturing'],
      },
      'SECTION_80IC': {
        percentage: 100,
        conditions: ['Undertaking in North East', 'Himachal Pradesh', 'Uttarakhand'],
      },
      'SECTION_80ID': {
        percentage: 100,
        maxLimit: 50000000,
        conditions: ['Wastewater treatment', 'Infrastructure development'],
      },
      'SECTION_80IE': {
        percentage: 100,
        maxLimit: 500000000,
        conditions: ['Power generation', 'Renewable energy'],
      },
    };

    const rule = deductionRules[deduction.section] || {
      percentage: 0,
      conditions: [],
    };

    let eligibleAmount = deduction.amount * (rule.percentage / 100);

    if (rule.maxLimit) {
      eligibleAmount = Math.min(eligibleAmount, rule.maxLimit);
    }

    const disallowedAmount = deduction.amount - eligibleAmount;
    const remarks = deduction.documentationStatus === 'COMPLETE'
      ? 'Fully supported by documentation'
      : 'Partial support - verify documentation';

    return {
      claimedAmount: deduction.amount,
      eligibleAmount,
      disallowedAmount,
      remarks,
      section: deduction.section,
    };
  }
}

// Dividend Taxation Engine
export class DividendTaxationEngine {
  /**
   * Calculate DDT and TDS on dividend distribution
   * Note: DDT abolished from April 1, 2020 (dividends taxed in hands of recipients)
   * References: Section 115O (DDT - historical)
   */
  calculateDividendTax(dividend: DividendTaxation): {
    companyTaxBurden: number;
    shareholderTaxBurden: number;
    totalTaxBurden: number;
    netToShareholders: number;
  } {
    // DDT was tax paid by company (abolished)
    const ddtBurden = dividend.calculateEffectiveTax();

    // TDS on dividend payment (20% on dividend for resident individuals as of FY 2025-26)
    const tdsBurden = dividend.calculateShareholderTaxImpact();

    const totalTaxBurden = ddtBurden + tdsBurden;
    const netToShareholders = dividend.netDividendToDividendHolders;

    return {
      companyTaxBurden: ddtBurden,
      shareholderTaxBurden: tdsBurden,
      totalTaxBurden,
      netToShareholders,
    };
  }

  /**
   * Calculate exempt dividend received by domestic company
   * References: Section 10(34), 10(35)
   */
  calculateDividendExemption(holding: {
    dividendReceived: number;
    percentageOfShares: number;
    sourceDomestic: boolean;
  }): {
    grossDividend: number;
    exemptAmount: number;
    taxableDividend: number;
    section: string;
  } {
    let exemptAmount = 0;
    let section = '';

    // Section 10(34): Dividend from specified companies
    if (holding.sourceDomestic && holding.percentageOfShares >= 0.5) {
      exemptAmount = holding.dividendReceived;
      section = '10(34)';
    }
    // Section 10(35): Foreign company dividends (limited)
    else if (!holding.sourceDomestic) {
      exemptAmount = Math.min(holding.dividendReceived * 0.5, holding.dividendReceived);
      section = '10(35)';
    }

    return {
      grossDividend: holding.dividendReceived,
      exemptAmount,
      taxableDividend: holding.dividendReceived - exemptAmount,
      section,
    };
  }
}

// Business Income vs LTCG Classification Engine
export class BusinessIncomeClassificationEngine {
  /**
   * Determine if income is business income or LTCG
   * Critical for determining applicable tax rate
   */
  classifyIncome(data: {
    transactionType: string;
    frequency: number;
    holdingPeriod: number;
    businessActivity: boolean;
    profitMotive: boolean;
    regulatedMarket: boolean;
  }): BusinessIncomeVsLTCG {
    const factors: Array<{
      factor: string;
      indicatesTrading: boolean;
    }> = [
      {
        factor: `High frequency (${data.frequency} transactions)`,
        indicatesTrading: data.frequency > 10,
      },
      {
        factor: 'Trading is main business',
        indicatesTrading: data.businessActivity,
      },
      {
        factor: 'Clear profit motive',
        indicatesTrading: data.profitMotive,
      },
      {
        factor: 'Trading on regulated exchange',
        indicatesTrading: data.regulatedMarket,
      },
      {
        factor: `Short holding period (${data.holdingPeriod} days)`,
        indicatesTrading: data.holdingPeriod < 365,
      },
    ];

    let isBusinessIncome = false;
    let applicableSection = '';
    let taxRate = 0;

    const tradingFactorsMet = factors.filter(f => f.indicatesTrading).length;

    if (tradingFactorsMet >= 3) {
      isBusinessIncome = true;
      applicableSection = '28(1)';
      taxRate = 30; // Business income taxed at applicable slab
    } else if (data.holdingPeriod > 365) {
      applicableSection = '112';
      taxRate = 20; // LTCG at 20% with indexation
    } else {
      applicableSection = '111A';
      taxRate = 15; // STCG at 15%
    }

    const reasoning = factors
      .filter(f => f.indicatesTrading || (taxRate === 20 && data.holdingPeriod > 365))
      .map(f => f.factor);

    return {
      classificationId: `bivc_${Date.now()}`,
      panNumber: '',
      assessmentYear: new Date().getFullYear(),
      incomeSource: '',
      transactionType: data.transactionType as any,
      amount: 0,
      frequency: data.frequency,
      holdingPeriod: data.holdingPeriod,
      businessActivity: data.businessActivity,
      profitMotive: data.profitMotive,
      regulatedMarket: data.regulatedMarket,
      classification: isBusinessIncome
        ? 'BUSINESS_INCOME'
        : data.holdingPeriod > 365
        ? 'LTCG'
        : 'STCG',
      applicableSection,
      taxRate,
      detailedReasoning: reasoning,
    };
  }
}

// Corporate Transfer Pricing Engine
export class CorporateTPEngine {
  /**
   * Verify arm's length price for related party transactions
   * References: Chapter X (Rule 1B) - Transfer Pricing Documentation
   */
  verifyArmLengthPrice(tp: CorporateTransferPricing): {
    isCompliant: boolean;
    adjustmentRequired: number;
    riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
    documentation: string;
    recommendedAction: string;
  } {
    const { armLengthRange, transactionPrice } = tp.benchmarkingStudy;

    const isWithinRange =
      transactionPrice >= armLengthRange.minimum &&
      transactionPrice <= armLengthRange.maximum;

    let adjustmentRequired = 0;
    if (!isWithinRange) {
      if (transactionPrice < armLengthRange.minimum) {
        adjustmentRequired = armLengthRange.minimum - transactionPrice;
      } else {
        adjustmentRequired = transactionPrice - armLengthRange.maximum;
      }
    }

    let riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' = 'LOW';
    if (!isWithinRange) {
      riskLevel = adjustmentRequired > tp.transactionAmount * 0.1 ? 'HIGH' : 'MEDIUM';
    }

    let documentation = tp.documentationComplete ? 'Complete TP Study on File' : 'Missing TP Documentation';
    let recommendedAction = isWithinRange
      ? 'No adjustment needed - transaction is at arm\'s length'
      : `Adjustment of ${adjustmentRequired} required to comply with arm\'s length principle`;

    return {
      isCompliant: isWithinRange && tp.documentationComplete,
      adjustmentRequired,
      riskLevel,
      documentation,
      recommendedAction,
    };
  }
}

// Startup Tax Benefits Engine
export class StartupTaxBenefitsEngine {
  /**
   * Calculate tax benefit for DPIIT-recognized startups
   * References: Section 80IAC - 100% deduction for 5 years
   */
  calculateStartupBenefit(startup: StartupTaxBenefits): {
    eligibleProfit: number;
    exemptionAmount: number;
    taxableProfit: number;
    taxSavings: number;
    conditions: string[];
  } {
    const conditions: string[] = [];
    let exemptionMultiplier = 1; // 100% exemption

    // Check eligibility conditions
    if (startup.incubatorApproved) {
      conditions.push('✓ Incubator-approved startup');
    }

    if (startup.activeRDD) {
      conditions.push('✓ Active R&D activities');
    }

    // Verify conditions met
    const allConditionsMet = startup.investmentCriteria.length > 0 && startup.activeRDD;

    if (!allConditionsMet) {
      conditions.push('✗ Some conditions not met - verify eligibility');
      exemptionMultiplier = 0;
    }

    const exemptionAmount = startup.eligibleProfit * exemptionMultiplier;
    const taxableProfit = startup.profitBeforeTax - exemptionAmount;
    const taxRate = 0.30; // 30% tax rate
    const taxSavings = exemptionAmount * taxRate;

    return {
      eligibleProfit: startup.eligibleProfit,
      exemptionAmount,
      taxableProfit,
      taxSavings,
      conditions,
    };
  }
}

// Corporate Surcharge Engine
export class CorporateSurchargeEngine {
  /**
   * Calculate surcharge on corporate tax
   * References: Section 110 - Surcharge rates and thresholds
   */
  calculateSurcharge(taxableIncome: number, baseTax: number): CorporateSurcharge {
    let surchargeRate = 0;
    let threshold = 0;
    const applicableConditions: string[] = [];

    // As of FY 2025-26, surcharge rates:
    if (taxableIncome > 100000000) {
      // 1 crore+
      surchargeRate = 0.07; // 7%
      threshold = 100000000;
      applicableConditions.push('Income exceeds Rs. 1 crore');
    } else if (taxableIncome > 50000000) {
      // 50-100 lakh
      surchargeRate = 0.05; // 5%
      threshold = 50000000;
      applicableConditions.push('Income between Rs. 50 lakh and Rs. 1 crore');
    } else if (taxableIncome > 10000000) {
      // 10-50 lakh
      surchargeRate = 0.025; // 2.5%
      threshold = 10000000;
      applicableConditions.push('Income between Rs. 10 lakh and Rs. 50 lakh');
    }

    const surchargeAmount = baseTax * surchargeRate;

    return {
      surchargeId: `surcharge_${Date.now()}`,
      taxableIncome,
      baseTax,
      surchargeRate: surchargeRate * 100,
      surchargeAmount,
      surchargeThreshold: threshold,
      applicableConditions,
    };
  }
}
