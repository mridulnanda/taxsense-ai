/**
 * Incident Response & Monitoring
 * Security incident management, event tracking, anomaly detection
 */

import crypto from 'crypto';
import {
  SecurityIncident,
  IncidentType,
  IncidentResponse,
  SecurityEvent,
  SecurityEventType,
  AnomalyDetection,
} from '../types';

// ============================================================================
// Incident Management
// ============================================================================

export class IncidentManager {
  private incidents: Map<string, SecurityIncident> = new Map();
  private responses: Map<string, IncidentResponse[]> = new Map();

  /**
   * Report a security incident
   */
  reportIncident(
    organizationId: string,
    title: string,
    description: string,
    severity: 'critical' | 'high' | 'medium' | 'low',
    type: IncidentType,
    reportedBy: string,
    affectedUsers: number = 0,
    affectedSystems: string[] = []
  ): SecurityIncident {
    const id = crypto.randomUUID();

    const incident: SecurityIncident = {
      id,
      organizationId,
      title,
      description,
      severity,
      type,
      status: 'reported',
      reportedAt: new Date(),
      reportedBy,
      affectedUsers,
      affectedSystems,
    };

    this.incidents.set(id, incident);
    return incident;
  }

  /**
   * Acknowledge incident
   */
  acknowledgeIncident(incidentId: string, acknowledgedBy: string): SecurityIncident | null {
    const incident = this.incidents.get(incidentId);
    if (!incident) return null;

    incident.status = 'acknowledged';
    incident.acknowledgedAt = new Date();
    incident.acknowledgedBy = acknowledgedBy;

    this.incidents.set(incidentId, incident);
    return incident;
  }

  /**
   * Add incident response action
   */
  addResponseAction(
    incidentId: string,
    action: string,
    performedBy: string,
    result?: string,
    nextStep?: string
  ): IncidentResponse | null {
    const incident = this.incidents.get(incidentId);
    if (!incident) return null;

    const response: IncidentResponse = {
      id: crypto.randomUUID(),
      incidentId,
      action,
      performedAt: new Date(),
      performedBy,
      status: 'pending',
      result,
      nextStep,
    };

    if (!this.responses.has(incidentId)) {
      this.responses.set(incidentId, []);
    }
    this.responses.get(incidentId)!.push(response);

    // Auto-update incident status
    incident.status = 'investigating';

    return response;
  }

  /**
   * Resolve incident
   */
  resolveIncident(
    incidentId: string,
    resolvedBy: string,
    rootCause: string,
    remediationSteps: string[]
  ): SecurityIncident | null {
    const incident = this.incidents.get(incidentId);
    if (!incident) return null;

    incident.status = 'resolved';
    incident.resolvedAt = new Date();
    incident.resolvedBy = resolvedBy;
    incident.rootCause = rootCause;
    incident.remediationSteps = remediationSteps;

    this.incidents.set(incidentId, incident);
    return incident;
  }

  /**
   * Get incident with response history
   */
  getIncidentWithHistory(incidentId: string): {
    incident: SecurityIncident | null;
    responses: IncidentResponse[];
  } {
    const incident = this.incidents.get(incidentId);
    const responses = this.responses.get(incidentId) || [];

    return { incident: incident || null, responses };
  }

  /**
   * Get active incidents
   */
  getActiveIncidents(organizationId: string): SecurityIncident[] {
    return Array.from(this.incidents.values()).filter(
      (i) =>
        i.organizationId === organizationId &&
        ['reported', 'acknowledged', 'investigating', 'contained'].includes(i.status)
    );
  }

  /**
   * Get incidents by severity
   */
  getIncidentsBySeverity(organizationId: string, severity: string): SecurityIncident[] {
    return Array.from(this.incidents.values()).filter(
      (i) => i.organizationId === organizationId && i.severity === severity
    );
  }

  /**
   * Generate incident statistics
   */
  getIncidentStats(organizationId: string, days: number = 30): {
    total: number;
    critical: number;
    high: number;
    medium: number;
    low: number;
    avgResolutionTime: number;
  } {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    const incidents = Array.from(this.incidents.values()).filter(
      (i) => i.organizationId === organizationId && i.reportedAt > cutoffDate
    );

    const resolved = incidents.filter((i) => i.resolvedAt);

    const avgResolutionTime =
      resolved.length > 0
        ? resolved.reduce((sum, i) => {
            if (!i.resolvedAt) return sum;
            return sum + (i.resolvedAt.getTime() - i.reportedAt.getTime());
          }, 0) / resolved.length / 3600000
        : 0; // Convert to hours

    return {
      total: incidents.length,
      critical: incidents.filter((i) => i.severity === 'critical').length,
      high: incidents.filter((i) => i.severity === 'high').length,
      medium: incidents.filter((i) => i.severity === 'medium').length,
      low: incidents.filter((i) => i.severity === 'low').length,
      avgResolutionTime: Math.round(avgResolutionTime),
    };
  }
}

// ============================================================================
// Security Event Monitoring
// ============================================================================

export class SecurityEventMonitor {
  private events: SecurityEvent[] = [];
  private alertThresholds: Map<SecurityEventType, number> = new Map();

  constructor() {
    // Set default alert thresholds
    this.alertThresholds.set(SecurityEventType.BruteForceAttempt, 5);
    this.alertThresholds.set(SecurityEventType.UnusualDataAccess, 10);
    this.alertThresholds.set(SecurityEventType.PrivilegeEscalation, 1);
    this.alertThresholds.set(SecurityEventType.ConfigurationChange, 3);
  }

  /**
   * Record security event
   */
  recordEvent(
    organizationId: string,
    type: SecurityEventType,
    severity: 'critical' | 'high' | 'medium' | 'low' | 'info',
    description: string,
    userId?: string,
    ipAddress?: string,
    userAgent?: string,
    metadata: Record<string, any> = {}
  ): SecurityEvent {
    const event: SecurityEvent = {
      id: crypto.randomUUID(),
      organizationId,
      timestamp: new Date(),
      type,
      severity,
      description,
      userId,
      ipAddress,
      userAgent,
      metadata,
      resolved: false,
    };

    this.events.push(event);
    return event;
  }

  /**
   * Check if threshold exceeded
   */
  isThresholdExceeded(organizationId: string, type: SecurityEventType, timeWindowMinutes: number = 60): boolean {
    const threshold = this.alertThresholds.get(type) || 5;
    const windowStart = new Date(Date.now() - timeWindowMinutes * 60 * 1000);

    const count = this.events.filter(
      (e) => e.organizationId === organizationId && e.type === type && e.timestamp > windowStart
    ).length;

    return count >= threshold;
  }

  /**
   * Get recent events
   */
  getRecentEvents(organizationId: string, hoursBack: number = 24, limit: number = 100): SecurityEvent[] {
    const cutoffDate = new Date(Date.now() - hoursBack * 60 * 60 * 1000);

    return this.events
      .filter((e) => e.organizationId === organizationId && e.timestamp > cutoffDate)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, limit);
  }

  /**
   * Get unresolved critical events
   */
  getCriticalEvents(organizationId: string): SecurityEvent[] {
    return this.events.filter(
      (e) => e.organizationId === organizationId && e.severity === 'critical' && !e.resolved
    );
  }

  /**
   * Resolve event
   */
  resolveEvent(eventId: string, resolvedBy: string): SecurityEvent | null {
    const event = this.events.find((e) => e.id === eventId);
    if (!event) return null;

    event.resolved = true;
    event.resolvedAt = new Date();
    event.resolvedBy = resolvedBy;

    return event;
  }

  /**
   * Get event statistics
   */
  getEventStats(organizationId: string, days: number = 30): {
    total: number;
    critical: number;
    high: number;
    medium: number;
    low: number;
    resolved: number;
    unresolved: number;
    eventsByType: Record<string, number>;
  } {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    const events = this.events.filter(
      (e) => e.organizationId === organizationId && e.timestamp > cutoffDate
    );

    const stats = {
      total: events.length,
      critical: events.filter((e) => e.severity === 'critical').length,
      high: events.filter((e) => e.severity === 'high').length,
      medium: events.filter((e) => e.severity === 'medium').length,
      low: events.filter((e) => e.severity === 'low').length,
      resolved: events.filter((e) => e.resolved).length,
      unresolved: events.filter((e) => !e.resolved).length,
      eventsByType: {} as Record<string, number>,
    };

    events.forEach((e) => {
      stats.eventsByType[e.type] = (stats.eventsByType[e.type] || 0) + 1;
    });

    return stats;
  }
}

// ============================================================================
// Anomaly Detection
// ============================================================================

export class AnomalyDetector {
  private anomalies: Map<string, AnomalyDetection> = new Map();
  private userProfiles: Map<string, { loginTimes: Date[]; accessPatterns: Record<string, number> }> =
    new Map();

  /**
   * Record user baseline (normal behavior)
   */
  recordBaseline(userId: string, action: string): void {
    if (!this.userProfiles.has(userId)) {
      this.userProfiles.set(userId, { loginTimes: [], accessPatterns: {} });
    }

    const profile = this.userProfiles.get(userId)!;

    if (action === 'login') {
      profile.loginTimes.push(new Date());
    } else {
      profile.accessPatterns[action] = (profile.accessPatterns[action] || 0) + 1;
    }
  }

  /**
   * Detect login anomalies
   */
  detectLoginAnomaly(userId: string, loginTime: Date, ipAddress: string): AnomalyDetection | null {
    const profile = this.userProfiles.get(userId);
    if (!profile || profile.loginTimes.length < 10) {
      // Need minimum baseline
      return null;
    }

    // Calculate average time between logins
    const timeBetweenLogins = [];
    for (let i = 1; i < profile.loginTimes.length; i++) {
      timeBetweenLogins.push(
        (profile.loginTimes[i].getTime() - profile.loginTimes[i - 1].getTime()) / (1000 * 60 * 60) // hours
      );
    }

    const avgTimeBetweenLogins = timeBetweenLogins.reduce((a, b) => a + b, 0) / timeBetweenLogins.length;
    const stdDev = Math.sqrt(
      timeBetweenLogins.reduce((sum, x) => sum + Math.pow(x - avgTimeBetweenLogins, 2), 0) /
        timeBetweenLogins.length
    );

    // Detect unusual login time (more than 3 sigma)
    const lastLoginTime = profile.loginTimes[profile.loginTimes.length - 1];
    const timeSinceLastLogin = (loginTime.getTime() - lastLoginTime.getTime()) / (1000 * 60 * 60);
    const anomalyScore = Math.abs((timeSinceLastLogin - avgTimeBetweenLogins) / (stdDev || 1)) / 3; // Normalize to 0-1

    if (anomalyScore > 0.7) {
      const anomaly: AnomalyDetection = {
        id: crypto.randomUUID(),
        organizationId: 'org-1', // Placeholder
        type: 'login_anomaly',
        userId,
        anomalyScore: Math.min(anomalyScore, 1),
        normalPattern: {
          avgTimeBetweenLogins: Math.round(avgTimeBetweenLogins),
          stdDev: Math.round(stdDev),
          lastLoginTime: lastLoginTime.toISOString(),
        },
        detectedPattern: {
          currentLoginTime: loginTime.toISOString(),
          timeSinceLastLogin: timeSinceLastLogin,
          ipAddress,
        },
        detectedAt: new Date(),
        investigated: false,
      };

      this.anomalies.set(anomaly.id, anomaly);
      return anomaly;
    }

    return null;
  }

  /**
   * Detect unusual data access patterns
   */
  detectAccessAnomaly(
    userId: string,
    dataType: string,
    accessCount: number
  ): AnomalyDetection | null {
    const profile = this.userProfiles.get(userId);
    if (!profile || Object.keys(profile.accessPatterns).length < 5) {
      return null; // Need minimum baseline
    }

    const normalAccess = profile.accessPatterns[dataType] || 0;
    const avgAccess = Object.values(profile.accessPatterns).reduce((a, b) => a + b, 0) /
                      Object.keys(profile.accessPatterns).length;

    // If access is significantly higher than normal
    const anomalyScore = Math.min((accessCount - normalAccess) / (normalAccess || 1), 1);

    if (anomalyScore > 0.5) {
      const anomaly: AnomalyDetection = {
        id: crypto.randomUUID(),
        organizationId: 'org-1',
        type: 'data_access_anomaly',
        userId,
        anomalyScore,
        normalPattern: {
          normalAccessCount: normalAccess,
          averageAccessCount: Math.round(avgAccess),
        },
        detectedPattern: {
          currentAccessCount: accessCount,
          dataType,
        },
        detectedAt: new Date(),
        investigated: false,
      };

      this.anomalies.set(anomaly.id, anomaly);
      return anomaly;
    }

    return null;
  }

  /**
   * Investigate anomaly
   */
  investigateAnomaly(anomalyId: string, result: 'legitimate' | 'anomalous' | 'requires_review'): AnomalyDetection | null {
    const anomaly = this.anomalies.get(anomalyId);
    if (!anomaly) return null;

    anomaly.investigated = true;
    anomaly.investigatedAt = new Date();
    anomaly.result = result;

    return anomaly;
  }

  /**
   * Get uninvestigated anomalies
   */
  getPendingAnomalies(organizationId: string): AnomalyDetection[] {
    return Array.from(this.anomalies.values()).filter(
      (a) => a.organizationId === organizationId && !a.investigated
    );
  }
}
