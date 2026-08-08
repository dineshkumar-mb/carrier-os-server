import { JobProvider, JobInput } from '../types';

/**
 * Lever ATS Provider
 * Source: https://api.lever.co/v0/postings/{company}?mode=json
 * Public JSON API — no authentication required for public job boards.
 * Fetches open roles from companies using Lever as their ATS.
 */

// Well-known tech companies using Lever. Extend this list as needed.
const LEVER_COMPANIES = [
  'openai',
  'anthropic',
  'scale',
  'together',
  'cohere',
  'perplexity',
  'huggingface',
  'anyscale',
  'weights-and-biases',
  'modal',
  'replicate',
  'mistral',
];

export class LeverProvider implements JobProvider {
  name = 'Lever';

  private stripHtml(html: string): string {
    return (html || '')
      .replace(/<[^>]*>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 1000);
  }

  async searchJobs(_profile: any, query: string): Promise<JobInput[]> {
    const lowerQuery = query.toLowerCase();
    const queryTerms = lowerQuery.split(' ').filter(t => t.length > 2);

    const results: JobInput[] = [];

    // Sample companies per query
    const companies = LEVER_COMPANIES.slice(0, 5);

    await Promise.all(
      companies.map(async (company) => {
        try {
          const res = await fetch(
            `https://api.lever.co/v0/postings/${company}?mode=json`,
            {
              headers: { 'User-Agent': 'CarrierOS-JobDiscovery/1.0' },
              signal: AbortSignal.timeout(8000),
            }
          );
          if (!res.ok) return;

          const jobs: any[] = await res.json();
          if (!Array.isArray(jobs)) return;

          for (const j of jobs) {
            const text = `${j.text || ''} ${j.categories?.team || ''} ${j.categories?.location || ''}`.toLowerCase();
            if (!queryTerms.some(term => text.includes(term))) continue;

            // Build description from Lever lists
            const lists: string[] = (j.lists || []).map((l: any) =>
              `${l.text}: ${this.stripHtml(l.content)}`
            );
            const description = lists.join(' | ') || this.stripHtml(j.descriptionPlain || '');

            results.push({
              title: j.text,
              company: j.company || company,
              description,
              url: j.hostedUrl,
              applicationUrl: j.applyUrl || j.hostedUrl,
              location: j.categories?.location || j.categories?.allLocations?.[0] || 'Remote',
              source: 'Lever',
              employmentType: j.categories?.commitment || 'Full-time',
              remoteStatus: (j.categories?.location || '').toLowerCase().includes('remote') ? 'Remote' : 'Onsite',
              postedDate: j.createdAt ? new Date(j.createdAt) : undefined,
            });
          }
        } catch (err) {
          console.warn(`[Lever] Skipped company "${company}":`, (err as Error).message);
        }
      })
    );

    return results.slice(0, 20);
  }
}
