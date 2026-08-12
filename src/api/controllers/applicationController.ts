import { Response } from 'express';
import { Application } from '../../models/Application';
import { AuthRequest } from '../middleware/authMiddleware';
import { executionService } from '../../core/services/ExecutionService';

// @desc    Get user applications
// @route   GET /api/applications
// @access  Private
export const getApplications = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?._id;
    if (!userId) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    const applications = await Application.find({ userId }).populate('jobId').sort({ createdAt: -1 });
    res.json(applications);
  } catch (error) {
    console.error('getApplications error:', error);
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Create new application
// @route   POST /api/applications
// @access  Private
export const createApplication = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?._id;
    if (!userId) {
      return res.status(401).json({ message: 'Authentication required' });
    }
    const { jobId } = req.body;
    if (!jobId) {
      return res.status(400).json({ message: 'jobId is required' });
    }

    const userIdStr = typeof userId === 'string' ? userId : String(userId);
    const application = await Application.create({
      tenantId: (req.user as any)?.tenantId || 'default-tenant',
      userId: userIdStr,
      canonicalJobId: jobId,
      status: 'PREPARING',
      timeline: [{ status: 'PREPARING', timestamp: new Date() }],
    });

    res.status(201).json(application);
  } catch (error) {
    console.error('createApplication error:', error);
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Update application status
// @route   PATCH /api/applications/:id
// @access  Private
export const updateApplication = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?._id;
    if (!userId) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    const { status, note } = req.body;
    const { id } = req.params;

    const application = await Application.findOne({ _id: id, userId });
    if (!application) {
      return res.status(404).json({ message: 'Application not found' });
    }

    application.status = (status as any) || application.status;
    if (status || note) {
      application.timeline.push({
        status: (status as string) || application.status,
        timestamp: new Date(),
        note
      });
    }

    const updated = await application.save();
    res.json(updated);
  } catch (error) {
    console.error('updateApplication error:', error);
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Trigger auto apply for an application
// @route   POST /api/applications/:id/auto-apply
// @access  Private
export const triggerAutoApply = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?._id;
    if (!userId) {
      return res.status(401).json({ message: 'Authentication required' });
    }
    const { id } = req.params;

    const application = await Application.findOne({ _id: id, userId });
    if (!application) {
      return res.status(404).json({ message: 'Application not found' });
    }

    application.status = 'APPLYING';
    application.timeline.push({
      status: 'APPLYING',
      timestamp: new Date(),
      note: 'Form queued for Playwright automation'
    });
    await application.save();

    res.json({
      message: 'Application queued for auto-apply',
      application,
      executionId: `exec_${Date.now()}`
    });
  } catch (error) {
    console.error('Error in triggerAutoApply:', error);
    res.status(500).json({ message: 'Server Error' });
  }
};
