import { Role } from './user';

export interface MemberEntity {
  id: string;
  teamId: string;
  userId: string | null;
  firstName: string;
  lastName: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  avatarUrl: string | null;
  isActive: boolean;
  role: Role;
  createdAt: Date;
}
