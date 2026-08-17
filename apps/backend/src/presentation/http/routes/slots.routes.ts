import { Router } from 'express';
import { slotSchema, slotUpdateSchema } from '@css/shared';
import { useCases } from '../../../container';
import { asyncHandler, validateBody, validateParam } from '../middleware/validate';

export const slotsRouter = Router();

slotsRouter.get('/', asyncHandler(async (req, res) => {
  if (!req.auth) throw new Error('Unauthenticated request reached protected route');
  res.json(await useCases.getSlots.execute(req.auth));
}));

slotsRouter.post('/', validateBody(slotSchema), asyncHandler(async (req, res) => {
  if (!req.auth) throw new Error('Unauthenticated request reached protected route');
  res.status(201).json(await useCases.createSlot.execute(req.auth, req.body));
}));

slotsRouter.patch(
  '/:id',
  validateParam('id', (v) => v.length > 0),
  validateBody(slotUpdateSchema),
  asyncHandler(async (req, res) => {
    if (!req.auth) throw new Error('Unauthenticated request reached protected route');
    const id = req.params.id as string;
    res.json(await useCases.updateSlot.execute(req.auth, id, req.body));
  }),
);

slotsRouter.delete('/:id', asyncHandler(async (req, res) => {
  if (!req.auth) throw new Error('Unauthenticated request reached protected route');
  const id = req.params.id as string;
  res.json(await useCases.deleteSlot.execute(req.auth, id));
}));
