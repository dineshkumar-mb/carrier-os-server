import { IJobSource, JobDiscoveryContext } from './interfaces/IJobSource';
import { GreenhouseSource } from './sources/GreenhouseSource';
import { LeverSource } from './sources/LeverSource';
import { AshbySource } from './sources/AshbySource';
import { SourceReliabilityTracker } from './SourceReliabilityTracker';
import { CanonicalJob } from './CanonicalJob';

export class JobSourceRegistry {
  private static instance: JobSourceRegistry;
  private sources: Map<string, IJobSource> = new Map();
  private tracker: SourceReliabilityTracker;

  private constructor() {
    this.tracker = SourceReliabilityTracker.getInstance();
    this.registerDefaultSources();
  }

  public static getInstance(): JobSourceRegistry {
    if (!JobSourceRegistry.instance) {
      JobSourceRegistry.instance = new JobSourceRegistry();
    }
    return JobSourceRegistry.instance;
  }

  private registerDefaultSources(): void {
    const defaults: IJobSource[] = [
      new GreenhouseSource(),
      new LeverSource(),
      new AshbySource()
    ];

    for (const source of defaults) {
      this.registerSource(source);
    }
  }

  public registerSource(source: IJobSource): void {
    this.sources.set(source.id, source);
    this.tracker.registerSource(source.id, source.name);
  }

  public getSource(id: string): IJobSource | undefined {
    return this.sources.get(id);
  }

  public getAllSources(): IJobSource[] {
    return Array.from(this.sources.values());
  }

  public async searchAllSources(context: JobDiscoveryContext): Promise<CanonicalJob[]> {
    const allJobs: CanonicalJob[] = [];

    for (const [id, source] of this.sources.entries()) {
      if (!this.tracker.isSourceUsable(id)) {
        console.warn(`[JobSourceRegistry] Skipping degraded/failing source: ${id}`);
        continue;
      }

      const start = Date.now();
      try {
        const jobs = await source.discover(context);
        const latency = Date.now() - start;
        this.tracker.recordSuccess(id, jobs.length, latency);
        allJobs.push(...jobs);
      } catch (err: any) {
        this.tracker.recordFailure(id, 'HTTP', err.message || 'Error fetching jobs');
      }
    }

    return allJobs;
  }
}

export const jobSourceRegistry = JobSourceRegistry.getInstance();
