import { describe, expect, it, beforeEach } from 'vitest';
import { ApiError } from '@css/shared';
import { TransferAdminUseCase } from '../../src/application/use-cases/auth/transfer-admin.usecase';
import {
  InMemoryMemberRepository,
  InMemoryNotificationRepository,
  InMemoryTeamRepository,
  InMemoryUserRepository,
} from '../helpers/fakes';
import { MemberEntity } from '../../src/domain/entities/member';
import { AuthContext } from '../../src/application/auth-context';

describe('TransferAdminUseCase', () => {
  let users: InMemoryUserRepository;
  let members: InMemoryMemberRepository;
  let teams: InMemoryTeamRepository;
  let notifications: InMemoryNotificationRepository;
  let useCase: TransferAdminUseCase;

  const admin: AuthContext = {
    userId: 'admin-user',
    email: 'admin@example.com',
    role: 'ADMIN',
    memberId: 'admin-member',
  };

  const adminMember: MemberEntity = {
    id: 'admin-member',
    teamId: 'team-1',
    userId: 'admin-user',
    firstName: 'John',
    lastName: 'Doe',
    email: 'admin@example.com',
    isActive: true,
    role: 'ADMIN',
    createdAt: new Date(),
  };

  beforeEach(() => {
    users = new InMemoryUserRepository();
    members = new InMemoryMemberRepository();
    teams = new InMemoryTeamRepository();
    notifications = new InMemoryNotificationRepository();
    useCase = new TransferAdminUseCase(users, members, teams, notifications);
    users.membersByUser.set('admin-user', adminMember);
    members.seed(adminMember);
    teams.seed({ id: 'team-1', name: 'Video Team', createdAt: new Date() });
  });

  it('transfers the ADMIN role to a member without a linked account', async () => {
    const will: MemberEntity = {
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
    members.seed(will);

    const res = await useCase.execute(admin, { newAdminMemberId: will.id });

    expect(res.ok).toBe(true);
    expect(res.newAdmin.role).toBe('ADMIN');
    expect(members.members.get(will.id)?.role).toBe('ADMIN');
    expect(notifications.notifications).toHaveLength(1);
    expect(notifications.notifications[0]).toMatchObject({
      userId: 'admin-user',
      title: 'New administrator',
    });
  });

  it('transfers the ADMIN role to a linked member and notifies the team', async () => {
    await users.create({ id: 'user-alex', email: 'alex@example.com', role: 'MEMBER' });
    const alex: MemberEntity = {
      id: 'member-linked',
      teamId: 'team-1',
      userId: 'user-alex',
      firstName: 'Alex',
      lastName: 'Doe',
      email: 'alex@example.com',
      isActive: true,
      role: 'MEMBER',
      createdAt: new Date(),
    };
    members.seed(alex);

    const res = await useCase.execute(admin, { newAdminMemberId: alex.id });

    expect(res.newAdmin.role).toBe('ADMIN');
    expect(members.members.get(alex.id)?.role).toBe('ADMIN');
    expect(users.users.get('user-alex')?.role).toBe('ADMIN');
    expect(notifications.notifications).toHaveLength(2);
    expect(notifications.notifications.map((n) => n.userId)).toEqual(
      expect.arrayContaining(['admin-user', 'user-alex']),
    );
  });

  it('refuses a transfer from a non-admin', async () => {
    const memberCtx: AuthContext = {
      userId: 'member-user',
      email: 'member@example.com',
      role: 'MEMBER',
      memberId: 'member-unlinked',
    };

    await expect(
      useCase.execute(memberCtx, { newAdminMemberId: 'member-unlinked' }),
    ).rejects.toMatchObject<ApiError>({
      status: 403,
      code: 'FORBIDDEN',
    });
  });
});
