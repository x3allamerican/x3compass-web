import { normalizeEvidence, validateChallengeCreate, validateStatusTransition } from "../../../src/lib/dataqWorkflow.mjs";
import { correlationId, isUuid, requireTenant, securityError, tenantJson, tenantPreflight, type SecurityEnv } from "../../_shared/request-security";
import { supaFetch } from "../../_shared/supabase-admin";

type Env = SecurityEnv;
type Row = Record<string, unknown>;
const STATUSES = new Set(["submitted", "under_review", "approved", "denied"]);
const validDate = (value: unknown) => typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value) && new Date(`${value}T00:00:00Z`).toISOString().slice(0, 10) === value;

async function authorityFor(ctx: EventContext<Env, string, unknown>, requestId: string) {
  try { return await requireTenant(ctx.request, ctx.env); }
  catch { return { ok: false as const, status: 503, code: "authorization_unavailable", requestId }; }
}

export const onRequestGet: PagesFunction<Env> = async (ctx) => {
  const requestId = correlationId(ctx.request);
  const authority = await authorityFor(ctx, requestId);
  if (!authority.ok) return securityError(authority.status, authority.code, requestId);
  if (!ctx.env.SUPABASE_URL || !ctx.env.SUPABASE_SERVICE_ROLE) return securityError(503, "service_unavailable", requestId);
  const carrierId = authority.carrierId;
  try {
    const supa = supaFetch(ctx.env);
    const [challenges, evidence] = await Promise.all([
      supa.select("compass_dataq_challenges", `select=id,target_type,target_id,issue_summary,requested_correction,status,tracking_number,submitted_on,agency_response_on,agency_response_notes,version,created_at,updated_at&carrier_id=eq.${carrierId}&order=submitted_on.desc&limit=1000`) as Promise<Row[]>,
      supa.select("compass_dataq_evidence", `select=id,challenge_id,label,file_name,content_type,size_bytes,created_at&carrier_id=eq.${carrierId}&order=created_at.asc&limit=5000`) as Promise<Row[]>,
    ]);
    const byChallenge = new Map<string, Row[]>();
    for (const item of evidence) {
      const key = String(item.challenge_id);
      byChallenge.set(key, [...(byChallenge.get(key) || []), item]);
    }
    return tenantJson(ctx.request, ctx.env, { ok: true, challenges: challenges.map((row) => ({ ...row, evidence: byChallenge.get(String(row.id)) || [] })) });
  } catch { return securityError(503, "dataq_unavailable", requestId); }
};

export const onRequestPost: PagesFunction<Env> = async (ctx) => {
  const requestId = correlationId(ctx.request);
  const authority = await authorityFor(ctx, requestId);
  if (!authority.ok) return securityError(authority.status, authority.code, requestId);
  if (!ctx.env.SUPABASE_URL || !ctx.env.SUPABASE_SERVICE_ROLE) return securityError(503, "service_unavailable", requestId);
  let body: Row & { evidence?: unknown[] };
  try { body = await ctx.request.json(); } catch { return securityError(400, "invalid_json", requestId); }
  const validated = validateChallengeCreate(body);
  if (!validated.ok || (body.evidence && (!Array.isArray(body.evidence) || body.evidence.length > 20))) return securityError(400, "invalid_challenge", requestId);
  const challengeInput = validated.value!;
  const normalized = (body.evidence || []).map(normalizeEvidence);
  if (normalized.some((item) => !item.ok)) return securityError(400, "invalid_evidence", requestId);
  const evidenceInputs = normalized.map((item) => item.value!);
  const carrierId = authority.carrierId;
  if (evidenceInputs.some((item) => !item.objectKey.startsWith(`carriers/${carrierId}/dataq/`))) return securityError(400, "invalid_evidence", requestId);
  try {
    const supa = supaFetch(ctx.env);
    const targetTable = challengeInput.targetType === "inspection" ? "compass_inspections" : "compass_accidents";
    const targets = await supa.select(targetTable, `select=id&id=eq.${challengeInput.targetId}&carrier_id=eq.${carrierId}&limit=1`);
    if (!targets[0]) return securityError(404, "resource_not_found", requestId);
    const inserted = await supa.insert("compass_dataq_challenges", {
      carrier_id: carrierId,
      target_type: challengeInput.targetType,
      target_id: challengeInput.targetId,
      issue_summary: challengeInput.issueSummary,
      requested_correction: challengeInput.requestedCorrection,
      status: "submitted",
      submitted_on: challengeInput.submittedOn,
      tracking_number: challengeInput.trackingNumber,
      created_by: authority.userId,
    }) as Row[];
    const challenge = inserted[0];
    if (!challenge?.id) throw new Error("challenge insert returned no id");
    const evidence: Row[] = [];
    for (const item of evidenceInputs) {
      const rows = await supa.insert("compass_dataq_evidence", {
        carrier_id: carrierId, challenge_id: challenge.id, label: item.label,
        file_name: item.fileName, object_key: item.objectKey,
        content_type: item.contentType, size_bytes: item.sizeBytes, created_by: authority.userId,
      }) as Row[];
      evidence.push(...rows.map(({ object_key: _objectKey, ...row }) => row));
    }
    return tenantJson(ctx.request, ctx.env, { ok: true, challenge: { ...challenge, evidence } }, 201);
  } catch { return securityError(503, "dataq_unavailable", requestId); }
};

export const onRequestPatch: PagesFunction<Env> = async (ctx) => {
  const requestId = correlationId(ctx.request);
  const authority = await authorityFor(ctx, requestId);
  if (!authority.ok) return securityError(authority.status, authority.code, requestId);
  if (!ctx.env.SUPABASE_URL || !ctx.env.SUPABASE_SERVICE_ROLE) return securityError(503, "service_unavailable", requestId);
  let body: Row;
  try { body = await ctx.request.json(); } catch { return securityError(400, "invalid_json", requestId); }
  const challengeId = typeof body.id === "string" ? body.id : "";
  if (!isUuid(challengeId) || !Number.isInteger(body.version) || Number(body.version) < 1 || !STATUSES.has(String(body.status))) return securityError(400, "invalid_update", requestId);
  const carrierId = authority.carrierId;
  try {
    const supa = supaFetch(ctx.env);
    const existing = await supa.select("compass_dataq_challenges", `select=id,status,version&id=eq.${challengeId}&carrier_id=eq.${carrierId}&limit=1`) as Row[];
    if (!existing[0]) return securityError(404, "resource_not_found", requestId);
    if (Number(existing[0].version) !== Number(body.version)) return securityError(409, "version_conflict", requestId);
    const transition = validateStatusTransition(String(existing[0].status), String(body.status), body.agency_response_notes);
    if (!transition.ok) return securityError(409, transition.error || "invalid_status_transition", requestId);
    const terminal = body.status === "approved" || body.status === "denied";
    if (terminal && !validDate(body.agency_response_on)) return securityError(400, "agency_response_date_required", requestId);
    const updates: Row = {
      status: body.status,
      tracking_number: typeof body.tracking_number === "string" && body.tracking_number.trim() ? body.tracking_number.trim().slice(0, 120) : null,
      agency_response_on: terminal ? body.agency_response_on : null,
      agency_response_notes: terminal ? String(body.agency_response_notes).trim() : null,
      updated_at: new Date().toISOString(),
      version: Number(body.version) + 1,
    };
    const updated = await supa.update("compass_dataq_challenges", `id=eq.${challengeId}&carrier_id=eq.${carrierId}&version=eq.${body.version}`, updates) as Row[];
    if (!updated[0]) return securityError(409, "version_conflict", requestId);
    return tenantJson(ctx.request, ctx.env, { ok: true, challenge: updated[0] });
  } catch { return securityError(503, "dataq_unavailable", requestId); }
};

export const onRequestOptions: PagesFunction<Env> = async (ctx) => tenantPreflight(ctx.request, ctx.env, "GET, POST, PATCH, OPTIONS");
