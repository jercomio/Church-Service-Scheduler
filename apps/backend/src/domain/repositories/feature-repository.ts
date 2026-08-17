import { FeatureEntity, FeatureUserOverride } from '../entities/feature';

export interface FeatureRepository {
  findById(id: string): Promise<FeatureEntity | null>;
  findByKey(key: string): Promise<FeatureEntity | null>;
  list(): Promise<FeatureEntity[]>;
  listEnabled(): Promise<FeatureEntity[]>;
  findOverride(featureId: string, userId: string): Promise<FeatureUserOverride | null>;
  listOverridesForUser(userId: string): Promise<FeatureUserOverride[]>;
  setOverride(featureId: string, userId: string, enabled: boolean): Promise<FeatureUserOverride>;
}
