import { Worker, Job } from 'bullmq';
import connection from '../config/redis';
import { SCHEDULER_QUEUE_NAME, schedulerQueue, jobDiscoveryQueue } from './queue';
import { runJobDiscovery } from '../services/jobDiscovery/discoveryEngine';
import { CareerOrchestrator } from '../services/ai/CareerOrchestrator';
import { emitLiveActivity } from '../config/socket';

export const startSchedulerWorker = () => {
  console.log(`[Worker] Starting Auto Scheduler Worker for queue: ${SCHEDULER_QUEUE_NAME}`);

  const worker = new Worker(
    SCHEDULER_QUEUE_NAME,
    async (job: Job) => {
      const { userId } = job.data;
      if (!userId) throw new Error('userId is required for scheduler');
      
      console.log(`[Scheduler] Starting autonomous cycle for user: ${userId}`);
      await emitLiveActivity(`[Scheduler] Autonomous scheduler cycle triggered...`);
      
      // 1. Discover Jobs
      const discoveredJobs = await runJobDiscovery(userId);
      console.log(`[Scheduler] Discovery returned ${discoveredJobs.length} new jobs.`);
      
      // 2. Rank, Decide, and Apply (orchestrated per job match)
      for (const newJob of discoveredJobs) {
        try {
          await CareerOrchestrator.processJobMatch(userId, newJob._id.toString());
        } catch (err) {
          console.error(`[Scheduler] Failed to process match for job ${newJob._id}:`, err);
        }
      }
      
      await emitLiveActivity(`[Scheduler] Autonomous scheduler cycle completed.`);
    },
    { connection: connection as any }
  );

  worker.on('failed', async (job, err) => {
    console.error(`[Worker] Scheduler job failed:`, err);
    try {
      const { QueueFailureLog } = require('../models/QueueFailureLog');
      await QueueFailureLog.create({
        queueName: 'scheduler',
        jobId: job?.id || 'unknown',
        jobData: job?.data,
        errorMessage: err.message,
        stackTrace: err.stack,
        failedAt: new Date()
      });
    } catch (dbErr) {
      console.error('[Worker] Failed to write failure log to DB:', dbErr);
    }
  });
};

export const scheduleAutoApplyCycle = async (userId: string, intervalMinutes: number) => {
  console.log(`[Scheduler] Scheduling repeatable auto apply cycle for user ${userId} every ${intervalMinutes} minutes.`);
  await schedulerQueue.add(
    `autonomous-cycle-${userId}`,
    { userId },
    {
      repeat: {
        every: intervalMinutes * 60 * 1000
      }
    }
  );
};

/**
 * Schedules automatic job discovery every intervalHours for a user.
 * Uses BullMQ repeatable jobs — safe to call multiple times (deduplicated by job name).
 */
export const scheduleDiscoveryCycle = async (userId: string, intervalHours = 1) => {
  const jobName = `auto-discovery-${userId}`;
  console.log(`[Scheduler] Scheduling discovery cycle for user ${userId} every ${intervalHours}h.`);
  await jobDiscoveryQueue.add(
    jobName,
    { userId },
    {
      repeat: {
        every: intervalHours * 60 * 60 * 1000
      },
      removeOnComplete: { age: 24 * 3600 },
      removeOnFail: { age: 7 * 24 * 3600 }
    }
  );
};

