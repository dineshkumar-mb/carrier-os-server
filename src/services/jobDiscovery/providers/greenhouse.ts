import { JobProvider, JobInput } from '../types';

/**
 * Greenhouse ATS Provider
 * Source: https://boards-api.greenhouse.io/v1/boards/{company}/jobs
 * Public JSON API — no authentication required for public job boards.
 * Fetches open roles from engineering-forward companies.
 */

// Well-known tech companies using Greenhouse. Extend this list as needed.
const GREENHOUSE_COMPANIES = [
  'notion',
  'figma',
  'linear',
  'vercel',
  'stripe',
  'shopify',
  'airbnb',
  'mongodb',
  'hashicorp',
  'postman',
  'grafana',
  'retool',
  'rippling',
  'brex',
];

export class GreenhouseProvider implements JobProvider {
  name = 'Greenhouse';

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

    // Sample 5 companies per query to avoid flooding
    const companies = GREENHOUSE_COMPANIES.slice(0, 5);

    await Promise.all(
      companies.map(async (company) => {
        try {
          const res = await fetch(
            `https://boards-api.greenhouse.io/v1/boards/${company}/jobs?content=true`,
            {
              headers: { 'User-Agent': 'CarrierOS-JobDiscovery/1.0' },
              signal: AbortSignal.timeout(8000),
            }
          );
          if (!res.ok) return;

          const data: any = await res.json();
          const jobs: any[] = data.jobs || [];

          for (const j of jobs) {
            const text = `${j.title} ${j.location?.name || ''}`.toLowerCase();
            if (!queryTerms.some(term => text.includes(term))) continue;

            results.push({
              title: j.title,
              company: data.company?.name || company,
              companyLogo: data.company?.logo_url || undefined,
              description: this.stripHtml(j.content || ''),
              url: j.absolute_url,
              applicationUrl: j.absolute_url,
              location: j.location?.name || 'Remote',
              source: 'Greenhouse',
              employmentType: 'Full-time',
              remoteStatus: (j.location?.name || '').toLowerCase().includes('remote') ? 'Remote' : 'Onsite',
              postedDate: j.updated_at ? new Date(j.updated_at) : undefined,
            });
          }
        } catch (err) {
          // Individual company failure is non-fatal
          console.warn(`[Greenhouse] Skipped company "${company}":`, (err as Error).message);
        }
      })
    );

    return results.slice(0, 20);
  }
}
