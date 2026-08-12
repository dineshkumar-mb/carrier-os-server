import express from 'express';
import {
  verifyJobHandler,
  getVerificationStatusHandler,
  getVerificationDashboardHandler,
  getHumanReviewQueueHandler,
  approveJobHandler,
  rejectJobHandler
} from '../controllers/jobVerificationController';
import { protect } from '../middleware/authMiddleware';

const router = express.Router();

router.get('/dashboard', protect, getVerificationDashboardHandler);
router.get('/approval-center', protect, getHumanReviewQueueHandler);

router.post('/verify/:jobId', protect, verifyJobHandler);
router.get('/:jobId', protect, getVerificationStatusHandler);

router.post('/:jobId/approve', protect, approveJobHandler);
router.post('/:jobId/reject', protect, rejectJobHandler);

export default router;
