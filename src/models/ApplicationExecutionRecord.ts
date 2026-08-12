import mongoose, { Schema, Document } from 'mongoose';

export interface IApplicationExecutionRecordDocument extends Document {
  executionId: string;
  applicationId: string;
  tenantId: string;
  userId: string;
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
  executedAt: Date;
}

const ApplicationExecutionRecordSchema = new Schema<IApplicationExecutionRecordDocument>(
  {
    executionId: { type: String, required: true, unique: true, index: true },
    applicationId: { type: String, required: true, index: true },
    tenantId: { type: String, required: true, index: true },
    userId: { type: String, required: true, index: true },
    canonicalJobId: { type: String, required: true, index: true },
    candidateJobMatchId: { type: String },
    resumeArtifactId: { type: String },
    coverLetterArtifactId: { type: String },
    browserExecutionPlanId: { type: String },
    policyDecision: { type: String, required: true },
    portal: { type: String, required: true },
    applicationUrl: { type: String, required: true },
    submissionResult: { type: String, enum: ['SUCCESS', 'FAILED', 'WAITING_FOR_APPROVAL'], required: true },
    confirmationEvidence: { type: String },
    screenshotPath: { type: String },
    executionTrace: [{ type: String }],
    executedAt: { type: Date, default: Date.now }
  },
  { timestamps: true }
);

ApplicationExecutionRecordSchema.index({ tenantId: 1, userId: 1, applicationId: 1 });

export const ApplicationExecutionRecord = mongoose.model<IApplicationExecutionRecordDocument>(
  'ApplicationExecutionRecord',
  ApplicationExecutionRecordSchema
);
