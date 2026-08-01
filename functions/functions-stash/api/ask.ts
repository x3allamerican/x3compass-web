/**
 * POST /api/ask
 * ------------------------------------------------------------
 * Powers BOTH the /app/ask page and every ConciergeModal opened
 * across the app. Body shape:
 *   { messages: [{role:'user'|'assistant', content:string}, ...],
 *     context?: 'hazmat-placards' | 'hazmat-substances' | ... }
 *
 * Returns: { ok: true, content: string }   on success
 *          { ok: false, error: string }    on failure
 *
 * Uses Claude (claude-sonnet-4-6) via the Anthropic Messages API.
 * The context param swaps in a topic-specific system primer so the
 * Concierge stays scoped to e.g. placards / lithium batteries /
 * shipping papers when invoked from the matching hazmat page.
 *
 * Env vars required on Cloudflare Pages:
 *   ANTHROPIC_API_KEY  · sk-ant-…
 */
interface Env { ANTHROPIC_API_KEY?: string }

const json = (b: unknown, s = 200) =>
  new Response(JSON.stringify(b), { status: s, headers: { "Content-Type": "application/json" } });

type Msg = { role: "user" | "assistant"; content: string };

const BASE_SYSTEM = `You are Compass — the AI Safety Director for X3 Compass, an FMCSA/DOT compliance platform used by small-to-mid motor carriers (1–100 power units).

Voice:
• Direct, plain-English, respectful of the reader's time.
• Translate dense CFR rules into action items.
• Cite the specific CFR section (e.g. § 391.51, § 172.704) when relevant.
• Never invent regulations. If you're not sure, say so and point to a § that should be checked.
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

  // Build the system prompt — base voice + optional context primer.
  const primer = body.context && CONTEXT_PRIMERS[body.context];
  const system = primer ? `${BASE_SYSTEM}\n\n${primer}` : BASE_SYSTEM;

  // Sanitize the message turns we forward to Anthropic.
  const cleanTurns = messages
    .filter((m) => m && typeof m.content === "string" && m.content.trim().length > 0)
    .map((m) => ({ role: m.role === "assistant" ? "assistant" as const : "user" as const, content: m.content.trim() }))
    // Anthropic requires alternating roles starting with user. If first turn is assistant, drop it.
    .filter((m, i, a) => i > 0 || m.role === "user")
    .slice(-20); // keep last 20 turns max — protects context window + cost.

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

    return json({ ok: true, content });
  } catch (err) {
    return json({
      ok: false,
      error: err instanceof Error ? err.message : String(err),
    }, 500);
  }
};
