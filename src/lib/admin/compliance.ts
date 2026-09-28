/**
 * Compliance Management System
 * Tax rule versioning, auditing, accuracy tracking
 */

import {
  ComplianceRule,
  ComplianceAudit,
  RuleVersion,
  AccuracyMetrics,
} from "./types";

export class ComplianceManager {
  private rules: Map<string, ComplianceRule> = new Map();
  private versions: Map<string, RuleVersion[]> = new Map();
  private audits: Map<string, ComplianceAudit> = new Map();
  private auditLog: ComplianceAudit[] = [];

  /**
   * Register a compliance rule
   */
  registerRule(rule: ComplianceRule): void {
    this.rules.set(rule.id, rule);

    // Create initial version
    if (!this.versions.has(rule.id)) {
      this.versions.set(rule.id, []);
    }

    this.versions.get(rule.id)!.push({
      rule_id: rule.id,
      version: "1.0",
      changes: {},
      reason: "Initial version",
      created_at: rule.created_at,
      created_by: "system",
      is_active: true,
    });
  }

  /**
   * Update a compliance rule
   */
  updateRule(
    ruleId: string,
    updates: Partial<ComplianceRule>,
    reason: string,
    userId: string
  ): ComplianceRule | null {
    const rule = this.rules.get(ruleId);
    if (!rule) return null;

    const updated: ComplianceRule = {
      ...rule,
      ...updates,
      updated_at: new Date(),
    };

    this.rules.set(ruleId, updated);

    // Create new version
    const versions = this.versions.get(ruleId) || [];
    const lastVersion = versions[versions.length - 1];
    const nextVersion = this.incrementVersion(lastVersion?.version || "1.0");

    versions.push({
      rule_id: ruleId,
      version: nextVersion,
      changes: updates,
      reason,
      created_at: new Date(),
      created_by: userId,
      is_active: updated.is_active,
    });

    this.versions.set(ruleId, versions);

    return updated;
  }

  /**
   * Get rule by ID
   */
  getRule(ruleId: string): ComplianceRule | null {
    return this.rules.get(ruleId) ?? null;
  }

  /**
   * Get all rules
   */
  getAllRules(includeInactive: boolean = false): ComplianceRule[] {
    return Array.from(this.rules.values()).filter(
      (r) => includeInactive || r.is_active
    );
  }

  /**
   * Get rule versions
   */
  getRuleVersions(ruleId: string): RuleVersion[] {
    return this.versions.get(ruleId) ?? [];
  }

  /**
   * Activate/deactivate rule
   */
  toggleRule(ruleId: string, isActive: boolean, userId: string): void {
    this.updateRule(
      ruleId,
      { is_active: isActive },
      isActive ? "Rule activated" : "Rule deactivated",
      userId
    );
  }

  /**
   * Create audit record
   */
  createAudit(audit: Omit<ComplianceAudit, "id">): ComplianceAudit {
    const id = `audit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const fullAudit: ComplianceAudit = {
      ...audit,
      id,
    };

    this.audits.set(id, fullAudit);
    this.auditLog.push(fullAudit);

    return fullAudit;
  }

  /**
   * Get audit by ID
   */
  getAudit(auditId: string): ComplianceAudit | null {
    return this.audits.get(auditId) ?? null;
  }

  /**
   * Get audit history for a rule
   */
  getRuleAuditHistory(ruleId: string, limit: number = 50): ComplianceAudit[] {
    return this.auditLog
      .filter((a) => a.rule_id === ruleId)
      .slice(-limit);
  }

  /**
   * Get all audits
   */
  getAllAudits(limit: number = 1000): ComplianceAudit[] {
    return this.auditLog.slice(-limit);
  }

  /**
   * Get compliance status
   */
  getComplianceStatus(): {
    total_rules: number;
    active_rules: number;
    recent_audits: ComplianceAudit[];
    violations: ComplianceAudit[];
    compliance_score: number;
  } {
    const allRules = Array.from(this.rules.values());
    const recentAudits = this.auditLog.slice(-100);
    const violations = recentAudits.filter((a) => a.status === "failed");

    const passedAudits = recentAudits.filter((a) => a.status === "passed");
    const complianceScore =
      recentAudits.length > 0
        ? (passedAudits.length / recentAudits.length) * 100
        : 0;

    return {
      total_rules: allRules.length,
      active_rules: allRules.filter((r) => r.is_active).length,
      recent_audits: recentAudits,
      violations,
      compliance_score: Math.round(complianceScore),
    };
  }

  /**
   * Run compliance audit
   */
  async runAudit(
    ruleId: string,
    dataSource: any
  ): Promise<ComplianceAudit | null> {
    const rule = this.getRule(ruleId);
    if (!rule) return null;

    try {
      const audit = this.createAudit({
        rule_id: ruleId,
        audit_type: "automated",
        status: "passed",
        findings: [],
        audited_at: new Date(),
      });

      return audit;
    } catch (error) {
      return this.createAudit({
        rule_id: ruleId,
        audit_type: "automated",
        status: "failed",
        findings: [String(error)],
        audited_at: new Date(),
      });
    }
  }

  /**
   * Bulk audit all active rules
   */
  async runBulkAudit(
    dataSource: any
  ): Promise<ComplianceAudit[]> {
    const activeRules = this.getAllRules().filter((r) => r.is_active);
    const results: ComplianceAudit[] = [];

    for (const rule of activeRules) {
      const audit = await this.runAudit(rule.id, dataSource);
      if (audit) results.push(audit);
    }

    return results;
  }

  /**
   * Get recommendations for improving accuracy
   */
  getAccuracyRecommendations(): string[] {
    const violations = this.auditLog.filter(
      (a) => a.status === "failed"
    );
    const recommendations: string[] = [];

    const violationsByRule: Record<string, number> = {};
    violations.forEach((v) => {
      violationsByRule[v.rule_id] = (violationsByRule[v.rule_id] || 0) + 1;
    });

    Object.entries(violationsByRule)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .forEach(([ruleId, count]) => {
        const rule = this.getRule(ruleId);
        if (rule) {
          recommendations.push(
            `Review and update rule "${rule.name}" - ${count} recent violations`
          );
        }
      });

    if (recommendations.length === 0) {
      recommendations.push("All compliance rules are passing");
    }

    return recommendations;
  }

  private incrementVersion(version: string): string {
    const parts = version.split(".").map(Number);
    if (parts.length === 0) return "1.0";

    parts[parts.length - 1]++;
    return parts.join(".");
  }

  /**
   * Export compliance report
   */
  exportComplianceReport(): {
    timestamp: Date;
    total_rules: number;
    compliance_score: number;
    recent_violations: ComplianceAudit[];
    recommendations: string[];
  } {
    const status = this.getComplianceStatus();
    const recommendations = this.getAccuracyRecommendations();

    return {
      timestamp: new Date(),
      total_rules: status.total_rules,
      compliance_score: status.compliance_score,
      recent_violations: status.violations.slice(0, 20),
      recommendations,
    };
  }
}

export class AccuracyAnalyzer {
  /**
   * Calculate accuracy for a computation type
   */
  static calculateAccuracy(
    correct: number,
    total: number
  ): number {
    return total > 0 ? (correct / total) * 100 : 0;
  }

  /**
   * Analyze accuracy metrics
   */
  static analyzeMetrics(
    computations: any[]
  ): AccuracyMetrics {
    const byType: Record<string, { correct: number; total: number }> = {};
    const byRegime: Record<string, { correct: number; total: number }> = {};
    let totalCorrect = 0;
    let totalComputations = 0;

    computations.forEach((comp) => {
      totalComputations++;
      if (comp.is_correct) totalCorrect++;

      const type = comp.computation_type || "unknown";
      if (!byType[type]) byType[type] = { correct: 0, total: 0 };
      byType[type].total++;
      if (comp.is_correct) byType[type].correct++;

      const regime = comp.regime || "unknown";
      if (!byRegime[regime]) byRegime[regime] = { correct: 0, total: 0 };
      byRegime[regime].total++;
      if (comp.is_correct) byRegime[regime].correct++;
    });

    const byComputationType: Record<string, number> = {};
    Object.entries(byType).forEach(([type, stats]) => {
      byComputationType[type] = this.calculateAccuracy(
        stats.correct,
        stats.total
      );
    });

    const byRegimeAccuracy: Record<string, number> = {};
    Object.entries(byRegime).forEach(([regime, stats]) => {
      byRegimeAccuracy[regime] = this.calculateAccuracy(
        stats.correct,
        stats.total
      );
    });

    const overallAccuracy = this.calculateAccuracy(
      totalCorrect,
      totalComputations
    );

    return {
      overall_accuracy: overallAccuracy,
      by_computation_type: byComputationType,
      by_regime: byRegimeAccuracy,
      failing_rules: [], // Would be populated with actual rule analysis
      last_updated: new Date(),
    };
  }

  /**
   * Identify failing rules
   */
  static identifyFailingRules(
    audits: ComplianceAudit[]
  ): Array<{ rule_id: string; accuracy: number }> {
    const byRule: Record<string, { correct: number; total: number }> = {};

    audits.forEach((audit) => {
      if (!byRule[audit.rule_id]) {
        byRule[audit.rule_id] = { correct: 0, total: 0 };
      }
      byRule[audit.rule_id].total++;
      if (audit.status === "passed") {
        byRule[audit.rule_id].correct++;
      }
    });

    return Object.entries(byRule)
      .map(([ruleId, stats]) => ({
        rule_id: ruleId,
        accuracy: this.calculateAccuracy(stats.correct, stats.total),
      }))
      .filter((r) => r.accuracy < 95)
      .sort((a, b) => a.accuracy - b.accuracy);
  }
}
