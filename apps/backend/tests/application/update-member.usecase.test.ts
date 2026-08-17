import { describe, expect, it, beforeEach } from 'vitest';
import { ApiError } from '@css/shared';
import { UpdateMemberUseCase } from '../../src/application/use-cases/members/update-member.usecase';
import {
  InMemoryMemberRepository,
  InMemoryNotificationRepository,
  InMemoryTeamRepository,
  InMemoryUserRepository,
} from '../helpers/fakes';
import { MemberEntity } from '../../src/domain/entities/member';
import { AuthContext } from '../../src/application/auth-context';

describe('UpdateMemberUseCase', () => {
  let users: InMemoryUserRepository;
  let members: InMemoryMemberRepository;
  let teams: InMemoryTeamRepository;
  let notifications: InMemoryNotificationRepository;
  let useCase: UpdateMemberUseCase;

  const admin: AuthContext = {
    userId: 'admin-user',
    email: 'admin@example.com',
    role: 'ADMIN',
    memberId: 'admin-member',
  };

  const unlinkedMember: MemberEntity = {
    id: 'member-unlinked',
    teamId: 'team-1',
    userId: null,
    firstName: 'Will',
    lastName: 'Doe',
    email: 'will@example.com',
    isActive: true,
    role: 'MEMBER',
    createdAt: new Date(),
  };

  beforeEach(() => {
    users = new InMemoryUserRepository();
    members = new InMemoryMemberRepository();
    teams = new InMemoryTeamRepository();
    notifications = new InMemoryNotificationRepository();
    useCase = new UpdateMemberUseCase(users, members, teams, notifications);
    teams.seed({ id: 'team-1', name: 'Video Team', createdAt: new Date() });
  });

  it('persists the role of a member without a linked user account', async () => {
    members.seed(unlinkedMember);

    const dto = await useCase.execute(admin, unlinkedMember.id, { role: 'COORDINATOR' });

    expect(dto.role).toBe('COORDINATOR');
    expect(members.members.get(unlinkedMember.id)?.role).toBe('COORDINATOR');
    expect(notifications.notifications).toHaveLength(0);
  });

  it('updates the role of a linked member and notifies team members', async () => {
    await users.create({ id: 'user-m1', email: 'linked@example.com', role: 'MEMBER' });
    members.seed({
      id: 'member-linked',
      teamId: 'team-1',
      userId: 'user-m1',
      firstName: 'Alex',
      lastName: 'Doe',
      email: 'linked@example.com',
      isActive: true,
      role: 'MEMBER',
      createdAt: new Date(),
    });
    members.seed(unlinkedMember);
    members.seed({
      id: 'admin-member',
      teamId: 'team-1',
      userId: 'admin-user',
      firstName: 'John',
      lastName: 'Doe',
      email: 'admin@example.com',
      isActive: true,
      role: 'ADMIN',
      createdAt: new Date(),
    });

    const dto = await useCase.execute(admin, 'member-linked', { role: 'COORDINATOR' });

    expect(dto.role).toBe('COORDINATOR');
    expect(members.members.get('member-linked')?.role).toBe('COORDINATOR');
    expect(users.users.get('user-m1')?.role).toBe('COORDINATOR');
    expect(notifications.notifications).toHaveLength(2);
    expect(notifications.notifications.map((n) => n.userId)).toEqual(
      expect.arrayContaining(['admin-user', 'user-m1']),
    );
    expect(notifications.notifications[0]).toMatchObject({ title: 'New coordinator' });
  });

  it('refuses to grant the ADMIN role through the API', async () => {
    members.seed(unlinkedMember);

    await expect(useCase.execute(admin, unlinkedMember.id, { role: 'ADMIN' as never })).rejects.toMatchObject<
      ApiError
    >({
      status: 403,
      code: 'FORBIDDEN',
    });
  });
});
