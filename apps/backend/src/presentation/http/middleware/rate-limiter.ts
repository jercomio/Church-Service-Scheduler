import rateLimit from 'express-rate-limit';
import { ApiError } from '@css/shared';

export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req, _res, next) =>
    next(new ApiError('RATE_LIMITED', 429, 'Too many requests, please try again later')),
});

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_req, _res, next) =>
    next(new ApiError('RATE_LIMITED', 429, 'Too many authentication attempts, please slow down')),
});
