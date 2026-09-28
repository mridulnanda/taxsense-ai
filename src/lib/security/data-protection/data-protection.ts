/**
 * Data Protection & Compliance
 * GDPR, NISM, and India DPA compliance utilities
 */

import crypto from 'crypto';
import {
  DataClassification,
  DataRetentionPolicy,
  RightToBeForgettenRequest,
  AnonymizationPolicy,
  ComplianceFramework,
} from '../types';

// ============================================================================
// Data Classification
// ============================================================================

export const DATA_CLASSIFICATIONS: Record<string, DataClassification> = {
  public: {
    level: 'public',
    piiIndicators: [],
    sensitivityScore: 0,
    requiresEncryption: false,
    requiresAuditLog: false,
  },
  internal: {
    level: 'internal',
    piiIndicators: [],
    sensitivityScore: 25,
    retentionDays: 2555, // 7 years
    requiresEncryption: false,
    requiresAuditLog: true,
  },
  confidential: {
    level: 'confidential',
    piiIndicators: ['email', 'phone', 'address'],
    sensitivityScore: 75,
    retentionDays: 2555, // 7 years
    requiresEncryption: true,
    requiresAuditLog: true,
  },
  restricted: {
    level: 'restricted',
    piiIndicators: ['ssn', 'aadhar', 'pan', 'bankAccount', 'creditCard'],
    sensitivityScore: 100,
    retentionDays: 2555, // 7 years
    requiresEncryption: true,
    requiresAuditLog: true,
  },
};

// ============================================================================
// Data Retention Manager
// ============================================================================

export class DataRetentionManager {
  private policies: Map<string, DataRetentionPolicy> = new Map();

  /**
   * Create a retention policy
   */
  createPolicy(
    dataType: string,
    organizationId: string,
    retentionDays: number,
    archiveAfterDays: number,
    deleteAfterDays: number,
    frameworks: ComplianceFramework[]
  ): DataRetentionPolicy {
    const id = `policy-${Date.now()}`;

    const policy: DataRetentionPolicy = {
      id,
      organizationId,
      dataType,
      retentionDays,
      archiveAfterDays,
      deleteAfterDays,
      complianceFrameworks: frameworks,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.policies.set(id, policy);
    return policy;
  }

  /**
   * Get retention policy for data type
   */
  getPolicyForDataType(organizationId: string, dataType: string): DataRetentionPolicy | null {
    for (const policy of this.policies.values()) {
      if (policy.organizationId === organizationId && policy.dataType === dataType) {
        return policy;
      }
    }
    return null;
  }

  /**
   * Check if data should be archived
   */
  shouldArchive(createdDate: Date, policy: DataRetentionPolicy): boolean {
    const archiveDate = new Date(createdDate);
    archiveDate.setDate(archiveDate.getDate() + policy.archiveAfterDays);
    return new Date() > archiveDate;
  }

  /**
   * Check if data should be deleted
   */
  shouldDelete(createdDate: Date, policy: DataRetentionPolicy): boolean {
    const deleteDate = new Date(createdDate);
    deleteDate.setDate(deleteDate.getDate() + policy.deleteAfterDays);
    return new Date() > deleteDate;
  }

  /**
   * Get data eligible for deletion
   */
  getExpiredData(organizationId: string, dataType: string): { expired: boolean; reason?: string } {
    const policy = this.getPolicyForDataType(organizationId, dataType);
    if (!policy) return { expired: false };

    // In production, check actual data timestamps
    return { expired: false };
  }
}

// ============================================================================
// Right to Be Forgotten Implementation
// ============================================================================

export class RightToBeForgettenManager {
  private requests: Map<string, RightToBeForgettenRequest> = new Map();

  /**
   * Submit a right to be forgotten request
   */
  submitRequest(
    userId: string,
    organizationId: string,
    dataTypes: string[],
    reason: string
  ): RightToBeForgettenRequest {
    const id = crypto.randomUUID();

    const request: RightToBeForgettenRequest = {
      id,
      userId,
      organizationId,
      dataTypes,
      reason,
      status: 'pending',
      requestedAt: new Date(),
    };

    this.requests.set(id, request);
    return request;
  }

  /**
   * Process a right to be forgotten request
   */
  processRequest(requestId: string): RightToBeForgettenRequest | null {
    const request = this.requests.get(requestId);
    if (!request) return null;

    request.status = 'processing';
    return request;
  }

  /**
   * Complete a right to be forgotten request
   */
  completeRequest(requestId: string, approvedBy: string): RightToBeForgettenRequest | null {
    const request = this.requests.get(requestId);
    if (!request) return null;

    request.status = 'completed';
    request.completedAt = new Date();
    request.approvedBy = approvedBy;

    // In production, actually delete/anonymize data here
    return request;
  }

  /**
   * Deny a right to be forgotten request
   */
  denyRequest(requestId: string): RightToBeForgettenRequest | null {
    const request = this.requests.get(requestId);
    if (!request) return null;

    request.status = 'denied';
    return request;
  }

  /**
   * Get pending requests for organization
   */
  getPendingRequests(organizationId: string): RightToBeForgettenRequest[] {
    return Array.from(this.requests.values()).filter(
      (r) => r.organizationId === organizationId && r.status === 'pending'
    );
  }

  /**
   * Get request by ID
   */
  getRequest(requestId: string): RightToBeForgettenRequest | null {
    return this.requests.get(requestId) || null;
  }
}

// ============================================================================
// Data Anonymization
// ============================================================================

export class DataAnonymizer {
  private policies: Map<string, AnonymizationPolicy> = new Map();

  /**
   * Create an anonymization policy
   */
  createPolicy(
    dataField: string,
    method: 'masking' | 'hashing' | 'generalization' | 'suppression',
    organizationId: string,
    frameworks: ComplianceFramework[],
    parameters?: Record<string, any>
  ): AnonymizationPolicy {
    const id = `anon-${Date.now()}`;

    const policy: AnonymizationPolicy = {
      id,
      organizationId,
      dataField,
      method,
      parameters,
      complianceFrameworks: frameworks,
    };

    this.policies.set(id, policy);
    return policy;
  }

  /**
   * Mask sensitive data
   */
  maskData(data: string, pattern: string = '****'): string {
    if (data.length <= 2) return pattern;

    const visibleChars = Math.max(1, Math.floor(data.length / 4));
    const masked = pattern.repeat(Math.max(1, data.length - visibleChars));
    return data.substring(0, visibleChars) + masked;
  }

  /**
   * Hash data for anonymization
   */
  hashData(data: string, salt: string = 'anonymize'): string {
    return crypto
      .createHash('sha256')
      .update(data + salt)
      .digest('hex');
  }

  /**
   * Generalize data (e.g., age ranges)
   */
  generalizeData(
    data: string,
    type: 'age' | 'date' | 'location' | 'number',
    precision?: string
  ): string {
    switch (type) {
      case 'age': {
        const age = parseInt(data);
        const range = Math.floor(age / 10) * 10;
        return `${range}-${range + 9}`;
      }
      case 'date': {
        const date = new Date(data);
        if (precision === 'year') return date.getFullYear().toString();
        if (precision === 'month') return `${date.getFullYear()}-${date.getMonth() + 1}`;
        return date.toISOString().split('T')[0];
      }
      case 'location':
        // Return only country/state level
        return data.split(',').slice(-1)[0];
      case 'number':
        // Round to nearest 100
        return Math.round(parseInt(data) / 100) * 100 + '';
      default:
        return data;
    }
  }

  /**
   * Suppress data (remove)
   */
  suppressData(): string {
    return '[REDACTED]';
  }

  /**
   * Apply anonymization policy to data
   */
  anonymize(data: string, policyId: string): string {
    const policy = this.policies.get(policyId);
    if (!policy) return data;

    switch (policy.method) {
      case 'masking':
        return this.maskData(data, policy.parameters?.pattern || '****');
      case 'hashing':
        return this.hashData(data, policy.parameters?.salt || 'anonymize');
      case 'generalization':
        return this.generalizeData(
          data,
          policy.parameters?.type || 'number',
          policy.parameters?.precision
        );
      case 'suppression':
        return this.suppressData();
      default:
        return data;
    }
  }
}

// ============================================================================
// GDPR Compliance Helper
// ============================================================================

export class GDPRCompliance {
  /**
   * Check if data is EU-specific PII
   */
  isEUPII(data: string, type: string): boolean {
    const euPIITypes = ['email', 'phone', 'ipAddress', 'cookieId', 'deviceId', 'bankAccount'];
    return euPIITypes.includes(type);
  }

  /**
   * Generate GDPR consent record
   */
  generateConsentRecord(
    userId: string,
    purposes: string[],
    consentGiven: boolean,
    timestamp: Date = new Date()
  ): {
    id: string;
    userId: string;
    purposes: string[];
    consentGiven: boolean;
    timestamp: Date;
    version: string;
  } {
    return {
      id: crypto.randomUUID(),
      userId,
      purposes,
      consentGiven,
      timestamp,
      version: '1.0', // GDPR version tracking
    };
  }

  /**
   * Generate data portability export (GDPR Article 20)
   */
  generateDataPortabilityExport(userData: Record<string, any>): {
    format: string;
    data: string; // JSON format
    timestamp: Date;
  } {
    return {
      format: 'application/json',
      data: JSON.stringify(userData, null, 2),
      timestamp: new Date(),
    };
  }

  /**
   * Validate Data Processing Agreement (DPA)
   */
  validateDPA(dpaContent: string): { valid: boolean; issues: string[] } {
    const issues: string[] = [];

    const requiredSections = ['processor_obligations', 'data_security', 'audit_rights', 'sub_processor'];

    requiredSections.forEach((section) => {
      if (!dpaContent.toLowerCase().includes(section.replace(/_/g, ' '))) {
        issues.push(`Missing section: ${section}`);
      }
    });

    return {
      valid: issues.length === 0,
      issues,
    };
  }
}

// ============================================================================
// NISM (SEBI) Compliance Helper
// ============================================================================

export class NISMCompliance {
  /**
   * Verify financial data is stored in India
   */
  verifyDataLocalization(dataLocation: string): boolean {
    const indianRegions = ['IN-AP', 'IN-AR', 'IN-AS', 'IN-BR', 'IN-CT', 'IN-DL', 'IN-GA', 'IN-GJ'];
    return indianRegions.some((region) => dataLocation.includes(region));
  }

  /**
   * Generate NISM audit trail
   */
  generateNISMAuditTrail(events: any[]): {
    trailId: string;
    events: any[];
    hash: string;
    signed: boolean;
    timestamp: Date;
  } {
    const trailData = JSON.stringify(events);
    const hash = crypto.createHash('sha256').update(trailData).digest('hex');

    return {
      trailId: crypto.randomUUID(),
      events,
      hash,
      signed: true,
      timestamp: new Date(),
    };
  }

  /**
   * Check transaction completeness (NISM requirement)
   */
  verifyTransactionIntegrity(transaction: Record<string, any>): {
    valid: boolean;
    missingFields: string[];
  } {
    const requiredFields = [
      'transactionId',
      'timestamp',
      'amount',
      'parties',
      'authorization',
    ];

    const missingFields = requiredFields.filter((field) => !(field in transaction));

    return {
      valid: missingFields.length === 0,
      missingFields,
    };
  }
}

// ============================================================================
// India DPA Compliance Helper
// ============================================================================

export class IndiaDPACompliance {
  /**
   * Check data localization for India DPA
   */
  isDataLocalizedInIndia(dataLocation: string): boolean {
    // Sensitive personal data must be stored in India
    const indianServers = ['aws-ap-south-1', 'gcp-asia-south1', 'azure-southindia'];
    return indianServers.some((server) => dataLocation.includes(server));
  }

  /**
   * Generate consent notice (India DPA requirement)
   */
  generateConsentNotice(purposes: string[], retention: number): {
    notice: string;
    purposes: string[];
    retentionDays: number;
    timestamp: Date;
  } {
    const notice = `
      By using this service, you consent to the collection and processing of your personal data
      for the following purposes: ${purposes.join(', ')}.

      Your data will be retained for ${retention} days and then securely deleted.
      You have the right to access, correct, and erase your data.
    `;

    return {
      notice,
      purposes,
      retentionDays: retention,
      timestamp: new Date(),
    };
  }

  /**
   * Verify sensitive data handling (India DPA)
   */
  verifySensitiveDataHandling(dataType: string): {
    requiresLocalization: boolean;
    requiresEncryption: boolean;
    maxRetentionDays: number;
  } {
    const sensitiveTypes = ['aadhar', 'pan', 'bankAccount', 'telephone'];

    return {
      requiresLocalization: sensitiveTypes.includes(dataType),
      requiresEncryption: sensitiveTypes.includes(dataType),
      maxRetentionDays: 2555, // 7 years for financial data
    };
  }
}
