/**
 * Minimal structured logger. console.log/error in Cloudflare Workers shows up
 * in `wrangler tail` and (soon, via Logpush) in your own log destination.
 * Use these instead of bare console.log so we have a consistent shape.
 */

export function logEvent(name: string, fields: Record<string, unknown> = {}) {
  console.log(JSON.stringify({ ts: new Date().toISOString(), level: "info", event: name, ...fields }));
}

export function logError(name: string, err: unknown, fields: Record<string, unknown> = {}) {
  const msg = err instanceof Error ? err.message : String(err);
  const stack = err instanceof Error ? err.stack : undefined;
  console.error(JSON.stringify({ ts: new Date().toISOString(), level: "error", event: name, error: msg, stack, ...fields }));
}
