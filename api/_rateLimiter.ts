/**
 * Shared in-memory rate limiter and request validator for Vercel serverless functions.
 * Protects endpoints from abuse and quota depletion.
 */

interface RateLimitRecord {
  count: number;
  resetTime: number;
}

const ipRequestCounts = new Map<string, RateLimitRecord>();

/**
 * Clean up expired rate limit entries periodically
 */
function cleanupExpiredRecords() {
  const now = Date.now();
  for (const [ip, record] of ipRequestCounts.entries()) {
    if (now > record.resetTime) {
      ipRequestCounts.delete(ip);
    }
  }
}

/**
 * Rate limit requests per client IP.
 * Defaults to max 30 requests per minute per IP.
 */
export function checkRateLimit(
  req: any, 
  maxRequests: number = 30, 
  windowMs: number = 60000
): { allowed: boolean; remaining: number; resetInSec: number } {
  cleanupExpiredRecords();

  const ip = 
    req.headers['x-forwarded-for']?.toString().split(',')[0]?.trim() || 
    req.headers['x-real-ip']?.toString() || 
    req.socket?.remoteAddress || 
    'anonymous';

  const now = Date.now();
  const record = ipRequestCounts.get(ip);

  if (!record || now > record.resetTime) {
    ipRequestCounts.set(ip, {
      count: 1,
      resetTime: now + windowMs
    });
    return {
      allowed: true,
      remaining: maxRequests - 1,
      resetInSec: Math.ceil(windowMs / 1000)
    };
  }

  if (record.count >= maxRequests) {
    return {
      allowed: false,
      remaining: 0,
      resetInSec: Math.ceil((record.resetTime - now) / 1000)
    };
  }

  record.count += 1;
  return {
    allowed: true,
    remaining: maxRequests - record.count,
    resetInSec: Math.ceil((record.resetTime - now) / 1000)
  };
}

/**
 * Validates request payload size to prevent oversized payloads.
 * Default cap: 100KB.
 */
export function validatePayloadSize(req: any, maxBytes: number = 102400): boolean {
  try {
    const raw = typeof req.body === 'string' ? req.body : JSON.stringify(req.body || {});
    return Buffer.byteLength(raw, 'utf8') <= maxBytes;
  } catch {
    return false;
  }
}
