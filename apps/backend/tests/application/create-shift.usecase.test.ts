import { describe, expect, it, beforeEach } from 'vitest';
import { ApiError } from '@css/shared';
import { CreateShiftUseCase } from '../../src/application/use-cases/shifts/create-shift.usecase';
import { ShiftNotifier } from '../../src/application/services/shift-notifier';
import { ShiftConflictError } from '../../src/domain/services/shift-conflict.service';
import {
  InMemoryMemberRepository,
  InMemoryNotificationRepository,
  InMemoryShiftRepository,
  InMemorySlotRepository,
  InMemoryUserRepository,
  RecordingEmailProvider,
} from '../helpers/fakes';
import { fromDateOnly } from '../../src/domain/services/date-utils';

describe('CreateShiftUseCase', () => {
  let users: InMemoryUserRepository;
  let members: InMemoryMemberRepository;
  let slots: InMemorySlotRepository;
  let shifts: InMemoryShiftRepository;
  let notifications: InMemoryNotificationRepository;
  let emails: RecordingEmailProvider;
  let useCase: CreateShiftUseCase;

  const coordinatorId = 'coord-1';
  const memberId = 'member-1';
  const slotId = 'slot-1';
  const date = '2026-08-16'; // Sunday

  beforeEach(() => {
    users = new InMemoryUserRepository();
    members = new InMemoryMemberRepository();
    slots = new InMemorySlotRepository();
    shifts = new InMemoryShiftRepository();
    notifications = new InMemoryNotificationRepository();
    emails = new RecordingEmailProvider();

    users.users.set(coordinatorId, {
      id: coordinatorId,
      email: 'coordinator@example.com',
      role: 'COORDINATOR',
      createdAt: new Date(),
    });
    users.membersByUser.set(coordinatorId, {
      id: 'coord-member',
      teamId: 'team-1',
      userId: coordinatorId,
      firstName: 'Alex',
      lastName: 'Roure',
      email: 'coordinator@example.com',
      isActive: true,
      role: 'COORDINATOR',
      createdAt: new Date(),
    });

    members.seed({
      id: memberId,
      teamId: 'team-1',
      userId: 'user-m1',
      firstName: 'Marie',
      lastName: 'Johnson',
      email: 'marie@example.com',
      isActive: true,
      role: 'MEMBER',
      createdAt: new Date(),
    });

    slots.seed({
      id: slotId,
      teamId: 'team-1',
      dayOfWeek: 0,
      startTime: '09:00',
      endTime: '12:00',
      label: 'Sunday Morning Worship',
      isActive: true,
      createdAt: new Date(),
    });

    useCase = new CreateShiftUseCase(
      users,
      members,
      slots,
      shifts,
      new ShiftNotifier(emails, notifications),
    );
  });

  const ctx = { userId: coordinatorId, email: 'coordinator@example.com', role: 'COORDINATOR' as const, memberId: 'coord-member' };

  it('creates a shift and notifies the member (email + in-app)', async () => {
    const shift = await useCase.execute(ctx, { slotId, memberId, date });
    expect(shift.date).toBe(date);
    expect(shift.memberId).toBe(memberId);

    expect(emails.sent).toHaveLength(1);
    expect(emails.sent[0]?.to).toBe('marie@example.com');

    expect(notifications.notifications).toHaveLength(1);
    expect(notifications.notifications[0]?.userId).toBe('user-m1');
  });

  it('rejects a member already assigned to another slot the same day (PLAN-05)', async () => {
    shifts.seed({
      id: 'existing',
      slotId: 'slot-other',
      memberId,
      date: fromDateOnly(date),
      createdAt: new Date(),
    });

    await expect(useCase.execute(ctx, { slotId, memberId, date })).rejects.toBeInstanceOf(
      ShiftConflictError,
    );
  });

  it('rejects assigning an inactive member', async () => {
    members.members.get(memberId)!.isActive = false;
    await expect(useCase.execute(ctx, { slotId, memberId, date })).rejects.toBeInstanceOf(ApiError);
  });

  it('rejects assigning to an inactive slot', async () => {
    slots.slots.get(slotId)!.isActive = false;
    await expect(useCase.execute(ctx, { slotId, memberId, date })).rejects.toMatchObject({
      code: 'SLOT_INACTIVE',
    });
  });

  it('allows a second shift the same day for a different member', async () => {
    const otherId = 'member-2';
    members.seed({
      id: otherId,
      teamId: 'team-1',
      userId: null,
      firstName: 'Chris',
      lastName: 'Nolan',
      email: 'chris@example.com',
      isActive: true,
      role: 'MEMBER',
      createdAt: new Date(),
    });
    shifts.seed({
      id: 'existing',
      slotId: 'slot-other',
      memberId,
      date: fromDateOnly(date),
      createdAt: new Date(),
    });

    const shift = await useCase.execute(ctx, { slotId, memberId: otherId, date });
    expect(shift.memberId).toBe(otherId);
  });
});
