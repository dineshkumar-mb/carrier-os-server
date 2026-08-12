import { IJobSource, JobDiscoveryContext, JobSourceHealth, JobSourceCapabilities } from '../../interfaces/IJobSource';
import { CanonicalJob } from '../../CanonicalJob';
import { computeJobFingerprint } from '../../JobFingerprint';

export class LeverJobSource implements IJobSource {
  id = 'lever';
  name = 'Lever';

  capabilities: JobSourceCapabilities = {
    api: true,
    rss: false,
    search: true,
    fullDescription: true,
    pagination: false,
    incrementalSync: true
  };

  async discover(context: JobDiscoveryContext): Promise<CanonicalJob[]> {
    const targetCompanies = ['figma', 'netflix', 'palantir', 'spotify'];
    const jobs: CanonicalJob[] = [];

    for (const company of targetCompanies) {
      try {
        const res = await fetch(`https://api.lever.co/v0/postings/${company}?mode=json`);
        if (!res.ok) continue;
        const rawJobs = await res.json();

        for (const r of (rawJobs || []).slice(0, 5)) {
          const canonical: CanonicalJob = {
            fingerprint: '',
            source: {
              provider: 'Lever',
              externalId: String(r.id),
              originalUrl: r.hostedUrl || `https://jobs.lever.co/${company}/${r.id}`,
              discoveredAt: new Date()
            },
            company: {
              name: company.charAt(0).toUpperCase() + company.slice(1),
              normalizedName: company.toLowerCase()
            },
            title: r.text,
            normalizedTitle: r.text.toLowerCase().trim(),
            description: r.descriptionPlain || r.text,
            location: {
              city: r.categories?.location,
              remote: r.categories?.location?.toLowerCase().includes('remote') ?? true
            },
            employmentType: r.categories?.commitment || 'Full-time',
            postedAt: r.createdAt ? new Date(r.createdAt) : new Date()
          };

          canonical.fingerprint = computeJobFingerprint(canonical);
          jobs.push(canonical);
        }
      } catch (err) {
        console.warn(`[LeverJobSource] Notice fetching ${company}:`, (err as Error).message);
      }
    }

    return jobs;
  }

  async healthCheck(): Promise<JobSourceHealth> {
    const start = Date.now();
    try {
      const res = await fetch('https://api.lever.co/v0/postings/figma?mode=json');
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
