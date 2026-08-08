import mongoose, { Schema, Document } from 'mongoose';
import { IInboundEmail } from '../types';

export interface IInboundEmailDocument extends IInboundEmail, Document {}

const InboundEmailSchema = new Schema<IInboundEmailDocument>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    sender: { type: String, required: true },
    subject: { type: String, required: true },
    body: { type: String, required: true },
    receivedAt: { type: Date, default: Date.now },
    classification: { type: String, enum: ['Interview', 'Rejection', 'Follow-up', 'Other'], default: 'Other' }
  },
  { timestamps: true }
);

export const InboundEmail = mongoose.model<IInboundEmailDocument>('InboundEmail', InboundEmailSchema);
