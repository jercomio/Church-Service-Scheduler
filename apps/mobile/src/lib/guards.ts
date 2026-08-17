import { usePathname } from 'expo-router';
import { useMemo } from 'react';
import type { UserDto } from '@css/shared';
import { getRouteConfig } from '@/constants/routes.manifest';
import type { SuggestMember } from '@/hooks/queries';

export interface AccessDecision {
  allowed: boolean;
  redirectTo?: '/login' | '/' | '/not-found';
  reason?: 'unauthenticated' | 'role' | 'feature';
}

export function canAccess(
  pathname: string,
  opts: {
    user: UserDto | null;
    features: Record<string, boolean>;
  },
): AccessDecision {
  const config = getRouteConfig(pathname);

  if (!config) {
    return { allowed: true };
  }

  if (config.requireAuth && !opts.user) {
    return { allowed: false, redirectTo: '/login', reason: 'unauthenticated' };
  }

  if (!config.requireAuth && opts.user) {
    return { allowed: false, redirectTo: '/', reason: 'unauthenticated' };
  }

  if (config.roles && opts.user && !config.roles.includes(opts.user.role)) {
    return { allowed: false, redirectTo: '/', reason: 'role' };
  }

  if (config.requiredFeature && !opts.features[config.requiredFeature]) {
    return { allowed: false, redirectTo: '/', reason: 'feature' };
  }

  return { allowed: true };
}

export function useAccessDecision(
  user: UserDto | null,
  features: Record<string, boolean>,
): AccessDecision {
  const pathname = usePathname();
  return useMemo(
    () => canAccess(pathname, { user, features }),
    [pathname, user, features],
  );
}

export function sortCandidates(a: SuggestMember, b: SuggestMember): number {
  return a.score - b.score || a.totalShifts - b.totalShifts;
}
