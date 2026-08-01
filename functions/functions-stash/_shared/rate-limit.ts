/**
 * Rate-limit helper using Cloudflare KV.
 * Falls back to allow-all if KV binding is missing.
 */
export interface RateLimitEnv {
  RATE_LIMIT?: KVNamespace;
}

export interface RateLimitResult {
  ok: boolean;
  count: number;
  remaining: number;
  resetIn: number;
}

/**
 * @param env       Environment with optional RATE_LIMIT KV binding
 * @param key       Unique identifier for the bucket (e.g. `samsara-disconnect:${userId}`)
 * @param max       Max requests allowed in the window
 * @param windowSec Window size in seconds
 */
export async function rateLimit(
  env: RateLimitEnv,
  key: string,
  max: number,
  windowSec: number,
): Promise<RateLimitResult> {
  if (!env.RATE_LIMIT) {
    return { ok: true, count: 0, remaining: max, resetIn: windowSec };
  }
  const bucketKey = `rl:${key}`;
  const raw = await env.RATE_LIMIT.get(bucketKey);
  let count = 0;
  if (raw) { try { count = Number(JSON.parse(raw).count || 0); } catch {} }
  count += 1;
  await env.RATE_LIMIT.put(bucketKey, JSON.stringify({ count, ts: Date.now() }), { expirationTtl: windowSec });
  return {
    ok: count <= max,
    count,
    remaining: Math.max(0, max - count),
    resetIn: windowSec,
  };
}
