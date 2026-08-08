import { Configuration } from '../../models/Configuration';
import { Application } from '../../models/Application';
import { Job } from '../../models/Job';
import { IJob, IJobMatch } from '../../types';

export interface DecisionResult {
  decision: 'APPLY' | 'SKIP' | 'REVIEW';
  reason: string;
}

export const evaluateDecision = async (
  userId: string,
  job: IJob,
  match: Partial<IJobMatch>
): Promise<DecisionResult> => {
  try {
    // 1. Check if user already applied to this company & title
    const matchingJobs = await Job.find({
      company: { $regex: new RegExp('^' + job.company.trim().replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&') + '$', 'i') },
      title: { $regex: new RegExp('^' + job.title.trim().replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&') + '$', 'i') }
    });
    const jobIds = matchingJobs.map(j => j._id);
    
    const alreadyApplied = await Application.findOne({
      userId,
      jobId: { $in: jobIds }
    });
    if (alreadyApplied) {
      return { decision: 'SKIP', reason: 'Already applied to this role at this company.' };
    }

    // Get user configuration
    let config = await Configuration.findOne({ userId });
    if (!config) {
      config = await Configuration.create({
        userId,
        autoApplyMode: 'Semi-Auto',
        matchThreshold: 80,
        remoteOnly: false
      });
    }

    // 2. Blacklist check
    const isBlacklisted = config.blacklistedCompanies.some(c =>
      c.trim().toLowerCase() === job.company.trim().toLowerCase()
    );
    if (isBlacklisted) {
      return { decision: 'SKIP', reason: `Company "${job.company}" is in user's blacklist.` };
    }

    // 3. Match Threshold check
    const threshold = config.matchThreshold || 80;
    const score = match.matchScore || 0;
    
    if (score < threshold) {
      return { decision: 'SKIP', reason: `Match score ${score}% is below threshold of ${threshold}%.` };
    }

    // 4. Remote Preference check
    if (config.remoteOnly) {
      const isRemote = job.location.toLowerCase().includes('remote') ||
                       job.title.toLowerCase().includes('remote') ||
                       job.description.toLowerCase().includes('remote');
      if (!isRemote) {
        return { decision: 'SKIP', reason: 'User preferred Remote Only, but job is onsite or hybrid.' };
      }
    }

    // 5. Default Apply/Review based on autoApplyMode
    if (config.autoApplyMode === 'Full-Auto') {
      return { decision: 'APPLY', reason: `Autonomous apply selected. Score is ${score}%.` };
    } else if (config.autoApplyMode === 'Semi-Auto') {
      return { decision: 'REVIEW', reason: `Review required (Semi-Auto Mode). Score is ${score}%.` };
    } else {
      return { decision: 'REVIEW', reason: `Manual mode selected. Score is ${score}%.` };
    }
  } catch (error) {
    console.error('Error in decisionEngine:', error);
    return { decision: 'REVIEW', reason: 'Error evaluating decision, defaulting to Review.' };
  }
};
