import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable, map } from 'rxjs';
import {
  isApiListPayload,
  isApiSuccessResponse,
  ok,
  okList,
} from '../api/api-response';

@Injectable()
export class ApiResponseInterceptor implements NestInterceptor {
  intercept(
    _context: ExecutionContext,
    next: CallHandler,
  ): Observable<unknown> {
    return next.handle().pipe(
      map((data) => {
        if (isApiSuccessResponse(data)) {
          return data;
        }

        if (isApiListPayload(data)) {
          return okList(data.items, {
            page: data.page,
            limit: data.limit,
            total: data.total,
          });
        }

        return ok(data ?? null);
      }),
    );
  }
}
