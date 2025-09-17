/**
 * Database query optimization utilities
 * Helpers to optimize Prisma queries for better performance
 */

import { Prisma } from '@prisma/client';

/**
 * Optimize account queries with smart includes
 */
export const optimizedAccountInclude = (options?: {
  includeInstitution?: boolean;
  includeSnapshots?: boolean;
  snapshotLimit?: number;
  includeChildren?: boolean;
}) => {
  const {
    includeInstitution = true,
    includeSnapshots = true,
    snapshotLimit = 1,
    includeChildren = false,
  } = options || {};

  return {
    ...(includeInstitution && {
      institution: {
        select: {
          id: true,
          name: true,
          type: true,
          color: true,
          displayOrder: true,
        },
      },
    }),
    ...(includeSnapshots && {
      snapshots: {
        orderBy: { date: 'desc' as const },
        take: snapshotLimit,
        select: {
          id: true,
          date: true,
          valueOriginal: true,
          valueEur: true,
          currency: true,
        },
      },
    }),
    ...(includeChildren && {
      childAccounts: {
        select: {
          id: true,
          name: true,
          type: true,
        },
      },
    }),
    _count: {
      select: {
        snapshots: true,
        ...(includeChildren && { childAccounts: true }),
      },
    },
  };
};

/**
 * Optimize institution queries
 */
export const optimizedInstitutionInclude = (options?: {
  includeAccounts?: boolean;
  accountLimit?: number;
}) => {
  const { includeAccounts = true, accountLimit } = options || {};

  return {
    ...(includeAccounts && {
      accounts: {
        ...(accountLimit && { take: accountLimit }),
        orderBy: { displayOrder: 'asc' as const },
        select: {
          id: true,
          name: true,
          type: true,
          currency: true,
          isActive: true,
          displayOrder: true,
        },
      },
    }),
    _count: {
      select: {
        accounts: true,
      },
    },
  };
};

/**
 * Create optimized where clause for date ranges
 */
export function createDateRangeFilter(
  startDate?: string | Date,
  endDate?: string | Date
): Prisma.DateTimeFilter | undefined {
  if (!startDate && !endDate) return undefined;

  const filter: Prisma.DateTimeFilter = {};
  
  if (startDate) {
    filter.gte = new Date(startDate);
  }
  
  if (endDate) {
    filter.lte = new Date(endDate);
  }
  
  return filter;
}

/**
 * Batch fetch helper to avoid N+1 queries
 */
export async function batchFetch<T, K>(
  ids: K[],
  fetchFn: (ids: K[]) => Promise<T[]>,
  batchSize = 100
): Promise<T[]> {
  const results: T[] = [];
  
  for (let i = 0; i < ids.length; i += batchSize) {
    const batch = ids.slice(i, i + batchSize);
    const batchResults = await fetchFn(batch);
    results.push(...batchResults);
  }
  
  return results;
}

/**
 * Create connection pool configuration for production
 */
export function getConnectionPoolConfig() {
  const isProduction = process.env.NODE_ENV === 'production';
  
  return {
    // Connection pool size
    connection_limit: isProduction ? 10 : 2,
    
    // Pool timeout
    pool_timeout: 10,
    
    // Idle timeout
    idle_in_transaction_session_timeout: 10,
    
    // Statement timeout
    statement_timeout: 20,
  };
}

/**
 * Query timing decorator for debugging slow queries
 */
export async function timeQuery<T>(
  queryName: string,
  queryFn: () => Promise<T>
): Promise<T> {
  const start = Date.now();
  
  try {
    const result = await queryFn();
    const duration = Date.now() - start;
    
    if (duration > 1000) {
      console.warn(`Slow query detected: ${queryName} took ${duration}ms`);
    } else if (process.env.DEBUG_QUERIES) {
      console.log(`Query ${queryName} completed in ${duration}ms`);
    }
    
    return result;
  } catch (error) {
    const duration = Date.now() - start;
    console.error(`Query ${queryName} failed after ${duration}ms:`, error);
    throw error;
  }
}

/**
 * Optimize large result sets with cursor-based pagination
 */
export function createCursorPagination<T extends { id: string }>(
  limit: number,
  cursor?: string
) {
  const take = limit + 1; // Fetch one extra to check if there's more
  
  return {
    take,
    ...(cursor && {
      skip: 1, // Skip the cursor
      cursor: {
        id: cursor,
      },
    }),
    orderBy: {
      id: 'asc' as const,
    },
  };
}

/**
 * Process cursor pagination results
 */
export function processCursorResults<T extends { id: string }>(
  results: T[],
  limit: number
): { data: T[]; nextCursor: string | null; hasMore: boolean } {
  const hasMore = results.length > limit;
  const data = hasMore ? results.slice(0, -1) : results;
  const nextCursor = hasMore ? data[data.length - 1].id : null;
  
  return { data, nextCursor, hasMore };
}
