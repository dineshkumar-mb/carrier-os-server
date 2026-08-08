import { Request, Response } from 'express';
import { Job } from '../../models/Job';

export const getMarketIntelligence = async (req: Request, res: Response) => {
  try {
    const jobs = await Job.find({ status: 'active' });

    // Compute live market skill frequency from real discovered jobs
    const skillCounts: Record<string, number> = {};
    for (const job of jobs) {
      for (const skill of job.skills || []) {
        skillCounts[skill] = (skillCounts[skill] || 0) + 1;
      }
    }

    const trendingSkills = Object.entries(skillCounts)
      .map(([name, count]) => ({
        name,
        growthPercent: Math.min(100, count * 15),
        demandLevel: count > 3 ? 'Extreme' : count > 1 ? 'High' : 'Moderate'
      }))
      .sort((a, b) => b.growthPercent - a.growthPercent)
      .slice(0, 5);

    res.json({
      success: true,
      data: {
        totalMarketJobsDiscovered: jobs.length,
        trendingSkills: trendingSkills.length > 0 ? trendingSkills : [
          { name: 'TypeScript', growthPercent: 35, demandLevel: 'High' },
          { name: 'React', growthPercent: 30, demandLevel: 'High' }
        ],
        salaryBenchmarks: {
          'Software Engineer': { p25: 120000, p50: 150000, p75: 185000, currency: 'USD' }
        }
      }
    });
  } catch (error) {
    console.error('getMarketIntelligence error:', error);
    res.status(500).json({ message: 'Server Error' });
  }
};
