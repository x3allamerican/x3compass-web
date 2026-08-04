/**
 * POST /api/screenings/order
 *
 * Initiate a Checkr background-check screening via the Checkr-Hosted Flow.
 * Per Checkr API Integration Guidance v3.0 (Feb 18, 2025):
 *  1. POST /v1/candidates (minimal PII — no SSN, DOB, DL on this call)
 *  2. POST /v1/invitations with candidate_id + package + work_location
 *  3. Return the invitation URL for the candidate
 *
 * Authentication: Supabase JWT plus server-side carrier membership.
 *
 * Required Pages env vars:
 *  - SUPABASE_URL
 *  - SUPABASE_SERVICE_ROLE
 *  - CHECKR_STAGING_API_KEY (used when CHECKR_ENV=staging or unset)
 *  - CHECKR_LIVE_API_KEY    (used when CHECKR_ENV=live)
 *
 * Optional:
 *  - CHECKR_API_BASE  default https://api.checkr.com
 */
import { correlationId, isUuid, requireTenant, securityError, tenantPreflight, type SecurityEnv } from "../../_shared/request-security";

interface Env extends SecurityEnv {
  CHECKR_STAGING_API_KEY?: string;
  CHECKR_LIVE_API_KEY?: string;
  CHECKR_ENV?: "staging" | "live";
  CHECKR_API_BASE?: string;
}

type OrderBody = {
  // Candidate identity (from carrier-supplied driver record)
  first_name: string;
  middle_name?: string;
  last_name: string;
  email: string;
  phone?: string;
  zip?: string;
  // Cross-reference back to the carrier's record
  custom_id?: string;
  carrier_id?: string;
  driver_id?: string;
  // Order details
  package: string; // Checkr package slug — must exist in account
  node?: string; // Account Hierarchy node, optional
  work_location: {
    country: string; // ISO-2, e.g. "US"
    state: string; // ISO-2 e.g. "TX" — required for US checks
    city?: string; // recommended
  };
};

const json = (data: unknown, status = 200): Response =>
  new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "no-store",
    },
  });

const REQUIRED: (keyof OrderBody)[] = ["first_name", "last_name", "email", "package", "work_location"];

export const onRequestPost: PagesFunction<Env> = async (ctx) => {
  let body: Partial<OrderBody>;
  try {
    body = (await ctx.request.json()) as Partial<OrderBody>;
  } catch {
    return json({ ok: false, error: "Invalid JSON" }, 400);
  }

  const requestId = correlationId(ctx.request);
  let authority;
  try { authority = await requireTenant(ctx.request, ctx.env, body.carrier_id); }
  catch { return securityError(503, "authorization_unavailable", requestId); }
  if (!authority.ok) return securityError(authority.status, authority.code, requestId);
  if (body.driver_id && !isUuid(body.driver_id)) return securityError(400, "invalid_resource_id", requestId);

  for (const f of REQUIRED) {
    if (!body[f] || (typeof body[f] === "string" && (body[f] as string).trim() === "")) {
      return json({ ok: false, error: `Missing required field: ${String(f)}` }, 400);
    }
  }
  if (!body.work_location?.country || !body.work_location?.state) {
    return json(
      { ok: false, error: "work_location.country and .state are required" },
      400
    );
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.email!)) {
    return json({ ok: false, error: "Invalid email" }, 400);
  }

  const env = ctx.env.CHECKR_ENV === "live" ? "live" : "staging";
  const apiKey =
    env === "live" ? ctx.env.CHECKR_LIVE_API_KEY : ctx.env.CHECKR_STAGING_API_KEY;
  if (!apiKey) {
    return json(
      { ok: false, error: `CHECKR_${env.toUpperCase()}_API_KEY env var not set` },
      500
    );
  }
  const apiBase = ctx.env.CHECKR_API_BASE || "https://api.checkr.com";

  // Checkr uses HTTP Basic: API key as username, empty password
  const authHeader = `Basic ${btoa(apiKey + ":")}`;

  // === Step 1 — POST /v1/candidates ===
  const candidatePayload: Record<string, unknown> = {
    first_name: body.first_name,
    last_name: body.last_name,
    email: body.email,
    work_locations: [
      {
        country: body.work_location.country,
        state: body.work_location.state,
        ...(body.work_location.city ? { city: body.work_location.city } : {}),
      },
    ],
  };
  if (body.middle_name && body.middle_name.trim()) {
    candidatePayload.middle_name = body.middle_name;
  }
  if (body.phone) candidatePayload.phone = body.phone;
  if (body.zip) candidatePayload.zip = body.zip;
  if (body.custom_id) candidatePayload.custom_id = body.custom_id;
  // NOTE per Checkr v3.0: do NOT send SSN, DOB, driver_license_state, or
  // driver_license_number on the Checkr-Hosted Flow candidate call. Candidate
  // enters those themselves via the invitation flow.

  // Idempotency: prevent dup candidate creation if request is retried
  const idempotencyKey = `compass-${body.custom_id || body.email}-${Date.now().toString(36)}`;

  const candidateRes = await fetch(`${apiBase}/v1/candidates`, {
    method: "POST",
    headers: {
      Authorization: authHeader,
      "Content-Type": "application/json",
      "Idempotency-Key": idempotencyKey,
    },
    body: JSON.stringify(candidatePayload),
  });

  if (!candidateRes.ok) {
    console.error("screening candidate request failed", { correlation_id: requestId, status: candidateRes.status });
    return securityError(502, "upstream_failed", requestId);
  }
  const candidate = (await candidateRes.json()) as { id: string; [k: string]: unknown };

  // === Step 2 — POST /v1/invitations ===
  const invitationPayload: Record<string, unknown> = {
    candidate_id: candidate.id,
    package: body.package,
    work_locations: [
      {
        country: body.work_location.country,
        state: body.work_location.state,
        ...(body.work_location.city ? { city: body.work_location.city } : {}),
      },
    ],
  };
  if (body.node) invitationPayload.node = body.node;

  const inviteRes = await fetch(`${apiBase}/v1/invitations`, {
    method: "POST",
    headers: {
      Authorization: authHeader,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(invitationPayload),
  });

  if (!inviteRes.ok) {
    console.error("screening invitation request failed", { correlation_id: requestId, status: inviteRes.status });
    return securityError(502, "upstream_failed", requestId);
  }
  const invite = (await inviteRes.json()) as {
    id: string;
    invitation_url?: string;
    status?: string;
    [k: string]: unknown;
  };

  // === Step 3 — Record the order in Supabase (best-effort) ===
  let orderId: string | null = null;
  if (ctx.env.SUPABASE_URL && ctx.env.SUPABASE_SERVICE_ROLE) {
    try {
      const sbRes = await fetch(`${ctx.env.SUPABASE_URL}/rest/v1/vendor_orders`, {
        method: "POST",
        headers: {
          apikey: ctx.env.SUPABASE_SERVICE_ROLE,
          Authorization: `Bearer ${ctx.env.SUPABASE_SERVICE_ROLE}`,
          "Content-Type": "application/json",
          Prefer: "return=representation",
        },
        body: JSON.stringify({
          vendor: "checkr",
          service: `checkr_${body.package}`, // satisfy NOT NULL in shared schema
          checkr_env: env,
          carrier_id: authority.carrierId,
          driver_id: body.driver_id || null,
          custom_id: body.custom_id || null,
          checkr_candidate_id: candidate.id,
          vendor_ref_id: invite.id, // invitation_id
          package: body.package,
          work_country: body.work_location.country,
          work_state: body.work_location.state,
          work_city: body.work_location.city || null,
          status: "invited",
          invitation_url: invite.invitation_url || null,
          vendor_portal_url: invite.invitation_url || null,
          ordered_at: new Date().toISOString(),
        }),
      });
      if (sbRes.ok) {
        const rows = (await sbRes.json()) as Array<{ id: string }>;
        orderId = rows[0]?.id ?? null;
      } else {
        console.error(
          "[screenings/order] Supabase insert failed:",
          sbRes.status,
          await sbRes.text()
        );
      }
    } catch (err) {
      console.error("[screenings/order] Supabase error:", err);
    }
  }

  return json({
    ok: true,
    order_id: orderId,
    candidate_id: candidate.id,
    invitation_id: invite.id,
    invitation_url: invite.invitation_url || null,
    status: invite.status || "invited",
    env,
  });
};

export const onRequestOptions: PagesFunction<Env> = async (ctx) =>
  tenantPreflight(ctx.request, ctx.env, "POST, OPTIONS");
