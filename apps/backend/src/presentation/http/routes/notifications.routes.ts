import { Router } from 'express';
import { deleteNotificationsSchema } from '@css/shared';
import { useCases } from '../../../container';
import { asyncHandler, validateBody, validateParam } from '../middleware/validate';

export const notificationsRouter = Router();

notificationsRouter.get('/', asyncHandler(async (req, res) => {
  if (!req.auth) throw new Error('Unauthenticated request reached protected route');
  res.json(await useCases.listNotifications.execute(req.auth));
}));

notificationsRouter.post('/read-all', asyncHandler(async (req, res) => {
  if (!req.auth) throw new Error('Unauthenticated request reached protected route');
  res.json(await useCases.markAllNotificationsRead.execute(req.auth));
}));

notificationsRouter.post('/delete', validateBody(deleteNotificationsSchema), asyncHandler(async (req, res) => {
  if (!req.auth) throw new Error('Unauthenticated request reached protected route');
  res.json(await useCases.deleteNotifications.execute(req.auth, req.body));
}));

notificationsRouter.delete('/:id', validateParam('id', (v) => v.length > 0), asyncHandler(async (req, res) => {
  if (!req.auth) throw new Error('Unauthenticated request reached protected route');
  const id = req.params.id as string;
  res.json(await useCases.deleteNotification.execute(req.auth, id));
}));

notificationsRouter.patch('/:id/read', validateParam('id', (v) => v.length > 0), asyncHandler(async (req, res) => {
  if (!req.auth) throw new Error('Unauthenticated request reached protected route');
  const id = req.params.id as string;
  res.json(await useCases.markNotificationRead.execute(req.auth, id));
}));
