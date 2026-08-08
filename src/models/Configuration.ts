import mongoose, { Schema, Document } from 'mongoose';
import { IConfiguration } from '../types';

export interface IConfigurationDocument extends IConfiguration, Document {}

const ConfigurationSchema = new Schema<IConfigurationDocument>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    autoApplyMode: { type: String, enum: ['Manual', 'Semi-Auto', 'Full-Auto'], default: 'Semi-Auto' },
    matchThreshold: { type: Number, default: 80 },
    schedulerInterval: { type: Number, default: 30 },
    maxDailyApplications: { type: Number, default: 5 },
    preferredCountries: [{ type: String }],
    preferredJobBoards: [{ type: String }],
    remoteOnly: { type: Boolean, default: false },
    blacklistedCompanies: [{ type: String }],
    whitelistedCompanies: [{ type: String }]
  },
  { timestamps: true }
);

export const Configuration = mongoose.model<IConfigurationDocument>('Configuration', ConfigurationSchema);
