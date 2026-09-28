import {
  FuturesOptionPosition,
  MarkToMarket,
  TradingInvestmentClassification,
  LossCarryForward,
  DerivativesPnLSummary,
} from './types';

// Derivatives P&L Calculation Engine
export class DerivativesPnLEngine {
  /**
   * Calculate comprehensive P&L for derivatives positions
   * References: Sections 37(1), 43(5), 43(5A), 115A
   */
  calculateDerivativesPnL(positions: FuturesOptionPosition[]): DerivativesPnLSummary {
    let totalRealizedGain = 0;
    let totalRealizedLoss = 0;
    let totalUnrealizedGain = 0;
    let totalUnrealizedLoss = 0;
    let totalBuyValue = 0;
    let totalSellValue = 0;
    let totalBuyQuantity = 0;
    let totalSellQuantity = 0;

    positions.forEach(pos => {
      if (pos.positionType === 'LONG') {
        totalBuyQuantity += pos.quantity;
        totalBuyValue += pos.entryPrice * pos.quantity;
      } else {
        totalSellQuantity += pos.quantity;
        totalSellValue += pos.entryPrice * pos.quantity;
      }

      // Realized P&L
      if (pos.exitPrice) {
        const realizedPnL = pos.calculateRealizedPnL();
        if (realizedPnL > 0) {
          totalRealizedGain += realizedPnL;
        } else {
          totalRealizedLoss += Math.abs(realizedPnL);
        }
      }

      // Unrealized P&L
      const unrealizedPnL = pos.calculateUnrealizedPnL();
      if (unrealizedPnL > 0) {
        totalUnrealizedGain += unrealizedPnL;
      } else {
        totalUnrealizedLoss += Math.abs(unrealizedPnL);
      }
    });

    const netPnL = totalRealizedGain - totalRealizedLoss + totalUnrealizedGain - totalUnrealizedLoss;
    const mtmIncome = totalUnrealizedGain - totalUnrealizedLoss; // MTM on open positions

    return {
      summaryId: `dpnl_${Date.now()}`,
      panNumber: '',
      assessmentYear: new Date().getFullYear(),
      tradingPeriod: {
        startDate: new Date(new Date().getFullYear(), 3, 1).toISOString().split('T')[0],
        endDate: new Date(new Date().getFullYear() + 1, 2, 31).toISOString().split('T')[0],
      },
      totalBuyQuantity,
      totalSellQuantity,
      totalBuyValue,
      totalSellValue,
      realizedGain: totalRealizedGain,
      realizedLoss: totalRealizedLoss,
      unrealizedGain: totalUnrealizedGain,
      unrealizedLoss: totalUnrealizedLoss,
      mtmIncome,
      netPnL,
      taxableIncome: netPnL,
      taxTreated: 'BUSINESS_INCOME',
      taxAfterDeductions: 0,
    };
  }

  /**
   * Calculate average cost of purchase or sale
   */
  calculateAverageCost(positions: FuturesOptionPosition[]): {
    averageBuyCost: number;
    averageSellPrice: number;
    weightedAverageCost: number;
  } {
    const buyPositions = positions.filter(p => p.positionType === 'LONG');
    const sellPositions = positions.filter(p => p.positionType === 'SHORT');

    let totalBuyCost = 0;
    let totalBuyQty = 0;
    buyPositions.forEach(pos => {
      totalBuyCost += pos.entryPrice * pos.quantity;
      totalBuyQty += pos.quantity;
    });

    let totalSellValue = 0;
    let totalSellQty = 0;
    sellPositions.forEach(pos => {
      totalSellValue += pos.entryPrice * pos.quantity;
      totalSellQty += pos.quantity;
    });

    const averageBuyCost = totalBuyQty > 0 ? totalBuyCost / totalBuyQty : 0;
    const averageSellPrice = totalSellQty > 0 ? totalSellValue / totalSellQty : 0;
    const weightedAverageCost = (totalBuyCost + totalSellValue) / (totalBuyQty + totalSellQty);

    return {
      averageBuyCost,
      averageSellPrice,
      weightedAverageCost,
    };
  }
}

// Mark-to-Market (MTM) Engine
export class MarkToMarketEngine {
  /**
   * Calculate MTM taxation on open derivative positions
   * References: Section 43(5) - MTM for futures/options traders
   */
  calculateMTMTaxation(positions: FuturesOptionPosition[], mtmDate: Date): {
    mtmIncome: number;
    mtmLoss: number;
    netMTMIncome: number;
    positionDetails: Array<{
      contractId: string;
      quantity: number;
      entryPrice: number;
      mtmPrice: number;
      unrealizedGain: number;
      unrealizedLoss: number;
    }>;
    section: string;
    applicableTo: string;
  } {
    let totalMTMGain = 0;
    let totalMTMLoss = 0;

    const positionDetails = positions.map(pos => {
      const priceDiff = pos.positionType === 'LONG'
        ? pos.currentPrice - pos.entryPrice
        : pos.entryPrice - pos.currentPrice;

      const unrealizedGain = priceDiff > 0 ? priceDiff * pos.quantity : 0;
      const unrealizedLoss = priceDiff < 0 ? Math.abs(priceDiff) * pos.quantity : 0;

      totalMTMGain += unrealizedGain;
      totalMTMLoss += unrealizedLoss;

      return {
        contractId: pos.contractId,
        quantity: pos.quantity,
        entryPrice: pos.entryPrice,
        mtmPrice: pos.currentPrice,
        unrealizedGain,
        unrealizedLoss,
      };
    });

    const netMTMIncome = totalMTMGain - totalMTMLoss;

    return {
      mtmIncome: totalMTMGain,
      mtmLoss: totalMTMLoss,
      netMTMIncome,
      positionDetails,
      section: '43(5)', // For equity/index futures and options
      applicableTo: 'Deemed traders in derivatives',
    };
  }

  /**
   * Determine if person qualifies for MTM taxation
   * References: Section 43(5) conditions
   */
  qualifiesForMTM(data: {
    tradingTurnover: number;
    numberOfTrades: number;
    tradingLikeABusiness: boolean;
    regulatedExchangeTrading: boolean;
    specTraderCertificate?: boolean;
  }): {
    qualifies: boolean;
    reasons: string[];
    section: string;
    conditions: Array<{
      condition: string;
      satisfied: boolean;
    }>;
  } {
    const conditions = [
      {
        condition: 'Trades on regulated exchange (NSE/BSE)',
        satisfied: data.regulatedExchangeTrading,
      },
      {
        condition: 'Turnover above threshold (typically 25 lakh)',
        satisfied: data.tradingTurnover > 2500000,
      },
      {
        condition: 'Significant number of trades',
        satisfied: data.numberOfTrades > 30,
      },
      {
        condition: 'Trading like a business',
        satisfied: data.tradingLikeABusiness,
      },
    ];

    const reasons: string[] = [];
    conditions.forEach(c => {
      if (c.satisfied) {
        reasons.push(`✓ ${c.condition}`);
      } else {
        reasons.push(`✗ ${c.condition}`);
      }
    });

    const qualifies = conditions.filter(c => c.satisfied).length >= 3;

    return {
      qualifies,
      reasons,
      section: '43(5)',
      conditions,
    };
  }
}

// Section 37(1) Deduction Engine
export class Section37DeductionEngine {
  /**
   * Determine allowable deductions under Section 37(1)
   * References: Section 37(1) - Business expenses
   */
  calculateAllowableDeductions(expenses: Array<{
    category: string;
    amount: number;
    documented: boolean;
  }>): {
    totalClaimed: number;
    totalAllowable: number;
    totalDisallowed: number;
    breakdown: Array<{
      category: string;
      claimed: number;
      allowable: number;
      disallowed: number;
      reason: string;
    }>;
    section: string;
  } {
    const deductionRules: Record<string, { allowable: boolean; limit?: number; rule: string }> = {
      'BROKERAGE': { allowable: true, rule: 'Fully deductible' },
      'COMMISSION': { allowable: true, rule: 'Fully deductible' },
      'INTEREST_ON_CAPITAL': { allowable: true, limit: 0.12, rule: 'Deductible at 12% or actual, whichever is less' },
      'TRAVELLING_EXPENSES': { allowable: true, rule: 'Deductible if business-related' },
      'PROFESSIONAL_FEES': { allowable: true, rule: 'Fully deductible' },
      'AUDITOR_FEES': { allowable: true, rule: 'Fully deductible' },
      'OFFICE_RENT': { allowable: true, rule: 'Fully deductible' },
      'EMPLOYEE_SALARY': { allowable: true, rule: 'Fully deductible' },
      'UTILITIES': { allowable: true, limit: 0.5, rule: 'Partial deduction allowed' },
    };

    let totalClaimed = 0;
    let totalAllowable = 0;
    let totalDisallowed = 0;

    const breakdown = expenses.map(exp => {
      totalClaimed += exp.amount;
      const rule = deductionRules[exp.category] || { allowable: false, rule: 'Not deductible' };

      let allowable = 0;
      let disallowed = 0;

      if (rule.allowable && exp.documented) {
        if (rule.limit) {
          allowable = exp.amount * rule.limit;
          disallowed = exp.amount * (1 - rule.limit);
        } else {
          allowable = exp.amount;
        }
      } else if (!exp.documented) {
        disallowed = exp.amount;
      } else {
        disallowed = exp.amount;
      }

      totalAllowable += allowable;
      totalDisallowed += disallowed;

      return {
        category: exp.category,
        claimed: exp.amount,
        allowable,
        disallowed,
        reason: rule.rule,
      };
    });

    return {
      totalClaimed,
      totalAllowable,
      totalDisallowed,
      breakdown,
      section: '37(1)',
    };
  }
}

// Cost Inflation Indexation (CII) Engine
export class CIIEngine {
  /**
   * Apply Cost Inflation Index to calculate indexed cost
   * References: Section 48 - LTCG calculation
   * CII rates are notified annually by tax department
   */
  calculateIndexedCost(
    originalCost: number,
    acquisitionYearCII: number,
    disposalYearCII: number
  ): {
    originalCost: number;
    indexedCost: number;
    indexationFactor: number;
    indexationBenefit: number;
  } {
    const indexationFactor = disposalYearCII / acquisitionYearCII;
    const indexedCost = originalCost * indexationFactor;
    const indexationBenefit = indexedCost - originalCost;

    return {
      originalCost,
      indexedCost,
      indexationFactor,
      indexationBenefit,
    };
  }

  /**
   * Determine holding period for LTCG
   * References: Section 2(42A) - Long-term capital asset
   * For listed securities: > 12 months
   * For unlisted securities: > 24 months
   */
  determineHoldingPeriod(
    acquisitionDate: Date,
    disposalDate: Date,
    assetType: 'LISTED' | 'UNLISTED'
  ): {
    holdingPeriodDays: number;
    holdingPeriodMonths: number;
    isLongTerm: boolean;
    thresholdDays: number;
  } {
    const thresholdDays = assetType === 'LISTED' ? 365 : 730;
    const holdingPeriodDays = Math.floor(
      (disposalDate.getTime() - acquisitionDate.getTime()) / (1000 * 60 * 60 * 24)
    );
    const holdingPeriodMonths = Math.floor(holdingPeriodDays / 30);
    const isLongTerm = holdingPeriodDays > thresholdDays;

    return {
      holdingPeriodDays,
      holdingPeriodMonths,
      isLongTerm,
      thresholdDays,
    };
  }
}

// Trading vs Investment Classification Engine
export class TradingClassificationEngine {
  /**
   * Classify holding as trading asset or capital asset
   * References: Section 45, Section 94A
   */
  classifyTradingVsInvestment(data: {
    frequency: number; // Number of similar transactions per year
    holdingPeriod: number; // Days held
    professionalTrader: boolean;
    profitMotive: boolean;
    businessActivity: boolean;
  }): TradingInvestmentClassification {
    const reasons: string[] = [];

    // Test 1: Frequency test
    if (data.frequency > 10) {
      reasons.push('High frequency of trading detected');
    } else {
      reasons.push('Low frequency - investment behavior');
    }

    // Test 2: Holding period test
    if (data.holdingPeriod < 90) {
      reasons.push('Very short holding period - trading');
    } else if (data.holdingPeriod > 365) {
      reasons.push('Long holding period - investment');
    }

    // Test 3: Professional trader status
    if (data.professionalTrader) {
      reasons.push('Professional trader - treated as trading');
    }

    // Test 4: Business activity
    if (data.businessActivity) {
      reasons.push('Trading is main business activity');
    }

    // Determine classification
    let isTrading = false;
    if (data.frequency > 10 || data.professionalTrader || data.businessActivity) {
      isTrading = true;
    } else if (data.holdingPeriod > 365 && !data.profitMotive) {
      isTrading = false;
    }

    let characterOfGain: 'INCOME' | 'LTCG' | 'STCG' = 'STCG';
    let applicableSection = '';

    if (isTrading) {
      characterOfGain = 'INCOME';
      applicableSection = '28(1)';
    } else {
      if (data.holdingPeriod > 365) {
        characterOfGain = 'LTCG';
        applicableSection = '112';
      } else {
        characterOfGain = 'STCG';
        applicableSection = '111A';
      }
    }

    return {
      classificationId: `trading_${Date.now()}`,
      panNumber: '',
      assessmentYear: new Date().getFullYear(),
      security: '',
      quantity: 0,
      acquisitionDate: new Date().toISOString().split('T')[0],
      holdingPeriod: data.holdingPeriod,
      frequency: data.frequency,
      acquisitionCost: 0,
      businessActivity: data.businessActivity,
      professionalTrader: data.professionalTrader,
      profitMotive: data.profitMotive,
      classification: isTrading ? 'TRADING_ASSET' : 'CAPITAL_ASSET',
      characterOfGain,
      applicableSection,
    };
  }
}

// Loss Carry Forward Engine
export class LossCarryForwardEngine {
  /**
   * Calculate loss carry forward availability
   * References: Sections 70, 71, 72 - Loss carry forward and setoff
   */
  calculateLossCarryForward(
    lossOriginYear: number,
    lossAmount: number,
    lossType: 'BUSINESS' | 'SPECULATION' | 'CAPITAL'
  ): {
    originYear: number;
    lossAmount: number;
    carryForwardYears: number;
    expiryYear: number;
    availableInYear: number[];
    rule: string;
  } {
    let carryForwardYears = 0;
    let rule = '';

    switch (lossType) {
      case 'BUSINESS':
        carryForwardYears = 8; // Section 72 - 8 years
        rule = 'Business loss can be carried forward for 8 years';
        break;
      case 'SPECULATION':
        carryForwardYears = 4; // Section 73 - 4 years
        rule = 'Speculation loss can be carried forward for 4 years';
        break;
      case 'CAPITAL':
        carryForwardYears = 8; // Section 74 - 8 years
        rule = 'Capital loss can be carried forward for 8 years';
        break;
    }

    const expiryYear = lossOriginYear + carryForwardYears;
    const availableInYear: number[] = [];

    for (let year = lossOriginYear + 1; year <= expiryYear; year++) {
      availableInYear.push(year);
    }

    return {
      originYear: lossOriginYear,
      lossAmount,
      carryForwardYears,
      expiryYear,
      availableInYear,
      rule,
    };
  }

  /**
   * Determine which losses can be set off against which income
   * References: Section 70(5), 71(5), 72(2)
   */
  determineLossSetoff(data: {
    businessLossAvailable: number;
    speculationLossAvailable: number;
    capitalLossAvailable: number;
    businessIncomeCurrentYear: number;
    speculationIncomeCurrentYear: number;
    capitalGainCurrentYear: number;
    otherIncome: number;
  }): {
    businessLossSetoff: number;
    speculationLossSetoff: number;
    capitalLossSetoff: number;
    totalSetoff: number;
    remainingLosses: {
      business: number;
      speculation: number;
      capital: number;
    };
    rules: string[];
  } {
    const rules: string[] = [];

    // Business loss can set off against any income
    let businessLossSetoff = Math.min(data.businessLossAvailable, data.businessIncomeCurrentYear);
    businessLossSetoff += Math.min(
      data.businessLossAvailable - businessLossSetoff,
      data.speculationIncomeCurrentYear + data.capitalGainCurrentYear + data.otherIncome
    );
    rules.push('Business loss sets off against all income');

    // Speculation loss can set off only against speculation income
    let speculationLossSetoff = Math.min(data.speculationLossAvailable, data.speculationIncomeCurrentYear);
    rules.push('Speculation loss sets off only against speculation income');

    // Capital loss can set off only against capital gain (and specific other heads)
    let capitalLossSetoff = Math.min(data.capitalLossAvailable, data.capitalGainCurrentYear);
    rules.push('Capital loss sets off only against capital gains');

    const totalSetoff = businessLossSetoff + speculationLossSetoff + capitalLossSetoff;

    return {
      businessLossSetoff,
      speculationLossSetoff,
      capitalLossSetoff,
      totalSetoff,
      remainingLosses: {
        business: Math.max(0, data.businessLossAvailable - businessLossSetoff),
        speculation: Math.max(0, data.speculationLossAvailable - speculationLossSetoff),
        capital: Math.max(0, data.capitalLossAvailable - capitalLossSetoff),
      },
      rules,
    };
  }
}
