import { correlationId, requireTenant, securityError, type SecurityEnv } from "../../_shared/request-security";
import { normalizeInspectionExtraction } from "../../../src/lib/inspectionIntake.mjs";

interface Env extends SecurityEnv { ANTHROPIC_API_KEY?: string; ANTHROPIC_MODEL?: string; }
type Body = { carrier_id?: string; filename?: string; mime_type?: string; file_base64?: string };
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json", "Cache-Control": "no-store" } });
const INSTRUCTIONS = `Extract fields from this US roadside inspection report. Return JSON only:
{"inspection_date":"YYYY-MM-DD|null","level":1,"state":"MI","inspector":"string|null","report_number":"string|null","oos_driver":false,"oos_vehicle":false,"violations":[{"code":"exact cited code|null","description":"verbatim concise text|null","oos":false}]}
Never infer a missing value. Use null or false when the document does not state it. This output requires human review.`;

export const onRequestPost: PagesFunction<Env> = async (ctx) => {
  const requestId = correlationId(ctx.request);
  let body: Body;
  try { body = await ctx.request.json(); } catch { return json({ ok: false, error: "Invalid JSON" }, 400); }
  let authority;
  try { authority = await requireTenant(ctx.request, ctx.env, body.carrier_id); }
  catch { return securityError(503, "authorization_unavailable", requestId); }
  if (!authority.ok) return securityError(authority.status, authority.code, requestId);
  if (!body.file_base64) return json({ ok: false, error: "file_base64 required" }, 400);
  if (body.file_base64.length > 28_000_000) return json({ ok: false, error: "Report exceeds the 20 MB limit" }, 413);

  const manual = (reason: string) => json({ ok: true, extracted: normalizeInspectionExtraction({}), needs_manual: true, reason, review_status: "needs_human_review" });
  if (!ctx.env.ANTHROPIC_API_KEY) return manual("no_ai_key");
  const mime = body.mime_type || "application/pdf";
  if (!(mime === "application/pdf" || /^image\/(png|jpeg|webp)$/i.test(mime))) return json({ ok: false, error: "PDF, PNG, JPEG, or WebP required" }, 415);
  try {
    const block = /^image\//.test(mime)
      ? { type: "image", source: { type: "base64", media_type: mime, data: body.file_base64 } }
      : { type: "document", source: { type: "base64", media_type: "application/pdf", data: body.file_base64 } };
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "x-api-key": ctx.env.ANTHROPIC_API_KEY, "anthropic-version": "2023-06-01", "Content-Type": "application/json" },
      body: JSON.stringify({ model: ctx.env.ANTHROPIC_MODEL || "claude-3-5-sonnet-latest", max_tokens: 2200, messages: [{ role: "user", content: [block, { type: "text", text: INSTRUCTIONS }] }] }),
    });
    if (!response.ok) return manual("ai_error");
    const envelope = await response.json() as { content?: Array<{ text?: string }> };
    const raw = (envelope.content || []).map((item) => item.text || "").join("").trim().replace(/^```json?\s*|\s*```$/g, "");
    let parsed: unknown;
    try { parsed = JSON.parse(raw); } catch { return manual("parse_failed"); }
    return json({ ok: true, extracted: normalizeInspectionExtraction(parsed), needs_manual: false, review_status: "needs_human_review", filename: (body.filename || "inspection-report").slice(0, 160) });
  } catch { return manual("exception"); }
};

export const onRequestOptions: PagesFunction = async () => new Response(null, { status: 204 });
