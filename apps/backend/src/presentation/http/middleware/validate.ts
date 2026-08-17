import { NextFunction, Request, Response, RequestHandler } from 'express';
import { ZodType } from 'zod';
import { ApiError } from '@css/shared';

export type AsyncHandler = (req: Request, res: Response, next: NextFunction) => Promise<unknown>;

export function asyncHandler(fn: AsyncHandler): RequestHandler {
  return (req, res, next) => {
    fn(req, res, next).catch(next);
  };
}

/** Validates the request payload against a Zod schema, else 400 VALIDATION_ERROR. */
export function validateBody<T>(schema: ZodType<T>): RequestHandler {
  return (req, _res, next) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      next(
        new ApiError('VALIDATION_ERROR', 400, 'Invalid request payload', {
          issues: result.error.issues,
        }),
      );
      return;
    }
    req.body = result.data;
    next();
  };
}

/** Validates query parameters against a Zod schema (unknown keys stripped). */
export function validateQuery<T>(schema: ZodType<T>): RequestHandler {
  return (req, _res, next) => {
    const result = schema.safeParse(req.query);
    if (!result.success) {
      next(
        new ApiError('VALIDATION_ERROR', 400, 'Invalid query parameters', {
          issues: result.error.issues,
        }),
      );
      return;
    }
    req.query = result.data as Request['query'];
    next();
  };
}

/** Validates a path parameter with a simple predicate. */
export function validateParam(name: string, predicate: (value: string) => boolean): RequestHandler {
  return (req, _res, next) => {
    const value = req.params[name];
    if (!value || !predicate(value)) {
      next(new ApiError('VALIDATION_ERROR', 400, `Invalid ${name} parameter`));
      return;
    }
    next();
  };
}
