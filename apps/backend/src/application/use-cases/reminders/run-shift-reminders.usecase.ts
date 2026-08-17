import { REMINDER_DAYS_BEFORE } from '@css/shared';
import { ShiftRepository } from '../../../domain/repositories/shift-repository';
import { MemberRepository } from '../../../domain/repositories/member-repository';
import { SlotRepository } from '../../../domain/repositories/slot-repository';
import { ShiftReminderRepository } from '../../../domain/repositories/shift-reminder-repository';
import { EmailProvider } from '../../ports/email-provider';
import { addDaysUtc, toDateOnly } from '../../../domain/services/date-utils';
import { buildReminderEmail } from '../../email-templates';

export interface RunRemindersResult {
  runAt: string;
  sent: number;
  skipped: number;
  errors: number;
}

/**
 * NOTIF-01 / NOTIF-02 — evaluates the shifts happening in J-7 and J-1 and sends
 * the reminder emails. Deduplicated per (shift, daysBefore). Invoked by the
 * scheduler and by the internal /api/v1/cron/shift-reminders endpoint.
 */
export class RunShiftRemindersUseCase {
  constructor(
    private readonly shifts: ShiftRepository,
    private readonly members: MemberRepository,
    private readonly slots: SlotRepository,
    private readonly reminders: ShiftReminderRepository,
    private readonly emails: EmailProvider,
  ) {}

  async execute(): Promise<RunRemindersResult> {
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);

    let sent = 0;
    let skipped = 0;
    let errors = 0;

    for (const daysBefore of REMINDER_DAYS_BEFORE) {
      const target = addDaysUtc(today, daysBefore);
      const shifts = await this.shifts.findByDateRange(target, target);

      for (const shift of shifts) {
        if (await this.reminders.exists(shift.id, daysBefore)) {
          skipped += 1;
          continue;
        }

        try {
          const [member, slot] = await Promise.all([
            this.members.findById(shift.memberId),
            this.slots.findById(shift.slotId),
          ]);
          if (!member || !slot || !member.email || !member.isActive || !slot.isActive) {
            skipped += 1;
            continue;
          }

          const template = buildReminderEmail({
            memberName: member.firstName,
            slotLabel: slot.label,
            dateLabel: toDateOnly(shift.date),
            timeLabel: `${slot.startTime}–${slot.endTime}`,
            daysBefore,
          });

          await this.emails.send({
            to: member.email,
            subject: template.subject,
            html: template.html,
            text: template.text,
          });
          await this.reminders.create(shift.id, daysBefore);
          sent += 1;
        } catch {
          errors += 1;
        }
      }
    }

    return { runAt: today.toISOString(), sent, skipped, errors };
  }
}
