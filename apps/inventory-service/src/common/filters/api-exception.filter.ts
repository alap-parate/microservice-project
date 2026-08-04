import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import type { Response } from 'express';
import { fail } from '../api/api-response';

type DomainHttpError = Error & {
  status: number;
  code: string;
};

function isDomainHttpError(error: unknown): error is DomainHttpError {
  return (
    error instanceof Error &&
    'status' in error &&
    'code' in error &&
    typeof (error as { status: unknown }).status === 'number' &&
    typeof (error as { code: unknown }).code === 'string'
  );
}

@Catch()
export class ApiExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const body = exception.getResponse();

      if (
        typeof body === 'object' &&
        body !== null &&
        'code' in body &&
        (body as { code: unknown }).code === 'VALIDATION_ERROR'
      ) {
        const validationBody = body as {
          code: string;
          message: string;
          details?: unknown;
        };
        response
          .status(status)
          .json(
            fail(
              validationBody.code,
              validationBody.message,
              validationBody.details,
            ),
          );
        return;
      }

      const message =
        typeof body === 'string'
          ? body
          : typeof body === 'object' &&
              body !== null &&
              'message' in body
            ? Array.isArray((body as { message: unknown }).message)
              ? ((body as { message: string[] }).message).join(', ')
              : String((body as { message: unknown }).message)
            : exception.message;

      response.status(status).json(
        fail(
          status === HttpStatus.BAD_REQUEST
            ? 'VALIDATION_ERROR'
            : 'INTERNAL_ERROR',
          message,
        ),
      );
      return;
    }

    if (isDomainHttpError(exception)) {
      response
        .status(exception.status)
        .json(fail(exception.code, exception.message));
      return;
    }

    response
      .status(HttpStatus.INTERNAL_SERVER_ERROR)
      .json(fail('INTERNAL_ERROR', 'Internal server error'));
  }
}
