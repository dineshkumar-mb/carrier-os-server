import { Request, Response } from 'express';
import { PolicyEngine } from '../../core/runtime/PolicyEngine';

export const getPolicyConfig = (req: Request, res: Response) => {
  const engine = PolicyEngine.getInstance();
  const config = engine.getConfig('default-user');

  res.json({
    success: true,
    data: config
  });
};

export const updatePolicyConfig = (req: Request, res: Response) => {
  const engine = PolicyEngine.getInstance();
  const updated = engine.updateConfig('default-user', req.body);

  res.json({
    success: true,
    message: 'Policy configuration updated successfully',
    data: updated
  });
};
