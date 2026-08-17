import { FeatureDto } from '@css/shared';
import { FeatureRepository } from '../../../domain/repositories/feature-repository';
import { isFeatureEnabled } from '../../../domain/entities/feature';
import { AuthContext } from '../../auth-context';
import { toFeatureDto } from '../../mappers';

/** FLAG-03 — effective feature flags for the authenticated user. */
export class GetUserFeaturesUseCase {
  constructor(private readonly features: FeatureRepository) {}

  async execute(ctx: AuthContext): Promise<FeatureDto[]> {
    const [all, overrides] = await Promise.all([
      this.features.list(),
      this.features.listOverridesForUser(ctx.userId),
    ]);
    const overrideByFeature = new Map(overrides.map((o) => [o.featureId, o]));

    return all
      .filter((feature) => isFeatureEnabled(feature, overrideByFeature.get(feature.id)))
      .map((feature) => toFeatureDto(feature, isFeatureEnabled(feature, overrideByFeature.get(feature.id))));
  }
}
