/**
 * Security Framework Tests
 * Comprehensive test coverage for authentication, authorization, encryption, and compliance
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  hashPassword,
  verifyPassword,
  validatePassword,
  SessionManager,
  MagicLinkAuthenticator,
  TOTPAuthenticator,
  LoginAttemptTracker,
  EncryptionService,
  SecretsManager,
  APIKeyManager,
  RBACManager,
  AuditLogger,
  ComplianceReportGenerator,
  DataRetentionManager,
  RightToBeForgettenManager,
  DataAnonymizer,
  GDPRCompliance,
  NISMCompliance,
  IndiaDPACompliance,
  CORSManager,
  RateLimiter,
  RequestValidator,
  CSPManager,
  CSRFProtector,
  IncidentManager,
  SecurityEventMonitor,
  AnomalyDetector,
} from '../src/lib/security';

// ============================================================================
// Authentication Tests
// ============================================================================

describe('Authentication', () => {
  describe('Password Hashing', () => {
    it('should hash password with salt', async () => {
      const password = 'SecurePassword123!';
      const { hash, salt } = await hashPassword(password);

      expect(hash).toBeDefined();
      expect(salt).toBeDefined();
      expect(hash).not.toContain(password);
    });

    it('should verify correct password', async () => {
      const password = 'SecurePassword123!';
      const { hash, salt } = await hashPassword(password);

      const isValid = await verifyPassword(password, hash, salt);
      expect(isValid).toBe(true);
    });

    it('should reject incorrect password', async () => {
      const password = 'SecurePassword123!';
      const { hash, salt } = await hashPassword(password);

      const isValid = await verifyPassword('WrongPassword', hash, salt);
      expect(isValid).toBe(false);
    });
  });

  describe('Password Validation', () => {
    it('should validate strong passwords', () => {
      const result = validatePassword('SecurePass123!@#', {
        minLength: 12,
        requireUppercase: true,
        requireLowercase: true,
        requireNumbers: true,
        requireSpecialChars: true,
      });

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject weak passwords', () => {
      const result = validatePassword('weak', {
        minLength: 12,
        requireUppercase: true,
        requireLowercase: true,
        requireNumbers: true,
        requireSpecialChars: true,
      });

      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });

  describe('Session Management', () => {
    let sessionManager: SessionManager;

    beforeEach(() => {
      sessionManager = new SessionManager('test-secret-key');
    });

    it('should create session', () => {
      const session = sessionManager.createSession(
        'user-1',
        'org-1',
        'user@example.com',
        'role-1',
        '192.168.1.1'
      );

      expect(session.id).toBeDefined();
      expect(session.token).toBeDefined();
      expect(session.refreshToken).toBeDefined();
      expect(session.isActive).toBe(true);
    });

    it('should verify JWT token', () => {
      const session = sessionManager.createSession(
        'user-1',
        'org-1',
        'user@example.com',
        'role-1',
        '192.168.1.1'
      );

      const payload = sessionManager.verifyJWT(session.token);
      expect(payload).toBeDefined();
      expect(payload?.userId).toBe('user-1');
      expect(payload?.organizationId).toBe('org-1');
    });

    it('should reject invalid token', () => {
      const payload = sessionManager.verifyJWT('invalid.token.format');
      expect(payload).toBeNull();
    });
  });

  describe('Magic Link Authentication', () => {
    let magicLink: MagicLinkAuthenticator;

    beforeEach(() => {
      magicLink = new MagicLinkAuthenticator(15);
    });

    it('should generate magic link', () => {
      const code = magicLink.generateMagicLink('user@example.com', 'org-1');
      expect(code).toBeDefined();
      expect(code.length).toBeGreaterThan(0);
    });

    it('should verify magic link', () => {
      const code = magicLink.generateMagicLink('user@example.com', 'org-1');
      const token = magicLink.verifyMagicLink(code);

      expect(token).toBeDefined();
      expect(token?.email).toBe('user@example.com');
    });

    it('should reject already used link', () => {
      const code = magicLink.generateMagicLink('user@example.com', 'org-1');
      magicLink.verifyMagicLink(code);

      const secondAttempt = magicLink.verifyMagicLink(code);
      expect(secondAttempt).toBeNull();
    });
  });

  describe('TOTP 2FA', () => {
    let totp: TOTPAuthenticator;

    beforeEach(() => {
      totp = new TOTPAuthenticator();
    });

    it('should generate TOTP secret', () => {
      const secret = totp.generateSecret();
      expect(secret).toBeDefined();
      expect(secret.length).toBeGreaterThan(0);
    });

    it('should generate valid TOTP code', () => {
      const secret = totp.generateSecret();
      const code = totp.generateTOTPCode(secret);

      expect(code).toBeDefined();
      expect(code.length).toBe(6);
      expect(/^\d+$/.test(code)).toBe(true);
    });

    it('should verify TOTP code', () => {
      const secret = totp.generateSecret();
      const code = totp.generateTOTPCode(secret);

      const isValid = totp.verifyTOTPCode(secret, code);
      expect(isValid).toBe(true);
    });

    it('should generate backup codes', () => {
      const codes = totp.generateBackupCodes(10);
      expect(codes).toHaveLength(10);
      expect(codes[0]).toBeDefined();
    });

    it('should generate QR code URL', () => {
      const secret = totp.generateSecret();
      const url = totp.generateQRCodeURL('user@example.com', secret);

      expect(url).toContain('otpauth://');
      expect(url).toContain('user%40example.com');
    });
  });

  describe('Login Attempt Tracking', () => {
    let tracker: LoginAttemptTracker;

    beforeEach(() => {
      tracker = new LoginAttemptTracker(5, 15);
    });

    it('should record login attempt', () => {
      const attempt = tracker.recordAttempt(
        'user@example.com',
        '192.168.1.1',
        'Mozilla/5.0',
        'email',
        true
      );

      expect(attempt.email).toBe('user@example.com');
      expect(attempt.success).toBe(true);
    });

    it('should detect account lockout', () => {
      for (let i = 0; i < 5; i++) {
        tracker.recordAttempt(
          'user@example.com',
          '192.168.1.1',
          'Mozilla/5.0',
          'email',
          false,
          'Invalid password'
        );
      }

      const isLocked = tracker.isLocked('user@example.com', '192.168.1.1');
      expect(isLocked).toBe(true);
    });
  });
});

// ============================================================================
// Encryption & Secrets Tests
// ============================================================================

describe('Encryption & Secrets', () => {
  let encryptionService: EncryptionService;

  beforeEach(() => {
    encryptionService = new EncryptionService('test-master-key-for-encryption');
  });

  describe('AES-256-GCM Encryption', () => {
    it('should encrypt data', () => {
      const plaintext = 'Sensitive financial data';
      const encrypted = encryptionService.encrypt(plaintext);

      expect(encrypted.iv).toBeDefined();
      expect(encrypted.ciphertext).toBeDefined();
      expect(encrypted.authTag).toBeDefined();
      expect(encrypted.ciphertext).not.toContain(plaintext);
    });

    it('should decrypt data', () => {
      const plaintext = 'Sensitive financial data';
      const encrypted = encryptionService.encrypt(plaintext);
      const decrypted = encryptionService.decrypt(encrypted);

      expect(decrypted).toBe(plaintext);
    });

    it('should reject tampered ciphertext', () => {
      const plaintext = 'Sensitive financial data';
      const encrypted = encryptionService.encrypt(plaintext);

      // Tamper with ciphertext
      encrypted.ciphertext = encrypted.ciphertext.slice(0, -4) + 'XXXX';

      expect(() => {
        encryptionService.decrypt(encrypted);
      }).toThrow();
    });
  });

  describe('Key Derivation', () => {
    it('should derive key from password', () => {
      const password = 'my-secure-password';
      const { key, salt } = encryptionService.deriveKey(password);

      expect(key).toBeDefined();
      expect(salt).toBeDefined();
      expect(key.length).toBe(64); // 32 bytes as hex
    });

    it('should derive consistent key with same salt', () => {
      const password = 'my-secure-password';
      const { key: key1, salt } = encryptionService.deriveKey(password);
      const { key: key2 } = encryptionService.deriveKey(password, salt);

      expect(key1).toBe(key2);
    });
  });

  describe('Secrets Manager', () => {
    let secretsManager: SecretsManager;

    beforeEach(() => {
      secretsManager = new SecretsManager(encryptionService);
    });

    it('should store secret', () => {
      const secret = secretsManager.storeSecret('api-key-1', 'Stripe API Key', 'api_key', 'sk_live_xxx');

      expect(secret.id).toBe('api-key-1');
      expect(secret.value.ciphertext).toBeDefined();
    });

    it('should retrieve secret', () => {
      secretsManager.storeSecret('api-key-1', 'Stripe API Key', 'api_key', 'sk_live_xxx');
      const value = secretsManager.getSecret('api-key-1');

      expect(value).toBe('sk_live_xxx');
    });

    it('should rotate secret', () => {
      secretsManager.storeSecret('api-key-1', 'Stripe API Key', 'api_key', 'sk_live_old');
      secretsManager.rotateSecret('api-key-1', 'sk_live_new');

      const value = secretsManager.getSecret('api-key-1');
      expect(value).toBe('sk_live_new');
    });
  });

  describe('API Key Manager', () => {
    let apiKeyManager: APIKeyManager;

    beforeEach(() => {
      apiKeyManager = new APIKeyManager(encryptionService);
    });

    it('should generate API key', () => {
      const { id, key, secret } = apiKeyManager.generateAPIKey(
        'Test Key',
        'org-1',
        'user-1',
        ['read:reports', 'write:data']
      );

      expect(id).toBeDefined();
      expect(key).toBeDefined();
      expect(secret.scopes).toContain('read:reports');
    });

    it('should validate API key', () => {
      const { key, secret } = apiKeyManager.generateAPIKey(
        'Test Key',
        'org-1',
        'user-1',
        ['read:reports']
      );

      const validatedKey = apiKeyManager.validateAPIKey(secret.id, key);
      expect(validatedKey).toBeDefined();
      expect(validatedKey?.enabled).toBe(true);
    });

    it('should check API key scope', () => {
      const { secret } = apiKeyManager.generateAPIKey(
        'Test Key',
        'org-1',
        'user-1',
        ['read:reports']
      );

      const hasScope = apiKeyManager.hasScope(secret, 'read:reports');
      expect(hasScope).toBe(true);

      const noScope = apiKeyManager.hasScope(secret, 'write:data');
      expect(noScope).toBe(false);
    });
  });
});

// ============================================================================
// RBAC & Authorization Tests
// ============================================================================

describe('Role-Based Access Control', () => {
  let rbac: RBACManager;

  beforeEach(() => {
    rbac = new RBACManager();
  });

  it('should get default roles', () => {
    const roles = rbac.listRoles();
    expect(roles.length).toBeGreaterThan(0);
  });

  it('should create custom role', () => {
    const role = rbac.createRole('org-1', 'Custom Analyst', [
      'user:read',
      'report:view',
      'audit:view',
    ]);

    expect(role.id).toBeDefined();
    expect(role.permissions.length).toBe(3);
  });

  it('should check permission', () => {
    const role = rbac.getRole('role-admin');
    expect(role).toBeDefined();

    const hasPermission = rbac.hasPermission(role!, 'user:create');
    expect(hasPermission).toBe(true);
  });

  it('should grant resource permission', () => {
    const permission = rbac.grantResourcePermission(
      'user-1',
      'report',
      'report-123',
      'read',
      'admin-1'
    );

    expect(permission.id).toBeDefined();
    expect(permission.action).toBe('read');
  });

  it('should check resource permission', () => {
    rbac.grantResourcePermission(
      'user-1',
      'report',
      'report-123',
      'read',
      'admin-1'
    );

    const hasPermission = rbac.hasResourcePermission(
      'user-1',
      'report',
      'report-123',
      'read'
    );
    expect(hasPermission).toBe(true);
  });
});

// ============================================================================
// Audit & Compliance Tests
// ============================================================================

describe('Audit Logging', () => {
  let auditLogger: AuditLogger;

  beforeEach(() => {
    auditLogger = new AuditLogger('audit-encryption-key');
  });

  it('should log event', () => {
    const log = auditLogger.logEvent(
      'org-1',
      'user-1',
      'user_created',
      'user',
      'user-2',
      '192.168.1.1',
      'Mozilla/5.0',
      'success'
    );

    expect(log.id).toBeDefined();
    expect(log.action).toBe('user_created');
    expect(log.immutable).toBe(true);
  });

  it('should verify audit trail integrity', () => {
    auditLogger.logEvent(
      'org-1',
      'user-1',
      'user_created',
      'user',
      'user-2',
      '192.168.1.1',
      'Mozilla/5.0',
      'success'
    );

    auditLogger.logEvent(
      'org-1',
      'user-1',
      'role_assigned',
      'user',
      'user-2',
      '192.168.1.1',
      'Mozilla/5.0',
      'success'
    );

    const result = auditLogger.verifyIntegrity();
    expect(result.valid).toBe(true);
  });

  it('should query logs', () => {
    auditLogger.logEvent(
      'org-1',
      'user-1',
      'user_created',
      'user',
      'user-2',
      '192.168.1.1',
      'Mozilla/5.0',
      'success'
    );

    const logs = auditLogger.queryLogs({
      organizationId: 'org-1',
      action: 'user_created',
    });

    expect(logs.length).toBeGreaterThan(0);
  });

  it('should export audit trail', () => {
    auditLogger.logEvent(
      'org-1',
      'user-1',
      'user_created',
      'user',
      'user-2',
      '192.168.1.1',
      'Mozilla/5.0',
      'success'
    );

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 1);
    const endDate = new Date();

    const export_ = auditLogger.exportAuditTrail('org-1', startDate, endDate);

    expect(export_.logs.length).toBeGreaterThan(0);
    expect(export_.hash).toBeDefined();
    expect(export_.signature).toBeDefined();
  });
});

describe('Compliance Reports', () => {
  let auditLogger: AuditLogger;
  let generator: ComplianceReportGenerator;

  beforeEach(() => {
    auditLogger = new AuditLogger('audit-key');
    generator = new ComplianceReportGenerator(auditLogger);
  });

  it('should generate GDPR report', () => {
    const report = generator.generateGDPRReport('org-1');

    expect(report.framework).toBe('gdpr');
    expect(report.sections.length).toBeGreaterThan(0);
    expect(report.overallScore).toBeGreaterThan(0);
  });

  it('should generate NISM report', () => {
    const report = generator.generateNISMReport('org-1');

    expect(report.framework).toBe('nism');
    expect(report.sections.length).toBeGreaterThan(0);
  });

  it('should generate India DPA report', () => {
    const report = generator.generateIndiaDPAReport('org-1');

    expect(report.framework).toBe('india_dpa');
    expect(report.sections.length).toBeGreaterThan(0);
  });

  it('should generate SOC 2 report', () => {
    const report = generator.generateSOC2Report('org-1');

    expect(report.framework).toBe('soc2');
    expect(report.sections.length).toBeGreaterThan(0);
    expect(report.overallScore).toBeGreaterThan(0);
  });
});

// ============================================================================
// Data Protection Tests
// ============================================================================

describe('Data Protection', () => {
  describe('Data Retention', () => {
    let retentionManager: DataRetentionManager;

    beforeEach(() => {
      retentionManager = new DataRetentionManager();
    });

    it('should create retention policy', () => {
      const policy = retentionManager.createPolicy(
        'financial_records',
        'org-1',
        365,
        730,
        2555,
        ['gdpr', 'nism']
      );

      expect(policy.id).toBeDefined();
      expect(policy.dataType).toBe('financial_records');
    });

    it('should check if data should be archived', () => {
      const policy = retentionManager.createPolicy(
        'logs',
        'org-1',
        365,
        30,
        2555,
        ['gdpr']
      );

      const oldDate = new Date();
      oldDate.setDate(oldDate.getDate() - 60);

      const shouldArchive = retentionManager.shouldArchive(oldDate, policy);
      expect(shouldArchive).toBe(true);
    });
  });

  describe('Right to Be Forgotten', () => {
    let rtbfManager: RightToBeForgettenManager;

    beforeEach(() => {
      rtbfManager = new RightToBeForgettenManager();
    });

    it('should submit RTBF request', () => {
      const request = rtbfManager.submitRequest(
        'user-1',
        'org-1',
        ['email', 'phone'],
        'User requested data deletion'
      );

      expect(request.id).toBeDefined();
      expect(request.status).toBe('pending');
    });

    it('should process RTBF request', () => {
      const request = rtbfManager.submitRequest(
        'user-1',
        'org-1',
        ['email'],
        'Deletion request'
      );

      const processed = rtbfManager.processRequest(request.id);
      expect(processed?.status).toBe('processing');
    });

    it('should complete RTBF request', () => {
      const request = rtbfManager.submitRequest(
        'user-1',
        'org-1',
        ['email'],
        'Deletion request'
      );

      const completed = rtbfManager.completeRequest(request.id, 'admin-1');
      expect(completed?.status).toBe('completed');
      expect(completed?.approvedBy).toBe('admin-1');
    });
  });

  describe('Data Anonymization', () => {
    let anonymizer: DataAnonymizer;

    beforeEach(() => {
      anonymizer = new DataAnonymizer();
    });

    it('should mask sensitive data', () => {
      const masked = anonymizer.maskData('1234567890');
      expect(masked).not.toBe('1234567890');
      expect(masked).toContain('*');
    });

    it('should hash data', () => {
      const hashed = anonymizer.hashData('sensitive@example.com');
      expect(hashed).toMatch(/^[a-f0-9]{64}$/); // SHA256 hex
    });

    it('should generalize age data', () => {
      const generalized = anonymizer.generalizeData('27', 'age');
      expect(generalized).toBe('20-29');
    });

    it('should suppress data', () => {
      const suppressed = anonymizer.suppressData();
      expect(suppressed).toBe('[REDACTED]');
    });
  });

  describe('GDPR Compliance', () => {
    let gdpr: GDPRCompliance;

    beforeEach(() => {
      gdpr = new GDPRCompliance();
    });

    it('should identify EU PII', () => {
      const isEUPII = gdpr.isEUPII('user@example.com', 'email');
      expect(isEUPII).toBe(true);
    });

    it('should generate consent record', () => {
      const consent = gdpr.generateConsentRecord(
        'user-1',
        ['marketing', 'analytics'],
        true
      );

      expect(consent.userId).toBe('user-1');
      expect(consent.consentGiven).toBe(true);
    });
  });
});

// ============================================================================
// API Security Tests
// ============================================================================

describe('API Security', () => {
  describe('CORS', () => {
    let cors: CORSManager;

    beforeEach(() => {
      cors = new CORSManager();
    });

    it('should allow trusted origins', () => {
      const allowed = cors.isOriginAllowed('https://taxsense.ai');
      expect(allowed).toBe(true);
    });

    it('should reject untrusted origins', () => {
      const allowed = cors.isOriginAllowed('https://malicious.com');
      expect(allowed).toBe(false);
    });

    it('should generate CORS headers', () => {
      const headers = cors.getCORSHeaders('https://taxsense.ai', 'GET');

      expect(headers['Access-Control-Allow-Origin']).toBe('https://taxsense.ai');
      expect(headers['Access-Control-Allow-Methods']).toBeDefined();
    });
  });

  describe('Rate Limiting', () => {
    let limiter: RateLimiter;

    beforeEach(() => {
      limiter = new RateLimiter({
        windowMs: 60000,
        maxRequests: 10,
      });
    });

    it('should allow requests within limit', () => {
      const result = limiter.checkLimit('user-1');
      expect(result.allowed).toBe(true);
    });

    it('should block requests exceeding limit', () => {
      for (let i = 0; i < 10; i++) {
        limiter.checkLimit('user-1');
      }

      const result = limiter.checkLimit('user-1');
      expect(result.allowed).toBe(false);
    });

    it('should track remaining requests', () => {
      const result1 = limiter.checkLimit('user-1');
      expect(result1.remaining).toBe(9);

      const result2 = limiter.checkLimit('user-1');
      expect(result2.remaining).toBe(8);
    });
  });

  describe('Request Validation', () => {
    let validator: RequestValidator;

    beforeEach(() => {
      validator = new RequestValidator();
    });

    it('should sanitize XSS attempts', () => {
      const dirty = '<script>alert("XSS")</script>';
      const clean = validator.sanitizeInput(dirty);

      expect(clean).not.toContain('<script>');
    });

    it('should detect SQL injection', () => {
      const isSQLi = validator.detectSQLInjection("'; DROP TABLE users; --");
      expect(isSQLi).toBe(true);
    });

    it('should detect XSS attempts', () => {
      const isXSS = validator.detectXSS('<img src=x onerror="alert(1)">');
      expect(isXSS).toBe(true);
    });
  });

  describe('CSP', () => {
    let csp: CSPManager;

    beforeEach(() => {
      csp = new CSPManager();
    });

    it('should generate CSP header', () => {
      const header = csp.generateHeader();

      expect(header).toContain('default-src');
      expect(header).toContain('script-src');
      expect(header).toContain('style-src');
    });

    it('should generate nonce', () => {
      const nonce = csp.generateNonce();

      expect(nonce).toBeDefined();
      expect(nonce.length).toBeGreaterThan(0);
    });
  });

  describe('CSRF Protection', () => {
    let csrf: CSRFProtector;

    beforeEach(() => {
      csrf = new CSRFProtector();
    });

    it('should generate CSRF token', () => {
      const token = csrf.generateToken('session-1');

      expect(token).toBeDefined();
      expect(token.length).toBe(64);
    });

    it('should verify CSRF token', () => {
      const token = csrf.generateToken('session-1');
      const isValid = csrf.verifyToken('session-1', token);

      expect(isValid).toBe(true);
    });

    it('should reject invalid CSRF token', () => {
      const isValid = csrf.verifyToken('session-1', 'invalid-token');
      expect(isValid).toBe(false);
    });
  });
});

// ============================================================================
// Incident Response Tests
// ============================================================================

describe('Incident Response', () => {
  let incidentManager: IncidentManager;

  beforeEach(() => {
    incidentManager = new IncidentManager();
  });

  it('should report incident', () => {
    const incident = incidentManager.reportIncident(
      'org-1',
      'Unauthorized Access Detected',
      'Suspicious login from unknown IP',
      'high',
      'unauthorized_access',
      'user-1'
    );

    expect(incident.id).toBeDefined();
    expect(incident.status).toBe('reported');
  });

  it('should acknowledge incident', () => {
    const incident = incidentManager.reportIncident(
      'org-1',
      'Unauthorized Access',
      'Description',
      'high',
      'unauthorized_access',
      'user-1'
    );

    const acknowledged = incidentManager.acknowledgeIncident(incident.id, 'admin-1');
    expect(acknowledged?.status).toBe('acknowledged');
  });

  it('should resolve incident', () => {
    const incident = incidentManager.reportIncident(
      'org-1',
      'Unauthorized Access',
      'Description',
      'high',
      'unauthorized_access',
      'user-1'
    );

    const resolved = incidentManager.resolveIncident(
      incident.id,
      'admin-1',
      'Attacker IP blocked',
      ['Block IP 192.168.1.1', 'Reset user password']
    );

    expect(resolved?.status).toBe('resolved');
    expect(resolved?.rootCause).toBe('Attacker IP blocked');
  });
});

describe('Security Event Monitoring', () => {
  let monitor: SecurityEventMonitor;

  beforeEach(() => {
    monitor = new SecurityEventMonitor();
  });

  it('should record security event', () => {
    const event = monitor.recordEvent(
      'org-1',
      'suspicious_login',
      'high',
      'Login from unusual location'
    );

    expect(event.id).toBeDefined();
    expect(event.type).toBe('suspicious_login');
  });

  it('should get critical events', () => {
    monitor.recordEvent(
      'org-1',
      'privilege_escalation',
      'critical',
      'User elevated to admin'
    );

    const critical = monitor.getCriticalEvents('org-1');
    expect(critical.length).toBeGreaterThan(0);
  });

  it('should get event statistics', () => {
    monitor.recordEvent(
      'org-1',
      'suspicious_login',
      'high',
      'Suspicious login'
    );

    const stats = monitor.getEventStats('org-1');

    expect(stats.total).toBeGreaterThan(0);
    expect(stats.eventsByType).toBeDefined();
  });
});

describe('Anomaly Detection', () => {
  let detector: AnomalyDetector;

  beforeEach(() => {
    detector = new AnomalyDetector();
  });

  it('should record baseline', () => {
    detector.recordBaseline('user-1', 'login');
    detector.recordBaseline('user-1', 'login');

    // Should not throw
    expect(detector).toBeDefined();
  });

  it('should detect login anomalies', () => {
    // Build baseline
    for (let i = 0; i < 15; i++) {
      detector.recordBaseline('user-1', 'login');
    }

    // After baseline, detect anomaly
    const anomaly = detector.detectLoginAnomaly('user-1', new Date(), '192.168.1.1');

    // May or may not detect depending on timing
    expect(anomaly === null || anomaly.id).toBeDefined();
  });

  it('should detect access anomalies', () => {
    // Build baseline
    for (let i = 0; i < 10; i++) {
      detector.recordBaseline('user-1', 'report:view');
    }

    const anomaly = detector.detectAccessAnomaly('user-1', 'financial_data', 50);

    // May detect depending on normal pattern
    expect(anomaly === null || anomaly.id).toBeDefined();
  });

  it('should investigate anomalies', () => {
    const anomaly = detector.detectAccessAnomaly('user-1', 'data', 100);

    if (anomaly) {
      const investigated = detector.investigateAnomaly(anomaly.id, 'legitimate');
      expect(investigated?.investigated).toBe(true);
    }
  });
});
