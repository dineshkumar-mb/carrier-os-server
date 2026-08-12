import { IJobSource, JobDiscoveryContext, JobSourceHealth, JobSourceCapabilities } from '../../interfaces/IJobSource';
import { CanonicalJob } from '../../CanonicalJob';
import { computeJobFingerprint } from '../../JobFingerprint';

export class ArbeitnowJobSource implements IJobSource {
  id = 'arbeitnow';
  name = 'Arbeitnow';

  capabilities: JobSourceCapabilities = {
    api: true,
    rss: false,
    search: true,
    fullDescription: true,
    pagination: true,
    incrementalSync: true
  };

  async discover(context: JobDiscoveryContext): Promise<CanonicalJob[]> {
    const jobs: CanonicalJob[] = [];
    try {
      const res = await fetch('https://www.arbeitnow.com/api/job-board-api');
      if (!res.ok) return jobs;
      const data = await res.json();
      const rawJobs = data.data || [];

      for (const r of rawJobs.slice(0, 10)) {
        const canonical: CanonicalJob = {
          fingerprint: '',
          source: {
            provider: 'Arbeitnow',
            externalId: String(r.slug),
            originalUrl: r.url || `https://www.arbeitnow.com/view/${r.slug}`,
            discoveredAt: new Date()
          },
          company: {
            name: r.company_name,
            normalizedName: r.company_name.toLowerCase().trim()
          },
          title: r.title,
          normalizedTitle: r.title.toLowerCase().trim(),
          description: r.description || `${r.title} at ${r.company_name}`,
          location: {
            city: r.location,
            remote: r.remote ?? true
          },
          employmentType: r.job_types?.join(', ') || 'Full-time',
          postedAt: r.created_at ? new Date(r.created_at * 1000) : new Date()
        };

        canonical.fingerprint = computeJobFingerprint(canonical);
        jobs.push(canonical);
      }
    } catch (err) {
      console.warn('[ArbeitnowJobSource] Notice:', (err as Error).message);
    }
    return jobs;
  }

  async healthCheck(): Promise<JobSourceHealth> {
    const start = Date.now();
    try {
      const res = await fetch('https://www.arbeitnow.com/api/job-board-api');
      return {
        healthy: res.ok,
        latencyMs: Date.now() - start,
        lastSuccessfulSync: new Date(),
        statusText: res.ok ? '🟢 Operational' : 'Degraded'
      };
    } catch (e) {
      return { healthy: false, error: (e as Error).message, statusText: 'Unavailable' };
    }
  }
}
