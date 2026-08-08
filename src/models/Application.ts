import mongoose, { Schema, Document } from 'mongoose';
import { IApplication } from '../types';

export interface IApplicationDocument extends IApplication, Document {}

const ApplicationSchema = new Schema<IApplicationDocument>(
  {
    jobId: { type: Schema.Types.ObjectId, ref: 'Job', required: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    resumeVersionId: { type: Schema.Types.ObjectId, ref: 'ResumeVersion' },
    coverLetterId: { type: Schema.Types.ObjectId, ref: 'CoverLetter' },
    status: {
      type: String,
      enum: ['Pending', 'Auto-Applying', 'Applied', 'Interview', 'Rejected'],
      default: 'Pending',
    },
    timeline: [
      {
        status: { type: String, required: true },
        timestamp: { type: Date, default: Date.now },
        note: { type: String },
      },
    ],
  },
  { timestamps: true }
);

ApplicationSchema.index({ userId: 1, status: 1 });

export const Application = mongoose.model<IApplicationDocument>('Application', ApplicationSchema);
