import { z } from 'zod';

// Schedule FA (Foreign Assets) Reporting
export const ForeignAssetSchema = z.object({
  assetId: z.string().uuid(),
  assetType: z.enum([
    'BANK_ACCOUNT',
    'IMMOVABLE_PROPERTY',
    'MOVABLE_PROPERTY',
    'EQUITY_SHARES',
    'DEBT_SECURITIES',
    'CRYPTOCURRENCY',
    'LIFE_INSURANCE',
    'PENSION',
    'OTHER'
  ]),
  country: z.string().length(2),
  acquisitionDate: z.string().date(),
  acquisitionCost: z.number().min(0),
  currentFairValue: z.number().min(0),
  currency: z.string().length(3),
  exchangeRate: z.number().min(0),
  unrealizedGain: z.number(),
  inrValue: z.number().min(0),
  reportingStatus: z.enum(['DISCLOSED', 'UNDISCLOSED', 'EXEMPTED']),
  violationRisk: z.boolean().default(false),
});

export type ForeignAsset = z.infer<typeof ForeignAssetSchema>;

// Schedule FA Filing
export const ScheduleFASchema = z.object({
  faId: z.string().uuid(),
  panNumber: z.string(),
  assessmentYear: z.number(),
  filingDeadline: z.string().datetime(),
  totalForeignAssets: z.number().min(0),
  totalUnrealizedGain: z.number(),
  assets: z.array(ForeignAssetSchema),
  schedule: z.object({
    partA: z.array(z.object({
      assetType: z.string(),
      country: z.string(),
      openingBalance: z.number(),
      additions: z.number().default(0),
      closingBalance: z.number(),
      unrealizedGain: z.number(),
    })),
    partB: z.array(z.object({
      disposalDate: z.string().date(),
      assetType: z.string(),
      costOfAcquisition: z.number(),
      saleProceeds: z.number(),
      gainLoss: z.number(),
    })),
  }),
  disclosureCompleted: z.boolean().default(false),
  penalties: z.number().min(0).default(0),
});

export type ScheduleFA = z.infer<typeof ScheduleFASchema>;

// Foreign Bank Accounts (FBAR / Schedule FA Part)
export const ForeignBankAccountSchema = z.object({
  accountId: z.string().uuid(),
  bankName: z.string(),
  bankAddress: z.string(),
  country: z.string().length(2),
  accountNumber: z.string(),
  currency: z.string().length(3),
  accountType: z.enum(['SAVINGS', 'CURRENT', 'DEPOSIT', 'OTHER']),
  openingBalance: z.number().min(0),
  closingBalance: z.number().min(0),
  maxBalance: z.number().min(0),
  averageBalance: z.number().min(0),
  accountHolderName: z.string(),
  accountHolderType: z.enum(['INDIVIDUAL', 'JOINT', 'TRUST', 'HUF']),
  inrValue: z.number().min(0),
  tdsOnInterest: z.number().min(0).default(0),
  remittanceAmount: z.number().min(0).default(0),
});

export type ForeignBankAccount = z.infer<typeof ForeignBankAccountSchema>;

// Immovable Property Abroad
export const ForeignPropertySchema = z.object({
  propertyId: z.string().uuid(),
  propertyType: z.enum(['RESIDENTIAL', 'COMMERCIAL', 'AGRICULTURAL', 'INDUSTRIAL']),
  country: z.string().length(2),
  address: z.string(),
  acquisitionDate: z.string().date(),
  acquisitionCost: z.number().min(0),
  costInflationIndexation: z.number().min(0).default(0),
  costOfAcquisitionINR: z.number().min(0),
  fairMarketValue: z.number().min(0),
  fairMarketValueINR: z.number().min(0),
  currency: z.string().length(3),
  exchangeRate: z.number().min(0),
  rentalIncome: z.number().min(0).default(0),
  maintenanceCost: z.number().min(0).default(0),
  propertyTax: z.number().min(0).default(0),
  netIncome: z.number().default(0),
  outstandingMortgage: z.number().min(0).default(0),
  mortgageInterest: z.number().min(0).default(0),
  capitalGain: z.number().default(0),
  gainType: z.enum(['STCG', 'LTCG']).default('STCG'),
  documentationStatus: z.enum(['COMPLETE', 'PARTIAL', 'MISSING']),
});

export type ForeignProperty = z.infer<typeof ForeignPropertySchema>;

// Foreign Equity Holdings
export const ForeignEquityHoldingSchema = z.object({
  holdingId: z.string().uuid(),
  companyName: z.string(),
  country: z.string().length(2),
  isin: z.string().optional(),
  companyRegistration: z.string(),
  equityType: z.enum(['ORDINARY_SHARES', 'PREFERENCE_SHARES', 'DEBENTURES', 'WARRANTS']),
  acquisitionDate: z.string().date(),
  quantityAcquired: z.number().min(0),
  costPerUnit: z.number().min(0),
  totalCost: z.number().min(0),
  currency: z.string().length(3),
  currentMarketPrice: z.number().min(0),
  currentQuantity: z.number().min(0),
  currentValue: z.number().min(0),
  exchangeRate: z.number().min(0),
  inrValue: z.number().min(0),
  dividendReceived: z.number().min(0).default(0),
  dividendTaxed: z.number().min(0).default(0),
  capitalGain: z.number().default(0),
  gainType: z.enum(['STCG', 'LTCG']),
  controlPercentage: z.number().min(0).max(100),
  isDeemedCompany: z.boolean().default(false), // Section 9(1)(i)
});

export type ForeignEquityHolding = z.infer<typeof ForeignEquityHoldingSchema>;

// Deemed Foreign Company Shares (Section 9(1)(i))
export const DeemedForeignCompanySchema = z.object({
  holdingId: z.string().uuid(),
  companyName: z.string(),
  jurisdiction: z.string(),
  shareType: z.string(),
  totalCapital: z.number().min(0),
  shareholdingPercentage: z.number().min(0).max(100),
  holdingIndividual: z.string(),
  controlCriteriaMetInIndia: z.boolean(),
  reasonForDeeming: z.string(),
  dividendPaid: z.number().min(0).default(0),
  capitalGain: z.number().default(0),
  incomeTaxableSection: z.string(), // Section reference
  specialRules: z.array(z.string()),
});

export type DeemedForeignCompany = z.infer<typeof DeemedForeignCompanySchema>;

// Transfer Pricing Documentation
export const TransferPricingDocumentationSchema = z.object({
  tpDocId: z.string().uuid(),
  panNumber: z.string(),
  assessmentYear: z.number(),
  transactionType: z.enum([
    'INTRA_COMPANY_TRANSFER',
    'ROYALTY',
    'MANAGEMENT_FEES',
    'INTEREST',
    'SERVICES',
    'GOODS_TRANSFER',
    'FINANCIAL_TRANSACTION'
  ]),
  relatedParty: z.object({
    name: z.string(),
    country: z.string(),
    jurisdiction: z.string(),
    relationshipType: z.string(),
  }),
  transactionAmount: z.number().min(0),
  currency: z.string().length(3),
  inrAmount: z.number().min(0),
  priceAdjustment: z.number().default(0),
  benchmarkingMethod: z.enum([
    'CUP',  // Comparable Uncontrolled Price
    'RESALE_PRICE',
    'COST_PLUS',
    'PROFIT_SPLIT',
    'TRANSACTIONAL_NET_MARGIN'
  ]),
  armLengthPrice: z.number().min(0),
  priceRange: z.object({
    minimum: z.number().min(0),
    maximum: z.number().min(0),
  }),
  functionalAnalysis: z.string(),
  economicAnalysis: z.string(),
  complianceStatus: z.enum(['COMPLIANT', 'ADJUSTMENT_REQUIRED', 'NON_COMPLIANT']),
  documentationComplete: z.boolean().default(false),
  penalties: z.number().min(0).default(0),
});

export type TransferPricingDocumentation = z.infer<typeof TransferPricingDocumentationSchema>;

// Foreign Asset Penalty Calculation
export const ForeignAssetPenaltySchema = z.object({
  penaltyId: z.string().uuid(),
  panNumber: z.string(),
  assetId: z.string().uuid(),
  violationType: z.enum([
    'NON_DISCLOSURE',
    'LATE_DISCLOSURE',
    'INCOMPLETE_DISCLOSURE',
    'FALSE_STATEMENT',
    'TRANSFER_PRICING_VIOLATION'
  ]),
  undisclosedValue: z.number().min(0),
  penaltyRate: z.number().min(0).max(100),
  penaltyAmount: z.number().min(0),
  legalConsequence: z.string(),
  remedialAction: z.string().optional(),
});

export type ForeignAssetPenalty = z.infer<typeof ForeignAssetPenaltySchema>;
