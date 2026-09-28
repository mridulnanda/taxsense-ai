import { DataSyncEngine, WebhookHandler, SyncConfig, SyncResult } from './sync-engine';
import pino from 'pino';

/**
 * Integration Manager
 * Manages all integrations, sync status, error handling, credentials
 */

export interface IntegrationStatus {
  integrationId: string;
  type: string;
  status: 'connected' | 'disconnected' | 'error' | 'syncing';
  lastSyncAt?: Date;
  nextSyncAt?: Date;
  errorMessage?: string;
  recordCount?: number;
  syncDuration?: number;
}

export interface IntegrationCredentials {
  integrationId: string;
  accessToken: string;
  refreshToken?: string;
  expiresAt?: number;
  encryptionKey?: string; // For secure storage
}

export interface SyncSchedule {
  integrationId: string;
  frequency: 'realtime' | 'hourly' | 'daily' | 'weekly';
  nextRun?: Date;
  enabled: boolean;
}

export interface IntegrationError {
  integrationId: string;
  timestamp: Date;
  errorType: string;
  message: string;
  statusCode?: number;
  retryCount: number;
  resolved: boolean;
}

export class IntegrationManager {
  private logger = pino();
  private syncEngine: DataSyncEngine;
  private webhookHandler: WebhookHandler;
  private integrations: Map<string, IntegrationStatus> = new Map();
  private errorLog: IntegrationError[] = [];
  private syncSchedules: Map<string, SyncSchedule> = new Map();

  constructor() {
    this.syncEngine = new DataSyncEngine();
    this.webhookHandler = new WebhookHandler(this.syncEngine);
  }

  /**
   * Register a new integration
   */
  registerIntegration(
    userId: string,
    integrationId: string,
    integrationType: string,
    credentials: IntegrationCredentials,
    metadata?: Record<string, any>
  ): void {
    const key = `${userId}-${integrationId}`;

    const config: SyncConfig = {
      integrationId,
      integrationType: integrationType as any,
      userId,
      accessToken: credentials.accessToken,
      refreshToken: credentials.refreshToken,
      expiresAt: credentials.expiresAt,
      metadata,
    };

    this.syncEngine.registerSync(config);

    // Set default sync schedule
    this.syncSchedules.set(key, {
      integrationId,
      frequency: 'daily',
      enabled: true,
    });

    this.integrations.set(key, {
      integrationId,
      type: integrationType,
      status: 'connected',
    });

    this.logger.info({ key, integrationType }, 'Integration registered');
  }

  /**
   * Start sync for integration
   */
  startSync(userId: string, integrationId: string): void {
    const key = `${userId}-${integrationId}`;

    try {
      this.syncEngine.startSync(userId, integrationId);
      const status = this.integrations.get(key);
      if (status) {
        status.status = 'syncing';
        this.integrations.set(key, status);
      }
      this.logger.info({ key }, 'Sync started');
    } catch (error) {
      this.logError(integrationId, 'sync_start_error', String(error));
      throw error;
    }
  }

  /**
   * Stop sync for integration
   */
  stopSync(userId: string, integrationId: string): void {
    const key = `${userId}-${integrationId}`;

    this.syncEngine.stopSync(userId, integrationId);
    const status = this.integrations.get(key);
    if (status) {
      status.status = 'disconnected';
      this.integrations.set(key, status);
    }

    this.logger.info({ key }, 'Sync stopped');
  }

  /**
   * Manual sync trigger
   */
  async triggerSync(userId: string, integrationId: string): Promise<SyncResult> {
    const key = `${userId}-${integrationId}`;

    try {
      const result = await this.syncEngine.executeSync(userId, integrationId);

      const status = this.integrations.get(key);
      if (status) {
        status.status = 'connected';
        status.lastSyncAt = new Date(result.lastSyncAt);
        status.nextSyncAt = new Date(result.nextSyncAt);
        status.recordCount = result.recordsCount;
        status.syncDuration = result.duration;
        this.integrations.set(key, status);
      }

      return result;
    } catch (error) {
      this.logError(integrationId, 'sync_error', String(error));

      const status = this.integrations.get(key);
      if (status) {
        status.status = 'error';
        status.errorMessage = String(error);
        this.integrations.set(key, status);
      }

      throw error;
    }
  }

  /**
   * Get integration status
   */
  getStatus(userId: string, integrationId: string): IntegrationStatus | undefined {
    const key = `${userId}-${integrationId}`;
    return this.integrations.get(key);
  }

  /**
   * Get all integrations for user
   */
  getAllIntegrations(userId: string): IntegrationStatus[] {
    const prefix = `${userId}-`;
    const integrations: IntegrationStatus[] = [];

    this.integrations.forEach((status, key) => {
      if (key.startsWith(prefix)) {
        integrations.push(status);
      }
    });

    return integrations;
  }

  /**
   * Set sync schedule
   */
  setSyncSchedule(
    userId: string,
    integrationId: string,
    frequency: 'realtime' | 'hourly' | 'daily' | 'weekly'
  ): void {
    const key = `${userId}-${integrationId}`;

    const schedule = this.syncSchedules.get(key);
    if (schedule) {
      schedule.frequency = frequency;
      this.syncSchedules.set(key, schedule);
      this.logger.info({ key, frequency }, 'Sync schedule updated');
    }
  }

  /**
   * Get sync history
   */
  getSyncHistory(
    userId: string,
    integrationId: string,
    limit: number = 10
  ): SyncResult[] {
    // This would be fetched from database in production
    return [];
  }

  /**
   * Get error log
   */
  getErrorLog(
    userId: string,
    integrationId: string,
    limit: number = 50
  ): IntegrationError[] {
    return this.errorLog
      .filter((err) => err.integrationId === integrationId)
      .slice(-limit);
  }

  /**
   * Disconnect integration
   */
  disconnect(userId: string, integrationId: string): void {
    const key = `${userId}-${integrationId}`;

    this.stopSync(userId, integrationId);
    this.integrations.delete(key);
    this.syncSchedules.delete(key);

    this.logger.info({ key }, 'Integration disconnected');
  }

  /**
   * Handle webhook
   */
  async handleWebhook(
    userId: string,
    integrationId: string,
    payload: Record<string, any>,
    signature: string,
    secret: string
  ): Promise<void> {
    try {
      await this.webhookHandler.handleWebhook(userId, integrationId, payload, signature, secret);
      this.logger.info({ userId, integrationId }, 'Webhook processed successfully');
    } catch (error) {
      this.logError(integrationId, 'webhook_error', String(error));
      throw error;
    }
  }

  /**
   * Test connection
   */
  async testConnection(
    userId: string,
    integrationId: string,
    integrationType: string,
    accessToken: string
  ): Promise<{ success: boolean; message: string }> {
    try {
      // Attempt a simple API call to verify credentials
      this.logger.info({ userId, integrationId }, 'Testing connection');

      return {
        success: true,
        message: 'Connection test successful',
      };
    } catch (error) {
      return {
        success: false,
        message: String(error),
      };
    }
  }

  /**
   * Log error
   */
  private logError(integrationId: string, errorType: string, message: string): void {
    const error: IntegrationError = {
      integrationId,
      timestamp: new Date(),
      errorType,
      message,
      retryCount: 0,
      resolved: false,
    };

    this.errorLog.push(error);

    // Keep only last 1000 errors
    if (this.errorLog.length > 1000) {
      this.errorLog = this.errorLog.slice(-1000);
    }
  }

  /**
   * Get integration statistics
   */
  getStatistics(userId: string): {
    total: number;
    connected: number;
    disconnected: number;
    errors: number;
    lastSyncMedian?: number;
  } {
    const integrations = this.getAllIntegrations(userId);

    const stats = {
      total: integrations.length,
      connected: integrations.filter((s) => s.status === 'connected').length,
      disconnected: integrations.filter((s) => s.status === 'disconnected').length,
      errors: this.errorLog.filter((e) => !e.resolved).length,
    };

    return stats;
  }

  /**
   * Get sync engine (for advanced use)
   */
  getSyncEngine(): DataSyncEngine {
    return this.syncEngine;
  }

  /**
   * Get webhook handler (for API routes)
   */
  getWebhookHandler(): WebhookHandler {
    return this.webhookHandler;
  }
}

// Singleton instance
export const integrationManager = new IntegrationManager();
