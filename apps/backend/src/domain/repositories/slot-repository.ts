import { SlotEntity } from '../entities/slot';

export interface SlotRepository {
  findById(id: string): Promise<SlotEntity | null>;
  findByTeam(teamId: string): Promise<SlotEntity[]>;
  list(): Promise<SlotEntity[]>;
  create(data: {
    teamId: string;
    dayOfWeek: number;
    startTime: string;
    endTime: string;
    label: string;
    isActive?: boolean;
  }): Promise<SlotEntity>;
  update(
    id: string,
    data: Partial<{
      dayOfWeek: number;
      startTime: string;
      endTime: string;
      label: string;
      isActive: boolean;
    }>,
  ): Promise<SlotEntity | null>;
  delete(id: string): Promise<void>;
  /** Seed the default slots (Sunday morning + Wednesday evening) for a new team. */
  createDefaults(teamId: string): Promise<SlotEntity[]>;
}
