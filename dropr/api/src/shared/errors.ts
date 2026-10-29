/**
 * Business rule violations. Domain code throws them with a stable code; the HTTP
 * layer decides which status each code maps to (see `error-handler.ts`).
 */
export type DomainErrorCode =
  'ZONE_NOT_FOUND' | 'ZONE_NOT_COVERED' | 'DISTANCE_EXCEEDED' | 'INVALID_DELIVERY_TIME';

export class DomainError extends Error {
  readonly code: DomainErrorCode;

  constructor(code: DomainErrorCode, message: string) {
    super(message);
    this.name = 'DomainError';
    this.code = code;
  }
}
