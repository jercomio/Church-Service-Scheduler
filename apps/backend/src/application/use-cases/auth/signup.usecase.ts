import { ApiError, AuthResponseDto, SignupInput } from '@css/shared';
import { AuthProvider } from '../../ports/auth-provider';
import { MemberRepository } from '../../../domain/repositories/member-repository';
import { SlotRepository } from '../../../domain/repositories/slot-repository';
import { TeamRepository } from '../../../domain/repositories/team-repository';
import { UserRepository } from '../../../domain/repositories/user-repository';

/**
 * AUTH-03 — Register: creates the auth identity, the local User (COORDINATOR),
 * and joins/creates the team + default member profile. Default slots are seeded
 * for a brand-new team (SLOT-02).
 */
export class SignupUseCase {
  constructor(
    private readonly authProvider: AuthProvider,
    private readonly users: UserRepository,
    private readonly teams: TeamRepository,
    private readonly members: MemberRepository,
    private readonly slots: SlotRepository,
  ) {}

  async execute(input: SignupInput): Promise<AuthResponseDto> {
    const existing = await this.users.findByEmail(input.email);
    if (existing) {
      throw new ApiError('EMAIL_TAKEN', 409, 'An account with this email already exists');
    }

    const signUp = await this.authProvider.signUp(input.email, input.password);

    // The dev provider creates the local User itself (to store the password
    // hash); the Supabase provider leaves it to us (backfill on first login).
    const user =
      (await this.users.findByEmail(signUp.email)) ??
      (await this.users.create({
        id: signUp.userId,
        email: signUp.email,
        role: 'COORDINATOR',
      }));

    const team =
      (await this.teams.findFirst()) ?? (await this.teams.create(input.teamName ?? 'Video Team'));

    const teamSlots = await this.slots.findByTeam(team.id);
    if (teamSlots.length === 0) {
      await this.slots.createDefaults(team.id);
    }

    await this.members.create({
      teamId: team.id,
      firstName: input.firstName,
      lastName: input.lastName,
      email: input.email,
      userId: user.id,
      isActive: true,
    });

    return { token: signUp.accessToken, user: { id: user.id, email: user.email, role: user.role } };
  }
}
