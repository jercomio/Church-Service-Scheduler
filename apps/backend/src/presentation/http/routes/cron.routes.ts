import { Router } from 'express';
import { ApiError } from '@css/shared';
import { env } from '../../../config/env';
import { useCases } from '../../../container';
import { asyncHandler } from '../middleware/validate';

export const cronRouter = Router();

cronRouter.post('/shift-reminders', asyncHandler(async (req, res) => {
  const secret = req.headers['x-cron-secret'];
  if (secret !== env.cronSecret) {
    throw new ApiError('UNAUTHORIZED', 401, 'Invalid cron secret');
  }
  const result = await useCases.runReminders.execute();
  res.json(result);
}));
