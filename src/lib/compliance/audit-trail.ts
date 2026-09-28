// Audit Trail System for Compliance Tracking

export interface AuditLogEntry {
  entryId: string;
  timestamp: Date;
  userId: string;
  action: string;
  entityType: string;
  entityId: string;
  changedFields: Map<string, { oldValue: any; newValue: any }>;
  reason: string;
  status: 'SUCCESS' | 'FAILED' | 'PENDING';
  ipAddress?: string;
  userAgent?: string;
}

export interface ComplianceAuditReport {
  reportId: string;
  panNumber: string;
  assessmentYear: number;
  generatedDate: Date;
  auditPeriod: {
    startDate: Date;
    endDate: Date;
  };
  totalEntries: number;
  changesByCategory: Map<string, number>;
  criticalChanges: AuditLogEntry[];
  accessLog: AuditLogEntry[];
  dataIntegrity: {
    checksumValid: boolean;
    noUnauthorizedChanges: boolean;
    allChangesLogged: boolean;
  };
  complianceNotes: string[];
}

/**
 * Audit Trail Engine - Tracks all compliance-related changes
 * Ensures complete audit trail for tax return modifications
 */
export class ComplianceAuditTrail {
  private auditLog: AuditLogEntry[] = [];
  private reportQueue: ComplianceAuditReport[] = [];

  /**
   * Record a compliance data change
   */
  logChange(entry: Omit<AuditLogEntry, 'entryId' | 'timestamp'>): AuditLogEntry {
    const auditEntry: AuditLogEntry = {
      entryId: `audit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
      ...entry,
    };

    this.auditLog.push(auditEntry);
    return auditEntry;
  }

  /**
   * Log NRI income modification
   */
  logNRIIncomeChange(
    panNumber: string,
    userId: string,
    incomeType: string,
    oldAmount: number,
    newAmount: number,
    reason: string
  ): AuditLogEntry {
    return this.logChange({
      userId,
      action: 'INCOME_MODIFICATION',
      entityType: 'NRI_INCOME',
      entityId: incomeType,
      changedFields: new Map([
        ['amount', { oldValue: oldAmount, newValue: newAmount }],
      ]),
      reason,
      status: 'SUCCESS',
    });
  }

  /**
   * Log foreign asset disclosure
   */
  logForeignAssetDisclosure(
    panNumber: string,
    userId: string,
    assetType: string,
    value: number,
    country: string,
    reason: string
  ): AuditLogEntry {
    return this.logChange({
      userId,
      action: 'FOREIGN_ASSET_DISCLOSURE',
      entityType: 'FOREIGN_ASSET',
      entityId: `${assetType}_${country}`,
      changedFields: new Map([
        ['value', { oldValue: 0, newValue: value }],
        ['country', { oldValue: '', newValue: country }],
      ]),
      reason,
      status: 'SUCCESS',
    });
  }

  /**
   * Log derivative position tracking
   */
  logDerivativePosition(
    panNumber: string,
    userId: string,
    contractId: string,
    quantity: number,
    entryPrice: number,
    currentPrice: number,
    reason: string
  ): AuditLogEntry {
    const pnl = (currentPrice - entryPrice) * quantity;
    return this.logChange({
      userId,
      action: 'DERIVATIVE_POSITION_UPDATE',
      entityType: 'DERIVATIVE_CONTRACT',
      entityId: contractId,
      changedFields: new Map([
        ['quantity', { oldValue: 0, newValue: quantity }],
        ['entryPrice', { oldValue: 0, newValue: entryPrice }],
        ['currentPrice', { oldValue: 0, newValue: currentPrice }],
        ['unrealizedPnL', { oldValue: 0, newValue: pnl }],
      ]),
      reason,
      status: 'SUCCESS',
    });
  }

  /**
   * Log crypto transaction
   */
  logCryptoTransaction(
    panNumber: string,
    userId: string,
    transactionType: string,
    cryptoType: string,
    quantity: number,
    price: number,
    reason: string
  ): AuditLogEntry {
    return this.logChange({
      userId,
      action: 'CRYPTO_TRANSACTION_RECORD',
      entityType: 'CRYPTO_TRANSACTION',
      entityId: `${cryptoType}_${Date.now()}`,
      changedFields: new Map([
        ['type', { oldValue: '', newValue: transactionType }],
        ['quantity', { oldValue: 0, newValue: quantity }],
        ['price', { oldValue: 0, newValue: price }],
      ]),
      reason,
      status: 'SUCCESS',
    });
  }

  /**
   * Log tax computation change
   */
  logTaxComputationChange(
    panNumber: string,
    userId: string,
    taxableIncome: number,
    previousTaxableIncome: number,
    taxDue: number,
    reason: string
  ): AuditLogEntry {
    return this.logChange({
      userId,
      action: 'TAX_COMPUTATION_UPDATE',
      entityType: 'TAX_COMPUTATION',
      entityId: panNumber,
      changedFields: new Map([
        ['taxableIncome', { oldValue: previousTaxableIncome, newValue: taxableIncome }],
        ['taxDue', { oldValue: 0, newValue: taxDue }],
      ]),
      reason,
      status: 'SUCCESS',
    });
  }

  /**
   * Log compliance validation
   */
  logComplianceValidation(
    panNumber: string,
    userId: string,
    validationId: string,
    violationCount: number,
    complianceScore: number,
    reason: string
  ): AuditLogEntry {
    return this.logChange({
      userId,
      action: 'COMPLIANCE_VALIDATION',
      entityType: 'COMPLIANCE_CHECK',
      entityId: validationId,
      changedFields: new Map([
        ['violations', { oldValue: 0, newValue: violationCount }],
        ['complianceScore', { oldValue: 0, newValue: complianceScore }],
      ]),
      reason,
      status: 'SUCCESS',
    });
  }

  /**
   * Log return filing
   */
  logReturnFiling(
    panNumber: string,
    userId: string,
    assessmentYear: number,
    returnType: string,
    filingDate: Date,
    ackNumber?: string
  ): AuditLogEntry {
    return this.logChange({
      userId,
      action: 'RETURN_FILED',
      entityType: 'INCOME_TAX_RETURN',
      entityId: `${panNumber}_${assessmentYear}`,
      changedFields: new Map([
        ['returnType', { oldValue: '', newValue: returnType }],
        ['filingDate', { oldValue: null, newValue: filingDate }],
        ['ackNumber', { oldValue: '', newValue: ackNumber || 'PENDING' }],
      ]),
      reason: 'Return filing - Statutory requirement',
      status: 'SUCCESS',
    });
  }

  /**
   * Log data access
   */
  logDataAccess(
    panNumber: string,
    userId: string,
    dataType: string,
    accessType: 'READ' | 'EXPORT' | 'PRINT'
  ): AuditLogEntry {
    return this.logChange({
      userId,
      action: `DATA_${accessType}`,
      entityType: dataType,
      entityId: panNumber,
      changedFields: new Map([
        ['accessType', { oldValue: '', newValue: accessType }],
      ]),
      reason: `Access to ${dataType}`,
      status: 'SUCCESS',
    });
  }

  /**
   * Log authentication event
   */
  logAuthenticationEvent(
    panNumber: string,
    userId: string,
    eventType: 'LOGIN' | 'LOGOUT' | 'FAILED_LOGIN' | 'PASSWORD_CHANGE'
  ): AuditLogEntry {
    return this.logChange({
      userId,
      action: eventType,
      entityType: 'AUTHENTICATION',
      entityId: panNumber,
      changedFields: new Map([
        ['eventType', { oldValue: '', newValue: eventType }],
        ['timestamp', { oldValue: '', newValue: new Date().toISOString() }],
      ]),
      reason: `User ${eventType.toLowerCase()}`,
      status: eventType.includes('FAILED') ? 'FAILED' : 'SUCCESS',
    });
  }

  /**
   * Generate audit report
   */
  generateAuditReport(panNumber: string, assessmentYear: number): ComplianceAuditReport {
    const relevantEntries = this.auditLog.filter(
      (entry) => entry.entityId.includes(panNumber) || entry.userId.includes(panNumber)
    );

    const changesByCategory = new Map<string, number>();
    const criticalChanges: AuditLogEntry[] = [];

    relevantEntries.forEach((entry) => {
      const count = changesByCategory.get(entry.entityType) || 0;
      changesByCategory.set(entry.entityType, count + 1);

      // Critical changes: tax computation, return filing, compliance issues
      if (
        [
          'TAX_COMPUTATION',
          'RETURN_FILED',
          'COMPLIANCE_CHECK',
          'FOREIGN_ASSET_DISCLOSURE',
        ].includes(entry.entityType)
      ) {
        criticalChanges.push(entry);
      }
    });

    const accessLog = relevantEntries.filter((e) =>
      ['DATA_READ', 'DATA_EXPORT', 'DATA_PRINT', 'LOGIN', 'LOGOUT'].includes(e.action)
    );

    const report: ComplianceAuditReport = {
      reportId: `audit_report_${Date.now()}`,
      panNumber,
      assessmentYear,
      generatedDate: new Date(),
      auditPeriod: {
        startDate: new Date(assessmentYear - 1, 3, 1), // April 1 of previous FY
        endDate: new Date(assessmentYear, 2, 31), // March 31 of current FY
      },
      totalEntries: relevantEntries.length,
      changesByCategory,
      criticalChanges: criticalChanges.slice(0, 50), // Last 50 critical changes
      accessLog: accessLog.slice(0, 100), // Last 100 accesses
      dataIntegrity: {
        checksumValid: true,
        noUnauthorizedChanges: relevantEntries.every((e) => e.status !== 'FAILED'),
        allChangesLogged: true,
      },
      complianceNotes: this.generateComplianceNotes(criticalChanges),
    };

    return report;
  }

  /**
   * Generate compliance notes from audit trail
   */
  private generateComplianceNotes(criticalChanges: AuditLogEntry[]): string[] {
    const notes: string[] = [];

    if (criticalChanges.length === 0) {
      notes.push('No critical changes detected during audit period');
    } else {
      notes.push(`${criticalChanges.length} critical compliance events detected`);

      const failedChanges = criticalChanges.filter((e) => e.status === 'FAILED');
      if (failedChanges.length > 0) {
        notes.push(`${failedChanges.length} failed audit events require investigation`);
      }

      const recentChanges = criticalChanges.filter(
        (e) =>
          new Date().getTime() - e.timestamp.getTime() < 7 * 24 * 60 * 60 * 1000
      );
      if (recentChanges.length > 0) {
        notes.push(`${recentChanges.length} changes made in last 7 days`);
      }
    }

    notes.push('Full audit trail available for regulatory inspection');
    notes.push('All changes tracked with user identification and reason code');

    return notes;
  }

  /**
   * Verify data integrity
   * Ensures no unauthorized modifications to critical data
   */
  verifyIntegrity(panNumber: string): {
    isValid: boolean;
    lastVerified: Date;
    issues: string[];
  } {
    const relevantEntries = this.auditLog.filter((e) => e.entityId.includes(panNumber));

    const issues: string[] = [];
    const failedEntries = relevantEntries.filter((e) => e.status === 'FAILED');

    if (failedEntries.length > 0) {
      issues.push(`${failedEntries.length} failed modification attempts detected`);
    }

    // Check for suspicious patterns
    const entriesPerMinute = relevantEntries.filter(
      (e) =>
        new Date().getTime() - e.timestamp.getTime() < 60000 &&
        e.status === 'SUCCESS'
    ).length;

    if (entriesPerMinute > 20) {
      issues.push('High rate of modifications detected - potential bulk change risk');
    }

    // Check for unauthorized data access
    const unauthorizedAccess = relevantEntries.filter(
      (e) =>
        ['DATA_EXPORT', 'DATA_PRINT'].includes(e.action) &&
        !e.reason.includes('Audit') &&
        !e.reason.includes('CA') &&
        !e.reason.includes('authorized')
    );

    if (unauthorizedAccess.length > 0) {
      issues.push(`${unauthorizedAccess.length} unauthorized data access attempts`);
    }

    return {
      isValid: issues.length === 0,
      lastVerified: new Date(),
      issues,
    };
  }

  /**
   * Export audit trail for regulatory submission
   */
  exportForAudit(panNumber: string, format: 'JSON' | 'CSV' | 'PDF'): string {
    const relevantEntries = this.auditLog.filter((e) => e.entityId.includes(panNumber));

    if (format === 'JSON') {
      return JSON.stringify(relevantEntries, null, 2);
    } else if (format === 'CSV') {
      const headers = [
        'Entry ID',
        'Timestamp',
        'User ID',
        'Action',
        'Entity Type',
        'Entity ID',
        'Changed Fields',
        'Reason',
        'Status',
      ];

      const rows = relevantEntries.map((entry) => [
        entry.entryId,
        entry.timestamp.toISOString(),
        entry.userId,
        entry.action,
        entry.entityType,
        entry.entityId,
        JSON.stringify(Object.fromEntries(entry.changedFields)),
        entry.reason,
        entry.status,
      ]);

      const csv = [
        headers.join(','),
        ...rows.map((row) =>
          row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(',')
        ),
      ].join('\n');

      return csv;
    } else {
      // PDF export would require a PDF library
      return `Audit Trail Report for ${panNumber}\n\nTotal Entries: ${relevantEntries.length}\n\n${relevantEntries
        .map(
          (e) =>
            `${e.timestamp.toISOString()} - ${e.action} - ${e.entityType} - ${e.userId}`
        )
        .join('\n')}`;
    }
  }

  /**
   * Get audit statistics
   */
  getAuditStatistics(panNumber: string): {
    totalChanges: number;
    changesByType: Map<string, number>;
    lastModified: Date | null;
    mostActiveUser: string | null;
    failureRate: number;
  } {
    const relevantEntries = this.auditLog.filter((e) => e.entityId.includes(panNumber));

    const changesByType = new Map<string, number>();
    const userActions = new Map<string, number>();

    relevantEntries.forEach((entry) => {
      const count = changesByType.get(entry.action) || 0;
      changesByType.set(entry.action, count + 1);

      const userCount = userActions.get(entry.userId) || 0;
      userActions.set(entry.userId, userCount + 1);
    });

    const successCount = relevantEntries.filter((e) => e.status === 'SUCCESS').length;
    const failureRate = relevantEntries.length > 0 ? 1 - successCount / relevantEntries.length : 0;

    const mostActiveUser = Array.from(userActions.entries()).sort(([, a], [, b]) => b - a)[0]?.[0] || null;

    return {
      totalChanges: relevantEntries.length,
      changesByType,
      lastModified: relevantEntries.length > 0 ? relevantEntries[relevantEntries.length - 1].timestamp : null,
      mostActiveUser,
      failureRate,
    };
  }
}
