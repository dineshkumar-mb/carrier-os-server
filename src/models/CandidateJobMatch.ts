import mongoose, { Schema, Document } from 'mongoose';

export interface ICandidateJobMatchDocument extends Document {
  userId: string;
  tenantId: string;
  canonicalJobId: string;

  overallMatch: number; // 0 - 100
  skillMatch: number;
  experienceMatch: number;
  roleMatch: number;
  locationMatch: number;
  salaryMatch: number;
  projectMatch: number;

  missingSkills: string[];
  strengths: string[];
  concerns: string[];

  interviewProbability: number; // 0 - 1
  offerProbability: number; // 0 - 1

  evaluatedAt: Date;
}

const CandidateJobMatchSchema = new Schema<ICandidateJobMatchDocument>(
  {
    userId: { type: String, required: true, index: true },
    tenantId: { type: String, required: true, index: true },
    canonicalJobId: { type: String, required: true, index: true },

    overallMatch: { type: Number, required: true, min: 0, max: 100 },
    skillMatch: { type: Number, default: 0 },
    experienceMatch: { type: Number, default: 0 },
    roleMatch: { type: Number, default: 0 },
    locationMatch: { type: Number, default: 0 },
    salaryMatch: { type: Number, default: 0 },
    projectMatch: { type: Number, default: 0 },

    missingSkills: [{ type: String }],
    strengths: [{ type: String }],
    concerns: [{ type: String }],

    interviewProbability: { type: Number, default: 0.5 },
    offerProbability: { type: Number, default: 0.25 },

    evaluatedAt: { type: Date, default: Date.now }
  },
  { timestamps: true }
);

CandidateJobMatchSchema.index({ userId: 1, canonicalJobId: 1 }, { unique: true });

export const CandidateJobMatch = mongoose.model<ICandidateJobMatchDocument>(
  'CandidateJobMatch',
  CandidateJobMatchSchema
);
