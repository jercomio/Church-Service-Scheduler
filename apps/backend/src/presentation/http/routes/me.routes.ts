import { Router } from 'express';
import { changeRoleSchema, transferAdminSchema } from '@css/shared';
import { useCases } from '../../../container';
import { asyncHandler, validateBody } from '../middleware/validate';

export const meRouter = Router();

meRouter.get('/me', asyncHandler(async (req, res) => {
  if (!req.auth) throw new Error('Unauthenticated request reached protected route');
  res.json(await useCases.profile.execute(req.auth));
}));

meRouter.get('/me/shifts', asyncHandler(async (req, res) => {
  if (!req.auth) throw new Error('Unauthenticated request reached protected route');
  const query = req.query as { from?: string; to?: string };
  const from = query.from ?? new Date().toISOString().slice(0, 10);
  res.json(await useCases.myShifts.execute(req.auth, { from, to: query.to }));
}));

meRouter.post('/me/transfer-admin', validateBody(transferAdminSchema), asyncHandler(async (req, res) => {
  if (!req.auth) throw new Error('Unauthenticated request reached protected route');
  res.json(await useCases.transferAdmin.execute(req.auth, req.body));
}));

meRouter.patch('/me/role', validateBody(changeRoleSchema), asyncHandler(async (req, res) => {
  if (!req.auth) throw new Error('Unauthenticated request reached protected route');
  res.json(await useCases.changeMyRole.execute(req.auth, req.body));
}));

meRouter.delete('/me', asyncHandler(async (req, res) => {
  if (!req.auth) throw new Error('Unauthenticated request reached protected route');
  res.json(await useCases.deleteMyAccount.execute(req.auth));
}));
