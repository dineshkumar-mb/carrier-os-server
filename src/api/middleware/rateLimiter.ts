import rateLimit from 'express-rate-limit';

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 15,
  message: {
    status: 'fail',
    message: 'Too many authentication attempts. Please try again after 15 minutes.'
  },
  standardHeaders: true,
  legacyHeaders: false
});

export const aiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 30,
  message: {
    status: 'fail',
    message: 'AI API limit reached. Please try again after 15 minutes.'
  },
  standardHeaders: true,
  legacyHeaders: false
});

export const inboxLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 30,
  message: {
    status: 'fail',
    message: 'Inbound email submission rate exceeded.'
  },
  standardHeaders: true,
  legacyHeaders: false
});
