import { z } from 'zod';

// Derivatives Contract
export const DerivativeContractSchema = z.object({
  contractId: z.string().uuid(),
  contractType: z.enum(['FUTURES', 'OPTIONS', 'FORWARDS', 'SWAPS']),
  underlying: z.string(), // e.g., 'NIFTY50', 'RELIANCE', 'EURINR'
  strikePrice: z.number().min(0),
  contractSize: z.number().min(1),
  quantity: z.number().min(1),
  openDate: z.string().date(),
  closeDate: z.string().date().optional(),
  status: z.enum(['OPEN', 'CLOSED', 'EXPIRED']),
  exchange: z.enum(['NSE', 'BSE', 'NCDEX', 'ICEX']),
  segment: z.enum(['EQUITY', 'CURRENCY', 'COMMODITY', 'INDEX']),
});

export type DerivativeContract = z.infer<typeof DerivativeContractSchema>;

// Futures/Options Position
export class FuturesOptionPosition {
  contractId: string;
  underlying: string;
  quantity: number;
  entryPrice: number;
  currentPrice: number;
  entryDate: Date;
  exitDate?: Date;
  exitPrice?: number;
  positionType: 'LONG' | 'SHORT';
  premiumPaid?: number; // For options
  premiumReceived?: number; // For options

  constructor(data: {
    contractId: string;
    underlying: string;
    quantity: number;
    entryPrice: number;
    currentPrice: number;
    entryDate: Date;
    positionType: 'LONG' | 'SHORT';
    exitDate?: Date;
    exitPrice?: number;
    premiumPaid?: number;
    premiumReceived?: number;
  }) {
    this.contractId = data.contractId;
    this.underlying = data.underlying;
    this.quantity = data.quantity;
    this.entryPrice = data.entryPrice;
    this.currentPrice = data.currentPrice;
    this.entryDate = data.entryDate;
    this.exitDate = data.exitDate;
    this.exitPrice = data.exitPrice;
    this.positionType = data.positionType;
    this.premiumPaid = data.premiumPaid;
    this.premiumReceived = data.premiumReceived;
  }

  calculateUnrealizedPnL(): number {
    const priceDifference = this.positionType === 'LONG'
      ? this.currentPrice - this.entryPrice
      : this.entryPrice - this.currentPrice;

    return priceDifference * this.quantity;
  }

  calculateRealizedPnL(): number {
    if (!this.exitPrice) return 0;

    const priceDifference = this.positionType === 'LONG'
      ? this.exitPrice - this.entryPrice
      : this.entryPrice - this.exitPrice;

    return priceDifference * this.quantity;
  }

  calculateMarkToMarketValue(): number {
    return this.currentPrice * this.quantity;
  }
}

// Mark-to-Market (MTM) Taxation
export const MarkToMarketSchema = z.object({
  mtmId: z.string().uuid(),
  panNumber: z.string(),
  assessmentYear: z.number(),
  accountingDate: z.string().date(), // March 31 for FY
  positions: z.array(z.object({
    contractId: z.string(),
    underlying: z.string(),
    quantity: z.number(),
    entryPrice: z.number().min(0),
    mtmPrice: z.number().min(0),
    unrealizedGain: z.number(),
    unrealizedLoss: z.number(),
  })),
  totalUnrealizedGain: z.number(),
  totalUnrealizedLoss: z.number(),
  mtmIncome: z.number(), // Net MTM
  applicableSection: z.string(), // Section 43(5), 43(5A), etc.
});

export type MarkToMarket = z.infer<typeof MarkToMarketSchema>;

// Section 37(1) Deduction
export const Section37DeductionSchema = z.object({
  deductionId: z.string().uuid(),
  panNumber: z.string(),
  assessmentYear: z.number(),
  deductionType: z.enum([
    'BROKERAGE',
    'COMMISSION',
    'INTEREST_ON_CAPITAL',
    'TRAVELLING_EXPENSES',
    'PROFESSIONAL_FEES',
    'AUDITOR_FEES',
    'OFFICE_RENT',
    'EMPLOYEE_SALARY',
    'UTILITIES',
    'OTHER'
  ]),
  amount: z.number().min(0),
  description: z.string(),
  documentationStatus: z.enum(['COMPLETE', 'PARTIAL', 'MISSING']),
  allowable: z.boolean().default(true),
  remark: z.string().optional(),
});

export type Section37Deduction = z.infer<typeof Section37DeductionSchema>;

// Cost Inflation Indexation
export const CostInflationIndexationSchema = z.object({
  ciiId: z.string().uuid(),
  acquisitionYear: z.number(),
  acquisitionDate: z.string().date(),
  originalCost: z.number().min(0),
  acquisitionYearCII: z.number().min(0),
  disposalYear: z.number(),
  disposalDate: z.string().date(),
  disposalYearCII: z.number().min(0),
  indexationFactor: z.number().min(0),
  indexedCost: z.number().min(0),
  holdingPeriod: z.number().min(1),
  isLongTermCapitalAsset: z.boolean(),
});

export type CostInflationIndexation = z.infer<typeof CostInflationIndexationSchema>;

// Trading vs Investment Classification
export const TradingInvestmentClassificationSchema = z.object({
  classificationId: z.string().uuid(),
  panNumber: z.string(),
  assessmentYear: z.number(),
  security: z.string(),
  quantity: z.number().min(1),
  acquisitionDate: z.string().date(),
  disposalDate: z.string().date().optional(),
  holdingPeriod: z.number().min(0),
  frequency: z.number().min(0), // Number of similar transactions
  acquisitionCost: z.number().min(0),
  saleProceeds: z.number().min(0).optional(),
  businessActivity: z.boolean(), // Is trading the main business?
  professionalTrader: z.boolean(), // Is person a professional trader?
  profitMotive: z.boolean(), // Clear intention to make profit?
  classification: z.enum(['TRADING_ASSET', 'CAPITAL_ASSET']),
  characterOfGain: z.enum(['INCOME', 'LTCG', 'STCG']),
  applicableSection: z.string(),
});

export type TradingInvestmentClassification = z.infer<typeof TradingInvestmentClassificationSchema>;

// Loss Carry Forward
export const LossCarryForwardSchema = z.object({
  carryForwardId: z.string().uuid(),
  panNumber: z.string(),
  originationYear: z.number(),
  lossType: z.enum([
    'BUSINESS_LOSS',
    'CAPITAL_LOSS',
    'SPECULATION_LOSS',
    'LOSS_UNDER_OTHER_SOURCES'
  ]),
  amount: z.number().min(0),
  availableForCarryForward: z.number().min(0),
  carriedForwardToYear: z.array(z.object({
    assessmentYear: z.number(),
    utilizationAmount: z.number().min(0),
  })),
  expiryYear: z.number(), // Losses expire after certain years
  status: z.enum(['AVAILABLE', 'PARTIALLY_UTILIZED', 'FULLY_UTILIZED', 'EXPIRED']),
  statutoryLimit: z.string(), // e.g., "Can be carried for 8 years"
});

export type LossCarryForward = z.infer<typeof LossCarryForwardSchema>;

// Derivatives P&L Summary
export const DerivativesPnLSummarySchema = z.object({
  summaryId: z.string().uuid(),
  panNumber: z.string(),
  assessmentYear: z.number(),
  tradingPeriod: z.object({
    startDate: z.string().date(),
    endDate: z.string().date(),
  }),
  totalBuyQuantity: z.number().min(0),
  totalSellQuantity: z.number().min(0),
  totalBuyValue: z.number().min(0),
  totalSellValue: z.number().min(0),
  realizedGain: z.number(),
  realizedLoss: z.number(),
  unrealizedGain: z.number(),
  unrealizedLoss: z.number(),
  mtmIncome: z.number(),
  netPnL: z.number(),
  taxableIncome: z.number(),
  taxTreated: z.enum(['BUSINESS_INCOME', 'CAPITAL_GAINS', 'SPECULATION_INCOME']),
  section37Deductions: z.number().min(0).default(0),
  taxAfterDeductions: z.number(),
});

export type DerivativesPnLSummary = z.infer<typeof DerivativesPnLSummarySchema>;
