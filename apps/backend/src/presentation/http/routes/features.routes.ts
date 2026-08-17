import { Router } from 'express';
import { useCases } from '../../../container';
import { asyncHandler } from '../middleware/validate';

export const featuresRouter = Router();

featuresRouter.get('/', asyncHandler(async (req, res) => {
  if (!req.auth) throw new Error('Unauthenticated request reached protected route');
  res.json(await useCases.getFeatures.execute(req.auth));
}));
