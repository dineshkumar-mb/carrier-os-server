export type SourceHealthStatus = 'HEALTHY' | 'DEGRADED' | 'FAILING';

export interface SourceTelemetry {
  sourceId: string;
  sourceName: string;
  status: SourceHealthStatus;
  jobsDiscovered: number;
  jobsValid: number;
  duplicates: number;
  expired: number;
  authenticityFailures: number;
  httpFailures: number;
  parsingFailures: number;
  averageLatencyMs: number;
  lastSuccessfulScan?: Date;
  lastError?: string;
}

export class SourceReliabilityTracker {
  private static instance: SourceReliabilityTracker;
  private telemetryMap: Map<string, SourceTelemetry> = new Map();

  private constructor() {}

  public static getInstance(): SourceReliabilityTracker {
    if (!SourceReliabilityTracker.instance) {
      SourceReliabilityTracker.instance = new SourceReliabilityTracker();
    }
    return SourceReliabilityTracker.instance;
  }

  public registerSource(sourceId: string, sourceName: string): void {
    if (!this.telemetryMap.has(sourceId)) {
      this.telemetryMap.set(sourceId, {
        sourceId,
        sourceName,
        status: 'HEALTHY',
        jobsDiscovered: 0,
        jobsValid: 0,
        duplicates: 0,
        expired: 0,
        authenticityFailures: 0,
        httpFailures: 0,
        parsingFailures: 0,
        averageLatencyMs: 120,
        lastSuccessfulScan: new Date()
      });
    }
  }

  public recordSuccess(sourceId: string, count: number, latencyMs: number): void {
    const t = this.telemetryMap.get(sourceId);
    if (!t) return;

    t.jobsDiscovered += count;
    t.jobsValid += count;
    t.averageLatencyMs = Math.round((t.averageLatencyMs + latencyMs) / 2);
    t.lastSuccessfulScan = new Date();

    if (t.httpFailures === 0 && t.parsingFailures === 0) {
      t.status = 'HEALTHY';
    }
  }

  public recordFailure(sourceId: string, type: 'HTTP' | 'PARSING' | 'AUTHENTICITY', errorMsg: string): void {
    const t = this.telemetryMap.get(sourceId);
    if (!t) return;

    if (type === 'HTTP') t.httpFailures++;
    else if (type === 'PARSING') t.parsingFailures++;
    else if (type === 'AUTHENTICITY') t.authenticityFailures++;

    t.lastError = errorMsg;

    const totalFailures = t.httpFailures + t.parsingFailures;
    if (totalFailures >= 5) {
      t.status = 'FAILING';
    } else if (totalFailures >= 2) {
      t.status = 'DEGRADED';
    }
  }

  public getTelemetry(sourceId: string): SourceTelemetry | undefined {
    return this.telemetryMap.get(sourceId);
  }

  public getAllTelemetry(): SourceTelemetry[] {
    return Array.from(this.telemetryMap.values());
  }

  public isSourceUsable(sourceId: string): boolean {
    const t = this.telemetryMap.get(sourceId);
    if (!t) return true;
    return t.status !== 'FAILING';
  }
}
