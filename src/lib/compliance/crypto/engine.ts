import {
  CryptoTransaction,
  CryptoHolding,
  CryptoGainLoss,
  CryptoMiningIncome,
  DeFiStakingRewards,
  WashTrading,
  CryptoCostBasis,
  CryptoFEMACompliance,
  CryptoTaxSummary,
} from './types';

// Crypto Trading Gains Calculator
export class CryptoTradingGainsEngine {
  /**
   * Calculate capital gains from crypto trading
   * Gains are taxed as capital gains under Section 45, 48, 112
   * Holding period > 2 years = LTCG (treated as LTCG under Section 112)
   */
  calculateCapitalGain(holding: CryptoHolding, salePrice: number): {
    acquisitionCost: number;
    saleProceeds: number;
    capitalGain: number;
    holdingPeriod: number;
    gainType: 'STCG' | 'LTCG';
    applicableSection: string;
    taxRate: number;
  } {
    const saleProceeds = salePrice * holding.quantity;
    const capitalGain = saleProceeds - holding.acquisitionCost;

    // LTCG if held for > 2 years (730 days)
    const isLongTerm = holding.holdingPeriod > 730;
    const gainType = isLongTerm ? 'LTCG' : 'STCG';

    let applicableSection = '';
    let taxRate = 0;

    if (gainType === 'LTCG') {
      applicableSection = '112A'; // 20% flat + 4% cess on LTCG (no indexation for crypto)
      taxRate = 20.8; // 20% + 4% cess
    } else {
      applicableSection = '111A'; // STCG taxed at applicable slab (30% + cess for highest bracket)
      taxRate = 30;
    }

    return {
      acquisitionCost: holding.acquisitionCost,
      saleProceeds,
      capitalGain,
      holdingPeriod: holding.holdingPeriod,
      gainType,
      applicableSection,
      taxRate,
    };
  }

  /**
   * Calculate realized capital loss
   * Losses can be set off only against capital gains
   * Loss carry forward: 8 years (Section 74)
   */
  calculateCapitalLoss(holding: CryptoHolding, salePrice: number): {
    acquisitionCost: number;
    saleProceeds: number;
    capitalLoss: number;
    carryForwardYears: number;
    setoffLimitation: string;
  } {
    const saleProceeds = salePrice * holding.quantity;
    const capitalLoss = Math.max(0, holding.acquisitionCost - saleProceeds);

    return {
      acquisitionCost: holding.acquisitionCost,
      saleProceeds,
      capitalLoss,
      carryForwardYears: 8,
      setoffLimitation: 'Can be set off only against capital gains in current or future years',
    };
  }
}

// Crypto Mining Income Calculator
export class CryptoMiningIncomeEngine {
  /**
   * Calculate taxable mining income
   * Mining income is taxable at FMV on date of receipt (not date of mining)
   * References: Section 28(1)(a), Section 117 (Presumptive Income scheme)
   */
  calculateMiningIncome(miningData: CryptoMiningIncome): {
    grossMiningIncome: number;
    deductibleExpenses: number;
    netMiningIncome: number;
    applicableSection: string;
    taxTreatedAs: string;
    remarks: string;
  } {
    const grossMiningIncome = miningData.incomeTaxableAmount;

    // Calculate allowable deductions
    const electricityDeduction = Math.min(miningData.electricityCost, grossMiningIncome * 0.5);
    const equipmentDepreciation = miningData.miningEquipmentCost * 0.15; // Depreciation @ 15% on mining equipment
    const otherDeductions = miningData.poolFees; // Pool fees are deductible

    const deductibleExpenses = electricityDeduction + equipmentDepreciation + otherDeductions;
    const netMiningIncome = Math.max(0, grossMiningIncome - deductibleExpenses);

    return {
      grossMiningIncome,
      deductibleExpenses,
      netMiningIncome,
      applicableSection: '28(1)(a)',
      taxTreatedAs: 'Business Income',
      remarks: 'Mining income is taxable as business income at FMV on receipt date',
    };
  }

  /**
   * Determine if mining qualifies as "Presumptive Income Scheme"
   * Section 117 allows deemed income calculation
   * Applicable if gross mining income > threshold
   */
  qualifiesForPresumptiveIncome(grossMiningIncome: number, grossReceipts: number): {
    qualifies: boolean;
    deemedIncomeRate: number;
    minimumDeemedIncome: number;
    advantages: string[];
  } {
    const threshold = 5000000; // 50 lakh INR threshold
    const qualifies = grossReceipts > threshold;
    const deemedIncomeRate = 0.44; // 44% deemed income (applicable to similar business)
    const minimumDeemedIncome = grossReceipts * deemedIncomeRate;

    const advantages = qualifies
      ? [
        'Can opt for deemed income (50% of turnover as profit)',
        'Reduced compliance burden',
        'No profit/loss adjustment required',
        'Applicable if turnover > 50 lakh',
      ]
      : ['Below threshold - full income and expense accounting required'];

    return {
      qualifies,
      deemedIncomeRate,
      minimumDeemedIncome,
      advantages,
    };
  }
}

// Staking & DeFi Rewards Income Calculator
export class StakingRewardsEngine {
  /**
   * Calculate taxable income from staking/DeFi rewards
   * Income recognized at FMV on receipt date (not redemption date)
   * References: Section 56 (Income from other sources)
   */
  calculateStakingIncome(reward: DeFiStakingRewards): {
    grossIncomeRecognized: number;
    incomeRecognitionDate: string;
    fairMarketValueOnDate: number;
    applicable Section: string;
    taxableAmount: number;
    remarks: string;
  } {
    // For staking rewards, income is recognized at FMV on receipt
    const grossIncomeRecognized = reward.inrEquivalent;
    const fairMarketValueOnDate = reward.fairMarketValueOnReceipt;

    return {
      grossIncomeRecognized,
      incomeRecognitionDate: reward.incomeRecognitionDate,
      fairMarketValueOnDate,
      applicableSection: '56(2)(x)', // Income from other sources
      taxableAmount: grossIncomeRecognized,
      remarks: 'Staking rewards are taxed as income from other sources at FMV on receipt',
    };
  }

  /**
   * Calculate DeFi yield farming tax treatment
   * Can be treated as:
   * 1. Business Income (if daily farming activity)
   * 2. Income from Other Sources (if passive holding)
   */
  classifyDeFiIncome(data: {
    dailyFarmingActivity: boolean;
    numberOfFarmingPositions: number;
    annualRewardAmount: number;
    equipmentInvestment: number;
    timeInvested: string; // hours per day
  }): {
    classification: 'BUSINESS_INCOME' | 'OTHER_SOURCES';
    applicableSection: string;
    taxRate: number;
    deductibilityOfExpenses: boolean;
    remarks: string[];
  } {
    const remarks: string[] = [];
    let classification: 'BUSINESS_INCOME' | 'OTHER_SOURCES' = 'OTHER_SOURCES';
    let applicableSection = '56(2)(x)';
    let deductibilityOfExpenses = false;

    if (data.dailyFarmingActivity && data.numberOfFarmingPositions > 5 && data.equipmentInvestment > 500000) {
      classification = 'BUSINESS_INCOME';
      applicableSection = '28(1)(a)';
      deductibilityOfExpenses = true;
      remarks.push('Active DeFi farming with significant setup - treat as business');
    } else {
      classification = 'OTHER_SOURCES';
      remarks.push('Passive staking/farming - income from other sources');
      remarks.push('Deductions limited to specified expenses only');
    }

    return {
      classification,
      applicableSection,
      taxRate: classification === 'BUSINESS_INCOME' ? 30 : 30,
      deductibilityOfExpenses,
      remarks,
    };
  }
}

// Crypto Cost Basis Engine
export class CryptoCostBasisEngine {
  /**
   * Calculate cost basis using specified method (FIFO, LIFO, Avg Cost, Specific ID)
   * References: Rule 37K - Cost Basis Determination
   */
  calculateCostBasis(
    holdings: Array<{ date: Date; quantity: number; cost: number }>,
    disposalQuantity: number,
    method: 'FIFO' | 'LIFO' | 'AVERAGE_COST' | 'SPECIFIC_IDENTIFICATION'
  ): {
    costBasis: number;
    quantityMatched: number;
    averageCostPerUnit: number;
    method: string;
  } {
    let costBasis = 0;
    let quantityMatched = 0;
    let holdingsToUse: Array<{ date: Date; quantity: number; cost: number }> = [];

    switch (method) {
      case 'FIFO':
        // First-In, First-Out - oldest holdings first
        const sortedByDate = [...holdings].sort((a, b) => a.date.getTime() - b.date.getTime());
        holdingsToUse = this.matchQuantity(sortedByDate, disposalQuantity);
        break;

      case 'LIFO':
        // Last-In, First-Out - newest holdings first
        const sortedByDateDesc = [...holdings].sort((a, b) => b.date.getTime() - a.date.getTime());
        holdingsToUse = this.matchQuantity(sortedByDateDesc, disposalQuantity);
        break;

      case 'AVERAGE_COST':
        // Average cost of all holdings
        const totalCost = holdings.reduce((sum, h) => sum + h.cost, 0);
        const totalQuantity = holdings.reduce((sum, h) => sum + h.quantity, 0);
        const avgCostPerUnit = totalQuantity > 0 ? totalCost / totalQuantity : 0;
        costBasis = avgCostPerUnit * disposalQuantity;
        quantityMatched = Math.min(disposalQuantity, totalQuantity);
        holdingsToUse = holdings;
        break;

      case 'SPECIFIC_IDENTIFICATION':
        // Must specify which lot to use - for simplicity, assume FIFO
        holdingsToUse = this.matchQuantity(
          [...holdings].sort((a, b) => a.date.getTime() - b.date.getTime()),
          disposalQuantity
        );
        break;
    }

    // Calculate total cost basis
    costBasis = holdingsToUse.reduce((sum, h) => sum + h.cost, 0);
    quantityMatched = holdingsToUse.reduce((sum, h) => sum + h.quantity, 0);
    const averageCostPerUnit = quantityMatched > 0 ? costBasis / quantityMatched : 0;

    return {
      costBasis,
      quantityMatched,
      averageCostPerUnit,
      method,
    };
  }

  private matchQuantity(
    holdings: Array<{ date: Date; quantity: number; cost: number }>,
    neededQuantity: number
  ): Array<{ date: Date; quantity: number; cost: number }> {
    const matched = [];
    let remainingQuantity = neededQuantity;

    for (const holding of holdings) {
      if (remainingQuantity <= 0) break;

      const quantityToUse = Math.min(holding.quantity, remainingQuantity);
      const costToUse = (quantityToUse / holding.quantity) * holding.cost;

      matched.push({
        date: holding.date,
        quantity: quantityToUse,
        cost: costToUse,
      });

      remainingQuantity -= quantityToUse;
    }

    return matched;
  }
}

// Wash Trading Detection Engine
export class WashTradingDetectionEngine {
  /**
   * Detect suspicious wash trading patterns
   * Wash trading is economically meaningless trading for tax or other purposes
   */
  detectWashTrading(transactions: CryptoTransaction[]): {
    isWashTrading: boolean;
    riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    detectedPatterns: string[];
    suspectedLossAmount: number;
    recommendations: string[];
  } {
    const detectedPatterns: string[] = [];
    const recommendations: string[] = [];
    let suspectedLossAmount = 0;

    // Pattern 1: Rapid buy-sell at similar prices
    const rapidBuySellPairs = this.findRapidBuySells(transactions);
    if (rapidBuySellPairs.length > 3) {
      detectedPatterns.push('Multiple rapid buy-sell pairs detected');
      recommendations.push('Substantiate business purpose for rapid trading');
      suspectedLossAmount += rapidBuySellPairs.reduce((sum, pair) => sum + pair.loss, 0);
    }

    // Pattern 2: Circular transfers (same amount in and out)
    const circularTransfers = this.findCircularTransfers(transactions);
    if (circularTransfers.length > 2) {
      detectedPatterns.push('Circular transfer pattern detected');
      recommendations.push('Provide documentation for circular transfers');
    }

    // Pattern 3: Loss harvesting followed by immediate repurchase
    const lossHarvesting = this.findLossHarvestingPatterns(transactions);
    if (lossHarvesting.length > 0) {
      detectedPatterns.push(`${lossHarvesting.length} potential loss harvesting transactions`);
      recommendations.push('Ensure 30-day gap rule is followed (if applicable)');
      suspectedLossAmount += lossHarvesting.reduce((sum, pattern) => sum + pattern.loss, 0);
    }

    const riskLevel =
      detectedPatterns.length >= 3 ? 'CRITICAL' :
      detectedPatterns.length === 2 ? 'HIGH' :
      detectedPatterns.length === 1 ? 'MEDIUM' : 'LOW';

    return {
      isWashTrading: detectedPatterns.length > 0,
      riskLevel,
      detectedPatterns,
      suspectedLossAmount,
      recommendations,
    };
  }

  private findRapidBuySells(transactions: CryptoTransaction[]): Array<{ loss: number; days: number }> {
    const buySellPairs: Array<{ loss: number; days: number }> = [];

    // Simplified logic: Find buy followed by sell within 7 days at lower price
    for (let i = 0; i < transactions.length; i++) {
      const buy = transactions[i];
      if (buy.transactionType !== 'PURCHASE') continue;

      for (let j = i + 1; j < Math.min(i + 10, transactions.length); j++) {
        const sell = transactions[j];
        if (sell.transactionType !== 'SALE') continue;

        const daysDiff = Math.floor(
          (new Date(sell.transactionDate).getTime() - new Date(buy.transactionDate).getTime()) / (1000 * 60 * 60 * 24)
        );

        if (daysDiff <= 7 && sell.pricePerUnit < buy.pricePerUnit) {
          const loss = (buy.pricePerUnit - sell.pricePerUnit) * Math.min(buy.quantity, sell.quantity);
          buySellPairs.push({ loss, days: daysDiff });
        }
      }
    }

    return buySellPairs;
  }

  private findCircularTransfers(transactions: CryptoTransaction[]): any[] {
    // Simplified: Find transfers in and out with same amount within short period
    const transfers = transactions.filter(t => ['TRANSFER_IN', 'TRANSFER_OUT'].includes(t.transactionType));
    const circular: any[] = [];

    for (let i = 0; i < transfers.length; i++) {
      for (let j = i + 1; j < transfers.length; j++) {
        if (
          transfers[i].transactionType !== transfers[j].transactionType &&
          Math.abs(transfers[i].inrEquivalent - transfers[j].inrEquivalent) < 100 // Within 100 INR
        ) {
          circular.push({ pair: [i, j] });
        }
      }
    }

    return circular;
  }

  private findLossHarvestingPatterns(transactions: CryptoTransaction[]): Array<{ loss: number }> {
    // Simplified: Find sales at loss followed by purchase within 30 days
    const patterns: Array<{ loss: number }> = [];

    for (let i = 0; i < transactions.length; i++) {
      const sale = transactions[i];
      if (sale.transactionType !== 'SALE') continue;

      // Check if sale is at loss (would need cost basis tracking - simplified here)
      for (let j = i + 1; j < Math.min(i + 20, transactions.length); j++) {
        const purchase = transactions[j];
        if (purchase.transactionType === 'PURCHASE' && purchase.cryptoType === sale.cryptoType) {
          const daysDiff = Math.floor(
            (new Date(purchase.transactionDate).getTime() - new Date(sale.transactionDate).getTime()) / (1000 * 60 * 60 * 24)
          );

          if (daysDiff <= 30) {
            patterns.push({ loss: sale.totalAmount * 0.1 }); // Estimated loss
          }
        }
      }
    }

    return patterns;
  }
}

// Crypto FEMA Compliance Engine
export class CryptoFEMAEngine {
  /**
   * Verify FEMA compliance for international crypto transfers
   * References: FEMA Regulations, 2000
   */
  verifyCryptTransferCompliance(crypto: CryptoFEMACompliance): {
    isCompliant: boolean;
    violationDetails: string;
    riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
    requiredDocumentation: string[];
    remedialActions: string[];
  } {
    const issues: string[] = [];
    const remedialActions: string[] = [];

    // Check documentation
    if (!crypto.documentationAvailable) {
      issues.push('No documentation available for transfer');
      remedialActions.push('Collect bank statement and exchange records');
    }

    // Check authorized dealer involvement
    if (crypto.transactionType === 'OUTBOUND_REMITTANCE' && !crypto.authorizedDealerBank) {
      issues.push('Transfer not through authorized dealer bank');
      remedialActions.push('Ensure outbound transfers through authorized dealer bank only');
    }

    // Check threshold (typically $250K USD)
    const thresholdUSD = 250000;
    if (crypto.amountUSD && crypto.amountUSD > thresholdUSD) {
      issues.push('Transfer amount exceeds normal threshold - enhanced documentation required');
      remedialActions.push('File FEMA Form A with RBI');
    }

    const isCompliant = issues.length === 0;
    const riskLevel = issues.length === 0 ? 'LOW' : issues.length === 1 ? 'MEDIUM' : 'HIGH';

    return {
      isCompliant,
      violationDetails: issues.join('; '),
      riskLevel,
      requiredDocumentation: [
        'Exchange statement',
        'Bank transfer proof',
        'Authorized dealer bank confirmation',
        'Invoice/receipt of underlying transaction',
      ],
      remedialActions,
    };
  }
}

// Crypto Tax Summary Engine
export class CryptoTaxSummaryEngine {
  /**
   * Generate comprehensive crypto tax summary
   */
  generateTaxSummary(data: {
    transactions: CryptoTransaction[];
    miningIncome: number;
    stakingIncome: number;
    capitalGains: number;
    capitalLosses: number;
  }): CryptoTaxSummary {
    const totalTaxableIncome =
      data.miningIncome + data.stakingIncome + Math.max(0, data.capitalGains - data.capitalLosses);

    const estimatedTaxLiability = totalTaxableIncome * 0.30; // 30% slab + 4% cess

    return {
      summaryId: `crypto_summary_${Date.now()}`,
      panNumber: '',
      assessmentYear: new Date().getFullYear(),
      totalTransactions: data.transactions.length,
      totalPurchaseCost: data.transactions
        .filter(t => t.transactionType === 'PURCHASE')
        .reduce((sum, t) => sum + t.totalAmount, 0),
      totalSalesProceeds: data.transactions
        .filter(t => t.transactionType === 'SALE')
        .reduce((sum, t) => sum + t.totalAmount, 0),
      realizedCapitalGain: Math.max(0, data.capitalGains),
      realizedCapitalLoss: Math.max(0, data.capitalLosses),
      miningIncome: data.miningIncome,
      stakingRewardIncome: data.stakingIncome,
      totalTaxableIncome,
      estimatedTaxLiability,
      auditRiskLevel: data.capitalLosses > data.capitalGains * 2 ? 'HIGH' : 'MEDIUM',
    };
  }
}
