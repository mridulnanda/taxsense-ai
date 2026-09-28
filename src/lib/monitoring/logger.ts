/**
 * Structured logging for TaxSense AI
 * Uses Pino for JSON logging with ELK stack integration
 */

import pino from 'pino';

interface LogContext {
  userId?: string;
  requestId?: string;
  sessionId?: string;
  timestamp?: Date;
  [key: string]: any;
}

const isDevelopment = process.env.NODE_ENV === 'development';

// Create logger instance
export const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  transport: isDevelopment
    ? {
        target: 'pino-pretty',
        options: {
          colorize: true,
          ignore: 'pid,hostname',
          singleLine: false,
          translateTime: 'SYS:standard',
        },
      }
    : undefined,
  formatters: {
    level: (label) => {
      return { level: label.toUpperCase() };
    },
  },
  timestamp: pino.stdTimeFunctions.isoTime,
});

/**
 * Create a child logger with context
 */
export function createLogger(context: LogContext) {
  return logger.child({
    userId: context.userId,
    requestId: context.requestId,
    sessionId: context.sessionId,
  });
}

/**
 * Log info level messages
 */
export function logInfo(message: string, context: LogContext = {}) {
  logger.info(context, message);
}

/**
 * Log warning level messages
 */
export function logWarn(message: string, context: LogContext = {}) {
  logger.warn(context, message);
}

/**
 * Log error level messages
 */
export function logError(message: string, error?: Error, context: LogContext = {}) {
  logger.error(
    {
      ...context,
      error: error ? {
        name: error.name,
        message: error.message,
        stack: error.stack,
      } : undefined,
    },
    message
  );
}

/**
 * Log debug level messages
 */
export function logDebug(message: string, context: LogContext = {}) {
  logger.debug(context, message);
}

/**
 * Log trace level messages
 */
export function logTrace(message: string, context: LogContext = {}) {
  logger.trace(context, message);
}

/**
 * Log API request
 */
export function logApiRequest(
  method: string,
  path: string,
  statusCode: number,
  duration: number,
  context: LogContext = {}
) {
  const level = statusCode >= 400 ? 'warn' : 'info';
  logger[level](
    {
      ...context,
      method,
      path,
      statusCode,
      duration,
      type: 'api_request',
    },
    `${method} ${path} ${statusCode}`
  );
}

/**
 * Log database operation
 */
export function logDbOperation(
  operation: string,
  table: string,
  duration: number,
  rowsAffected?: number,
  error?: Error,
  context: LogContext = {}
) {
  const level = error ? 'error' : 'debug';
  logger[level](
    {
      ...context,
      operation,
      table,
      duration,
      rowsAffected,
      error: error ? {
        name: error.name,
        message: error.message,
      } : undefined,
      type: 'db_operation',
    },
    `${operation} on ${table}`
  );
}

/**
 * Log cache operation
 */
export function logCacheOperation(
  operation: string,
  key: string,
  hit: boolean,
  duration: number,
  context: LogContext = {}
) {
  logger.debug(
    {
      ...context,
      operation,
      key,
      hit,
      duration,
      type: 'cache_operation',
    },
    `Cache ${operation}: ${key} (${hit ? 'HIT' : 'MISS'})`
  );
}

/**
 * Log computation
 */
export function logComputation(
  computationType: string,
  status: 'success' | 'error' | 'started' | 'completed',
  duration?: number,
  error?: Error,
  context: LogContext = {}
) {
  const level = error ? 'error' : status === 'started' ? 'debug' : 'info';
  logger[level](
    {
      ...context,
      computationType,
      status,
      duration,
      error: error ? {
        name: error.name,
        message: error.message,
        stack: error.stack,
      } : undefined,
      type: 'computation',
    },
    `Tax computation ${status}: ${computationType}`
  );
}

/**
 * Log security event
 */
export function logSecurityEvent(
  eventType: string,
  severity: 'info' | 'warning' | 'critical',
  description: string,
  context: LogContext = {}
) {
  const level = severity === 'critical' ? 'error' : severity === 'warning' ? 'warn' : 'info';
  logger[level](
    {
      ...context,
      eventType,
      severity,
      type: 'security_event',
    },
    description
  );
}

/**
 * Log user action
 */
export function logUserAction(
  action: string,
  userId: string,
  details: Record<string, any> = {}
) {
  logger.info(
    {
      userId,
      action,
      ...details,
      type: 'user_action',
      timestamp: new Date().toISOString(),
    },
    `User action: ${action}`
  );
}

/**
 * Log performance metric
 */
export function logPerformance(
  metric: string,
  value: number,
  unit: string,
  context: LogContext = {}
) {
  logger.debug(
    {
      ...context,
      metric,
      value,
      unit,
      type: 'performance_metric',
    },
    `${metric}: ${value} ${unit}`
  );
}
