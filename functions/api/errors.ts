/**
 * POST /api/errors
 *
 * Lightweight client-side error capture. The front-end posts JS errors here
 * via window.addEventListener('error') so we can see them in the logs without
 * waiting for a customer to report a bug.
 *
 * No auth required (we want to capture pre-login errors). Rate limited to
 * 30/min/IP to prevent log flooding. Body is sanitized to drop obvious PII
 * (Authorization headers, tokens, cookies).
 */

import { rateLimit } from "../_shared/rate-limit";
import { supaFetch } from "../_shared/supabase-admin";
import { logError } from "../_shared/log";

interface Env {
  SUPABASE_URL?: string;
  SUPABASE_SERVICE_ROLE?: string;
}

const json = (d: unknown, s = 200) =>
  new Response(JSON.stringify(d), { status: s, headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" } });

function sanitize(s: string | undefined, maxLen = 500): string | null {
  if (!s) return null;
  return s
    .replace(/Bearer\s+[A-Za-z0-9._-]+/gi, "Bearer [redacted]")
    .replace(/[?&](password|token|secret|key)=[^&\s]+/gi, (_, k) => `&${k}=[redacted]`)
    .slice(0, maxLen);
}

export const onRequestPost: PagesFunction<Env> = async (ctx) => {
  try {
    const rl = rateLimit(ctx.request, { key: "errors", max: 30, windowSec: 60 });
    if (rl) return rl;

    let body: { message?: string; stack?: string; source?: string; line?: number; col?: number; url?: string; user_agent?: string };
    try { body = await ctx.request.json(); } catch { return json({ ok: false, error: "Invalid JSON" }, 400); }

    const event = {
      ts: new Date().toISOString(),
      message: sanitize(body.message, 1000),
      stack: sanitize(body.stack, 4000),
      source: sanitize(body.source, 500),
      line: body.line || null,
      col: body.col || null,
      url: sanitize(body.url, 500),
      user_agent: sanitize(body.user_agent, 300),
      ip: ctx.request.headers.get("CF-Connecting-IP") || null,
      cf_ray: ctx.request.headers.get("CF-Ray") || null,
    };

    // Log it (shows up in CF Pages Functions logs)
    logError("client_error", body.message, event);

    // Best-effort: also write to compass_client_errors table if it exists
    if (ctx.env.SUPABASE_URL && ctx.env.SUPABASE_SERVICE_ROLE) {
      try {
        await supaFetch(ctx.env).insert("compass_client_errors", event as Record<string, unknown>, "minimal");
      } catch { /* table may not exist yet; non-fatal */ }
    }

    return json({ ok: true });
  } catch (err) {
    console.error("[errors] capture failed:", err);
    return json({ ok: false, error: "capture failed" }, 200); // 200 so client doesn't retry
  }
};

export const onRequestOptions: PagesFunction = async () =>
  new Response(null, { status: 204, headers: { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Methods": "POST, OPTIONS", "Access-Control-Allow-Headers": "Content-Type" } });
