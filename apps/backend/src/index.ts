import { prisma } from './infrastructure/prisma/client';
import { env } from './config/env';
import { buildApp } from './presentation/http/server';
import { startReminderScheduler } from './infrastructure/schedulers/reminder-scheduler';

async function main(): Promise<void> {
  const app = buildApp();

  const server = app.listen(env.port, () => {
    console.log(`[api] Church Service Scheduler API listening on http://localhost:${env.port}`);
    console.log(`[api] auth provider: ${env.authProvider} | email provider: ${env.emailProvider}`);
  });

  if (!env.isProd) {
    startReminderScheduler();
  }

  const shutdown = async () => {
    console.log('[api] shutting down...');
    server.close(async () => {
      await prisma.$disconnect();
      process.exit(0);
    });
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

main().catch((err) => {
  console.error('[api] fatal error during startup', err);
  process.exit(1);
});
