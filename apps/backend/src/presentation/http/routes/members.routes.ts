import { Router } from 'express';
import { memberSchema, memberUpdateSchema } from '@css/shared';
import { useCases } from '../../../container';
import { asyncHandler, validateBody, validateParam } from '../middleware/validate';

export const membersRouter = Router();

membersRouter.get('/', asyncHandler(async (req, res) => {
  if (!req.auth) throw new Error('Unauthenticated request reached protected route');
  res.json(await useCases.listMembers.execute(req.auth));
}));

membersRouter.post('/', validateBody(memberSchema), asyncHandler(async (req, res) => {
  if (!req.auth) throw new Error('Unauthenticated request reached protected route');
  res.status(201).json(await useCases.createMember.execute(req.auth, req.body));
}));

membersRouter.get('/:id/shifts', validateParam('id', (v) => v.length > 0), asyncHandler(async (req, res) => {
  if (!req.auth) throw new Error('Unauthenticated request reached protected route');
  const id = req.params.id as string;
  res.json(await useCases.listMemberShifts.execute(req.auth, id));
}));

membersRouter.patch(
  '/:id',
  validateParam('id', (v) => v.length > 0),
  validateBody(memberUpdateSchema),
  asyncHandler(async (req, res) => {
    if (!req.auth) throw new Error('Unauthenticated request reached protected route');
    const id = req.params.id as string;
    res.json(await useCases.updateMember.execute(req.auth, id, req.body));
  }),
);

membersRouter.delete('/:id', asyncHandler(async (req, res) => {
  if (!req.auth) throw new Error('Unauthenticated request reached protected route');
  const id = req.params.id as string;
  res.json(await useCases.deleteMember.execute(req.auth, id));
}));
