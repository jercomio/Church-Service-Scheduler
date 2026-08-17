import express, { Express } from 'express';
import cors from 'cors';import { authProvider, userRepository as users } from '../../container';
import { apiLimiter } from './middleware/rate-limiter';
import { errorHandler, notFoundHandler } from './middleware/error-handler';
import { requireAuth } from './middleware/auth-guard';
import { authRouter } from './routes/auth.routes';
import { meRouter } from './routes/me.routes';
import { teamRouter } from './routes/team.routes';
import { membersRouter } from './routes/members.routes';
import { slotsRouter } from './routes/slots.routes';
import { shiftsRouter } from './routes/shifts.routes';
import { notificationsRouter } from './routes/notifications.routes';
import { featuresRouter } from './routes/features.routes';
import { cronRouter } from './routes/cron.routes';

export function buildApp(): Express {
  const app = express();

  app.disable('x-powered-by');
  app.use(cors());
  app.use(express.json({ limit: '1mb' }));

  app.get('/health', (_req, res) => {
    res.json({ status: 'ok', version: 'v1' });
  });

  const protectedApi = requireAuth({ authProvider, users });

  // Auth routes are public and rate-limited separately inside authRouter.
  app.use('/api/v1/auth', authRouter);

  // Rate limit + auth are applied once per request, not per path prefix
  // (mounting the limiter on every prefix would count each request 3x).
  const v1Router = express.Router();
  v1Router.use(apiLimiter);
  v1Router.use(protectedApi);
  v1Router.use(meRouter);
  v1Router.use(teamRouter);
  v1Router.use('/members', membersRouter);
  v1Router.use('/slots', slotsRouter);
  v1Router.use('/shifts', shiftsRouter);
  v1Router.use('/notifications', notificationsRouter);
  v1Router.use('/features', featuresRouter);
  v1Router.use('/cron', cronRouter);
  app.use('/api/v1', v1Router);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
