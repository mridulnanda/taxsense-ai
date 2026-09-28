import { z } from 'zod';
import pino from 'pino';
import crypto from 'crypto';

/**
 * Core sync engine for enterprise integrations
 * Handles OAuth2, webhooks, rate limiting, retry logic, data normalization, conflict resolution
 */

const SyncConfigSchema = z.object({
  integrationId: z.string(),
  integrationType: z.enum([
    'accounting',
    'banking',
    'payroll',
    'investment',
    'insurance',
  ]),
  userId: z.string(),
  accessToken: z.string(),
  refreshToken: z.string().optional(),
  expiresAt: z.number().optional(),
  syncInterval: z.number().default(3600000), // 1 hour
  lastSyncAt: z.number().optional(),
  retryAttempts: z.number().default(3),
  retryDelay: z.number().default(1000), // 1 second
  webhookSecret: z.string().optional(),
  metadata: z.record(z.any()).optional(),
});

export type SyncConfig = z.infer<typeof SyncConfigSchema>;

export interface SyncResult {
  success: boolean;
  recordsCount: number;
  lastSyncAt: number;
  nextSyncAt: number;
  error?: string;
  duration?: number;
}

export interface DataNormalizationSchema {
  id: string;
  timestamp: number;
  source: string;
  data: Record<string, any>;
  hash: string; // For conflict detection
}

export interface ConflictResolution {
  recordId: string;
  conflicts: Array<{
    field: string;
    local: any;
    remote: any;
    timestamp: number;
  }>;
  resolution: 'local' | 'remote' | 'manual';
  resolvedAt: number;
}

/**
 * Token bucket rate limiter
 */
class RateLimiter {
  private tokens: number;
  private lastRefillTime: number;
  private readonly capacity: number;
  private readonly refillRate: number;

  constructor(requestsPerSecond: number, windowMs: number = 1000) {
    this.capacity = requestsPerSecond;
    this.tokens = requestsPerSecond;
    this.refillRate = requestsPerSecond / (windowMs / 1000);
    this.lastRefillTime = Date.now();
  }

  private refill(): void {
    const now = Date.now();
    const elapsedSeconds = (now - this.lastRefillTime) / 1000;
    const tokensToAdd = elapsedSeconds * this.refillRate;

    this.tokens = Math.min(this.capacity, this.tokens + tokensToAdd);
    this.lastRefillTime = now;
  }

  async acquire(): Promise<void> {
    while (true) {
      this.refill();

      if (this.tokens >= 1) {
        this.tokens -= 1;
        return;
      }

      await new Promise((resolve) => setTimeout(resolve, 10));
    }
  }
}

/**
 * Main sync engine
 */
export class DataSyncEngine {
  private logger = pino();
  private syncConfigs: Map<string, SyncConfig> = new Map();
  private rateLimiters: Map<string, RateLimiter> = new Map();
  private syncIntervals: Map<string, NodeJS.Timeout> = new Map();
  private normalizedData: Map<string, DataNormalizationSchema[]> = new Map();
  private conflictLog: Map<string, ConflictResolution[]> = new Map();

  /**
   * Register sync configuration
   */
  registerSync(config: SyncConfig): void {
    const validated = SyncConfigSchema.parse(config);
    const key = `${config.userId}-${config.integrationId}`;

    this.syncConfigs.set(key, validated);
    this.logger.info(
      { integrationId: config.integrationId, userId: config.userId },
      'Sync registered'
    );

    // Initialize rate limiter (10 requests per second by default)
    const rateLimiter = new RateLimiter(10, 1000);
    this.rateLimiters.set(key, rateLimiter);
  }

  /**
   * Start automatic sync
   */
  startSync(userId: string, integrationId: string): void {
    const key = `${userId}-${integrationId}`;
    const config = this.syncConfigs.get(key);

    if (!config) {
      throw new Error(`Sync configuration not found for ${key}`);
    }

    this.stopSync(userId, integrationId);

    // Run sync immediately
    this.executeSync(userId, integrationId).catch((error) => {
      this.logger.error({ error, key }, 'Initial sync failed');
    });

    // Schedule periodic syncs
    const interval = setInterval(() => {
      this.executeSync(userId, integrationId).catch((error) => {
        this.logger.error({ error, key }, 'Scheduled sync failed');
      });
    }, config.syncInterval);

    this.syncIntervals.set(key, interval);
    this.logger.info({ key }, 'Sync started');
  }

  /**
   * Stop automatic sync
   */
  stopSync(userId: string, integrationId: string): void {
    const key = `${userId}-${integrationId}`;
    const interval = this.syncIntervals.get(key);

    if (interval) {
      clearInterval(interval);
      this.syncIntervals.delete(key);
      this.logger.info({ key }, 'Sync stopped');
    }
  }

  /**
   * Execute single sync with exponential backoff retry
   */
  async executeSync(userId: string, integrationId: string): Promise<SyncResult> {
    const key = `${userId}-${integrationId}`;
    const config = this.syncConfigs.get(key);

    if (!config) {
      throw new Error(`Sync configuration not found for ${key}`);
    }

    const rateLimiter = this.rateLimiters.get(key)!;
    await rateLimiter.acquire();

    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= config.retryAttempts; attempt++) {
      try {
        const startTime = Date.now();
        const recordsCount = await this.performSync(config);
        const duration = Date.now() - startTime;

        const result: SyncResult = {
          success: true,
          recordsCount,
          lastSyncAt: startTime,
          nextSyncAt: startTime + config.syncInterval,
          duration,
        };

        this.logger.info(
          { key, recordsCount, duration },
          'Sync completed successfully'
        );

        config.lastSyncAt = startTime;
        this.syncConfigs.set(key, config);

        return result;
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));

        if (attempt < config.retryAttempts) {
          const delay = config.retryDelay * Math.pow(2, attempt);
          this.logger.warn(
            { key, attempt, delay, error: lastError.message },
            'Sync attempt failed, retrying...'
          );
          await this.sleep(delay);
        }
      }
    }

    throw new Error(
      `Sync failed after ${config.retryAttempts + 1} attempts: ${lastError?.message}`
    );
  }

  /**
   * Normalize data to standard format
   */
  normalizeData(
    source: string,
    data: Record<string, any>
  ): DataNormalizationSchema {
    const hash = crypto
      .createHash('sha256')
      .update(JSON.stringify(data))
      .digest('hex');

    return {
      id: crypto.randomUUID(),
      timestamp: Date.now(),
      source,
      data,
      hash,
    };
  }

  /**
   * Detect and resolve conflicts
   */
  async resolveConflicts(
    recordId: string,
    local: Record<string, any>,
    remote: Record<string, any>,
    strategy: 'local' | 'remote' | 'merge' = 'remote'
  ): Promise<Record<string, any>> {
    const conflicts: ConflictResolution['conflicts'] = [];

    for (const key in local) {
      if (local[key] !== remote[key]) {
        conflicts.push({
          field: key,
          local: local[key],
          remote: remote[key],
          timestamp: Date.now(),
        });
      }
    }

    if (conflicts.length === 0) {
      return remote;
    }

    const resolution: ConflictResolution = {
      recordId,
      conflicts,
      resolution: strategy,
      resolvedAt: Date.now(),
    };

    // Log conflict for audit trail
    const conflictKey = recordId;
    if (!this.conflictLog.has(conflictKey)) {
      this.conflictLog.set(conflictKey, []);
    }
    this.conflictLog.get(conflictKey)!.push(resolution);

    this.logger.warn(
      { recordId, conflictCount: conflicts.length },
      'Conflicts detected and resolved'
    );

    // Merge based on strategy
    if (strategy === 'local') {
      return local;
    } else if (strategy === 'merge') {
      return { ...remote, ...local };
    }

    return remote;
  }

  /**
   * Perform actual sync (to be overridden by specific implementations)
   */
  protected async performSync(config: SyncConfig): Promise<number> {
    this.logger.debug(
      { integrationId: config.integrationId },
      'Performing sync'
    );
    // To be implemented by specific integration adapters
    return 0;
  }

  /**
   * OAuth2 token refresh
   */
  async refreshToken(
    userId: string,
    integrationId: string,
    refreshTokenFn: (token: string) => Promise<{ accessToken: string; expiresIn: number }>
  ): Promise<void> {
    const key = `${userId}-${integrationId}`;
    const config = this.syncConfigs.get(key);

    if (!config || !config.refreshToken) {
      throw new Error('No refresh token available');
    }

    try {
      const { accessToken, expiresIn } = await refreshTokenFn(
        config.refreshToken
      );
      this.updateToken(userId, integrationId, accessToken, expiresIn);
      this.logger.info({ key }, 'Token refreshed successfully');
    } catch (error) {
      this.logger.error({ error, key }, 'Token refresh failed');
      throw error;
    }
  }

  /**
   * Update access token
   */
  updateToken(
    userId: string,
    integrationId: string,
    token: string,
    expiresIn: number
  ): void {
    const key = `${userId}-${integrationId}`;
    const config = this.syncConfigs.get(key);

    if (config) {
      config.accessToken = token;
      config.expiresAt = Date.now() + expiresIn * 1000;
      this.syncConfigs.set(key, config);
      this.logger.info({ key }, 'Token updated');
    }
  }

  /**
   * Check if token needs refresh
   */
  isTokenExpired(userId: string, integrationId: string): boolean {
    const key = `${userId}-${integrationId}`;
    const config = this.syncConfigs.get(key);

    if (!config || !config.expiresAt) {
      return false;
    }

    // Refresh if within 5 minutes of expiry
    return config.expiresAt - Date.now() < 300000;
  }

  /**
   * Get sync status
   */
  getSyncStatus(userId: string, integrationId: string) {
    const key = `${userId}-${integrationId}`;
    const isRunning = this.syncIntervals.has(key);
    const config = this.syncConfigs.get(key);

    return {
      isRunning,
      lastSyncAt: config?.lastSyncAt ? new Date(config.lastSyncAt) : undefined,
      nextSyncAt: config?.lastSyncAt
        ? new Date(config.lastSyncAt + config.syncInterval)
        : undefined,
      recordCount: this.normalizedData.get(key)?.length || 0,
    };
  }

  /**
   * Get conflict log
   */
  getConflictLog(recordId: string): ConflictResolution[] {
    return this.conflictLog.get(recordId) || [];
  }

  /**
   * Sleep helper
   */
  protected sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

/**
 * Webhook handler for real-time sync
 */
export class WebhookHandler {
  private logger = pino();
  private syncEngine: DataSyncEngine;
  private webhookSecrets: Map<string, string> = new Map();

  constructor(syncEngine: DataSyncEngine) {
    this.syncEngine = syncEngine;
  }

  /**
   * Verify webhook signature
   */
  verifySignature(
    payload: string,
    signature: string,
    secret: string
  ): boolean {
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(payload)
      .digest('hex');

    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedSignature)
    );
  }

  /**
   * Handle incoming webhook
   */
  async handleWebhook(
    userId: string,
    integrationId: string,
    payload: Record<string, any>,
    signature: string,
    secret: string
  ): Promise<void> {
    try {
      // Verify signature
      const payloadStr = JSON.stringify(payload);
      if (!this.verifySignature(payloadStr, signature, secret)) {
        throw new Error('Invalid webhook signature');
      }

      this.logger.info(
        { userId, integrationId, eventType: payload.type },
        'Webhook received and verified'
      );

      // Trigger immediate sync
      await this.syncEngine.executeSync(userId, integrationId);
    } catch (error) {
      this.logger.error(
        { error, userId, integrationId },
        'Webhook processing failed'
      );
      throw error;
    }
  }
}
