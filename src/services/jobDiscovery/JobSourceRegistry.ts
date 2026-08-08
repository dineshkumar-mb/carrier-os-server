import { CanonicalJob, DiscoveryFilter } from './types';

export interface IJobSource {
  id: string;
  name: string;
  searchAllowed: boolean;
  autoApplyAllowed: boolean;
  search(criteria: any, filter?: DiscoveryFilter): Promise<CanonicalJob[]>;
}

export class JobSourceRegistry {
  private static instance: JobSourceRegistry;
  private sources: Map<string, IJobSource> = new Map();

  private constructor() {}

  public static getInstance(): JobSourceRegistry {
    if (!JobSourceRegistry.instance) {
      JobSourceRegistry.instance = new JobSourceRegistry();
    }
    return JobSourceRegistry.instance;
  }

  public register(source: IJobSource): void {
    console.log(`[JobSourceRegistry] Registered job source provider: ${source.id} (${source.name})`);
    this.sources.set(source.id, source);
  }

  public getSource(id: string): IJobSource | undefined {
    return this.sources.get(id);
  }

  public getAllSources(): IJobSource[] {
    return Array.from(this.sources.values());
  }

  public async searchAllSources(criteria: any, filter?: DiscoveryFilter): Promise<CanonicalJob[]> {
    const results: CanonicalJob[] = [];
    for (const source of this.sources.values()) {
      if (source.searchAllowed) {
        try {
          const jobs = await source.search(criteria, filter);
          results.push(...jobs);
        } catch (err) {
          console.error(`[JobSourceRegistry] Error searching source ${source.id}:`, err);
        }
      }
    }
    return results;
  }
}

export const jobSourceRegistry = JobSourceRegistry.getInstance();
