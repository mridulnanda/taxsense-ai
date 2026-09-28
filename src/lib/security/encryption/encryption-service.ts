/**
 * Encryption & Secrets Management Service
 * AES-256-GCM encryption, key derivation, and secret rotation
 */

import crypto from 'crypto';
import { EncryptedField } from '../types';

export class EncryptionService {
  private masterKey: Buffer;
  private algorithm: string = 'aes-256-gcm';

  constructor(masterKey: string | Buffer) {
    if (typeof masterKey === 'string') {
      // Derive 256-bit key from master key using PBKDF2
      this.masterKey = crypto.pbkdf2Sync(masterKey, 'taxsense-salt', 100000, 32, 'sha512');
    } else {
      this.masterKey = masterKey;
    }

    if (this.masterKey.length !== 32) {
      throw new Error('Master key must be 32 bytes (256 bits)');
    }
  }

  /**
   * Encrypt sensitive data using AES-256-GCM
   */
  encrypt(plaintext: string): EncryptedField {
    // Generate random initialization vector
    const iv = crypto.randomBytes(16);

    // Create cipher
    const cipher = crypto.createCipheriv(this.algorithm, this.masterKey, iv);

    // Encrypt data
    let ciphertext = cipher.update(plaintext, 'utf8', 'hex');
    ciphertext += cipher.final('hex');

    // Get authentication tag
    const authTag = cipher.getAuthTag();

    return {
      iv: iv.toString('base64'),
      ciphertext,
      authTag: authTag.toString('base64'),
      algorithm: 'aes-256-gcm',
    };
  }

  /**
   * Decrypt AES-256-GCM encrypted data
   */
  decrypt(encrypted: EncryptedField): string {
    try {
      const iv = Buffer.from(encrypted.iv, 'base64');
      const authTag = Buffer.from(encrypted.authTag, 'base64');

      const decipher = crypto.createDecipheriv(this.algorithm, this.masterKey, iv);
      decipher.setAuthTag(authTag);

      let plaintext = decipher.update(encrypted.ciphertext, 'hex', 'utf8');
      plaintext += decipher.final('utf8');

      return plaintext;
    } catch (error) {
      throw new Error('Decryption failed - data may be corrupted or key incorrect');
    }
  }

  /**
   * Hash sensitive data (one-way)
   */
  hash(data: string, salt?: string): { hash: string; salt: string } {
    const hashSalt = salt || crypto.randomBytes(16).toString('hex');
    const hash = crypto
      .pbkdf2Sync(data, hashSalt, 100000, 64, 'sha512')
      .toString('hex');
    return { hash, salt: hashSalt };
  }

  /**
   * Verify hashed data
   */
  verifyHash(data: string, hash: string, salt: string): boolean {
    const { hash: computedHash } = this.hash(data, salt);
    return computedHash === hash;
  }

  /**
   * Generate a secure random key
   */
  generateKey(length: number = 32): string {
    return crypto.randomBytes(length).toString('hex');
  }

  /**
   * Derive key from password using PBKDF2
   */
  deriveKey(password: string, salt?: string, iterations: number = 100000): { key: string; salt: string } {
    const keySalt = salt || crypto.randomBytes(16).toString('hex');
    const key = crypto
      .pbkdf2Sync(password, keySalt, iterations, 32, 'sha512')
      .toString('hex');
    return { key, salt: keySalt };
  }

  /**
   * Generate RSA key pair for asymmetric encryption
   */
  generateRSAKeyPair(): { publicKey: string; privateKey: string } {
    const { privateKey, publicKey } = crypto.generateKeyPairSync('rsa', {
      modulusLength: 4096,
      publicKeyEncoding: {
        type: 'spki',
        format: 'pem',
      },
      privateKeyEncoding: {
        type: 'pkcs8',
        format: 'pem',
      },
    });

    return { publicKey, privateKey };
  }

  /**
   * Encrypt with RSA public key
   */
  encryptRSA(publicKey: string, plaintext: string): string {
    const encrypted = crypto.publicEncrypt(
      {
        key: publicKey,
        padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
      },
      Buffer.from(plaintext, 'utf8')
    );
    return encrypted.toString('base64');
  }

  /**
   * Decrypt with RSA private key
   */
  decryptRSA(privateKey: string, ciphertext: string): string {
    const decrypted = crypto.privateDecrypt(
      {
        key: privateKey,
        padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
      },
      Buffer.from(ciphertext, 'base64')
    );
    return decrypted.toString('utf8');
  }

  /**
   * Sign data with HMAC
   */
  sign(data: string, secret?: string): string {
    const signSecret = secret || this.masterKey.toString('hex');
    return crypto
      .createHmac('sha256', signSecret)
      .update(data)
      .digest('hex');
  }

  /**
   * Verify HMAC signature
   */
  verifySignature(data: string, signature: string, secret?: string): boolean {
    const expectedSignature = this.sign(data, secret);
    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedSignature)
    );
  }
}

// ============================================================================
// Secrets Manager
// ============================================================================

export interface Secret {
  id: string;
  name: string;
  type: 'api_key' | 'database_password' | 'jwt_secret' | 'encryption_key' | 'oauth_secret';
  value: EncryptedField;
  metadata: Record<string, any>;
  createdAt: Date;
  rotatedAt?: Date;
  expiresAt?: Date;
  version: number;
}

export class SecretsManager {
  private encryptionService: EncryptionService;
  private secrets: Map<string, Secret> = new Map();

  constructor(encryptionService: EncryptionService) {
    this.encryptionService = encryptionService;
  }

  /**
   * Store a secret (encrypted)
   */
  storeSecret(
    id: string,
    name: string,
    type: Secret['type'],
    value: string,
    metadata: Record<string, any> = {}
  ): Secret {
    const encrypted = this.encryptionService.encrypt(value);
    const secret: Secret = {
      id,
      name,
      type,
      value: encrypted,
      metadata,
      createdAt: new Date(),
      version: 1,
    };

    this.secrets.set(id, secret);
    return secret;
  }

  /**
   * Retrieve a secret (decrypted)
   */
  getSecret(id: string): string | null {
    const secret = this.secrets.get(id);
    if (!secret) return null;

    return this.encryptionService.decrypt(secret.value);
  }

  /**
   * Rotate a secret
   */
  rotateSecret(id: string, newValue: string): Secret | null {
    const secret = this.secrets.get(id);
    if (!secret) return null;

    const encrypted = this.encryptionService.encrypt(newValue);
    secret.value = encrypted;
    secret.rotatedAt = new Date();
    secret.version += 1;

    this.secrets.set(id, secret);
    return secret;
  }

  /**
   * Delete a secret
   */
  deleteSecret(id: string): boolean {
    return this.secrets.delete(id);
  }

  /**
   * List all secrets (without values)
   */
  listSecrets(): Array<Omit<Secret, 'value'>> {
    return Array.from(this.secrets.values()).map(({ value, ...secret }) => secret);
  }

  /**
   * Export secret for backup (encrypted)
   */
  exportSecret(id: string): Secret | null {
    return this.secrets.get(id) || null;
  }

  /**
   * Import secret from backup
   */
  importSecret(secret: Secret): void {
    this.secrets.set(secret.id, secret);
  }
}

// ============================================================================
// API Key Manager
// ============================================================================

export interface APIKey {
  id: string;
  name: string;
  keyHash: string; // Hashed for storage
  keySalt: string;
  organizationId: string;
  createdBy: string;
  createdAt: Date;
  lastUsedAt?: Date;
  expiresAt?: Date;
  scopes: string[]; // e.g., ['read:reports', 'write:data']
  enabled: boolean;
  rateLimit?: number; // Requests per minute
}

export class APIKeyManager {
  private encryptionService: EncryptionService;
  private keys: Map<string, APIKey> = new Map();

  constructor(encryptionService: EncryptionService) {
    this.encryptionService = encryptionService;
  }

  /**
   * Generate a new API key
   */
  generateAPIKey(
    name: string,
    organizationId: string,
    createdBy: string,
    scopes: string[],
    expiresAt?: Date,
    rateLimit?: number
  ): { id: string; key: string; secret: APIKey } {
    const keyId = crypto.randomUUID();
    const keyValue = `sk_${crypto.randomBytes(32).toString('hex')}`;

    const { hash, salt } = this.encryptionService.hash(keyValue);

    const apiKey: APIKey = {
      id: keyId,
      name,
      keyHash: hash,
      keySalt: salt,
      organizationId,
      createdBy,
      createdAt: new Date(),
      scopes,
      enabled: true,
      expiresAt,
      rateLimit,
    };

    this.keys.set(keyId, apiKey);
    return { id: keyId, key: keyValue, secret: apiKey };
  }

  /**
   * Validate an API key
   */
  validateAPIKey(keyId: string, keyValue: string): APIKey | null {
    const apiKey = this.keys.get(keyId);

    if (!apiKey) return null;
    if (!apiKey.enabled) return null;
    if (apiKey.expiresAt && apiKey.expiresAt < new Date()) return null;

    // Verify hash
    if (!this.encryptionService.verifyHash(keyValue, apiKey.keyHash, apiKey.keySalt)) {
      return null;
    }

    // Update last used
    apiKey.lastUsedAt = new Date();
    return apiKey;
  }

  /**
   * Revoke an API key
   */
  revokeAPIKey(keyId: string): boolean {
    const apiKey = this.keys.get(keyId);
    if (!apiKey) return false;

    apiKey.enabled = false;
    return true;
  }

  /**
   * Check API key scope
   */
  hasScope(apiKey: APIKey, requiredScope: string): boolean {
    if (apiKey.scopes.includes('*')) return true; // Admin key
    return apiKey.scopes.includes(requiredScope);
  }

  /**
   * List keys for organization (without hashes)
   */
  listKeys(organizationId: string): Array<Omit<APIKey, 'keyHash' | 'keySalt'>> {
    return Array.from(this.keys.values())
      .filter((key) => key.organizationId === organizationId)
      .map(({ keyHash, keySalt, ...key }) => key);
  }
}

// ============================================================================
// TLS Certificate Management
// ============================================================================

export interface TLSCertificate {
  id: string;
  domain: string;
  certificate: string; // PEM format
  privateKey: string; // PEM format (encrypted)
  issuer: string;
  issuedAt: Date;
  expiresAt: Date;
  autoRenew: boolean;
}

export class TLSCertificateManager {
  private encryptionService: EncryptionService;
  private certificates: Map<string, TLSCertificate> = new Map();

  constructor(encryptionService: EncryptionService) {
    this.encryptionService = encryptionService;
  }

  /**
   * Store TLS certificate
   */
  storeCertificate(
    id: string,
    domain: string,
    certificate: string,
    privateKey: string,
    issuer: string,
    expiresAt: Date,
    autoRenew: boolean = true
  ): TLSCertificate {
    // Encrypt private key
    const encryptedPrivateKey = this.encryptionService.encrypt(privateKey).ciphertext;

    const tlsCert: TLSCertificate = {
      id,
      domain,
      certificate,
      privateKey: encryptedPrivateKey,
      issuer,
      issuedAt: new Date(),
      expiresAt,
      autoRenew,
    };

    this.certificates.set(id, tlsCert);
    return tlsCert;
  }

  /**
   * Get certificate for domain
   */
  getCertificate(domain: string): TLSCertificate | null {
    for (const cert of this.certificates.values()) {
      if (cert.domain === domain && cert.expiresAt > new Date()) {
        return cert;
      }
    }
    return null;
  }

  /**
   * Check expiring certificates
   */
  getExpiringCertificates(daysUntilExpiry: number = 30): TLSCertificate[] {
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + daysUntilExpiry);

    return Array.from(this.certificates.values()).filter(
      (cert) => cert.expiresAt <= expiryDate && cert.expiresAt > new Date()
    );
  }
}
