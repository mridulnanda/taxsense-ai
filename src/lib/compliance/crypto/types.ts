import { z } from 'zod';

// Cryptocurrency Transaction
export const CryptoTransactionSchema = z.object({
  transactionId: z.string().uuid(),
  transactionType: z.enum([
    'PURCHASE',
    'SALE',
    'MINING',
    'STAKING',
    'DEFI_YIELD',
    'EXCHANGE',
    'TRANSFER_IN',
    'TRANSFER_OUT',
    'GIFT_RECEIVED',
    'GIFT_GIVEN',
    'AIRDROP'
  ]),
  cryptoType: z.string(), // e.g., BTC, ETH, USDT
  quantity: z.number().min(0),
  pricePerUnit: z.number().min(0),
  totalAmount: z.number().min(0),
  inrEquivalent: z.number().min(0),
  exchangeUsed: z.string(),
  exchangeRate: z.number().min(0),
  transactionDate: z.string().datetime(),
  walletAddress: z.string().optional(),
  counterpartyName: z.string().optional(),
  transactionFee: z.number().min(0).default(0),
  documentationAvailable: z.boolean().default(true),
});

export type CryptoTransaction = z.infer<typeof CryptoTransactionSchema>;

// Crypto Holding
export const CryptoHoldingSchema = z.object({
  holdingId: z.string().uuid(),
  cryptoType: z.string(),
  quantity: z.number().min(0),
  acquisitionCost: z.number().min(0),
  acquisitionCostPerUnit: z.number().min(0),
  currentMarketPrice: z.number().min(0),
  currentValue: z.number().min(0),
  unrealizedGain: z.number(),
  acquisitionDate: z.string().date(),
  holdingPeriod: z.number().min(0), // Days held
  walletAddress: z.string().optional(),
  exchangeAddress: z.string().optional(),
  costBasisMethod: z.enum(['FIFO', 'LIFO', 'AVERAGE_COST', 'SPECIFIC_IDENTIFICATION']),
});

export type CryptoHolding = z.infer<typeof CryptoHoldingSchema>;

// Crypto Trading Gain/Loss
export const CryptoGainLossSchema = z.object({
  gainLossId: z.string().uuid(),
  panNumber: z.string(),
  assessmentYear: z.number(),
  cryptoType: z.string(),
  acquisitionDate: z.string().date(),
  acquisitionQuantity: z.number().min(0),
  acquisitionCost: z.number().min(0),
  disposalDate: z.string().date(),
  disposalQuantity: z.number().min(0),
  disposalProceeds: z.number().min(0),
  holdingPeriod: z.number().min(0),
  realizedGain: z.number(),
  realizedLoss: z.number(),
  gainType: z.enum(['STCG', 'LTCG']), // > 2 years is LTCG
  applicableSection: z.string(),
  taxRate: z.number().min(0).max(100),
  costInflationIndexation: z.number().min(0).default(0),
  netGainLoss: z.number(),
});

export type CryptoGainLoss = z.infer<typeof CryptoGainLossSchema>;

// Crypto Mining Income
export const CryptoMiningIncomeSchema = z.object({
  miningId: z.string().uuid(),
  panNumber: z.string(),
  assessmentYear: z.number(),
  minerName: z.string(),
  minerAddress: z.string().optional(),
  miningType: z.enum([
    'SOLO_MINING',
    'POOL_MINING',
    'CLOUD_MINING',
    'STAKING',
    'VALIDATOR'
  ]),
  cryptoMined: z.string(),
  quantityMined: z.number().min(0),
  miningDate: z.string().date(),
  fairMarketValueOnReceipt: z.number().min(0),
  incomeTaxableAmount: z.number().min(0),
  poolFees: z.number().min(0).default(0),
  miningEquipmentCost: z.number().min(0).default(0),
  electricityCost: z.number().min(0).default(0),
  allowableDeductions: z.number().min(0).default(0),
  netIncome: z.number(),
  incomeTreatedAs: z.enum(['BUSINESS_INCOME', 'INCOME_FROM_OTHER_SOURCES']),
  applicableSection: z.string(),
  documentationStatus: z.enum(['COMPLETE', 'PARTIAL', 'MISSING']),
});

export type CryptoMiningIncome = z.infer<typeof CryptoMiningIncomeSchema>;

// DeFi / Staking Rewards
export const DeFiStakingRewardsSchema = z.object({
  rewardId: z.string().uuid(),
  panNumber: z.string(),
  assessmentYear: z.number(),
  platformName: z.string(),
  rewardType: z.enum([
    'STAKING_REWARD',
    'LIQUIDITY_MINING',
    'YIELD_FARMING',
    'LENDING_INTEREST',
    'AIRDROP',
    'FORK_REWARD',
    'INCENTIVE'
  ]),
  cryptoType: z.string(),
  quantityReceived: z.number().min(0),
  rewardDate: z.string().date(),
  fairMarketValueOnReceipt: z.number().min(0),
  inrEquivalent: z.number().min(0),
  platformFee: z.number().min(0).default(0),
  incomeRecognitionDate: z.string().date(),
  classifiedAs: z.enum([
    'INCOME_FROM_OTHER_SOURCES',
    'BUSINESS_INCOME',
    'CAPITAL_GAINS'
  ]),
  applicableSection: z.string(),
  documentationAvailable: z.boolean().default(true),
});

export type DeFiStakingRewards = z.infer<typeof DeFiStakingRewardsSchema>;

// Wash Trading Detection
export const WashTradingSchema = z.object({
  detectionId: z.string().uuid(),
  panNumber: z.string(),
  assessmentYear: z.number(),
  cryptoType: z.string(),
  patternDetected: z.enum([
    'RAPID_BUY_SELL',
    'CIRCULAR_TRANSFER',
    'PRICE_MANIPULATION',
    'LOSS_HARVESTING_ABUSE',
    'ROUND_TRIPPING',
    'PUMP_AND_DUMP'
  ]),
  transactionCount: z.number().min(1),
  timeframeDays: z.number().min(1),
  totalVolume: z.number().min(0),
  suspectedLossAmount: z.number().min(0),
  riskRating: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']),
  flaggedForAudit: z.boolean().default(false),
  details: z.array(z.string()),
});

export type WashTrading = z.infer<typeof WashTradingSchema>;

// Crypto Cost Basis Tracking
export const CryptoCostBasisSchema = z.object({
  costBasisId: z.string().uuid(),
  panNumber: z.string(),
  assessmentYear: z.number(),
  cryptoType: z.string(),
  method: z.enum(['FIFO', 'LIFO', 'AVERAGE_COST', 'SPECIFIC_IDENTIFICATION']),
  holdings: z.array(z.object({
    acquisitionDate: z.string().date(),
    quantity: z.number().min(0),
    costPerUnit: z.number().min(0),
    totalCost: z.number().min(0),
    saleDate: z.string().date().optional(),
    saleQuantity: z.number().min(0).optional(),
    gainLoss: z.number().optional(),
  })),
  totalCostBasis: z.number().min(0),
  totalQuantityHeld: z.number().min(0),
  realizedGains: z.number().default(0),
  realizedLosses: z.number().default(0),
  unrealizedGains: z.number().default(0),
});

export type CryptoCostBasis = z.infer<typeof CryptoCostBasisSchema>;

// FEMA Compliance for Crypto
export const CryptoFEMAComplianceSchema = z.object({
  complianceId: z.string().uuid(),
  panNumber: z.string(),
  assessmentYear: z.number(),
  transactionDate: z.string().date(),
  transactionType: z.enum(['INBOUND_REMITTANCE', 'OUTBOUND_REMITTANCE', 'LOCAL_PURCHASE']),
  amountINR: z.number().min(0),
  amountUSD: z.number().min(0).optional(),
  exchangeRate: z.number().min(0),
  purpose: z.string(),
  counterpartyCountry: z.string().optional(),
  authorizedDealerBank: z.string().optional(),
  documentationAvailable: z.boolean().default(false),
  complianceStatus: z.enum(['COMPLIANT', 'NON_COMPLIANT', 'UNDER_REVIEW']),
  violationDetails: z.string().optional(),
  penaltyRisk: z.number().min(0).max(100).default(0),
});

export type CryptoFEMACompliance = z.infer<typeof CryptoFEMAComplianceSchema>;

// Crypto Tax Summary
export const CryptoTaxSummarySchema = z.object({
  summaryId: z.string().uuid(),
  panNumber: z.string(),
  assessmentYear: z.number(),
  totalTransactions: z.number().min(0),
  totalPurchaseCost: z.number().min(0),
  totalSalesProceeds: z.number().min(0),
  realizedCapitalGain: z.number().default(0),
  realizedCapitalLoss: z.number().default(0),
  miningIncome: z.number().min(0).default(0),
  stakingRewardIncome: z.number().min(0).default(0),
  otherIncome: z.number().min(0).default(0),
  totalTaxableIncome: z.number().min(0),
  allowableDeductions: z.number().min(0).default(0),
  netTaxableIncome: z.number().min(0),
  estimatedTaxLiability: z.number().min(0).default(0),
  complianceIssues: z.array(z.string()).default([]),
  auditRiskLevel: z.enum(['LOW', 'MEDIUM', 'HIGH']).default('MEDIUM'),
});

export type CryptoTaxSummary = z.infer<typeof CryptoTaxSummarySchema>;
