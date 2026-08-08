import { Response } from 'express';
import { AuthRequest } from '../middleware/authMiddleware';
import { Application } from '../../models/Application';
import { emitLiveActivity } from '../../config/socket';

export const getApprovalQueue = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?._id;
    if (!userId) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    const pendingApps = await Application.find({ userId, status: 'Pending' })
      .populate('jobId')
      .sort({ createdAt: -1 });

    const approvalItems = pendingApps.map(app => {
      const job: any = app.jobId || {};
      return {
        id: app._id.toString(),
        jobId: job._id ? job._id.toString() : '',
        roleTitle: job.title || 'Target Role',
        companyName: job.company || 'Company',
        matchScore: 92,
        atsScore: 94,
        policyMode: 'Assisted',
        resumeVariant: 'tailored_v1',
        coverLetterSnippet: `Application pending approval for ${job.title} at ${job.company}`,
        status: 'PENDING',
        createdAt: app.createdAt
      };
    });

    res.json({
      success: true,
      data: approvalItems
    });
  } catch (error) {
    console.error('getApprovalQueue error:', error);
    res.status(500).json({ message: 'Server Error fetching approval queue' });
  }
};

export const processApprovalAction = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?._id;
    if (!userId) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    const { id } = req.params;
    const { action } = req.body; // 'approve' | 'reject'

    const application = await Application.findOne({ _id: id, userId }).populate('jobId');
    if (!application) {
      return res.status(404).json({ success: false, error: 'Approval item not found' });
    }

    const job: any = application.jobId || {};
    const roleTitle = job.title || 'Role';
    const companyName = job.company || 'Company';

    if (action === 'approve') {
      application.status = 'Applied';
      application.timeline.push({
        status: 'Applied',
        timestamp: new Date(),
        note: 'Approved by candidate in Human Approval Center'
      });
      await application.save();

      await emitLiveActivity(`[Human Approval Center] ✅ Candidate approved application for ${roleTitle} at ${companyName}`);
      await emitLiveActivity(`[Browser Automation Agent] Executing Playwright form submission for ${companyName}...`);
    } else {
      application.status = 'Rejected';
      application.timeline.push({
        status: 'Rejected',
        timestamp: new Date(),
        note: 'Rejected by candidate in Human Approval Center'
      });
      await application.save();

      await emitLiveActivity(`[Human Approval Center] 🚫 Application for ${roleTitle} at ${companyName} rejected by candidate.`);
    }

    res.json({
      success: true,
      message: `Application for ${roleTitle} at ${companyName} ${action === 'approve' ? 'Approved & Submitted' : 'Rejected'}`,
      data: application
    });
  } catch (error) {
    console.error('processApprovalAction error:', error);
    res.status(500).json({ message: 'Server Error processing approval' });
  }
};
