import mongoose, { Schema, Document } from 'mongoose';
import { IResume, IResumeVersion } from '../types';

export interface IResumeDocument extends IResume, Document {}
export interface IResumeVersionDocument extends IResumeVersion, Document {}

const ResumeSchema = new Schema<IResumeDocument>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    experience: [{ type: Schema.Types.Mixed }], // Dynamic schema for now
    education: [{ type: Schema.Types.Mixed }],
    skills: [{ type: String }],
    projects: [{ type: Schema.Types.Mixed }],
  },
  { timestamps: true }
);

const ResumeVersionSchema = new Schema<IResumeVersionDocument>(
  {
    masterId: { type: Schema.Types.ObjectId, ref: 'Resume', required: true },
    jobId: { type: Schema.Types.ObjectId, ref: 'Job', required: true },
    content: { type: String, required: true }, // Store markdown or HTML
    atsScore: { type: Number },
    atsFeedback: { type: Schema.Types.Mixed },
  },
  { timestamps: true }
);

ResumeVersionSchema.index({ jobId: 1 });

export const Resume = mongoose.model<IResumeDocument>('Resume', ResumeSchema);
export const ResumeVersion = mongoose.model<IResumeVersionDocument>('ResumeVersion', ResumeVersionSchema);
