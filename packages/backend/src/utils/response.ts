import { ApiResponse, ApiError } from "@explorer/shared";

/**
 * Standard utility to build successful API responses.
 */
export const successResponse = <T>(data: T, total?: number): ApiResponse<T> => ({
  success: true,
  data,
  meta: {
    total,
    timestamp: new Date().toISOString(),
  },
});

/**
 * Standard utility to build error responses.
 */
export const errorResponse = (
  message: string,
  code: string = "INTERNAL_SERVER_ERROR",
  details?: unknown
): ApiError => ({
  success: false,
  error: {
    code,
    message,
    details,
  },
});
