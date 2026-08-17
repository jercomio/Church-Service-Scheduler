import { MemberEntity } from '../entities/member';
import { Role } from '../entities/user';

export interface MemberRepository {
  findById(id: string): Promise<MemberEntity | null>;
  findByIds(ids: string[]): Promise<MemberEntity[]>;
  findByTeam(teamId: string): Promise<MemberEntity[]>;
  findByEmail(email: string): Promise<MemberEntity | null>;
  list(): Promise<MemberEntity[]>;
  create(data: {
    teamId: string;
    firstName: string;
    lastName: string;
    email?: string | null;
    isActive?: boolean;
    userId?: string | null;
  }): Promise<MemberEntity>;
  update(
    id: string,
    data: Partial<{
      firstName: string;
      lastName: string;
      email: string | null;
      phone: string | null;
      address: string | null;
      avatarUrl: string | null;
      isActive: boolean;
      userId: string | null;
      role: Role;
    }>,
  ): Promise<MemberEntity | null>;
  delete(id: string): Promise<void>;
}
