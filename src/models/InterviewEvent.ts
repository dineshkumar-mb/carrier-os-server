import mongoose, { Schema, Document } from 'mongoose';

export interface IInterviewEventDocument extends Document {
  userId: string;
  tenantId: string;
  applicationId: string;
  company: string;
  roleTitle: string;
  scheduledAt: Date;
  interviewerNames: string[];
  prepStatus: 'PENDING' | 'PREP_GENERATED' | 'COMPLETED';
  questionsPrepared: string[];
  companyResearchNotes?: string;
  createdAt: Date;
}

const InterviewEventSchema = new Schema<IInterviewEventDocument>(
  {
    userId: { type: String, required: true, index: true },
    tenantId: { type: String, required: true, index: true },
    applicationId: { type: String, required: true, index: true },
    company: { type: String, required: true },
    roleTitle: { type: String, required: true },
    scheduledAt: { type: Date, required: true },
    interviewerNames: [{ type: String }],
    prepStatus: { type: String, enum: ['PENDING', 'PREP_GENERATED', 'COMPLETED'], default: 'PENDING' },
    questionsPrepared: [{ type: String }],
    companyResearchNotes: { type: String }
  },
  { timestamps: true }
);

export const InterviewEvent = mongoose.model<IInterviewEventDocument>('InterviewEvent', InterviewEventSchema);
