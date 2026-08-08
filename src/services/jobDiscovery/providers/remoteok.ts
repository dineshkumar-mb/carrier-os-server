import { JobProvider, JobInput } from '../types';

export class RemoteOKProvider implements JobProvider {
  name = 'RemoteOK';

  async searchJobs(profile: any, query: string): Promise<JobInput[]> {
    try {
      console.log(`[Discovery] Querying RemoteOK API for search term: ${query}`);
      const res = await fetch(`https://remoteok.com/api?tag=${encodeURIComponent(query)}`, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        }
      });
      if (!res.ok) throw new Error(`RemoteOK API responded with status ${res.status}`);
      
      const data: any = await res.json();
      if (!Array.isArray(data)) return [];
      
      const jobs = data.filter((item: any) => item.legal === undefined && item.position);
      
      return jobs.slice(0, 15).map((j: any) => ({
        title: j.position,
        company: j.company,
        description: j.description || '',
        url: j.url,
        location: j.location || 'Remote',
        salary: Array.isArray(j.salary) ? j.salary.join(' ') : j.salary || undefined,
        source: 'RemoteOK',
        employmentType: 'Full-time',
        remoteStatus: 'Remote'
      }));
    } catch (err) {
      console.error('Error fetching from RemoteOK Provider:', err);
      return [];
    }
  }
}
