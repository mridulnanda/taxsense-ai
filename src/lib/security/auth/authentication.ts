/**
 * Authentication Module
 * Handles OAuth2, Magic Links, TOTP, Biometric, and Session Management
 */

import crypto from 'crypto';
import { z } from 'zod';
import {
  AuthProvider,
  AuthUser,
  Session,
  MFAMethod,
  LoginAttempt,
  RefreshTokenPayload,
} from '../types';

// Password hashing utilities
export async function hashPassword(password: string, salt?: string): Promise<{ hash: string; salt: string }> {
  const passwordSalt = salt || crypto.randomBytes(16).toString('hex');
  // In production, use argon2 from 'argon2' package
  const hash = crypto.pbkdf2Sync(password, passwordSalt, 100000, 64, 'sha512').toString('hex');
  return { hash, salt: passwordSalt };
}

export async function verifyPassword(password: string, hash: string, salt: string): Promise<boolean> {
  const { hash: computedHash } = await hashPassword(password, salt);
  return computedHash === hash;
}

// Password validation
export const passwordPolicySchema = z.object({
  minLength: z.number().min(8).max(128).default(12),
  requireUppercase: z.boolean().default(true),
  requireLowercase: z.boolean().default(true),
  requireNumbers: z.boolean().default(true),
  requireSpecialChars: z.boolean().default(true),
});

export function validatePassword(
  password: string,
  policy: z.infer<typeof passwordPolicySchema>
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (password.length < policy.minLength) {
    errors.push(`Password must be at least ${policy.minLength} characters long`);
  }

  if (policy.requireUppercase && !/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }

  if (policy.requireLowercase && !/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }

  if (policy.requireNumbers && !/\d/.test(password)) {
    errors.push('Password must contain at least one number');
  }

  if (policy.requireSpecialChars && !/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    errors.push('Password must contain at least one special character');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

// ============================================================================
// Session Management
// ============================================================================

interface JWTPayload {
  userId: string;
  organizationId: string;
  email: string;
  roleId: string;
  iat: number;
  exp: number;
  sessionId: string;
}

export class SessionManager {
  private jwtSecret: string;
  private tokenExpirySeconds: number;
  private refreshTokenExpirySeconds: number;

  constructor(
    jwtSecret: string,
    tokenExpirySeconds: number = 3600, // 1 hour
    refreshTokenExpirySeconds: number = 604800 // 7 days
  ) {
    this.jwtSecret = jwtSecret;
    this.tokenExpirySeconds = tokenExpirySeconds;
    this.refreshTokenExpirySeconds = refreshTokenExpirySeconds;
  }

  createSession(
    userId: string,
    organizationId: string,
    email: string,
    roleId: string,
    ipAddress: string,
    userAgent?: string,
    deviceId?: string
  ): Session {
    const now = Math.floor(Date.now() / 1000);
    const token = this.generateJWT({
      userId,
      organizationId,
      email,
      roleId,
      iat: now,
      exp: now + this.tokenExpirySeconds,
      sessionId: crypto.randomUUID(),
    });

    const refreshToken = crypto.randomBytes(32).toString('hex');
    const sessionId = crypto.randomUUID();

    return {
      id: sessionId,
      userId,
      organizationId,
      token,
      refreshToken,
      tokenExpiresAt: new Date((now + this.tokenExpirySeconds) * 1000),
      refreshTokenExpiresAt: new Date((now + this.refreshTokenExpirySeconds) * 1000),
      userAgent,
      ipAddress,
      deviceId,
      isActive: true,
      lastActivity: new Date(),
      createdAt: new Date(),
    };
  }

  generateJWT(payload: JWTPayload): string {
    // In production, use 'jsonwebtoken' package
    const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
    const body = Buffer.from(JSON.stringify(payload)).toString('base64url');
    const signature = crypto
      .createHmac('sha256', this.jwtSecret)
      .update(`${header}.${body}`)
      .digest('base64url');
    return `${header}.${body}.${signature}`;
  }

  verifyJWT(token: string): JWTPayload | null {
    try {
      const parts = token.split('.');
      if (parts.length !== 3) return null;

      const [header, body, signature] = parts;
      const expectedSignature = crypto
        .createHmac('sha256', this.jwtSecret)
        .update(`${header}.${body}`)
        .digest('base64url');

      if (signature !== expectedSignature) return null;

      const payload = JSON.parse(Buffer.from(body, 'base64url').toString());
      const now = Math.floor(Date.now() / 1000);

      if (payload.exp < now) return null;

      return payload as JWTPayload;
    } catch {
      return null;
    }
  }

  generateRefreshToken(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  validateRefreshToken(token: string): boolean {
    // In production, verify against stored token hash
    return token.length === 64; // 32 bytes as hex
  }
}

// ============================================================================
// Magic Link Authentication
// ============================================================================

interface MagicLinkToken {
  email: string;
  organizationId: string;
  expiresAt: Date;
  usedAt?: Date;
  code: string;
}

export class MagicLinkAuthenticator {
  private tokens = new Map<string, MagicLinkToken>();
  private tokenExpiryMinutes: number;

  constructor(tokenExpiryMinutes: number = 15) {
    this.tokenExpiryMinutes = tokenExpiryMinutes;
  }

  generateMagicLink(email: string, organizationId: string): string {
    const code = crypto.randomBytes(32).toString('hex');
    const token: MagicLinkToken = {
      email,
      organizationId,
      expiresAt: new Date(Date.now() + this.tokenExpiryMinutes * 60 * 1000),
      code,
    };

    this.tokens.set(code, token);
    return code;
  }

  verifyMagicLink(code: string): MagicLinkToken | null {
    const token = this.tokens.get(code);

    if (!token) return null;
    if (token.expiresAt < new Date()) return null;
    if (token.usedAt) return null; // Already used

    token.usedAt = new Date();
    return token;
  }

  cleanupExpiredTokens(): void {
    const now = new Date();
    for (const [code, token] of this.tokens.entries()) {
      if (token.expiresAt < now) {
        this.tokens.delete(code);
      }
    }
  }
}

// ============================================================================
// TOTP (Time-based One-Time Password) 2FA
// ============================================================================

export class TOTPAuthenticator {
  private windowSize: number = 1; // Allow time window of ±1 step

  generateSecret(): string {
    // Generate a base32-encoded secret (32 bytes)
    return crypto.randomBytes(32).toString('base64');
  }

  generateTOTPCode(secret: string): string {
    const now = Math.floor(Date.now() / 1000);
    const timeStep = Math.floor(now / 30); // 30-second time steps
    const message = Buffer.alloc(8);

    for (let i = 7; i >= 0; i--) {
      message[i] = timeStep & 0xff;
      timeStep >>= 8;
    }

    const hmac = crypto.createHmac('sha1', Buffer.from(secret, 'base64'));
    hmac.update(message);
    const digest = hmac.digest();

    const offset = digest[digest.length - 1] & 0xf;
    const code = (digest.readUInt32BE(offset) & 0x7fffffff) % 1000000;

    return code.toString().padStart(6, '0');
  }

  verifyTOTPCode(secret: string, code: string): boolean {
    const currentCode = this.generateTOTPCode(secret);
    const now = Math.floor(Date.now() / 1000);
    const timeStep = Math.floor(now / 30);

    // Check current and adjacent time steps
    for (let i = -this.windowSize; i <= this.windowSize; i++) {
      const checkTimeStep = timeStep + i;
      const message = Buffer.alloc(8);

      for (let j = 7; j >= 0; j--) {
        message[j] = checkTimeStep & 0xff;
        checkTimeStep >>= 8;
      }

      const hmac = crypto.createHmac('sha1', Buffer.from(secret, 'base64'));
      hmac.update(message);
      const digest = hmac.digest();

      const offset = digest[digest.length - 1] & 0xf;
      const checkCode = (digest.readUInt32BE(offset) & 0x7fffffff) % 1000000;
      const checkCodeStr = checkCode.toString().padStart(6, '0');

      if (checkCodeStr === code) return true;
    }

    return false;
  }

  generateBackupCodes(count: number = 10): string[] {
    const codes: string[] = [];
    for (let i = 0; i < count; i++) {
      codes.push(crypto.randomBytes(4).toString('hex').toUpperCase());
    }
    return codes;
  }

  generateQRCodeURL(email: string, secret: string, appName: string = 'TaxSense AI'): string {
    const encodedEmail = encodeURIComponent(email);
    const encodedSecret = encodeURIComponent(secret);
    return `otpauth://totp/${appName}:${encodedEmail}?secret=${encodedSecret}&issuer=${appName}`;
  }
}

// ============================================================================
// Biometric Authentication
// ============================================================================

export interface BiometricCredential {
  userId: string;
  type: 'fingerprint' | 'face' | 'iris';
  template: string; // Encrypted biometric template
  deviceId: string;
  enrolledAt: Date;
  enabled: boolean;
}

export class BiometricAuthenticator {
  // In production, integrate with WebAuthn/FIDO2
  verifyBiometric(credential: BiometricCredential, sampleData: string): boolean {
    // Placeholder for biometric verification
    // Real implementation would use FIDO2/WebAuthn or similar
    return credential.enabled && sampleData.length > 0;
  }

  registerBiometric(userId: string, type: 'fingerprint' | 'face' | 'iris', deviceId: string): BiometricCredential {
    return {
      userId,
      type,
      template: crypto.randomBytes(256).toString('base64'), // Encrypted template
      deviceId,
      enrolledAt: new Date(),
      enabled: true,
    };
  }
}

// ============================================================================
// OAuth2 Configuration
// ============================================================================

export interface OAuth2Config {
  provider: AuthProvider.Google | AuthProvider.Microsoft | AuthProvider.GitHub;
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  scopes: string[];
}

export class OAuth2Manager {
  private configs: Map<string, OAuth2Config> = new Map();

  registerProvider(config: OAuth2Config): void {
    this.configs.set(config.provider, config);
  }

  getAuthorizationUrl(provider: AuthProvider, state: string): string {
    const config = this.configs.get(provider);
    if (!config) throw new Error(`OAuth2 provider not configured: ${provider}`);

    const params = new URLSearchParams({
      client_id: config.clientId,
      redirect_uri: config.redirectUri,
      scope: config.scopes.join(' '),
      response_type: 'code',
      state,
    });

    const baseUrls: Record<string, string> = {
      [AuthProvider.Google]: 'https://accounts.google.com/o/oauth2/v2/auth',
      [AuthProvider.Microsoft]: 'https://login.microsoftonline.com/common/oauth2/v2.0/authorize',
      [AuthProvider.GitHub]: 'https://github.com/login/oauth/authorize',
    };

    return `${baseUrls[provider]}?${params.toString()}`;
  }

  async exchangeCodeForToken(provider: AuthProvider, code: string): Promise<string> {
    const config = this.configs.get(provider);
    if (!config) throw new Error(`OAuth2 provider not configured: ${provider}`);

    // In production, make actual HTTP request to provider's token endpoint
    const tokenEndpoints: Record<string, string> = {
      [AuthProvider.Google]: 'https://oauth2.googleapis.com/token',
      [AuthProvider.Microsoft]: 'https://login.microsoftonline.com/common/oauth2/v2.0/token',
      [AuthProvider.GitHub]: 'https://github.com/login/oauth/access_token',
    };

    // Placeholder for actual implementation
    return `token_${crypto.randomBytes(16).toString('hex')}`;
  }
}

// ============================================================================
// Login Attempt Tracking
// ============================================================================

export class LoginAttemptTracker {
  private attempts: LoginAttempt[] = [];
  private maxAttemptsPerWindow: number;
  private windowMinutes: number;

  constructor(maxAttemptsPerWindow: number = 5, windowMinutes: number = 15) {
    this.maxAttemptsPerWindow = maxAttemptsPerWindow;
    this.windowMinutes = windowMinutes;
  }

  recordAttempt(
    email: string,
    ipAddress: string,
    userAgent: string,
    provider: AuthProvider,
    success: boolean,
    reason?: string,
    organizationId?: string
  ): LoginAttempt {
    const attempt: LoginAttempt = {
      id: crypto.randomUUID(),
      email,
      ipAddress,
      userAgent,
      provider,
      success,
      reason,
      timestamp: new Date(),
      organizationId,
    };

    this.attempts.push(attempt);
    return attempt;
  }

  getFailedAttempts(email: string, ipAddress: string): LoginAttempt[] {
    const windowStart = new Date(Date.now() - this.windowMinutes * 60 * 1000);

    return this.attempts.filter(
      (attempt) =>
        attempt.email === email &&
        attempt.ipAddress === ipAddress &&
        !attempt.success &&
        attempt.timestamp > windowStart
    );
  }

  isLocked(email: string, ipAddress: string): boolean {
    return this.getFailedAttempts(email, ipAddress).length >= this.maxAttemptsPerWindow;
  }

  cleanupOldAttempts(): void {
    const cutoff = new Date(Date.now() - this.windowMinutes * 60 * 1000);
    this.attempts = this.attempts.filter((attempt) => attempt.timestamp > cutoff);
  }
}
