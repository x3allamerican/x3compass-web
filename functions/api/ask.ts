/**
 * POST /api/ask
 * ------------------------------------------------------------
 * Powers BOTH the homepage AI Concierge demo and every
 * ConciergeModal opened across the app.
 *
 * Body shape:
 *   { messages: [{role:'user'|'assistant', content:string}, ...],
 *     context?: 'hazmat-placards' | 'hazmat-substances' | ... }
 *
 * Returns: { ok: true, content: string, sources?: Array<{id, name, cfr}> }
 *          { ok: false, error: string }
 *
 * ===========================================================
 * Sprint #430 — Grounded in the 300-skill X3 Compass corpus.
 * ===========================================================
 *  - Bundles ../../src/data/skills-corpus.json at build time
 *  - On every question: tokenizes, scores all 300 catalog entries
 *    by token + CFR-section overlap, picks the top 5, and injects
 *    their (name + cfr + description + body if available) into
 *    the Claude system prompt as AUTHORITATIVE SOURCE material.
 *  - Tells the model to cite from those entries verbatim and to
 *    quote the CFR sections that came back from retrieval.
 *  - Adds Cache-Control so identical questions inside an hour
 *    come straight from CF's edge cache (~10ms), no Claude call.
 *
 * Env vars required on Cloudflare Pages:
 *   ANTHROPIC_API_KEY  · sk-ant-…
 */

// @ts-expect-error · JSON import resolved at bundle time by esbuild (CF Pages Functions bundler)
import CORPUS from "../../src/data/skills-corpus.json";

interface Env { ANTHROPIC_API_KEY?: string }

const json = (b: unknown, s = 200, extra: Record<string, string> = {}) =>
  new Response(JSON.stringify(b), {
    status: s,
    headers: { "Content-Type": "application/json", ...extra },
  });

type Msg = { role: "user" | "assistant"; content: string };

type CorpusEntry = {
  id: string;
  name: string;
  cfr: string;
  cat: string;
  q: string;
  body?: string;
};

const SKILLS = CORPUS as CorpusEntry[];

const BASE_SYSTEM = `You are Compass — the AI Safety Director for X3 Compass, an FMCSA/DOT compliance platform for small-to-mid motor carriers (1–100 power units).

Voice:
• Direct, plain-English, respectful of the reader's time.
• Translate dense CFR rules into action items.
• Cite specific CFR sections (e.g. § 391.51, § 172.704) when relevant.
• Never invent regulations. If you're not sure, say so and point to the § that should be checked.
• Avoid "revolutionary," "game-changer," "leverage," or sales/hype language.

Format:
• Short paragraphs or tight bullet lists, not walls of text.
• Use **bold** for key terms; backticks for CFR citations (\`§ 395.3(a)(1)\`).
• Close with one concrete next step when applicable.
• Never reproduce more than 15 words verbatim from any source.

Audience: a dispatcher, safety manager, or owner-operator worried about a roadside inspection, audit, or driver-qualification issue.`;

const CONTEXT_PRIMERS: Record<string, string> = {
  "hazmat-placards": "Topic focus: 49 CFR § 172 Subpart F — placards, UN/NA numbers, Table 1 vs Table 2 substances, the 1,001-lb aggregate rule, DANGEROUS placard rules, segregation, and § 172.519 dimensions.",
  "hazmat-substances": "Topic focus: 49 CFR § 172.101 Hazardous Materials Table — proper shipping names, hazard classes, packing groups, Column 7 special provisions, marine pollutants, and forbidden materials.",
  "hazmat-lithium": "Topic focus: lithium battery shipping — UN 3480, 3481, 3090, 3091 — Section II / IB / full Class 9 thresholds, watt-hour limits, packed-with vs in-equipment, damaged/defective/recalled rules.",
  "hazmat-exemptions": "Topic focus: hazmat exemptions — Limited Quantity, Materials of Trade (§ 173.6), Excepted Quantities (§ 173.4a), and DOT Special Permits.",
  "hazmat-audit": "Topic focus: FMCSA hazmat audits — the four areas (classification, papers, placarding, training), § 172.201(e) 3-year retention, sampling strategy, and Compliance Reviews.",
  "hazmat-shipping-papers": "Topic focus: 49 CFR § 172 Subpart C — shipping papers, the § 172.202(a) entry sequence, shipper's certification, § 172.604 emergency phone, and hazardous waste manifests.",
  "hazmat-emergency": "Topic focus: emergency response — current ERG edition, § 172.604 24/7 phone rule, DOT-F-5800.1 incident reports, § 171.15 immediate notice, § 171.16 written report.",
  "hazmat-training": "Topic focus: § 172.704 hazmat training — 3-year cycle, general awareness, function-specific, safety, security awareness, in-depth security, and § 172.704(d) retention.",
  "hazmat-security": "Topic focus: § 172.800 hazmat security plans — Table 1 substance triggers, the three required components (personnel / unauthorized-access / en-route), review cadence.",
  "drivers": "Topic focus: 49 CFR Part 391 — driver qualification, application content (§ 391.21), DOT physical (§ 391.41), CDL (§ 391.11), road test (§ 391.31), annual MVR + driver review (§ 391.25), DQ-file retention (§ 391.51).",
  "dq-files": "Topic focus: 49 CFR § 391.51 — driver qualification file contents, the 12 required documents, retention for duration of employment plus 3 years.",
  "hos": "Topic focus: 49 CFR Part 395 — Hours of Service. 11-hr drive, 14-hr duty, 30-min break, 60/70-hr rolling cycles, split-sleeper, short-haul exemption, and ELD requirements under § 395.8.",
  "drug-alcohol": "Topic focus: 49 CFR Part 382 — DOT drug & alcohol testing program, pre-employment, random, post-accident, reasonable suspicion, return-to-duty, follow-up, and the FMCSA Clearinghouse.",
  "mvr": "Topic focus: 49 CFR § 391.25 — annual MVR pull and annual driver review, plus state-specific MVR ordering.",
  "vehicles": "Topic focus: 49 CFR Part 396 — vehicle inspection, repair, and maintenance. Annual inspection (§ 396.17), DVIR (§ 396.11), pre-trip / post-trip (§ 396.13).",
  "inspections": "Topic focus: CVSA roadside inspection levels I–VIII, post-inspection workflow, OOS criteria, and DataQ challenges via FMCSA's NCB.",
  "accidents": "Topic focus: 49 CFR § 390.5T DOT-recordable definition, § 390.15 accident register, post-accident drug & alcohol testing (§ 382.303), and DataQ for non-preventable findings.",
  "clearinghouse": "Topic focus: FMCSA Drug & Alcohol Clearinghouse — pre-employment full query, annual limited query, consent requirements, and reporting violations.",
  "background-checks": "Topic focus: pre-employment background checks under § 391.23 — PSP, MVR, 3-year prior-employer query, FCRA-compliant Disclosure & Consent.",
  "ifta": "Topic focus: International Fuel Tax Agreement — quarterly filing, mile tracking by jurisdiction, fuel receipts retention.",
  "training": "Topic focus: 49 CFR Part 380 — Entry-Level Driver Training (ELDT), behind-the-wheel and theory requirements, TPR (Training Provider Registry) flow.",
  "scorecards": "Topic focus: FMCSA CSA SMS BASICs — Unsafe Driving, HOS, Driver Fitness, Controlled Substances/Alcohol, Vehicle Maintenance, Hazmat, Crash Indicator.",
};

// ────────────────────────────────────────────────────────────
// RETRIEVAL — score 300 catalog entries against the question
// ────────────────────────────────────────────────────────────

// Tokens with at least 3 chars, lowercased, dedup'd, with common stop-words stripped.
const STOP = new Set([
  "the","a","an","of","and","or","is","are","was","were","be","been","being",
  "to","in","on","for","at","by","from","with","as","that","this","these","those",
  "do","does","did","can","could","should","would","will","i","my","me","you","your",
  "we","our","what","when","where","why","how","which","whose","whom","under","over",
  "between","into","than","then","also","but","not","no","yes","if","so","up","down",
  "out","into","about","per","via","vs"
]);

function tokenize(s: string): Set<string> {
  const toks = (s.toLowerCase().match(/[a-z0-9§]+/g) || [])
    .filter((t) => t.length >= 3 && !STOP.has(t));
  return new Set(toks);
}

// Pull out CFR-style sections like "§ 391.51", "172.704", "Part 395" — strong signal.
function cfrSignals(s: string): string[] {
  const matches: string[] = [];
  const sectionRe = /(?:§\s*)?(\d{2,3}\.\d{1,3})/g;
  let m: RegExpExecArray | null;
  while ((m = sectionRe.exec(s)) !== null) matches.push(m[1]);
  const partRe = /\bpart\s+(\d{2,4})\b/gi;
  while ((m = partRe.exec(s)) !== null) matches.push(`part-${m[1]}`);
  return matches;
}

type Scored = { entry: CorpusEntry; score: number };

function retrieve(question: string, top = 5): Scored[] {
  const qTokens = tokenize(question);
  const qCfrs = cfrSignals(question);

  const scored: Scored[] = SKILLS.map((entry) => {
    // Combine searchable fields
    const haystack = `${entry.name} ${entry.q} ${entry.cat} ${entry.cfr} ${entry.id}`;
    const hTokens = tokenize(haystack);

    // Token overlap
    let overlap = 0;
    for (const t of qTokens) if (hTokens.has(t)) overlap++;

    // CFR exact-match bonus (huge signal)
    const entryCfrs = cfrSignals(entry.cfr);
    let cfrHit = 0;
    for (const c of qCfrs) if (entryCfrs.includes(c)) cfrHit++;

    // Category mention bonus
    const catTokens = tokenize(entry.cat);
    let catHit = 0;
    for (const t of catTokens) if (qTokens.has(t)) catHit++;

    // Body presence is a tiebreaker (we have richer ground-truth to cite from)
    const bodyBonus = entry.body ? 0.5 : 0;

    const score = overlap + cfrHit * 5 + catHit * 1.5 + bodyBonus;
    return { entry, score };
  });

  return scored
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, top);
}

function buildSkillContext(hits: Scored[]): string {
  if (hits.length === 0) return "";

  const lines: string[] = [
    "",
    "─── AUTHORITATIVE SOURCE: X3 COMPASS SKILL CORPUS ───",
    "The following entries from the 300-skill X3 Compass corpus are the most relevant to the user's question.",
    "Treat these as the authoritative answer source. Cite their CFR sections verbatim. Do NOT invent citations beyond what appears below.",
    "",
  ];
  for (const { entry } of hits) {
    lines.push(`### ${entry.name}  ·  \`${entry.cfr}\`  ·  [${entry.cat}]`);
    lines.push(entry.q);
    if (entry.body) {
      lines.push("");
      lines.push(entry.body);
    }
    lines.push("");
  }
  lines.push("─── END SKILL CORPUS ───");
  return lines.join("\n");
}

// ────────────────────────────────────────────────────────────
// EDGE CACHE — identical messages.length=1 hits cache for 1h
// ────────────────────────────────────────────────────────────

async function sha256Hex(s: string): Promise<string> {
  const buf = new TextEncoder().encode(s);
  const hash = await crypto.subtle.digest("SHA-256", buf);
  return [...new Uint8Array(hash)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

// ────────────────────────────────────────────────────────────
// HANDLER
// ────────────────────────────────────────────────────────────

export const onRequestPost: PagesFunction<Env> = async (ctx) => {
  if (!ctx.env.ANTHROPIC_API_KEY) {
    return json({
      ok: false,
      error: "AI is not configured on this deployment. Set ANTHROPIC_API_KEY in Cloudflare Pages → Settings → Environment variables.",
    }, 503);
  }

  let body: { messages?: Msg[]; context?: string };
  try { body = await ctx.request.json(); } catch { return json({ ok: false, error: "Invalid JSON body" }, 400); }

  const messages = Array.isArray(body.messages) ? body.messages : [];
  if (messages.length === 0) return json({ ok: false, error: "messages array is required" }, 400);

  // Use the last user turn as the retrieval query
  const lastUser = [...messages].reverse().find((m) => m.role === "user");
  const question = (lastUser?.content || "").trim();
  if (!question) return json({ ok: false, error: "No user content to ground" }, 400);

  // ── Edge cache lookup for single-turn questions only ──
  const cache = (caches as unknown as { default: Cache }).default;
  const cacheable = messages.length === 1 && !body.context;
  let cacheKey: Request | null = null;
  if (cacheable) {
    const keyHash = await sha256Hex(question.toLowerCase().replace(/\s+/g, " "));
    cacheKey = new Request(`https://x3-ask-cache.internal/v1/${keyHash}`, { method: "GET" });
    const hit = await cache.match(cacheKey);
    if (hit) {
      // Add a header so we can verify cache behavior with curl -I
      const cached = await hit.json();
      return json(cached, 200, { "X-X3-Cache": "HIT", "Cache-Control": "public, max-age=3600" });
    }
  }

  // ── Retrieval over the 300-skill corpus ──
  const hits = retrieve(question, 5);
  const skillBlock = buildSkillContext(hits);

  // ── Compose system prompt: base voice + context primer + retrieved skills ──
  const primer = body.context && CONTEXT_PRIMERS[body.context];
  const system = [
    BASE_SYSTEM,
    primer || "",
    skillBlock,
  ].filter(Boolean).join("\n\n");

  // ── Sanitize the message turns we forward to Anthropic ──
  const cleanTurns = messages
    .filter((m) => m && typeof m.content === "string" && m.content.trim().length > 0)
    .map((m) => ({ role: m.role === "assistant" ? "assistant" as const : "user" as const, content: m.content.trim() }))
    .filter((m, i, a) => i > 0 || m.role === "user")
    .slice(-20);

  if (cleanTurns.length === 0) return json({ ok: false, error: "No usable user content in messages" }, 400);

  try {
    const r = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": ctx.env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-6",
        max_tokens: 1024,
        system,
        messages: cleanTurns,
      }),
    });

    if (!r.ok) {
      const text = await r.text();
      return json({ ok: false, error: `Anthropic ${r.status}: ${text.slice(0, 300)}` }, 502);
    }

    const resp = (await r.json()) as { content?: Array<{ type?: string; text?: string }> };
    const content = resp.content?.map((c) => c.text || "").join("\n").trim();
    if (!content) return json({ ok: false, error: "Empty response from model" }, 502);

    // Expose which skills grounded the answer — homepage Concierge can show them.
    const sources = hits.map(({ entry }) => ({ id: entry.id, name: entry.name, cfr: entry.cfr }));
    const payload = { ok: true, content, sources };

    // Cache single-turn answers at the edge for 1h
    if (cacheable && cacheKey) {
      const toCache = new Response(JSON.stringify(payload), {
        status: 200,
        headers: { "Content-Type": "application/json", "Cache-Control": "public, max-age=3600" },
      });
      ctx.waitUntil(cache.put(cacheKey, toCache));
    }

    return json(payload, 200, {
      "X-X3-Cache": cacheable ? "MISS" : "BYPASS",
      "X-X3-Skills-Matched": String(hits.length),
      "Cache-Control": cacheable ? "public, max-age=3600" : "no-store",
    });
  } catch (err) {
    return json({
      ok: false,
      error: err instanceof Error ? err.message : String(err),
    }, 500);
  }
};
