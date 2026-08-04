import { PrismaClientKnownRequestError } from '@prisma/client/runtime/client.js';

export function isUniqueConstraintViolation(error: unknown): boolean {
  return (
    error instanceof PrismaClientKnownRequestError && error.code === 'P2002'
  );
}

export function isForeignKeyViolation(error: unknown): boolean {
  return (
    error instanceof PrismaClientKnownRequestError && error.code === 'P2003'
  );
}

export function isRecordNotFound(error: unknown): boolean {
  return (
    error instanceof PrismaClientKnownRequestError && error.code === 'P2025'
  );
}