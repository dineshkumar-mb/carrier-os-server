import mongoose, { Schema, Document } from 'mongoose';

export interface IQueueFailureLog extends Document {
  queueName: string;
  jobId: string;
  jobData: any;
  errorMessage: string;
  stackTrace?: string;
  failedAt: Date;
}

const QueueFailureLogSchema = new Schema<IQueueFailureLog>(
  {
    queueName: { type: String, required: true },
    jobId: { type: String, required: true },
    jobData: { type: Schema.Types.Mixed },
    errorMessage: { type: String, required: true },
    stackTrace: { type: String },
    failedAt: { type: Date, default: Date.now }
  },
  { timestamps: true }
);

export const QueueFailureLog = mongoose.model<IQueueFailureLog>('QueueFailureLog', QueueFailureLogSchema);
