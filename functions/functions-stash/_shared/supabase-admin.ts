/**
 * Supabase service-role helpers for Cloudflare Pages Functions.
 * - bearerFromRequest: extract Authorization Bearer token
 * - verifySupabaseJwt: validate a user's JWT via Supabase /auth/v1/user
 * - supaFetch: typed wrapper around Supabase REST API using SERVICE_ROLE key
 */

export interface SupaEnv {
  SUPABASE_URL?: string;
  SUPABASE_SERVICE_ROLE?: string;
  SUPABASE_ANON_KEY?: string;
}

export function bearerFromRequest(req: Request): string | null {
  const h = req.headers.get("Authorization") || req.headers.get("authorization");
  if (!h) return null;
  const m = h.match(/^Bearer\s+(.+)$/i);
  return m ? m[1].trim() : null;
}

export interface SupaUser {
  sub: string;         // user id
  email?: string;
  role?: string;
  aud?: string;
  exp?: number;
  [k: string]: unknown;
}

export async function verifySupabaseJwt(env: SupaEnv, token: string): Promise<SupaUser | null> {
  if (!env.SUPABASE_URL || !env.SUPABASE_ANON_KEY) return null;
  try {
    const res = await fetch(`${env.SUPABASE_URL}/auth/v1/user`, {
      headers: { apikey: env.SUPABASE_ANON_KEY, Authorization: `Bearer ${token}` },
    });
    if (!res.ok) return null;
    const u = await res.json() as { id?: string; email?: string; role?: string; aud?: string };
    if (!u.id) return null;
    return { sub: u.id, email: u.email, role: u.role, aud: u.aud };
  } catch { return null; }
}

type SelectOpts = string;
type Row = Record<string, unknown>;

export function supaFetch(env: SupaEnv) {
  const baseUrl = env.SUPABASE_URL || "";
  const serviceKey = env.SUPABASE_SERVICE_ROLE || "";
  const headers = {
    apikey: serviceKey,
    Authorization: `Bearer ${serviceKey}`,
    "Content-Type": "application/json",
    Prefer: "return=representation",
  };
  const base = `${baseUrl}/rest/v1`;

  async function select(table: string, query: SelectOpts = ""): Promise<Row[]> {
    const url = `${base}/${table}${query ? `?${query}` : ""}`;
    const res = await fetch(url, { headers });
    if (!res.ok) throw new Error(`supaFetch select ${table} ${res.status}: ${await res.text()}`);
    return res.json() as Promise<Row[]>;
  }

  async function insert<T extends object>(table: string, body: T | T[]): Promise<Row[]> {
    const res = await fetch(`${base}/${table}`, { method: "POST", headers, body: JSON.stringify(body) });
    if (!res.ok) throw new Error(`supaFetch insert ${table} ${res.status}: ${await res.text()}`);
    return res.json() as Promise<Row[]>;
  }

  async function update<T extends object>(table: string, query: SelectOpts, body: T): Promise<Row[]> {
    const res = await fetch(`${base}/${table}?${query}`, { method: "PATCH", headers, body: JSON.stringify(body) });
    if (!res.ok) throw new Error(`supaFetch update ${table} ${res.status}: ${await res.text()}`);
    return res.json() as Promise<Row[]>;
  }

  async function del(table: string, query: SelectOpts): Promise<Row[]> {
    const res = await fetch(`${base}/${table}?${query}`, { method: "DELETE", headers });
    if (!res.ok) throw new Error(`supaFetch delete ${table} ${res.status}: ${await res.text()}`);
    return res.json() as Promise<Row[]>;
  }

  async function rpc<T = unknown>(fn: string, args: Row = {}): Promise<T> {
    const res = await fetch(`${base}/rpc/${fn}`, { method: "POST", headers, body: JSON.stringify(args) });
    if (!res.ok) throw new Error(`supaFetch rpc ${fn} ${res.status}: ${await res.text()}`);
    return res.json() as Promise<T>;
  }

  /** PostgREST upsert via `Prefer: resolution=merge-duplicates`. The table
   *  must have a unique/PK constraint matching the columns supplied in body. */
  async function upsert<T extends object>(table: string, body: T | T[]): Promise<Row[]> {
    const res = await fetch(`${base}/${table}`, {
      method: "POST",
      headers: { ...headers, Prefer: "resolution=merge-duplicates,return=representation" },
      body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error(`supaFetch upsert ${table} ${res.status}: ${await res.text()}`);
    return res.json() as Promise<Row[]>;
  }

  return { select, insert, update, delete: del, rpc, upsert };
}
