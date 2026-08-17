import { Router } from 'express';
import { useCases } from '../../../container';
import { asyncHandler } from '../middleware/validate';

export const teamRouter = Router();

teamRouter.get('/team', asyncHandler(async (req, res) => {
  if (!req.auth) throw new Error('Unauthenticated request reached protected route');
  res.json(await useCases.getTeam.execute(req.auth));
}));
