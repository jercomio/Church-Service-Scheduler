import { NextFunction, Request, Response } from 'express';
import { ApiError } from '@css/shared';
import { AuthProvider } from '../../../application/ports/auth-provider';
import { UserRepository } from '../../../domain/repositories/user-repository';

export type AuthDeps = {
  authProvider: AuthProvider;
  users: UserRepository;
};

/** URL-03 — protected routes require a valid bearer token (JWT verified by the auth provider). */
export function requireAuth({ authProvider, users }: AuthDeps) {
  return async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    const header = req.headers.authorization;
    const token = header?.startsWith('Bearer ') ? header.slice(7) : null;
    if (!token) {
      next(new ApiError('UNAUTHORIZED', 401, 'Authentication required'));
      return;
    }

    try {
      const authUser = await authProvider.verifyToken(token);
      const user =
        (await users.findById(authUser.id)) ??
        (await users.create({ id: authUser.id, email: authUser.email || authUser.id, role: 'MEMBER' }));
      const member = await users.findMemberByUserId(user.id);

      req.auth = {
        userId: user.id,
        email: user.email,
        role: user.role,
        memberId: member?.id ?? null,
      };
      next();
    } catch {
      next(new ApiError('UNAUTHORIZED', 401, 'Invalid or expired token'));
    }
  };
}

/** Guards a route so only ADMIN/COORDINATOR users can proceed. */
export function requireCoordinator(req: Request, _res: Response, next: NextFunction): void {
  if (req.auth?.role !== 'ADMIN' && req.auth?.role !== 'COORDINATOR') {
    next(new ApiError('FORBIDDEN', 403, 'Only coordinators and admins can perform this action'));
    return;
  }
  next();
}
