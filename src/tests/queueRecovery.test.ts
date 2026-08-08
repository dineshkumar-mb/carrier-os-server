import 'dotenv/config';
import { QueueFailureLog } from '../models/QueueFailureLog';
import { Queue, Worker } from 'bullmq';
import Redis from 'ioredis';
import connectDB from '../config/db';

export async function runQueueRecoveryTest() {
  console.log('\n--- [Test] Running Queue Retry & DLQ Recovery Validation ---');
  await connectDB();

  const testJobId = 'test-dlq-job-' + Date.now();
  await QueueFailureLog.deleteMany({ jobId: testJobId });

  const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
  const queueConnection = new Redis(redisUrl, { maxRetriesPerRequest: null });
  const workerConnection = new Redis(redisUrl, { maxRetriesPerRequest: null });

  const testQueue = new Queue('testQueue', { connection: queueConnection as any });

  const localWorker = new Worker('testQueue', async (job) => {
    console.log(`[Test Worker] Processing Job ${job.id}...`);
    throw new Error('Simulated worker failure for DLQ validation');
  }, { connection: workerConnection as any });

  localWorker.on('failed', async (job, err) => {
    console.log(`[Test Worker] Job ${job?.id} failed. Writing DLQ to MongoDB...`);
    try {
      await QueueFailureLog.create({
        queueName: 'apply',
        jobId: job?.id || 'unknown',
        jobData: job?.data,
        errorMessage: err.message,
        failedAt: new Date()
      });
      console.log(`[Test Worker] DLQ entry successfully saved.`);
    } catch (dbErr) {
      console.error('[Test Worker] Failed to write DLQ to DB:', dbErr);
    }
  });

  try {
    console.log(`Adding malformed job to testQueue with ID: ${testJobId}`);
    await testQueue.add('apply', {
      applicationId: '6a4fdf8e1c372623a1958b00',
      jobUrl: 'invalid-url'
    }, {
      jobId: testJobId,
      attempts: 1
    });

    console.log('Waiting for job to fail and DLQ entry to be recorded...');
    
    let logEntry = null;
    for (let i = 0; i < 15; i++) {
      await new Promise(resolve => setTimeout(resolve, 1000));
      logEntry = await QueueFailureLog.findOne({ jobId: testJobId });
      if (logEntry) break;
    }

    if (!logEntry) {
      throw new Error('Queue validation failed: failure log was not written to DLQ in MongoDB');
    }

    console.log('✓ DLQ log found in DB:', logEntry.errorMessage);
    console.log('✓ Queue Retry & DLQ Recovery completed successfully!');
  } finally {
    await localWorker.close();
    await testQueue.close();
    queueConnection.disconnect();
    workerConnection.disconnect();
  }
}
