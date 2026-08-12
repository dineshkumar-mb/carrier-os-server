import { JobSourceRegistry } from './JobSourceRegistry';
import { SourceReliabilityTracker } from './SourceReliabilityTracker';
import { JobDiscoveryContext } from './interfaces/IJobSource';
import { CanonicalJob } from './CanonicalJob';

export interface DiscoveryScanResult {
  totalDiscovered: number;
  sourcesScanned: number;
  sourcesFailed: number;
  jobs: CanonicalJob[];
  logs: string[];
}

export class DiscoverySchedulerService {
  private static instance: DiscoverySchedulerService;
  private registry: JobSourceRegistry;
  private tracker: SourceReliabilityTracker;
  private lastScanPerSource: Map<string, number> = new Map();
  private sourceCooldownMs = 15000; // 15s cooldown per source

  private constructor() {
    this.registry = JobSourceRegistry.getInstance();
    this.tracker = SourceReliabilityTracker.getInstance();
  }

  public static getInstance(): DiscoverySchedulerService {
    if (!DiscoverySchedulerService.instance) {
      DiscoverySchedulerService.instance = new DiscoverySchedulerService();
    }
    return DiscoverySchedulerService.instance;
  }

  public async executeDiscoveryCycle(context: JobDiscoveryContext): Promise<DiscoveryScanResult> {
    const logs: string[] = [];
    const allJobs: CanonicalJob[] = [];
    let sourcesScanned = 0;
    let sourcesFailed = 0;

    const sources = this.registry.getAllSources();
    logs.push(`[DiscoverySchedulerService] Starting discovery cycle across ${sources.length} active job source plugins...`);

    for (const source of sources) {
      const now = Date.now();
      const lastScan = this.lastScanPerSource.get(source.id) || 0;

      if (now - lastScan < this.sourceCooldownMs) {
        logs.push(`[Source Cooldown] Skipping ${source.name} (Cooldown active: ${Math.round((this.sourceCooldownMs - (now - lastScan)) / 1000)}s remaining)`);
        continue;
      }

      if (!this.tracker.isSourceUsable(source.id)) {
        logs.push(`[Source Reliability Guard] Quarantined FAILING source: ${source.name}`);
        sourcesFailed++;
        continue;
      }

      const start = Date.now();
      try {
        logs.push(`[Scanning Source] Executing search on ${source.name}...`);
        const jobs = await source.discover(context);
        const latency = Date.now() - start;

        this.lastScanPerSource.set(source.id, Date.now());
        this.tracker.recordSuccess(source.id, jobs.length, latency);

        allJobs.push(...jobs);
        sourcesScanned++;
        logs.push(`[Source Success] ${source.name} returned ${jobs.length} jobs in ${latency}ms.`);
      } catch (err: any) {
        sourcesFailed++;
        this.tracker.recordFailure(source.id, 'HTTP', err.message || 'Scan failure');
        logs.push(`[Source Error] ${source.name} scan failed: ${err.message}`);
      }
    }

    return {
      totalDiscovered: allJobs.length,
      sourcesScanned,
      sourcesFailed,
      jobs: allJobs,
      logs
    };
  }
}
