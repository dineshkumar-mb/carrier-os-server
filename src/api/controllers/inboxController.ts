import { Response } from 'express';
import { AuthRequest } from '../middleware/authMiddleware';
import { InboundEmail } from '../../models/InboundEmail';
import { Application } from '../../models/Application';
import { EmailTool } from '../../core/tools/plugins/EmailTool';
import { EmailIntelligenceAgent } from '../../core/agents/plugins/EmailIntelligenceAgent';
import { emitLiveActivity } from '../../config/socket';

export const getInboundEmails = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?._id;
    if (!userId) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    const emails = await InboundEmail.find({ userId }).sort({ receivedAt: -1 });
    res.json(emails);
  } catch (error) {
    console.error('getInboundEmails error:', error);
    res.status(500).json({ message: 'Server Error fetching emails' });
  }
};

export const scanInboxEmails = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?._id;
    if (!userId) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    await emitLiveActivity('[Inbox Agent] Opening secure connection to candidate email box...');
    const emailTool = new EmailTool();
    const inboxResult = await emailTool.execute({ action: 'read_inbox' });

    if (!inboxResult.success || !inboxResult.output?.messages?.length) {
      return res.json({ success: true, message: 'No new recruiter emails found.', processed: [] });
    }

    const newMsgs = inboxResult.output.messages;
    const processed = [];
    const agent = new EmailIntelligenceAgent();

    for (const msg of newMsgs) {
      await emitLiveActivity(`[Email Intelligence Agent] Reading email: "${msg.subject}"`);
      
      const analysis = await agent.execute({
        userId: userId.toString(),
        company: msg.from || 'Recruiter',
        customParams: { emailBody: msg.snippet, senderEmail: msg.from }
      });

      const classification = analysis.data?.category === 'INTERVIEW_INVITATION' ? 'Interview' : 'Follow-up';

      const emailRecord = await InboundEmail.create({
        userId,
        sender: msg.from,
        subject: msg.subject,
        body: msg.snippet,
        receivedAt: new Date(),
        classification
      });

      try {
        const userIdStr = typeof userId === 'string' ? userId : String(userId);
        const application = await Application.findOne({ userId: userIdStr });
        if (application) {
          application.status = classification === 'Interview' ? 'INTERVIEW' : 'CONFIRMATION_RECEIVED';
          application.timeline.push({
            status: application.status,
            timestamp: new Date(),
            note: `Auto-updated: ${msg.subject} received from ${msg.from}`
          });
          await application.save();
        }
      } catch (dbErr) {
        console.warn('[Inbox] Application status correlation warning:', dbErr);
      }

      processed.push(emailRecord);
    }

    await emitLiveActivity(`[Inbox Agent] Email scan complete. Processed ${processed.length} new communication logs.`);

    res.json({
      success: true,
      message: `Inbox scanned successfully. Imported ${processed.length} recruiter message(s).`,
      processed
    });
  } catch (error) {
    console.error('scanInboxEmails error:', error);
    res.status(500).json({ message: 'Server Error scanning inbox' });
  }
};

export const handleInboundEmail = async (req: AuthRequest, res: Response) => {
  res.json({ success: true, message: 'Webhook event processed' });
};
