/**
 * POST /api/ask
 *
 * Streams (well, returns) a Claude API response to the user's FMCSA question.
 * Uses ANTHROPIC_API_KEY in env. Auth-gated by Supabase JWT.
 *
 * Body: { messages: [{role,content}], model?: string }
 * Returns: { ok: true, content: "..." }
 */

import { bearerFromRequest, verifySupabaseJwt } from "../_shared/supabase-admin";
import { rateLimit } from "../_shared/rate-limit";

interface Env {
  SUPABASE_URL?: string; SUPABASE_SERVICE_ROLE?: string;
  ANTHROPIC_API_KEY?: string;
}

const json = (d: unknown, s = 200) =>
  new Response(JSON.stringify(d), { status: s, headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" } });

const SYSTEM_PROMPT = `You are X3 Compass, the AI Safety Director for FMCSA-regulated motor carriers (1-100 power units). You answer DOT compliance questions with these absolute rules:

1. EVERY substantive claim cites the exact CFR section (e.g. "per 49 CFR § 391.41(b)(8)").
2. If you don't know, say so. Never invent a section number, deadline, or rule.
3. Use plain English. The user is a fleet safety manager or owner-operator, not a lawyer.
4. When a question has a deadline-driven answer (e.g. "when does this expire?"), state the deadline plainly with the CFR cite, then explain.
5. End every response with the relevant linked source(s): https://www.ecfr.gov/current/title-49/...

You have access to 300+ X3 Compass skills covering Driver Qualification Files, Drug & Alcohol testing (Parts 40, 382), CDL (Part 383), Hours of Service (Part 395), Vehicles & PM (Parts 393, 396), CSA & DataQs, hazmat (Parts 100-180, 397), insurance (Part 387), IFTA, and audit prep.

For audit-grade legal interpretation, always recommend the user verify with a transportation attorney. Compass surfaces the rules; the attorney signs off on application.`;

export const onRequestPost: PagesFunction<Env> = async (ctx) => {
  try {
    const token = bearerFromRequest(ctx.request);
    const user = await verifySupabaseJwt(ctx.env, token);
    if (!user) return json({ ok: false, error: "Unauthorized" }, 401);

    const rl = rateLimit(ctx.request, { key: "ask", max: 30, windowSec: 60 });
    if (rl) return rl;

    if (!ctx.env.ANTHROPIC_API_KEY) {
      return json({ ok: false, error: "Ask Compass not configured (ANTHROPIC_API_KEY missing)" }, 500);
    }

    let body: { messages?: Array<{ role: string; content: string }>; model?: string };
    try { body = await ctx.request.json(); } catch { return json({ ok: false, error: "Invalid JSON" }, 400); }
    const messages = (body.messages || []).filter((m) => m && (m.role === "user" || m.role === "assistant") && typeof m.content === "string" && m.content.length < 8000);
    if (messages.length === 0 || messages[messages.length - 1].role !== "user") {
      return json({ ok: false, error: "messages must end with a user turn" }, 400);
    }

    const model = body.model || "claude-sonnet-4-6";

    const r = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": ctx.env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        max_tokens: 2048,
        system: SYSTEM_PROMPT,
        messages,
      }),
    });

    if (!r.ok) {
      const txt = await r.text();
      console.error("[ask] Anthropic error", r.status, txt);
      return json({ ok: false, error: `Anthropic HTTP ${r.status}`, detail: txt.slice(0, 500) }, 502);
    }

    const data = (await r.json()) as { content?: Array<{ type: string; text: string }>; usage?: Record<string, number>; model?: string };
    const text = (data.content || []).filter((b) => b.type === "text").map((b) => b.text).join("\n\n");
    return json({ ok: true, content: text, model: data.model, usage: data.usage });
  } catch (err) {
    console.error("[ask] unexpected error:", err);
    return json({ ok: false, error: "Server error", detail: err instanceof Error ? err.message : String(err) }, 500);
  }
};

export const onRequestOptions: PagesFunction = async () =>
  new Response(null, { status: 204, headers: { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Methods": "POST, OPTIONS", "Access-Control-Allow-Headers": "Content-Type, Authorization" } });
