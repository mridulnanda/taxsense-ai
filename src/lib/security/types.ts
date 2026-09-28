/**
 * Security Framework Types
 * Core type definitions for authentication, authorization, and compliance
 */

// ============================================================================
// Authentication Types
// ============================================================================

export enum AuthProvider {
  Google = 'google',
  Microsoft = 'microsoft',
  GitHub = 'github',
  MagicLink = 'magic_link',
  TOTP = 'totp',
  Biometric = 'biometric',
}

export interface AuthUser {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  avatar?: string;
  provider: AuthProvider;
  providerId: string;
  emailVerified: boolean;
  mfaEnabled: boolean;
  mfaMethods: MFAMethod[];
  lastLogin?: Date;
  createdAt: Date;
  updatedAt: Date;
  organizationId: string;
  roleId: string;
  isActive: boolean;
  passwordHash?: string;
  passwordSalt?: string;
  passwordChangedAt?: Date;
}

export interface MFAMethod {
  id: string;
  type: 'totp' | 'biometric' | 'backup_codes';
  enabled: boolean;
  verifiedAt: Date;
  backupCodes?: string[];
  biometricType?: 'fingerprint' | 'face' | 'iris';
}

export interface Session {
  id: string;
  userId: string;
  organizationId: string;
  token: string;
  refreshToken: string;
  tokenExpiresAt: Date;
  refreshTokenExpiresAt: Date;
  userAgent?: string;
  ipAddress: string;
  deviceId?: string;
  isActive: boolean;
  lastActivity: Date;
  createdAt: Date;
}

export interface RefreshTokenPayload {
  sessionId: string;
  userId: string;
  organizationId: string;
  iat: number;
  exp: number;
  jti: string; // JWT ID for tracking
}

export interface LoginAttempt {
  id: string;
  userId?: string;
  email?: string;
  ipAddress: string;
  userAgent: string;
  success: boolean;
  provider: AuthProvider;
  reason?: string; // Failure reason
  timestamp: Date;
  organizationId?: string;
}

// ============================================================================
// Authorization & RBAC Types
// ============================================================================

export enum RoleLevel {
  SuperAdmin = 'super_admin',
  Admin = 'admin',
  Manager = 'manager',
  Analyst = 'analyst',
  Viewer = 'viewer',
}

export interface Role {
  id: string;
  organizationId: string;
  name: string;
  level: RoleLevel;
  description?: string;
  permissions: Permission[];
  isSystem: boolean; // System roles cannot be deleted
  createdAt: Date;
  updatedAt: Date;
}

export interface Permission {
  id: string;
  code: string; // e.g., 'user:create', 'report:export', 'audit:view'
  name: string;
  description?: string;
  category: PermissionCategory;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  requiresMFA: boolean;
  createdAt: Date;
}

export enum PermissionCategory {
  UserManagement = 'user_management',
  RoleManagement = 'role_management',
  AuditLog = 'audit_log',
  DataExport = 'data_export',
  ReportGeneration = 'report_generation',
  ComplianceSettings = 'compliance_settings',
  SecuritySettings = 'security_settings',
  IncidentManagement = 'incident_management',
  SystemSettings = 'system_settings',
  FinancialData = 'financial_data',
}

export interface ResourcePermission {
  id: string;
  userId: string;
  resourceType: string; // 'user', 'organization', 'report', etc.
  resourceId: string;
  action: 'read' | 'write' | 'delete' | 'share';
  grantedAt: Date;
  grantedBy: string;
  expiresAt?: Date;
}

// ============================================================================
// Encryption & Secrets Types
// ============================================================================

export interface EncryptedField {
  iv: string; // Initialization vector (base64)
  ciphertext: string; // Encrypted data (base64)
  authTag: string; // Authentication tag (base64)
  algorithm: 'aes-256-gcm';
}

export interface SecretRotationPolicy {
  id: string;
  secretType: 'api_key' | 'database_password' | 'jwt_secret' | 'encryption_key';
  rotationInterval: number; // days
  retentionDays: number; // Keep rotated secrets for this long
  notificationDays: number; // Notify this many days before rotation
  automaticRotation: boolean;
  enabled: boolean;
}

export interface SecretVersion {
  id: string;
  secretId: string;
  version: number;
  value: string; // Encrypted
  status: 'active' | 'inactive' | 'deprecated';
  createdAt: Date;
  rotatedAt?: Date;
  expiresAt?: Date;
  rotatedBy?: string;
}

// ============================================================================
// Data Protection & Compliance Types
// ============================================================================

export enum ComplianceFramework {
  GDPR = 'gdpr',
  NISM = 'nism',
  IndiaDataProtection = 'india_dpa',
  SOC2 = 'soc2',
  ISO27001 = 'iso27001',
}

export interface DataClassification {
  level: 'public' | 'internal' | 'confidential' | 'restricted';
  piiIndicators: string[]; // PII types: email, phone, ssn, aadhar, etc.
  sensitivityScore: number; // 0-100
  retentionDays?: number;
  requiresEncryption: boolean;
  requiresAuditLog: boolean;
}

export interface DataRetentionPolicy {
  id: string;
  organizationId: string;
  dataType: string;
  retentionDays: number;
  archiveAfterDays: number;
  deleteAfterDays: number;
  complianceFrameworks: ComplianceFramework[];
  createdAt: Date;
  updatedAt: Date;
}

export interface RightToBeForgettenRequest {
  id: string;
  userId: string;
  organizationId: string;
  dataTypes: string[]; // Types of data to delete
  reason: string;
  status: 'pending' | 'processing' | 'completed' | 'denied';
  requestedAt: Date;
  completedAt?: Date;
  approvedBy?: string;
}

export interface AnonymizationPolicy {
  id: string;
  organizationId: string;
  dataField: string;
  method: 'masking' | 'hashing' | 'generalization' | 'suppression';
  parameters?: Record<string, any>;
  complianceFrameworks: ComplianceFramework[];
}

// ============================================================================
// Audit & Compliance Types
// ============================================================================

export interface AuditLog {
  id: string;
  organizationId: string;
  timestamp: Date;
  userId: string;
  action: AuditAction;
  resourceType: string;
  resourceId?: string;
  changes?: {
    before: Record<string, any>;
    after: Record<string, any>;
  };
  ipAddress: string;
  userAgent: string;
  status: 'success' | 'failure';
  errorMessage?: string;
  immutable: boolean;
}

export enum AuditAction {
  UserCreated = 'user_created',
  UserDeleted = 'user_deleted',
  UserPasswordChanged = 'user_password_changed',
  UserMFAEnabled = 'user_mfa_enabled',
  UserMFADisabled = 'user_mfa_disabled',
  RoleAssigned = 'role_assigned',
  RoleRevoked = 'role_revoked',
  PermissionGranted = 'permission_granted',
  PermissionRevoked = 'permission_revoked',
  DataAccessed = 'data_accessed',
  DataModified = 'data_modified',
  DataExported = 'data_exported',
  ReportGenerated = 'report_generated',
  IncidentReported = 'incident_reported',
  ComplianceCheckRun = 'compliance_check_run',
  SecurityEventDetected = 'security_event_detected',
  LoginAttempt = 'login_attempt',
  LogoutAttempt = 'logout_attempt',
  SessionTerminated = 'session_terminated',
}

export interface ComplianceReport {
  id: string;
  organizationId: string;
  framework: ComplianceFramework;
  generatedAt: Date;
  status: 'draft' | 'in_review' | 'approved' | 'archived';
  sections: ComplianceSection[];
  overallScore: number; // 0-100
  criticalFindings: number;
  recommendations: string[];
  generatedBy: string;
}

export interface ComplianceSection {
  id: string;
  title: string;
  description: string;
  checks: ComplianceCheck[];
  score: number; // 0-100
  status: 'pass' | 'fail' | 'partial' | 'not_applicable';
}

export interface ComplianceCheck {
  id: string;
  code: string;
  name: string;
  description: string;
  requirement: string;
  status: 'pass' | 'fail' | 'partial' | 'not_applicable';
  evidence?: string;
  remediation?: string;
  checkType: 'automated' | 'manual' | 'hybrid';
}

// ============================================================================
// Vulnerability Management Types
// ============================================================================

export interface Vulnerability {
  id: string;
  cveId?: string;
  title: string;
  description: string;
  severity: 'critical' | 'high' | 'medium' | 'low' | 'info';
  cvssScore: number; // 0-10
  affectedComponent: string;
  affectedVersion?: string;
  discoveredAt: Date;
  status: 'open' | 'in_progress' | 'resolved' | 'wont_fix' | 'false_positive';
  remediationSteps?: string;
  resolvedAt?: Date;
  resolvedBy?: string;
}

export interface DependencyScan {
  id: string;
  timestamp: Date;
  tool: 'npm_audit' | 'snyk' | 'dependabot';
  vulnerabilitiesFound: number;
  criticalCount: number;
  highCount: number;
  mediumCount: number;
  lowCount: number;
  status: 'completed' | 'in_progress' | 'failed';
  reportUrl?: string;
}

// ============================================================================
// Incident Response Types
// ============================================================================

export interface SecurityIncident {
  id: string;
  organizationId: string;
  title: string;
  description: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  type: IncidentType;
  status: 'reported' | 'acknowledged' | 'investigating' | 'contained' | 'resolved' | 'closed';
  reportedAt: Date;
  reportedBy: string;
  acknowledgedAt?: Date;
  acknowledgedBy?: string;
  resolvedAt?: Date;
  resolvedBy?: string;
  affectedUsers: number;
  affectedSystems: string[];
  rootCause?: string;
  remediationSteps?: string[];
  postIncidentReview?: string;
}

export enum IncidentType {
  UnauthorizedAccess = 'unauthorized_access',
  DataBreach = 'data_breach',
  MalwareDetected = 'malware_detected',
  DDoS = 'ddos_attack',
  ConfigurationError = 'configuration_error',
  ComplianceViolation = 'compliance_violation',
  ThirdPartyVulnerability = 'third_party_vulnerability',
  InternalThreat = 'internal_threat',
  SystemCompromise = 'system_compromise',
  Other = 'other',
}

export interface IncidentResponse {
  id: string;
  incidentId: string;
  action: string;
  performedAt: Date;
  performedBy: string;
  status: 'pending' | 'in_progress' | 'completed';
  result?: string;
  nextStep?: string;
}

// ============================================================================
// Security Monitoring Types
// ============================================================================

export interface SecurityEvent {
  id: string;
  organizationId: string;
  timestamp: Date;
  type: SecurityEventType;
  severity: 'critical' | 'high' | 'medium' | 'low' | 'info';
  description: string;
  userId?: string;
  ipAddress?: string;
  userAgent?: string;
  metadata: Record<string, any>;
  resolved: boolean;
  resolvedAt?: Date;
  resolvedBy?: string;
}

export enum SecurityEventType {
  SuspiciousLogin = 'suspicious_login',
  BruteForceAttempt = 'brute_force_attempt',
  UnusualDataAccess = 'unusual_data_access',
  PrivilegeEscalation = 'privilege_escalation',
  ConfigurationChange = 'configuration_change',
  FailedAuditLog = 'failed_audit_log',
  CertificateExpiring = 'certificate_expiring',
  DependencyVulnerability = 'dependency_vulnerability',
  AnomalousActivityPattern = 'anomalous_activity_pattern',
}

export interface AnomalyDetection {
  id: string;
  organizationId: string;
  type: 'login_anomaly' | 'data_access_anomaly' | 'activity_pattern_anomaly';
  userId: string;
  anomalyScore: number; // 0-1
  normalPattern: Record<string, any>;
  detectedPattern: Record<string, any>;
  detectedAt: Date;
  investigated: boolean;
  investigatedAt?: Date;
  result?: 'legitimate' | 'anomalous' | 'requires_review';
}

// ============================================================================
// IP Whitelisting Types
// ============================================================================

export interface IPWhitelistEntry {
  id: string;
  organizationId: string;
  ipAddress: string;
  cidr?: string; // CIDR notation for IP range
  description?: string;
  roleRequired: RoleLevel; // Minimum role required
  expiresAt?: Date;
  createdAt: Date;
  createdBy: string;
  enabled: boolean;
}

// ============================================================================
// Password Policy Types
// ============================================================================

export interface PasswordPolicy {
  id: string;
  organizationId: string;
  minLength: number; // Default: 12
  requireUppercase: boolean;
  requireLowercase: boolean;
  requireNumbers: boolean;
  requireSpecialChars: boolean;
  specialCharsSet: string; // e.g., "!@#$%^&*()"
  expirationDays?: number; // Optional password expiration
  historyCount: number; // Prevent reuse of N previous passwords
  lockoutThreshold: number; // Failed attempts before lockout
  lockoutDurationMinutes: number;
  createdAt: Date;
  updatedAt: Date;
}
