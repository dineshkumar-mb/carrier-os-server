import { Worker, Job } from 'bullmq';
import connection from '../config/redis';
import { DISCOVERY_QUEUE_NAME } from './queue';
import { runJobDiscovery } from '../services/jobDiscovery/discoveryEngine';

export const startDiscoveryWorker = () => {
  console.log(`[Worker] Starting Job Discovery Worker for queue: ${DISCOVERY_QUEUE_NAME}`);

  const worker = new Worker(
    DISCOVERY_QUEUE_NAME,
    async (job: Job) => {
      const { userId } = job.data;
      if (!userId) throw new Error('userId is required for discovery');
      
      const lockKey = `lock:discovery:${userId}`;
      const acquired = await connection.set(lockKey, 'locked', 'EX', 120, 'NX');
      if (acquired !== 'OK') {
        console.log(`[Worker] Discovery for user ${userId} is already running. Skipping duplicate task.`);
        return;
      }

      try {
        console.log(`[Worker] Running Job Discovery for User: ${userId}`);
        await runJobDiscovery(userId);
      } finally {
        await connection.del(lockKey);
      }
    },
    { connection: connection as any }
  );

  worker.on('failed', async (job, err) => {
    console.error(`[Worker] Job Discovery failed for job ${job?.id}:`, err);
    try {
      const { QueueFailureLog } = require('../models/QueueFailureLog');
      await QueueFailureLog.create({
        queueName: 'discovery',
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
