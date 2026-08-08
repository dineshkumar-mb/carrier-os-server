import { Router } from 'express';
import { getMarketIntelligence } from '../controllers/marketController';

const router = Router();

router.get('/intelligence', getMarketIntelligence);

export default router;
