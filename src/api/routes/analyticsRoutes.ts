import { Router } from 'express';
import {
  getCareerAnalytics,
  getSkillGraph,
  getABTestPerformance,
  getDecisionAuditLog
} from '../controllers/analyticsController';

const router = Router();

router.get('/metrics', getCareerAnalytics);
router.get('/skill-graph', getSkillGraph);
router.get('/ab-testing', getABTestPerformance);
router.get('/audit-log', getDecisionAuditLog);

export default router;
