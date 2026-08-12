import { IJobSource, JobDiscoveryContext, JobSourceHealth, JobSourceCapabilities } from '../../interfaces/IJobSource';
import { CanonicalJob } from '../../CanonicalJob';
import { computeJobFingerprint } from '../../JobFingerprint';

export class WeWorkRemotelyJobSource implements IJobSource {
  id = 'weworkremotely';
  name = 'We Work Remotely';

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
      const res = await fetch('https://weworkremotely.com/categories/remote-full-stack-programming-jobs.rss');
      if (!res.ok) return jobs;
      const xmlText = await res.text();
      
      const itemMatches = [...xmlText.matchAll(/<item>([\s\S]*?)<\/item>/gi)];
      for (const item of itemMatches.slice(0, 10)) {
        const titleMatch = item[1].match(/<title>([^<]*)<\/title>/i);
        const linkMatch = item[1].match(/<link>([^<]*)<\/link>/i);
        const descMatch = item[1].match(/<description>([\s\S]*?)<\/description>/i);

        const rawTitle = titleMatch ? titleMatch[1].replace('<![CDATA[', '').replace(']]>', '').trim() : '';
        const link = linkMatch ? linkMatch[1].trim() : '';
        const desc = descMatch ? descMatch[1].replace(/<[^>]+>/g, '').trim() : rawTitle;

        const parts = rawTitle.split(':');
        const company = parts.length > 1 ? parts[0].trim() : 'WeWorkRemotely Enterprise';
        const title = parts.length > 1 ? parts.slice(1).join(':').trim() : rawTitle;

        if (title && link) {
          const canonical: CanonicalJob = {
            fingerprint: '',
            source: {
              provider: 'WeWorkRemotely',
              originalUrl: link,
              discoveredAt: new Date()
            },
            company: {
              name: company,
              normalizedName: company.toLowerCase().trim()
            },
            title,
            normalizedTitle: title.toLowerCase().trim(),
            description: desc,
            location: { city: 'Remote', remote: true },
            employmentType: 'Full-time',
            postedAt: new Date()
          };

          canonical.fingerprint = computeJobFingerprint(canonical);
          jobs.push(canonical);
        }
      }
    } catch (err) {
      console.warn('[WeWorkRemotelyJobSource] Notice:', (err as Error).message);
    }
    return jobs;
  }

  async healthCheck(): Promise<JobSourceHealth> {
    const start = Date.now();
    try {
      const res = await fetch('https://weworkremotely.com/categories/remote-full-stack-programming-jobs.rss');
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
