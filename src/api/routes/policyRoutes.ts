import { Router } from 'express';
import { getPolicyConfig, updatePolicyConfig } from '../controllers/policyController';

const router = Router();

router.get('/config', getPolicyConfig);
router.put('/config', updatePolicyConfig);

export default router;
