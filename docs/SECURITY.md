# TaxSense AI Security & Compliance Framework

Enterprise-grade security framework for TaxSense AI ensuring compliance with GDPR, NISM (SEBI), and India DPA regulations. Comprehensive audit trail, encryption at rest and in transit, and continuous security monitoring.

## Table of Contents

1. [Architecture](#architecture)
2. [Authentication & Authorization](#authentication--authorization)
3. [Encryption & Secrets Management](#encryption--secrets-management)
4. [Data Protection & Compliance](#data-protection--compliance)
5. [Audit & Compliance Reporting](#audit--compliance-reporting)
6. [API Security](#api-security)
7. [Incident Response](#incident-response)
8. [Security Monitoring](#security-monitoring)
9. [Implementation Guide](#implementation-guide)
10. [Security Checklist](#security-checklist)

## Architecture

### Security Framework Components

```
┌─────────────────────────────────────────────────────────┐
│            TaxSense AI Security Framework                │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  ┌──────────────────────────────────────────────────┐   │
│  │  Authentication & Authorization                  │   │
│  │  • OAuth2, Magic Links, TOTP, Biometric         │   │
│  │  • RBAC with 5 role levels & 50+ permissions    │   │
│  │  • Session management & IP whitelisting         │   │
│  └──────────────────────────────────────────────────┘   │
│                                                          │
│  ┌──────────────────────────────────────────────────┐   │
│  │  Encryption & Secrets Management                 │   │
│  │  • AES-256-GCM encryption                        │   │
│  │  • TLS 1.3 for transport                         │   │
│  │  • AWS Secrets Manager integration               │   │
│  │  • API key rotation                              │   │
│  └──────────────────────────────────────────────────┘   │
│                                                          │
│  ┌──────────────────────────────────────────────────┐   │
│  │  Data Protection & Compliance                    │   │
│  │  • GDPR compliance utilities                     │   │
│  │  • NISM (SEBI) compliance                        │   │
│  │  • India DPA compliance                          │   │
│  │  • Data anonymization & retention                │   │
│  └──────────────────────────────────────────────────┘   │
│                                                          │
│  ┌──────────────────────────────────────────────────┐   │
│  │  Audit & Compliance Reporting                    │   │
│  │  • Immutable audit trail (blockchain-like)       │   │
│  │  • Compliance report generation                  │   │
│  │  • SOC 2, GDPR, NISM, ISO 27001 readiness       │   │
│  └──────────────────────────────────────────────────┘   │
│                                                          │
│  ┌──────────────────────────────────────────────────┐   │
│  │  API Security                                    │   │
│  │  • CORS configuration                            │   │
│  │  • Rate limiting & throttling                    │   │
│  │  • Request validation (Zod)                      │   │
│  │  • XSS & CSRF protection                         │   │
│  │  • CSP headers                                   │   │
│  └──────────────────────────────────────────────────┘   │
│                                                          │
│  ┌──────────────────────────────────────────────────┐   │
│  │  Incident Response & Monitoring                  │   │
│  │  • Security event logging                        │   │
│  │  • Anomaly detection                             │   │
│  │  • Incident tracking & response                  │   │
│  │  • Real-time threat alerts                       │   │
│  └──────────────────────────────────────────────────┘   │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

## Authentication & Authorization

### Authentication Methods

#### 1. OAuth2 (Social Login)
- **Supported Providers**: Google, Microsoft, GitHub
- **Scopes**: `profile`, `email`, `openid`
- **Callback URL**: `/api/auth/callback/{provider}`

```typescript
const oauth2Manager = new OAuth2Manager();
oauth2Manager.registerProvider({
  provider: AuthProvider.Google,
  clientId: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  redirectUri: 'https://app.taxsense.ai/auth/callback',
  scopes: ['profile', 'email', 'openid'],
});

const authUrl = oauth2Manager.getAuthorizationUrl(AuthProvider.Google, state);
```

#### 2. Magic Link Authentication
- **Expiry**: 15 minutes
- **One-time use**: Links can only be used once
- **Email-based**: No password required

```typescript
const magicLink = new MagicLinkAuthenticator(15);
const code = magicLink.generateMagicLink('user@example.com', 'org-1');
// Send code via email: https://app.taxsense.ai/auth/magic-link?code={code}

const token = magicLink.verifyMagicLink(code);
```

#### 3. TOTP 2FA
- **Algorithm**: HMAC-SHA1
- **Time Step**: 30 seconds
- **Digits**: 6
- **Backup Codes**: 10 one-time use codes

```typescript
const totp = new TOTPAuthenticator();
const secret = totp.generateSecret();
const qrUrl = totp.generateQRCodeURL('user@example.com', secret);

// Verify code
const isValid = totp.verifyTOTPCode(secret, userCode);

// Generate backup codes
const backupCodes = totp.generateBackupCodes(10);
```

#### 4. Biometric Authentication
- **Supported Types**: Fingerprint, Face, Iris
- **Standards**: WebAuthn/FIDO2
- **Device-based**: No biometric data stored server-side

```typescript
const biometric = new BiometricAuthenticator();
const credential = biometric.registerBiometric('user-1', 'face', 'device-1');
const isValid = biometric.verifyBiometric(credential, sampleData);
```

### Authorization (RBAC)

#### Role Levels

| Level | Permissions | Use Cases |
|-------|-------------|-----------|
| **Super Admin** | All 54 permissions | System administration |
| **Admin** | 50 permissions (excluding critical destructive) | Organization admin |
| **Manager** | 25 permissions | Team management, reporting |
| **Analyst** | 12 permissions | Report generation, analysis |
| **Viewer** | 8 permissions | Read-only access |

#### Permission Categories (50+ Permissions)

1. **User Management** (8 perms)
   - `user:create`, `user:read`, `user:update`, `user:delete`
   - `user:disable`, `user:resetPassword`, `user:bulkImport`, `user:bulkExport`

2. **Role Management** (6 perms)
   - `role:create`, `role:read`, `role:update`, `role:delete`
   - `role:assign`, `role:revoke`

3. **Audit Logging** (6 perms)
   - `audit:view`, `audit:export`, `audit:delete`, `audit:search`
   - `audit:verify`, `audit:configure`

4. **Data Export** (6 perms)
   - `export:reports`, `export:financialData`, `export:userData`
   - `export:pii`, `export:bulkData`, `export:regulatoryReports`

5. **Report Generation** (6 perms)
   - `report:generate`, `report:view`, `report:modify`, `report:delete`
   - `report:schedule`, `report:share`

6. **Compliance Settings** (6 perms)
   - `compliance:view`, `compliance:configure`, `compliance:generateReport`
   - `compliance:managePolicy`, `compliance:audit`, `compliance:certify`

7. **Security Settings** (8 perms)
   - `security:configureAuth`, `security:configureMFA`, `security:manageKeys`
   - `security:manageSecrets`, `security:ipWhitelist`, `security:passwordPolicy`
   - `security:viewEvents`, `security:respondIncidents`

8. **Incident Management** (4 perms)
   - `incident:report`, `incident:manage`, `incident:investigate`, `incident:review`

9. **System Settings** (2 perms)
   - `system:configure`, `system:viewLogs`

10. **Financial Data** (2 perms)
    - `financial:read`, `financial:write`

#### Usage Example

```typescript
const rbac = new RBACManager();

// Get user role
const role = rbac.getRole('role-manager');

// Check permission
const canExportPII = rbac.hasPermission(role, 'export:pii');

// Check with MFA requirement
const userHasMFA = true;
const canManageSecrets = rbac.canPerformAction(
  role,
  'security:manageSecrets',
  userHasMFA
);

// Grant resource-level access
rbac.grantResourcePermission(
  'user-1',
  'report',
  'report-123',
  'read',
  'admin-1',
  expiresAt // Optional
);

// Check resource access
const hasAccess = rbac.hasResourcePermission(
  'user-1',
  'report',
  'report-123',
  'read'
);
```

### Session Management

```typescript
const sessionManager = new SessionManager('jwt-secret-key');

// Create session
const session = sessionManager.createSession(
  'user-1',
  'org-1',
  'user@example.com',
  'role-manager',
  '192.168.1.1',
  'Mozilla/5.0',
  'device-1'
);

// Verify JWT
const payload = sessionManager.verifyJWT(session.token);

// Generate refresh token
const refreshToken = sessionManager.generateRefreshToken();
```

### IP Whitelisting (Admin Access)

```typescript
// Allow admin access only from specific IPs
const whitelist = [
  { ipAddress: '203.0.113.1', roleRequired: RoleLevel.SuperAdmin },
  { ipAddress: '203.0.113.2', roleRequired: RoleLevel.Admin },
  { cidr: '198.51.100.0/24', roleRequired: RoleLevel.Manager },
];
```

## Encryption & Secrets Management

### AES-256-GCM Encryption

All sensitive data (PII, financial information) is encrypted with AES-256-GCM:

```typescript
const encryption = new EncryptionService(masterKey);

// Encrypt data
const encrypted = encryption.encrypt('user@example.com');
// {
//   iv: "base64-encoded-iv",
//   ciphertext: "hex-encoded-ciphertext",
//   authTag: "base64-encoded-auth-tag",
//   algorithm: "aes-256-gcm"
// }

// Decrypt data
const plaintext = encryption.decrypt(encrypted);
```

### Secrets Management

```typescript
const secretsManager = new SecretsManager(encryption);

// Store secret
const secret = secretsManager.storeSecret(
  'stripe-key-1',
  'Stripe API Key',
  'api_key',
  'sk_live_xxx'
);

// Retrieve secret
const key = secretsManager.getSecret('stripe-key-1');

// Rotate secret
secretsManager.rotateSecret('stripe-key-1', 'sk_live_yyy');

// List secrets (without values)
const secrets = secretsManager.listSecrets();
```

### API Key Management

```typescript
const apiKeyManager = new APIKeyManager(encryption);

// Generate API key
const { id, key, secret } = apiKeyManager.generateAPIKey(
  'Mobile App Key',
  'org-1',
  'user-1',
  ['read:reports', 'write:data'],
  expiresAt,
  100 // rate limit: 100 req/min
);

// Validate API key
const validatedKey = apiKeyManager.validateAPIKey(id, key);

// Check scope
const hasScope = apiKeyManager.hasScope(validatedKey, 'read:reports');

// Revoke key
apiKeyManager.revokeAPIKey(id);

// List organization keys
const keys = apiKeyManager.listKeys('org-1');
```

### Key Derivation

```typescript
// Derive key from password using PBKDF2
const { key, salt } = encryption.deriveKey(
  password,
  undefined, // generate new salt
  100000 // iterations
);

// Verify derived key
const { key: verifyKey } = encryption.deriveKey(password, salt, 100000);
// key === verifyKey
```

## Data Protection & Compliance

### GDPR Compliance

**Data Subject Rights Implementation:**

```typescript
const gdpr = new GDPRCompliance();

// Generate consent record
const consent = gdpr.generateConsentRecord(
  'user-1',
  ['marketing', 'analytics', 'profiling'],
  true, // consentGiven
  timestamp
);

// Generate data portability export (Article 20)
const export_ = gdpr.generateDataPortabilityExport({
  email: 'user@example.com',
  firstName: 'John',
  lastName: 'Doe',
  registeredAt: '2024-01-01',
  // ... all user data
});

// Validate DPA
const dpa = gdpr.validateDPA(dpaContent);
```

**Required Compliance Actions:**
- ✅ Data Processing Agreement (DPA) in place
- ✅ Right to access implementation
- ✅ Right to rectification
- ✅ Right to erasure (Right to be Forgotten)
- ✅ Right to data portability
- ✅ Privacy by design
- ✅ Data Protection Officer (DPO) notification
- ✅ Breach notification within 72 hours

### NISM (SEBI) Compliance

**Financial Data Security:**

```typescript
const nism = new NISMCompliance();

// Verify data is stored in India
const isLocalized = nism.verifyDataLocalization('IN-AP'); // Andhra Pradesh

// Generate NISM audit trail
const auditTrail = nism.generateNISMAuditTrail(events);

// Verify transaction integrity
const validation = nism.verifyTransactionIntegrity(transaction);
```

**Requirements:**
- ✅ Financial data encrypted at rest (AES-256)
- ✅ TLS 1.3 for data in transit
- ✅ Immutable audit trail
- ✅ Role-based access control
- ✅ Transaction completeness verification
- ✅ Incident reporting within 72 hours
- ✅ Regular security assessments

### India DPA Compliance

**Data Localization & Consent:**

```typescript
const indiaDPA = new IndiaDPACompliance();

// Check data localization
const isLocalizedInIndia = indiaDPA.isDataLocalizedInIndia('aws-ap-south-1');

// Generate consent notice
const notice = indiaDPA.generateConsentNotice(
  ['tax_filing', 'financial_analysis'],
  2555 // retention days (7 years)
);

// Verify sensitive data handling
const dataHandling = indiaDPA.verifySensitiveDataHandling('aadhar');
// {
//   requiresLocalization: true,
//   requiresEncryption: true,
//   maxRetentionDays: 2555
// }
```

**Requirements:**
- ✅ Sensitive data stored in India only
- ✅ Explicit consent collection
- ✅ Right to erasure implementation
- ✅ Data fiduciary responsibilities
- ✅ Annual privacy impact assessment

### Data Retention Policies

```typescript
const retention = new DataRetentionManager();

// Create retention policy
const policy = retention.createPolicy(
  'financial_records',
  'org-1',
  365, // retentionDays
  730, // archiveAfterDays
  2555, // deleteAfterDays (7 years for financial data)
  [ComplianceFramework.GDPR, ComplianceFramework.NISM]
);

// Check if data should be archived
const shouldArchive = retention.shouldArchive(createdDate, policy);

// Check if data should be deleted
const shouldDelete = retention.shouldDelete(createdDate, policy);
```

**Default Retention Periods:**
- **Audit Logs**: 7 years (2555 days)
- **Financial Records**: 7 years (compliance requirement)
- **User Activity Logs**: 90 days
- **Login Attempts**: 30 days
- **Failed Transactions**: 1 year
- **Deleted User Data**: 30 days (then permanently deleted)

### Right to Be Forgotten (GDPR Article 17)

```typescript
const rtbf = new RightToBeForgettenManager();

// Submit request
const request = rtbf.submitRequest(
  'user-1',
  'org-1',
  ['email', 'phone', 'address'], // data types to delete
  'User requested data deletion'
);

// Process request
rtbf.processRequest(request.id);

// Complete request (after verification)
rtbf.completeRequest(request.id, 'admin-1');

// Get pending requests
const pending = rtbf.getPendingRequests('org-1');
```

### Data Anonymization

```typescript
const anonymizer = new DataAnonymizer();

// Create anonymization policy
const policy = anonymizer.createPolicy(
  'email_field',
  'hashing',
  'org-1',
  [ComplianceFramework.GDPR],
  { salt: 'anonymize-salt' }
);

// Apply anonymization
const anonymized = anonymizer.anonymize('user@example.com', policy.id);

// Available methods:
// - masking: "user*****" (pattern replacement)
// - hashing: "5f4dcc3b..." (SHA256)
// - generalization: Age 27 → "20-29", Date → Year only
// - suppression: "[REDACTED]"
```

## Audit & Compliance Reporting

### Immutable Audit Trail

```typescript
const audit = new AuditLogger('audit-encryption-key');

// Log security event
const log = audit.logEvent(
  'org-1',
  'user-1',
  'user_created',
  'user',
  'user-2',
  '192.168.1.1',
  'Mozilla/5.0',
  'success',
  {
    before: {},
    after: { email: 'user@example.com', role: 'analyst' }
  }
);

// Verify audit trail integrity
const result = audit.verifyIntegrity();
// { valid: true }

// Query logs
const logs = audit.queryLogs({
  organizationId: 'org-1',
  userId: 'user-1',
  action: 'user_created',
  startDate: new Date('2024-01-01'),
  endDate: new Date('2024-12-31'),
  status: 'success'
});

// Export audit trail (with cryptographic signature)
const export_ = audit.exportAuditTrail(
  'org-1',
  startDate,
  endDate
);
// {
//   logs: [...],
//   hash: "sha256-hash",
//   signature: "hmac-signature",
//   exportDate: Date
// }

// Get statistics
const stats = audit.getStats('org-1', 30); // Last 30 days
// {
//   totalEvents: 1250,
//   successCount: 1200,
//   failureCount: 50,
//   eventsByAction: { user_created: 50, role_assigned: 30, ... },
//   eventsByUser: { 'user-1': 100, 'user-2': 80, ... }
// }
```

### Compliance Report Generation

#### GDPR Report

```typescript
const generator = new ComplianceReportGenerator(audit);
const report = generator.generateGDPRReport('org-1');

// Report includes:
// - Data Processing Agreement status
// - Data Subject Rights implementation
// - Privacy by Design assessment
// - Compliance score: 85/100
// - Recommendations
```

#### NISM Report

```typescript
const report = generator.generateNISMReport('org-1');

// Report includes:
// - Financial Data Security
// - Data Localization verification
// - Audit Trail completeness
// - Access Control implementation
// - Compliance score: 90/100
```

#### India DPA Report

```typescript
const report = generator.generateIndiaDPAReport('org-1');

// Report includes:
// - Consent Management
// - Data Localization
// - Right to Erasure
// - Data Fiduciary Duties
// - Compliance score: 92/100
```

#### SOC 2 Report

```typescript
const report = generator.generateSOC2Report('org-1');

// Report includes:
// - Security (CC criteria)
// - Availability (A criteria)
// - Processing Integrity (PI criteria)
// - Confidentiality (C criteria)
// - Privacy (P criteria)
// - Compliance score: 88/100
```

## API Security

### CORS Configuration

```typescript
const cors = new CORSManager({
  allowedOrigins: [
    'https://taxsense.ai',
    'https://app.taxsense.ai',
    'https://www.taxsense.ai'
  ],
  allowedMethods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-API-Key'],
  credentials: true,
  maxAge: 86400
});

// Check origin
if (cors.isOriginAllowed(req.headers.origin)) {
  const headers = cors.getCORSHeaders(req.headers.origin, req.method);
  // Apply headers to response
}
```

### Rate Limiting

```typescript
const limiter = new RateLimiter({
  windowMs: 60000, // 1 minute
  maxRequests: 100,
  keyPrefix: 'api'
});

// Check rate limit
const result = limiter.checkLimit(`user-${userId}`);

if (!result.allowed) {
  return res.status(429).set({
    'X-RateLimit-Limit': result.limit,
    'X-RateLimit-Remaining': result.remaining,
    'X-RateLimit-Reset': result.resetTime.toISOString(),
    'Retry-After': Math.ceil(result.resetIn / 1000)
  }).json({ error: 'Too many requests' });
}
```

### Request Validation

```typescript
const validator = new RequestValidator();

// Validate against schema
const schema = z.object({
  email: z.string().email(),
  name: z.string().min(2),
});

const { valid, data, errors } = validator.validateJSON(req.body, schema);

if (!valid) {
  return res.status(400).json({ errors });
}

// Sanitize input
const clean = validator.sanitizeInput(userInput);

// Detect security threats
if (validator.detectSQLInjection(userInput)) {
  logger.warn('SQL injection attempt detected');
  return res.status(400).json({ error: 'Invalid input' });
}

if (validator.detectXSS(userInput)) {
  logger.warn('XSS attempt detected');
  return res.status(400).json({ error: 'Invalid input' });
}
```

### Content Security Policy

```typescript
const csp = new CSPManager({
  defaultSrc: ["'self'"],
  scriptSrc: ["'self'", "'nonce-{nonce}'"],
  styleSrc: ["'self'", "'unsafe-inline'"],
  connectSrc: ["'self'", "https://api.taxsense.ai"]
});

const cspHeader = csp.generateHeader(); // CSP directive string
res.setHeader('Content-Security-Policy', cspHeader);

// Use nonces for inline scripts
const nonce = csp.generateNonce();
// <script nonce="${nonce}">...</script>
```

### CSRF Protection

```typescript
const csrf = new CSRFProtector();

// Generate token at page load
const token = csrf.generateToken(sessionId);

// Verify on form submission
if (!csrf.verifyToken(sessionId, req.body._csrf)) {
  return res.status(403).json({ error: 'CSRF validation failed' });
}

// SameSite cookies
res.cookie('sessionId', sessionId, {
  secure: true,
  httpOnly: true,
  sameSite: 'strict'
});
```

### Security Headers

```typescript
import { getSecurityHeaders } from '@/lib/security';

// Apply to all responses
const headers = getSecurityHeaders();
Object.entries(headers).forEach(([key, value]) => {
  res.setHeader(key, value);
});

// Headers included:
// X-Content-Type-Options: nosniff
// X-Frame-Options: DENY
// X-XSS-Protection: 1; mode=block
// Strict-Transport-Security: max-age=31536000
// Referrer-Policy: strict-origin-when-cross-origin
// Permissions-Policy: camera=(), microphone=(), geolocation=()
```

## Incident Response

### Security Incident Management

```typescript
const incidents = new IncidentManager();

// Report incident
const incident = incidents.reportIncident(
  'org-1',
  'Unauthorized Access Detected',
  'Multiple failed login attempts from 203.0.113.1',
  'high',
  'unauthorized_access',
  'user-1', // reportedBy
  5, // affectedUsers
  ['login-service', 'api-gateway']
);

// Acknowledge incident
incidents.acknowledgeIncident(incident.id, 'admin-1');

// Add response action
incidents.addResponseAction(
  incident.id,
  'Block IP address 203.0.113.1',
  'admin-1',
  'IP blocked in firewall',
  'Monitor for additional attempts'
);

// Resolve incident
incidents.resolveIncident(
  incident.id,
  'admin-1',
  'Attacker IP blocked, user password reset',
  [
    'Blocked IP 203.0.113.1 in firewall',
    'Reset user-1 password',
    'Enabled MFA for user-1',
    'Reviewed audit logs'
  ]
);

// Get active incidents
const active = incidents.getActiveIncidents('org-1');

// Get statistics
const stats = incidents.getIncidentStats('org-1', 30); // Last 30 days
// {
//   total: 5,
//   critical: 0,
//   high: 1,
//   medium: 3,
//   low: 1,
//   avgResolutionTime: 4 // hours
// }
```

## Security Monitoring

### Security Event Monitoring

```typescript
const monitor = new SecurityEventMonitor();

// Record security event
const event = monitor.recordEvent(
  'org-1',
  'suspicious_login',
  'high',
  'Login from unusual IP address',
  'user-1',
  '203.0.113.50',
  'Mozilla/5.0'
);

// Check threshold
const exceeded = monitor.isThresholdExceeded(
  'org-1',
  'brute_force_attempt',
  60 // 1 hour window
);

// Get critical events
const critical = monitor.getCriticalEvents('org-1');

// Resolve event
monitor.resolveEvent(event.id, 'admin-1');

// Get statistics
const stats = monitor.getEventStats('org-1', 30);
// {
//   total: 150,
//   critical: 2,
//   high: 15,
//   medium: 45,
//   low: 88,
//   eventsByType: { suspicious_login: 50, brute_force_attempt: 30, ... }
// }
```

### Anomaly Detection

```typescript
const detector = new AnomalyDetector();

// Build user baseline with normal behavior
for (let i = 0; i < 20; i++) {
  detector.recordBaseline('user-1', 'login');
}

// Detect login anomaly
const loginAnomaly = detector.detectLoginAnomaly(
  'user-1',
  new Date(),
  '203.0.113.1'
);

if (loginAnomaly) {
  // Anomaly detected
  console.log(`Anomaly score: ${loginAnomaly.anomalyScore}`);
  // Alert security team
}

// Detect access anomaly
const accessAnomaly = detector.detectAccessAnomaly(
  'user-1',
  'financial_data',
  100 // access count
);

// Investigate anomaly
detector.investigateAnomaly(loginAnomaly.id, 'legitimate');

// Get pending anomalies
const pending = detector.getPendingAnomalies('org-1');
```

## Implementation Guide

### 1. Initialize Security Framework

```typescript
// Initialize at application startup
import { SecurityFramework } from '@/lib/security';

export const security = new SecurityFramework(
  process.env.MASTER_ENCRYPTION_KEY,
  process.env.AUDIT_ENCRYPTION_KEY
);
```

### 2. Protect API Routes

```typescript
// middleware/security.ts
import { security } from '@/lib/security';

export const securityMiddleware = (req, res, next) => {
  // Apply security headers
  const { getSecurityHeaders } = require('@/lib/security');
  const headers = getSecurityHeaders();
  Object.entries(headers).forEach(([key, value]) => {
    res.setHeader(key, value);
  });

  // Check rate limit
  const limiter = security.getFramework().rateLimiter;
  const result = limiter.checkLimit(req.ip);

  if (!result.allowed) {
    return res.status(429).json({ error: 'Too many requests' });
  }

  next();
};
```

### 3. Implement Authentication

```typescript
// api/auth/login.ts
export async function POST(req: NextApiRequest, res: NextApiResponse) {
  const { email, password } = req.body;

  // Validate password policy
  const passwordPolicy = {
    minLength: 12,
    requireUppercase: true,
    requireLowercase: true,
    requireNumbers: true,
    requireSpecialChars: true,
  };

  const { valid, errors } = validatePassword(password, passwordPolicy);
  if (!valid) {
    return res.status(400).json({ errors });
  }

  // Hash password
  const { hash, salt } = await hashPassword(password);

  // Create session
  const sessionManager = new SessionManager(process.env.JWT_SECRET);
  const session = sessionManager.createSession(
    user.id,
    user.organizationId,
    user.email,
    user.roleId,
    req.ip,
    req.headers['user-agent']
  );

  // Log authentication event
  const audit = security.getAudit();
  audit.logEvent(
    user.organizationId,
    user.id,
    'login_attempt',
    'user',
    user.id,
    req.ip,
    req.headers['user-agent'] as string,
    'success'
  );

  res.json({ token: session.token, refreshToken: session.refreshToken });
}
```

### 4. Encrypt Sensitive Data

```typescript
// utils/data.ts
const encryption = security.getEncryption();

export function encryptUserData(userData) {
  return {
    email: encryption.encrypt(userData.email),
    phone: encryption.encrypt(userData.phone),
    address: encryption.encrypt(userData.address),
  };
}

export function decryptUserData(encryptedData) {
  return {
    email: encryption.decrypt(encryptedData.email),
    phone: encryption.decrypt(encryptedData.phone),
    address: encryption.decrypt(encryptedData.address),
  };
}
```

### 5. Implement RBAC

```typescript
// middleware/rbac.ts
export const requirePermission = (permissionCode: string) => {
  return async (req, res, next) => {
    const rbac = security.getRBAC();
    const userRole = await getUserRole(req.user.id);

    const hasPermission = rbac.hasPermission(userRole, permissionCode);

    if (!hasPermission) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    next();
  };
};

// Usage in route
export async function DELETE(req, res) {
  // Protected by middleware
  // requirePermission('user:delete')
}
```

## Security Checklist

### Pre-Production

- [ ] All sensitive data encrypted (AES-256-GCM)
- [ ] TLS 1.3 configured for all external communications
- [ ] Master encryption keys stored in AWS Secrets Manager
- [ ] Database encryption at rest enabled
- [ ] CORS whitelist configured correctly
- [ ] Rate limiting enabled on all public endpoints
- [ ] CSRF protection implemented
- [ ] CSP headers configured
- [ ] Security headers enabled
- [ ] RBAC permissions correctly assigned
- [ ] API key rotation policy configured
- [ ] Audit logging enabled and tested
- [ ] Backup and disaster recovery plan documented
- [ ] Penetration testing completed
- [ ] OWASP Top 10 assessment completed

### Post-Production

- [ ] Monitor security events daily
- [ ] Review audit logs weekly
- [ ] Run vulnerability scans monthly
- [ ] Generate compliance reports quarterly
- [ ] Conduct security training annually
- [ ] Update dependencies regularly
- [ ] Test incident response procedures
- [ ] Verify backup integrity monthly
- [ ] Review user access quarterly
- [ ] Conduct penetration testing annually

### Compliance

#### GDPR
- [ ] Data Processing Agreement (DPA) signed
- [ ] Privacy policy updated
- [ ] Consent management implemented
- [ ] Right to access implemented
- [ ] Right to erasure implemented
- [ ] Data portability implemented
- [ ] DPO contact information published
- [ ] Breach notification procedure documented

#### NISM (SEBI)
- [ ] Financial data encrypted
- [ ] Immutable audit trail implemented
- [ ] Access control verified
- [ ] Transaction integrity checks enabled
- [ ] Incident response plan documented
- [ ] Annual compliance audit scheduled

#### India DPA
- [ ] Data localization verified (India servers)
- [ ] Consent notices updated
- [ ] Sensitive data handling procedures documented
- [ ] Data fiduciary responsibilities assigned
- [ ] Right to erasure implemented

## Support & Contact

For security issues or questions:
- **Security Team**: security@taxsense.ai
- **Responsible Disclosure**: Follow coordinated disclosure guidelines
- **Incident Reporting**: Use built-in incident reporting system

## Version History

- **v1.0** (2024-09-28): Initial enterprise security framework
  - Authentication, authorization, encryption
  - GDPR, NISM, India DPA compliance
  - Audit trail and compliance reporting
  - Incident response and monitoring

---

**Last Updated**: September 28, 2024
**Status**: Enterprise-Grade Security Framework Ready for Production
