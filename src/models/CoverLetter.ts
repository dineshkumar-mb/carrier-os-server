import mongoose, { Schema, Document } from 'mongoose';
import { ICoverLetter } from '../types';

export interface ICoverLetterDocument extends ICoverLetter, Document {}

const CoverLetterSchema = new Schema<ICoverLetterDocument>(
  {
    jobId: { type: Schema.Types.ObjectId, ref: 'Job', required: true },
    resumeVersionId: { type: Schema.Types.ObjectId, ref: 'ResumeVersion', required: true },
    content: { type: String, required: true },
  },
  { timestamps: true }
);

export const CoverLetter = mongoose.model<ICoverLetterDocument>('CoverLetter', CoverLetterSchema);
