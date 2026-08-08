import express, { Request, Response } from 'express';
import { applicationQueue, jobDiscoveryQueue, schedulerQueue } from '../../workers/queue';
import connection from '../../config/redis';

const router = express.Router();

router.get('/', async (req: Request, res: Response) => {
  try {
    const memory = process.memoryUsage();
    
    const appQueueCounts = await applicationQueue.getJobCounts();
    const discQueueCounts = await jobDiscoveryQueue.getJobCounts();
    const schedQueueCounts = await schedulerQueue.getJobCounts();

    const start = Date.now();
    await connection.ping();
    const redisLatency = Date.now() - start;

    res.status(200).json({
      timestamp: new Date(),
      process: {
        uptime: process.uptime(),
        memory: {
          rss: `${(memory.rss / 1024 / 1024).toFixed(2)} MB`,
          heapTotal: `${(memory.heapTotal / 1024 / 1024).toFixed(2)} MB`,
          heapUsed: `${(memory.heapUsed / 1024 / 1024).toFixed(2)} MB`,
          external: `${(memory.external / 1024 / 1024).toFixed(2)} MB`,
        }
      },
      redis: {
        latencyMs: redisLatency
      },
      queues: {
        applicationQueue: appQueueCounts,
        jobDiscoveryQueue: discQueueCounts,
        schedulerQueue: schedQueueCounts
      }
    });
  } catch (err) {
    console.error('Error compiling system metrics:', err);
    res.status(500).json({
      status: 'error',
      message: 'Failed to retrieve system metrics',
      error: (err as any).message
    });
  }
});

export default router;
