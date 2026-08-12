import mongoose, { Schema, Document } from 'mongoose';
import { VerificationStatus, VerificationState, FreshnessStatus, EvidenceItem, RiskSignal } from '../services/jobVerification/JobVerificationTypes';

export interface IGlobalJobVerificationDocument extends Document {
  canonicalJobId: string;
  fingerprint: string;
  verificationStatus: VerificationStatus;
  verificationState: VerificationState;
  authenticityScore: number;
  confidence: number;
  companyVerified: boolean;
  officialCareerPageFound: boolean;
  officialDomainVerified: boolean;
  requisitionVerified: boolean;
  urlVerified: boolean;
  crossSourceConfirmed: boolean;
  freshnessStatus: FreshnessStatus;
  evidence: EvidenceItem[];
  riskSignals: RiskSignal[];
  reasons: string[];
  contentHash: string;
  previousContentHash?: string;
  contentChanged?: boolean;
  verifiedAt: Date;
  verificationExpiresAt: Date;
  verifierVersion: string;
}

const EvidenceItemSchema = new Schema<EvidenceItem>({
  id: { type: String, required: true },
  type: { type: String, required: true },
  strength: { type: String, enum: ['STRONG', 'MEDIUM', 'WEAK'], required: true },
  provenance: { type: String, enum: ['OFFICIAL', 'SOURCE', 'INDEPENDENT', 'USER_PROVIDED', 'DERIVED'], required: true },
  sourceUrl: { type: String },
  sourceProvider: { type: String },
  observedAt: { type: Date, default: Date.now },
  contentHash: { type: String },
  details: { type: String }
}, { _id: false });

const RiskSignalSchema = new Schema<RiskSignal>({
  code: { type: String, required: true },
  severity: { type: String, enum: ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'], required: true },
  description: { type: String, required: true },
  penalty: { type: Number, required: true }
}, { _id: false });

const GlobalJobVerificationSchema = new Schema<IGlobalJobVerificationDocument>(
  {
    canonicalJobId: { type: String, required: true, index: true },
    fingerprint: { type: String, required: true, unique: true, index: true },
    verificationStatus: {
      type: String,
      enum: ['VERIFIED_HIGH_CONFIDENCE', 'PROBABLY_REAL', 'NEEDS_REVIEW', 'SUSPICIOUS', 'EXPIRED', 'DUPLICATE', 'INVALID'],
      required: true
    },
    verificationState: {
      type: String,
      enum: ['PENDING', 'VALIDATING', 'URL_VERIFIED', 'COMPANY_VERIFIED', 'FRESHNESS_VERIFIED', 'CROSS_SOURCE_VERIFIED', 'RISK_ANALYZED', 'AI_REVIEWED', 'GATE_EVALUATED', 'COMPLETED', 'REFRESH_REQUIRED', 'FAILED'],
      default: 'PENDING'
    },
    authenticityScore: { type: Number, required: true, min: 0, max: 100 },
    confidence: { type: Number, required: true, min: 0, max: 1 },
    companyVerified: { type: Boolean, default: false },
    officialCareerPageFound: { type: Boolean, default: false },
    officialDomainVerified: { type: Boolean, default: false },
    requisitionVerified: { type: Boolean, default: false },
    urlVerified: { type: Boolean, default: false },
    crossSourceConfirmed: { type: Boolean, default: false },
    freshnessStatus: {
      type: String,
      enum: ['ACTIVE', 'STALE', 'EXPIRED', 'CLOSED', 'UNKNOWN'],
      default: 'UNKNOWN'
    },
    evidence: [EvidenceItemSchema],
    riskSignals: [RiskSignalSchema],
    reasons: [{ type: String }],
    contentHash: { type: String, required: true },
    previousContentHash: { type: String },
    contentChanged: { type: Boolean, default: false },
    verifiedAt: { type: Date, required: true },
    verificationExpiresAt: { type: Date, required: true },
    verifierVersion: { type: String, default: '1.0.0' }
  },
  { timestamps: true }
);

GlobalJobVerificationSchema.index({ canonicalJobId: 1, verifiedAt: -1 });
GlobalJobVerificationSchema.index({ verificationExpiresAt: 1 });

export const GlobalJobVerification = mongoose.model<IGlobalJobVerificationDocument>(
  'GlobalJobVerification',
  GlobalJobVerificationSchema
);
