import { IJobSource, JobDiscoveryContext, JobSourceHealth, JobSourceCapabilities } from '../../interfaces/IJobSource';
import { CanonicalJob } from '../../CanonicalJob';
import { computeJobFingerprint } from '../../JobFingerprint';

export class GreenhouseJobSource implements IJobSource {
  id = 'greenhouse';
  name = 'Greenhouse';

  capabilities: JobSourceCapabilities = {
    api: true,
    rss: false,
    search: true,
    fullDescription: true,
    pagination: true,
    incrementalSync: true
  };

  async discover(context: JobDiscoveryContext): Promise<CanonicalJob[]> {
    const targetBoards = ['airbnb', 'stripe', 'cloudflare', 'figma', 'gitlab'];
    const jobs: CanonicalJob[] = [];

    for (const board of targetBoards) {
      try {
        const res = await fetch(`https://boards-api.greenhouse.io/v1/boards/${board}/jobs?content=true`);
        if (!res.ok) continue;
        const data = await res.json();
        const rawJobs = data.jobs || [];

        for (const r of rawJobs.slice(0, 5)) {
          const canonical: CanonicalJob = {
            fingerprint: '',
            source: {
              provider: 'Greenhouse',
              externalId: String(r.id),
              originalUrl: r.absolute_url || `https://boards.greenhouse.io/${board}/jobs/${r.id}`,
              discoveredAt: new Date()
            },
            company: {
              name: board.charAt(0).toUpperCase() + board.slice(1),
              normalizedName: board.toLowerCase()
            },
            title: r.title,
            normalizedTitle: r.title.toLowerCase().trim(),
            description: r.content || `${r.title} role at ${board}`,
            location: {
              city: r.location?.name,
              remote: r.location?.name?.toLowerCase().includes('remote') ?? true
            },
            employmentType: 'Full-time',
            postedAt: r.updated_at ? new Date(r.updated_at) : new Date()
          };

          canonical.fingerprint = computeJobFingerprint(canonical);
          jobs.push(canonical);
        }
      } catch (err) {
        console.warn(`[GreenhouseJobSource] Notice fetching board ${board}:`, (err as Error).message);
      }
    }

    return jobs;
  }

  async healthCheck(): Promise<JobSourceHealth> {
    const start = Date.now();
    try {
      const res = await fetch('https://boards-api.greenhouse.io/v1/boards/airbnb/jobs');
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
