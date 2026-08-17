import { describe, expect, it } from 'vitest';
import { isFeatureEnabled } from '../../src/domain/entities/feature';

describe('feature flags (FLAG-01/02/03)', () => {
  const feature = {
    id: 'f1',
    key: 'auto-rotation',
    name: 'Auto rotation',
    description: null,
    enabled: true,
    tier: null,
  };

  it('falls back to the global flag without a user override', () => {
    expect(isFeatureEnabled(feature)).toBe(true);
    expect(isFeatureEnabled({ ...feature, enabled: false })).toBe(false);
  });

  it('lets a user override win', () => {
    expect(isFeatureEnabled(feature, { featureId: 'f1', userId: 'u1', enabled: false })).toBe(false);
    expect(isFeatureEnabled({ ...feature, enabled: false }, { featureId: 'f1', userId: 'u1', enabled: true })).toBe(true);
  });
});
