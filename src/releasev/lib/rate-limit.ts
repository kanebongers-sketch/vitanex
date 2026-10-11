/**
 * Eenvoudige in-memory rate limiter (fixed window per sleutel, meestal IP).
 * Voldoende voor een server. Draai je op meerdere instances of serverless,
 * vervang dit dan door bijv. Upstash Redis Ratelimit.
 */
interface Bucket {
  count: number;
  resetAt: number;
}

export interface RateLimitResult {
  allowed: boolean;
  retryAfterSeconds: number;
}

/** Bovengrens op het aantal bijgehouden sleutels (voorkomt geheugengroei bij gespoofde IP-headers). */
const MAX_BUCKETS = 5000;

export function createRateLimiter(options: { limit: number; windowMs: number }) {
  const buckets = new Map<string, Bucket>();

  function prune(now: number): void {
    for (const [key, bucket] of buckets) {
      if (bucket.resetAt <= now) buckets.delete(key);
    }
    if (buckets.size >= MAX_BUCKETS) buckets.clear();
  }

  return function check(key: string, now = Date.now()): RateLimitResult {
    if (buckets.size >= MAX_BUCKETS) prune(now);
    const current = buckets.get(key);
    if (!current || current.resetAt <= now) {
      buckets.set(key, { count: 1, resetAt: now + options.windowMs });
      return { allowed: true, retryAfterSeconds: 0 };
    }
    if (current.count >= options.limit) {
      return { allowed: false, retryAfterSeconds: Math.ceil((current.resetAt - now) / 1000) };
    }
    buckets.set(key, { ...current, count: current.count + 1 });
    return { allowed: true, retryAfterSeconds: 0 };
  };
}

export function getClientIp(headers: Headers): string {
  const forwarded = headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]?.trim() || "unknown";
  return headers.get("x-real-ip") ?? "unknown";
}
