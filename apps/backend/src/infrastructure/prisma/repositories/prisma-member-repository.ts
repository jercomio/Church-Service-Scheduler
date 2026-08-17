import { Member, Role, User } from '@prisma/client';
import { MemberEntity } from '../../../domain/entities/member';
import { MemberRepository } from '../../../domain/repositories/member-repository';
import { prisma } from '../client';

type MemberRow = Member & { user: User | null };

function toEntity(row: MemberRow): MemberEntity {
  return {
    id: row.id,
    teamId: row.teamId,
    userId: row.userId,
    firstName: row.firstName,
    lastName: row.lastName,
    email: row.email,
    phone: row.phone,
    address: row.address,
    avatarUrl: row.avatarUrl,
    isActive: row.isActive,
    role: row.user?.role ?? row.role,
    createdAt: row.createdAt,
  };
}

const includeUser = { user: true } as const;

export class PrismaMemberRepository implements MemberRepository {
  async findById(id: string): Promise<MemberEntity | null> {
    const row = await prisma.member.findUnique({ where: { id }, include: includeUser });
    return row ? toEntity(row) : null;
  }

  async findByIds(ids: string[]): Promise<MemberEntity[]> {
    const rows = await prisma.member.findMany({ where: { id: { in: ids } }, include: includeUser });
    return rows.map(toEntity);
  }

  async findByTeam(teamId: string): Promise<MemberEntity[]> {
    const rows = await prisma.member.findMany({
      where: { teamId },
      include: includeUser,
      orderBy: [{ firstName: 'asc' }],
    });
    return rows.map(toEntity);
  }

  async findByEmail(email: string): Promise<MemberEntity | null> {
    const row = await prisma.member.findFirst({ where: { email }, include: includeUser });
    return row ? toEntity(row) : null;
  }

  async list(): Promise<MemberEntity[]> {
    const rows = await prisma.member.findMany({ include: includeUser });
    return rows.map(toEntity);
  }

  async create(data: {
    teamId: string;
    firstName: string;
    lastName: string;
    email?: string | null;
    isActive?: boolean;
    userId?: string | null;
  }): Promise<MemberEntity> {
    const row = await prisma.member.create({
      data: {
        teamId: data.teamId,
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email ?? null,
        isActive: data.isActive ?? true,
        userId: data.userId ?? null,
      },
      include: includeUser,
    });
    return toEntity(row);
  }

  async update(
    id: string,
    data: Partial<{
      firstName: string;
      lastName: string;
      email: string | null;
      phone: string | null;
      address: string | null;
      avatarUrl: string | null;
      isActive: boolean;
      userId: string | null;
      role: Role;
    }>,
  ): Promise<MemberEntity | null> {
    const row = await prisma.member.update({ where: { id }, data, include: includeUser });
    return toEntity(row);
  }

  async delete(id: string): Promise<void> {
    await prisma.member.delete({ where: { id } });
  }
}
