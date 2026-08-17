import { z } from 'zod';
import { ROLE } from '../constants';

export const memberSchema = z.object({
  firstName: z.string().min(1, 'First name is required').max(100),
  lastName: z.string().min(1, 'Last name is required').max(100),
  email: z.string().email('A valid email is required').optional().or(z.literal('')),
  role: z.enum([ROLE.COORDINATOR, ROLE.MEMBER]).optional(),
  isActive: z.boolean().optional(),
  phone: z.string().max(50).optional().or(z.literal('')),
  address: z.string().max(300).optional().or(z.literal('')),
  avatarUrl: z.string().max(2_000_000).optional().or(z.literal('')),
});

export const memberUpdateSchema = memberSchema.partial();

export type MemberInput = z.infer<typeof memberSchema>;
export type MemberUpdateInput = z.infer<typeof memberUpdateSchema>;
