import { z } from 'zod';
import pino from 'pino';

const SyncConfigSchema = z.object({
  integrationId: z.string(),
  integrationType: z.enum(['bank', 'fintech', 'investment', 'insurance', 'efiling']),
  userId: z.string(),
  accessToken: z.string(),
  refreshToken: z.string().optional(),
  expiresAt: z.number().optional(),
  syncInterval: z.number().default(3600000), // 1 hour
  lastSyncAt: z.number().optional(),
  retryAttempts: z.number().default(3),
  retryDelay: z.number().default(1000), // 1 second
});

export type SyncConfig = z.infer<typeof SyncConfigSchema>;

interface SyncResult {
  success: boolean;
  recordsCount: number;
  lastSyncAt: number;
  nextSyncAt: number;
  error?: string;
}

interface RateLimitConfig {
  requestsPerSecond: number;
  burstSize: number;
}

export class DataSyncEngine {
  private logger = pino();
  private syncConfigs: Map<string, SyncConfig> = new Map();
  private rateLimiters: Map<string, RateLimiter> = new Map();
  private syncIntervals: Map<string, NodeJS.Timeout> = new Map();

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

    // Initialize rate limiter
    const rateLimiter = new RateLimiter(10, 1000); // 10 requests per second
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

    // Clear existing interval if any
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
        };

        this.logger.info(
          { key, recordsCount, duration },
          'Sync completed successfully'
        );

        // Update last sync time
        config.lastSyncAt = startTime;
        this.syncConfigs.set(key, config);

        return result;
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));

        if (attempt < config.retryAttempts) {
          const delay = config.retryDelay * Math.pow(2, attempt); // Exponential backoff
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
   * Perform actual sync (to be implemented by subclasses)
   */
  private async performSync(config: SyncConfig): Promise<number> {
    // This is where the actual API calls would happen
    // For now, return 0 as placeholder
    return 0;
  }

  /**
   * Update access token
   */
  updateToken(userId: string, integrationId: string, token: string, expiresIn: number): void {
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
  getSyncStatus(userId: string, integrationId: string): {
    isRunning: boolean;
    lastSyncAt?: Date;
    nextSyncAt?: Date;
  } {
    const key = `${userId}-${integrationId}`;
    const isRunning = this.syncIntervals.has(key);
    const config = this.syncConfigs.get(key);

    return {
      isRunning,
      lastSyncAt: config?.lastSyncAt ? new Date(config.lastSyncAt) : undefined,
      nextSyncAt: config?.lastSyncAt
        ? new Date(config.lastSyncAt + config.syncInterval)
        : undefined,
    };
  }

  /**
   * Sleep helper
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

/**
 * Rate limiter using token bucket algorithm
 */
class RateLimiter {
  private tokens: number;
  private lastRefillTime: number;
  private readonly capacity: number;
  private readonly refillRate: number; // tokens per second

  constructor(requestsPerSecond: number, windowMs: number = 1000) {
    this.capacity = requestsPerSecond;
    this.tokens = requestsPerSecond;
    this.refillRate = requestsPerSecond / (windowMs / 1000);
    this.lastRefillTime = Date.now();
  }

  /**
   * Refill tokens based on elapsed time
   */
  private refill(): void {
    const now = Date.now();
    const elapsedSeconds = (now - this.lastRefillTime) / 1000;
    const tokensToAdd = elapsedSeconds * this.refillRate;

    this.tokens = Math.min(this.capacity, this.tokens + tokensToAdd);
    this.lastRefillTime = now;
  }

  /**
   * Acquire a token (with optional wait)
   */
  async acquire(): Promise<void> {
    while (true) {
      this.refill();

      if (this.tokens >= 1) {
        this.tokens -= 1;
        return;
      }

      // Wait a bit before retrying
      await new Promise((resolve) => setTimeout(resolve, 10));
    }
  }
}

/**
 * Webhook handler for automatic data sync
 */
export class WebhookHandler {
  private logger = pino();
  private syncEngine: DataSyncEngine;

  constructor(syncEngine: DataSyncEngine) {
    this.syncEngine = syncEngine;
  }

  /**
   * Handle bank transaction webhook
   */
  async handleBankWebhook(
    userId: string,
    integrationId: string,
    payload: Record<string, any>
  ): Promise<void> {
    this.logger.info(
      { userId, integrationId, eventType: payload.type },
      'Bank webhook received'
    );

    // Trigger immediate sync after transaction
    try {
      await this.syncEngine.executeSync(userId, integrationId);
    } catch (error) {
      this.logger.error(
        { error, userId, integrationId },
        'Webhook sync failed'
      );
    }
  }

  /**
   * Handle payment webhook
   */
  async handlePaymentWebhook(
    userId: string,
    integrationId: string,
    payload: Record<string, any>
  ): Promise<void> {
    this.logger.info(
      { userId, integrationId, eventType: payload.type },
      'Payment webhook received'
    );

    try {
      await this.syncEngine.executeSync(userId, integrationId);
    } catch (error) {
      this.logger.error(
        { error, userId, integrationId },
        'Payment webhook sync failed'
      );
    }
  }
}
