import { VALIDATION_RULES, ERROR_MESSAGES } from '@constants/index';

export interface ValidationError {
  field: string;
  message: string;
}

export const ValidationUtils = {
  /**
   * Validate email
   */
  isValidEmail(email: string): boolean {
    return VALIDATION_RULES.EMAIL_REGEX.test(email);
  },

  /**
   * Validate phone number
   */
  isValidPhone(phone: string): boolean {
    return VALIDATION_RULES.PHONE_REGEX.test(phone);
  },

  /**
   * Validate password strength
   */
  isValidPassword(password: string): boolean {
    if (password.length < VALIDATION_RULES.PASSWORD_MIN_LENGTH) {
      return false;
    }
    return VALIDATION_RULES.PASSWORD_REGEX.test(password);
  },

  /**
   * Get password strength message
   */
  getPasswordStrength(password: string): string {
    if (password.length < 8) return 'Too short';
    if (!VALIDATION_RULES.PASSWORD_REGEX.test(password)) return 'Weak';
    if (password.length >= 12) return 'Strong';
    return 'Medium';
  },

  /**
   * Validate taxpayer ID
   */
  isValidTaxpayerId(taxpayerId: string): boolean {
    return VALIDATION_RULES.TAXPAYER_ID_REGEX.test(taxpayerId);
  },

  /**
   * Validate amount (positive number)
   */
  isValidAmount(amount: any): boolean {
    const num = parseFloat(amount);
    return !isNaN(num) && num > 0;
  },

  /**
   * Validate date
   */
  isValidDate(dateString: string): boolean {
    const date = new Date(dateString);
    return date instanceof Date && !isNaN(date.getTime());
  },

  /**
   * Validate date format (YYYY-MM-DD)
   */
  isValidDateFormat(dateString: string): boolean {
    const regex = /^\d{4}-\d{2}-\d{2}$/;
    if (!regex.test(dateString)) return false;
    return this.isValidDate(dateString);
  },

  /**
   * Validate required field
   */
  isRequired(value: any): boolean {
    if (typeof value === 'string') return value.trim().length > 0;
    if (Array.isArray(value)) return value.length > 0;
    return value !== null && value !== undefined;
  },

  /**
   * Validate field length
   */
  isValidLength(value: string, min: number, max: number): boolean {
    const length = value.trim().length;
    return length >= min && length <= max;
  },

  /**
   * Validate number range
   */
  isInRange(value: number, min: number, max: number): boolean {
    return value >= min && value <= max;
  },

  /**
   * Validate URL
   */
  isValidURL(url: string): boolean {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  },

  /**
   * Sanitize input (prevent XSS)
   */
  sanitize(input: string): string {
    return input
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;');
  },

  /**
   * Format phone number
   */
  formatPhone(phone: string): string {
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.length === 10) {
      return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
    }
    return phone;
  },

  /**
   * Validate form
   */
  validateForm(
    values: Record<string, any>,
    schema: Record<string, any>
  ): ValidationError[] {
    const errors: ValidationError[] = [];

    Object.keys(schema).forEach((field) => {
      const rule = schema[field];
      const value = values[field];

      // Required check
      if (rule.required && !this.isRequired(value)) {
        errors.push({
          field,
          message: `${field} is required`,
        });
        return;
      }

      // Email check
      if (rule.type === 'email' && value && !this.isValidEmail(value)) {
        errors.push({
          field,
          message: 'Invalid email address',
        });
      }

      // Phone check
      if (rule.type === 'phone' && value && !this.isValidPhone(value)) {
        errors.push({
          field,
          message: 'Invalid phone number',
        });
      }

      // Password check
      if (rule.type === 'password' && value && !this.isValidPassword(value)) {
        errors.push({
          field,
          message: 'Password must be at least 8 characters with uppercase, lowercase, number and symbol',
        });
      }

      // Min length check
      if (rule.minLength && value && value.length < rule.minLength) {
        errors.push({
          field,
          message: `Minimum length is ${rule.minLength} characters`,
        });
      }

      // Max length check
      if (rule.maxLength && value && value.length > rule.maxLength) {
        errors.push({
          field,
          message: `Maximum length is ${rule.maxLength} characters`,
        });
      }

      // Number check
      if (rule.type === 'number' && value && isNaN(parseFloat(value))) {
        errors.push({
          field,
          message: 'Must be a valid number',
        });
      }

      // Amount check
      if (rule.type === 'amount' && value && !this.isValidAmount(value)) {
        errors.push({
          field,
          message: 'Must be a valid amount',
        });
      }

      // Date check
      if (rule.type === 'date' && value && !this.isValidDate(value)) {
        errors.push({
          field,
          message: 'Invalid date',
        });
      }
    });

    return errors;
  },
};
