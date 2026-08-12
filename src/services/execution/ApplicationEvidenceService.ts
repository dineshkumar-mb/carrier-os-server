import mongoose from 'mongoose';
import { ApplicationExecutionRecord, IApplicationExecutionRecordDocument } from '../../models/ApplicationExecutionRecord';
import { TenantContext } from '../../core/tenant/TenantContext';

export interface CreateEvidenceParams {
  tenantContext: TenantContext;
  executionId: string;
  applicationId: string;
  canonicalJobId: string;
  candidateJobMatchId?: string;
  resumeArtifactId?: string;
  coverLetterArtifactId?: string;
  browserExecutionPlanId?: string;
  policyDecision: string;
  portal: string;
  applicationUrl: string;
  submissionResult: 'SUCCESS' | 'FAILED' | 'WAITING_FOR_APPROVAL';
  confirmationEvidence?: string;
  screenshotPath?: string;
  executionTrace: string[];
}

export class ApplicationEvidenceService {
  private static instance: ApplicationEvidenceService;

  private constructor() {}

  public static getInstance(): ApplicationEvidenceService {
    if (!ApplicationEvidenceService.instance) {
      ApplicationEvidenceService.instance = new ApplicationEvidenceService();
    }
    return ApplicationEvidenceService.instance;
  }

  public async recordEvidence(params: CreateEvidenceParams): Promise<IApplicationExecutionRecordDocument> {
    const { tenantContext, executionId, applicationId, canonicalJobId, candidateJobMatchId, resumeArtifactId, coverLetterArtifactId, browserExecutionPlanId, policyDecision, portal, applicationUrl, submissionResult, confirmationEvidence, screenshotPath, executionTrace } = params;

    const isConnected = mongoose.connection.readyState === 1;

    const data = {
      executionId,
      applicationId,
      tenantId: tenantContext.tenantId,
      userId: tenantContext.userId,
      canonicalJobId,
      candidateJobMatchId,
      resumeArtifactId,
      coverLetterArtifactId,
      browserExecutionPlanId,
      policyDecision,
      portal,
      applicationUrl,
      submissionResult,
      confirmationEvidence,
      screenshotPath,
      executionTrace,
      executedAt: new Date()
    };

    if (isConnected) {
      return await ApplicationExecutionRecord.findOneAndUpdate(
        { executionId },
        { $set: data },
        { upsert: true, new: true }
      );
    }

    return {
      _id: 'rec_mock_123',
      ...data
    } as any;
  }

  public async getEvidence(applicationId: string): Promise<IApplicationExecutionRecordDocument | null> {
    const isConnected = mongoose.connection.readyState === 1;
    if (!isConnected) return null;
    return await ApplicationExecutionRecord.findOne({ applicationId });
  }
}
