import { z } from 'zod';
import { TIME_PATTERN } from '../constants';

const slotFields = z.object({
  dayOfWeek: z.number().int().min(0).max(6),
  startTime: z.string().regex(TIME_PATTERN, 'startTime must match HH:mm'),
  endTime: z.string().regex(TIME_PATTERN, 'endTime must match HH:mm'),
  label: z.string().min(1, 'Label is required').max(120),
  isActive: z.boolean().optional(),
});

function validateOrder(value: { startTime?: string; endTime?: string }, ctx: z.RefinementCtx): void {
  if (value.startTime && value.endTime && value.startTime >= value.endTime) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'startTime must be before endTime',
      path: ['endTime'],
    });
  }
}

export const slotSchema = slotFields.superRefine(validateOrder);
export const slotUpdateSchema = slotFields.partial().superRefine(validateOrder);

export type SlotInput = z.infer<typeof slotSchema>;
export type SlotUpdateInput = z.infer<typeof slotUpdateSchema>;
