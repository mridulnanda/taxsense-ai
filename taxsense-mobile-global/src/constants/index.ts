// API Configuration
export const API_CONFIG = {
  BASE_URL: process.env.API_URL || 'https://api.taxsense.global',
  GRAPHQL_URL: process.env.GRAPHQL_URL || 'https://api.taxsense.global/graphql',
  TIMEOUT: 30000,
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 1000,
};

// Storage Keys
export const STORAGE_KEYS = {
  AUTH_TOKEN: 'auth_token',
  REFRESH_TOKEN: 'refresh_token',
  USER_DATA: 'user_data',
  TAX_CALCULATIONS: 'tax_calculations',
  DOCUMENTS: 'documents',
  OFFLINE_ACTIONS: 'offline_actions',
  SYNC_STATE: 'sync_state',
  APP_SETTINGS: 'app_settings',
  NOTIFICATION_PREFERENCES: 'notification_preferences',
  SECURITY_SETTINGS: 'security_settings',
};

// Error Messages
export const ERROR_MESSAGES = {
  NETWORK_ERROR: 'Network error. Please check your connection.',
  UNAUTHORIZED: 'Unauthorized. Please log in again.',
  FORBIDDEN: 'You do not have permission to access this resource.',
  NOT_FOUND: 'Resource not found.',
  VALIDATION_ERROR: 'Please check the entered information.',
  BIOMETRIC_FAILED: 'Biometric authentication failed.',
  CAMERA_PERMISSION_DENIED: 'Camera permission denied.',
  DOCUMENT_UPLOAD_FAILED: 'Failed to upload document.',
  SYNC_FAILED: 'Failed to sync data.',
  UNKNOWN_ERROR: 'An unexpected error occurred.',
};

// Success Messages
export const SUCCESS_MESSAGES = {
  LOGIN_SUCCESS: 'Logged in successfully.',
  LOGOUT_SUCCESS: 'Logged out successfully.',
  PROFILE_UPDATED: 'Profile updated successfully.',
  DOCUMENT_UPLOADED: 'Document uploaded successfully.',
  TAX_CALCULATED: 'Tax calculated successfully.',
  SETTINGS_SAVED: 'Settings saved successfully.',
};

// Validation Rules
export const VALIDATION_RULES = {
  EMAIL_REGEX: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  PHONE_REGEX: /^[+]?[(]?[0-9]{1,4}[)]?[-\s.]?[(]?[0-9]{1,4}[)]?[-\s.]?[0-9]{1,9}$/,
  PASSWORD_MIN_LENGTH: 8,
  PASSWORD_REGEX: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
  TAXPAYER_ID_REGEX: /^[A-Z0-9]{10,15}$/,
};

// Countries and Timezones
export const COUNTRIES = [
  { code: 'IN', name: 'India', currency: 'INR' },
  { code: 'US', name: 'United States', currency: 'USD' },
  { code: 'GB', name: 'United Kingdom', currency: 'GBP' },
  { code: 'CA', name: 'Canada', currency: 'CAD' },
  { code: 'AU', name: 'Australia', currency: 'AUD' },
  { code: 'SG', name: 'Singapore', currency: 'SGD' },
  { code: 'AE', name: 'United Arab Emirates', currency: 'AED' },
  { code: 'NZ', name: 'New Zealand', currency: 'NZD' },
];

export const INCOME_TYPES = [
  { id: 'salary', label: 'Salary Income', icon: 'briefcase' },
  { id: 'business', label: 'Business Income', icon: 'store' },
  { id: 'rental', label: 'Rental Income', icon: 'home' },
  { id: 'capitalGains', label: 'Capital Gains', icon: 'trending-up' },
  { id: 'other', label: 'Other Income', icon: 'file-text' },
];

export const DEDUCTION_CATEGORIES = [
  { id: 'medical', label: 'Medical Expenses', icon: 'heart' },
  { id: 'education', label: 'Education', icon: 'book' },
  { id: 'charitable', label: 'Charitable Donations', icon: 'gift' },
  { id: 'investment', label: 'Investments', icon: 'pie-chart' },
  { id: 'other', label: 'Other Deductions', icon: 'folder' },
];

export const DOCUMENT_TYPES = [
  { id: 'receipt', label: 'Receipt' },
  { id: 'invoice', label: 'Invoice' },
  { id: 'investment', label: 'Investment Document' },
  { id: 'medical', label: 'Medical Receipt' },
  { id: 'education', label: 'Education Expense' },
  { id: 'other', label: 'Other' },
];

// Security
export const SECURITY_CONFIG = {
  SESSION_TIMEOUT: 15 * 60 * 1000, // 15 minutes
  AUTO_LOCK_TIMEOUT: 5 * 60 * 1000, // 5 minutes
  PIN_LENGTH: 6,
  MAX_LOGIN_ATTEMPTS: 5,
  LOCKOUT_DURATION: 30 * 60 * 1000, // 30 minutes
  TOKEN_REFRESH_THRESHOLD: 5 * 60 * 1000, // 5 minutes before expiry
};

// Notification Types
export const NOTIFICATION_TYPES = {
  DEADLINE: 'deadline',
  AUDIT: 'audit',
  DEDUCTION: 'deduction',
  UPDATE: 'update',
  ALERT: 'alert',
};

// Tax Deadlines (India)
export const TAX_DEADLINES = {
  IN: [
    {
      id: 'q1-estimated',
      description: 'Q1 Estimated Tax Payment',
      month: 6,
      day: 15,
      type: 'estimate',
      priority: 'high' as const,
    },
    {
      id: 'q2-estimated',
      description: 'Q2 Estimated Tax Payment',
      month: 9,
      day: 15,
      type: 'estimate',
      priority: 'high' as const,
    },
    {
      id: 'q3-estimated',
      description: 'Q3 Estimated Tax Payment',
      month: 12,
      day: 15,
      type: 'estimate',
      priority: 'high' as const,
    },
    {
      id: 'annual-filing',
      description: 'Annual Tax Filing',
      month: 7,
      day: 31,
      type: 'filing',
      priority: 'high' as const,
    },
  ],
};

// Languages
export const LANGUAGES = [
  { code: 'en', name: 'English' },
  { code: 'hi', name: 'Hindi' },
  { code: 'es', name: 'Spanish' },
  { code: 'fr', name: 'French' },
  { code: 'de', name: 'German' },
  { code: 'zh', name: 'Chinese' },
  { code: 'ja', name: 'Japanese' },
  { code: 'ko', name: 'Korean' },
  { code: 'pt', name: 'Portuguese' },
  { code: 'ru', name: 'Russian' },
];

// Font Sizes
export const FONT_SIZES = {
  small: { body: 14, heading: 18 },
  medium: { body: 16, heading: 20 },
  large: { body: 18, heading: 22 },
};

// Colors
export const COLORS = {
  primary: '#2563EB',
  secondary: '#10B981',
  danger: '#EF4444',
  warning: '#F59E0B',
  success: '#10B981',
  info: '#3B82F6',
  dark: '#1F2937',
  light: '#F3F4F6',
};

// HTTP Status Codes
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  INTERNAL_SERVER_ERROR: 500,
  SERVICE_UNAVAILABLE: 503,
};

// Feature Flags
export const FEATURE_FLAGS = {
  ENABLE_OFFLINE_MODE: process.env.ENABLE_OFFLINE_MODE === 'true',
  ENABLE_OCR: true,
  ENABLE_ADVISOR_BOOKING: true,
  ENABLE_PUSH_NOTIFICATIONS: true,
  ENABLE_DARK_MODE: true,
  ENABLE_MULTI_LANGUAGE: true,
};

// App Sizes
export const APP_SIZE_LIMITS = {
  MAX_APP_SIZE_MB: 5,
  MAX_IMAGE_SIZE_MB: 10,
  MAX_DOCUMENT_SIZE_MB: 50,
  MAX_STORAGE_MB: 500,
};
