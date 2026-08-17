import { Slot } from '@prisma/client';
import { DEFAULT_SLOTS } from '@css/shared';
import { SlotEntity } from '../../../domain/entities/slot';
import { SlotRepository } from '../../../domain/repositories/slot-repository';
import { prisma } from '../client';

function toEntity(row: Slot): SlotEntity {
  return {
    id: row.id,
    teamId: row.teamId,
    dayOfWeek: row.dayOfWeek,
    startTime: row.startTime,
    endTime: row.endTime,
    label: row.label,
    isActive: row.isActive,
    createdAt: row.createdAt,
  };
}

export class PrismaSlotRepository implements SlotRepository {
  async findById(id: string): Promise<SlotEntity | null> {
    const row = await prisma.slot.findUnique({ where: { id } });
    return row ? toEntity(row) : null;
  }

  async findByTeam(teamId: string): Promise<SlotEntity[]> {
    const rows = await prisma.slot.findMany({
      where: { teamId },
      orderBy: [{ dayOfWeek: 'asc' }, { startTime: 'asc' }],
    });
    return rows.map(toEntity);
  }

  async list(): Promise<SlotEntity[]> {
    const rows = await prisma.slot.findMany();
    return rows.map(toEntity);
  }

  async create(data: {
    teamId: string;
    dayOfWeek: number;
    startTime: string;
    endTime: string;
    label: string;
    isActive?: boolean;
  }): Promise<SlotEntity> {
    const row = await prisma.slot.create({ data });
    return toEntity(row);
  }

  async update(
    id: string,
    data: Partial<{
      dayOfWeek: number;
      startTime: string;
      endTime: string;
      label: string;
      isActive: boolean;
    }>,
  ): Promise<SlotEntity | null> {
    const row = await prisma.slot.update({ where: { id }, data });
    return toEntity(row);
  }

  async delete(id: string): Promise<void> {
    await prisma.slot.delete({ where: { id } });
  }

  async createDefaults(teamId: string): Promise<SlotEntity[]> {
    await prisma.slot.createMany({
      data: DEFAULT_SLOTS.map((slot) => ({ teamId, ...slot })),
      skipDuplicates: true,
    });
    return this.findByTeam(teamId);
  }
}
