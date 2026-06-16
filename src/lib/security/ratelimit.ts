import "server-only";

/**
 * Minimal in-memory sliding-window rate limiter (zero dependencies, free).
 *
 * Scope & honesty: this is per-process. On a single free-tier instance it is
 * effective against casual abuse and form spam. For multi-instance production,
 * swap the `hits` map for Upstash Redis (free tier) — the interface stays the
 * same. Documented in SECURITY.md.
 */

type Bucket = { count: number; resetAt: number };
const buckets = new Map<string, Bucket>();

// Opportunistic cleanup so the map can't grow unbounded (memory-exhaustion guard).
function sweep(now: number) {
  if (buckets.size < 5000) return;
  for (const [key, b] of buckets) if (b.resetAt <= now) buckets.delete(key);
}

export interface RateResult {
  ok: boolean;
  remaining: number;
  resetAt: number;
}

export function rateLimit(key: string, limit: number, windowMs: number): RateResult {
  const now = Date.now();
  sweep(now);
  const existing = buckets.get(key);

  if (!existing || existing.resetAt <= now) {
    const resetAt = now + windowMs;
    buckets.set(key, { count: 1, resetAt });
    return { ok: true, remaining: limit - 1, resetAt };
  }

  existing.count += 1;
  const ok = existing.count <= limit;
  return { ok, remaining: Math.max(0, limit - existing.count), resetAt: existing.resetAt };
}

/**
 * Best-effort client IP from proxy headers. Never trust a single header blindly;
 * we take the first hop of X-Forwarded-For and fall back to a constant so the
 * limiter still functions (degrades to global limiting) rather than failing open.
 */
export function clientKey(headers: Headers, salt = ""): string {
  const xff = headers.get("x-forwarded-for");
  const ip = xff?.split(",")[0]?.trim() || headers.get("x-real-ip") || "unknown";
  return `${salt}:${ip}`;
}
