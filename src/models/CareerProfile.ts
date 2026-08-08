import mongoose, { Schema, Document } from 'mongoose';

export interface ICareerProfileDocument extends Document {
  userId: string;
  targetRoles: string[];
  primaryRole?: string;
  seniority?: string;
  targetLocations: string[];
  remotePreference: 'Remote' | 'Hybrid' | 'Onsite' | 'Any';
  minSalary?: number;
  preferredSalary?: number;
  salaryCurrency: string;
  experienceLevel: 'Entry' | 'Mid' | 'Senior' | 'Lead' | 'Executive';
  skills?: string[];
  experience?: any[];
  preferredTech: string[];
  preferredTechStack?: string[];
  excludedTech: string[];
  preferredCompanies: string[];
  excludedCompanies: string[];
  noticePeriodDays?: number;
  visaSponsorshipRequired: boolean;
  employmentTypes: ('Full-time' | 'Contract' | 'Part-time' | 'Freelance')[];
  automationPolicy: 'MANUAL' | 'ASSISTED' | 'AUTOMATIC';
  atsScoreFloor: number;
  dailyAiBudgetUsd: number;
  maxApplicationsPerDay: number;
  memoryContext?: string | Record<string, any>;
  updatedAt: Date;
}

const CareerProfileSchema = new Schema<ICareerProfileDocument>(
  {
    userId: { type: String, required: true, unique: true, index: true },
    targetRoles: [{ type: String, required: true }],
    primaryRole: { type: String },
    seniority: { type: String },
    targetLocations: [{ type: String, default: [] }],
    remotePreference: { type: String, enum: ['Remote', 'Hybrid', 'Onsite', 'Any'], default: 'Remote' },
    minSalary: { type: Number },
    preferredSalary: { type: Number },
    salaryCurrency: { type: String, default: 'USD' },
    experienceLevel: { type: String, enum: ['Entry', 'Mid', 'Senior', 'Lead', 'Executive'], default: 'Senior' },
    skills: [{ type: String, default: [] }],
    experience: [{ type: Schema.Types.Mixed, default: [] }],
    preferredTech: [{ type: String, default: [] }],
    preferredTechStack: [{ type: String, default: [] }],
    excludedTech: [{ type: String, default: [] }],
    preferredCompanies: [{ type: String, default: [] }],
    excludedCompanies: [{ type: String, default: [] }],
    noticePeriodDays: { type: Number, default: 0 },
    visaSponsorshipRequired: { type: Boolean, default: false },
    employmentTypes: [{ type: String, default: ['Full-time'] }],
    automationPolicy: { type: String, enum: ['MANUAL', 'ASSISTED', 'AUTOMATIC'], default: 'ASSISTED' },
    atsScoreFloor: { type: Number, default: 85 },
    dailyAiBudgetUsd: { type: Number, default: 5.00 },
    maxApplicationsPerDay: { type: Number, default: 20 },
    memoryContext: { type: Schema.Types.Mixed, default: {} }
  },
  { timestamps: true }
);

export const CareerProfile = mongoose.model<ICareerProfileDocument>('CareerProfile', CareerProfileSchema);
