import mongoose, { Schema, Document } from 'mongoose';
import { RiskSignal } from '../services/jobVerification/JobVerificationTypes';

export interface IUserJobVerificationContextDocument extends Document {
  tenantId: string;
  userId: string;
  executionId: string;
  canonicalJobId: string;
  globalVerificationId: mongoose.Types.ObjectId;
  userSpecificRiskSignals: RiskSignal[];
  policyDecision: 'ALLOW_AUTOMATIC' | 'ALLOW_ASSISTED' | 'NEEDS_HUMAN_REVIEW' | 'BLOCK';
  approvedByUser?: boolean;
  approvedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const RiskSignalSchema = new Schema<RiskSignal>({
  code: { type: String, required: true },
  severity: { type: String, enum: ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'], required: true },
  description: { type: String, required: true },
  penalty: { type: Number, required: true }
}, { _id: false });

const UserJobVerificationContextSchema = new Schema<IUserJobVerificationContextDocument>(
  {
    tenantId: { type: String, required: true, index: true },
    userId: { type: String, required: true, index: true },
    executionId: { type: String, required: true, index: true },
    canonicalJobId: { type: String, required: true, index: true },
    globalVerificationId: { type: Schema.Types.ObjectId, ref: 'GlobalJobVerification', required: true },
    userSpecificRiskSignals: [RiskSignalSchema],
    policyDecision: {
      type: String,
      enum: ['ALLOW_AUTOMATIC', 'ALLOW_ASSISTED', 'NEEDS_HUMAN_REVIEW', 'BLOCK'],
      default: 'NEEDS_HUMAN_REVIEW'
    },
    approvedByUser: { type: Boolean, default: false },
    approvedAt: { type: Date }
  },
  { timestamps: true }
);

UserJobVerificationContextSchema.index({ tenantId: 1, userId: 1, canonicalJobId: 1 }, { unique: true });
UserJobVerificationContextSchema.index({ userId: 1, policyDecision: 1 });

export const UserJobVerificationContext = mongoose.model<IUserJobVerificationContextDocument>(
  'UserJobVerificationContext',
  UserJobVerificationContextSchema
);
