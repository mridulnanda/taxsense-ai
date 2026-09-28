import {
  ForeignAsset,
  ScheduleFA,
  ForeignBankAccount,
  ForeignProperty,
  ForeignEquityHolding,
  DeemedForeignCompany,
  TransferPricingDocumentation,
  ForeignAssetPenalty,
} from './types';

// Schedule FA Compliance Engine
export class ScheduleFAEngine {
  /**
   * Calculate foreign asset disclosure requirements
   * References: Schedule FA, Form ITR-2, Form ITR-4S
   */
  calculateScheduleFA(assets: ForeignAsset[]): ScheduleFA {
    const totalForeignAssets = assets.reduce((sum, a) => sum + a.inrValue, 0);
    const totalUnrealizedGain = assets.reduce((sum, a) => sum + a.unrealizedGain, 0);

    // Partition assets by part
    const partA = assets.filter(a =>
      ['BANK_ACCOUNT', 'IMMOVABLE_PROPERTY', 'EQUITY_SHARES'].includes(a.assetType)
    );

    const partB: any[] = []; // Disposals would be tracked separately

    return {
      faId: `fa_${Date.now()}`,
      panNumber: '',
      assessmentYear: new Date().getFullYear(),
      filingDeadline: new Date().toISOString(),
      totalForeignAssets,
      totalUnrealizedGain,
      assets,
      schedule: {
        partA: partA.map(a => ({
          assetType: a.assetType,
          country: a.country,
          openingBalance: a.acquisitionCost,
          closingBalance: a.currentFairValue,
          unrealizedGain: a.unrealizedGain,
        })),
        partB: partB,
      },
      disclosureCompleted: false,
      penalties: 0,
    };
  }

  /**
   * Verify Schedule FA compliance thresholds
   * Assets exceeding specified value limits must be disclosed
   */
  verifyDisclosureThreshold(assets: ForeignAsset[]): {
    requiresDisclosure: boolean;
    totalValue: number;
    threshold: number;
    assetsByThreshold: Array<{
      asset: ForeignAsset;
      exceeds: boolean;
    }>;
  } {
    const threshold = 2500000; // 25 lakh INR - statutory disclosure threshold
    const totalValue = assets.reduce((sum, a) => sum + a.inrValue, 0);

    return {
      requiresDisclosure: totalValue > threshold,
      totalValue,
      threshold,
      assetsByThreshold: assets.map(asset => ({
        asset,
        exceeds: asset.inrValue > threshold / 10, // Individual asset threshold
      })),
    };
  }
}

// Foreign Bank Account Engine
export class ForeignBankAccountEngine {
  /**
   * Calculate FBAR (Foreign Bank Account Report) compliance
   * References: FBAR rules, Schedule FA
   */
  calculateFBARCompliance(accounts: ForeignBankAccount[]): {
    totalAccounts: number;
    aggregateBalance: number;
    requiresFBARFiling: boolean;
    fbarThreshold: number;
    accountsByCountry: Map<string, number>;
    reportableAccounts: ForeignBankAccount[];
  } {
    const fbarThreshold = 10000000; // 1 Crore INR threshold
    const aggregateBalance = accounts.reduce((sum, a) => sum + a.inrValue, 0);
    const requiresFBARFiling = aggregateBalance > fbarThreshold;

    // Group by country
    const accountsByCountry = new Map<string, number>();
    accounts.forEach(account => {
      const current = accountsByCountry.get(account.country) || 0;
      accountsByCountry.set(account.country, current + account.inrValue);
    });

    return {
      totalAccounts: accounts.length,
      aggregateBalance,
      requiresFBARFiling,
      fbarThreshold,
      accountsByCountry,
      reportableAccounts: accounts.filter(a => a.inrValue > fbarThreshold / 10),
    };
  }

  /**
   * Calculate taxable income from foreign bank accounts
   * Interest, dividends, and other income earned
   */
  calculateAccountIncome(account: ForeignBankAccount): {
    interestIncome: number;
    exchangeGain: number;
    totalIncome: number;
    taxableIncome: number;
    tdsDeducted: number;
  } {
    // Calculate interest income (example: average balance * interest rate)
    const interestIncome = account.averageBalance * 0.02; // Assumed 2% interest rate

    // Exchange gain/loss on holding currency
    const exchangeGain = 0; // Would be calculated on actual exchange rate changes

    const totalIncome = interestIncome + exchangeGain;
    const tdsRate = account.currency === 'INR' ? 0 : 0.198; // TDS on foreign currency interest

    return {
      interestIncome,
      exchangeGain,
      totalIncome,
      taxableIncome: totalIncome,
      tdsDeducted: totalIncome * tdsRate,
    };
  }
}

// Foreign Property Engine
export class ForeignPropertyEngine {
  /**
   * Calculate taxable income and capital gains from foreign property
   * References: Section 9(1)(iii) - Income from property outside India
   */
  calculatePropertyIncome(property: ForeignProperty): {
    rentalIncome: number;
    allowableDeductions: number;
    netIncome: number;
    capitalGain: number;
    totalTaxableIncome: number;
    breakdown: {
      rental: number;
      maintenance: number;
      tax: number;
      mortgage: number;
      gain: number;
    };
  } {
    const rentalIncome = property.rentalIncome;

    // Allowable deductions
    const maintenanceDeduction = Math.min(property.maintenanceCost, rentalIncome * 0.3);
    const taxDeduction = Math.min(property.propertyTax, rentalIncome * 0.1);
    const mortgageInterestDeduction = Math.min(property.mortgageInterest, rentalIncome * 0.2);

    const allowableDeductions = maintenanceDeduction + taxDeduction + mortgageInterestDeduction;
    const netIncome = Math.max(0, rentalIncome - allowableDeductions);

    // Capital gain calculation
    const capitalGain = property.fairMarketValueINR - property.costOfAcquisitionINR;

    return {
      rentalIncome,
      allowableDeductions,
      netIncome,
      capitalGain,
      totalTaxableIncome: netIncome + capitalGain,
      breakdown: {
        rental: rentalIncome,
        maintenance: maintenanceDeduction,
        tax: taxDeduction,
        mortgage: mortgageInterestDeduction,
        gain: capitalGain,
      },
    };
  }

  /**
   * Apply Cost Inflation Index (CII) to long-term capital gains
   * References: Section 48 - CII indexation
   */
  applyCapitalIndexation(property: ForeignProperty, ciiCurrentYear: number, ciiAcquisitionYear: number): {
    originalCost: number;
    indexedCost: number;
    capitalGain: number;
    indexationBenefit: number;
  } {
    const originalCost = property.costOfAcquisitionINR;
    const indexationFactor = ciiCurrentYear / ciiAcquisitionYear;
    const indexedCost = originalCost * indexationFactor;
    const capitalGain = Math.max(0, property.fairMarketValueINR - indexedCost);
    const indexationBenefit = indexedCost - originalCost;

    return {
      originalCost,
      indexedCost,
      capitalGain,
      indexationBenefit,
    };
  }
}

// Foreign Equity Holdings Engine
export class ForeignEquityHoldingEngine {
  /**
   * Calculate taxable income from foreign equity holdings
   * References: Section 9(1)(v) - Dividend income
   */
  calculateEquityIncome(holding: ForeignEquityHolding): {
    dividendIncome: number;
    capitalGain: number;
    totalIncome: number;
    taxRate: number;
    taxOnDividend: number;
  } {
    const dividendIncome = holding.dividendReceived;
    const capitalGain = holding.capitalGain;

    // Tax rate on foreign dividend (Section 56, 115A)
    let taxRate = 0.25; // 25% on foreign dividend (as of FY 2025-26)
    if (holding.gainType === 'LTCG') {
      taxRate = 0.20; // 20% on LTCG with indexation
    }

    const taxOnDividend = dividendIncome * taxRate;
    const totalIncome = dividendIncome + capitalGain;

    return {
      dividendIncome,
      capitalGain,
      totalIncome,
      taxRate: taxRate * 100,
      taxOnDividend,
    };
  }

  /**
   * Determine if foreign company is deemed to be controlled from India
   * References: Section 9(1)(i) - Control and management test
   */
  isDeemedForeignCompany(holding: ForeignEquityHolding, controlInIndia: boolean): {
    isDeemedForeign: boolean;
    reasoning: string[];
    applicableSection: string;
    incomeSourced: string;
  } {
    const reasoning: string[] = [];

    // Test 1: Control and management location
    if (controlInIndia && holding.controlPercentage > 50) {
      reasoning.push(`Control (${holding.controlPercentage}%) exercised from India`);
    }

    // Test 2: Substantial business activity
    if (controlInIndia) {
      reasoning.push('Substantial business activity managed from India');
    }

    const isDeemedForeign = controlInIndia && holding.controlPercentage > 50;

    return {
      isDeemedForeign,
      reasoning,
      applicableSection: '9(1)(i)',
      incomeSourced: isDeemedForeign ? 'INDIAN_SOURCED' : 'FOREIGN_SOURCED',
    };
  }
}

// Transfer Pricing Engine
export class TransferPricingEngine {
  /**
   * Determine arm's length price for related party transactions
   * References: Chapter X (Transfer Pricing), Rule 1B
   */
  calculateArmLengthPrice(tp: TransferPricingDocumentation): {
    priceRange: {
      minimum: number;
      maximum: number;
      midpoint: number;
    };
    isCompliant: boolean;
    adjustment: number;
    adjustedPrice: number;
  } {
    const minimum = tp.priceRange.minimum;
    const maximum = tp.priceRange.maximum;
    const midpoint = (minimum + maximum) / 2;

    // Check if transaction price falls within range
    const isCompliant = tp.transactionAmount >= minimum && tp.transactionAmount <= maximum;

    // If not compliant, calculate adjustment
    const adjustment = isCompliant ? 0 :
      (tp.transactionAmount < minimum ? minimum - tp.transactionAmount :
       tp.transactionAmount - maximum);

    const adjustedPrice = isCompliant ? tp.transactionAmount : midpoint;

    return {
      priceRange: {
        minimum,
        maximum,
        midpoint,
      },
      isCompliant,
      adjustment,
      adjustedPrice,
    };
  }

  /**
   * Verify transfer pricing documentation completeness
   */
  verifyTPDocumentation(tp: TransferPricingDocumentation): {
    isComplete: boolean;
    missingDocuments: string[];
    penalties: number;
    riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  } {
    const missingDocuments: string[] = [];

    if (!tp.functionalAnalysis) {
      missingDocuments.push('Functional Analysis');
    }
    if (!tp.economicAnalysis) {
      missingDocuments.push('Economic Analysis');
    }
    if (!tp.documentationComplete) {
      missingDocuments.push('Supporting Documentation');
    }

    const isComplete = missingDocuments.length === 0;

    // Penalties for non-compliance
    let penalties = 0;
    if (!isComplete) {
      penalties = tp.inrAmount * 0.05; // 5% of transaction value
    }
    if (!tp.armLengthPrice) {
      penalties += tp.inrAmount * 0.10; // Additional 10% if price adjustment required
    }

    const riskLevel = missingDocuments.length === 0 ? 'LOW' :
                      missingDocuments.length <= 2 ? 'MEDIUM' : 'HIGH';

    return {
      isComplete,
      missingDocuments,
      penalties,
      riskLevel,
    };
  }
}

// Foreign Asset Penalty Engine
export class ForeignAssetPenaltyEngine {
  /**
   * Calculate penalties for non-disclosure of foreign assets
   * References: Section 271 (Penalty for false statement), Section 271AAB (Penalty for inadequate disclosure)
   */
  calculatePenalty(violation: ForeignAssetPenalty): {
    baseAmount: number;
    penaltyRate: number;
    penaltyAmount: number;
    totalConsequence: number;
    interestApplicable: number;
    legalAction: string;
  } {
    const baseAmount = violation.undisclosedValue;
    let penaltyRate = 0;
    let legalAction = 'Notice under Section 276';

    switch (violation.violationType) {
      case 'NON_DISCLOSURE':
        penaltyRate = 0.50; // 50% of undisclosed value
        legalAction = 'Action under Section 271AAB';
        break;
      case 'LATE_DISCLOSURE':
        penaltyRate = 0.30; // 30% for late disclosure
        legalAction = 'Show cause notice';
        break;
      case 'INCOMPLETE_DISCLOSURE':
        penaltyRate = 0.25; // 25% for incomplete info
        legalAction = 'Demand notice';
        break;
      case 'FALSE_STATEMENT':
        penaltyRate = 1.00; // 100% for false statement
        legalAction = 'Criminal proceedings';
        break;
      case 'TRANSFER_PRICING_VIOLATION':
        penaltyRate = 0.20; // 20% for TP violation
        legalAction = 'TP adjustment + penalty';
        break;
    }

    const penaltyAmount = baseAmount * penaltyRate;
    const interestApplicable = penaltyAmount * 0.06; // 6% annual interest
    const totalConsequence = penaltyAmount + interestApplicable;

    return {
      baseAmount,
      penaltyRate: penaltyRate * 100,
      penaltyAmount,
      totalConsequence,
      interestApplicable,
      legalAction,
    };
  }
}
