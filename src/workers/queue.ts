import { Queue } from 'bullmq';
import connection from '../config/redis';

export const APPLICATION_QUEUE_NAME = 'applicationQueue';
export const DISCOVERY_QUEUE_NAME = 'jobDiscoveryQueue';
export const SCHEDULER_QUEUE_NAME = 'schedulerQueue';

const defaultJobOptions = {
  attempts: 3,
  backoff: {
    type: 'exponential',
    delay: 5000
  },
  removeOnComplete: { age: 24 * 3600 },
  removeOnFail: { age: 7 * 24 * 3600 }
};

export const applicationQueue = new Queue(APPLICATION_QUEUE_NAME, {
  connection: connection as any,
  defaultJobOptions
});

export const jobDiscoveryQueue = new Queue(DISCOVERY_QUEUE_NAME, {
  connection: connection as any,
  defaultJobOptions
});

export const schedulerQueue = new Queue(SCHEDULER_QUEUE_NAME, {
  connection: connection as any,
  defaultJobOptions
});

// Suppress unhandled Redis connection errors when running in local dev without Redis
applicationQueue.on('error', () => {});
jobDiscoveryQueue.on('error', () => {});
schedulerQueue.on('error', () => {});
