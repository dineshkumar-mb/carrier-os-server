import { z } from 'zod';

export const registerSchema = z.object({
  email: z.string().email('Invalid email address format'),
  password: z.string().min(6, 'Password must be at least 6 characters long'),
  name: z.string().min(1, 'Name is required')
});

export const loginSchema = z.object({
  email: z.string().email('Invalid email address format'),
  password: z.string().min(1, 'Password is required')
});

export const generateApplicationSchema = z.object({
  jobId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid jobId format')
});

export const generatePrepKitSchema = z.object({
  applicationId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid applicationId format')
});

export const inboundEmailSchema = z.object({
  emailText: z.string().min(1, 'Email body text is required'),
  sender: z.string().email('Invalid sender email format'),
  subject: z.string().optional()
});
