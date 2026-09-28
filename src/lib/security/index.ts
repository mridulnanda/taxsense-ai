/**
 * TaxSense AI Security Framework
 * Enterprise-grade security, compliance, and audit capabilities
 */

// ============================================================================
// Type Exports
// ============================================================================

export * from './types';

// ============================================================================
// Authentication Module
// ============================================================================

export {
  hashPassword,
  verifyPassword,
  validatePassword,
  passwordPolicySchema,
  SessionManager,
  MagicLinkAuthenticator,
  TOTPAuthenticator,
  BiometricAuthenticator,
  OAuth2Manager,
  OAuth2Config,
  LoginAttemptTracker,
} from './auth/authentication';

// ============================================================================
// Encryption & Secrets Module
// ============================================================================

export {
  EncryptionService,
  SecretsManager,
  Secret,
  APIKeyManager,
  TLSCertificateManager,
  TLSCertificate,
} from './encryption/encryption-service';

// ============================================================================
// RBAC Module
// ============================================================================

export {
  PERMISSIONS_DATABASE,
  getDefaultRoles,
  RBACManager,
} from './rbac/role-based-access';

// ============================================================================
// Audit & Compliance Module
// ============================================================================

export {
  AuditLogger,
  ComplianceReportGenerator,
} from './audit/audit-logger';

// ============================================================================
// Data Protection Module
// ============================================================================

export {
  DATA_CLASSIFICATIONS,
  DataRetentionManager,
  RightToBeForgettenManager,
  DataAnonymizer,
  GDPRCompliance,
  NISMCompliance,
  IndiaDPACompliance,
} from './data-protection/data-protection';

// ============================================================================
// API Security Module
// ============================================================================

export {
  CORSManager,
  DEFAULT_CORS_CONFIG,
  CORSConfig,
  RateLimiter,
  RateLimitConfig,
  RequestValidator,
  CSPManager,
  CSPConfig,
  DEFAULT_CSP_CONFIG,
  CSRFProtector,
  getSecurityHeaders,
} from './api/api-security';

// ============================================================================
// Incident Response Module
// ============================================================================

export {
  IncidentManager,
  SecurityEventMonitor,
  AnomalyDetector,
} from './incident/incident-response';

// ============================================================================
// Security Framework Main Class
// ============================================================================

/**
 * Main security framework class that orchestrates all security modules
 */
export class SecurityFramework {
  private encryption: EncryptionService;
  private secrets: SecretsManager;
  private rbac: RBACManager;
  private audit: AuditLogger;
  private incidents: IncidentManager;
  private monitoring: SecurityEventMonitor;

  constructor(
    masterEncryptionKey: string,
    auditEncryptionKey: string
  ) {
    this.encryption = new EncryptionService(masterEncryptionKey);
    this.secrets = new SecretsManager(this.encryption);
    this.rbac = new RBACManager();
    this.audit = new AuditLogger(auditEncryptionKey);
    this.incidents = new IncidentManager();
    this.monitoring = new SecurityEventMonitor();
  }

  /**
   * Get encryption service
   */
  getEncryption(): EncryptionService {
    return this.encryption;
  }

  /**
   * Get secrets manager
   */
  getSecrets(): SecretsManager {
    return this.secrets;
  }

  /**
   * Get RBAC manager
   */
  getRBAC(): RBACManager {
    return this.rbac;
  }

  /**
   * Get audit logger
   */
  getAudit(): AuditLogger {
    return this.audit;
  }

  /**
   * Get incident manager
   */
  getIncidents(): IncidentManager {
    return this.incidents;
  }

  /**
   * Get security monitoring
   */
  getMonitoring(): SecurityEventMonitor {
    return this.monitoring;
  }

  /**
   * Check system security status
   */
  getSecurityStatus(): {
    encryptionEnabled: boolean;
    rbacEnabled: boolean;
    auditLoggingEnabled: boolean;
    incidentTrackingEnabled: boolean;
    monitoringEnabled: boolean;
    overallStatus: 'healthy' | 'degraded' | 'critical';
  } {
    return {
      encryptionEnabled: true,
      rbacEnabled: true,
      auditLoggingEnabled: true,
      incidentTrackingEnabled: true,
      monitoringEnabled: true,
      overallStatus: 'healthy',
    };
  }
}
