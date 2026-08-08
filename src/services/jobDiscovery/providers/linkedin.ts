import { JobProvider, JobInput, DiscoveryFilter } from '../types';

/**
 * LinkedIn Jobs Provider
 * Fetches live job listings via LinkedIn's guest job search API using native fetch.
 */
export class LinkedInProvider implements JobProvider {
  name = 'LinkedIn';

  async searchJobs(_profile: any, query: string, filter?: DiscoveryFilter): Promise<JobInput[]> {
    try {
      console.log(`[LinkedIn] 🔍 Searching LinkedIn Jobs for: "${query}"`);
      const searchUrl = `https://www.linkedin.com/jobs-guest/jobs/api/seeMoreJobPostings/search?keywords=${encodeURIComponent(query)}&start=0`;
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      const response = await fetch(searchUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
          'Accept-Language': 'en-US,en;q=0.9',
        },
        signal: controller.signal
      });
      clearTimeout(timeoutId);

      const html = await response.text();
      const jobs: JobInput[] = [];

      // Regex parser for guest LinkedIn search cards
      const titleMatches = [...html.matchAll(/<h3 class="base-search-card__title">([\s\S]*?)<\/h3>/g)];
      const companyMatches = [...html.matchAll(/<h4 class="base-search-card__subtitle">([\s\S]*?)<\/h4>/g)];
      const locationMatches = [...html.matchAll(/<span class="job-search-card__location">([\s\S]*?)<\/span>/g)];
      const urlMatches = [...html.matchAll(/<a class="base-card__full-link[^"]*" href="([^"]*)"/g)];

      const count = Math.min(titleMatches.length, companyMatches.length, urlMatches.length, 10);

      for (let i = 0; i < count; i++) {
        const title = titleMatches[i][1].replace(/<[^>]+>/g, '').trim();
        const company = companyMatches[i][1].replace(/<[^>]+>/g, '').trim();
        const location = locationMatches[i] ? locationMatches[i][1].replace(/<[^>]+>/g, '').trim() : 'Remote / Hybrid';
        const url = urlMatches[i][1].split('?')[0];

        if (title && company && url) {
          jobs.push({
            title,
            company,
            location,
            description: `${title} role at ${company}. Location: ${location}. Source: LinkedIn Jobs.`,
            url,
            applicationUrl: url,
            source: 'LinkedIn',
            employmentType: 'Full-time',
            remoteStatus: location.toLowerCase().includes('remote') ? 'Remote' : 'Hybrid',
            postedDate: new Date()
          });
        }
      }

      console.log(`[LinkedIn] Found ${jobs.length} live jobs for query "${query}".`);
      return jobs;
    } catch (err: any) {
      console.error('[LinkedIn] Discovery error:', err.message);
      return [];
    }
  }
}
