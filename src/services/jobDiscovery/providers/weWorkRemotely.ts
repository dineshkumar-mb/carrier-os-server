import { JobProvider, JobInput } from '../types';

/**
 * We Work Remotely Provider
 * Source: https://weworkremotely.com/remote-jobs.rss
 * Public RSS/XML feed — no authentication required.
 * High-quality remote tech jobs.
 */
export class WeWorkRemotelyProvider implements JobProvider {
  name = 'WeWorkRemotely';

  private stripHtml(html: string): string {
    return html
      .replace(/<[^>]*>/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#039;/g, "'")
      .replace(/\s+/g, ' ')
      .trim();
  }

  private parseRssDate(dateStr: string): Date | undefined {
    try {
      return new Date(dateStr);
    } catch {
      return undefined;
    }
  }

  async searchJobs(_profile: any, query: string): Promise<JobInput[]> {
    try {
      console.log(`[Discovery] Querying WeWorkRemotely RSS for: ${query}`);

      const res = await fetch('https://weworkremotely.com/remote-jobs.rss', {
        headers: {
          'User-Agent': 'CarrierOS-JobDiscovery/1.0',
          'Accept': 'application/rss+xml, application/xml, text/xml',
        },
        signal: AbortSignal.timeout(10000),
      });
      if (!res.ok) throw new Error(`WeWorkRemotely RSS responded with ${res.status}`);

      const xml = await res.text();

      // Simple regex-based XML parser to avoid needing an xml2js dependency
      const itemRegex = /<item>([\s\S]*?)<\/item>/g;
      const items: string[] = [];
      let match: RegExpExecArray | null;
      while ((match = itemRegex.exec(xml)) !== null) {
        items.push(match[1]);
      }

      const extract = (block: string, tag: string): string => {
        const m = block.match(new RegExp(`<${tag}[^>]*><!\\[CDATA\\[([\\s\\S]*?)\\]\\]><\\/${tag}>`, 'i'))
          || block.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, 'i'));
        return m ? m[1].trim() : '';
      };

      const lowerQuery = query.toLowerCase();
      const queryTerms = lowerQuery.split(' ').filter(t => t.length > 2);

      const results: JobInput[] = [];

      for (const item of items) {
        const title = extract(item, 'title');
        const link = extract(item, 'link');
        const description = this.stripHtml(extract(item, 'description'));
        const pubDate = extract(item, 'pubDate');
        const region = extract(item, 'region');

        // Skip non-tech category items
        if (!title || !link) continue;

        // Filter by relevance
        const text = `${title} ${description}`.toLowerCase();
        if (!queryTerms.some(term => text.includes(term))) continue;

        // Parse company from title (WWR format: "Company Name: Job Title")
        const colonIdx = title.indexOf(':');
        const company = colonIdx > -1 ? title.substring(0, colonIdx).trim() : 'Unknown Company';
        const jobTitle = colonIdx > -1 ? title.substring(colonIdx + 1).trim() : title;

        results.push({
          title: jobTitle,
          company,
          description,
          url: link,
          applicationUrl: link,
          location: region || 'Worldwide',
          source: 'WeWorkRemotely',
          employmentType: 'Full-time',
          remoteStatus: 'Remote',
          postedDate: this.parseRssDate(pubDate),
        });

        if (results.length >= 15) break;
      }

      return results;
    } catch (err) {
      console.error('[WeWorkRemotely] Provider error:', err);
      return [];
    }
  }
}
