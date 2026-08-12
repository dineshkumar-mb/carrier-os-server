import { IJobSource, JobDiscoveryContext, JobSourceHealth, JobSourceCapabilities } from '../../interfaces/IJobSource';
import { CanonicalJob } from '../../CanonicalJob';
import { computeJobFingerprint } from '../../JobFingerprint';

export class RemoteOKJobSource implements IJobSource {
  id = 'remoteok';
  name = 'Remote OK';

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
      const res = await fetch('https://remoteok.com/api', {
        headers: { 'User-Agent': 'Mozilla/5.0' }
      });
      if (!res.ok) return jobs;
      const rawData = await res.json();
      const rawJobs = Array.isArray(rawData) ? rawData.slice(1, 15) : []; // skip meta element

      for (const r of rawJobs) {
        if (!r.position || !r.company) continue;
        const canonical: CanonicalJob = {
          fingerprint: '',
          source: {
            provider: 'RemoteOK',
            externalId: String(r.id),
            originalUrl: r.url || `https://remoteok.com/remote-jobs/${r.id}`,
            discoveredAt: new Date()
          },
          company: {
            name: r.company,
            normalizedName: r.company.toLowerCase().trim()
          },
          title: r.position,
          normalizedTitle: r.position.toLowerCase().trim(),
          description: r.description || `${r.position} at ${r.company}`,
          location: {
            city: r.location || 'Remote',
            remote: true
          },
          employmentType: 'Full-time',
          postedAt: r.date ? new Date(r.date) : new Date()
        };

        canonical.fingerprint = computeJobFingerprint(canonical);
        jobs.push(canonical);
      }
    } catch (err) {
      console.warn('[RemoteOKJobSource] Notice:', (err as Error).message);
    }
    return jobs;
  }

  async healthCheck(): Promise<JobSourceHealth> {
    const start = Date.now();
    try {
      const res = await fetch('https://remoteok.com/api', { headers: { 'User-Agent': 'Mozilla/5.0' } });
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
