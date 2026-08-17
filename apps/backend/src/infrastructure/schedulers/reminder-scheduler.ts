import cron from 'node-cron';
import { env } from '../../config/env';
import { useCases } from '../../container';

let running = false;

/** NOTIF-01/02 — daily job that evaluates J-7 and J-1 email reminders. */
export function startReminderScheduler(): void {
  const valid = cron.validate(env.remindCron);
  if (!valid) {
    console.error(`[cron] invalid REMIND_CRON expression: ${env.remindCron}`);
    return;
  }

  cron.schedule(env.remindCron, async () => {
    if (running) return;
    running = true;
    try {
      const result = await useCases.runReminders.execute();
      console.log(`[cron] reminders run: sent=${result.sent} skipped=${result.skipped} errors=${result.errors}`);
    } catch (err) {
      console.error('[cron] reminders failed', err);
    } finally {
      running = false;
    }
  });

  console.log(`[cron] reminder scheduler enabled (${env.remindCron})`);
}
