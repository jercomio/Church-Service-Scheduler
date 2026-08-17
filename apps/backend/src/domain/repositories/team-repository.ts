import { TeamEntity } from '../entities/team';

export interface TeamRepository {
  findById(id: string): Promise<TeamEntity | null>;
  findByMemberId(memberId: string): Promise<TeamEntity | null>;
  findFirst(): Promise<TeamEntity | null>;
  create(name: string): Promise<TeamEntity>;
}
