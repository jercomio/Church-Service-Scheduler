import { NextFunction, Request, Response } from 'express';
import { ApiError, ApiErrorBody } from '@css/shared';
import { ZodError } from 'zod';
import { Prisma } from '@prisma/client';
import { ShiftConflictError } from '../../../domain/services/shift-conflict.service';

function sendError(res: Response, status: number, body: ApiErrorBody): void {
  res.status(status).json(body);
}

export function notFoundHandler(req: Request, res: Response): void {
  sendError(res, 404, {
    error: { code: 'NOT_FOUND', message: `Route ${req.method} ${req.originalUrl} not found` },
  });
}

export function errorHandler(err: unknown, _req: Request, res: Response, next: NextFunction): void {
  if (res.headersSent) {
    next(err);
    return;
  }

  if (err instanceof ApiError) {
    sendError(res, err.status, {
      error: { code: err.code, message: err.message, details: err.details },
    });
    return;
  }

  if (err instanceof ZodError) {
    sendError(res, 400, {
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Invalid request payload',
        details: err.flatten(),
      },
    });
    return;
  }

  if (err instanceof ShiftConflictError) {
    sendError(res, 409, {
      error: { code: 'SHIFT_CONFLICT', message: err.message },
    });
    return;
  }

  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === 'P2002') {
      sendError(res, 409, {
        error: { code: 'SHIFT_CONFLICT', message: 'A conflicting assignment already exists', details: { target: err.meta } },
      });
      return;
    }
    if (err.code === 'P2025') {
      sendError(res, 404, {
        error: { code: 'NOT_FOUND', message: 'The requested record does not exist' },
      });
      return;
    }
  }

  console.error('[error]', err);
  sendError(res, 500, {
    error: { code: 'INTERNAL_ERROR', message: 'Something went wrong' },
  });
}
