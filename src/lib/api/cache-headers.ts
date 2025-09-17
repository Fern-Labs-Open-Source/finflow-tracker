/**
 * Cache control utilities for API responses
 */

import { NextResponse } from 'next/server';

export const CacheHeaders = {
  /**
   * No caching - for sensitive or real-time data
   */
  noCache: {
    'Cache-Control': 'no-store, no-cache, must-revalidate',
    'Pragma': 'no-cache',
    'Expires': '0',
  },
  
  /**
   * Short cache (1 minute) - for frequently changing data
   */
  shortCache: {
    'Cache-Control': 'public, max-age=60, stale-while-revalidate=30',
  },
  
  /**
   * Medium cache (5 minutes) - for moderately changing data
   */
  mediumCache: {
    'Cache-Control': 'public, max-age=300, stale-while-revalidate=60',
  },
  
  /**
   * Long cache (1 hour) - for rarely changing data
   */
  longCache: {
    'Cache-Control': 'public, max-age=3600, stale-while-revalidate=300',
  },
  
  /**
   * Dynamic cache based on endpoint type
   */
  forEndpoint: (endpoint: string): Record<string, string> => {
    // Portfolio and account snapshots can be cached longer
    if (endpoint.includes('/portfolio/') || endpoint.includes('/snapshot')) {
      return CacheHeaders.mediumCache;
    }
    
    // Institutions and account lists can be cached briefly
    if (endpoint.includes('/institutions') || endpoint.includes('/accounts')) {
      return CacheHeaders.shortCache;
    }
    
    // Exchange rates can be cached longer as they don't change frequently
    if (endpoint.includes('/exchange-rates')) {
      return CacheHeaders.longCache;
    }
    
    // Default to no cache for safety
    return CacheHeaders.noCache;
  }
};

/**
 * Add cache headers to a NextResponse
 */
export function addCacheHeaders(
  response: NextResponse,
  headers: Record<string, string>
): NextResponse {
  Object.entries(headers).forEach(([key, value]) => {
    response.headers.set(key, value);
  });
  return response;
}
