import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import { User } from '../../models/User';

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET || 'supersecretjwtkey_12345';

export interface AuthRequest extends Request {
  user?: any;
}

export const protect = async (req: AuthRequest, res: Response, next: NextFunction) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded: any = jwt.verify(token, JWT_SECRET);
      
      const user = await User.findById(decoded.id).select('-password');
      if (user) {
        req.user = user;
        return next();
      }
    } catch (error) {
      console.warn('[Auth Middleware] Token verification fallback:', (error as any).message);
    }
  }

  // Local demo candidate fallback when no auth token is passed
  req.user = {
    _id: 'default-user-id',
    name: 'Dinesh',
    email: 'dineshkumarmannibrundha@gmail.com',
    role: 'candidate'
  };
  next();
};
