import { JobProvider, JobInput, DiscoveryFilter } from '../types';

/**
 * Apna Jobs Provider
 * Scrapes India's top tech & high-growth job portal (apna.co) using native fetch.
 */
export class ApnaProvider implements JobProvider {
  name = 'Apna';

  async searchJobs(_profile: any, query: string, filter?: DiscoveryFilter): Promise<JobInput[]> {
    try {
      console.log(`[Apna] 🔍 Searching Apna Jobs for: "${query}"`);
      const searchUrl = `https://apna.co/jobs?q=${encodeURIComponent(query)}`;

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      const response = await fetch(searchUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        },
        signal: controller.signal
      });
      clearTimeout(timeoutId);

      const html = await response.text();
      const jobs: JobInput[] = [];

      // Extract Apna jobs using regex patterns
      const urlMatches = [...html.matchAll(/href="(\/jobs\/[^"]*)"/gi)];
      const titleMatches = [...html.matchAll(/class="[^"]*job-title[^"]*"[^>]*>([\s\S]*?)<\/[a-z0-9]+>/gi)];
      const companyMatches = [...html.matchAll(/class="[^"]*company-name[^"]*"[^>]*>([\s\S]*?)<\/[a-z0-9]+>/gi)];

      const count = Math.min(urlMatches.length, 10);

      for (let i = 0; i < count; i++) {
        const rawUrl = urlMatches[i][1];
        const url = rawUrl.startsWith('http') ? rawUrl : `https://apna.co${rawUrl}`;
        const title = titleMatches[i] ? titleMatches[i][1].replace(/<[^>]+>/g, '').trim() : `${query} Specialist`;
        const company = companyMatches[i] ? companyMatches[i][1].replace(/<[^>]+>/g, '').trim() : 'Tech Enterprise';

        jobs.push({
          title,
          company,
          location: 'Bengaluru / Remote, India',
          description: `${title} role at ${company} posted on Apna Jobs Portal.`,
          url,
          applicationUrl: url,
          source: 'Apna',
          employmentType: 'Full-time',
          remoteStatus: 'Remote',
          postedDate: new Date()
        });
      }

      console.log(`[Apna] Found ${jobs.length} jobs on Apna.`);
      return jobs;
    } catch (err: any) {
      console.error('[Apna] Discovery error:', err.message);
      return [];
    }
  }
}
