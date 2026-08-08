import express from 'express';
import { getDashboardStats, getObservabilityStats } from '../controllers/dashboardController';

const router = express.Router();

router.route('/stats').get(getDashboardStats);
router.route('/observability').get(getObservabilityStats);

export default router;
