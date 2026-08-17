import type { Role } from '@css/shared';

export interface RouteConfig {
  path: string;
  requireAuth: boolean;
  roles?: Role[];
  requiredFeature?: string;
}

export const ROUTES_MANIFEST: RouteConfig[] = [
  { path: '/login', requireAuth: false },
  { path: '/signup', requireAuth: false },
  { path: '/magic-link', requireAuth: false },
  { path: '/reset-password', requireAuth: false },
  { path: '/', requireAuth: true },
  { path: '/planning', requireAuth: true, roles: ['COORDINATOR', 'ADMIN'], requiredFeature: 'month-view' },
  { path: '/notifications', requireAuth: true },
  { path: '/members', requireAuth: true, roles: ['COORDINATOR', 'ADMIN'] },
  { path: '/slots', requireAuth: true, roles: ['COORDINATOR', 'ADMIN'] },
  { path: '/settings', requireAuth: true },
];

export function getRouteConfig(path: string): RouteConfig | undefined {
  const normalized = path === '/' ? '/' : path.replace(/\/$/, '');
  const match = ROUTES_MANIFEST.find((route) => route.path === normalized);
  if (match) return match;
  return ROUTES_MANIFEST.find((route) => route.path.startsWith('/') && normalized.startsWith(`${route.path}/`));
}
