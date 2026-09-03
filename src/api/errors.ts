export type ApiErrorCode = 'UNAUTHORIZED' | 'FORBIDDEN' | 'NOT_FOUND' | 'VALIDATION_ERROR' | 'CONFLICT' | 'TIMEOUT' | 'NETWORK_ERROR' | 'SERVER_ERROR' | 'UNKNOWN_ERROR'

export class AppError extends Error {
  readonly code: ApiErrorCode
  readonly status?: number
  readonly details?: unknown

  constructor(code: ApiErrorCode, message: string, status?: number, details?: unknown) {
    super(message)
    this.name = 'AppError'
    this.code = code
    this.status = status
    this.details = details
  }
}
