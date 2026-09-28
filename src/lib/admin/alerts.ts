/**
 * Alerts & Notifications System
 * Real-time alerting with rule engine and delivery channels
 */

import { Alert, AlertRule, AlertSeverity, AlertStatus } from "./types";

export class AlertsEngine {
  private alerts: Map<string, Alert> = new Map();
  private rules: Map<string, AlertRule> = new Map();
  private subscribers: Map<string, Set<(alert: Alert) => void>> = new Map();
  private alertHistory: Alert[] = [];
  private maxHistorySize = 1000;

  /**
   * Create a new alert
   */
  createAlert(alert: Omit<Alert, "id" | "triggered_at">): Alert {
    const id = `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const fullAlert: Alert = {
      ...alert,
      id,
      triggered_at: new Date(),
    };

    this.alerts.set(id, fullAlert);
    this.alertHistory.push(fullAlert);

    // Keep history size bounded
    if (this.alertHistory.length > this.maxHistorySize) {
      this.alertHistory.shift();
    }

    this.notifySubscribers("new_alert", fullAlert);
    return fullAlert;
  }

  /**
   * Acknowledge an alert
   */
  acknowledgeAlert(alertId: string, userId: string): Alert | null {
    const alert = this.alerts.get(alertId);
    if (!alert) return null;

    const acknowledged: Alert = {
      ...alert,
      status: "acknowledged",
      acknowledged_at: new Date(),
      acknowledged_by: userId,
    };

    this.alerts.set(alertId, acknowledged);
    this.notifySubscribers("alert_acknowledged", acknowledged);
    return acknowledged;
  }

  /**
   * Resolve an alert
   */
  resolveAlert(alertId: string): Alert | null {
    const alert = this.alerts.get(alertId);
    if (!alert) return null;

    const resolved: Alert = {
      ...alert,
      status: "resolved",
      resolved_at: new Date(),
    };

    this.alerts.set(alertId, resolved);
    this.notifySubscribers("alert_resolved", resolved);
    return resolved;
  }

  /**
   * Get all active alerts
   */
  getActiveAlerts(): Alert[] {
    return Array.from(this.alerts.values()).filter(
      (a) => a.status === "active"
    );
  }

  /**
   * Get alert by ID
   */
  getAlert(alertId: string): Alert | null {
    return this.alerts.get(alertId) ?? null;
  }

  /**
   * Get alert history
   */
  getAlertHistory(limit: number = 100): Alert[] {
    return this.alertHistory.slice(-limit);
  }

  /**
   * Filter alerts
   */
  filterAlerts(filters: {
    severity?: AlertSeverity;
    status?: AlertStatus;
    category?: string;
    since?: Date;
  }): Alert[] {
    return Array.from(this.alerts.values()).filter((alert) => {
      if (filters.severity && alert.severity !== filters.severity) return false;
      if (filters.status && alert.status !== filters.status) return false;
      if (filters.category && alert.category !== filters.category)
        return false;
      if (filters.since && alert.triggered_at < filters.since) return false;
      return true;
    });
  }

  /**
   * Subscribe to alert events
   */
  subscribe(
    event: string,
    callback: (alert: Alert) => void
  ): () => void {
    if (!this.subscribers.has(event)) {
      this.subscribers.set(event, new Set());
    }
    this.subscribers.get(event)!.add(callback);

    return () => {
      const subs = this.subscribers.get(event);
      if (subs) {
        subs.delete(callback);
      }
    };
  }

  private notifySubscribers(event: string, alert: Alert): void {
    const subs = this.subscribers.get(event);
    if (subs) {
      subs.forEach((callback) => {
        try {
          callback(alert);
        } catch (error) {
          console.error("[AlertsEngine] Subscriber error:", error);
        }
      });
    }
  }
}

export class AlertRuleEngine {
  private rules: Map<string, AlertRule> = new Map();
  private evaluationCache: Map<
    string,
    { result: boolean; timestamp: Date }
  > = new Map();

  /**
   * Register an alert rule
   */
  registerRule(rule: AlertRule): void {
    this.rules.set(rule.id, rule);
  }

  /**
   * Remove a rule
   */
  removeRule(ruleId: string): void {
    this.rules.delete(ruleId);
  }

  /**
   * Get rule by ID
   */
  getRule(ruleId: string): AlertRule | null {
    return this.rules.get(ruleId) ?? null;
  }

  /**
   * Get all active rules
   */
  getActiveRules(): AlertRule[] {
    return Array.from(this.rules.values()).filter((r) => r.is_active);
  }

  /**
   * Evaluate condition and return if alert should trigger
   */
  evaluateCondition(
    condition: string,
    data: Record<string, any>
  ): boolean {
    try {
      // Simple expression evaluator
      // Supports: metric > threshold, metric < threshold, metric == value
      const match = condition.match(
        /^(\w+)\s*(>|<|>=|<=|==|!=)\s*(.+)$/
      );
      if (!match) return false;

      const [, metric, operator, value] = match;
      const metricValue = this.getMetricValue(data, metric);

      if (metricValue === null) return false;

      const threshold = parseFloat(value);

      switch (operator) {
        case ">":
          return metricValue > threshold;
        case "<":
          return metricValue < threshold;
        case ">=":
          return metricValue >= threshold;
        case "<=":
          return metricValue <= threshold;
        case "==":
          return metricValue === threshold;
        case "!=":
          return metricValue !== threshold;
        default:
          return false;
      }
    } catch (error) {
      console.error("[AlertRuleEngine] Evaluation error:", error);
      return false;
    }
  }

  private getMetricValue(
    data: Record<string, any>,
    path: string
  ): number | null {
    const keys = path.split(".");
    let value: any = data;

    for (const key of keys) {
      if (value && typeof value === "object" && key in value) {
        value = value[key];
      } else {
        return null;
      }
    }

    return typeof value === "number" ? value : null;
  }

  /**
   * Batch evaluate rules against data
   */
  evaluateRules(data: Record<string, any>): AlertRule[] {
    return this.getActiveRules().filter((rule) =>
      this.evaluateCondition(rule.condition, data)
    );
  }

  /**
   * Update rule escalation timing
   */
  shouldEscalate(
    ruleId: string,
    lastTriggered?: Date
  ): boolean {
    const rule = this.getRule(ruleId);
    if (!rule || !rule.escalation_minutes) return false;

    if (!lastTriggered) return true;

    const escalationTime = rule.escalation_minutes * 60 * 1000;
    return Date.now() - lastTriggered.getTime() >= escalationTime;
  }
}

// ============================================================================
// COMMON ALERT RULES
// ============================================================================

export const DEFAULT_ALERT_RULES: AlertRule[] = [
  {
    id: "rule_high_error_rate",
    name: "High Error Rate",
    condition: "error_rate > 5",
    severity: "critical",
    channels: ["email", "in_app"],
    is_active: true,
    escalation_minutes: 15,
    created_at: new Date(),
  },
  {
    id: "rule_api_latency",
    name: "API Latency High",
    condition: "api_response_time > 2000",
    severity: "warning",
    channels: ["in_app"],
    is_active: true,
    escalation_minutes: 30,
    created_at: new Date(),
  },
  {
    id: "rule_computation_queue",
    name: "Computation Queue Backlog",
    condition: "pending_computations > 1000",
    severity: "warning",
    channels: ["email", "in_app"],
    is_active: true,
    escalation_minutes: 60,
    created_at: new Date(),
  },
  {
    id: "rule_revenue_anomaly",
    name: "Revenue Anomaly Detected",
    condition: "daily_revenue_variance > 30",
    severity: "warning",
    channels: ["email"],
    is_active: true,
    created_at: new Date(),
  },
  {
    id: "rule_high_churn",
    name: "High Churn Rate",
    condition: "churn_rate > 5",
    severity: "warning",
    channels: ["email"],
    is_active: true,
    created_at: new Date(),
  },
  {
    id: "rule_low_active_users",
    name: "Low Active Users",
    condition: "active_users < 100",
    severity: "warning",
    channels: ["email", "in_app"],
    is_active: true,
    created_at: new Date(),
  },
  {
    id: "rule_compliance_violation",
    name: "Compliance Rule Violation",
    condition: "compliance_violations > 0",
    severity: "critical",
    channels: ["email", "in_app"],
    is_active: true,
    escalation_minutes: 5,
    created_at: new Date(),
  },
];

// ============================================================================
// NOTIFICATION DELIVERY
// ============================================================================

export interface NotificationDelivery {
  send(
    alert: Alert,
    channels: string[],
    recipients: string[]
  ): Promise<void>;
}

export class EmailNotificationDelivery implements NotificationDelivery {
  async send(
    alert: Alert,
    channels: string[],
    recipients: string[]
  ): Promise<void> {
    if (!channels.includes("email")) return;

    // Implementation would integrate with email service
    console.log(`[EmailNotification] Sending to ${recipients.join(", ")}:`, alert);
  }
}

export class SlackNotificationDelivery implements NotificationDelivery {
  constructor(private webhookUrl: string) {}

  async send(
    alert: Alert,
    channels: string[],
    recipients: string[]
  ): Promise<void> {
    if (!channels.includes("slack")) return;

    const message = {
      text: `${alert.title}`,
      attachments: [
        {
          color:
            alert.severity === "critical"
              ? "danger"
              : alert.severity === "warning"
                ? "warning"
                : "good",
          fields: [
            { title: "Severity", value: alert.severity },
            { title: "Category", value: alert.category },
            { title: "Description", value: alert.description },
            { title: "Time", value: alert.triggered_at.toISOString() },
          ],
        },
      ],
    };

    try {
      await fetch(this.webhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(message),
      });
    } catch (error) {
      console.error("[SlackNotification] Send failed:", error);
    }
  }
}

export class InAppNotificationDelivery implements NotificationDelivery {
  async send(
    alert: Alert,
    channels: string[],
    recipients: string[]
  ): Promise<void> {
    if (!channels.includes("in_app")) return;

    // Store notification in real-time store for UI display
    console.log(
      `[InAppNotification] Displaying to ${recipients.join(", ")}:`,
      alert
    );
  }
}
