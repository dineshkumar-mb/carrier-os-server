import mongoose, { Schema, Document } from 'mongoose';
import { ICalendarEvent } from '../types';

export interface ICalendarEventDocument extends ICalendarEvent, Document {}

const CalendarEventSchema = new Schema<ICalendarEventDocument>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    jobMatchId: { type: Schema.Types.ObjectId, ref: 'JobMatch', required: true },
    company: { type: String, required: true },
    title: { type: String, required: true },
    startTime: { type: Date, required: true },
    endTime: { type: Date, required: true },
    meetingLink: { type: String },
    checklist: [{ type: String }]
  },
  { timestamps: true }
);

export const CalendarEvent = mongoose.model<ICalendarEventDocument>('CalendarEvent', CalendarEventSchema);
