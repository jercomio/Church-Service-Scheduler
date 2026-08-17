import { Router } from 'express';
import {
  loginSchema,
  magicLinkSchema,
  resetPasswordSchema,
  signupSchema,
} from '@css/shared';
import { useCases } from '../../../container';
import { asyncHandler, validateBody } from '../middleware/validate';
import { authLimiter } from '../middleware/rate-limiter';

export const authRouter = Router();

authRouter.post('/login', authLimiter, validateBody(loginSchema), asyncHandler(async (req, res) => {
  res.json(await useCases.login.execute(req.body));
}));

authRouter.post('/signup', authLimiter, validateBody(signupSchema), asyncHandler(async (req, res) => {
  res.status(201).json(await useCases.signup.execute(req.body));
}));

authRouter.post('/magic-link', authLimiter, validateBody(magicLinkSchema), asyncHandler(async (req, res) => {
  res.json(await useCases.sendMagicLink.execute(req.body));
}));

authRouter.post('/reset-password', authLimiter, validateBody(resetPasswordSchema), asyncHandler(async (req, res) => {
  res.json(await useCases.sendPasswordReset.execute(req.body));
}));
