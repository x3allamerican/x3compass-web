/**
 * Lightweight per-IP rate limiter for Cloudflare Pages Functions.
 *
 * Not a globally consistent limit — Workers run per-colo, so a determined
 * attacker hitting different POPs can multiply this. For real rate limiting
 * use the Cloudflare WAF Rate Limiting rule we provision separately (zone
 * level, applied at the edge before our function runs).
 *
 * This is the in-function "second layer" that:
 *  - logs the IP + path on each request
 *  - returns 429 if the same IP has hit the same path > N times in W seconds
 *    *as observed by this single colo*
 */

const BUCKETS = new Map<string, { count: number; reset: number }>();

export function rateLimit(req: Request, opts: { key?: string; max: number; windowSec: number }): Response | null {
  const ip = req.headers.get("CF-Connecting-IP") || req.headers.get("X-Forwarded-For") || "unknown";
  const path = new URL(req.url).pathname;
  const key = `${opts.key || path}|${ip}`;
  const now = Date.now();
  const b = BUCKETS.get(key);
  if (!b || now > b.reset) {
    BUCKETS.set(key, { count: 1, reset: now + opts.windowSec * 1000 });
    return null;
  }
  b.count += 1;
  if (b.count > opts.max) {
    const retryAfter = Math.ceil((b.reset - now) / 1000);
    return new Response(JSON.stringify({ ok: false, error: "Too many requests", retry_after: retryAfter }), {
      status: 429,
      headers: { "Content-Type": "application/json", "Retry-After": String(retryAfter) },
    });
  }
  return null;
}
