/**
 * Pagination utilities for API endpoints
 */

export interface PaginationParams {
  page?: number;
  limit?: number;
  cursor?: string;
}

export interface PaginationResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export interface CursorPaginationResponse<T> {
  data: T[];
  pagination: {
    cursor: string | null;
    hasNext: boolean;
    limit: number;
  };
}

/**
 * Parse pagination parameters from URL search params
 */
export function parsePaginationParams(
  searchParams: URLSearchParams,
  defaultLimit = 50,
  maxLimit = 100
): PaginationParams {
  const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
  const requestedLimit = parseInt(searchParams.get('limit') || String(defaultLimit), 10);
  const limit = Math.min(Math.max(1, requestedLimit), maxLimit);
  const cursor = searchParams.get('cursor') || undefined;
  
  return { page, limit, cursor };
}

/**
 * Create pagination metadata for offset-based pagination
 */
export function createPaginationMeta(
  page: number,
  limit: number,
  total: number
) {
  const totalPages = Math.ceil(total / limit);
  
  return {
    page,
    limit,
    total,
    totalPages,
    hasNext: page < totalPages,
    hasPrev: page > 1,
  };
}

/**
 * Calculate offset for database queries
 */
export function calculateOffset(page: number, limit: number): number {
  return (page - 1) * limit;
}

/**
 * Create a paginated response
 */
export function createPaginatedResponse<T>(
  data: T[],
  page: number,
  limit: number,
  total: number
): PaginationResponse<T> {
  return {
    data,
    pagination: createPaginationMeta(page, limit, total),
  };
}

/**
 * Create a cursor-based paginated response
 */
export function createCursorPaginatedResponse<T>(
  data: T[],
  limit: number,
  hasNext: boolean,
  nextCursor?: string
): CursorPaginationResponse<T> {
  return {
    data,
    pagination: {
      cursor: nextCursor || null,
      hasNext,
      limit,
    },
  };
}
