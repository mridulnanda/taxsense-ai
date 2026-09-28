import { z } from 'zod';

// NRI Status Determination
export const NRIStatusSchema = z.object({
  panNumber: z.string(),
  assessmentYear: z.number().min(2000),
  residencyStatus: z.enum(['NRI', 'NRE', 'RESIDENT', 'DEEMED_RESIDENT']),
  daysInIndia: z.number().min(0).max(365),
  substantialEquivalentPresence: z.boolean().default(false), // 120 days in 4 years
  indianIncomeSource: z.boolean().default(false),
  visaType: z.enum(['TOURIST', 'BUSINESS', 'EMPLOYMENT', 'STUDENT', 'PERMANENT_RESIDENT']),
});

export type NRIStatus = z.infer<typeof NRIStatusSchema>;

// Foreign Income Classification (Section 9(1)(i))
export const ForeignIncomeSourceSchema = z.object({
  incomeType: z.enum([
    'SALARY',
    'BUSINESS',
    'CAPITAL_GAINS',
    'DIVIDENDS',
    'INTEREST',
    'ROYALTIES',
    'FOREIGN_PENSIONS',
    'OTHER'
  ]),
  sourceCountry: z.string(),
  grossAmount: z.number().min(0),
  taxPaidAbroad: z.number().min(0).default(0),
  currencyCode: z.string().length(3),
  exchangeRate: z.number().min(0),
  dtaaApplicable: z.boolean().default(false),
  treaties: z.array(z.string()).default([]), // DTAA country pairs
});

export type ForeignIncomeSource = z.infer<typeof ForeignIncomeSourceSchema>;

// DTAA (Double Taxation Avoidance Agreement) Application
export const DTAAClaimSchema = z.object({
  claimId: z.string().uuid(),
  incomeType: z.string(),
  sourceCountry: z.string(),
  residenceCountry: z.string(),
  indiaTaxRate: z.number().min(0).max(100),
  foreignTaxRate: z.number().min(0).max(100),
  grossIncome: z.number().min(0),
  taxCreditEligible: z.boolean().default(true),
  treatyProvisionsApplied: z.array(z.string()),
  foreignTaxPaid: z.number().min(0),
  creditClaimed: z.number().min(0),
  documentedAbroadTax: z.boolean().default(false),
});

export type DTAAClaim = z.infer<typeof DTAAClaimSchema>;

// TDS on Foreign Remittances (Section 194LA, 194LB, etc.)
export const ForeignRemittanceSchema = z.object({
  remittanceId: z.string().uuid(),
  remittanceType: z.enum([
    'SALARY',
    'CONSULTATION_FEES',
    'TRAVEL_ALLOWANCE',
    'PROFESSIONAL_FEES',
    'SPORTS_INCOME',
    'OTHER'
  ]),
  foreignPayerName: z.string(),
  remittanceAmount: z.number().min(0),
  tdsSection: z.string(), // e.g., '194LA', '194LB'
  tdsRate: z.number().min(0).max(100),
  tdsApplicable: z.boolean(),
  tdsDeducted: z.number().min(0),
  certificateReceived: z.boolean().default(false),
  certificateNumber: z.string().optional(),
  countryCode: z.string().length(2),
  receipientPAN: z.string(),
});

export type ForeignRemittance = z.infer<typeof ForeignRemittanceSchema>;

// NRI Bank Account Treatment
export const NRIBankAccountSchema = z.object({
  accountId: z.string().uuid(),
  accountType: z.enum(['NRE', 'NRO', 'FCNR_B', 'RFC']),
  bankName: z.string(),
  accountNumber: z.string(),
  currency: z.string().length(3),
  openingBalance: z.number().default(0),
  closingBalance: z.number().min(0),
  interestEarned: z.number().min(0).default(0),
  tdsOnInterest: z.number().min(0).default(0),
  repatriationAllowed: z.boolean(), // For NRE: Yes, For NRO: Restricted
  repatriationAmount: z.number().min(0).default(0),
  incomeReportingRequired: z.boolean().default(true),
});

export type NRIBankAccount = z.infer<typeof NRIBankAccountSchema>;

// Return of Income Filing
export const NRIReturnOfIncomeSchema = z.object({
  returnId: z.string().uuid(),
  panNumber: z.string(),
  assessmentYear: z.number(),
  filingDeadline: z.string().datetime(),
  totalIndianIncome: z.number().min(0),
  totalForeignIncome: z.number().min(0),
  totalIncome: z.number().min(0),
  taxableIncome: z.number().min(0),
  totalTaxLiability: z.number().min(0),
  foreignTaxCredit: z.number().min(0).default(0),
  netTaxPayable: z.number(),
  advanceTaxPaid: z.number().min(0).default(0),
  tdsDeducted: z.number().min(0).default(0),
  selfAssessmentTax: z.number().min(0).default(0),
  refundDue: z.number().default(0),
  paymentDue: z.number().default(0),
  schedulesAttached: z.array(z.string()),
  certifications: z.array(z.string()),
});

export type NRIReturnOfIncome = z.infer<typeof NRIReturnOfIncomeSchema>;

// Section 9(1)(i) Income Classification Results
export const Section9IncomeClassificationSchema = z.object({
  classificationId: z.string().uuid(),
  incomeAmount: z.number().min(0),
  incomeType: z.string(),
  isIndianSourced: z.boolean(),
  reasoningChain: z.array(z.object({
    rule: z.string(),
    satisfied: z.boolean(),
    explanation: z.string(),
  })),
  classification: z.enum(['INDIAN_SOURCED', 'FOREIGN_SOURCED', 'BOTH']),
  applicableSection: z.string(), // e.g., 9(1)(i), 9(1)(ii), etc.
});

export type Section9IncomeClassification = z.infer<typeof Section9IncomeClassificationSchema>;
