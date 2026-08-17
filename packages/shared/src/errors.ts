export type ApiErrorCode =
  | 'UNAUTHORIZED'
  | 'FORBIDDEN'
  | 'NOT_FOUND'
  | 'VALIDATION_ERROR'
  | 'SHIFT_CONFLICT'
  | 'EMAIL_TAKEN'
  | 'INVALID_CREDENTIALS'
  | 'TEAM_NOT_FOUND'
  | 'SLOT_INACTIVE'
  | 'MEMBER_INACTIVE'
  | 'RATE_LIMITED'
  | 'INTERNAL_ERROR'
  | 'FEATURE_DISABLED';

export interface ApiErrorBody {
  error: {
    code: ApiErrorCode;
    message: string;
    details?: Record<string, unknown>;
  };
}

export class ApiError extends Error {
  readonly code: ApiErrorCode;
  readonly status: number;
  readonly details?: Record<string, unknown>;

  constructor(code: ApiErrorCode, status: number, message: string, details?: Record<string, unknown>) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
    this.status = status;
    this.details = details;
  }
}
