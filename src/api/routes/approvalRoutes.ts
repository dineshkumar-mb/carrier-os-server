import { Router } from 'express';
import { getApprovalQueue, processApprovalAction } from '../controllers/approvalController';

const router = Router();

router.get('/queue', getApprovalQueue);
router.post('/:id/action', processApprovalAction);

export default router;
