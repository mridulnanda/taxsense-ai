# TaxSense AI Security Framework - Quick Start Guide

## Installation

The security framework is already built into the project at `/src/lib/security/`. No additional installation is needed.

### Import the Framework

```typescript
import {
  SecurityFramework,
  EncryptionService,
  RBACManager,
  AuditLogger,
  SessionManager,
  // ... other security modules
} from '@/lib/security';
```

## 5-Minute Setup

### Step 1: Initialize Security Framework

```typescript
// lib/security-init.ts
import { SecurityFramework } from '@/lib/security';

export const securityFramework = new SecurityFramework(
  process.env.MASTER_ENCRYPTION_KEY || 'dev-key-change-in-production',
  process.env.AUDIT_ENCRYPTION_KEY || 'dev-audit-key-change-in-production'
);

export const encryption = securityFramework.getEncryption();
export const rbac = securityFramework.getRBAC();
export const audit = securityFramework.getAudit();
export const incidents = securityFramework.getIncidents();
export const monitoring = securityFramework.getMonitoring();
```

### Step 2: Add Security Middleware

```typescript
// middleware/security.ts
import { NextRequest, NextResponse } from 'next/server';
import { getSecurityHeaders } from '@/lib/security';

export function middleware(request: NextRequest) {
  const response = NextResponse.next();

  // Add security headers
  const headers = getSecurityHeaders();
  Object.entries(headers).forEach(([key, value]) => {
    response.headers.set(key, value);
  });

  return response;
}

export const config = {
  matcher: ['/:path*'],
};
```

### Step 3: Protect API Routes

```typescript
// api/protected-route.ts
import { requirePermission, requireAuth } from '@/middleware/rbac';

export async function GET(request: Request) {
  // This endpoint requires 'report:view' permission
}

export const middleware = [
  requireAuth(),
  requirePermission('report:view')
];
```

### Step 4: Encrypt Sensitive Data

```typescript
// lib/data-protection.ts
import { encryption } from '@/lib/security-init';

export function encryptUserEmail(email: string) {
  return encryption.encrypt(email);
}

export function decryptUserEmail(encrypted) {
  return encryption.decrypt(encrypted);
}
```

## Common Tasks

### Check User Permissions

```typescript
import { rbac } from '@/lib/security-init';

const userRole = await getUserRole(userId);
const canExportData = rbac.hasPermission(userRole, 'export:financialData');

if (!canExportData) {
  throw new Error('Insufficient permissions');
}
```

### Log Security Events

```typescript
import { audit } from '@/lib/security-init';

audit.logEvent(
  organizationId,
  userId,
  'data_exported',
  'report',
  reportId,
  ipAddress,
  userAgent,
  'success',
  {
    before: {},
    after: { exported: true, format: 'pdf' }
  }
);
```

### Generate Compliance Report

```typescript
import { ComplianceReportGenerator } from '@/lib/security';
import { audit } from '@/lib/security-init';

const generator = new ComplianceReportGenerator(audit);
const gdprReport = generator.generateGDPRReport(organizationId);
const nismReport = generator.generateNISMReport(organizationId);
const indiaDPAReport = generator.generateIndiaDPAReport(organizationId);
const soc2Report = generator.generateSOC2Report(organizationId);
```

### Detect Anomalies

```typescript
import { AnomalyDetector } from '@/lib/security';

const detector = new AnomalyDetector();

// Build baseline (call during normal usage)
detector.recordBaseline(userId, 'login');

// Detect anomaly
const anomaly = detector.detectLoginAnomaly(
  userId,
  new Date(),
  ipAddress
);

if (anomaly && anomaly.anomalyScore > 0.7) {
  // Alert security team
  await incidents.reportIncident(
    organizationId,
    'Suspicious Login Detected',
    `Anomaly score: ${anomaly.anomalyScore}`,
    'medium',
    'suspicious_login',
    'system',
    1,
    ['login-service']
  );
}
```

## Running Tests

```bash
# Run all security tests
npm test -- tests/security.test.ts

# Run specific test suite
npm test -- tests/security.test.ts -t "Authentication"

# Run with coverage
npm test -- tests/security.test.ts --coverage
```

## Environment Variables

Add these to your `.env.local`:

```bash
# Encryption Keys (CHANGE IN PRODUCTION)
MASTER_ENCRYPTION_KEY=your-256-bit-key-in-hex-format
AUDIT_ENCRYPTION_KEY=your-audit-encryption-key

# JWT
JWT_SECRET=your-jwt-secret-key

# OAuth Providers (optional)
GOOGLE_CLIENT_ID=xxx
GOOGLE_CLIENT_SECRET=xxx
MICROSOFT_CLIENT_ID=xxx
MICROSOFT_CLIENT_SECRET=xxx
GITHUB_CLIENT_ID=xxx
GITHUB_CLIENT_SECRET=xxx

# Compliance
COMPLIANCE_CONTACT_EMAIL=compliance@taxsense.ai
SECURITY_CONTACT_EMAIL=security@taxsense.ai

# Secrets Manager (AWS)
AWS_REGION=ap-south-1
AWS_SECRETS_MANAGER_ENABLED=true
```

## Security Best Practices

### Do's ✅
- ✅ Always use HTTPS in production
- ✅ Rotate encryption keys quarterly
- ✅ Review audit logs weekly
- ✅ Enable MFA for all users
- ✅ Use parameterized queries
- ✅ Validate all user input
- ✅ Keep dependencies updated
- ✅ Log all security events

### Don'ts ❌
- ❌ Never commit `.env` files
- ❌ Never hardcode secrets
- ❌ Never trust user input
- ❌ Never disable security headers
- ❌ Never skip MFA for sensitive operations
- ❌ Never log sensitive data
- ❌ Never use deprecated crypto
- ❌ Never ignore security warnings

## Troubleshooting

### Encryption errors
```typescript
// Error: "Decryption failed - data may be corrupted"
// Solution: Verify the encryption key and that data wasn't tampered with
```

### Rate limiting issues
```typescript
// Error: "Too many requests"
// Solution: Implement exponential backoff in client code
// Wait and retry with increasing delays
```

### Audit integrity failures
```typescript
// Error: "Audit trail integrity compromised"
// Solution: Do not modify audit logs directly
// Contact security team immediately
```

## Performance Considerations

- **Encryption overhead**: ~2-5ms per encrypt/decrypt operation
- **Audit logging overhead**: ~1-2ms per event
- **RBAC check overhead**: ~0.5ms per permission check
- **Rate limiting overhead**: < 0.5ms per check

For high-throughput systems, consider:
1. Caching RBAC decisions
2. Batch encrypting data
3. Async audit logging
4. Redis-based rate limiting

## Compliance Export

Generate reports for auditors:

```typescript
// Generate GDPR report
const gdprReport = generator.generateGDPRReport(organizationId);

// Export audit trail
const auditExport = audit.exportAuditTrail(
  organizationId,
  new Date('2024-01-01'),
  new Date('2024-12-31')
);

// Send to auditors
await sendToAuditors({
  gdprReport,
  auditExport,
  timestamp: new Date()
});
```

## Support

- **Security Issues**: security@taxsense.ai
- **Compliance Questions**: compliance@taxsense.ai
- **Documentation**: /docs/SECURITY.md
- **Tests**: /tests/security.test.ts

## Next Steps

1. **Configure OAuth providers** for social login
2. **Set up Secrets Manager** for production secrets
3. **Configure CORS** for your domains
4. **Train team** on security best practices
5. **Schedule security audit** before production launch
6. **Set up monitoring** for security events
7. **Document incident response procedures**

## Resources

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [GDPR Compliance Guide](https://gdpr-info.eu/)
- [NISM Guidelines](https://www.sebi.gov.in/)
- [Node.js Security Checklist](https://nodejs.org/en/docs/guides/security/)
- [Next.js Security](https://nextjs.org/docs/advanced-features/security-headers)

---

**Ready to deploy? Run the security checklist in /docs/SECURITY.md before going live.**
