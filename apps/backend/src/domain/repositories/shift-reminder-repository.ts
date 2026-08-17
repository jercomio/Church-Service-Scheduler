export interface ShiftReminderRepository {
  exists(shiftId: string, daysBefore: number): Promise<boolean>;
  create(shiftId: string, daysBefore: number): Promise<void>;
}
