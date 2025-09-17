/**
 * Simple optimistic update utilities
 * Returns predicted results immediately while processing in background
 */

export interface OptimisticResponse<T> {
  data: T;
  optimistic: boolean;
  timestamp: number;
}

/**
 * Create an optimistic response that can be used immediately by the frontend
 */
export function createOptimisticResponse<T>(
  currentData: T,
  updates: Partial<T>
): OptimisticResponse<T> {
  return {
    data: {
      ...currentData,
      ...updates,
    },
    optimistic: true,
    timestamp: Date.now(),
  };
}

/**
 * Simple retry mechanism for failed operations
 */
export async function withRetry<T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  delay: number = 1000
): Promise<T> {
  let lastError: Error | undefined;
  
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error as Error;
      if (i < maxRetries - 1) {
        await new Promise(resolve => setTimeout(resolve, delay * (i + 1)));
      }
    }
  }
  
  throw lastError;
}

/**
 * Batch multiple operations together for efficiency
 */
export async function batchOperations<T>(
  operations: (() => Promise<T>)[],
  batchSize: number = 5
): Promise<PromiseSettledResult<T>[]> {
  const results: PromiseSettledResult<T>[] = [];
  
  for (let i = 0; i < operations.length; i += batchSize) {
    const batch = operations.slice(i, i + batchSize);
    const batchResults = await Promise.allSettled(batch.map(op => op()));
    results.push(...batchResults);
  }
  
  return results;
}
