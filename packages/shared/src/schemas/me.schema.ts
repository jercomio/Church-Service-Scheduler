import { z } from 'zod';
import { ROLE } from '../constants';

export const transferAdminSchema = z.object({
  newAdminMemberId: z.string().min(1, 'A new admin member is required'),
});

export const changeRoleSchema = z.object({
  role: z.enum([ROLE.COORDINATOR, ROLE.MEMBER]),
});

export const deleteNotificationsSchema = z.object({
  ids: z.array(z.string().min(1)).min(1, 'At least one notification is required'),
});

export type TransferAdminInput = z.infer<typeof transferAdminSchema>;
export type ChangeRoleInput = z.infer<typeof changeRoleSchema>;
export type DeleteNotificationsInput = z.infer<typeof deleteNotificationsSchema>;
