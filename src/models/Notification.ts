import mongoose, { Schema, Document } from 'mongoose';
import { INotification } from '../types';

export interface INotificationDocument extends INotification, Document {}

const NotificationSchema = new Schema<INotificationDocument>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    message: { type: String, required: true },
    type: { type: String, required: true }, // e.g., 'Application Status', 'System'
    read: { type: Boolean, default: false },
    channel: { type: String, enum: ['Telegram', 'In-App', 'Email'], default: 'In-App' },
  },
  { timestamps: true }
);

// TTL index to auto-delete notifications after 30 days
NotificationSchema.index({ createdAt: 1 }, { expireAfterSeconds: 2592000 });
NotificationSchema.index({ userId: 1, read: 1 });

export const Notification = mongoose.model<INotificationDocument>('Notification', NotificationSchema);
