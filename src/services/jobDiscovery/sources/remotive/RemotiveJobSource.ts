import { IJobSource, JobDiscoveryContext, JobSourceHealth, JobSourceCapabilities } from '../../interfaces/IJobSource';
import { CanonicalJob } from '../../CanonicalJob';
import { computeJobFingerprint } from '../../JobFingerprint';

export class RemotiveJobSource implements IJobSource {
  id = 'remotive';
  name = 'Remotive';

  capabilities: JobSourceCapabilities = {
    api: true,
    rss: true,
    search: true,
    fullDescription: true,
    pagination: false,
    incrementalSync: true
  };

  async discover(context: JobDiscoveryContext): Promise<CanonicalJob[]> {
    const jobs: CanonicalJob[] = [];
    try {
      const keyword = context.keywords?.[0] || 'software';
      const res = await fetch(`https://remotive.com/api/remote-jobs?search=${encodeURIComponent(keyword)}&limit=10`);
      if (!res.ok) return jobs;
      const data = await res.json();
      const rawJobs = data.jobs || [];

      for (const r of rawJobs) {
        const canonical: CanonicalJob = {
          fingerprint: '',
          source: {
            provider: 'Remotive',
            externalId: String(r.id),
            originalUrl: r.url || `https://remotive.com/remote-jobs/${r.id}`,
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
            city: r.candidate_required_location || 'Remote',
            remote: true
          },
          employmentType: r.job_type || 'Full-time',
          postedAt: r.publication_date ? new Date(r.publication_date) : new Date()
        };

        canonical.fingerprint = computeJobFingerprint(canonical);
        jobs.push(canonical);
      }
    } catch (err) {
      console.warn('[RemotiveJobSource] Notice:', (err as Error).message);
    }
    return jobs;
  }

  async healthCheck(): Promise<JobSourceHealth> {
    const start = Date.now();
    try {
      const res = await fetch('https://remotive.com/api/remote-jobs?limit=1');
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
