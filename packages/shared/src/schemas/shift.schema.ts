import { z } from 'zod';

export const createShiftSchema = z.object({
  slotId: z.string().min(1, 'slotId is required'),
  memberId: z.string().min(1, 'memberId is required'),
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'date must match YYYY-MM-DD')
    .refine((value) => !Number.isNaN(Date.parse(value)), 'date must be a valid date'),
});

export const batchCreateShiftSchema = z.object({
  slotId: z.string().min(1, 'slotId is required'),
  memberIds: z.array(z.string().min(1)).min(1, 'At least one member is required'),
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'date must match YYYY-MM-DD')
    .refine((value) => !Number.isNaN(Date.parse(value)), 'date must be a valid date'),
});

export const updateShiftSchema = z
  .object({
    slotId: z.string().min(1).optional(),
    memberId: z.string().min(1).optional(),
    date: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, 'date must match YYYY-MM-DD')
      .refine((value) => !Number.isNaN(Date.parse(value)), 'date must be a valid date')
      .optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: 'At least one field must be provided',
  });

export const suggestShiftSchema = z.object({
  slotId: z.string().min(1, 'slotId is required'),
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'date must match YYYY-MM-DD')
    .refine((value) => !Number.isNaN(Date.parse(value)), 'date must be a valid date'),
});

export const weekQuerySchema = z.object({
  week: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  month: z.string().regex(/^\d{4}-\d{2}$/).optional(),
});

export type CreateShiftInput = z.infer<typeof createShiftSchema>;
export type BatchCreateShiftInput = z.infer<typeof batchCreateShiftSchema>;
export type UpdateShiftInput = z.infer<typeof updateShiftSchema>;
export type SuggestShiftInput = z.infer<typeof suggestShiftSchema>;
