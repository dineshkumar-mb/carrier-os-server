import { Request, Response } from 'express';
import { CareerAnalyticsService } from '../../services/intelligence/CareerAnalyticsService';
import { SkillGraphService } from '../../services/intelligence/SkillGraphService';
import { ABTestingService } from '../../services/intelligence/ABTestingService';
import { ExplainabilityService } from '../../services/intelligence/ExplainabilityService';

export const getCareerAnalytics = async (req: Request, res: Response) => {
  const analyticsService = CareerAnalyticsService.getInstance();
  const metrics = await analyticsService.getMetrics('default-user-id');

  res.json({
    success: true,
    data: metrics
  });
};

export const getSkillGraph = (req: Request, res: Response) => {
  const skillService = SkillGraphService.getInstance();
  const graph = skillService.getSkillGraph('default-user-id');

  res.json({
    success: true,
    data: graph
  });
};

export const getABTestPerformance = (req: Request, res: Response) => {
  const abService = ABTestingService.getInstance();
  const variants = abService.getVariants();

  res.json({
    success: true,
    data: variants
  });
};

export const getDecisionAuditLog = (req: Request, res: Response) => {
  const explainabilityService = ExplainabilityService.getInstance();
  const decisions = explainabilityService.getAllDecisions();

  res.json({
    success: true,
    data: decisions
  });
};
