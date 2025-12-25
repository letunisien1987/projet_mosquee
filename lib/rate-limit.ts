/**
 * Simple in-memory rate limiting for API routes
 * Note: In production, consider using Redis for distributed rate limiting
 */

interface RateLimitEntry {
  count: number
  firstRequest: number
}

const rateLimitStore = new Map<string, RateLimitEntry>()

// Clean up expired entries every 5 minutes
setInterval(() => {
  const now = Date.now()
  for (const [key, entry] of rateLimitStore.entries()) {
    if (now - entry.firstRequest > 60000) { // 1 minute window
      rateLimitStore.delete(key)
    }
  }
}, 5 * 60 * 1000)

export interface RateLimitConfig {
  /** Maximum number of requests allowed in the window */
  maxRequests: number
  /** Window duration in milliseconds (default: 60000 = 1 minute) */
  windowMs?: number
}

export interface RateLimitResult {
  success: boolean
  remaining: number
  reset: number
}

/**
 * Check if a request should be rate limited
 * @param identifier - Unique identifier (usually IP address)
 * @param config - Rate limit configuration
 * @returns Result indicating if request is allowed
 */
export function checkRateLimit(
  identifier: string,
  config: RateLimitConfig
): RateLimitResult {
  const { maxRequests, windowMs = 60000 } = config
  const now = Date.now()
  const key = identifier

  const entry = rateLimitStore.get(key)

  if (!entry || now - entry.firstRequest > windowMs) {
    // First request or window expired - start new window
    rateLimitStore.set(key, { count: 1, firstRequest: now })
    return {
      success: true,
      remaining: maxRequests - 1,
      reset: now + windowMs,
    }
  }

  if (entry.count >= maxRequests) {
    // Rate limit exceeded
    return {
      success: false,
      remaining: 0,
      reset: entry.firstRequest + windowMs,
    }
  }

  // Increment count
  entry.count++
  return {
    success: true,
    remaining: maxRequests - entry.count,
    reset: entry.firstRequest + windowMs,
  }
}

/**
 * Get client IP from request headers
 */
export function getClientIp(request: Request): string {
  const forwardedFor = request.headers.get('x-forwarded-for')
  if (forwardedFor) {
    return forwardedFor.split(',')[0].trim()
  }

  const realIp = request.headers.get('x-real-ip')
  if (realIp) {
    return realIp
  }

  return 'unknown'
}

/**
 * Create rate limit headers for response
 */
export function getRateLimitHeaders(result: RateLimitResult): Record<string, string> {
  return {
    'X-RateLimit-Remaining': result.remaining.toString(),
    'X-RateLimit-Reset': new Date(result.reset).toISOString(),
  }
}
