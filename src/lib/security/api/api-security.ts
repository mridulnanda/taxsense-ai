/**
 * API Security
 * CORS, rate limiting, request validation, SQL injection prevention, XSS protection
 */

import { z } from 'zod';

// ============================================================================
// CORS Configuration
// ============================================================================

export interface CORSConfig {
  allowedOrigins: string[];
  allowedMethods: string[];
  allowedHeaders: string[];
  exposedHeaders: string[];
  maxAge: number;
  credentials: boolean;
  preflightContinue: boolean;
}

export const DEFAULT_CORS_CONFIG: CORSConfig = {
  allowedOrigins: [
    'http://localhost:3000',
    'http://localhost:3001',
    'https://taxsense.ai',
    'https://www.taxsense.ai',
    'https://app.taxsense.ai',
  ],
  allowedMethods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-API-Key', 'X-Request-ID'],
  exposedHeaders: ['X-RateLimit-Limit', 'X-RateLimit-Remaining', 'X-RateLimit-Reset'],
  maxAge: 86400,
  credentials: true,
  preflightContinue: false,
};

export class CORSManager {
  private config: CORSConfig;

  constructor(config: Partial<CORSConfig> = {}) {
    this.config = { ...DEFAULT_CORS_CONFIG, ...config };
  }

  /**
   * Validate origin
   */
  isOriginAllowed(origin: string): boolean {
    return this.config.allowedOrigins.some((allowed) => {
      if (allowed === '*') return true;
      if (allowed.startsWith('http://') || allowed.startsWith('https://')) {
        return origin === allowed;
      }
      // Wildcard domain matching
      return origin.endsWith(allowed);
    });
  }

  /**
   * Get CORS headers
   */
  getCORSHeaders(origin: string, method: string): Record<string, string> {
    const headers: Record<string, string> = {};

    if (this.isOriginAllowed(origin)) {
      headers['Access-Control-Allow-Origin'] = origin;
      headers['Access-Control-Allow-Credentials'] = this.config.credentials ? 'true' : 'false';
    }

    if (this.config.allowedMethods.includes(method)) {
      headers['Access-Control-Allow-Methods'] = this.config.allowedMethods.join(', ');
    }

    headers['Access-Control-Allow-Headers'] = this.config.allowedHeaders.join(', ');
    headers['Access-Control-Expose-Headers'] = this.config.exposedHeaders.join(', ');
    headers['Access-Control-Max-Age'] = this.config.maxAge.toString();

    return headers;
  }
}

// ============================================================================
// Rate Limiting
// ============================================================================

export interface RateLimitConfig {
  windowMs: number; // Time window in milliseconds
  maxRequests: number; // Max requests per window
  keyPrefix: string;
  skipSuccessfulRequests: boolean;
  skipFailedRequests: boolean;
}

export interface RateLimitRecord {
  key: string;
  count: number;
  resetTime: Date;
}

export class RateLimiter {
  private config: RateLimitConfig;
  private store: Map<string, RateLimitRecord> = new Map();

  constructor(config: Partial<RateLimitConfig> = {}) {
    this.config = {
      windowMs: 60000, // 1 minute
      maxRequests: 100,
      keyPrefix: 'rl',
      skipSuccessfulRequests: false,
      skipFailedRequests: false,
      ...config,
    };

    // Cleanup expired records every minute
    setInterval(() => this.cleanup(), 60000);
  }

  /**
   * Check rate limit
   */
  checkLimit(key: string): {
    allowed: boolean;
    remaining: number;
    resetTime: Date;
    limit: number;
  } {
    const fullKey = `${this.config.keyPrefix}:${key}`;
    const now = new Date();

    let record = this.store.get(fullKey);

    if (!record || record.resetTime < now) {
      record = {
        key: fullKey,
        count: 0,
        resetTime: new Date(now.getTime() + this.config.windowMs),
      };
    }

    record.count++;
    this.store.set(fullKey, record);

    return {
      allowed: record.count <= this.config.maxRequests,
      remaining: Math.max(0, this.config.maxRequests - record.count),
      resetTime: record.resetTime,
      limit: this.config.maxRequests,
    };
  }

  /**
   * Get rate limit status
   */
  getStatus(key: string): {
    remaining: number;
    limit: number;
    resetTime: Date;
    resetIn: number;
  } {
    const fullKey = `${this.config.keyPrefix}:${key}`;
    const record = this.store.get(fullKey);

    if (!record) {
      return {
        remaining: this.config.maxRequests,
        limit: this.config.maxRequests,
        resetTime: new Date(),
        resetIn: 0,
      };
    }

    const now = new Date();
    const resetIn = Math.max(0, record.resetTime.getTime() - now.getTime());

    return {
      remaining: Math.max(0, this.config.maxRequests - record.count),
      limit: this.config.maxRequests,
      resetTime: record.resetTime,
      resetIn,
    };
  }

  /**
   * Reset limit for key
   */
  reset(key: string): void {
    const fullKey = `${this.config.keyPrefix}:${key}`;
    this.store.delete(fullKey);
  }

  /**
   * Cleanup expired records
   */
  private cleanup(): void {
    const now = new Date();
    for (const [key, record] of this.store.entries()) {
      if (record.resetTime < now) {
        this.store.delete(key);
      }
    }
  }
}

// ============================================================================
// Request Validation
// ============================================================================

export class RequestValidator {
  /**
   * Validate JSON payload against schema
   */
  validateJSON<T>(data: unknown, schema: z.ZodSchema<T>): { valid: boolean; data?: T; errors?: string[] } {
    try {
      const result = schema.parse(data);
      return { valid: true, data: result };
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errors = error.errors.map((e) => `${e.path.join('.')}: ${e.message}`);
        return { valid: false, errors };
      }
      return { valid: false, errors: ['Invalid request'] };
    }
  }

  /**
   * Sanitize input to prevent XSS
   */
  sanitizeInput(input: string): string {
    return input
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;')
      .replace(/\//g, '&#x2F;');
  }

  /**
   * Validate SQL injection attempt
   */
  detectSQLInjection(input: string): boolean {
    const sqlKeywords = [
      'UNION',
      'SELECT',
      'INSERT',
      'UPDATE',
      'DELETE',
      'DROP',
      'EXEC',
      'EXECUTE',
      'SCRIPT',
      'OR',
      'AND',
    ];

    const upperInput = input.toUpperCase();
    return sqlKeywords.some((keyword) => {
      // Check for common SQL injection patterns
      return (
        upperInput.includes(`${keyword} `) ||
        upperInput.includes(`' ${keyword}`) ||
        upperInput.includes(`"; ${keyword}`)
      );
    });
  }

  /**
   * Validate XSS attempt
   */
  detectXSS(input: string): boolean {
    const xssPatterns = [
      /<script[^>]*>.*?<\/script>/gi,
      /javascript:/gi,
      /on\w+\s*=/gi, // Event handlers
      /<iframe/gi,
      /<embed/gi,
      /<object/gi,
    ];

    return xssPatterns.some((pattern) => pattern.test(input));
  }
}

// ============================================================================
// CSP (Content Security Policy) Configuration
// ============================================================================

export interface CSPConfig {
  defaultSrc: string[];
  scriptSrc: string[];
  styleSrc: string[];
  imgSrc: string[];
  connectSrc: string[];
  fontSrc: string[];
  frameSrc: string[];
  objectSrc: string[];
  mediaSrc: string[];
  reportUri: string;
  upgradeInsecureRequests: boolean;
  blockAllMixedContent: boolean;
}

export const DEFAULT_CSP_CONFIG: CSPConfig = {
  defaultSrc: ["'self'"],
  scriptSrc: ["'self'", "'unsafe-inline'", 'https://cdn.jsdelivr.net', 'https://cdnjs.cloudflare.com'],
  styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
  imgSrc: ["'self'", 'data:', 'https:'],
  connectSrc: ["'self'", 'https:', 'wss:'],
  fontSrc: ["'self'", 'https://fonts.gstatic.com'],
  frameSrc: ["'self'"],
  objectSrc: ["'none'"],
  mediaSrc: ["'self'"],
  reportUri: '/api/security/csp-report',
  upgradeInsecureRequests: true,
  blockAllMixedContent: true,
};

export class CSPManager {
  private config: CSPConfig;

  constructor(config: Partial<CSPConfig> = {}) {
    this.config = { ...DEFAULT_CSP_CONFIG, ...config };
  }

  /**
   * Generate CSP header
   */
  generateHeader(reportOnly: boolean = false): string {
    const directives: string[] = [];

    if (this.config.defaultSrc) directives.push(`default-src ${this.config.defaultSrc.join(' ')}`);
    if (this.config.scriptSrc) directives.push(`script-src ${this.config.scriptSrc.join(' ')}`);
    if (this.config.styleSrc) directives.push(`style-src ${this.config.styleSrc.join(' ')}`);
    if (this.config.imgSrc) directives.push(`img-src ${this.config.imgSrc.join(' ')}`);
    if (this.config.connectSrc) directives.push(`connect-src ${this.config.connectSrc.join(' ')}`);
    if (this.config.fontSrc) directives.push(`font-src ${this.config.fontSrc.join(' ')}`);
    if (this.config.frameSrc) directives.push(`frame-src ${this.config.frameSrc.join(' ')}`);
    if (this.config.objectSrc) directives.push(`object-src ${this.config.objectSrc.join(' ')}`);
    if (this.config.mediaSrc) directives.push(`media-src ${this.config.mediaSrc.join(' ')}`);
    if (this.config.reportUri) directives.push(`report-uri ${this.config.reportUri}`);
    if (this.config.upgradeInsecureRequests) directives.push('upgrade-insecure-requests');
    if (this.config.blockAllMixedContent) directives.push('block-all-mixed-content');

    return directives.join('; ');
  }

  /**
   * Generate nonce for inline scripts
   */
  generateNonce(): string {
    return Buffer.from(Math.random().toString()).toString('base64');
  }
}

// ============================================================================
// CSRF Protection
// ============================================================================

export class CSRFProtector {
  private tokens: Map<string, { token: string; expiresAt: Date }> = new Map();

  /**
   * Generate CSRF token
   */
  generateToken(sessionId: string): string {
    const token = require('crypto').randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 3600000); // 1 hour

    this.tokens.set(sessionId, { token, expiresAt });
    return token;
  }

  /**
   * Verify CSRF token
   */
  verifyToken(sessionId: string, token: string): boolean {
    const record = this.tokens.get(sessionId);

    if (!record) return false;
    if (record.expiresAt < new Date()) {
      this.tokens.delete(sessionId);
      return false;
    }

    return record.token === token;
  }

  /**
   * Generate SameSite cookie header
   */
  generateSameSiteCookie(name: string, value: string, secure: boolean = true): string {
    return `${name}=${value}; SameSite=Strict; ${secure ? 'Secure; ' : ''}HttpOnly`;
  }
}

// ============================================================================
// Security Headers
// ============================================================================

export function getSecurityHeaders(): Record<string, string> {
  return {
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-XSS-Protection': '1; mode=block',
    'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
    'X-Permitted-Cross-Domain-Policies': 'none',
  };
}
