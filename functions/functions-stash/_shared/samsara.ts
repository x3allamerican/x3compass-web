/**
 * Samsara — shared constants and helpers.
 *
 * Per https://developers.samsara.com/docs/oauth-20 (Authorization Code grant)
 * and https://developers.samsara.com/docs/base-url.
 *
 * Required Cloudflare Pages env vars (Production):
 *   SAMSARA_CLIENT_ID           — issued in Samsara Partner Developer Portal
 *   SAMSARA_CLIENT_SECRET       — issued in Samsara Partner Developer Portal
 *   SAMSARA_REDIRECT_URI        — must exactly match what's registered in the portal
 *                                 default: https://x3compass-web.pages.dev/api/integrations/samsara/oauth-callback
 *   SAMSARA_API_BASE            — default https://api.samsara.com (use https://api.eu.samsara.com for EU customers)
 *   SAMSARA_ENC_SECRET          — 32+ char random string for token-at-rest encryption (XOR stub; rotate to AES later)
 *
 * Scopes requested by Compass — pared down to read-only for v1 to keep
 * customer consent friction low + audit-ready:
 *
 *   read:vehicles              — fleet roster (feeds /app/vehicles)
 *   read:drivers               — driver roster (feeds /app/drivers)
 *   read:hours-of-service      — daily duty status summaries (feeds /app/hos)
 *   read:vehicle-stats         — telematics snapshots (feeds /app/scorecards + IFTA)
 *   read:dvirs                 — Driver Vehicle Inspection Reports (feeds /app/inspections)
 *   read:safety-events         — harsh braking, speeding (feeds /app/scorecards)
 *   read:maintenance           — fault codes + PM schedules (feeds /app/vehicles)
 *   read:trips                 — for IFTA mileage attribution
 *
 * Future write scopes (Phase 5+, request only when shipping write features):
 *   write:training
 *   write:documents
 */

export const SAMSARA_DEFAULT_API_BASE = "https://api.samsara.com";

// The OAuth URLs are stable Samsara endpoints; safe to bake in.
export const SAMSARA_AUTHORIZE_URL = "https://api.samsara.com/oauth2/authorize";
export const SAMSARA_TOKEN_URL = "https://api.samsara.com/oauth2/token";

export const SAMSARA_DEFAULT_SCOPES = [
  "read:vehicles",
  "read:drivers",
  "read:hours-of-service",
  "read:vehicle-stats",
  "read:dvirs",
  "read:safety-events",
  "read:maintenance",
  "read:trips",
];

export interface SamsaraEnv {
  SAMSARA_CLIENT_ID?: string;
  SAMSARA_CLIENT_SECRET?: string;
  SAMSARA_REDIRECT_URI?: string;
  SAMSARA_API_BASE?: string;
  SAMSARA_ENC_SECRET?: string;
}

export interface SamsaraTokens {
  access_token: string;
  refresh_token: string;
  expires_in: number; // seconds
  scope?: string;
  token_type?: string;
}

export interface SamsaraOrgInfo {
  id: string;
  name?: string;
}

// ─────────────────────────────────────────────────────────────────
// Token-at-rest encryption (v1: XOR + base64; rotate to AES-GCM later)
// ─────────────────────────────────────────────────────────────────
export function encryptToken(plain: string, secret: string): string {
  if (!secret) throw new Error("SAMSARA_ENC_SECRET not set");
  const bytes = new TextEncoder().encode(plain);
  const key = new TextEncoder().encode(secret);
  const out = new Uint8Array(bytes.length);
  for (let i = 0; i < bytes.length; i++) out[i] = bytes[i] ^ key[i % key.length];
  return btoa(String.fromCharCode(...out));
}

export function decryptToken(cipher: string, secret: string): string {
  if (!secret) throw new Error("SAMSARA_ENC_SECRET not set");
  const enc = Uint8Array.from(atob(cipher), (c) => c.charCodeAt(0));
  const key = new TextEncoder().encode(secret);
  const out = new Uint8Array(enc.length);
  for (let i = 0; i < enc.length; i++) out[i] = enc[i] ^ key[i % key.length];
  return new TextDecoder().decode(out);
}

// ─────────────────────────────────────────────────────────────────
// CSRF state — signed cookie carrying carrier_id + nonce
// ─────────────────────────────────────────────────────────────────
export function makeOAuthState(carrierId: string): string {
  const nonce = crypto.randomUUID();
  // We don't sign here — Samsara echoes state back, we just verify equality with cookie.
  return `${carrierId}.${nonce}`;
}

export function parseOAuthState(state: string): { carrierId: string; nonce: string } | null {
  const parts = state.split(".");
  if (parts.length !== 2) return null;
  return { carrierId: parts[0], nonce: parts[1] };
}

// ─────────────────────────────────────────────────────────────────
// Build the Samsara consent URL
// ─────────────────────────────────────────────────────────────────
export function buildAuthorizeUrl(opts: {
  clientId: string;
  redirectUri: string;
  state: string;
  scopes?: string[];
}): string {
  const params = new URLSearchParams({
    response_type: "code",
    client_id: opts.clientId,
    redirect_uri: opts.redirectUri,
    state: opts.state,
    scope: (opts.scopes || SAMSARA_DEFAULT_SCOPES).join(" "),
  });
  return `${SAMSARA_AUTHORIZE_URL}?${params.toString()}`;
}

// ─────────────────────────────────────────────────────────────────
// Exchange authorization code for tokens
// ─────────────────────────────────────────────────────────────────
export async function exchangeCodeForTokens(env: SamsaraEnv, code: string): Promise<SamsaraTokens> {
  const body = new URLSearchParams({
    grant_type: "authorization_code",
    code,
    redirect_uri: env.SAMSARA_REDIRECT_URI || "",
    client_id: env.SAMSARA_CLIENT_ID || "",
    client_secret: env.SAMSARA_CLIENT_SECRET || "",
  });
  const r = await fetch(SAMSARA_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString(),
  });
  if (!r.ok) {
    const text = await r.text();
    throw new Error(`Samsara token exchange failed: HTTP ${r.status}: ${text}`);
  }
  return (await r.json()) as SamsaraTokens;
}

// ─────────────────────────────────────────────────────────────────
// Refresh access token using stored refresh token
// ─────────────────────────────────────────────────────────────────
export async function refreshAccessToken(env: SamsaraEnv, refreshToken: string): Promise<SamsaraTokens> {
  const body = new URLSearchParams({
    grant_type: "refresh_token",
    refresh_token: refreshToken,
    client_id: env.SAMSARA_CLIENT_ID || "",
    client_secret: env.SAMSARA_CLIENT_SECRET || "",
  });
  const r = await fetch(SAMSARA_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString(),
  });
  if (!r.ok) {
    const text = await r.text();
    throw new Error(`Samsara token refresh failed: HTTP ${r.status}: ${text}`);
  }
  return (await r.json()) as SamsaraTokens;
}

// ─────────────────────────────────────────────────────────────────
// Identify the connected Samsara organization (called once after first token exchange)
// ─────────────────────────────────────────────────────────────────
export async function fetchSamsaraOrgInfo(env: SamsaraEnv, accessToken: string): Promise<SamsaraOrgInfo> {
  const base = env.SAMSARA_API_BASE || SAMSARA_DEFAULT_API_BASE;
  // Samsara exposes the connected org via /me — minimal scope required.
  const r = await fetch(`${base}/me`, {
    headers: { Authorization: `Bearer ${accessToken}`, Accept: "application/json" },
  });
  if (!r.ok) {
    const text = await r.text();
    throw new Error(`Samsara /me failed: HTTP ${r.status}: ${text}`);
  }
  const data = (await r.json()) as { data?: { id?: string; organizationId?: string; organizationName?: string; name?: string } };
  const d = data.data || {};
  return {
    id: d.organizationId || d.id || "",
    name: d.organizationName || d.name || undefined,
  };
}
