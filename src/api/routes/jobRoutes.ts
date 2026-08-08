import express from 'express';
import { getJobs, getJobById, scanJobs } from '../controllers/jobController';

const router = express.Router();

router.route('/').get(getJobs);
router.route('/scan').post(scanJobs);
router.route('/:id').get(getJobById);

export default router;
