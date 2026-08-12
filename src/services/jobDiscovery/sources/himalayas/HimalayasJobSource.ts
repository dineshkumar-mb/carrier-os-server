import { IJobSource, JobDiscoveryContext, JobSourceHealth, JobSourceCapabilities } from '../../interfaces/IJobSource';
import { CanonicalJob } from '../../CanonicalJob';
import { computeJobFingerprint } from '../../JobFingerprint';

export class HimalayasJobSource implements IJobSource {
  id = 'himalayas';
  name = 'Himalayas';

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
      const res = await fetch('https://himalayas.app/jobs/api?limit=10');
      if (!res.ok) return jobs;
      const data = await res.json();
      const rawJobs = data.jobs || [];

      for (const r of rawJobs) {
        const canonical: CanonicalJob = {
          fingerprint: '',
          source: {
            provider: 'Himalayas',
            externalId: String(r.id || r.slug),
            originalUrl: r.applicationLink || r.url || `https://himalayas.app/jobs/${r.slug}`,
            discoveredAt: new Date()
          },
          company: {
            name: r.companyName || 'Himalayas Enterprise',
            normalizedName: (r.companyName || 'himalayas').toLowerCase().trim()
          },
          title: r.title,
          normalizedTitle: r.title.toLowerCase().trim(),
          description: r.description || `${r.title} at ${r.companyName}`,
          location: {
            city: r.locationRestriction || 'Remote',
            remote: true
          },
          employmentType: 'Full-time',
          postedAt: r.pubDate ? new Date(r.pubDate) : new Date()
        };

        canonical.fingerprint = computeJobFingerprint(canonical);
        jobs.push(canonical);
      }
    } catch (err) {
      console.warn('[HimalayasJobSource] Notice:', (err as Error).message);
    }
    return jobs;
  }

  async healthCheck(): Promise<JobSourceHealth> {
    const start = Date.now();
    try {
      const res = await fetch('https://himalayas.app/jobs/api?limit=1');
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
