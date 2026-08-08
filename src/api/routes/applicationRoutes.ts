import express from 'express';
import { getApplications, createApplication, updateApplication, triggerAutoApply } from '../controllers/applicationController';

const router = express.Router();

router.route('/')
  .get(getApplications)
  .post(createApplication);

router.route('/:id')
  .patch(updateApplication);

router.route('/:id/auto-apply')
  .post(triggerAutoApply);

export default router;
