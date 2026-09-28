// User and Authentication types
export interface User {
  id: string;
  email: string;
  phone: string;
  firstName: string;
  lastName: string;
  panNumber: string;
  aadharNumber?: string;
  residentialAddress: Address;
  occupationType: OccupationType;
  financialYear: string;
  createdAt: string;
  updatedAt: string;
}

export interface Address {
  street: string;
  city: string;
  state: string;
  pincode: string;
  country: string;
}

export enum OccupationType {
  SALARIED = 'SALARIED',
  SELF_EMPLOYED = 'SELF_EMPLOYED',
  BUSINESS = 'BUSINESS',
  PROFESSIONAL = 'PROFESSIONAL',
  STUDENT = 'STUDENT',
  RETIRED = 'RETIRED',
  HUF = 'HUF',
}

// Income types
export interface IncomeEntry {
  id: string;
  userId: string;
  type: IncomeType;
  description: string;
  amount: number;
  financialYear: string;
  source: string;
  supportingDocuments?: Document[];
  createdAt: string;
  updatedAt: string;
}

export enum IncomeType {
  SALARY = 'SALARY',
  BONUS = 'BONUS',
  INTEREST = 'INTEREST',
  DIVIDEND = 'DIVIDEND',
  RENTAL = 'RENTAL',
  BUSINESS = 'BUSINESS',
  CAPITAL_GAINS = 'CAPITAL_GAINS',
  OTHER = 'OTHER',
}

// Deduction types
export interface DeductionEntry {
  id: string;
  userId: string;
  section: DeductionSection;
  description: string;
  amount: number;
  financialYear: string;
  category: string;
  supportingDocuments?: Document[];
  createdAt: string;
  updatedAt: string;
}

export enum DeductionSection {
  SECTION_80C = 'SECTION_80C', // Life insurance, PPF, etc
  SECTION_80D = 'SECTION_80D', // Health insurance
  SECTION_80E = 'SECTION_80E', // Education loan interest
  SECTION_80G = 'SECTION_80G', // Charitable donations
  SECTION_80TTA = 'SECTION_80TTA', // Savings account interest
  SECTION_80TTB = 'SECTION_80TTB', // Senior citizen interest
  SECTION_24B = 'SECTION_24B', // Home loan interest
  HRA = 'HRA', // House Rent Allowance
  PROFESSIONAL_TAX = 'PROFESSIONAL_TAX', // Professional tax
  STANDARD_DEDUCTION = 'STANDARD_DEDUCTION',
}

// Tax computation
export interface TaxComputation {
  id: string;
  userId: string;
  financialYear: string;
  totalIncome: number;
  totalDeductions: number;
  taxableIncome: number;
  taxAmount: number;
  surcharge: number;
  cess: number;
  totalTaxPayable: number;
  effectiveTaxRate: number;
  regime: TaxRegime;
  createdAt: string;
  updatedAt: string;
}

export enum TaxRegime {
  OLD = 'OLD',
  NEW = 'NEW',
}

// Scenarios
export interface Scenario {
  id: string;
  userId: string;
  name: string;
  description: string;
  financialYear: string;
  incomeEntries: IncomeEntry[];
  deductionEntries: DeductionEntry[];
  taxComputation: TaxComputation;
  savings?: number;
  status: ScenarioStatus;
  templateId?: string;
  createdAt: string;
  updatedAt: string;
}

export enum ScenarioStatus {
  DRAFT = 'DRAFT',
  COMPUTED = 'COMPUTED',
  OPTIMIZED = 'OPTIMIZED',
  ARCHIVED = 'ARCHIVED',
}

// Documents
export interface Document {
  id: string;
  userId: string;
  type: DocumentType;
  fileName: string;
  fileSize: number;
  filePath: string;
  mimeType: string;
  uploadedAt: string;
  scanStatus?: ScanStatus;
  extractedData?: Record<string, any>;
}

export enum DocumentType {
  AADHAR = 'AADHAR',
  PAN = 'PAN',
  SALARY_SLIP = 'SALARY_SLIP',
  FORM_16 = 'FORM_16',
  INVESTMENT_PROOF = 'INVESTMENT_PROOF',
  MEDICAL_EXPENSE = 'MEDICAL_EXPENSE',
  RENTAL_RECEIPT = 'RENTAL_RECEIPT',
  BANK_STATEMENT = 'BANK_STATEMENT',
  PROPERTY_DOCUMENT = 'PROPERTY_DOCUMENT',
  INSURANCE_POLICY = 'INSURANCE_POLICY',
  DONATION_RECEIPT = 'DONATION_RECEIPT',
  LOAN_STATEMENT = 'LOAN_STATEMENT',
  OTHER = 'OTHER',
}

export enum ScanStatus {
  PENDING = 'PENDING',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
}

// Templates
export interface ScenarioTemplate {
  id: string;
  name: string;
  description: string;
  incomeStructure: IncomeType[];
  deductionSections: DeductionSection[];
  targetAudience: OccupationType[];
  createdAt: string;
}

// Notifications
export interface NotificationPayload {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  data?: Record<string, any>;
  read: boolean;
  createdAt: string;
}

export enum NotificationType {
  TAX_SAVINGS = 'TAX_SAVINGS',
  DEADLINE_REMINDER = 'DEADLINE_REMINDER',
  DOCUMENT_UPLOADED = 'DOCUMENT_UPLOADED',
  COMPUTATION_COMPLETE = 'COMPUTATION_COMPLETE',
  SCENARIO_ALERT = 'SCENARIO_ALERT',
  SYSTEM_NOTIFICATION = 'SYSTEM_NOTIFICATION',
}

// Analytics
export interface AnalyticsData {
  userId: string;
  financialYear: string;
  totalIncomeTrend: TrendData[];
  taxSavingsTrend: TrendData[];
  deductionUtilization: DeductionUtilization[];
  complianceScore: number;
  optimizationPotential: number;
}

export interface TrendData {
  month: string;
  value: number;
  percentage?: number;
}

export interface DeductionUtilization {
  section: DeductionSection;
  utilized: number;
  available: number;
  percentage: number;
}

// API Response types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: Record<string, any>;
  };
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

// Form validation
export interface FormError {
  field: string;
  message: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: FormError[];
}
