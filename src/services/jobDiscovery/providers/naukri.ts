import { JobProvider, JobInput, DiscoveryFilter } from '../types';
import { chromium } from 'playwright';

/**
 * Naukri Provider
 * Uses Playwright to load and scrape startup/embedded/software job listings dynamically.
 */
export class NaukriProvider implements JobProvider {
  name = 'Naukri';

  async searchJobs(_profile: any, query: string, filter?: DiscoveryFilter): Promise<JobInput[]> {
    let browser;
    try {
      console.log(`[Naukri] 🔍 Searching Naukri for: "${query}"`);
      
      browser = await chromium.launch({ headless: true });
      const context = await browser.newContext({
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36'
      });
      const page = await context.newPage();

      const searchUrl = `https://www.naukri.com/${encodeURIComponent(query.toLowerCase().replace(/\s+/g, '-'))}-jobs`;
      
      // Navigate to search URL
      await page.goto(searchUrl, { waitUntil: 'domcontentloaded', timeout: 15000 });
      
      // Wait for job cards container to load
      try {
        await page.waitForSelector('article.jobTuple, div.jobTuple, article[class*="job"], div[class*="job-card"]', { timeout: 8000 });
      } catch {
        console.warn('[Naukri] Timeout waiting for job card elements.');
      }

      // Extract job cards
      const jobs = await page.$$eval(
        'article.jobTuple, div.jobTuple, article[class*="job"], div[class*="job-card"], div[class*="cust-job-tuple"]',
        (elements) => {
          return elements.map(el => {
            const titleEl = el.querySelector('a.title, a.jobTitle, a[class*="title"]');
            const title = titleEl ? titleEl.textContent?.trim() || '' : '';
            const url = titleEl ? (titleEl.getAttribute('href') || '') : '';
            
            const companyEl = el.querySelector('a.comp-name, span.comp-name, a[class*="companyName"]');
            const company = companyEl ? companyEl.textContent?.trim() || '' : '';
            
            const locationEl = el.querySelector('span.locWdth, li[class*="location"]');
            const location = locationEl ? locationEl.textContent?.trim() || '' : '';
            
            const descEl = el.querySelector('span.job-desc, div.job-desc, [class*="description"]');
            const description = descEl ? descEl.textContent?.trim() || '' : '';
            
            const expEl = el.querySelector('span.exp, li[class*="experience"]');
            const experience = expEl ? expEl.textContent?.trim() || '' : '';

            return {
              title,
              company,
              location,
              description: description || `Experience required: ${experience}. Location: ${location}`,
              url
            };
          });
        }
      );

      await browser.close();

      return jobs
        .filter(j => j.title && j.company && j.url)
        .map(j => ({
          title: j.title,
          company: j.company,
          location: j.location,
          description: j.description,
          url: j.url,
          applicationUrl: j.url,
          source: 'Naukri',
          employmentType: 'Full-time',
          remoteStatus: j.location.toLowerCase().includes('remote') ? 'Remote' : 'Onsite',
          postedDate: new Date()
        }));

    } catch (err) {
      console.error('[Naukri] Scraper error:', err);
      if (browser) await browser.close();
      return [];
    }
  }
}
