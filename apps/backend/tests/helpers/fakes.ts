import { randomUUID } from 'node:crypto';
import { MemberEntity } from '../../src/domain/entities/member';
import { SlotEntity } from '../../src/domain/entities/slot';
import { ShiftEntity } from '../../src/domain/entities/shift';
import { NotificationEntity } from '../../src/domain/entities/notification';
import { Role, UserEntity } from '../../src/domain/entities/user';
import { MemberRepository } from '../../src/domain/repositories/member-repository';
import { TeamEntity } from '../../src/domain/entities/team';
import { TeamRepository } from '../../src/domain/repositories/team-repository';
import { SlotRepository } from '../../src/domain/repositories/slot-repository';
import { ShiftRepository } from '../../src/domain/repositories/shift-repository';
import { NotificationRepository } from '../../src/domain/repositories/notification-repository';
import { UserRepository } from '../../src/domain/repositories/user-repository';
import { EmailProvider } from '../../src/application/ports/email-provider';
import { isSameDay } from '../../src/domain/services/date-utils';

export class InMemoryUserRepository implements UserRepository {
  users = new Map<string, UserEntity>();
  membersByUser = new Map<string, MemberEntity>();

  async findById(id: string) {
    return this.users.get(id) ?? null;
  }

  async findByEmail(email: string) {
    return [...this.users.values()].find((u) => u.email === email) ?? null;
  }

  async findCredentialsByEmail(email: string) {
    const user = await this.findByEmail(email);
    return user ? { id: user.id, email: user.email, passwordHash: null } : null;
  }

  async create(data: { id: string; email: string; role: 'COORDINATOR' | 'MEMBER'; passwordHash?: string | null }) {
    const user: UserEntity = { id: data.id, email: data.email, role: data.role, createdAt: new Date() };
    this.users.set(user.id, user);
    return user;
  }

  async updateRole(userId: string, role: 'COORDINATOR' | 'MEMBER') {
    const user = this.users.get(userId);
    if (!user) throw new Error('not found');
    const updated = { ...user, role };
    this.users.set(userId, updated);
    return updated;
  }

  async delete(id: string) {
    this.users.delete(id);
  }

  async findMemberByUserId(userId: string) {
    return this.membersByUser.get(userId) ?? null;
  }
}

export class InMemoryTeamRepository implements TeamRepository {
  teams = new Map<string, TeamEntity>();
  membersByTeam = new Map<string, string[]>();

  seed(team: TeamEntity) {
    this.teams.set(team.id, team);
  }

  async findById(id: string) {
    return this.teams.get(id) ?? null;
  }

  async findByMemberId(memberId: string) {
    for (const [teamId, memberIds] of this.membersByTeam) {
      if (memberIds.includes(memberId)) return this.teams.get(teamId) ?? null;
    }
    return null;
  }

  async findFirst() {
    return this.teams.values().next().value ?? null;
  }

  async create(name: string) {
    const team: TeamEntity = { id: randomUUID(), name, createdAt: new Date() };
    this.teams.set(team.id, team);
    return team;
  }
}

export class InMemoryMemberRepository implements MemberRepository {
  members = new Map<string, MemberEntity>();

  seed(...members: MemberEntity[]) {
    for (const member of members) this.members.set(member.id, member);
  }

  async findById(id: string) {
    return this.members.get(id) ?? null;
  }

  async findByIds(ids: string[]) {
    return ids.map((id) => this.members.get(id)).filter((m): m is MemberEntity => !!m);
  }

  async findByTeam(teamId: string) {
    return [...this.members.values()].filter((m) => m.teamId === teamId);
  }

  async findByEmail(email: string) {
    return [...this.members.values()].find((m) => m.email === email) ?? null;
  }

  async list() {
    return [...this.members.values()];
  }

  async create(data: { teamId: string; firstName: string; lastName: string; email?: string | null; isActive?: boolean; userId?: string | null }) {
    const member: MemberEntity = {
      id: randomUUID(),
      teamId: data.teamId,
      userId: data.userId ?? null,
      firstName: data.firstName,
      lastName: data.lastName,
      email: data.email ?? null,
      isActive: data.isActive ?? true,
      role: 'MEMBER',
      createdAt: new Date(),
    };
    this.members.set(member.id, member);
    return member;
  }

  async update(id: string, data: Partial<{ firstName: string; lastName: string; email: string | null; isActive: boolean; userId: string | null; role: Role }>) {
    const current = this.members.get(id);
    if (!current) return null;
    const updated = { ...current, ...data };
    this.members.set(id, updated);
    return updated;
  }

  async delete(id: string) {
    this.members.delete(id);
  }
}

export class InMemorySlotRepository implements SlotRepository {
  slots = new Map<string, SlotEntity>();

  seed(...slots: SlotEntity[]) {
    for (const slot of slots) this.slots.set(slot.id, slot);
  }

  async findById(id: string) {
    return this.slots.get(id) ?? null;
  }

  async findByTeam(teamId: string) {
    return [...this.slots.values()].filter((s) => s.teamId === teamId);
  }

  async list() {
    return [...this.slots.values()];
  }

  async create(data: { teamId: string; dayOfWeek: number; startTime: string; endTime: string; label: string; isActive?: boolean }) {
    const slot: SlotEntity = { id: randomUUID(), ...data, isActive: data.isActive ?? true, createdAt: new Date() };
    this.slots.set(slot.id, slot);
    return slot;
  }

  async update(id: string, data: Partial<{ dayOfWeek: number; startTime: string; endTime: string; label: string; isActive: boolean }>) {
    const current = this.slots.get(id);
    if (!current) return null;
    const updated = { ...current, ...data };
    this.slots.set(id, updated);
    return updated;
  }

  async delete(id: string) {
    this.slots.delete(id);
  }

  async createDefaults(teamId: string) {
    const defaults = [
      { dayOfWeek: 0, startTime: '09:00', endTime: '12:00', label: 'Sunday Morning Worship' },
      { dayOfWeek: 3, startTime: '19:00', endTime: '21:00', label: 'Wednesday Bible Study' },
    ];
    return Promise.all(defaults.map((d) => this.create({ teamId, ...d })));
  }
}

export class InMemoryShiftRepository implements ShiftRepository {
  shifts: ShiftEntity[] = [];

  seed(...shifts: ShiftEntity[]) {
    this.shifts.push(...shifts);
  }

  async findById(id: string) {
    return this.shifts.find((s) => s.id === id) ?? null;
  }

  async findBySlotId(slotId: string) {
    return this.shifts.filter((s) => s.slotId === slotId);
  }

  async findByMemberId(memberId: string) {
    return this.shifts.filter((s) => s.memberId === memberId);
  }

  async findByDateRange(from: Date, to: Date) {
    return this.shifts.filter((s) => s.date >= from && s.date <= to);
  }

  async findForMemberInRange(memberId: string, from: Date, to: Date) {
    return this.shifts.filter((s) => s.memberId === memberId && s.date >= from && s.date <= to);
  }

  async findBySlotAndDate(slotId: string, date: Date) {
    return this.shifts.find((s) => s.slotId === slotId && isSameDay(s.date, date)) ?? null;
  }

  async findByMemberAndDate(memberId: string, date: Date) {
    return this.shifts.filter((s) => s.memberId === memberId && isSameDay(s.date, date));
  }

  async create(data: { slotId: string; memberId: string; date: Date }) {
    const shift: ShiftEntity = { id: randomUUID(), createdAt: new Date(), ...data };
    this.shifts.push(shift);
    return shift;
  }

  async update(id: string, data: Partial<{ slotId: string; memberId: string; date: Date }>) {
    const index = this.shifts.findIndex((s) => s.id === id);
    if (index === -1) return null;
    this.shifts[index] = { ...this.shifts[index], ...data };
    return this.shifts[index];
  }

  async delete(id: string) {
    const index = this.shifts.findIndex((s) => s.id === id);
    if (index === -1) return null;
    const [removed] = this.shifts.splice(index, 1);
    return removed ?? null;
  }
}

export class InMemoryNotificationRepository implements NotificationRepository {
  notifications: NotificationEntity[] = [];

  async findById(id: string) {
    return this.notifications.find((n) => n.id === id) ?? null;
  }

  async listForUser(userId: string) {
    return this.notifications.filter((n) => n.userId === userId);
  }

  async countUnread(userId: string) {
    return this.notifications.filter((n) => n.userId === userId && n.readAt === null).length;
  }

  async create(data: { userId: string; title: string; body: string }) {
    const notification: NotificationEntity = { id: randomUUID(), createdAt: new Date(), readAt: null, ...data };
    this.notifications.push(notification);
    return notification;
  }

  async markAsRead(id: string) {
    const index = this.notifications.findIndex((n) => n.id === id);
    if (index === -1) return null;
    this.notifications[index] = { ...this.notifications[index], readAt: new Date() };
    return this.notifications[index];
  }

  async markAllAsRead(userId: string) {
    let count = 0;
    this.notifications = this.notifications.map((n) => {
      if (n.userId === userId && n.readAt === null) {
        count += 1;
        return { ...n, readAt: new Date() };
      }
      return n;
    });
    return count;
  }
}

export class RecordingEmailProvider implements EmailProvider {
  sent: Array<{ to: string; subject: string }> = [];

  async send(message: { to: string; subject: string; html: string; text?: string }) {
    this.sent.push({ to: message.to, subject: message.subject });
  }
}
