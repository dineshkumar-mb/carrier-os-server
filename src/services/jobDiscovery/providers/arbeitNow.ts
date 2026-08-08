import { JobProvider, JobInput } from '../types';

/**
 * ArbeitNow Provider
 * Source: https://www.arbeitnow.com/api/job-board-api
 * Public JSON API — no authentication required.
 * English-language remote & Europe-based jobs.
 */
export class ArbeitNowProvider implements JobProvider {
  name = 'ArbeitNow';

  async searchJobs(_profile: any, query: string): Promise<JobInput[]> {
    try {
      console.log(`[Discovery] Querying ArbeitNow API for: ${query}`);

      // ArbeitNow uses a page-based API; search by tag via the public endpoint
      const url = `https://www.arbeitnow.com/api/job-board-api?page=1`;
      const res = await fetch(url, {
        headers: { 'User-Agent': 'CarrierOS-JobDiscovery/1.0' },
        signal: AbortSignal.timeout(10000),
      });
      if (!res.ok) throw new Error(`ArbeitNow responded with ${res.status}`);

      const data: any = await res.json();
      const jobs: any[] = data.data || [];

      // Filter by query relevance (title or tags contain query keywords)
      const lowerQuery = query.toLowerCase();
      const queryTerms = lowerQuery.split(' ').filter(t => t.length > 2);

      const filtered = jobs.filter((j: any) => {
        const text = `${j.title} ${(j.tags || []).join(' ')}`.toLowerCase();
        return queryTerms.some(term => text.includes(term));
      });

      return filtered.slice(0, 15).map((j: any) => ({
        title: j.title,
        company: j.company_name || 'Unknown Company',
        description: j.description || '',
        url: j.url || `https://www.arbeitnow.com/jobs/${j.slug}`,
        applicationUrl: j.url,
        location: j.location || 'Remote',
        country: j.country || undefined,
        city: j.city || undefined,
        salary: j.salary || undefined,
        source: 'ArbeitNow',
        employmentType: 'Full-time',
        remoteStatus: j.remote ? 'Remote' : 'Onsite',
        postedDate: j.created_at ? new Date(j.created_at * 1000) : undefined,
        skills: j.tags || [],
      }));
    } catch (err) {
      console.error('[ArbeitNow] Provider error:', err);
      return [];
    }
  }
}
