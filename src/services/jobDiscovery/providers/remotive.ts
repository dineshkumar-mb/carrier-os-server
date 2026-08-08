import { JobProvider, JobInput } from '../types';

export class RemotiveProvider implements JobProvider {
  name = 'Remotive';

  async searchJobs(profile: any, query: string): Promise<JobInput[]> {
    try {
      console.log(`[Discovery] Querying Remotive API for search term: ${query}`);
      const res = await fetch(`https://remotive.com/api/remote-jobs?search=${encodeURIComponent(query)}&limit=15`);
      if (!res.ok) throw new Error(`Remotive API responded with status ${res.status}`);
      
      const data: any = await res.json();
      const jobs: any[] = data.jobs || [];
      
      return jobs.map((j: any) => ({
        title: j.title,
        company: j.company_name,
        description: j.description,
        url: j.url,
        location: j.candidate_required_location || 'Remote',
        salary: j.salary || undefined,
        source: 'Remotive',
        employmentType: j.job_type || 'Full-time',
        remoteStatus: 'Remote'
      }));
    } catch (err) {
      console.error('Error fetching from Remotive Provider:', err);
      return [];
    }
  }
}
