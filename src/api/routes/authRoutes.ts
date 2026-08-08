import express from 'express';
import { registerUser, loginUser, forgotPassword, resetPassword, getMe, updateMe } from '../controllers/authController';
import { protect } from '../middleware/authMiddleware';
import { validateBody } from '../middleware/validationMiddleware';
import { registerSchema, loginSchema } from '../validation/schemas';
import { authLimiter } from '../middleware/rateLimiter';

const router = express.Router();

router.post('/register', authLimiter, validateBody(registerSchema), registerUser);
router.post('/login', authLimiter, validateBody(loginSchema), loginUser);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password/:token', resetPassword);

router.get('/me', protect, getMe);
router.put('/me', protect, updateMe);

export default router;
