import { Role } from '@css/shared';

/** Authenticated request context populated by the auth guard middleware. */
export interface AuthContext {
  userId: string;
  email: string;
  role: Role;
  memberId: string | null;
}

/** True for roles that manage the team (slots, shifts, members, roster). */
export function isManagerRole(role: Role): boolean {
  return role === 'ADMIN' || role === 'COORDINATOR';
}
