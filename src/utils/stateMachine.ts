import { IJobMatchDocument } from '../models/JobMatch';
import { Application } from '../models/Application';

const VALID_TRANSITIONS: Record<string, string[]> = {
  Discovered: ['Matched', 'Ranked', 'Archived'],
  Matched: ['Ranked', 'Review', 'Resume Generated', 'Archived'],
  Ranked: ['Review', 'Queued', 'Archived'],
  Review: ['Queued', 'Archived', 'Rejected'],
  Queued: ['Resume Generated', 'Applying', 'Rejected', 'Archived'],
  'Resume Generated': ['Cover Letter Generated', 'ATS Passed', 'Applying', 'Rejected'],
  'Cover Letter Generated': ['ATS Passed', 'Applying', 'Review', 'Rejected'],
  'ATS Passed': ['Queued', 'Review', 'Applying', 'Rejected'],
  Applying: ['Applied', 'Confirmation Received', 'Rejected', 'Queued'],
  Applied: ['Confirmation Received', 'Interview', 'Rejected', 'Archived'],
  'Confirmation Received': ['Interview', 'Offer', 'Rejected', 'Archived'],
  Interview: ['Offer', 'Rejected', 'Archived'],
  Offer: ['Archived'],
  Rejected: ['Archived'],
  Archived: []
};

export const transitionState = async (
  match: IJobMatchDocument,
  newState: IJobMatchDocument['state'],
  note?: string
): Promise<IJobMatchDocument> => {
  const currentState = match.state || 'Discovered';
  
  const allowed = VALID_TRANSITIONS[currentState] || [];
  if (!allowed.includes(newState) && currentState !== newState) {
    console.warn(`[StateMachine] Warning: Transitioning from "${currentState}" to "${newState}" might be non-standard but proceeding for flexibility.`);
  }
  
  match.state = newState;
  await match.save();

  // Sync to legacy Application model if it exists
  const appStatusMap: Record<string, string> = {
    Queued: 'Pending',
    Applying: 'Auto-Applying',
    Applied: 'Applied',
    Interview: 'Interview',
    Rejected: 'Rejected'
  };

  const appStatus = appStatusMap[newState];
  if (appStatus) {
    const app = await Application.findOne({ jobId: match.jobId, userId: match.userId });
    if (app) {
      app.status = appStatus as any;
      app.timeline.push({
        status: appStatus,
        timestamp: new Date(),
        note: note || `State transitioned to ${newState}`
      });
      await app.save();
    }
  }

  return match;
};
