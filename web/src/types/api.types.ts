/**
 * Standard API envelope returned by all DevTinder microservices
 * via `@devtinder/shared` responseFormatter.
 */
export interface ApiResponse<T = unknown> {
  success: boolean;
  message: string;
  data?: T;
}

/**
 * Normalized client-side error structure for consistent UI error handling.
 */
export interface ApiError {
  message: string;
  statusCode?: number;
  code?: string;
}

export interface PaginationParams {
  page?: number;
  limit?: number;
}
