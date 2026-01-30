/**
 * Rate Limiting Middleware
 *
 * Provides rate limiting for API endpoints.
 * Uses in-memory storage by default (works for single-instance deployments).
 * Can be upgraded to use Vercel KV or Upstash Redis for distributed rate limiting.
 *
 * Limits:
 * - Authenticated requests: 60 requests per minute per API key
 * - Unauthenticated requests: 10 requests per minute per IP
 */

import { NextResponse } from 'next/server'

interface RateLimitEntry {
  count: number
  resetTime: number
}

// In-memory store (for single-instance deployments)
// For production with multiple instances, use Vercel KV or Upstash Redis
const rateLimitStore = new Map<string, RateLimitEntry>()

// Clean up expired entries periodically
setInterval(() => {
  const now = Date.now()
  for (const [key, entry] of rateLimitStore.entries()) {
    if (entry.resetTime < now) {
      rateLimitStore.delete(key)
    }
  }
}, 60000) // Clean up every minute

export interface RateLimitConfig {
  /** Maximum requests allowed in the window */
  limit: number
  /** Time window in seconds */
  windowSec: number
}

export interface RateLimitResult {
  success: boolean
  limit: number
  remaining: number
  reset: number
  retryAfter?: number
}

/**
 * Check rate limit for an identifier (API key or IP)
 */
export function checkRateLimit(
  identifier: string,
  config: RateLimitConfig
): RateLimitResult {
  const now = Date.now()
  const windowMs = config.windowSec * 1000
  const key = `rate_limit:${identifier}`

  let entry = rateLimitStore.get(key)

  // If no entry or window expired, create a new one
  if (!entry || entry.resetTime < now) {
    entry = {
      count: 0,
      resetTime: now + windowMs,
    }
  }

  // Increment count
  entry.count++
  rateLimitStore.set(key, entry)

  const remaining = Math.max(0, config.limit - entry.count)
  const reset = Math.ceil(entry.resetTime / 1000)

  if (entry.count > config.limit) {
    const retryAfter = Math.ceil((entry.resetTime - now) / 1000)
    return {
      success: false,
      limit: config.limit,
      remaining: 0,
      reset,
      retryAfter,
    }
  }

  return {
    success: true,
    limit: config.limit,
    remaining,
    reset,
  }
}

/**
 * Rate limit configurations
 */
export const RATE_LIMITS = {
  /** Authenticated API requests (per API key) */
  authenticated: {
    limit: 60,
    windowSec: 60,
  },
  /** Unauthenticated requests (per IP) */
  unauthenticated: {
    limit: 10,
    windowSec: 60,
  },
} as const

/**
 * Get rate limit headers for a response
 */
export function getRateLimitHeaders(result: RateLimitResult): Record<string, string> {
  return {
    'X-RateLimit-Limit': String(result.limit),
    'X-RateLimit-Remaining': String(result.remaining),
    'X-RateLimit-Reset': String(result.reset),
    ...(result.retryAfter && { 'Retry-After': String(result.retryAfter) }),
  }
}

/**
 * Create a rate limit exceeded response
 */
export function rateLimitExceededResponse(result: RateLimitResult): Response {
  return NextResponse.json(
    {
      error: {
        code: 'RATE_LIMITED',
        message: 'Too many requests. Please try again later.',
        details: {
          retry_after: result.retryAfter,
        },
      },
    },
    {
      status: 429,
      headers: new Headers(getRateLimitHeaders(result)),
    }
  )
}

/**
 * Get client IP from request (works with Vercel and other proxies)
 */
export function getClientIp(request: Request): string {
  const forwardedFor = request.headers.get('x-forwarded-for')
  if (forwardedFor) {
    // Get the first IP in the list (original client)
    return forwardedFor.split(',')[0].trim()
  }

  const realIp = request.headers.get('x-real-ip')
  if (realIp) {
    return realIp
  }

  // Fallback
  return 'unknown'
}

/**
 * Apply rate limiting to an API route
 *
 * @example
 * ```typescript
 * export async function POST(request: Request) {
 *   const rateLimitResult = await applyRateLimit(request, 'api_key_123')
 *   if (!rateLimitResult.success) {
 *     return rateLimitExceededResponse(rateLimitResult)
 *   }
 *   // Continue with request...
 * }
 * ```
 */
export function applyRateLimit(
  identifier: string,
  isAuthenticated: boolean = true
): RateLimitResult {
  const config = isAuthenticated
    ? RATE_LIMITS.authenticated
    : RATE_LIMITS.unauthenticated

  return checkRateLimit(identifier, config)
}
