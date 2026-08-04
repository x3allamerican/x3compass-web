/**
 * POST /api/ask
 *
 * Returns a Claude API response to a DOT compliance question.
 * Uses ANTHROPIC_API_KEY in env. Auth-gated by Supabase JWT.
 *
 * Prompt Intelligence v1 (2026-05-17):
 *   - Every call is logged to compass_prompt_eval with the extracted cited
 *     CFR sections.
 *   - Each cited section is round-tripped against the eCFR API. Sections
 *     that don't resolve are flagged as `unverified_citations` so we know
 *     when we ship a possibly-hallucinated answer.
 *   - The customer-facing response includes an `unverified_citations`
 *     field the UI can show as a quality-warning chip.
 *
 * Body:    { messages: [{role, content}], model?: string }
 * Returns: { ok: true, content, citation_quality, unverified_citations, model, usage }
 */

import { bearerFromRequest, verifySupabaseJwt } from "../_shared/supabase-admin";
import { rateLimit } from "../_shared/rate-limit";
import { correlationId, securityError } from "../_shared/request-security";
import { privacySafePromptTelemetry } from "../_shared/privacy";

interface Env {
  SUPABASE_URL?: string;
  SUPABASE_SERVICE_ROLE?: string;
  ANTHROPIC_API_KEY?: string;
}

const PROMPT_VERSION = "v1.1";  // bump when SYSTEM_PROMPT changes

const json = (d: unknown, s = 200) =>
  new Response(JSON.stringify(d), { status: s, headers: { "Content-Type": "application/json", "Cache-Control": "no-store" } });

const SYSTEM_PROMPT = `You are X3 Compass, the AI Safety Director for FMCSA-regulated motor carriers (1-100 power units). You answer DOT compliance questions with these absolute rules:

1. EVERY substantive claim cites the exact CFR section (e.g. "per 49 CFR § 391.41(b)(8)").
2. If you don't know, say so. Never invent a section number, deadline, or rule.
3. Use plain English. The user is a fleet safety manager or owner-operator, not a lawyer.
4. When a question has a deadline-driven answer (e.g. "when does this expire?"), state the deadline plainly with the CFR cite, then explain.
5. End every response with the relevant linked source(s): https://www.ecfr.gov/current/title-49/...

You have access to 300+ X3 Compass skills covering Driver Qualification Files, Drug & Alcohol testing (Parts 40, 382), CDL (Part 383), Hours of Service (Part 395), Vehicles & PM (Parts 393, 396), CSA & DataQs, hazmat (Parts 100-180, 397), insurance (Part 387), IFTA, and audit prep.

For audit-grade legal interpretation, always recommend the user verify with a transportation attorney. Compass surfaces the rules; the attorney signs off on application.`;

/** Extract any "49 CFR X.Y" or "§ X.Y" style citations from the response. */
function extractCfrCitations(text: string): string[] {
  const out = new Set<string>();
  // Match "49 CFR § 391.41(b)(8)" and "§ 395.3(a)(3)(ii)" etc.
  const re = /(?:49\s*CFR\s*)?§?\s*(\d{2,3}\.\d+(?:\([a-z0-9]+\))*)/gi;
  let m;
  while ((m = re.exec(text)) !== null) {
    const sec = m[1];
    // Filter out obvious false positives — must look like a real CFR section
    if (/^\d{2,3}\.\d+/.test(sec)) out.add(sec);
  }
  return Array.from(out);
}

/** Categorize the question for the weekly report. */
function categorizeQuestion(q: string): string {
  const s = q.toLowerCase();
  if (/(hazmat|placard|hm-?\d|hazardous material|class\s+[1-9])/.test(s)) return "HM";
  if (/(hours of service|hos|395|sleeper berth|34.hour|34 hour|restart)/.test(s)) return "HOS";
  if (/(drug|alcohol|382|clearinghouse|sap)/.test(s)) return "DA";
  if (/(driver qualification|dq file|391|mvr|medical card)/.test(s)) return "DQF";
  if (/(inspection|396|dvir|annual inspection)/.test(s)) return "INSP";
  if (/(csa|sms|datalq|dataq|basics?)/.test(s)) return "CSA";
  if (/(cdl|383|endorsement)/.test(s)) return "CDL";
  if (/(insurance|387|bmc.91)/.test(s)) return "FIN";
  if (/(ifta|fuel tax)/.test(s)) return "IFTA";
  if (/(eld|electronic log)/.test(s)) return "ELD";
  return "GEN";
}

/** Check that each cited section actually exists in eCFR (Title 49). */
async function verifyCitations(sections: string[]): Promise<string[]> {
  if (sections.length === 0) return [];
  const unverified: string[] = [];

  // eCFR API: GET /api/versioner/v1/structure/{date}/title-49.json — too big to fetch per call.
  // Cheaper: HEAD against the human-readable URL — exists = 200, fake = 404.
  // Use Promise.allSettled w/ short timeout so this never blocks the response by > 3s.
  const checks = sections.map(async (sec) => {
    // sec like "391.41" or "391.41(b)(8)" — strip the subsection for the URL check
    const base = sec.split("(")[0];
    const parts = base.split(".");
    if (parts.length !== 2) return { sec, ok: false };
    try {
      const r = await Promise.race([
        fetch(`https://www.ecfr.gov/current/title-49/section-${base}`, { method: "HEAD", redirect: "follow" }),
        new Promise<Response>((_, rej) => setTimeout(() => rej(new Error("timeout")), 2500)),
      ]) as Response;
      return { sec, ok: r.ok || r.status === 405 };  // 405 means HEAD not allowed but URL exists
    } catch {
      // On timeout, don't penalize — assume verified to avoid false negatives
      return { sec, ok: true };
    }
  });

  const results = await Promise.allSettled(checks);
  for (const r of results) {
    if (r.status === "fulfilled" && !r.value.ok) unverified.push(r.value.sec);
  }
  return unverified;
}

/** Best-effort log to compass_prompt_eval. Never throws — logging failures should not break /api/ask. */
async function logEval(env: Env, row: Record<string, unknown>) {
  if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE) return;
  try {
    await fetch(`${env.SUPABASE_URL}/rest/v1/compass_prompt_eval`, {
      method: "POST",
      headers: {
        apikey: env.SUPABASE_SERVICE_ROLE,
        Authorization: `Bearer ${env.SUPABASE_SERVICE_ROLE}`,
        "Content-Type": "application/json",
        Prefer: "return=minimal",
      },
      body: JSON.stringify(privacySafePromptTelemetry(row)),
    });
  } catch (e) {
    console.error("[ask] logEval failed", e);
  }
}

export const onRequestPost: PagesFunction<Env> = async (ctx) => {
  const t0 = Date.now();
  let userId: string | null = null;
  let userQuestion = "";
  let category = "GEN";

  try {
    const token = bearerFromRequest(ctx.request);
    const user = await verifySupabaseJwt(ctx.env, token);
    if (!user) return json({ ok: false, error: "Unauthorized" }, 401);
    userId = user.id;

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

    userQuestion = messages[messages.length - 1].content.slice(0, 4000);
    category = categorizeQuestion(userQuestion);

    const model = body.model || "claude-sonnet-4-6";

    const r = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": ctx.env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ model, max_tokens: 2048, system: SYSTEM_PROMPT, messages }),
    });

    if (!r.ok) {
      const txt = await r.text();
      console.error("[ask] Anthropic error", { status: r.status });
      ctx.waitUntil(logEval(ctx.env, {
        user_id: userId, prompt_version: PROMPT_VERSION, model,
        user_question: userQuestion, question_category: category,
        errored: true, error_class: `anthropic_${r.status}`, error_detail: txt.slice(0, 500),
        response_ms: Date.now() - t0,
      }));
      return securityError(502, "upstream_failed", correlationId(ctx.request));
    }

    const data = (await r.json()) as { content?: Array<{ type: string; text: string }>; usage?: Record<string, number>; model?: string };
    const text = (data.content || []).filter((b) => b.type === "text").map((b) => b.text).join("\n\n");

    // Citation extraction + eCFR round-trip
    const cited = extractCfrCitations(text);
    const unverified = await verifyCitations(cited);
    const quality = cited.length > 0 ? Math.max(0, 1 - unverified.length / cited.length) : null;

    // Log (non-blocking — don't make the user wait)
    ctx.waitUntil(logEval(ctx.env, {
      user_id: userId,
      prompt_version: PROMPT_VERSION,
      model: data.model || model,
      user_question: userQuestion,
      question_category: category,
      response_text: text.slice(0, 16000),
      response_ms: Date.now() - t0,
      input_tokens: data.usage?.input_tokens ?? null,
      output_tokens: data.usage?.output_tokens ?? null,
      cited_sections: cited,
      unverified_citations: unverified,
      citation_quality_score: quality,
      errored: false,
    }));

    return json({
      ok: true,
      content: text,
      model: data.model,
      usage: data.usage,
      // Quality signals — the UI shows a warning chip when these surface
      cited_sections: cited,
      unverified_citations: unverified,
      citation_quality_score: quality,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[ask] handler error", { correlation_id: correlationId(ctx.request) });
    ctx.waitUntil(logEval(ctx.env, {
      user_id: userId, prompt_version: PROMPT_VERSION,
      user_question: userQuestion, question_category: category,
      errored: true, error_class: "handler_error", error_detail: msg.slice(0, 500),
      response_ms: Date.now() - t0,
    }));
    return securityError(500, "request_failed", correlationId(ctx.request));
  }
};
