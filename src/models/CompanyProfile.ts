import mongoose, { Schema, Document } from 'mongoose';
import { ICompanyProfile } from '../types';

export interface ICompanyProfileDocument extends ICompanyProfile, Document {}

const CompanyProfileSchema = new Schema<ICompanyProfileDocument>(
  {
    companyName: { type: String, required: true, unique: true },
    products: [{ type: String }],
    services: [{ type: String }],
    mission: { type: String },
    engineeringCulture: { type: String },
    techStack: [{ type: String }],
    latestNews: [{ type: String }],
    hiringValues: [{ type: String }],
    lastResearched: { type: Date, default: Date.now }
  },
  { timestamps: true }
);

export const CompanyProfile = mongoose.model<ICompanyProfileDocument>('CompanyProfile', CompanyProfileSchema);
