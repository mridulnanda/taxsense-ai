// Auth Types
export interface User {
  id: string;
  email: string;
  phone: string;
  firstName: string;
  lastName: string;
  profilePhoto?: string;
  taxpayerId: string;
  country: string;
  currency: string;
  createdAt: string;
  updatedAt: string;
}

export interface AuthToken {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface AuthState {
  user: User | null;
  token: AuthToken | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

// Tax Types
export interface IncomeSource {
  id: string;
  type: 'salary' | 'business' | 'rental' | 'capitalGains' | 'other';
  description: string;
  amount: number;
  currency: string;
  year: number;
  documentIds?: string[];
}

export interface Deduction {
  id: string;
  category: 'medical' | 'education' | 'charitable' | 'investment' | 'other';
  amount: number;
  description: string;
  documentIds?: string[];
  date: string;
}

export interface TaxCalculation {
  id: string;
  userId: string;
  year: number;
  incomeSources: IncomeSource[];
  deductions: Deduction[];
  totalIncome: number;
  totalDeductions: number;
  taxableIncome: number;
  taxOldRegime: number;
  taxNewRegime: number;
  recommendedRegime: 'old' | 'new';
  savings: number;
  createdAt: string;
  updatedAt: string;
}

export interface TaxScenario {
  id: string;
  name: string;
  description: string;
  incomeSources: IncomeSource[];
  deductions: Deduction[];
  estimatedTax: number;
  savings: number;
}

// Document Types
export interface Document {
  id: string;
  userId: string;
  filename: string;
  uri: string;
  type: 'receipt' | 'invoice' | 'investment' | 'medical' | 'education' | 'other';
  uploadedAt: string;
  processedAt?: string;
  extractedData?: {
    amount?: number;
    date?: string;
    description?: string;
    merchant?: string;
  };
  isEncrypted: boolean;
}

export interface OCRResult {
  text: string;
  confidence: number;
  data: {
    amount?: number;
    date?: string;
    description?: string;
  };
}

// Compliance Types
export interface Deadline {
  id: string;
  country: string;
  description: string;
  dueDate: string;
  type: 'filing' | 'payment' | 'estimate' | 'other';
  priority: 'high' | 'medium' | 'low';
  completed: boolean;
  reminderSet: boolean;
}

export interface ComplianceItem {
  id: string;
  userId: string;
  title: string;
  description: string;
  category: string;
  dueDate: string;
  completed: boolean;
  documents?: Document[];
}

export interface AuditRisk {
  score: number; // 0-100
  level: 'low' | 'medium' | 'high';
  factors: string[];
  recommendations: string[];
}

// Advisor Types
export interface TaxAdvisor {
  id: string;
  name: string;
  email: string;
  phone: string;
  specialization: string[];
  rating: number;
  reviews: number;
  hourlyRate: number;
  availableSlots: string[];
  photo?: string;
}

export interface Consultation {
  id: string;
  userId: string;
  advisorId: string;
  dateTime: string;
  status: 'scheduled' | 'completed' | 'cancelled';
  duration: number;
  notes?: string;
  recording?: string;
}

export interface SharedData {
  id: string;
  userId: string;
  advisorId: string;
  documents: Document[];
  taxCalculations: TaxCalculation[];
  sharedAt: string;
  accessLevel: 'view' | 'edit';
}

// Notification Types
export interface Notification {
  id: string;
  userId: string;
  type: 'deadline' | 'audit' | 'deduction' | 'update' | 'alert';
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
  actionUrl?: string;
}

// Report Types
export interface TaxReport {
  id: string;
  userId: string;
  year: number;
  totalIncome: number;
  totalDeductions: number;
  taxableIncome: number;
  taxPaid: number;
  refund?: number;
  deadline: string;
  status: 'draft' | 'filed' | 'completed';
  breakdown: {
    category: string;
    amount: number;
    percentage: number;
  }[];
}

// Form Types
export interface FormError {
  field: string;
  message: string;
}

export interface FormState {
  values: Record<string, any>;
  errors: FormError[];
  touched: Record<string, boolean>;
  isSubmitting: boolean;
  isDirty: boolean;
}

// API Response Types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  code?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    hasMore: boolean;
  };
}

// Settings Types
export interface NotificationPreferences {
  emailNotifications: boolean;
  pushNotifications: boolean;
  smsNotifications: boolean;
  deadlineReminders: boolean;
  auditAlerts: boolean;
  deductionSuggestions: boolean;
  weeklyDigest: boolean;
}

export interface SecuritySettings {
  biometricEnabled: boolean;
  pinEnabled: boolean;
  autoLockTimeout: number; // minutes
  sessionTimeout: number; // minutes
}

export interface AppSettings {
  language: string;
  currency: string;
  timezone: string;
  darkMode: 'auto' | 'light' | 'dark';
  fontSize: 'small' | 'medium' | 'large';
}

// Offline Types
export interface OfflineAction {
  id: string;
  type: 'create' | 'update' | 'delete';
  entity: string;
  data: any;
  timestamp: number;
  status: 'pending' | 'failed';
  retryCount: number;
}

export interface SyncState {
  isSyncing: boolean;
  lastSyncTime?: number;
  pendingActions: OfflineAction[];
  syncError?: string;
}
