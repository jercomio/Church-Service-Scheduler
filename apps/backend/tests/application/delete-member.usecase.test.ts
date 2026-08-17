import { describe, expect, it, beforeEach } from 'vitest';
import { ApiError } from '@css/shared';
import { DeleteMemberUseCase } from '../../src/application/use-cases/members/delete-member.usecase';
import {
  InMemoryMemberRepository,
  InMemoryNotificationRepository,
  InMemoryShiftRepository,
} from '../helpers/fakes';
import { MemberEntity } from '../../src/domain/entities/member';
import { AuthContext } from '../../src/application/auth-context';

describe('DeleteMemberUseCase', () => {
  let members: InMemoryMemberRepository;
  let shifts: InMemoryShiftRepository;
  let notifications: InMemoryNotificationRepository;
  let useCase: DeleteMemberUseCase;

  const admin: AuthContext = {
    userId: 'admin-user',
    email: 'admin@example.com',
    role: 'ADMIN',
    memberId: 'admin-member',
  };
  const coordinator: AuthContext = {
    userId: 'coord-user',
    email: 'coord@example.com',
    role: 'COORDINATOR',
    memberId: 'coord-member',
  };

  const targetMember: MemberEntity = {
    id: 'member-1',
    teamId: 'team-1',
    userId: 'user-m1',
    firstName: 'Marie',
    lastName: 'Dupont',
    email: 'marie@example.com',
    isActive: true,
    role: 'MEMBER',
    createdAt: new Date(),
  };

  beforeEach(() => {
    members = new InMemoryMemberRepository();
    shifts = new InMemoryShiftRepository();
    notifications = new InMemoryNotificationRepository();
    useCase = new DeleteMemberUseCase(members, shifts, notifications);
    members.seed(targetMember);
  });

  it('deletes a member without assignments as coordinator', async () => {
    await expect(useCase.execute(coordinator, targetMember.id)).resolves.toEqual({ ok: true });
    expect(members.members.has(targetMember.id)).toBe(false);
    expect(notifications.notifications).toHaveLength(0);
  });

  it('blocks a coordinator from deleting a member who has assignments', async () => {
    shifts.seed({
      id: 'shift-1',
      slotId: 'slot-1',
      memberId: targetMember.id,
      date: new Date('2026-09-01'),
      createdAt: new Date(),
    });

    await expect(useCase.execute(coordinator, targetMember.id)).rejects.toMatchObject<ApiError>({
      status: 409,
      code: 'VALIDATION_ERROR',
      message: 'This member has 1 assignment. Only an admin can delete a member with assignments.',
    });
    expect(members.members.has(targetMember.id)).toBe(true);
  });

  it('allows an admin to delete a member who has assignments', async () => {
    shifts.seed({
      id: 'shift-1',
      slotId: 'slot-1',
      memberId: targetMember.id,
      date: new Date('2026-09-01'),
      createdAt: new Date(),
    });

    await expect(useCase.execute(admin, targetMember.id)).resolves.toEqual({ ok: true });
    expect(members.members.has(targetMember.id)).toBe(false);
  });

  it('notifies the admin when they delete a member with assignments', async () => {
    shifts.seed({
      id: 'shift-1',
      slotId: 'slot-1',
      memberId: targetMember.id,
      date: new Date('2026-09-01'),
      createdAt: new Date(),
    });

    await useCase.execute(admin, targetMember.id);

    expect(notifications.notifications).toHaveLength(1);
    expect(notifications.notifications[0]).toMatchObject({
      userId: admin.userId,
      title: 'Member deleted',
      body: 'Marie Dupont and their 1 assignment were deleted.',
    });
  });

  it('does not notify a coordinator who deletes a member with no assignments', async () => {
    await useCase.execute(coordinator, targetMember.id);
    expect(notifications.notifications).toHaveLength(0);
  });

  it('rejects deletion when the member does not exist', async () => {
    await expect(useCase.execute(admin, 'missing')).rejects.toMatchObject<ApiError>({
      status: 404,
      code: 'NOT_FOUND',
    });
  });

  it('prevents a user from deleting their own member', async () => {
    members.seed({ ...targetMember, id: 'admin-member', userId: admin.userId });
    await expect(useCase.execute(admin, 'admin-member')).rejects.toMatchObject<ApiError>({
      status: 403,
    });
  });

  it('prevents members from deleting anyone', async () => {
    const memberCtx: AuthContext = {
      userId: 'some-user',
      email: 'some@example.com',
      role: 'MEMBER',
      memberId: 'some-member',
    };
    await expect(useCase.execute(memberCtx, targetMember.id)).rejects.toMatchObject<ApiError>({
      status: 403,
    });
  });
});
