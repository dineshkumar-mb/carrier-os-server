import express from 'express';
import {
  generateApplication,
  generateInterviewPrep,
  getCareerHealthScore,
  getExecutionTraces,
  executeGoalPlan
} from '../controllers/aiController';
import {
  getDevRegistry,
  getDevTools,
  getDevExecutions,
  getDevMemory
} from '../controllers/devConsoleController';
import { validateBody } from '../middleware/validationMiddleware';
import { generateApplicationSchema, generatePrepKitSchema } from '../validation/schemas';
import { aiLimiter } from '../middleware/rateLimiter';

const router = express.Router();

router.route('/generate-application').post(aiLimiter, validateBody(generateApplicationSchema), generateApplication);
router.route('/generate-interview-prep').post(aiLimiter, validateBody(generatePrepKitSchema), generateInterviewPrep);

router.route('/health-score').get(getCareerHealthScore);
router.route('/traces').get(getExecutionTraces);
router.route('/plan-goal').post(executeGoalPlan);

// Dev Console Diagnostic Endpoints
router.route('/dev/registry').get(getDevRegistry);
router.route('/dev/tools').get(getDevTools);
router.route('/dev/executions').get(getDevExecutions);
router.route('/dev/memory').get(getDevMemory);

export default router;
