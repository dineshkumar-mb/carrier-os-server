import { JobProvider, JobInput, DiscoveryFilter } from '../types';
import { chromium } from 'playwright';

/**
 * Internshala Provider
 * Uses Playwright to scrape active internships/jobs based on search query keywords.
 */
export class InternshalaProvider implements JobProvider {
  name = 'Internshala';

  async searchJobs(_profile: any, query: string, filter?: DiscoveryFilter): Promise<JobInput[]> {
    let browser;
    try {
      console.log(`[Internshala] 🔍 Searching Internshala for: "${query}"`);
      
      browser = await chromium.launch({ headless: true });
      const context = await browser.newContext({
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36'
      });
      const page = await context.newPage();

      const searchUrl = `https://internshala.com/internships/keywords-${encodeURIComponent(query.toLowerCase().replace(/\s+/g, '-'))}/`;
      
      // Navigate to search URL
      await page.goto(searchUrl, { waitUntil: 'domcontentloaded', timeout: 15000 });
      
      // Extract job cards
      const cards = await page.$$eval(
        'div.individual_internship.view_detail_button',
        (elements) => {
          return elements.map(el => {
            const internshipId = el.getAttribute('internshipid') || '';
            const dataHref = el.getAttribute('data-href') || '';
            const url = dataHref ? `https://internshala.com${dataHref}` : '';
            
            const titleEl = el.querySelector('.job-internship-name');
            const title = titleEl ? titleEl.textContent?.trim() || '' : '';
            
            const companyEl = el.querySelector('.company-name');
            const company = companyEl ? companyEl.textContent?.trim() || '' : '';
            
            const locationEl = el.querySelector('.locations');
            const location = locationEl ? locationEl.textContent?.trim() || '' : '';
            
            const stipendEl = el.querySelector('.stipend');
            const stipend = stipendEl ? stipendEl.textContent?.trim() || '' : '';
            
            const jdEl = el.querySelector('.about_job');
            const description = jdEl ? jdEl.textContent?.trim() || '' : '';

            const skillEls = el.querySelectorAll('.job_skill');
            const skills = Array.from(skillEls).map(s => s.textContent?.trim() || '');

            return {
              title,
              company,
              location,
              description: description || `Stipend: ${stipend}. Location: ${location}`,
              url,
              skills,
              stipend
            };
          });
        }
      );

      await browser.close();

      return cards
        .filter(c => c.title && c.company && c.url)
        .map(c => ({
          title: c.title,
          company: c.company,
          location: c.location,
          description: c.description,
          url: c.url,
          applicationUrl: c.url,
          source: 'Internshala',
          employmentType: 'Internship',
          remoteStatus: c.location.toLowerCase().includes('remote') || c.location.toLowerCase().includes('work from home') ? 'Remote' : 'Onsite',
          skills: c.skills,
          postedDate: new Date()
        }));

    } catch (err) {
      console.error('[Internshala] Scraper error:', err);
      if (browser) await browser.close();
      return [];
    }
  }
}
