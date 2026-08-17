import { Shift } from '@prisma/client';
import { ShiftEntity } from '../../../domain/entities/shift';
import { ShiftRepository } from '../../../domain/repositories/shift-repository';
import { prisma } from '../client';

function toEntity(row: Shift): ShiftEntity {
  return {
    id: row.id,
    slotId: row.slotId,
    memberId: row.memberId,
    date: row.date,
    createdAt: row.createdAt,
  };
}

function dayBounds(date: Date): { gte: Date; lt: Date } {
  const gte = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  const lt = new Date(gte.getTime() + 86_400_000);
  return { gte, lt };
}

export class PrismaShiftRepository implements ShiftRepository {
  async findById(id: string): Promise<ShiftEntity | null> {
    const row = await prisma.shift.findUnique({ where: { id } });
    return row ? toEntity(row) : null;
  }

  async findBySlotId(slotId: string): Promise<ShiftEntity[]> {
    const rows = await prisma.shift.findMany({ where: { slotId } });
    return rows.map(toEntity);
  }

  async findByMemberId(memberId: string): Promise<ShiftEntity[]> {
    const rows = await prisma.shift.findMany({ where: { memberId } });
    return rows.map(toEntity);
  }

  async findByDateRange(from: Date, to: Date): Promise<ShiftEntity[]> {
    const rows = await prisma.shift.findMany({
      where: { date: { gte: from, lte: to } },
      orderBy: { date: 'asc' },
    });
    return rows.map(toEntity);
  }

  async findForMemberInRange(memberId: string, from: Date, to: Date): Promise<ShiftEntity[]> {
    const rows = await prisma.shift.findMany({
      where: { memberId, date: { gte: from, lte: to } },
      orderBy: { date: 'asc' },
    });
    return rows.map(toEntity);
  }

  async findBySlotAndDate(slotId: string, date: Date): Promise<ShiftEntity | null> {
    const { gte, lt } = dayBounds(date);
    const row = await prisma.shift.findFirst({ where: { slotId, date: { gte, lt } } });
    return row ? toEntity(row) : null;
  }

  async findByMemberAndDate(memberId: string, date: Date): Promise<ShiftEntity[]> {
    const { gte, lt } = dayBounds(date);
    const rows = await prisma.shift.findMany({ where: { memberId, date: { gte, lt } } });
    return rows.map(toEntity);
  }

  async countByMemberIds(memberIds: string[]): Promise<Map<string, number>> {
    if (memberIds.length === 0) return new Map();
    const rows = await prisma.shift.groupBy({
      by: ['memberId'],
      where: { memberId: { in: memberIds } },
      _count: { _all: true },
    });
    return new Map(rows.map((row) => [row.memberId, row._count._all]));
  }

  async create(data: { slotId: string; memberId: string; date: Date }): Promise<ShiftEntity> {
    const row = await prisma.shift.create({ data });
    return toEntity(row);
  }

  async update(
    id: string,
    data: Partial<{ slotId: string; memberId: string; date: Date }>,
  ): Promise<ShiftEntity | null> {
    const row = await prisma.shift.update({ where: { id }, data });
    return toEntity(row);
  }

  async delete(id: string): Promise<ShiftEntity | null> {
    try {
      const row = await prisma.shift.delete({ where: { id } });
      return toEntity(row);
    } catch {
      return null;
    }
  }
}
