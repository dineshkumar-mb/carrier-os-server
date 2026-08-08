import mongoose, { Schema, Document } from 'mongoose';
import { IUser } from '../types';
import { encryptText, decryptText } from '../utils/security';

export interface IUserDocument extends IUser, Document {
  password?: string;
  resetPasswordToken?: string;
  resetPasswordExpires?: Date;
}

const UserSchema = new Schema<IUserDocument>(
  {
    email: { type: String, required: true, unique: true },
    password: { type: String },
    name: { type: String, set: encryptText, get: decryptText },
    telegramChatId: { type: String, set: encryptText, get: decryptText },
    resetPasswordToken: { type: String },
    resetPasswordExpires: { type: Date },
    preferences: {
      notifyTelegram: { type: Boolean, default: false },
      notifyEmail: { type: Boolean, default: true },
      applicationPolicy: { type: String, enum: ['MANUAL', 'ASSISTED', 'AUTOMATIC'], default: 'AUTOMATIC' },
    },
  },
  { 
    timestamps: true,
    toJSON: { getters: true },
    toObject: { getters: true }
  }
);

export const User = mongoose.model<IUserDocument>('User', UserSchema);
