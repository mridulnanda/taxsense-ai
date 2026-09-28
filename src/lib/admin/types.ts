/**
 * Admin Dashboard Types
 * Comprehensive type definitions for the enterprise admin system
 */

// ============================================================================
// USER MANAGEMENT TYPES
// ============================================================================

export type UserRole = "admin" | "manager" | "analyst" | "viewer";
export type PermissionLevel = "read" | "write" | "delete" | "admin";

export interface AdminUser {
  id: string;
  email: string;
  name: string;
  avatar_url?: string;
  role: UserRole;
  permissions: Permission[];
  two_fa_enabled: boolean;
  last_login?: Date;
  created_at: Date;
  updated_at: Date;
  is_active: boolean;
}

export interface Permission {
  id: string;
  resource: string;
  level: PermissionLevel;
  granted_at: Date;
}

export interface UserSegment {
  id: string;
  name: string;
  description: string;
  filters: UserFilter[];
  user_count: number;
  created_at: Date;
}

export interface UserFilter {
  field: string;
  operator: "eq" | "gt" | "lt" | "contains" | "in";
  value: any;
}

export interface AuditLog {
  id: string;
  user_id: string;
  action: string;
  resource_type: string;
  resource_id: string;
  changes?: Record<string, any>;
  ip_address?: string;
  user_agent?: string;
  created_at: Date;
}

// ============================================================================
// REAL-TIME ANALYTICS TYPES
// ============================================================================

export interface DashboardMetrics {
  active_users: number;
  active_users_trend: number;
  total_users: number;
  signups_today: number;
  signups_this_week: number;
  active_computations: number;
  avg_computation_time: number;
  error_rate: number;
  system_health: "healthy" | "warning" | "critical";
}

export interface RealtimeUpdate {
  metric: string;
  value: number;
  timestamp: Date;
  previous_value?: number;
  change_percent?: number;
}

export interface ComputationMetrics {
  total_computations: number;
  active_computations: number;
  completed_computations: number;
  failed_computations: number;
  avg_processing_time_ms: number;
  success_rate: number;
  top_errors: Array<{ error: string; count: number }>;
}

export interface APIMetrics {
  total_requests: number;
  requests_per_second: number;
  avg_response_time_ms: number;
  error_rate: number;
  by_endpoint: Record<string, EndpointMetrics>;
}

export interface EndpointMetrics {
  path: string;
  method: string;
  requests: number;
  avg_time_ms: number;
  error_count: number;
  status_codes: Record<string, number>;
}

export interface CohortMetrics {
  cohort_date: Date;
  cohort_size: number;
  retention_1d: number;
  retention_7d: number;
  retention_30d: number;
  ltv: number;
  churn_rate: number;
}

// ============================================================================
// COMPLIANCE TYPES
// ============================================================================

export interface ComplianceRule {
  id: string;
  name: string;
  description: string;
  version: string;
  category: "tax" | "data" | "security" | "audit";
  is_active: boolean;
  audit_threshold?: number;
  created_at: Date;
  updated_at: Date;
  changed_by: string;
}

export interface ComplianceAudit {
  id: string;
  rule_id: string;
  audit_type: "automated" | "manual";
  status: "passed" | "failed" | "warning";
  findings: string[];
  remediation?: string;
  audited_at: Date;
  audited_by?: string;
}

export interface RuleVersion {
  rule_id: string;
  version: string;
  changes: Record<string, any>;
  reason: string;
  created_at: Date;
  created_by: string;
  is_active: boolean;
}

export interface AccuracyMetrics {
  overall_accuracy: number;
  by_computation_type: Record<string, number>;
  by_regime: Record<string, number>;
  failing_rules: Array<{ rule_id: string; accuracy: number }>;
  last_updated: Date;
}

// ============================================================================
// FINANCIAL TYPES
// ============================================================================

export interface FinancialMetrics {
  mrr: number;
  arr: number;
  arpu: number;
  churn_rate: number;
  ltv: number;
  ltv_cac_ratio: number;
  growth_rate: number;
  net_retention_rate: number;
}

export interface RevenueData {
  date: Date;
  subscription_revenue: number;
  addon_revenue: number;
  total_revenue: number;
  subscription_count: number;
  active_subscriptions: number;
  cancelled_subscriptions: number;
  new_subscriptions: number;
}

export interface ChurnAnalysis {
  period: "1m" | "3m" | "6m" | "12m";
  churn_rate: number;
  churned_users: number;
  retained_users: number;
  reasons: Record<string, number>;
  high_risk_users: string[];
}

export interface CustomerLTV {
  customer_id: string;
  cohort_date: Date;
  total_revenue: number;
  months_active: number;
  ltv_prediction: number;
  churn_risk: "low" | "medium" | "high";
  retention_actions?: string[];
}

export interface RevenueProjection {
  period: "30d" | "90d" | "1y";
  projected_mrr: number;
  projected_arr: number;
  growth_rate: number;
  confidence: number;
  scenarios: {
    conservative: number;
    optimistic: number;
  };
}

// ============================================================================
// ALERTS & NOTIFICATIONS
// ============================================================================

export type AlertSeverity = "info" | "warning" | "critical";
export type AlertStatus = "active" | "acknowledged" | "resolved";
export type AlertChannel = "email" | "sms" | "in_app" | "slack";

export interface Alert {
  id: string;
  title: string;
  description: string;
  severity: AlertSeverity;
  status: AlertStatus;
  category: string;
  triggered_at: Date;
  acknowledged_at?: Date;
  resolved_at?: Date;
  acknowledged_by?: string;
  metadata?: Record<string, any>;
}

export interface AlertRule {
  id: string;
  name: string;
  condition: string;
  severity: AlertSeverity;
  channels: AlertChannel[];
  is_active: boolean;
  escalation_minutes?: number;
  created_at: Date;
}

export interface NotificationPreference {
  user_id: string;
  channel: AlertChannel;
  severity_levels: AlertSeverity[];
  quiet_hours_start?: string;
  quiet_hours_end?: string;
  is_enabled: boolean;
}

// ============================================================================
// SUPPORT & FEEDBACK
// ============================================================================

export interface SupportTicket {
  id: string;
  user_id: string;
  title: string;
  description: string;
  category: string;
  priority: "low" | "medium" | "high" | "urgent";
  status: "open" | "in_progress" | "waiting" | "resolved" | "closed";
  assigned_to?: string;
  created_at: Date;
  updated_at: Date;
  resolved_at?: Date;
  resolution_time_minutes?: number;
}

export interface UserFeedback {
  id: string;
  user_id: string;
  type: "bug" | "feature_request" | "improvement" | "general";
  title: string;
  content: string;
  rating?: number;
  attachments?: string[];
  status: "new" | "reviewed" | "in_progress" | "completed";
  created_at: Date;
}

// ============================================================================
// EXPORT & REPORTING
// ============================================================================

export type ExportFormat = "csv" | "json" | "excel" | "pdf";

export interface ExportJob {
  id: string;
  title: string;
  format: ExportFormat;
  query_type: "users" | "computations" | "revenue" | "compliance" | "custom";
  filters: Record<string, any>;
  status: "pending" | "processing" | "completed" | "failed";
  file_url?: string;
  file_size?: number;
  created_at: Date;
  created_by: string;
  completed_at?: Date;
  scheduled_for?: Date;
  email_recipients?: string[];
}

export interface ReportTemplate {
  id: string;
  name: string;
  description: string;
  sections: ReportSection[];
  frequency?: "daily" | "weekly" | "monthly";
  recipients?: string[];
  created_at: Date;
  created_by: string;
}

export interface ReportSection {
  id: string;
  title: string;
  type: "metric" | "chart" | "table" | "narrative";
  metrics?: string[];
  filters?: Record<string, any>;
  order: number;
}

// ============================================================================
// SYSTEM CONFIGURATION
// ============================================================================

export interface SystemConfig {
  feature_flags: Record<string, boolean>;
  rate_limits: RateLimitConfig;
  security: SecurityConfig;
  integrations: Record<string, IntegrationConfig>;
  maintenance_mode: boolean;
  maintenance_message?: string;
}

export interface RateLimitConfig {
  api_requests_per_minute: number;
  computation_queue_limit: number;
  export_concurrent_jobs: number;
}

export interface SecurityConfig {
  require_2fa: boolean;
  password_min_length: number;
  session_timeout_minutes: number;
  ip_whitelist?: string[];
}

export interface IntegrationConfig {
  enabled: boolean;
  api_key?: string;
  api_secret?: string;
  webhook_url?: string;
}

// ============================================================================
// DASHBOARD RESPONSE TYPES
// ============================================================================

export interface DashboardResponse<T> {
  data: T;
  timestamp: Date;
  status: "success" | "partial" | "error";
  errors?: string[];
  cached?: boolean;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  page_size: number;
  has_next: boolean;
  has_prev: boolean;
}

export interface TimeSeriesData {
  timestamp: Date;
  value: number;
  label?: string;
}
