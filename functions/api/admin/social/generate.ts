/**
 * POST /api/admin/social/generate
 * Body: { carrier_id, topic, platforms: ['x','linkedin',...], count: number }
 * Uses Anthropic to generate launch-month drafts in X3 Fleet Safety's brand voice.
 * Inserts as 'pending' so they show up on the admin review queue.
 */
interface Env { SUPABASE_URL?: string; SUPABASE_SERVICE_ROLE?: string; ANTHROPIC_API_KEY?: string; }
const json = (b: unknown, s = 200) => new Response(JSON.stringify(b), { status: s, headers: { "Content-Type": "application/json" } });

const PLATFORM_BRIEFS: Record<string, string> = {
  x:         "X / Twitter post · 280 char hard cap · single hashtag · concise punchline. No fluff. Aim for a thumb-stop opening line.",
  linkedin:  "LinkedIn post · professional tone · 800-1200 chars · 3-5 line paragraphs · end with a soft CTA. No emojis except occasionally one at the top.",
  tiktok:    "TikTok caption · 100-150 chars · 3-5 hashtags · hook-driven · references on-camera content (assume a short video accompanies).",
  instagram: "Instagram caption · 150-300 chars · 5-10 hashtags · friendly · visual hook · single emoji at start.",
  reddit:    "Reddit post · plain text · no marketing language · genuinely helpful framing · ends with a question. Avoid hashtags.",
  facebook:  "Facebook post · 300-500 chars · conversational · single CTA link.",
  threads:   "Threads post · 500 chars · casual · LinkedIn-meets-Twitter tone.",
};

const X3FS_BRAND = `X3 Fleet Safety is a DOT compliance service for small-to-mid motor carriers (1–100 power units).
The brand voice is direct, plain-English, and respectful of fleet owners' time. We translate dense CFR rules into practical action items.
We sell trust and audit-readiness — not buzzwords. Tone is like a trusted compliance manager, not a salesperson. Cite CFR sections (e.g. § 391.51) when relevant. Avoid "revolutionary," "game-changer," "leverage," or other hype words.
Target reader: a dispatcher, safety manager, or owner-operator of a 5–50 truck fleet who's worried about a roadside inspection or new-entrant audit.`;

export const onRequestPost: PagesFunction<Env> = async (ctx) => {
  let body: { carrier_id?: string; topic?: string; platforms?: string[]; count?: number };
  try { body = await ctx.request.json(); } catch { return json({ ok: false, error: "Invalid JSON" }, 400); }
  if (!body.carrier_id) return json({ ok: false, error: "Missing carrier_id" }, 400);
  if (!body.topic) return json({ ok: false, error: "Missing topic" }, 400);
  const platforms = body.platforms && body.platforms.length > 0 ? body.platforms : ["x", "linkedin", "tiktok", "instagram", "reddit"];
  const count = Math.min(body.count || 5, 20);
  if (!ctx.env.ANTHROPIC_API_KEY) return json({ ok: false, configured: false, error: "Anthropic not configured — set ANTHROPIC_API_KEY on Cloudflare Pages." }, 503);
  if (!ctx.env.SUPABASE_URL || !ctx.env.SUPABASE_SERVICE_ROLE) return json({ ok: false, error: "Server missing Supabase env" }, 500);

  const drafts: { carrier_id: string; platform: string; body: string; ai_generated: boolean; ai_prompt_used: string; status: string }[] = [];
  for (const platform of platforms) {
    const brief = PLATFORM_BRIEFS[platform] || PLATFORM_BRIEFS.linkedin;
    const sys = `You write social media posts for X3 Fleet Safety.\n\n${X3FS_BRAND}\n\nReturn ONLY a JSON array of ${count} unique post bodies. No prose, no markdown, no numbering. Each entry is a plain string.\n\nPlatform brief: ${brief}`;
    const userPrompt = `Topic / theme: ${body.topic}\n\nGenerate ${count} ${platform} posts. Each one is distinct — different angle, different hook, different CTA. No duplicates.`;
    try {
      const r = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "x-api-key": ctx.env.ANTHROPIC_API_KEY, "anthropic-version": "2023-06-01", "content-type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-6",
          max_tokens: 4096,
          system: sys,
          messages: [{ role: "user", content: userPrompt }],
        }),
      });
      if (!r.ok) { drafts.push({ carrier_id: body.carrier_id, platform, body: `[generation failed: ${r.status}]`, ai_generated: true, ai_prompt_used: userPrompt, status: "failed" }); continue; }
      const resp = await r.json() as { content?: Array<{ text?: string }> };
      const text = resp.content?.[0]?.text || "[]";
      const match = text.match(/\[[\s\S]*\]/);
      const arr = match ? JSON.parse(match[0]) as string[] : [];
      for (const post of arr) {
        if (typeof post === "string" && post.trim()) {
          drafts.push({ carrier_id: body.carrier_id, platform, body: post.trim(), ai_generated: true, ai_prompt_used: body.topic || "", status: "pending" });
        }
      }
    } catch (err) {
      drafts.push({ carrier_id: body.carrier_id, platform, body: `[generation exception: ${err instanceof Error ? err.message : String(err)}]`, ai_generated: true, ai_prompt_used: body.topic || "", status: "failed" });
    }
  }

  // Insert all drafts in one shot
  if (drafts.length === 0) return json({ ok: false, error: "No drafts generated" });
  const ins = await fetch(`${ctx.env.SUPABASE_URL}/rest/v1/compass_social_posts`, {
    method: "POST",
    headers: { apikey: ctx.env.SUPABASE_SERVICE_ROLE, Authorization: `Bearer ${ctx.env.SUPABASE_SERVICE_ROLE}`, "Content-Type": "application/json", Prefer: "return=representation" },
    body: JSON.stringify(drafts),
  });
  if (!ins.ok) return json({ ok: false, error: `Supabase insert ${ins.status}: ${(await ins.text()).slice(0, 200)}` }, 500);
  const inserted = (await ins.json()) as unknown[];
  return json({ ok: true, inserted: inserted.length, platforms, count_per_platform: count });
};
