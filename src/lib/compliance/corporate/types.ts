import { z } from 'zod';

// Corporate Tax Computation
export const CorporateTaxComputationSchema = z.object({
  computationId: z.string().uuid(),
  panNumber: z.string(),
  companyName: z.string(),
  assessmentYear: z.number(),
  profitBeforeTax: z.number(),
  totalIncome: z.number().min(0),
  taxableIncome: z.number().min(0),
  totalIncomeTax: z.number().min(0),
  surcharge: z.number().min(0).default(0),
  cessOnSurcharge: z.number().min(0).default(0),
  totalTaxLiability: z.number().min(0),
  effectiveTaxRate: z.number().min(0).max(100),
  companyCategory: z.enum([
    'DOMESTIC_COMPANY',
    'FOREIGN_COMPANY',
    'STARTUP',
    'SPECIAL_STATUS'
  ]),
});

export type CorporateTaxComputation = z.infer<typeof CorporateTaxComputationSchema>;

// Corporate Deductions (Chapters VI-A)
export const CorporateDeductionSchema = z.object({
  deductionId: z.string().uuid(),
  panNumber: z.string(),
  assessmentYear: z.number(),
  deductionType: z.enum([
    'SECTION_80G', // Donations to charitable trusts
    'SECTION_80GGA', // Scientific/medical research
    'SECTION_80GGAC', // Scientific research by mutual fund
    'SECTION_80GGAA', // Scientific research
    'SECTION_80IA', // Profit from specified business
    'SECTION_80IB', // Industrial undertakings
    'SECTION_80IC', // Undertakings in certain areas
    'SECTION_80ID', // Wastewater treatment
    'SECTION_80IE', // Power generation
    'SECTION_80P', // Cooperatives
    'SECTION_80RRB', // Export of articles
    'OTHER'
  ]),
  amount: z.number().min(0),
  eligibleAmount: z.number().min(0),
  fullyClaimable: z.boolean().default(true),
  section: z.string(),
  conditions: z.array(z.string()),
  documentationStatus: z.enum(['COMPLETE', 'PARTIAL', 'MISSING']),
});

export type CorporateDeduction = z.infer<typeof CorporateDeductionSchema>;

// Dividend Distribution Tax (DDT) / TDS on Dividend
export class DividendTaxation {
  totalDividendDeclared: number;
  surplusAvailable: number;
  ddtRate: number;
  ddtAmount: number;
  tdsRate: number;
  grossDividendToDividendHolders: number;
  netDividendToDividendHolders: number;

  constructor(data: {
    totalDividendDeclared: number;
    surplusAvailable: number;
    ddtRate: number;
    tdsRate: number;
  }) {
    this.totalDividendDeclared = data.totalDividendDeclared;
    this.surplusAvailable = data.surplusAvailable;
    this.ddtRate = data.ddtRate;
    this.tdsRate = data.tdsRate;

    // DDT is tax paid by company on distributed surplus
    this.ddtAmount = this.totalDividendDeclared * (this.ddtRate / 100);

    // TDS is tax deducted while paying to shareholders
    this.grossDividendToDividendHolders = this.totalDividendDeclared;
    this.netDividendToDividendHolders = this.totalDividendDeclared * (1 - this.tdsRate / 100);
  }

  calculateEffectiveTax(): number {
    return this.ddtAmount;
  }

  calculateShareholderTaxImpact(): number {
    return this.grossDividendToDividendHolders - this.netDividendToDividendHolders;
  }
}

// Business Income vs LTCG (Capital Gains)
export const BusinessIncomeVsLTCGSchema = z.object({
  classificationId: z.string().uuid(),
  panNumber: z.string(),
  assessmentYear: z.number(),
  incomeSource: z.string(),
  transactionType: z.enum([
    'PROPERTY_SALE',
    'BUSINESS_ASSET_SALE',
    'REGULAR_TRADING',
    'INFREQUENT_TRADING',
    'SPECULATION',
    'INVESTMENT'
  ]),
  amount: z.number().min(0),
  frequency: z.number().min(0), // Number of similar transactions
  holdingPeriod: z.number().min(0),
  businessActivity: z.boolean(),
  profitMotive: z.boolean(),
  regulatedMarket: z.boolean(),
  classification: z.enum(['BUSINESS_INCOME', 'LTCG', 'STCG']),
  applicableSection: z.string(),
  taxRate: z.number().min(0).max(100),
  detailedReasoning: z.array(z.string()),
});

export type BusinessIncomeVsLTCG = z.infer<typeof BusinessIncomeVsLTCGSchema>;

// Transfer Pricing - Corporate
export const CorporateTransferPricingSchema = z.object({
  tpId: z.string().uuid(),
  panNumber: z.string(),
  assessmentYear: z.number(),
  countryOfRelatedParty: z.string(),
  transactionType: z.enum([
    'INTRA_GROUP_TRANSFER',
    'ROYALTY_PAYMENT',
    'MANAGEMENT_FEES',
    'INTEREST_CHARGE',
    'SERVICES',
    'GOODS',
    'FINANCIAL_TRANSACTION'
  ]),
  transactionAmount: z.number().min(0),
  benchmarkingStudy: z.object({
    method: z.enum(['CUP', 'RESALE_PRICE', 'COST_PLUS', 'PROFIT_SPLIT', 'TNMM']),
    comparableData: z.array(z.object({
      comparable: z.string(),
      price: z.number(),
      margin: z.number(),
    })),
    armLengthRange: z.object({
      minimum: z.number(),
      maximum: z.number(),
    }),
  }),
  transactionPrice: z.number().min(0),
  adjustmentRequired: z.number().default(0),
  incomeAdjustment: z.number().default(0),
  taxImpact: z.number().default(0),
  documentationComplete: z.boolean().default(false),
});

export type CorporateTransferPricing = z.infer<typeof CorporateTransferPricingSchema>;

// Startup Tax Benefits (Section 80IAC)
export const StartupTaxBenefitsSchema = z.object({
  benefitId: z.string().uuid(),
  panNumber: z.string(),
  assessmentYear: z.number(),
  startupRecognitionDate: z.string().date(),
  profitBeforeTax: z.number(),
  eligibleProfit: z.number(),
  exemptionPeriod: z.enum(['YEAR_1_2_3', 'YEAR_4_5', 'YEAR_6_7']),
  exemptionClaimable: z.number().min(0),
  fullyExempt: z.boolean(),
  incubatorApproved: z.boolean(),
  investmentCriteria: z.array(z.string()),
  activeRDD: z.boolean(),
  conditionsMet: z.array(z.string()),
});

export type StartupTaxBenefits = z.infer<typeof StartupTaxBenefitsSchema>;

// Corporate Surcharge Calculation
export const CorporateSurchargeSchema = z.object({
  surchargeId: z.string().uuid(),
  taxableIncome: z.number().min(0),
  baseTax: z.number().min(0),
  surchargeRate: z.number().min(0).max(100),
  surchargeAmount: z.number().min(0),
  surchargeThreshold: z.number().min(0),
  applicableConditions: z.array(z.string()),
});

export type CorporateSurcharge = z.infer<typeof CorporateSurchargeSchema>;

// Dividend Received by Company - Exempt Income
export const DividendReceivedExemptionSchema = z.object({
  exemptionId: z.string().uuid(),
  panNumber: z.string(),
  assessmentYear: z.number(),
  dividendSource: z.enum([
    'DOMESTIC_COMPANY',
    'MUTUAL_FUND',
    'FOREIGN_COMPANY',
    'SPECIFIED_SHARES'
  ]),
  dividendAmount: z.number().min(0),
  sourceCountry: z.string().optional(),
  exemptionAvailable: z.boolean(),
  exemptionAmount: z.number().min(0),
  taxableAmount: z.number().min(0),
  section: z.string(), // Section 10(34) or 10(35)
  conditions: z.array(z.string()),
});

export type DividendReceivedExemption = z.infer<typeof DividendReceivedExemptionSchema>;
