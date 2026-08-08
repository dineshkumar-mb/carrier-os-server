import express from 'express';
import { handleInboundEmail, getInboundEmails, scanInboxEmails } from '../controllers/inboxController';

const router = express.Router();

router.route('/')
  .get(getInboundEmails);

router.post('/scan', scanInboxEmails);
router.post('/webhook', handleInboundEmail);

export default router;
