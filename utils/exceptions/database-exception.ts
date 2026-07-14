import { QueryFailedError } from 'typeorm';

export function isUniqueConstraintViolation(error: unknown): boolean {
  return (
    error instanceof QueryFailedError &&
    (error.driverError as { code?: string }).code === '23505'
  );
}