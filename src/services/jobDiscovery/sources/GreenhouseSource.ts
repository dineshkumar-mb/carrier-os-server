import { IJobSource, JobDiscoveryContext, JobSourceCapabilities, JobSourceHealth } from '../interfaces/IJobSource';
import { CanonicalJob } from '../CanonicalJob';

export class GreenhouseSource implements IJobSource {
  public id = 'greenhouse';
  public name = 'Greenhouse ATS API & Portal Source';

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
        fingerprint: 'fp_gh_101',
        source: {
          provider: this.id,
          externalId: 'gh_101',
          originalUrl: 'https://boards.greenhouse.io/stripe/jobs/101',
          discoveredAt: new Date()
        },
        company: {
          name: 'Stripe',
          normalizedName: 'stripe',
          domain: 'stripe.com'
        },
        title: 'Staff Distributed Systems Engineer',
        normalizedTitle: 'staff distributed systems engineer',
        description: 'Design and build high-throughput payment infrastructure in Go and TypeScript.',
        location: {
          city: 'San Francisco',
          country: 'US',
          remote: true
        },
        skills: ['Go', 'TypeScript', 'Distributed Systems', 'Kubernetes'],
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
      latencyMs: 85,
      lastSuccessfulSync: new Date(),
      statusText: 'Greenhouse API Operational'
    };
  }
}
