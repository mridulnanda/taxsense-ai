import { formatDistanceToNow, format, parse, isValid } from 'date-fns';

export const FormattingUtils = {
  /**
   * Format currency
   */
  formatCurrency(amount: number, currency: string = 'INR'): string {
    try {
      const formatter = new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: currency,
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
      });
      return formatter.format(amount);
    } catch {
      return `${currency} ${amount.toLocaleString()}`;
    }
  },

  /**
   * Format large numbers with abbreviation
   */
  formatLargeNumber(num: number): string {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    }
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
  },

  /**
   * Format percentage
   */
  formatPercentage(value: number, decimals: number = 2): string {
    return `${value.toFixed(decimals)}%`;
  },

  /**
   * Format date
   */
  formatDate(date: string | Date, dateFormat: string = 'MMM dd, yyyy'): string {
    try {
      let dateObj: Date;
      if (typeof date === 'string') {
        dateObj = parse(date, 'yyyy-MM-dd', new Date());
        if (!isValid(dateObj)) {
          dateObj = new Date(date);
        }
      } else {
        dateObj = date;
      }

      if (!isValid(dateObj)) {
        return 'Invalid date';
      }

      return format(dateObj, dateFormat);
    } catch {
      return 'Invalid date';
    }
  },

  /**
   * Format time
   */
  formatTime(date: string | Date, timeFormat: string = 'HH:mm'): string {
    try {
      let dateObj: Date;
      if (typeof date === 'string') {
        dateObj = new Date(date);
      } else {
        dateObj = date;
      }

      if (!isValid(dateObj)) {
        return 'Invalid time';
      }

      return format(dateObj, timeFormat);
    } catch {
      return 'Invalid time';
    }
  },

  /**
   * Format date and time
   */
  formatDateTime(
    date: string | Date,
    dateTimeFormat: string = 'MMM dd, yyyy HH:mm'
  ): string {
    try {
      let dateObj: Date;
      if (typeof date === 'string') {
        dateObj = new Date(date);
      } else {
        dateObj = date;
      }

      if (!isValid(dateObj)) {
        return 'Invalid date';
      }

      return format(dateObj, dateTimeFormat);
    } catch {
      return 'Invalid date';
    }
  },

  /**
   * Format relative time (e.g., "2 hours ago")
   */
  formatRelativeTime(date: string | Date): string {
    try {
      let dateObj: Date;
      if (typeof date === 'string') {
        dateObj = new Date(date);
      } else {
        dateObj = date;
      }

      if (!isValid(dateObj)) {
        return 'Invalid date';
      }

      return formatDistanceToNow(dateObj, { addSuffix: true });
    } catch {
      return 'Invalid date';
    }
  },

  /**
   * Format phone number
   */
  formatPhone(phone: string): string {
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.length === 10) {
      return `+91 ${cleaned.slice(0, 5)} ${cleaned.slice(5)}`;
    }
    if (cleaned.length === 12 && cleaned.startsWith('91')) {
      return `+${cleaned.slice(0, 2)} ${cleaned.slice(2, 7)} ${cleaned.slice(7)}`;
    }
    return phone;
  },

  /**
   * Format file size
   */
  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  },

  /**
   * Format taxpayer ID (mask sensitive parts)
   */
  formatTaxpayerId(taxpayerId: string): string {
    if (taxpayerId.length <= 4) return taxpayerId;
    const visible = taxpayerId.slice(-4);
    const masked = '*'.repeat(taxpayerId.length - 4);
    return `${masked}${visible}`;
  },

  /**
   * Truncate text
   */
  truncateText(text: string, length: number = 50): string {
    if (text.length <= length) return text;
    return text.slice(0, length) + '...';
  },

  /**
   * Format name (capitalize)
   */
  formatName(name: string): string {
    return name
      .split(' ')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  },

  /**
   * Format email (mask partially)
   */
  formatEmail(email: string): string {
    const [localPart, domain] = email.split('@');
    if (localPart.length <= 2) {
      return `${localPart}***@${domain}`;
    }
    const visible = localPart.slice(-2);
    const masked = '*'.repeat(localPart.length - 2);
    return `${masked}${visible}@${domain}`;
  },

  /**
   * Convert to title case
   */
  toTitleCase(text: string): string {
    return text
      .toLowerCase()
      .split(' ')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  },

  /**
   * Add commas to numbers
   */
  addCommas(num: number | string): string {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  },

  /**
   * Format as percentage change
   */
  formatPercentageChange(current: number, previous: number): string {
    if (previous === 0) return 'N/A';
    const change = ((current - previous) / previous) * 100;
    const sign = change > 0 ? '+' : '';
    return `${sign}${change.toFixed(2)}%`;
  },

  /**
   * Humanize duration (seconds to readable format)
   */
  humanizeDuration(seconds: number): string {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    const parts = [];
    if (hours > 0) parts.push(`${hours}h`);
    if (minutes > 0) parts.push(`${minutes}m`);
    if (secs > 0) parts.push(`${secs}s`);

    return parts.join(' ') || '0s';
  },
};
