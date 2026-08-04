/**
 * POST /api/screenings/mvr/parse   (Bearer Supabase JWT)
 *
 * Accept an uploaded MVR document (PDF/image, base64) and extract the
 * structured fields (license status/class, expiration, endorsements,
 * restrictions, points, violations, accidents) for the review screen.
 * Stores the upload in mvr_uploads and returns the extraction.
 *
 * Degrades gracefully: if no AI key is configured (ANTHROPIC_API_KEY) or the
 * extraction fails, it records the upload and returns needs_manual:true so the
 * UI falls back to the manual-entry modal.
 *
 * Body: { carrier_id?, driver_id?, filename, mime_type, file_base64 }
 */
import { correlationId, isUuid, requireTenant, securityError, type SecurityEnv } from "../../../_shared/request-security";
import { supaFetch } from "../../../_shared/supabase-admin";

interface Env extends SecurityEnv {
  ANTHROPIC_API_KEY?: string;
  ANTHROPIC_MODEL?: string;
}

const json = (data: unknown, status = 200): Response =>
  new Response(JSON.stringify(data), { status, headers: { "Content-Type": "application/json", "Cache-Control": "no-store" } });

type Body = { carrier_id?: string; driver_id?: string; filename?: string; mime_type?: string; file_base64?: string };

const EXTRACT_INSTRUCTIONS = `You are extracting data from a US Motor Vehicle Record (MVR / driving record).
Return ONLY a compact JSON object with these keys (use null when absent):
{"license_number":str,"license_state":2-letter,"license_class":str,"license_status":str,"expiration_date":"YYYY-MM-DD","endorsements":[str],"restrictions":[str],"points":number,"violations":[{"date":"YYYY-MM-DD","description":str}],"accidents":[{"date":"YYYY-MM-DD","description":str}],"pulled_on":"YYYY-MM-DD"}
No prose, no markdown fences — JSON only.`;

export const onRequestPost: PagesFunction<Env> = async (ctx) => {
  const requestId = correlationId(ctx.request);
  let body: Body;
  try { body = (await ctx.request.json()) as Body; } catch { return json({ ok: false, error: "Invalid JSON" }, 400); }

  let authority;
  try { authority = await requireTenant(ctx.request, ctx.env, body.carrier_id); }
  catch { return securityError(503, "authorization_unavailable", requestId); }
  if (!authority.ok) return securityError(authority.status, authority.code, requestId);
  if (body.driver_id && !isUuid(body.driver_id)) return json({ ok: false, error: "driver_id must be a UUID" }, 400);
  if (!body.file_base64) return json({ ok: false, error: "file_base64 required" }, 400);

  const supa = supaFetch(ctx.env);
  const mime = body.mime_type || "application/pdf";
  const uploadRow = (await supa.insert("mvr_uploads", {
    carrier_id: authority.carrierId,
    driver_id: body.driver_id || null,
    filename: body.filename || "mvr-upload",
    mime_type: mime,
    parser_status: "pending",
    uploaded_by: authority.userId,
    uploaded_at: new Date().toISOString(),
  }))[0] as { id: string };
  const uploadId = uploadRow.id;

  const finish = async (status: string, patch: Record<string, unknown>) =>
    supa.update("mvr_uploads", `id=eq.${uploadId}`, { parser_status: status, parsed_at: new Date().toISOString(), ...patch });

  if (!ctx.env.ANTHROPIC_API_KEY) {
    await finish("manual_required", {});
    return json({ ok: true, upload_id: uploadId, extracted: null, needs_manual: true, reason: "no_ai_key" });
  }

  try {
    const isImage = /^image\//i.test(mime);
    const contentBlock = isImage
      ? { type: "image", source: { type: "base64", media_type: mime, data: body.file_base64 } }
      : { type: "document", source: { type: "base64", media_type: "application/pdf", data: body.file_base64 } };
    const r = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "x-api-key": ctx.env.ANTHROPIC_API_KEY, "anthropic-version": "2023-06-01", "Content-Type": "application/json" },
      body: JSON.stringify({
        model: ctx.env.ANTHROPIC_MODEL || "claude-3-5-sonnet-latest",
        max_tokens: 1500,
        messages: [{ role: "user", content: [contentBlock, { type: "text", text: EXTRACT_INSTRUCTIONS }] }],
      }),
    });
    const txt = await r.text();
    if (!r.ok) { await finish("error", { parser_error: `AI ${r.status}: ${txt.slice(0, 180)}` }); return json({ ok: true, upload_id: uploadId, extracted: null, needs_manual: true, reason: "ai_error" }); }
    const parsed = JSON.parse(txt) as { content?: Array<{ text?: string }> };
    const raw = (parsed.content || []).map((c) => c.text || "").join("").trim().replace(/^```json?\s*|\s*```$/g, "");
    let extracted: Record<string, unknown> | null = null;
    try { extracted = JSON.parse(raw); } catch { /* leave null */ }
    if (!extracted) { await finish("error", { parser_error: "AI returned non-JSON" }); return json({ ok: true, upload_id: uploadId, extracted: null, needs_manual: true, reason: "parse_failed" }); }
    await finish("parsed", { parsed_data: extracted });
    return json({ ok: true, upload_id: uploadId, extracted });
  } catch (e) {
    await finish("error", { parser_error: e instanceof Error ? e.message : String(e) });
    return json({ ok: true, upload_id: uploadId, extracted: null, needs_manual: true, reason: "exception" });
  }
};

export const onRequestOptions: PagesFunction = async () => new Response(null, { status: 204 });
