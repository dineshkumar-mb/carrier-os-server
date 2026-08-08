import { JobProvider, JobInput } from '../types';

export class HimalayasProvider implements JobProvider {
  name = 'Himalayas';

  async searchJobs(profile: any, query: string): Promise<JobInput[]> {
    try {
      console.log(`[Discovery] Querying Himalayas API for search term: ${query}`);
      const res = await fetch(`https://himalayas.app/jobs/api?search=${encodeURIComponent(query)}`);
      if (!res.ok) throw new Error(`Himalayas API responded with status ${res.status}`);
      
      const data: any = await res.json();
      const jobs: any[] = data.jobs || [];
      
      return jobs.slice(0, 15).map((j: any) => ({
        title: j.title,
        company: j.companyName || 'Unknown Company',
        description: j.description || '',
        url: j.applicationLink || j.url || '',
        location: j.location || 'Remote',
        salary: j.salary || undefined,
        source: 'Himalayas',
        employmentType: j.employmentType || 'Full-time',
        remoteStatus: 'Remote'
      }));
    } catch (err) {
      console.error('Error fetching from Himalayas Provider:', err);
      return [];
    }
  }
}
