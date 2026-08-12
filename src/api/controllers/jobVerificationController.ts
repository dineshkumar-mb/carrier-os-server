import { Request, Response } from 'express';
import { JobVerificationService } from '../../services/jobVerification/JobVerificationService';
import { JobVerificationRepository } from '../../repositories/JobVerificationRepository';
import { GlobalJobVerification } from '../../models/GlobalJobVerification';
import { UserJobVerificationContext } from '../../models/UserJobVerificationContext';
import { Job } from '../../models/Job';

export const verifyJobHandler = async (req: Request, res: Response): Promise<void> => {
  try {
    const { jobId } = req.params;
    const tenantContext = (req as any).tenantContext || {
      userId: (req as any).user?._id?.toString() || 'default-user',
      tenantId: (req as any).user?.tenantId || 'default-tenant',
      roles: ['candidate'],
      privacyMode: 'STANDARD'
    };
    const executionId = `exec_verify_${Date.now()}`;

    const canonicalJob = await Job.findById(jobId);
    if (!canonicalJob) {
      res.status(404).json({ success: false, message: `Job ${jobId} not found.` });
      return;
    }

    const verificationService = JobVerificationService.getInstance();
    const result = await verificationService.verifyJob({
      tenantContext,
      executionId,
      canonicalJob: {
        id: canonicalJob._id.toString(),
        title: canonicalJob.title,
        company: canonicalJob.company,
        location: canonicalJob.location,
        description: canonicalJob.description,
        url: canonicalJob.url,
        applicationUrl: canonicalJob.applicationUrl,
        source: canonicalJob.source,
        postedDate: canonicalJob.postedDate,
        status: canonicalJob.status
      },
      forceRefresh: req.body?.forceRefresh || false
    });

    res.json({
      success: true,
      data: result
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message || 'Job verification failed' });
  }
};

export const getVerificationStatusHandler = async (req: Request, res: Response): Promise<void> => {
  try {
    const jobIdRaw = req.params.jobId;
    const jobId = Array.isArray(jobIdRaw) ? jobIdRaw[0] : jobIdRaw;
    const tenantContext = (req as any).tenantContext || {
      userId: (req as any).user?._id?.toString() || 'default-user',
      tenantId: (req as any).user?.tenantId || 'default-tenant',
      roles: ['candidate']
    };

    const repo = JobVerificationRepository.getInstance();
    const userCtx = await repo.getUserContext(tenantContext, jobId);

    if (!userCtx) {
      res.status(404).json({ success: false, message: `No verification context found for job ${jobId}.` });
      return;
    }

    res.json({
      success: true,
      data: userCtx
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const getVerificationDashboardHandler = async (_req: Request, res: Response): Promise<void> => {
  try {
    const highConfidence = await GlobalJobVerification.countDocuments({ verificationStatus: 'VERIFIED_HIGH_CONFIDENCE' });
    const probablyReal = await GlobalJobVerification.countDocuments({ verificationStatus: 'PROBABLY_REAL' });
    const needsReview = await GlobalJobVerification.countDocuments({ verificationStatus: 'NEEDS_REVIEW' });
    const suspicious = await GlobalJobVerification.countDocuments({ verificationStatus: 'SUSPICIOUS' });
    const expired = await GlobalJobVerification.countDocuments({ verificationStatus: 'EXPIRED' });
    const duplicates = await GlobalJobVerification.countDocuments({ verificationStatus: 'DUPLICATE' });
    const invalid = await GlobalJobVerification.countDocuments({ verificationStatus: 'INVALID' });

    res.json({
      success: true,
      metrics: {
        highConfidence,
        probablyReal,
        needsReview,
        suspicious,
        expired,
        duplicates,
        invalid,
        totalVerified: highConfidence + probablyReal + needsReview + suspicious + expired + duplicates + invalid
      }
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const getHumanReviewQueueHandler = async (req: Request, res: Response): Promise<void> => {
  try {
    const tenantContext = (req as any).tenantContext || {
      userId: (req as any).user?._id?.toString() || 'default-user',
      tenantId: (req as any).user?.tenantId || 'default-tenant',
      roles: ['candidate']
    };

    const repo = JobVerificationRepository.getInstance();
    const pending = await repo.getPendingApprovals(tenantContext);

    const formattedQueue = [];
    for (const item of pending) {
      const globalDoc = item.globalVerificationId as any;
      const canonicalJob = await Job.findById(item.canonicalJobId);
      formattedQueue.push({
        id: item._id,
        canonicalJobId: item.canonicalJobId,
        title: canonicalJob?.title || 'Job Listing',
        company: canonicalJob?.company || 'Company',
        location: canonicalJob?.location || 'Location',
        url: canonicalJob?.url || '',
        applicationUrl: canonicalJob?.applicationUrl || canonicalJob?.url || '',
        authenticityScore: globalDoc?.authenticityScore || 60,
        verificationStatus: globalDoc?.verificationStatus || 'NEEDS_REVIEW',
        evidence: globalDoc?.evidence || [],
        riskSignals: globalDoc?.riskSignals || [],
        reasons: globalDoc?.reasons || [],
        createdAt: item.createdAt
      });
    }

    res.json({
      success: true,
      data: formattedQueue
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const approveJobHandler = async (req: Request, res: Response): Promise<void> => {
  try {
    const { jobId } = req.params;
    const tenantContext = (req as any).tenantContext || {
      userId: (req as any).user?._id?.toString() || 'default-user',
      tenantId: (req as any).user?.tenantId || 'default-tenant'
    };

    const repo = JobVerificationRepository.getInstance();
    const updated = await UserJobVerificationContext.findOneAndUpdate(
      { canonicalJobId: jobId, userId: tenantContext.userId },
      {
        $set: {
          approvedByUser: true,
          approvedAt: new Date(),
          policyDecision: 'ALLOW_ASSISTED'
        }
      },
      { new: true }
    );

    res.json({
      success: true,
      message: `Job ${jobId} successfully approved by user. Recorded in audit trail.`,
      data: updated
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const rejectJobHandler = async (req: Request, res: Response): Promise<void> => {
  try {
    const { jobId } = req.params;
    const tenantContext = (req as any).tenantContext || {
      userId: (req as any).user?._id?.toString() || 'default-user',
      tenantId: (req as any).user?.tenantId || 'default-tenant'
    };

    const updated = await UserJobVerificationContext.findOneAndUpdate(
      { canonicalJobId: jobId, userId: tenantContext.userId },
      {
        $set: {
          approvedByUser: false,
          policyDecision: 'BLOCK'
        }
      },
      { new: true }
    );

    res.json({
      success: true,
      message: `Job ${jobId} rejected by user.`,
      data: updated
    });
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
};
