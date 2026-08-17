import { ShiftReminderRepository } from '../../../domain/repositories/shift-reminder-repository';
import { prisma } from '../client';

export class PrismaShiftReminderRepository implements ShiftReminderRepository {
  async exists(shiftId: string, daysBefore: number): Promise<boolean> {
    const count = await prisma.shiftReminder.count({
      where: { shiftId, daysBefore },
    });
    return count > 0;
  }

  async create(shiftId: string, daysBefore: number): Promise<void> {
    await prisma.shiftReminder.create({ data: { shiftId, daysBefore } });
  }
}
