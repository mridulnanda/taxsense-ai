/**
 * Admin Dashboard Tests
 * Comprehensive test suite for enterprise admin features
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import { FinancialAnalytics } from "@/lib/admin/financial";
import { ComplianceManager, AccuracyAnalyzer } from "@/lib/admin/compliance";
import { AlertsEngine, AlertRuleEngine } from "@/lib/admin/alerts";
import { AlertRule } from "@/lib/admin/types";

describe("Financial Analytics", () => {
  describe("MRR Calculations", () => {
    it("should calculate MRR from active subscriptions", () => {
      const subscriptions = [
        { status: "active", monthly_price: 100 },
        { status: "active", monthly_price: 200 },
        { status: "cancelled", monthly_price: 150 },
      ];

      const mrr = FinancialAnalytics.calculateMRR(subscriptions);
      expect(mrr).toBe(300);
    });

    it("should handle annual subscriptions", () => {
      const subscriptions = [
        { status: "active", annual_price: 1200 },
        { status: "active", annual_price: 2400 },
      ];

      const mrr = FinancialAnalytics.calculateMRR(subscriptions);
      expect(mrr).toBe(300); // 1200/12 + 2400/12 = 300
    });

    it("should return 0 for no subscriptions", () => {
      const mrr = FinancialAnalytics.calculateMRR([]);
      expect(mrr).toBe(0);
    });
  });

  describe("ARR Calculations", () => {
    it("should calculate ARR as MRR * 12", () => {
      const subscriptions = [
        { status: "active", monthly_price: 100 },
        { status: "active", monthly_price: 200 },
      ];

      const arr = FinancialAnalytics.calculateARR(subscriptions);
      expect(arr).toBe(3600); // 300 * 12
    });
  });

  describe("ARPU Calculations", () => {
    it("should calculate ARPU correctly", () => {
      const arpu = FinancialAnalytics.calculateARPU(10000, 50);
      expect(arpu).toBe(200);
    });

    it("should handle zero users", () => {
      const arpu = FinancialAnalytics.calculateARPU(10000, 0);
      expect(arpu).toBe(0);
    });
  });

  describe("Churn Rate", () => {
    it("should calculate churn rate", () => {
      const churn = FinancialAnalytics.calculateChurnRate(10, 100);
      expect(churn).toBe(10);
    });

    it("should handle edge cases", () => {
      const churn = FinancialAnalytics.calculateChurnRate(0, 100);
      expect(churn).toBe(0);
    });
  });

  describe("LTV Calculations", () => {
    it("should calculate LTV correctly", () => {
      const ltv = FinancialAnalytics.calculateLTV(100, 0.05, 0.75);
      expect(ltv).toBeGreaterThan(0);
      expect(ltv).toBeLessThan(2000);
    });

    it("should return 0 for invalid churn", () => {
      const ltv = FinancialAnalytics.calculateLTV(100, 1, 0.75);
      expect(ltv).toBe(0);
    });
  });

  describe("Growth Rate", () => {
    it("should calculate positive growth", () => {
      const growth = FinancialAnalytics.calculateGrowthRate(120, 100);
      expect(growth).toBe(20);
    });

    it("should calculate negative growth", () => {
      const growth = FinancialAnalytics.calculateGrowthRate(80, 100);
      expect(growth).toBe(-20);
    });

    it("should handle zero previous value", () => {
      const growth = FinancialAnalytics.calculateGrowthRate(100, 0);
      expect(growth).toBe(0);
    });
  });

  describe("Revenue Projection", () => {
    it("should project revenue", () => {
      const history = Array.from({ length: 12 }, (_, i) => ({
        date: new Date(Date.now() - (12 - i) * 30 * 24 * 60 * 60 * 1000),
        subscription_revenue: 10000 + i * 500,
        addon_revenue: 1000,
        total_revenue: 11000 + i * 500,
        subscription_count: 100,
        active_subscriptions: 100,
        cancelled_subscriptions: i,
        new_subscriptions: 5,
      }));

      const projection = FinancialAnalytics.projectRevenue(history, "90d");
      expect(projection.projected_mrr).toBeGreaterThan(0);
      expect(projection.projected_arr).toBeGreaterThan(0);
      expect(projection.confidence).toBeGreaterThan(0);
    });
  });
});

describe("Compliance Management", () => {
  let manager: ComplianceManager;

  beforeEach(() => {
    manager = new ComplianceManager();
  });

  describe("Rule Registration", () => {
    it("should register a compliance rule", () => {
      const rule = {
        id: "rule_1",
        name: "Test Rule",
        description: "Test description",
        version: "1.0",
        category: "tax" as const,
        is_active: true,
        created_at: new Date(),
        updated_at: new Date(),
        changed_by: "admin",
      };

      manager.registerRule(rule);
      const retrieved = manager.getRule("rule_1");
      expect(retrieved).toEqual(rule);
    });

    it("should retrieve all rules", () => {
      manager.registerRule({
        id: "rule_1",
        name: "Rule 1",
        description: "",
        version: "1.0",
        category: "tax",
        is_active: true,
        created_at: new Date(),
        updated_at: new Date(),
        changed_by: "admin",
      });

      manager.registerRule({
        id: "rule_2",
        name: "Rule 2",
        description: "",
        version: "1.0",
        category: "data",
        is_active: false,
        created_at: new Date(),
        updated_at: new Date(),
        changed_by: "admin",
      });

      const all = manager.getAllRules();
      expect(all.length).toBe(2);

      const active = manager.getAllRules();
      expect(active.length).toBe(2);
    });
  });

  describe("Rule Updates", () => {
    it("should update rule and create version", () => {
      manager.registerRule({
        id: "rule_1",
        name: "Test Rule",
        description: "Original",
        version: "1.0",
        category: "tax",
        is_active: true,
        created_at: new Date(),
        updated_at: new Date(),
        changed_by: "admin",
      });

      const updated = manager.updateRule(
        "rule_1",
        { description: "Updated" },
        "Updated description",
        "admin"
      );

      expect(updated?.description).toBe("Updated");

      const versions = manager.getRuleVersions("rule_1");
      expect(versions.length).toBe(2); // Initial + update
    });
  });

  describe("Audit Management", () => {
    it("should create and retrieve audits", () => {
      const audit = manager.createAudit({
        rule_id: "rule_1",
        audit_type: "automated",
        status: "passed",
        findings: [],
        audited_at: new Date(),
      });

      expect(audit.id).toBeDefined();
      const retrieved = manager.getAudit(audit.id);
      expect(retrieved).toEqual(audit);
    });

    it("should get compliance status", () => {
      manager.registerRule({
        id: "rule_1",
        name: "Rule 1",
        description: "",
        version: "1.0",
        category: "tax",
        is_active: true,
        created_at: new Date(),
        updated_at: new Date(),
        changed_by: "admin",
      });

      manager.createAudit({
        rule_id: "rule_1",
        audit_type: "automated",
        status: "passed",
        findings: [],
        audited_at: new Date(),
      });

      const status = manager.getComplianceStatus();
      expect(status.total_rules).toBe(1);
      expect(status.active_rules).toBe(1);
      expect(status.compliance_score).toBeGreaterThan(0);
    });
  });
});

describe("Accuracy Analysis", () => {
  it("should calculate accuracy", () => {
    const accuracy = AccuracyAnalyzer.calculateAccuracy(95, 100);
    expect(accuracy).toBe(95);
  });

  it("should analyze metrics", () => {
    const computations = [
      { computation_type: "tax", regime: "salaried", is_correct: true },
      { computation_type: "tax", regime: "business", is_correct: true },
      { computation_type: "tax", regime: "salaried", is_correct: false },
    ];

    const metrics = AccuracyAnalyzer.analyzeMetrics(computations);
    expect(metrics.overall_accuracy).toBe(66.66666666666666);
    expect(metrics.by_computation_type).toBeDefined();
  });

  it("should identify failing rules", () => {
    const audits = [
      {
        id: "1",
        rule_id: "rule_1",
        audit_type: "automated" as const,
        status: "passed" as const,
        findings: [],
        audited_at: new Date(),
      },
      {
        id: "2",
        rule_id: "rule_1",
        audit_type: "automated" as const,
        status: "failed" as const,
        findings: [],
        audited_at: new Date(),
      },
    ];

    const failing = AccuracyAnalyzer.identifyFailingRules(audits);
    expect(failing.some((r) => r.rule_id === "rule_1")).toBe(true);
  });
});

describe("Alerts Engine", () => {
  let engine: AlertsEngine;

  beforeEach(() => {
    engine = new AlertsEngine();
  });

  it("should create alerts", () => {
    const alert = engine.createAlert({
      title: "Test Alert",
      description: "Test description",
      severity: "warning",
      status: "active",
      category: "system",
    });

    expect(alert.id).toBeDefined();
    expect(alert.triggered_at).toBeDefined();
  });

  it("should acknowledge alerts", () => {
    const alert = engine.createAlert({
      title: "Test",
      description: "",
      severity: "critical",
      status: "active",
      category: "system",
    });

    const acked = engine.acknowledgeAlert(alert.id, "user_1");
    expect(acked?.status).toBe("acknowledged");
    expect(acked?.acknowledged_by).toBe("user_1");
  });

  it("should resolve alerts", () => {
    const alert = engine.createAlert({
      title: "Test",
      description: "",
      severity: "warning",
      status: "active",
      category: "system",
    });

    const resolved = engine.resolveAlert(alert.id);
    expect(resolved?.status).toBe("resolved");
    expect(resolved?.resolved_at).toBeDefined();
  });

  it("should get active alerts", () => {
    engine.createAlert({
      title: "Alert 1",
      description: "",
      severity: "warning",
      status: "active",
      category: "system",
    });

    engine.createAlert({
      title: "Alert 2",
      description: "",
      severity: "critical",
      status: "active",
      category: "system",
    });

    const active = engine.getActiveAlerts();
    expect(active.length).toBe(2);
  });

  it("should filter alerts", () => {
    engine.createAlert({
      title: "Alert 1",
      description: "",
      severity: "critical",
      status: "active",
      category: "system",
    });

    engine.createAlert({
      title: "Alert 2",
      description: "",
      severity: "warning",
      status: "active",
      category: "system",
    });

    const critical = engine.filterAlerts({ severity: "critical" });
    expect(critical.length).toBe(1);
  });
});

describe("Alert Rule Engine", () => {
  let ruleEngine: AlertRuleEngine;

  beforeEach(() => {
    ruleEngine = new AlertRuleEngine();
  });

  it("should register rules", () => {
    const rule: AlertRule = {
      id: "rule_1",
      name: "Test Rule",
      condition: "error_rate > 5",
      severity: "critical",
      channels: ["email"],
      is_active: true,
      created_at: new Date(),
    };

    ruleEngine.registerRule(rule);
    const retrieved = ruleEngine.getRule("rule_1");
    expect(retrieved).toEqual(rule);
  });

  it("should evaluate conditions", () => {
    const result1 = ruleEngine.evaluateCondition("error_rate > 5", { error_rate: 10 });
    expect(result1).toBe(true);

    const result2 = ruleEngine.evaluateCondition("error_rate > 5", { error_rate: 3 });
    expect(result2).toBe(false);
  });

  it("should evaluate rules batch", () => {
    const rule1: AlertRule = {
      id: "rule_1",
      name: "Rule 1",
      condition: "error_rate > 5",
      severity: "critical",
      channels: ["email"],
      is_active: true,
      created_at: new Date(),
    };

    const rule2: AlertRule = {
      id: "rule_2",
      name: "Rule 2",
      condition: "cpu > 80",
      severity: "warning",
      channels: ["in_app"],
      is_active: true,
      created_at: new Date(),
    };

    ruleEngine.registerRule(rule1);
    ruleEngine.registerRule(rule2);

    const triggered = ruleEngine.evaluateRules({ error_rate: 10, cpu: 50 });
    expect(triggered.length).toBe(1);
    expect(triggered[0].id).toBe("rule_1");
  });

  it("should handle escalation", () => {
    const rule: AlertRule = {
      id: "rule_1",
      name: "Test",
      condition: "error > 0",
      severity: "critical",
      channels: ["email"],
      is_active: true,
      escalation_minutes: 15,
      created_at: new Date(),
    };

    ruleEngine.registerRule(rule);

    // Without previous trigger
    expect(ruleEngine.shouldEscalate("rule_1")).toBe(true);

    // With recent trigger
    const recent = new Date(Date.now() - 5 * 60 * 1000); // 5 min ago
    expect(ruleEngine.shouldEscalate("rule_1", recent)).toBe(false);

    // With old trigger
    const old = new Date(Date.now() - 20 * 60 * 1000); // 20 min ago
    expect(ruleEngine.shouldEscalate("rule_1", old)).toBe(true);
  });
});

describe("Admin Dashboard Integration", () => {
  it("should handle real-time metrics flow", async () => {
    const subscriptions = Array.from({ length: 100 }, (_, i) => ({
      status: i < 95 ? "active" : "cancelled",
      monthly_price: 100 + Math.random() * 400,
    }));

    const mrr = FinancialAnalytics.calculateMRR(subscriptions);
    expect(mrr).toBeGreaterThan(0);

    const arr = FinancialAnalytics.calculateARR(subscriptions);
    expect(arr).toBe(mrr * 12);

    const churnData = FinancialAnalytics.analyzeChurn(subscriptions, "30d");
    expect(churnData.churn_rate).toBeGreaterThan(0);
  });

  it("should handle multi-dashboard consistency", () => {
    const manager = new ComplianceManager();
    const alerts = new AlertsEngine();

    // Create compliance alert
    manager.registerRule({
      id: "rule_compliance",
      name: "Compliance Check",
      description: "Test",
      version: "1.0",
      category: "audit",
      is_active: true,
      created_at: new Date(),
      updated_at: new Date(),
      changed_by: "system",
    });

    // Create corresponding alert
    const alert = alerts.createAlert({
      title: "Compliance Rule Violation",
      description: "rule_compliance failed",
      severity: "critical",
      status: "active",
      category: "compliance",
    });

    expect(alert).toBeDefined();
    expect(manager.getRule("rule_compliance")).toBeDefined();
  });
});
