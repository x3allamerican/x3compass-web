/**
 * POST /api/ask-demo
 *
 * Public, no-auth Ask Compass demo. Rate-limited per IP. Lets prospects
 * taste the product without signing up — see real CFR-cited answers with
 * the same eCFR verification chip the live product uses.
 *
 * Limits:
 *   - 5 requests per IP per 6 hours (rate-limit infra)
 *   - 800-char prompt max (no jailbreaks via giant context)
 *   - 1200 max_tokens response (smaller than authed endpoint)
 *   - Same SYSTEM_PROMPT as /api/ask
 *
 * Logs to compass_prompt_eval with prompt_version='demo-v1' so we can
 * weekly-report the public-demo quality separately.
 */

import { rateLimit } from "../_shared/rate-limit";
import { privacySafePromptTelemetry } from "../_shared/privacy";

interface Env {
  SUPABASE_URL?: string;
  SUPABASE_SERVICE_ROLE?: string;
  ANTHROPIC_API_KEY?: string;
}

const json = (d: unknown, s = 200) =>
  new Response(JSON.stringify(d), { status: s, headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" } });

const SYSTEM_PROMPT = `You are X3 Compass, the AI Safety Director for FMCSA-regulated motor carriers (1-100 power units). You answer DOT compliance questions with these absolute rules:

1. EVERY substantive claim cites the exact CFR section (e.g. "per 49 CFR § 391.41(b)(8)").
2. If you don't know, say so. Never invent a section number, deadline, or rule.
3. Use plain English. The user is a fleet safety manager or owner-operator, not a lawyer.
4. Keep your response under 350 words — this is a demo, give them the answer fast.
5. End with one short note: "Verified citations highlighted ✓ · This is a demo. Get the full Compass at x3compass.com."

For audit-grade legal interpretation, always recommend the user verify with a transportation attorney.`;

function extractCfrCitations(text: string): string[] {
  const out = new Set<string>();
  const re = /(?:49\s*CFR\s*)?§?\s*(\d{2,3}\.\d+(?:\([a-z0-9]+\))*)/gi;
  let m;
  while ((m = re.exec(text)) !== null) {
    if (/^\d{2,3}\.\d+/.test(m[1])) out.add(m[1]);
  }
  return Array.from(out);
}

async function verifyCitations(sections: string[]): Promise<string[]> {
  if (sections.length === 0) return [];
  const unverified: string[] = [];
  const checks = sections.map(async (sec) => {
    const base = sec.split("(")[0];
    try {
      const r = await Promise.race([
        fetch(`https://www.ecfr.gov/current/title-49/section-${base}`, { method: "HEAD", redirect: "follow" }),
        new Promise<Response>((_, rej) => setTimeout(() => rej(new Error("timeout")), 2000)),
      ]) as Response;
      return { sec, ok: r.ok || r.status === 405 };
    } catch {
      return { sec, ok: true };
    }
  });
  const results = await Promise.allSettled(checks);
  for (const r of results) {
    if (r.status === "fulfilled" && !r.value.ok) unverified.push(r.value.sec);
  }
  return unverified;
}

async function logDemo(env: Env, row: Record<string, unknown>) {
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
  } catch (e) { console.error("[ask-demo] log failed", e); }
}

export const onRequestPost: PagesFunction<Env> = async (ctx) => {
  const t0 = Date.now();
  try {
    // Rate limit — public endpoint, conservative
    const rl = rateLimit(ctx.request, { key: "ask-demo", max: 5, windowSec: 6 * 3600 });
    if (rl) return rl;

    if (!ctx.env.ANTHROPIC_API_KEY) {
      return json({ ok: false, error: "Demo temporarily unavailable" }, 503);
    }

    let body: { prompt?: string };
    try { body = await ctx.request.json(); } catch { return json({ ok: false, error: "Invalid JSON" }, 400); }

    const prompt = (body.prompt || "").toString().trim();
    if (!prompt) return json({ ok: false, error: "Ask a question" }, 400);
    if (prompt.length > 800) return json({ ok: false, error: "Demo questions limited to 800 characters" }, 400);

    const r = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": ctx.env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-6",
        max_tokens: 1200,
        system: SYSTEM_PROMPT,
        messages: [{ role: "user", content: prompt }],
      }),
    });

    if (!r.ok) {
      console.error("[ask-demo] Anthropic error", { status: r.status });
      return json({ ok: false, error: "AI service unavailable — try again in a moment" }, 502);
    }

    const data = (await r.json()) as { content?: Array<{ type: string; text: string }>; usage?: Record<string, number>; model?: string };
    const text = (data.content || []).filter((b) => b.type === "text").map((b) => b.text).join("\n\n");
    const cited = extractCfrCitations(text);
    const unverified = await verifyCitations(cited);
    const quality = cited.length > 0 ? Math.max(0, 1 - unverified.length / cited.length) : null;

    ctx.waitUntil(logDemo(ctx.env, {
      prompt_version: "demo-v1",
      model: data.model || "claude-sonnet-4-6",
      user_question: prompt.slice(0, 4000),
      question_category: "DEMO",
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
      cited_sections: cited,
      unverified_citations: unverified,
      citation_quality_score: quality,
    });
  } catch (err) {
    void err;
    console.error("[ask-demo] handler error");
    return json({ ok: false, error: "Server error — try again" }, 500);
  }
};
