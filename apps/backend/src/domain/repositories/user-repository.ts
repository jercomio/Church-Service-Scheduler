import { UserEntity, Role } from '../entities/user';
import { MemberEntity } from '../entities/member';

export interface UserCredentials {
  id: string;
  email: string;
  passwordHash: string | null;
}

export interface UserRepository {
  findById(id: string): Promise<UserEntity | null>;
  findByEmail(email: string): Promise<UserEntity | null>;
  findCredentialsByEmail(email: string): Promise<UserCredentials | null>;
  create(data: {
    id: string;
    email: string;
    role: Role;
    passwordHash?: string | null;
  }): Promise<UserEntity>;
  updateRole(userId: string, role: Role): Promise<UserEntity>;
  delete(id: string): Promise<void>;
  /** Loads the member record linked to a user, if any. */
  findMemberByUserId(userId: string): Promise<MemberEntity | null>;
}
