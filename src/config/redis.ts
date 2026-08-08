import Redis from 'ioredis';
import dotenv from 'dotenv';

dotenv.config();

const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';

const connection = new Redis(REDIS_URL, {
  maxRetriesPerRequest: null,
  retryStrategy(times) {
    if (times > 3) return null; // Stop retrying if Redis is not running locally
    return Math.min(times * 500, 2000);
  },
  lazyConnect: true
});

connection.connect().catch((err) => {
  console.warn('[Redis] Connection notice: Redis not available locally. In-memory queues active.');
});

connection.on('error', () => {
  // Silent catch after max retries
});

export default connection;
