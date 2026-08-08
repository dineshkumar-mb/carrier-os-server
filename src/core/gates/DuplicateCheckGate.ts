import { GateResult } from '../infrastructure/PolicyEngine';
import { Application } from '../../models/Application';

export class DuplicateCheckGate {
  private static inMemoryApps = new Set<string>();

  public static async evaluate(userId: string, jobId: string, jobUrl?: string): Promise<GateResult> {
    console.log(`[DuplicateCheckGate] 🛡️ Checking for duplicate application for user ${userId} / job ${jobId}`);

    const key = `${userId}:${jobId}`;
    if (this.inMemoryApps.has(key)) {
      return {
        gateId: 'gate_duplicate_check',
        passed: false,
        reason: `Duplicate detected. Application for job "${jobId}" already processed for user.`,
        recommendation: 'Skip auto-submission to avoid spamming target employer.',
        retry: false
      };
    }

    try {
      const existingApp = await Application.findOne({
        userId,
        $or: [{ jobId }, { 'timeline.note': { $regex: jobUrl || 'xyz_none', $options: 'i' } }]
      });

      if (existingApp && (existingApp.status === 'Applied' || existingApp.status === 'Auto-Applying' || existingApp.status === 'Interview')) {
        this.inMemoryApps.add(key);
        return {
          gateId: 'gate_duplicate_check',
          passed: false,
          reason: `Duplicate detected. Application ${existingApp._id} already exists in status "${existingApp.status}".`,
          recommendation: 'Skip auto-submission to avoid spamming target employer.',
          retry: false
        };
      }
    } catch (err: any) {
      // In-memory fallback
    }

    this.inMemoryApps.add(key);
    return {
      gateId: 'gate_duplicate_check',
      passed: true,
      reason: 'No existing duplicate applications found.',
      retry: false
    };
  }
}
