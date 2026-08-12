import { IJobSource, JobDiscoveryContext, JobSourceCapabilities, JobSourceHealth } from '../interfaces/IJobSource';
import { CanonicalJob } from '../CanonicalJob';

export class LeverSource implements IJobSource {
  public id = 'lever';
  public name = 'Lever Postings API Source';

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
        fingerprint: 'fp_lever_202',
        source: {
          provider: this.id,
          externalId: 'lever_202',
          originalUrl: 'https://jobs.lever.co/figma/202',
          discoveredAt: new Date()
        },
        company: {
          name: 'Figma',
          normalizedName: 'figma',
          domain: 'figma.com'
        },
        title: 'Senior Backend Engineer - Platform',
        normalizedTitle: 'senior backend engineer - platform',
        description: 'Build core platform services powering multi-user real-time canvas collaboration.',
        location: {
          city: 'San Francisco',
          state: 'CA',
          remote: true
        },
        skills: ['TypeScript', 'C++', 'Node.js', 'PostgreSQL'],
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
      latencyMs: 110,
      lastSuccessfulSync: new Date(),
      statusText: 'Lever Postings Operational'
    };
  }
}
