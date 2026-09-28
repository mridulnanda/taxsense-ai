/**
 * Prometheus metrics for TaxSense AI
 * Tracks API latency, database queries, errors, and business metrics
 */

import { Counter, Gauge, Histogram, Registry } from 'prom-client';

// Create metrics registry
export const metricsRegistry = new Registry();

// Request metrics
export const httpRequestDuration = new Histogram({
  name: 'http_request_duration_seconds',
  help: 'HTTP request latency in seconds',
  labelNames: ['method', 'route', 'status'],
  buckets: [0.1, 0.25, 0.5, 0.75, 1, 2.5, 5, 7.5, 10],
  registers: [metricsRegistry],
});

export const httpRequestCount = new Counter({
  name: 'http_requests_total',
  help: 'Total HTTP requests',
  labelNames: ['method', 'route', 'status'],
  registers: [metricsRegistry],
});

// Database metrics
export const dbQueryDuration = new Histogram({
  name: 'db_query_duration_seconds',
  help: 'Database query latency in seconds',
  labelNames: ['operation', 'table'],
  buckets: [0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5],
  registers: [metricsRegistry],
});

export const dbQueryErrors = new Counter({
  name: 'db_query_errors_total',
  help: 'Total database query errors',
  labelNames: ['operation', 'table', 'error_type'],
  registers: [metricsRegistry],
});

export const dbConnections = new Gauge({
  name: 'db_connections_active',
  help: 'Active database connections',
  labelNames: ['pool'],
  registers: [metricsRegistry],
});

// Cache metrics
export const cacheHitRate = new Counter({
  name: 'cache_hits_total',
  help: 'Total cache hits',
  labelNames: ['cache_type'],
  registers: [metricsRegistry],
});

export const cacheMissRate = new Counter({
  name: 'cache_misses_total',
  help: 'Total cache misses',
  labelNames: ['cache_type'],
  registers: [metricsRegistry],
});

// API errors
export const apiErrors = new Counter({
  name: 'api_errors_total',
  help: 'Total API errors',
  labelNames: ['endpoint', 'error_code'],
  registers: [metricsRegistry],
});

// Tax computation metrics
export const computationDuration = new Histogram({
  name: 'tax_computation_duration_seconds',
  help: 'Tax computation latency',
  labelNames: ['computation_type', 'status'],
  buckets: [0.5, 1, 2.5, 5, 10, 25, 50],
  registers: [metricsRegistry],
});

export const computationCount = new Counter({
  name: 'tax_computations_total',
  help: 'Total tax computations',
  labelNames: ['computation_type', 'status'],
  registers: [metricsRegistry],
});

export const computationErrors = new Counter({
  name: 'tax_computation_errors_total',
  help: 'Total computation errors',
  labelNames: ['computation_type', 'error_type'],
  registers: [metricsRegistry],
});

// User metrics
export const activeUsers = new Gauge({
  name: 'active_users',
  help: 'Number of active users',
  registers: [metricsRegistry],
});

export const userRegistrations = new Counter({
  name: 'user_registrations_total',
  help: 'Total user registrations',
  registers: [metricsRegistry],
});

// File upload metrics
export const fileUploadSize = new Histogram({
  name: 'file_upload_size_bytes',
  help: 'File upload size in bytes',
  labelNames: ['file_type'],
  buckets: [1024, 10240, 102400, 1048576, 10485760],
  registers: [metricsRegistry],
});

export const fileProcessingDuration = new Histogram({
  name: 'file_processing_duration_seconds',
  help: 'File processing time',
  labelNames: ['file_type'],
  buckets: [0.1, 0.5, 1, 2.5, 5, 10],
  registers: [metricsRegistry],
});

// Queue metrics
export const queueLength = new Gauge({
  name: 'queue_length',
  help: 'Number of items in queue',
  labelNames: ['queue_name'],
  registers: [metricsRegistry],
});

export const queueProcessingDuration = new Histogram({
  name: 'queue_processing_duration_seconds',
  help: 'Time to process queue item',
  labelNames: ['queue_name', 'status'],
  buckets: [1, 5, 10, 30, 60, 300],
  registers: [metricsRegistry],
});

// Memory and resource metrics
export const processMemoryUsage = new Gauge({
  name: 'process_memory_bytes',
  help: 'Process memory usage in bytes',
  labelNames: ['type'],
  registers: [metricsRegistry],
});

export const processCpuUsage = new Gauge({
  name: 'process_cpu_usage_percent',
  help: 'Process CPU usage percentage',
  registers: [metricsRegistry],
});

// Business metrics
export const revenueMetric = new Counter({
  name: 'revenue_total',
  help: 'Total revenue in cents',
  registers: [metricsRegistry],
});

export const computationComplexity = new Histogram({
  name: 'computation_complexity_score',
  help: 'Complexity score of tax computation',
  labelNames: ['user_type'],
  buckets: [10, 25, 50, 100, 200, 500, 1000],
  registers: [metricsRegistry],
});

/**
 * Record request metrics
 */
export function recordRequestMetrics(
  method: string,
  route: string,
  status: number,
  duration: number
) {
  httpRequestDuration
    .labels(method, route, String(status))
    .observe(duration / 1000); // Convert to seconds
  httpRequestCount.labels(method, route, String(status)).inc();
}

/**
 * Record database query metrics
 */
export function recordDbMetrics(
  operation: string,
  table: string,
  duration: number,
  error?: Error
) {
  dbQueryDuration.labels(operation, table).observe(duration / 1000); // Convert to seconds
  if (error) {
    dbQueryErrors.labels(operation, table, error.name).inc();
  }
}

/**
 * Record cache metrics
 */
export function recordCacheMetrics(cacheType: string, hit: boolean) {
  if (hit) {
    cacheHitRate.labels(cacheType).inc();
  } else {
    cacheMissRate.labels(cacheType).inc();
  }
}

/**
 * Record computation metrics
 */
export function recordComputationMetrics(
  computationType: string,
  duration: number,
  status: 'success' | 'error',
  error?: Error
) {
  computationDuration.labels(computationType, status).observe(duration / 1000);
  computationCount.labels(computationType, status).inc();
  if (error) {
    computationErrors.labels(computationType, error.name).inc();
  }
}

/**
 * Export metrics in Prometheus format
 */
export function getMetrics(): string {
  return metricsRegistry.metrics();
}
