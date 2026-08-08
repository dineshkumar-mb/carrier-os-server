import connectDB from './config/db';
import { startApplyWorker } from './workers/applyWorker';
import { startDiscoveryWorker } from './workers/discoveryWorker';
import { startSchedulerWorker } from './workers/schedulerWorker';

// Initialize the standalone worker process
const start = async () => {
  try {
    await connectDB();
    startApplyWorker();
    startDiscoveryWorker();
    startSchedulerWorker();
  } catch (error) {
    console.error('Failed to start worker process:', error);
    process.exit(1);
  }
};

start();
