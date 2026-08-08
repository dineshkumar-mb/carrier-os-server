import mongoose, { Schema, Document } from 'mongoose';
import { IJobMatch } from '../types';

export interface IJobMatchDocument extends IJobMatch, Document {}

const JobMatchSchema = new Schema<IJobMatchDocument>(
  {
    jobId: { type: Schema.Types.ObjectId, ref: 'Job', required: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    matchScore: { type: Number, required: true },
    matchReasons: [{ type: String }],
    missingSkills: [{ type: String }],
    recommendedSkills: [{ type: String }],
    decision: { type: String, enum: ['APPLY', 'SKIP', 'REVIEW', 'REJECT'], default: 'REVIEW' },
    decisionReason: { type: String },
    tailoredResumeId: { type: Schema.Types.ObjectId, ref: 'ResumeVersion' },
    tailoredCoverLetterId: { type: Schema.Types.ObjectId, ref: 'CoverLetter' },
    state: {
      type: String,
      enum: [
        'Discovered',
        'Matched',
        'Ranked',
        'Review',
        'Resume Generated',
        'Cover Letter Generated',
        'ATS Passed',
        'Queued',
        'Applying',
        'Applied',
        'Confirmation Received',
        'Interview',
        'Offer',
        'Rejected',
        'Archived'
      ],
      default: 'Discovered'
    },
    retryCount: { type: Number, default: 0 },
    confidenceScore: { type: Number },
    salaryFit: { type: String, enum: ['High', 'Medium', 'Low', 'Unknown'], default: 'Unknown' },
    locationFit: { type: String, enum: ['High', 'Medium', 'Low', 'Unknown'], default: 'Unknown' },
    experienceFit: { type: String, enum: ['High', 'Medium', 'Low', 'Unknown'], default: 'Unknown' },
    applicationPriority: { type: String, enum: ['HIGH', 'MEDIUM', 'LOW'], default: 'MEDIUM' },
    recruiterScore: { type: Number, default: 70 },
    hiringManagerScore: { type: Number, default: 70 },
    atsScore: { type: Number, default: 70 },
    salaryScore: { type: Number, default: 70 },
    interviewProbability: { type: Number, default: 50 },
    offerProbability: { type: Number, default: 25 },
    aiDebateOutcome: { type: Schema.Types.Mixed }
  },
  { timestamps: true }
);

JobMatchSchema.index({ userId: 1, jobId: 1 }, { unique: true });
JobMatchSchema.index({ userId: 1, state: 1 });

export const JobMatch = mongoose.model<IJobMatchDocument>('JobMatch', JobMatchSchema);
