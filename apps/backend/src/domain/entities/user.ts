export type Role = 'ADMIN' | 'COORDINATOR' | 'MEMBER';

export interface UserEntity {
  id: string;
  email: string;
  role: Role;
  createdAt: Date;
}
