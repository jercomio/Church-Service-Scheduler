import { ShiftEntity } from '../entities/shift';

export interface ShiftRepository {
  findById(id: string): Promise<ShiftEntity | null>;
  findBySlotId(slotId: string): Promise<ShiftEntity[]>;
  findByMemberId(memberId: string): Promise<ShiftEntity[]>;
  findByDateRange(from: Date, to: Date): Promise<ShiftEntity[]>;
  findForMemberInRange(memberId: string, from: Date, to: Date): Promise<ShiftEntity[]>;
  findBySlotAndDate(slotId: string, date: Date): Promise<ShiftEntity | null>;
  findByMemberAndDate(memberId: string, date: Date): Promise<ShiftEntity[]>;
  countByMemberIds(memberIds: string[]): Promise<Map<string, number>>;
  create(data: { slotId: string; memberId: string; date: Date }): Promise<ShiftEntity>;
  update(
    id: string,
    data: Partial<{ slotId: string; memberId: string; date: Date }>,
  ): Promise<ShiftEntity | null>;
  delete(id: string): Promise<ShiftEntity | null>;
}
