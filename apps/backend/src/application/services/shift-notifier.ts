import { MemberEntity } from '../../domain/entities/member';
import { SlotEntity } from '../../domain/entities/slot';
import { ShiftEntity } from '../../domain/entities/shift';
import { NotificationRepository } from '../../domain/repositories/notification-repository';
import { EmailProvider } from '../ports/email-provider';
import { toDateOnly } from '../../domain/services/date-utils';
import {
  buildShiftAssignedEmail,
  buildShiftCancelledEmail,
  buildShiftUpdatedEmail,
} from '../email-templates';

/**
 * Sends both channels (email + in-app) for shift events, per NOTIF-03 / NOTIF-04.
 */
export class ShiftNotifier {
  constructor(
    private readonly emails: EmailProvider,
    private readonly notifications: NotificationRepository,
  ) {}

  async notifyAssigned(
    shift: ShiftEntity,
    slot: SlotEntity,
    member: MemberEntity,
  ): Promise<void> {
    const ctx = buildContext(shift, slot, member);
    await this.send(member, ctx, buildShiftAssignedEmail(ctx));
  }

  async notifyUpdated(
    shift: ShiftEntity,
    slot: SlotEntity,
    member: MemberEntity,
  ): Promise<void> {
    const ctx = buildContext(shift, slot, member);
    await this.send(member, ctx, buildShiftUpdatedEmail(ctx));
  }

  async notifyCancelled(
    shift: ShiftEntity,
    slot: SlotEntity,
    member: MemberEntity,
  ): Promise<void> {
    const ctx = buildContext(shift, slot, member);
    await this.send(member, ctx, buildShiftCancelledEmail(ctx), {
      title: 'Shift cancelled',
      body: `${ctx.slotLabel} on ${ctx.dateLabel} was cancelled.`,
    });
  }

  private async send(
    member: MemberEntity,
    ctx: EmailContext,
    template: { subject: string; html: string; text: string },
    inApp?: { title: string; body: string },
  ): Promise<void> {
    if (member.email) {
      await this.emails
        .send({
          to: member.email,
          subject: template.subject,
          html: template.html,
          text: template.text,
        })
        .catch(() => {
          // Email failures must never break the core scheduling flow.
        });
    }

    if (member.userId) {
      await this.notifications.create({
        userId: member.userId,
        title: inApp?.title ?? template.subject,
        body: inApp?.body ?? `${ctx.slotLabel} — ${ctx.dateLabel} (${ctx.timeLabel})`,
      });
    }
  }
}

interface EmailContext {
  memberName: string;
  slotLabel: string;
  dateLabel: string;
  timeLabel: string;
}

function buildContext(shift: ShiftEntity, slot: SlotEntity, member: MemberEntity): EmailContext {
  return {
    memberName: member.firstName,
    slotLabel: slot.label,
    dateLabel: toDateOnly(shift.date),
    timeLabel: `${slot.startTime}–${slot.endTime}`,
  };
}
