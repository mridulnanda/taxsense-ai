/**
 * Cloud Accounting Platform - Core Domain Types
 *
 * Type-safe definitions for all accounting entities aligned with IFRS/GAAP standards.
 * Forms the contract between API, database, and UI layers.
 */

import { z } from "zod";

// ============================================================================
// CHART OF ACCOUNTS
// ============================================================================

export type AccountType =
  | "ASSET"
  | "LIABILITY"
  | "EQUITY"
  | "REVENUE"
  | "EXPENSE"
  | "COST_OF_GOODS_SOLD";

export type AccountCategory =
  | "CURRENT_ASSET" | "FIXED_ASSET" | "INTANGIBLE_ASSET"
  | "CURRENT_LIABILITY" | "LONG_TERM_LIABILITY"
  | "RETAINED_EARNINGS" | "CONTRIBUTED_CAPITAL"
  | "OPERATING_REVENUE" | "OTHER_REVENUE"
  | "OPERATING_EXPENSE" | "ADMINISTRATIVE_EXPENSE" | "OTHER_EXPENSE";

export type CurrencyCode = "USD" | "EUR" | "GBP" | "INR" | "AUD" | "CAD" | "SGD" | "HKD";

export interface ChartOfAccount {
  id: string;
  organizationId: string;
  code: string; // e.g., "1000", "1100-01" - customizable per biz
  name: string;
  description?: string;
  accountType: AccountType;
  category: AccountCategory;
  currencyCode: CurrencyCode;

  // Balance tracking
  parentAccountId?: string; // For hierarchies like 1000 > 1100
  normalBalance: "DEBIT" | "CREDIT"; // Per accounting rules

  // Status & Reconciliation
  isReconciled: boolean;
  lastReconciledAt?: Date;
  bankAccountId?: string; // If linked to bank

  // Metadata
  tags: string[];
  isActive: boolean;
  isArchived: boolean;
  archivedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface Journal {
  id: string;
  organizationId: string;
  referenceNumber: string; // INV-001, EXP-001, etc.
  journalType: "INVOICE" | "EXPENSE" | "TRANSFER" | "ADJUSTMENT" | "BANK_FEED";

  entries: JournalEntry[];

  // Double-entry bookkeeping validation
  totalDebit: number;
  totalCredit: number;
  isBalanced: boolean;

  memo?: string;
  tags: string[];

  // Approval & Status
  status: "DRAFT" | "POSTED" | "LOCKED" | "REVERSED";
  approvedBy?: string;
  approvedAt?: Date;

  postedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface JournalEntry {
  id: string;
  journalId: string;
  accountId: string; // FK to ChartOfAccount

  debit?: number;
  credit?: number;

  description?: string;
  taxLineId?: string; // For tax integration

  createdAt: Date;
}

// ============================================================================
// INVOICING & BILLING
// ============================================================================

export type InvoiceStatus =
  | "DRAFT"
  | "SENT"
  | "VIEWED"
  | "PARTIALLY_PAID"
  | "PAID"
  | "OVERDUE"
  | "CANCELLED"
  | "REFUNDED";

export interface Invoice {
  id: string;
  organizationId: string;
  invoiceNumber: string;

  // Dates
  invoiceDate: Date;
  dueDate: Date;
  sentAt?: Date;
  viewedAt?: Date;
  paidAt?: Date;

  // Customer
  customerId: string;
  customerName: string;
  customerEmail: string;
  customerAddress: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };

  // Billing
  currencyCode: CurrencyCode;
  lineItems: InvoiceLineItem[];

  // Calculations
  subtotal: number;
  taxAmount: number;
  discountAmount: number;
  totalAmount: number;

  // Payment tracking
  amountPaid: number;
  amountDue: number;

  // Metadata
  notes?: string;
  terms?: string;
  memo?: string;
  tags: string[];

  // Integration
  paymentLinks: PaymentLink[];
  attachments: Attachment[];

  // Status & Workflow
  status: InvoiceStatus;
  approvalRequired: boolean;
  approvedBy?: string;
  approvedAt?: Date;

  // References
  linkedJournalId?: string;
  linkedExpenseIds: string[];

  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
}

export interface InvoiceLineItem {
  id: string;
  invoiceId: string;

  description: string;
  quantity: number;
  unitPrice: number;
  taxRate?: number; // Percentage, e.g., 5, 10, 18

  lineTotal: number;
  taxAmount?: number;

  accountId?: string; // Revenue account
  projectId?: string;

  createdAt: Date;
}

export interface PaymentLink {
  id: string;
  invoiceId: string;
  paymentGateway: "STRIPE" | "PAYPAL" | "RAZORPAY" | "SQUARE" | "WISE";
  externalLinkId: string; // Provider's ID
  publicUrl: string;

  status: "ACTIVE" | "EXPIRED" | "COMPLETED" | "CANCELLED";
  expiresAt?: Date;

  createdAt: Date;
  updatedAt: Date;
}

// ============================================================================
// EXPENSE MANAGEMENT
// ============================================================================

export interface Expense {
  id: string;
  organizationId: string;
  referenceNumber: string;

  // Dates
  expenseDate: Date;
  submittedDate: Date;
  approvedDate?: Date;

  // Vendor
  vendorId: string;
  vendorName: string;
  vendorEmail?: string;

  // Details
  description: string;
  category: ExpenseCategory;
  currencyCode: CurrencyCode;
  amount: number;

  // Receipt & Documentation
  receiptUrl?: string;
  receiptOcr?: ReceiptOcrData;
  attachments: Attachment[];

  // Project & Tracking
  projectId?: string;
  departmentId?: string;
  costCenter?: string;
  tags: string[];

  // Tax & Categorization
  taxAmount?: number;
  taxableAmount?: number;
  isTaxDeductible: boolean;
  linkedJournalId?: string;
  accountId?: string;

  // Status & Approval
  status: "DRAFT" | "SUBMITTED" | "APPROVED" | "REJECTED" | "REIMBURSED" | "CANCELLED";
  approvedBy?: string;
  rejectionReason?: string;

  // Reimbursement
  requiresReimbursement: boolean;
  reimbursedAmount?: number;
  reimbursedDate?: Date;
  reimbursedVia?: "BANK_TRANSFER" | "CREDIT_CARD" | "CASH" | "CHECK";

  createdAt: Date;
  updatedAt: Date;
}

export type ExpenseCategory =
  | "MEALS_ENTERTAINMENT"
  | "TRAVEL"
  | "OFFICE_SUPPLIES"
  | "EQUIPMENT"
  | "SOFTWARE"
  | "UTILITIES"
  | "RENT"
  | "INSURANCE"
  | "PROFESSIONAL_SERVICES"
  | "MAINTENANCE"
  | "ADVERTISING"
  | "MILEAGE"
  | "OTHER";

export interface ReceiptOcrData {
  vendorName?: string;
  date?: Date;
  amount?: number;
  currency?: string;
  lineItems?: {
    description: string;
    amount: number;
  }[];
  taxAmount?: number;
  confidence: number; // 0-1
  rawText: string;
}

export interface Mileage {
  id: string;
  organizationId: string;
  employeeId: string;

  startLocation: string;
  endLocation: string;
  startDate: Date;
  endDate: Date;
  distance: number; // in km

  mileageRate: number; // per km
  totalCost: number;

  purpose: string;
  projectId?: string;

  status: "DRAFT" | "SUBMITTED" | "APPROVED" | "REIMBURSED";
  createdAt: Date;
}

// ============================================================================
// BANKING & RECONCILIATION
// ============================================================================

export interface BankAccount {
  id: string;
  organizationId: string;

  bankName: string;
  accountName: string;
  accountNumber: string;
  routingNumber?: string;
  iban?: string;
  swift?: string;
  currencyCode: CurrencyCode;

  // Connection
  connectionProvider: "PLAID" | "OPEN_BANKING" | "API_DIRECT" | "MANUAL";
  externalAccountId?: string;
  isConnected: boolean;
  lastSyncedAt?: Date;

  // Reconciliation
  currentBalance: number;
  clearedBalance: number;
  unclearedBalance: number;
  lastReconciledAt?: Date;

  // Account Link
  linkedAccountId?: string; // FK to ChartOfAccount

  // Status
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface BankTransaction {
  id: string;
  bankAccountId: string;
  organizationId: string;

  externalTransactionId: string; // Provider's ID

  // Transaction Details
  transactionDate: Date;
  postDate: Date;
  amount: number;
  type: "DEBIT" | "CREDIT";
  description: string;

  // Counterparty
  counterpartyName?: string;
  counterpartyAccountNumber?: string;

  // Reconciliation
  status: "PENDING" | "CLEARED" | "RECONCILED" | "FLAGGED";
  matchedInvoiceId?: string;
  matchedExpenseId?: string;
  matchedJournalId?: string;

  // Categorization
  suggestedAccountId?: string;
  linkedAccountId?: string;
  tags: string[];

  // AI Categorization
  aiConfidence?: number;
  categorizedBy: "MANUAL" | "AI" | "RULE";

  createdAt: Date;
  updatedAt: Date;
}

export interface BankReconciliation {
  id: string;
  bankAccountId: string;
  organizationId: string;

  reconciliationDate: Date;
  statementStartDate: Date;
  statementEndDate: Date;

  // Reconciliation Numbers
  statementBalance: number;
  reconciledBalance: number;
  outstandingDeposits: number;
  outstandingChecks: number;

  // Transactions
  totalTransactions: number;
  reconciledTransactions: number;
  unreconciledTransactions: number;

  // Status
  isComplete: boolean;
  discrepancies: Discrepancy[];

  // Audit
  status: "IN_PROGRESS" | "COMPLETE" | "APPROVED" | "REJECTED";
  approvedBy?: string;
  approvedAt?: Date;

  createdAt: Date;
  updatedAt: Date;
}

export interface Discrepancy {
  id: string;
  reconciliationId: string;
  type: "MISSING_TRANSACTION" | "AMOUNT_MISMATCH" | "DATE_MISMATCH" | "DUPLICATE";
  amount: number;
  description: string;
  severity: "INFO" | "WARNING" | "ERROR";
  isResolved: boolean;
  resolution?: string;
}

// ============================================================================
// FINANCIAL REPORTING
// ============================================================================

export type ReportType =
  | "BALANCE_SHEET"
  | "INCOME_STATEMENT"
  | "CASH_FLOW"
  | "TRIAL_BALANCE"
  | "GENERAL_LEDGER"
  | "AGING_AR"
  | "AGING_AP"
  | "BUDGET_VS_ACTUAL"
  | "CUSTOM";

export interface FinancialReport {
  id: string;
  organizationId: string;
  reportType: ReportType;

  // Period
  startDate: Date;
  endDate: Date;

  // Data
  sections: ReportSection[];

  // Comparisons
  previousPeriod?: {
    startDate: Date;
    endDate: Date;
    data: ReportSection[];
  };

  // Calculations
  totals: Map<string, number>;
  percentages: Map<string, number>;

  // Metadata
  generatedAt: Date;
  generatedBy: string;
  notes?: string;

  // Export
  pdfUrl?: string;
  excelUrl?: string;

  createdAt: Date;
}

export interface ReportSection {
  title: string;
  rows: ReportRow[];
  subtotal?: number;
}

export interface ReportRow {
  accountName: string;
  accountCode?: string;
  currentPeriod: number;
  previousPeriod?: number;
  variance?: number;
  variancePercent?: number;
  indent: number; // For hierarchy
}

export interface BalanceSheet extends FinancialReport {
  assets: {
    currentAssets: ReportSection;
    fixedAssets: ReportSection;
    otherAssets: ReportSection;
  };
  liabilities: {
    currentLiabilities: ReportSection;
    longTermLiabilities: ReportSection;
  };
  equity: ReportSection;
}

export interface IncomeStatement extends FinancialReport {
  revenues: ReportSection;
  costOfGoodsSold: ReportSection;
  operatingExpenses: ReportSection;
  otherIncomeExpense: ReportSection;
  taxExpense: ReportSection;
}

// ============================================================================
// ORGANIZATIONS & MULTI-ENTITY
// ============================================================================

export interface Organization {
  id: string;
  name: string;
  legalName?: string;
  registrationNumber?: string;
  taxId?: string;

  // Details
  industry: string;
  countryCode: string;
  baseCurrency: CurrencyCode;
  fiscalYearStart: number; // Month: 1-12

  // Features
  enabledFeatures: FeatureFlag[];

  createdAt: Date;
  updatedAt: Date;
}

export type FeatureFlag =
  | "INVOICING"
  | "EXPENSE_MANAGEMENT"
  | "BANK_CONNECTIONS"
  | "FINANCIAL_REPORTING"
  | "PROJECT_TRACKING"
  | "BUDGETING"
  | "FIXED_ASSETS"
  | "MULTI_CURRENCY"
  | "WORKFLOW_AUTOMATION"
  | "API_ACCESS"
  | "ADVANCED_REPORTING";

export interface User {
  id: string;
  organizationId: string;
  email: string;
  name: string;

  role: "ADMIN" | "ACCOUNTANT" | "MANAGER" | "EMPLOYEE" | "VIEWER";
  permissions: Permission[];

  isActive: boolean;
  lastLoginAt?: Date;

  createdAt: Date;
  updatedAt: Date;
}

export type Permission =
  | "CREATE_INVOICE"
  | "EDIT_INVOICE"
  | "DELETE_INVOICE"
  | "APPROVE_INVOICE"
  | "RECORD_EXPENSE"
  | "APPROVE_EXPENSE"
  | "MANAGE_CHART_OF_ACCOUNTS"
  | "RECONCILE_ACCOUNTS"
  | "VIEW_REPORTS"
  | "EXPORT_DATA"
  | "MANAGE_USERS"
  | "MANAGE_INTEGRATIONS"
  | "AUDIT_TRAIL";

// ============================================================================
// ATTACHMENTS & AUDIT
// ============================================================================

export interface Attachment {
  id: string;
  entityType: "INVOICE" | "EXPENSE" | "JOURNAL" | "REPORT";
  entityId: string;

  fileName: string;
  fileUrl: string;
  fileSize: number;
  mimeType: string;

  uploadedBy: string;
  uploadedAt: Date;
}

export interface AuditLog {
  id: string;
  organizationId: string;

  entityType: string;
  entityId: string;
  action: "CREATE" | "UPDATE" | "DELETE" | "APPROVE" | "RECONCILE";

  changedFields: Record<string, {
    oldValue: any;
    newValue: any;
  }>;

  performedBy: string;
  ipAddress?: string;
  userAgent?: string;

  timestamp: Date;
}

// ============================================================================
// ZODVALIDATION SCHEMAS
// ============================================================================

export const ChartOfAccountSchema = z.object({
  code: z.string().min(1).max(20),
  name: z.string().min(1).max(255),
  description: z.string().optional(),
  accountType: z.enum(["ASSET", "LIABILITY", "EQUITY", "REVENUE", "EXPENSE", "COST_OF_GOODS_SOLD"]),
  category: z.string(),
  currencyCode: z.string().length(3),
  normalBalance: z.enum(["DEBIT", "CREDIT"]),
  tags: z.array(z.string()),
});

export const InvoiceSchema = z.object({
  invoiceNumber: z.string(),
  invoiceDate: z.date(),
  dueDate: z.date(),
  customerId: z.string(),
  customerName: z.string(),
  customerEmail: z.string().email(),
  currencyCode: z.string().length(3),
  lineItems: z.array(z.object({
    description: z.string(),
    quantity: z.number().positive(),
    unitPrice: z.number().nonnegative(),
  })),
  totalAmount: z.number().nonnegative(),
});

export const ExpenseSchema = z.object({
  expenseDate: z.date(),
  vendorName: z.string(),
  description: z.string(),
  category: z.string(),
  amount: z.number().positive(),
  isTaxDeductible: z.boolean(),
  tags: z.array(z.string()),
});
