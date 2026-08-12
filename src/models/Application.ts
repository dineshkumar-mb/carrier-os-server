import mongoose, { Schema, Document } from 'mongoose';

export type ApplicationLifecycleState =
  | 'PREPARING'
  | 'RESUME_GENERATED'
  | 'ATS_PASSED'
  | 'COVER_LETTER_GENERATED'
  | 'QUEUED'
  | 'APPLYING'
  | 'APPLIED'
  | 'CONFIRMATION_RECEIVED'
  | 'RECRUITER_RESPONSE'
  | 'INTERVIEW'
  | 'OFFER'
  | 'REJECTED'
  | 'FAILED'
  | 'WAITING_FOR_APPROVAL';

export interface IApplicationTimelineEntry {
  status: string;
  timestamp: Date;
  executionId?: string;
  workflowVersion?: string;
  agentOrTool?: string;
  reason?: string;
  artifactId?: string;
  note?: string;
}

export interface IApplicationDocument extends Document {
  tenantId: string;
  userId: string;
  canonicalJobId: string;
  candidateJobMatchId?: mongoose.Types.ObjectId;
  resumeVersionId?: mongoose.Types.ObjectId;
  coverLetterId?: mongoose.Types.ObjectId;
  browserExecutionPlanId?: string;
  policyMode: 'MANUAL' | 'ASSISTED' | 'AUTOMATIC';
  status: ApplicationLifecycleState;
  timeline: IApplicationTimelineEntry[];
  submittedAt?: Date;
  confirmationAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const ApplicationSchema = new Schema<IApplicationDocument>(
  {
    tenantId: { type: String, required: true, index: true },
    userId: { type: String, required: true, index: true },
    canonicalJobId: { type: String, required: true, index: true },
    candidateJobMatchId: { type: Schema.Types.ObjectId, ref: 'CandidateJobMatch' },
    resumeVersionId: { type: Schema.Types.ObjectId, ref: 'ResumeVersion' },
    coverLetterId: { type: Schema.Types.ObjectId, ref: 'CoverLetter' },
    browserExecutionPlanId: { type: String },
    policyMode: { type: String, enum: ['MANUAL', 'ASSISTED', 'AUTOMATIC'], default: 'ASSISTED' },
    status: {
      type: String,
      enum: [
        'PREPARING',
        'RESUME_GENERATED',
        'ATS_PASSED',
        'COVER_LETTER_GENERATED',
        'QUEUED',
        'APPLYING',
        'APPLIED',
        'CONFIRMATION_RECEIVED',
        'RECRUITER_RESPONSE',
        'INTERVIEW',
        'OFFER',
        'REJECTED',
        'FAILED',
        'WAITING_FOR_APPROVAL'
      ],
      default: 'PREPARING'
    },
    timeline: [
      {
        status: { type: String, required: true },
        timestamp: { type: Date, default: Date.now },
        executionId: { type: String },
        workflowVersion: { type: String },
        agentOrTool: { type: String },
        reason: { type: String },
        artifactId: { type: String },
        note: { type: String }
      }
    ],
    submittedAt: { type: Date },
    confirmationAt: { type: Date }
  },
  { timestamps: true }
);

ApplicationSchema.index({ userId: 1, status: 1 });
ApplicationSchema.index({ tenantId: 1, userId: 1, canonicalJobId: 1 });

export const Application = mongoose.model<IApplicationDocument>('Application', ApplicationSchema);
