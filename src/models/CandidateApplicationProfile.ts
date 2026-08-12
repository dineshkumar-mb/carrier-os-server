import mongoose, { Schema, Document } from 'mongoose';

export interface ICandidateApplicationProfileDocument extends Document {
  userId: string;
  tenantId: string;

  fullName: string;
  email: string;
  phone?: string;
  location?: string;
  linkedInUrl?: string;
  gitHubUrl?: string;
  portfolioUrl?: string;

  workAuthorization: string; // e.g. "US Citizen", "Authorized to work", "Visa Needed"
  visaSponsorshipNeeded: boolean;
  noticePeriodDays: number;
  expectedSalaryMin?: number;
  expectedSalaryMax?: number;

  customAnswersMap: Record<string, string>; // e.g. "Years of React experience": "5"

  updatedAt: Date;
}

const CandidateApplicationProfileSchema = new Schema<ICandidateApplicationProfileDocument>(
  {
    userId: { type: String, required: true, unique: true, index: true },
    tenantId: { type: String, required: true, index: true },

    fullName: { type: String, required: true },
    email: { type: String, required: true },
    phone: { type: String },
    location: { type: String },
    linkedInUrl: { type: String },
    gitHubUrl: { type: String },
    portfolioUrl: { type: String },

    workAuthorization: { type: String, default: 'Authorized to work' },
    visaSponsorshipNeeded: { type: Boolean, default: false },
    noticePeriodDays: { type: Number, default: 0 },
    expectedSalaryMin: { type: Number },
    expectedSalaryMax: { type: Number },

    customAnswersMap: { type: Schema.Types.Mixed, default: {} }
  },
  { timestamps: true }
);

export const CandidateApplicationProfile = mongoose.model<ICandidateApplicationProfileDocument>(
  'CandidateApplicationProfile',
  CandidateApplicationProfileSchema
);
