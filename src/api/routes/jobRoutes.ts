import express from 'express';
import { getJobs, getJobById, scanJobs, importJob, getSourceHealth } from '../controllers/jobController';
import { protect } from '../middleware/authMiddleware';

const router = express.Router();

router.route('/').get(protect, getJobs);
router.route('/scan').post(protect, scanJobs);
router.route('/import').post(protect, importJob);
router.route('/sources/health').get(protect, getSourceHealth);
router.route('/:id').get(getJobById);

export default router;
