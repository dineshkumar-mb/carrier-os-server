import { Router } from 'express';
import { getAutonomousStatus, toggleAutonomousLoop, runAutonomousCycleNow } from '../controllers/autonomousController';

const router = Router();

router.get('/status', getAutonomousStatus);
router.post('/toggle', toggleAutonomousLoop);
router.post('/run-cycle', runAutonomousCycleNow);

export default router;
