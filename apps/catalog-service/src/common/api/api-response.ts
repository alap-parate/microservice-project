export type ApiMeta = {
  page: number;
  limit: number;
  total: number;
};

export type ApiSuccessResponse<T> = {
  success: true;
  data: T;
  meta?: ApiMeta;
};

export type ApiErrorBody = {
  code: string;
  message: string;
  details?: unknown;
};

export type ApiErrorResponse = {
  success: false;
  error: ApiErrorBody;
};

export type ApiListPayload<T> = {
  items: T[];
  total: number;
  page: number;
  limit: number;
};

export function ok<T>(data: T): ApiSuccessResponse<T> {
  return { success: true, data };
}

export function okList<T>(
  items: T[],
  meta: ApiMeta,
): ApiSuccessResponse<T[]> {
  return { success: true, data: items, meta };
}

export function fail(
  code: string,
  message: string,
  details?: unknown,
): ApiErrorResponse {
  return {
    success: false,
    error: {
      code,
      message,
      ...(details !== undefined ? { details } : {}),
    },
  };
}

export function isApiSuccessResponse(
  value: unknown,
): value is ApiSuccessResponse<unknown> {
  return (
    typeof value === 'object' &&
    value !== null &&
    'success' in value &&
    (value as { success: unknown }).success === true
  );
}

export function isApiListPayload(
  value: unknown,
): value is ApiListPayload<unknown> {
  return (
    typeof value === 'object' &&
    value !== null &&
    'items' in value &&
    'total' in value &&
    'page' in value &&
    'limit' in value &&
    Array.isArray((value as ApiListPayload<unknown>).items)
  );
}
