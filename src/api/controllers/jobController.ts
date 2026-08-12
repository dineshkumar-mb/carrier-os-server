import { Response } from 'express';
import { Job } from '../../models/Job';
import { JobMatch } from '../../models/JobMatch';
import { AuthRequest } from '../middleware/authMiddleware';
import { runJobDiscovery } from '../../services/jobDiscovery/discoveryEngine';
import { scheduleDiscoveryCycle } from '../../workers/schedulerWorker';
import { ensurePortalJobsExist } from '../../services/jobDiscovery/defaultPortalJobs';

const enrichJobsWithMatches = (jobs: any[], matches: any[]) => {
  const matchMap = new Map(matches.map(m => [m.jobId.toString(), m]));
  return jobs.map(job => {
    const match = matchMap.get(job._id ? job._id.toString() : '');
    return {
      ...(job.toObject ? job.toObject() : job),
      matchScore: match?.matchScore ?? 0,
      matchReasons: match?.matchReasons ?? [],
      missingSkills: match?.missingSkills ?? [],
      recommendedSkills: match?.recommendedSkills ?? [],
      confidenceScore: match?.confidenceScore ?? 0,
      salaryFit: match?.salaryFit ?? 'Evaluating',
      locationFit: match?.locationFit ?? 'Evaluating',
      experienceFit: match?.experienceFit ?? 'Evaluating',
      applicationPriority: match?.applicationPriority ?? 'MEDIUM',
      matchState: match?.state ?? 'Discovered',
      decision: match?.decision ?? 'PENDING',
      interviewProbability: match?.interviewProbability ?? '0%',
      offerProbability: match?.offerProbability ?? '0%',
    };
  });
};

// @desc    Get all active jobs enriched with AI match scores for current user
// @route   GET /api/jobs
// @access  Private
export const getJobs = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?._id;
    if (!userId) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    await ensurePortalJobsExist(userId.toString());

    const jobs = await Job.find({ status: 'active' }).sort({ createdAt: -1 });
    const matches = await JobMatch.find({ userId });

    res.json(enrichJobsWithMatches(jobs, matches));
  } catch (error) {
    console.error('getJobs error:', error);
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Get single job
// @route   GET /api/jobs/:id
// @access  Public
export const getJobById = async (req: AuthRequest, res: Response) => {
  try {
    const job = await Job.findById(req.params.id);
    if (job) {
      res.json(job);
    } else {
      res.status(404).json({ message: 'Job not found' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
};

import { UserJobImportService } from '../../services/jobDiscovery/import/UserJobImportService';
import { jobSourceRegistry } from '../../services/jobDiscovery/JobSourceRegistry';

// @desc    Scan and discover matching jobs via AI Resume-Aware discovery engine
// @route   POST /api/jobs/scan
// @access  Private
export const scanJobs = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?._id;
    if (!userId) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    console.log(`[JobDiscovery] Triggering live Discovery Engine for user: ${userId}`);
    await runJobDiscovery(userId.toString());

    scheduleDiscoveryCycle(userId.toString(), 1).catch(err =>
      console.warn('[Scheduler] Discovery schedule notice:', err.message)
    );

    const jobs = await Job.find({ status: 'active' }).sort({ createdAt: -1 });
    const matches = await JobMatch.find({ userId });

    res.json(enrichJobsWithMatches(jobs, matches));
  } catch (error) {
    console.error('scanJobs error:', error);
    res.status(500).json({ message: 'Server Error scanning for jobs' });
  }
};

// @desc    Import user job via URL or pasted JD text (for restricted portals)
// @route   POST /api/jobs/import
// @access  Private
export const importJob = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?._id;
    if (!userId) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    const result = await UserJobImportService.importUserJob({
      userId: userId.toString(),
      jobUrl: req.body.jobUrl,
      jobTitle: req.body.jobTitle,
      companyName: req.body.companyName,
      jobDescription: req.body.jobDescription,
      sourcePlatform: req.body.sourcePlatform
    });

    res.status(201).json(result);
  } catch (error) {
    console.error('importJob error:', error);
    res.status(500).json({ message: 'Server error importing job' });
  }
};

// @desc    Get plugin source health status and restricted source indicators
// @route   GET /api/jobs/sources/health
// @access  Private
export const getSourceHealth = async (req: AuthRequest, res: Response) => {
  try {
    const pluginSources = jobSourceRegistry.getAllSources();
    const healthResults = await Promise.all(
      pluginSources.map(async (src: any) => {
        const h = await src.healthCheck();
        return {
          id: src.id,
          name: src.name,
          status: h.healthy ? 'HEALTHY' : 'DEGRADED',
          statusText: h.statusText || (h.healthy ? '🟢 Operational' : 'Degraded'),
          capabilities: src.capabilities,
          latencyMs: h.latencyMs
        };
      })
    );

    const restrictedSources = [
      { id: 'naukri', name: 'Naukri', status: 'AUTH_REQUIRED', statusText: '⚪ Authorized integration unavailable' },
      { id: 'apna', name: 'Apna', status: 'AUTH_REQUIRED', statusText: '⚪ Authorized integration unavailable' },
      { id: 'internshala', name: 'Internshala', status: 'AUTH_REQUIRED', statusText: '⚪ Authorized integration unavailable' }
    ];

    res.json({
      sources: [...healthResults, ...restrictedSources]
    });
  } catch (error) {
    console.error('getSourceHealth error:', error);
    res.status(500).json({ message: 'Server error checking source health' });
  }
};
