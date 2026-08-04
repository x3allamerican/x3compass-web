/**
 * CarrierOk API client — fetches the live FMCSA carrier profile (SAFER + SMS /
 * CSA BASIC percentiles) for a USDOT number.
 *
 * Verified against the real CarrierOk v2 API (developers.carrierok.com, Aug 2026):
 *   Base:     https://api.carrierok.com
 *   Auth:     Authorization: Bearer sk_live_*   (keep server-side only)
 *   Endpoint: GET /v2/profile?dot_number=<usdot>
 *   Response: { items: CarrierProfile[], total_count } — profile at items[0],
 *             BASIC fields are FLAT on the profile object.
 *
 * BASIC categories use CarrierOk's field spelling (note "maintence" and
 * "hazardous_materials"):
 *   basic_percentile_<cat>  — 0..1 percentile relative to peer group (higher = worse)
 *   basic_measure_<cat>     — raw BASIC measure (fallback when no percentile)
 *
 * REQUIRED env (any of, first wins):
 *   CARRIER-OK_API_KEY_LIVE  (canonical vault name — hyphenated)
 *   CARRIEROK_API_KEY_LIVE
 *   CARRIEROK_API_KEY        (legacy)
 * Optional env: CARRIEROK_BASE_URL (defaults to https://api.carrierok.com)
 */

export interface CarrierOkEnv {
  "CARRIER-OK_API_KEY_LIVE"?: string;
  CARRIEROK_API_KEY_LIVE?: string;
  CARRIEROK_API_KEY?: string;
  CARRIEROK_BASE_URL?: string;
  [key: string]: unknown;
}

/** Resolve the CarrierOk API key from the accepted env names (first non-empty wins). */
export function carrierOkKey(env: CarrierOkEnv): string | undefined {
  const candidates = [
    env["CARRIER-OK_API_KEY_LIVE"],
    env.CARRIEROK_API_KEY_LIVE,
    env.CARRIEROK_API_KEY,
  ];
  for (const c of candidates) {
    if (typeof c === "string" && c.trim()) return c.trim();
  }
  return undefined;
}

/** A single carrier profile object (subset of the ~280 CarrierOk fields we use). */
export interface CarrierOkProfile {
  dot_number?: string | number;
  docket_number?: string;
  legal_name?: string;
  dba_name?: string;
  state?: string;
  total_power_units?: string | number;
  total_drivers?: string | number;
  mcs150_date?: string;
  // BASIC percentiles / measures are flat, keyed by category — see helpers below.
  [key: string]: unknown;
}

export interface CarrierOkPayload {
  profile: CarrierOkProfile | null;
  ok:      boolean;
  errors:  string[];
  raw:     Record<string, unknown>;
}

/** Coerce number|string|null -> number|null. */
function num(v: unknown): number | null {
  if (v == null || v === "") return null;
  const n = typeof v === "number" ? v : parseFloat(String(v));
  return Number.isFinite(n) ? n : null;
}

/**
 * Category name (CarrierOk spelling) -> our compass_csa_snapshots column.
 * Order is stable for readability; the map is the single source of truth.
 */
const BASIC_MAP: Array<[cat: string, col: string]> = [
  ["unsafe_driving",       "unsafe_driving"],
  ["crash_indicator",      "crash_indicator"],
  ["hours_of_service",     "hos_compliance"],
  ["vehicle_maintence",    "vehicle_maint"],
  ["hazardous_materials",  "hazmat"],
  ["driver_fitness",       "driver_fitness"],
  ["controlled_substance", "ctrl_substances"],
];

/**
 * Read one BASIC category as a 0–100 percentile for display.
 * Prefers basic_percentile_<cat> (0..1 -> x100). Falls back to
 * basic_measure_<cat>: if it looks like a 0..1 fraction, x100; else raw.
 * Returns null when neither is present.
 */
function basicPercentile(p: CarrierOkProfile, cat: string): number | null {
  const pct = num(p[`basic_percentile_${cat}`]);
  if (pct != null) return Math.round(pct * 100 * 10) / 10;
  const m = num(p[`basic_measure_${cat}`]);
  if (m == null) return null;
  return m <= 1 ? Math.round(m * 100 * 10) / 10 : Math.round(m * 10) / 10;
}

/**
 * Map a CarrierOk profile onto a compass_csa_snapshots row.
 * Columns: carrier_id, taken_at, <7 BASIC percentiles>, source, raw.
 */
export function mapToSnapshot(carrierId: string, payload: CarrierOkPayload): Record<string, unknown> {
  const p = payload.profile || {};
  const row: Record<string, unknown> = {
    carrier_id: carrierId,
    taken_at:   new Date().toISOString(),
    source:     "carrierok",
    raw:        payload.raw,
  };
  for (const [cat, col] of BASIC_MAP) {
    row[col] = basicPercentile(p, cat);
  }
  return row;
}

/**
 * Fetch a carrier's live CarrierOk profile by USDOT.
 * Never throws — returns { ok:false, errors:[...] } on missing key / HTTP error.
 */
export async function fetchCarrierOk(env: CarrierOkEnv, usdot: string | number): Promise<CarrierOkPayload> {
  const errors: string[] = [];
  const raw: Record<string, unknown> = {};
  const key = carrierOkKey(env);
  if (!key) {
    return { profile: null, ok: false, errors: ["CarrierOk API key not set"], raw };
  }

  const base = (env.CARRIEROK_BASE_URL || "https://api.carrierok.com").replace(/\/$/, "");
  const url = `${base}/v2/profile?dot_number=${encodeURIComponent(String(usdot))}`;
  const headers = {
    "Authorization": `Bearer ${key}`,
    "Accept":        "application/json",
    "User-Agent":    "X3Compass/1.0 (+https://x3compass.com)",
  };

  try {
    const r = await fetch(url, { headers });
    if (!r.ok) {
      const body = (await r.text()).slice(0, 200);
      return { profile: null, ok: false, errors: [`profile HTTP ${r.status}: ${body}`], raw };
    }
    const json = (await r.json()) as { items?: CarrierOkProfile[]; total_count?: number };
    raw.response = json;
    const profile = Array.isArray(json.items) && json.items.length ? json.items[0] : null;
    if (!profile) {
      return { profile: null, ok: false, errors: [`no carrier found for USDOT ${usdot}`], raw };
    }
    return { profile, ok: true, errors, raw };
  } catch (e) {
    errors.push(`profile: ${e instanceof Error ? e.message : String(e)}`);
    return { profile: null, ok: false, errors, raw };
  }
}
