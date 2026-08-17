import { Feature } from '@prisma/client';
import {
  FeatureEntity,
  FeatureUserOverride,
} from '../../../domain/entities/feature';
import { FeatureRepository } from '../../../domain/repositories/feature-repository';
import { prisma } from '../client';

function toEntity(row: Feature): FeatureEntity {
  return {
    id: row.id,
    key: row.key,
    name: row.name,
    description: row.description,
    enabled: row.enabled,
    tier: row.tier,
  };
}

export class PrismaFeatureRepository implements FeatureRepository {
  async findById(id: string): Promise<FeatureEntity | null> {
    const row = await prisma.feature.findUnique({ where: { id } });
    return row ? toEntity(row) : null;
  }

  async findByKey(key: string): Promise<FeatureEntity | null> {
    const row = await prisma.feature.findUnique({ where: { key } });
    return row ? toEntity(row) : null;
  }

  async list(): Promise<FeatureEntity[]> {
    const rows = await prisma.feature.findMany({ orderBy: { key: 'asc' } });
    return rows.map(toEntity);
  }

  async listEnabled(): Promise<FeatureEntity[]> {
    const rows = await prisma.feature.findMany({ where: { enabled: true } });
    return rows.map(toEntity);
  }

  async findOverride(featureId: string, userId: string): Promise<FeatureUserOverride | null> {
    const row = await prisma.featureUser.findUnique({
      where: { featureId_userId: { featureId, userId } },
    });
    return row ? { featureId: row.featureId, userId: row.userId, enabled: row.enabled } : null;
  }

  async listOverridesForUser(userId: string): Promise<FeatureUserOverride[]> {
    const rows = await prisma.featureUser.findMany({ where: { userId } });
    return rows.map((row) => ({ featureId: row.featureId, userId: row.userId, enabled: row.enabled }));
  }

  async setOverride(featureId: string, userId: string, enabled: boolean): Promise<FeatureUserOverride> {
    const row = await prisma.featureUser.upsert({
      where: { featureId_userId: { featureId, userId } },
      update: { enabled },
      create: { featureId, userId, enabled },
    });
    return { featureId: row.featureId, userId: row.userId, enabled: row.enabled };
  }
}
