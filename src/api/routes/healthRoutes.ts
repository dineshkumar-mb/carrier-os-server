import express, { Request, Response } from 'express';
import mongoose from 'mongoose';
import connection from '../../config/redis';
import { aiProviderRegistry } from '../../services/ai/AIProviderRegistry';
import { autonomousEngine } from '../../core/services/AutonomousEngineService';

const router = express.Router();

router.get('/live', (req: Request, res: Response) => {
  res.status(200).json({
    status: 'UP',
    timestamp: new Date(),
    uptimeSeconds: process.uptime()
  });
});

router.get('/ready', async (req: Request, res: Response) => {
  const isMongoConnected = mongoose.connection.readyState === 1;
  const isRedisConnected = connection.status === 'ready';
  const activeAiProvider = aiProviderRegistry.getActiveProvider();
  const autonomousStatus = autonomousEngine.getStatus();

  const healthDetails = {
    environment: process.env.NODE_ENV || 'development',
    database: isMongoConnected ? 'UP (MongoDB)' : 'FALLBACK (In-Memory)',
    redis: isRedisConnected ? 'UP (Redis)' : 'FALLBACK (In-Memory Queue)',
    aiProvider: `${activeAiProvider.name} (${activeAiProvider.id})`,
    autonomousEngine: autonomousStatus.isRunning ? 'RUNNING' : 'PAUSED',
    timestamp: new Date()
  };

  res.status(200).json({ status: 'READY', details: healthDetails });
});

router.get('/', (req: Request, res: Response) => {
  res.redirect('/health/ready');
});

export default router;
