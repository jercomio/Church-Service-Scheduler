import { User } from '@prisma/client';
import { UserEntity, Role } from '../../../domain/entities/user';
import { UserRepository } from '../../../domain/repositories/user-repository';
import { prisma } from '../client';
import { toMemberEntity } from './prisma-team-repository';

function toEntity(row: User): UserEntity {
  return {
    id: row.id,
    email: row.email,
    role: row.role,
    createdAt: row.createdAt,
  };
}

export class PrismaUserRepository implements UserRepository {
  async findById(id: string): Promise<UserEntity | null> {
    const row = await prisma.user.findUnique({ where: { id } });
    return row ? toEntity(row) : null;
  }

  async findByEmail(email: string): Promise<UserEntity | null> {
    const row = await prisma.user.findUnique({ where: { email } });
    return row ? toEntity(row) : null;
  }

  async findCredentialsByEmail(email: string) {
    const row = await prisma.user.findUnique({ where: { email } });
    if (!row) return null;
    return { id: row.id, email: row.email, passwordHash: row.passwordHash };
  }

  async create(data: {
    id: string;
    email: string;
    role: Role;
    passwordHash?: string | null;
  }): Promise<UserEntity> {
    const row = await prisma.user.create({
      data: {
        id: data.id,
        email: data.email,
        role: data.role,
        passwordHash: data.passwordHash ?? null,
      },
    });
    return toEntity(row);
  }

  async updateRole(userId: string, role: Role): Promise<UserEntity> {
    const row = await prisma.user.update({ where: { id: userId }, data: { role } });
    return toEntity(row);
  }

  async delete(id: string): Promise<void> {
    await prisma.user.delete({ where: { id } });
  }

  async findMemberByUserId(userId: string) {
    const row = await prisma.member.findUnique({
      where: { userId },
      include: { user: true },
    });
    return row ? toMemberEntity(row) : null;
  }
}
