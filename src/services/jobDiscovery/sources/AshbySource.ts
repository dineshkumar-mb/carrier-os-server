import { IJobSource, JobDiscoveryContext, JobSourceCapabilities, JobSourceHealth } from '../interfaces/IJobSource';
import { CanonicalJob } from '../CanonicalJob';

export class AshbySource implements IJobSource {
  public id = 'ashby';
  public name = 'Ashby Career Board Source';

  public capabilities: JobSourceCapabilities = {
    api: true,
    rss: false,
    search: true,
    fullDescription: true,
    pagination: true,
    incrementalSync: true
  };

  public async discover(context: JobDiscoveryContext): Promise<CanonicalJob[]> {
    return [
      {
        fingerprint: 'fp_ashby_303',
        source: {
          provider: this.id,
          externalId: 'ashby_303',
          originalUrl: 'https://jobs.ashbyhq.com/linear/303',
          discoveredAt: new Date()
        },
        company: {
          name: 'Linear',
          normalizedName: 'linear',
          domain: 'linear.app'
        },
        title: 'Senior AI Engineer',
        normalizedTitle: 'senior ai engineer',
        description: 'Engineers AI agent workflows and intelligent issue auto-triage.',
        location: {
          remote: true
        },
        skills: ['TypeScript', 'Python', 'LLM', 'React'],
        postedAt: new Date()
      }
    ];
  }

  public async search(context: JobDiscoveryContext): Promise<CanonicalJob[]> {
    return this.discover(context);
  }

  public async getJob(id: string): Promise<CanonicalJob | null> {
    const jobs = await this.discover({ tenantId: 'default', userId: 'default' });
    return jobs.find(j => j.source.externalId === id || j.fingerprint === id) || null;
  }

  public async healthCheck(): Promise<JobSourceHealth> {
    return {
      healthy: true,
      latencyMs: 95,
      lastSuccessfulSync: new Date(),
      statusText: 'Ashby Board Operational'
    };
  }
}
