import mongoose, { Schema, Document } from 'mongoose';
import { IJob } from '../types';

export interface IJobDocument extends IJob, Document {}

const JobSchema = new Schema<IJobDocument>(
  {
    title: { type: String, required: true },
    company: { type: String, required: true },
    location: { type: String, required: true },
    country: { type: String },
    city: { type: String },
    salary: {
      min: { type: Number },
      max: { type: Number },
      currency: { type: String },
    },
    description: { type: String, required: true },
    skills: [{ type: String }],
    url: { type: String, required: true },
    applicationUrl: { type: String },
    companyLogo: { type: String },
    source: { type: String, required: true },
    employmentType: { type: String, default: 'Full-time' },
    remoteStatus: { type: String, enum: ['Remote', 'Hybrid', 'Onsite'], default: 'Remote' },
    postedDate: { type: Date },
    sha256Hash: { type: String },
    status: { type: String, enum: ['active', 'closed'], default: 'active' },
  },
  { timestamps: true }
);

// Full-text search index
JobSchema.index({ title: 'text', description: 'text' });
JobSchema.index({ skills: 1 });
JobSchema.index({ url: 1 }, { unique: true, sparse: true });
JobSchema.index({ sha256Hash: 1 }, { sparse: true });
JobSchema.index({ source: 1, status: 1 });

export const Job = mongoose.model<IJobDocument>('Job', JobSchema);
