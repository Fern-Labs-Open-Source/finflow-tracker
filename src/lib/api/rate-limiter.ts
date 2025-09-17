/**
 * Simple in-memory rate limiter for API endpoints
 * In production, use Redis or a dedicated rate limiting service
 */

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

class RateLimiter {
  private limits: Map<string, RateLimitEntry> = new Map();
  private readonly windowMs: number;
  private readonly maxRequests: number;

  constructor(windowMs = 60000, maxRequests = 100) {
    this.windowMs = windowMs;
    this.maxRequests = maxRequests;
    
    // Clean up old entries every minute
    setInterval(() => this.cleanup(), 60000);
  }

  /**
   * Check if a request should be rate limited
   */
  isRateLimited(identifier: string): boolean {
    const now = Date.now();
    const entry = this.limits.get(identifier);
    
    if (!entry || entry.resetTime <= now) {
      // Create new entry or reset expired one
      this.limits.set(identifier, {
        count: 1,
        resetTime: now + this.windowMs
      });
      return false;
    }
    
    if (entry.count >= this.maxRequests) {
      return true;
    }
    
    entry.count++;
    return false;
  }

  /**
   * Get remaining requests for an identifier
   */
  getRemainingRequests(identifier: string): number {
    const entry = this.limits.get(identifier);
    if (!entry || entry.resetTime <= Date.now()) {
      return this.maxRequests;
    }
    return Math.max(0, this.maxRequests - entry.count);
  }

  /**
   * Get reset time for an identifier
   */
  getResetTime(identifier: string): number {
    const entry = this.limits.get(identifier);
    return entry?.resetTime || Date.now() + this.windowMs;
  }

  /**
   * Clean up expired entries
   */
  private cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.limits.entries()) {
      if (entry.resetTime <= now) {
        this.limits.delete(key);
      }
    }
  }
}

// Create rate limiters for different endpoint types
export const rateLimiters = {
  // Strict limit for auth endpoints
  auth: new RateLimiter(60000, 5), // 5 requests per minute
  
  // Moderate limit for write operations
  write: new RateLimiter(60000, 30), // 30 requests per minute
  
  // Relaxed limit for read operations
  read: new RateLimiter(60000, 100), // 100 requests per minute
  
  // Very relaxed for static resources
  static: new RateLimiter(60000, 200), // 200 requests per minute
};

/**
 * Rate limit middleware for Next.js API routes
 */
export function withRateLimit(
  limiter: RateLimiter,
  identifierFn?: (req: Request) => string
) {
  return async function rateLimitMiddleware(req: Request) {
    // Skip rate limiting in development
    if (process.env.NODE_ENV === 'development') {
      return null;
    }
    
    // Get identifier (IP address by default)
    const identifier = identifierFn 
      ? identifierFn(req)
      : req.headers.get('x-forwarded-for') || 
        req.headers.get('x-real-ip') || 
        'unknown';
    
    if (limiter.isRateLimited(identifier)) {
      const resetTime = limiter.getResetTime(identifier);
      const retryAfter = Math.ceil((resetTime - Date.now()) / 1000);
      
      return new Response(
        JSON.stringify({
          error: 'Too Many Requests',
          message: 'Rate limit exceeded. Please try again later.',
          retryAfter
        }),
        {
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            'X-RateLimit-Limit': String(limiter['maxRequests']),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': String(resetTime),
            'Retry-After': String(retryAfter)
          }
        }
      );
    }
    
    // Add rate limit headers to response
    const remaining = limiter.getRemainingRequests(identifier);
    const resetTime = limiter.getResetTime(identifier);
    
    return {
      headers: {
        'X-RateLimit-Limit': String(limiter['maxRequests']),
        'X-RateLimit-Remaining': String(remaining),
        'X-RateLimit-Reset': String(resetTime)
      }
    };
  };
}
