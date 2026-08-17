import { Router } from 'express';
import {
  batchCreateShiftSchema,
  createShiftSchema,
  suggestShiftSchema,
  updateShiftSchema,
} from '@css/shared';
import { useCases } from '../../../container';
import { asyncHandler, validateBody, validateQuery } from '../middleware/validate';
import { z } from 'zod';

const listQuerySchema = z.object({
  week: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  month: z.string().regex(/^\d{4}-\d{2}$/).optional(),
});

const myQuerySchema = z.object({
  from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
});

export const shiftsRouter = Router();

shiftsRouter.get('/', validateQuery(listQuerySchema), asyncHandler(async (req, res) => {
  if (!req.auth) throw new Error('Unauthenticated request reached protected route');
  res.json(await useCases.listShifts.execute(req.auth, req.query as { week?: string; month?: string }));
}));

shiftsRouter.get('/mine', validateQuery(myQuerySchema), asyncHandler(async (req, res) => {
  if (!req.auth) throw new Error('Unauthenticated request reached protected route');
  const query = req.query as { from?: string; to?: string };
  const from = query.from ?? new Date().toISOString().slice(0, 10);
  res.json(await useCases.myShifts.execute(req.auth, { from, to: query.to }));
}));

shiftsRouter.post('/suggest', validateBody(suggestShiftSchema), asyncHandler(async (req, res) => {
  if (!req.auth) throw new Error('Unauthenticated request reached protected route');
  res.json(await useCases.suggestShift.execute(req.auth, req.body));
}));

shiftsRouter.post('/batch', validateBody(batchCreateShiftSchema), asyncHandler(async (req, res) => {
  if (!req.auth) throw new Error('Unauthenticated request reached protected route');
  res.status(201).json(await useCases.createShifts.execute(req.auth, req.body));
}));

shiftsRouter.post('/', validateBody(createShiftSchema), asyncHandler(async (req, res) => {
  if (!req.auth) throw new Error('Unauthenticated request reached protected route');
  res.status(201).json(await useCases.createShift.execute(req.auth, req.body));
}));

shiftsRouter.patch('/:id', validateBody(updateShiftSchema), asyncHandler(async (req, res) => {
  if (!req.auth) throw new Error('Unauthenticated request reached protected route');
  const id = req.params.id as string;
  res.json(await useCases.updateShift.execute(req.auth, id, req.body));
}));

shiftsRouter.delete('/:id', asyncHandler(async (req, res) => {
  if (!req.auth) throw new Error('Unauthenticated request reached protected route');
  const id = req.params.id as string;
  res.json(await useCases.deleteShift.execute(req.auth, id));
}));
