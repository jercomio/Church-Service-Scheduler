import { Member, Team, User } from '@prisma/client';
import { MemberEntity } from '../../../domain/entities/member';
import { TeamEntity } from '../../../domain/entities/team';
import { TeamRepository } from '../../../domain/repositories/team-repository';
import { prisma } from '../client';

type MemberWithUser = Member & { user: User | null };

function toEntity(row: Team): TeamEntity {
  return { id: row.id, name: row.name, createdAt: row.createdAt };
}

export class PrismaTeamRepository implements TeamRepository {
  async findById(id: string): Promise<TeamEntity | null> {
    const row = await prisma.team.findUnique({ where: { id } });
    return row ? toEntity(row) : null;
  }

  async findByMemberId(memberId: string): Promise<TeamEntity | null> {
    const row = await prisma.member.findUnique({
      where: { id: memberId },
      include: { team: true },
    });
    return row ? toEntity(row.team) : null;
  }

  async findFirst(): Promise<TeamEntity | null> {
    const row = await prisma.team.findFirst({ orderBy: { createdAt: 'asc' } });
    return row ? toEntity(row) : null;
  }

  async create(name: string): Promise<TeamEntity> {
    const row = await prisma.team.create({ data: { name } });
    return toEntity(row);
  }
}

export function toMemberEntity(row: MemberWithUser): MemberEntity {
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
    role: row.user?.role ?? 'MEMBER',
    createdAt: row.createdAt,
  };
}
