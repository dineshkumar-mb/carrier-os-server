import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { User } from '../../models/User';
import dotenv from 'dotenv';
import crypto from 'crypto';
import { Resend } from 'resend';
import { AuthRequest } from '../middleware/authMiddleware';

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET || 'supersecretjwtkey_12345';
const RESEND_API_KEY = process.env.RESEND_API_KEY || '';
const resend = new Resend(RESEND_API_KEY);

export const registerUser = async (req: Request, res: Response) => {
  const { email, password, name } = req.body;
  try {
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = await User.create({
      email,
      password: hashedPassword,
      name,
      preferences: { notifyTelegram: false, notifyEmail: false }
    });

    const token = jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: '30d' });

    res.status(201).json({ token, user: { id: user._id, email: user.email, name: user.name } });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const loginUser = async (req: Request, res: Response) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user || !user.password) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const token = jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: '30d' });

    res.json({ token, user: { id: user._id, email: user.email, name: user.name } });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const forgotPassword = async (req: Request, res: Response) => {
  const { email } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const resetToken = crypto.randomBytes(20).toString('hex');
    user.resetPasswordToken = resetToken;
    user.resetPasswordExpires = new Date(Date.now() + 3600000);
    await user.save();

    const resetUrl = `http://localhost:5173/reset-password/${resetToken}`;
    console.log(`[authController] 🔑 Password Reset Link for ${email}: ${resetUrl}`);

    if (!process.env.RESEND_API_KEY) {
      return res.json({ message: 'Password reset link generated. Check server logs or inbox for reset link.' });
    }

    try {
      await resend.emails.send({
        from: 'onboarding@resend.dev',
        to: email,
        subject: 'Password Reset Request - Carrier OS',
        html: `<p>You requested a password reset.</p><p>Please click on the following link to complete the process within one hour of receiving it:</p><p><a href="${resetUrl}">${resetUrl}</a></p>`,
      });
      res.json({ message: 'Password reset email sent' });
    } catch (emailError) {
      console.warn('[authController] Resend email dispatch notice:', emailError);
      return res.json({ message: 'Password reset link generated. Check server logs or inbox for reset link.' });
    }
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const resetPassword = async (req: Request, res: Response) => {
  const { token } = req.params;
  const { password } = req.body;

  try {
    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({ message: 'Password reset token is invalid or has expired.' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    user.password = hashedPassword;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    res.json({ message: 'Your password has been successfully updated.' });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const getMe = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?._id;
    if (!userId) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    const user = await User.findById(userId).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json(user);
  } catch (error) {
    console.error('getMe error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

export const updateMe = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?._id;
    if (!userId) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    const { name, telegramChatId } = req.body;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (name !== undefined) user.name = name;
    if (telegramChatId !== undefined) user.telegramChatId = telegramChatId;
    await user.save();

    res.json(user);
  } catch (error) {
    console.error('updateMe error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
