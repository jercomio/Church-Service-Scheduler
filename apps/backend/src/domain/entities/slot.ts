export interface SlotEntity {
  id: string;
  teamId: string;
  dayOfWeek: number; // 0 = Sunday ... 6 = Saturday
  startTime: string; // "HH:mm"
  endTime: string; // "HH:mm"
  label: string;
  isActive: boolean;
  createdAt: Date;
}
