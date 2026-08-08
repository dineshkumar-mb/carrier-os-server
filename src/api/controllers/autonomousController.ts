import { Request, Response } from 'express';
import { autonomousEngine } from '../../core/services/AutonomousEngineService';

export const getAutonomousStatus = (req: Request, res: Response) => {
  const status = autonomousEngine.getStatus();
  res.json({
    success: true,
    data: status
  });
};

export const toggleAutonomousLoop = (req: Request, res: Response) => {
  const { enable, intervalMs } = req.body;

  if (enable) {
    autonomousEngine.startAutonomousLoop(intervalMs || 30000);
  } else {
    autonomousEngine.stopAutonomousLoop();
  }

  res.json({
    success: true,
    message: enable ? 'Autonomous AI Engine started successfully' : 'Autonomous AI Engine paused',
    data: autonomousEngine.getStatus()
  });
};

export const runAutonomousCycleNow = async (req: Request, res: Response) => {
  try {
    const result = await autonomousEngine.runCycle();
    res.json({
      success: true,
      message: 'Autonomous cycle completed successfully',
      data: result
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
};
