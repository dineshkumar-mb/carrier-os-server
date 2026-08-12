export interface ProviderHealth {
  healthy: boolean;
  latencyMs: number;
  lastChecked: Date;
  statusText: string;
  error?: string;
}

export interface ProviderMetrics {
  totalCalls: number;
  successfulCalls: number;
  failedCalls: number;
  averageLatencyMs: number;
  rateLimitHits: number;
  lastUsed?: Date;
}

export interface IProviderPlugin {
  id: string;
  name: string;
  type: 'AI' | 'EMAIL' | 'CALENDAR' | 'JOB_SOURCE';

  healthCheck(): Promise<ProviderHealth>;
  connect(): Promise<boolean>;
  disconnect(): Promise<boolean>;
  rateLimit(): { requestsPerMinute: number; remaining: number };
  retryPolicy(): { maxRetries: number; backoffMs: number };
  timeout(): number; // timeout in ms
  metrics(): ProviderMetrics;
}
