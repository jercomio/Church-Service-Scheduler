export interface FeatureEntity {
  id: string;
  key: string;
  name: string;
  description: string | null;
  enabled: boolean;
  tier: string | null;
}

export interface FeatureUserOverride {
  featureId: string;
  userId: string;
  enabled: boolean;
}

/** Effective flag value: user override wins, falls back to global feature flag. */
export function isFeatureEnabled(feature: FeatureEntity, override?: FeatureUserOverride): boolean {
  if (override) return override.enabled;
  return feature.enabled;
}
