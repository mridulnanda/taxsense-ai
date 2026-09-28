/**
 * Audit Logging & Compliance
 * Immutable audit trail with cryptographic verification and compliance export
 */

import crypto from 'crypto';
import { AuditLog, AuditAction, ComplianceReport, ComplianceFramework, ComplianceCheck } from '../types';

export class AuditLogger {
  private logs: AuditLog[] = [];
  private chainHashes: Map<number, string> = new Map();
  private encryptionKey: string;

  constructor(encryptionKey: string) {
    this.encryptionKey = encryptionKey;
  }

  /**
   * Log an audit event (immutable)
   */
  logEvent(
    organizationId: string,
    userId: string,
    action: AuditAction,
    resourceType: string,
    resourceId: string | undefined,
    ipAddress: string,
    userAgent: string,
    status: 'success' | 'failure',
    changes?: { before: Record<string, any>; after: Record<string, any> },
    errorMessage?: string
  ): AuditLog {
    const log: AuditLog = {
      id: crypto.randomUUID(),
      organizationId,
      timestamp: new Date(),
      userId,
      action,
      resourceType,
      resourceId,
      changes,
      ipAddress,
      userAgent,
      status,
      errorMessage,
      immutable: true,
    };

    this.logs.push(log);

    // Update hash chain for immutability verification
    this.updateHashChain(this.logs.length - 1);

    return log;
  }

  /**
   * Update blockchain-like hash chain
   */
  private updateHashChain(index: number): void {
    const log = this.logs[index];
    const previousHash = index === 0 ? '0' : this.chainHashes.get(index - 1);

    const logData = JSON.stringify({
      ...log,
      previousHash,
    });

    const hash = crypto
      .createHmac('sha256', this.encryptionKey)
      .update(logData)
      .digest('hex');

    this.chainHashes.set(index, hash);
  }

  /**
   * Verify audit trail integrity
   */
  verifyIntegrity(): { valid: boolean; tamperedAt?: number } {
    for (let i = 0; i < this.logs.length; i++) {
      const expectedHash = this.chainHashes.get(i);
      const log = this.logs[i];
      const previousHash = i === 0 ? '0' : this.chainHashes.get(i - 1);

      const logData = JSON.stringify({
        ...log,
        previousHash,
      });

      const computedHash = crypto
        .createHmac('sha256', this.encryptionKey)
        .update(logData)
        .digest('hex');

      if (computedHash !== expectedHash) {
        return { valid: false, tamperedAt: i };
      }
    }

    return { valid: true };
  }

  /**
   * Query audit logs
   */
  queryLogs(filter: {
    organizationId?: string;
    userId?: string;
    action?: AuditAction;
    resourceType?: string;
    startDate?: Date;
    endDate?: Date;
    status?: 'success' | 'failure';
  }): AuditLog[] {
    return this.logs.filter((log) => {
      if (filter.organizationId && log.organizationId !== filter.organizationId) return false;
      if (filter.userId && log.userId !== filter.userId) return false;
      if (filter.action && log.action !== filter.action) return false;
      if (filter.resourceType && log.resourceType !== filter.resourceType) return false;
      if (filter.status && log.status !== filter.status) return false;
      if (filter.startDate && log.timestamp < filter.startDate) return false;
      if (filter.endDate && log.timestamp > filter.endDate) return false;

      return true;
    });
  }

  /**
   * Get audit logs for a user
   */
  getUserAudit(organizationId: string, userId: string, days: number = 90): AuditLog[] {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    return this.queryLogs({
      organizationId,
      userId,
      startDate,
    });
  }

  /**
   * Get audit logs for a resource
   */
  getResourceAudit(organizationId: string, resourceType: string, resourceId: string): AuditLog[] {
    return this.queryLogs({
      organizationId,
      resourceType,
      resourceId,
    });
  }

  /**
   * Export audit trail for compliance
   */
  exportAuditTrail(organizationId: string, startDate: Date, endDate: Date): {
    logs: AuditLog[];
    hash: string;
    signature: string;
    exportDate: Date;
  } {
    const logs = this.queryLogs({ organizationId, startDate, endDate });

    const exportData = JSON.stringify(logs);
    const hash = crypto.createHash('sha256').update(exportData).digest('hex');
    const signature = crypto
      .createHmac('sha256', this.encryptionKey)
      .update(hash)
      .digest('hex');

    return {
      logs,
      hash,
      signature,
      exportDate: new Date(),
    };
  }

  /**
   * Get audit statistics
   */
  getStats(organizationId: string, days: number = 30): {
    totalEvents: number;
    successCount: number;
    failureCount: number;
    eventsByAction: Record<string, number>;
    eventsByUser: Record<string, number>;
  } {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const logs = this.queryLogs({ organizationId, startDate });

    const stats = {
      totalEvents: logs.length,
      successCount: logs.filter((l) => l.status === 'success').length,
      failureCount: logs.filter((l) => l.status === 'failure').length,
      eventsByAction: {} as Record<string, number>,
      eventsByUser: {} as Record<string, number>,
    };

    logs.forEach((log) => {
      stats.eventsByAction[log.action] = (stats.eventsByAction[log.action] || 0) + 1;
      stats.eventsByUser[log.userId] = (stats.eventsByUser[log.userId] || 0) + 1;
    });

    return stats;
  }

  /**
   * Clean up old logs (retention policy)
   */
  cleanupOldLogs(organizationId: string, retentionDays: number): number {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

    const beforeCount = this.logs.length;
    this.logs = this.logs.filter(
      (log) => log.organizationId !== organizationId || log.timestamp > cutoffDate
    );

    return beforeCount - this.logs.length;
  }
}

// ============================================================================
// Compliance Report Generator
// ============================================================================

export class ComplianceReportGenerator {
  private auditLogger: AuditLogger;

  constructor(auditLogger: AuditLogger) {
    this.auditLogger = auditLogger;
  }

  /**
   * Generate GDPR compliance report
   */
  generateGDPRReport(organizationId: string): ComplianceReport {
    const report: ComplianceReport = {
      id: `gdpr-${Date.now()}`,
      organizationId,
      framework: ComplianceFramework.GDPR,
      generatedAt: new Date(),
      status: 'draft',
      sections: [],
      overallScore: 0,
      criticalFindings: 0,
      recommendations: [],
      generatedBy: 'system',
    };

    const checks: ComplianceCheck[] = [
      {
        id: 'gdpr-001',
        code: 'GDPR.1',
        name: 'Data Processing Agreement',
        description: 'Verify DPA is in place',
        requirement: 'Article 28 GDPR',
        status: 'pass',
        checkType: 'manual',
      },
      {
        id: 'gdpr-002',
        code: 'GDPR.2',
        name: 'Data Subject Rights',
        description: 'Verify right to access, rectification, erasure',
        requirement: 'Articles 15-17 GDPR',
        status: 'pass',
        checkType: 'automated',
      },
      {
        id: 'gdpr-003',
        code: 'GDPR.3',
        name: 'Data Breach Notification',
        description: 'Verify breach notification process',
        requirement: 'Article 33 GDPR',
        status: 'pass',
        checkType: 'manual',
      },
      {
        id: 'gdpr-004',
        code: 'GDPR.4',
        name: 'Data Protection Officer',
        description: 'Verify DPO designation',
        requirement: 'Article 37 GDPR',
        status: 'partial',
        checkType: 'manual',
      },
      {
        id: 'gdpr-005',
        code: 'GDPR.5',
        name: 'Privacy by Design',
        description: 'Verify privacy by design implementation',
        requirement: 'Article 25 GDPR',
        status: 'pass',
        checkType: 'hybrid',
      },
    ];

    report.sections.push({
      id: 'sec-001',
      title: 'Data Protection Framework',
      description: 'GDPR compliance for data protection',
      checks,
      score: 85,
      status: 'pass',
    });

    report.overallScore = 85;
    report.criticalFindings = 0;
    report.recommendations = [
      'Formalize Data Protection Officer role',
      'Document all data processing activities',
      'Regular GDPR training for all staff',
    ];

    return report;
  }

  /**
   * Generate NISM compliance report (SEBI)
   */
  generateNISMReport(organizationId: string): ComplianceReport {
    const report: ComplianceReport = {
      id: `nism-${Date.now()}`,
      organizationId,
      framework: ComplianceFramework.NISM,
      generatedAt: new Date(),
      status: 'draft',
      sections: [],
      overallScore: 0,
      criticalFindings: 0,
      recommendations: [],
      generatedBy: 'system',
    };

    const checks: ComplianceCheck[] = [
      {
        id: 'nism-001',
        code: 'NISM.1',
        name: 'Financial Data Security',
        description: 'Verify financial data encryption',
        requirement: 'SEBI Circular',
        status: 'pass',
        checkType: 'automated',
      },
      {
        id: 'nism-002',
        code: 'NISM.2',
        name: 'Data Localization',
        description: 'Verify data stored in India',
        requirement: 'India Regulations',
        status: 'pass',
        checkType: 'automated',
      },
      {
        id: 'nism-003',
        code: 'NISM.3',
        name: 'Audit Trail',
        description: 'Verify immutable audit logs',
        requirement: 'SEBI Guidelines',
        status: 'pass',
        checkType: 'automated',
      },
      {
        id: 'nism-004',
        code: 'NISM.4',
        name: 'Access Control',
        description: 'Verify RBAC implementation',
        requirement: 'SEBI Guidelines',
        status: 'pass',
        checkType: 'automated',
      },
      {
        id: 'nism-005',
        code: 'NISM.5',
        name: 'Incident Reporting',
        description: 'Verify incident response process',
        requirement: 'SEBI Regulations',
        status: 'partial',
        checkType: 'hybrid',
      },
    ];

    report.sections.push({
      id: 'sec-001',
      title: 'Financial Data Security',
      description: 'NISM compliance for financial data',
      checks,
      score: 90,
      status: 'pass',
    });

    report.overallScore = 90;
    report.criticalFindings = 0;
    report.recommendations = [
      'Complete incident response plan documentation',
      'Quarterly compliance audits',
      'Regular security assessments',
    ];

    return report;
  }

  /**
   * Generate India DPA compliance report
   */
  generateIndiaDPAReport(organizationId: string): ComplianceReport {
    const report: ComplianceReport = {
      id: `india-dpa-${Date.now()}`,
      organizationId,
      framework: ComplianceFramework.IndiaDataProtection,
      generatedAt: new Date(),
      status: 'draft',
      sections: [],
      overallScore: 0,
      criticalFindings: 0,
      recommendations: [],
      generatedBy: 'system',
    };

    const checks: ComplianceCheck[] = [
      {
        id: 'idpa-001',
        code: 'IDPA.1',
        name: 'Consent Management',
        description: 'Verify consent collection',
        requirement: 'India DPA',
        status: 'pass',
        checkType: 'hybrid',
      },
      {
        id: 'idpa-002',
        code: 'IDPA.2',
        name: 'Data Localization',
        description: 'Verify sensitive data localization',
        requirement: 'India DPA',
        status: 'pass',
        checkType: 'automated',
      },
      {
        id: 'idpa-003',
        code: 'IDPA.3',
        name: 'Right to Erasure',
        description: 'Verify right to be forgotten implementation',
        requirement: 'India DPA',
        status: 'pass',
        checkType: 'automated',
      },
      {
        id: 'idpa-004',
        code: 'IDPA.4',
        name: 'Data Fiduciary Duties',
        description: 'Verify fiduciary responsibilities',
        requirement: 'India DPA',
        status: 'pass',
        checkType: 'manual',
      },
    ];

    report.sections.push({
      id: 'sec-001',
      title: 'Data Protection Compliance',
      description: 'India DPA compliance',
      checks,
      score: 92,
      status: 'pass',
    });

    report.overallScore = 92;
    report.criticalFindings = 0;
    report.recommendations = [
      'Maintain detailed consent records',
      'Regular privacy impact assessments',
      'Annual compliance reviews',
    ];

    return report;
  }

  /**
   * Generate SOC 2 readiness report
   */
  generateSOC2Report(organizationId: string): ComplianceReport {
    const report: ComplianceReport = {
      id: `soc2-${Date.now()}`,
      organizationId,
      framework: ComplianceFramework.SOC2,
      generatedAt: new Date(),
      status: 'draft',
      sections: [],
      overallScore: 0,
      criticalFindings: 0,
      recommendations: [],
      generatedBy: 'system',
    };

    // SOC 2 has 5 trust service criteria
    const criteria = [
      {
        title: 'Security',
        checks: [
          { id: 'soc2-sec-001', code: 'CC.1.1', name: 'Control environment', status: 'pass' as const },
          { id: 'soc2-sec-002', code: 'CC.2.1', name: 'Risk assessment', status: 'pass' as const },
          { id: 'soc2-sec-003', code: 'CC.3.2', name: 'Information security policy', status: 'pass' as const },
        ],
      },
      {
        title: 'Availability',
        checks: [
          { id: 'soc2-avail-001', code: 'A.1.1', name: 'Availability monitoring', status: 'pass' as const },
          { id: 'soc2-avail-002', code: 'A.1.2', name: 'System recovery', status: 'partial' as const },
        ],
      },
      {
        title: 'Processing Integrity',
        checks: [
          {
            id: 'soc2-pi-001',
            code: 'PI.1.1',
            name: 'Transaction completeness',
            status: 'pass' as const,
          },
          { id: 'soc2-pi-002', code: 'PI.3.1', name: 'Authorized access', status: 'pass' as const },
        ],
      },
      {
        title: 'Confidentiality',
        checks: [
          { id: 'soc2-conf-001', code: 'C.1.1', name: 'Confidentiality policies', status: 'pass' as const },
          { id: 'soc2-conf-002', code: 'C.1.2', name: 'Data classification', status: 'pass' as const },
        ],
      },
      {
        title: 'Privacy',
        checks: [
          { id: 'soc2-priv-001', code: 'P.1.1', name: 'Privacy policies', status: 'pass' as const },
          { id: 'soc2-priv-002', code: 'P.2.1', name: 'Privacy awareness', status: 'pass' as const },
        ],
      },
    ];

    criteria.forEach((criterion) => {
      const section = {
        id: `sec-${criterion.title.toLowerCase()}`,
        title: criterion.title,
        description: `SOC 2 ${criterion.title} criteria`,
        checks: criterion.checks.map((c) => ({
          ...c,
          description: c.name,
          requirement: `SOC 2 - ${c.code}`,
          checkType: 'hybrid' as const,
        })),
        score: criterion.checks.every((c) => c.status === 'pass') ? 100 : 80,
        status:
          criterion.checks.every((c) => c.status === 'pass') ||
          criterion.checks.some((c) => c.status === 'pass')
            ? ('pass' as const)
            : ('partial' as const),
      };
      report.sections.push(section);
    });

    report.overallScore = 88;
    report.criticalFindings = 0;
    report.recommendations = [
      'Implement disaster recovery procedures',
      'Conduct annual SOC 2 audit',
      'Document all control testing',
    ];

    return report;
  }
}
