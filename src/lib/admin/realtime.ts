/**
 * Real-time Analytics Engine
 * WebSocket-based real-time metrics streaming and updates
 */

import {
  DashboardMetrics,
  RealtimeUpdate,
  ComputationMetrics,
  APIMetrics,
  CohortMetrics,
} from "./types";

export class RealtimeAnalyticsEngine {
  private ws: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 3000;
  private subscribers: Map<string, Set<(data: any) => void>> = new Map();
  private metricsCache: Map<string, any> = new Map();
  private lastUpdate: Map<string, Date> = new Map();

  constructor(private wsUrl: string) {}

  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        this.ws = new WebSocket(this.wsUrl);

        this.ws.onopen = () => {
          console.log("[RealtimeAnalytics] Connected");
          this.reconnectAttempts = 0;
          this.subscribeToMetrics();
          resolve();
        };

        this.ws.onmessage = (event) => {
          this.handleMessage(event.data);
        };

        this.ws.onerror = (error) => {
          console.error("[RealtimeAnalytics] Error:", error);
          reject(error);
        };

        this.ws.onclose = () => {
          console.log("[RealtimeAnalytics] Disconnected");
          this.attemptReconnect();
        };
      } catch (error) {
        reject(error);
      }
    });
  }

  disconnect(): void {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.subscribers.clear();
    this.metricsCache.clear();
    this.lastUpdate.clear();
  }

  private attemptReconnect(): void {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      const delay = this.reconnectDelay * this.reconnectAttempts;
      console.log(
        `[RealtimeAnalytics] Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts})`
      );
      setTimeout(() => this.connect().catch(console.error), delay);
    }
  }

  private subscribeToMetrics(): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(
        JSON.stringify({
          type: "subscribe",
          metrics: [
            "dashboard_metrics",
            "active_users",
            "computations",
            "api_performance",
            "errors",
            "revenue",
          ],
        })
      );
    }
  }

  private handleMessage(data: string): void {
    try {
      const message = JSON.parse(data);
      const { type, metric, payload } = message;

      if (type === "update") {
        this.metricsCache.set(metric, payload);
        this.lastUpdate.set(metric, new Date());
        this.notifySubscribers(metric, payload);
      }
    } catch (error) {
      console.error("[RealtimeAnalytics] Failed to parse message:", error);
    }
  }

  // ========================================
  // Subscription Management
  // ========================================

  subscribe(
    metric: string,
    callback: (data: any) => void
  ): () => void {
    if (!this.subscribers.has(metric)) {
      this.subscribers.set(metric, new Set());
    }
    this.subscribers.get(metric)!.add(callback);

    // Send cached data immediately if available
    const cached = this.metricsCache.get(metric);
    if (cached) {
      callback(cached);
    }

    // Return unsubscribe function
    return () => {
      const subs = this.subscribers.get(metric);
      if (subs) {
        subs.delete(callback);
      }
    };
  }

  private notifySubscribers(metric: string, data: any): void {
    const subs = this.subscribers.get(metric);
    if (subs) {
      subs.forEach((callback) => {
        try {
          callback(data);
        } catch (error) {
          console.error("[RealtimeAnalytics] Subscriber error:", error);
        }
      });
    }
  }

  // ========================================
  // Metric Getters
  // ========================================

  getDashboardMetrics(): DashboardMetrics | null {
    return this.metricsCache.get("dashboard_metrics") ?? null;
  }

  getActiveUsers(): number {
    const data = this.metricsCache.get("active_users");
    return data?.count ?? 0;
  }

  getComputationMetrics(): ComputationMetrics | null {
    return this.metricsCache.get("computations") ?? null;
  }

  getAPIMetrics(): APIMetrics | null {
    return this.metricsCache.get("api_performance") ?? null;
  }

  getErrorMetrics(): { total_errors: number; error_rate: number } | null {
    return this.metricsCache.get("errors") ?? null;
  }

  getRevenueMetrics(): { mrr: number; arr: number; churn: number } | null {
    return this.metricsCache.get("revenue") ?? null;
  }

  // ========================================
  // Time-Series Data
  // ========================================

  private timeSeriesBuffer: Map<
    string,
    Array<{ timestamp: Date; value: number }>
  > = new Map();

  addTimeSeriesData(metric: string, value: number): void {
    if (!this.timeSeriesBuffer.has(metric)) {
      this.timeSeriesBuffer.set(metric, []);
    }

    const buffer = this.timeSeriesBuffer.get(metric)!;
    buffer.push({
      timestamp: new Date(),
      value,
    });

    // Keep only last 1000 data points
    if (buffer.length > 1000) {
      buffer.shift();
    }
  }

  getTimeSeriesData(
    metric: string,
    limit: number = 100
  ): Array<{ timestamp: Date; value: number }> {
    const buffer = this.timeSeriesBuffer.get(metric) ?? [];
    return buffer.slice(-limit);
  }

  // ========================================
  // Health Check
  // ========================================

  isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }

  getLastUpdate(metric: string): Date | null {
    return this.lastUpdate.get(metric) ?? null;
  }

  getConnectionStatus(): {
    connected: boolean;
    uptime?: number;
    lastUpdate?: Date;
  } {
    return {
      connected: this.isConnected(),
      uptime: this.isConnected()
        ? Date.now() - (this.lastUpdate.values().next().value ?? Date.now())
        : undefined,
      lastUpdate: Array.from(this.lastUpdate.values()).pop(),
    };
  }
}

// ============================================================================
// FALLBACK API-BASED ANALYTICS (for environments without WebSocket)
// ============================================================================

export class PollingAnalyticsEngine {
  private pollInterval: NodeJS.Timer | null = null;
  private subscribers: Map<string, Set<(data: any) => void>> = new Map();
  private metricsCache: Map<string, any> = new Map();

  constructor(
    private apiUrl: string,
    private pollFrequency: number = 5000
  ) {}

  async connect(): Promise<void> {
    console.log("[PollingAnalytics] Starting polling");
    await this.poll();
    this.pollInterval = setInterval(() => this.poll(), this.pollFrequency);
  }

  disconnect(): void {
    if (this.pollInterval) {
      clearInterval(this.pollInterval);
      this.pollInterval = null;
    }
    this.subscribers.clear();
    this.metricsCache.clear();
  }

  private async poll(): Promise<void> {
    try {
      const response = await fetch(`${this.apiUrl}/metrics`);
      const data = await response.json();

      Object.entries(data).forEach(([metric, payload]) => {
        const cached = this.metricsCache.get(metric);
        if (JSON.stringify(cached) !== JSON.stringify(payload)) {
          this.metricsCache.set(metric, payload);
          this.notifySubscribers(metric, payload);
        }
      });
    } catch (error) {
      console.error("[PollingAnalytics] Poll error:", error);
    }
  }

  subscribe(metric: string, callback: (data: any) => void): () => void {
    if (!this.subscribers.has(metric)) {
      this.subscribers.set(metric, new Set());
    }
    this.subscribers.get(metric)!.add(callback);

    const cached = this.metricsCache.get(metric);
    if (cached) {
      callback(cached);
    }

    return () => {
      const subs = this.subscribers.get(metric);
      if (subs) {
        subs.delete(callback);
      }
    };
  }

  private notifySubscribers(metric: string, data: any): void {
    const subs = this.subscribers.get(metric);
    if (subs) {
      subs.forEach((callback) => {
        try {
          callback(data);
        } catch (error) {
          console.error("[PollingAnalytics] Subscriber error:", error);
        }
      });
    }
  }

  isConnected(): boolean {
    return this.pollInterval !== null;
  }
}

// ============================================================================
// ANALYTICS ENGINE FACTORY
// ============================================================================

let analyticsEngine: RealtimeAnalyticsEngine | PollingAnalyticsEngine | null =
  null;

export function initializeAnalytics(
  wsUrl?: string
): RealtimeAnalyticsEngine | PollingAnalyticsEngine {
  if (!analyticsEngine) {
    if (wsUrl && typeof window !== "undefined") {
      try {
        analyticsEngine = new RealtimeAnalyticsEngine(wsUrl);
        analyticsEngine.connect().catch(() => {
          // Fallback to polling if WebSocket fails
          analyticsEngine = new PollingAnalyticsEngine(
            wsUrl.replace("ws", "http")
          );
          analyticsEngine.connect();
        });
      } catch {
        analyticsEngine = new PollingAnalyticsEngine("/api/admin");
        analyticsEngine.connect();
      }
    } else {
      analyticsEngine = new PollingAnalyticsEngine("/api/admin");
      analyticsEngine.connect();
    }
  }
  return analyticsEngine;
}

export function getAnalyticsEngine():
  | RealtimeAnalyticsEngine
  | PollingAnalyticsEngine
  | null {
  return analyticsEngine;
}

export function closeAnalytics(): void {
  if (analyticsEngine) {
    analyticsEngine.disconnect();
    analyticsEngine = null;
  }
}
