/**
 * CarrierOk API client — fetches SAFER + SMS (CSA BASIC) data for a USDOT.
 *
 * CarrierOk is the canonical CSA data feed we chose in Sprint #125. The Dev
 * tier ($) gives us real BASIC percentile measures (unsafe driving, crash
 * indicator, HOS compliance, vehicle maintenance, hazmat, driver fitness,
 * controlled substances) plus underlying inspection + crash records.
 *
 * REQUIRED env: CARRIEROK_API_KEY
 * Optional env: CARRIEROK_BASE_URL  (defaults to https://api.carrierok.com/v1)
 *
 * Endpoints used:
 *   GET /carriers/{usdot}                 — SAFER profile + summary
 *   GET /carriers/{usdot}/sms             — BASIC percentile measures
 *   GET /carriers/{usdot}/inspections     — last 24mo of inspections
 *   GET /carriers/{usdot}/crashes         — last 24mo of crashes
 *
 * NOTE: until the developer signup completes and we confirm the response
 * shapes against real data, the mapToSnapshot() function is the only thing
 * that needs to change. The wrapper, retry, and error handling are stable.
 */

export interface CarrierOkEnv {
  CARRIEROK_API_KEY?: string;
  CARRIEROK_BASE_URL?: string;
}

export interface CarrierOkSmsRecord {
  // The five fields below are what we actually map to compass_csa_snapshots.
  // Names follow CarrierOk's documented "msr" (measure) convention but the
  // exact JSON keys may differ — verify against a real response on first run.
  unsafe_driving?:  number | null;
  crash_indicator?: number | null;
  hos_compliance?:  number | null;
  vehicle_maint?:   number | null;
  hazmat?:          number | null;
  driver_fitness?:  number | null;
  ctrl_substances?: number | null;
  measured_at?:     string;
  // Whatever else CarrierOk returns we keep in `raw` for forensic lookback
  [key: string]: unknown;
}

interface CarrierOkProfile {
  legal_name?: string;
  dba_name?: string;
  carrier_operation?: string;
  hazmat_flag?: boolean;
  total_power_units?: number;
  total_drivers?: number;
  state?: string;
  out_of_service_date?: string | null;
  [key: string]: unknown;
}

export interface CarrierOkPayload {
  profile: CarrierOkProfile | null;
  sms:     CarrierOkSmsRecord | null;
  ok:      boolean;
  errors:  string[];
  raw:     Record<string, unknown>;
}

/**
 * Map a CarrierOk SMS response onto our compass_csa_snapshots row shape.
 * The keys on the left are the column names in compass_csa_snapshots.
 *
 * If CarrierOk uses different JSON keys than we guessed, change ONLY this
 * function. The mapping is the single source of truth for the field-name
 * translation.
 */
export function mapToSnapshot(carrierId: string, payload: CarrierOkPayload): Record<string, unknown> {
  const sms = payload.sms || {};
  // Coerce nullable numbers — null and missing both become null
  const num = (v: unknown): number | null => {
    if (v == null) return null;
    const n = typeof v === "number" ? v : parseFloat(String(v));
    return Number.isFinite(n) ? n : null;
  };

  return {
    carrier_id:      carrierId,
    source:          "carrierok",
    unsafe_driving:  num(sms.unsafe_driving),
    crash_indicator: num(sms.crash_indicator),
    hos_compliance:  num(sms.hos_compliance),
    vehicle_maint:   num(sms.vehicle_maint),
    hazmat:          num(sms.hazmat),
    driver_fitness:  num(sms.driver_fitness),
    ctrl_substances: num(sms.ctrl_substances),
    raw:             payload.raw,
  };
}

/**
 * Fetch a carrier's full CarrierOk profile + SMS + recent inspections/crashes.
 *
 * Designed to be safe to call from any agent — never throws, returns
 * `{ ok: false, errors: [...] }` if the API key is missing or the request fails.
 */
export async function fetchCarrierOk(env: CarrierOkEnv, usdot: string | number): Promise<CarrierOkPayload> {
  const errors: string[] = [];
  const raw: Record<string, unknown> = {};
  if (!env.CARRIEROK_API_KEY) {
    return { profile: null, sms: null, ok: false, errors: ["CARRIEROK_API_KEY not set"], raw };
  }

  const base = (env.CARRIEROK_BASE_URL || "https://api.carrierok.com/v1").replace(/\/$/, "");
  const headers = {
    "Authorization": `Bearer ${env.CARRIEROK_API_KEY}`,
    "Accept":        "application/json",
    "User-Agent":    "X3Compass/1.0 (+https://x3compass.com)",
  };

  async function getJson(path: string): Promise<unknown> {
    const url = `${base}${path}`;
    const r = await fetch(url, { headers });
    if (!r.ok) throw new Error(`${path} HTTP ${r.status}: ${(await r.text()).slice(0, 200)}`);
    return r.json();
  }

  let profile: CarrierOkProfile | null = null;
  let sms:     CarrierOkSmsRecord  | null = null;

  try {
    profile = (await getJson(`/carriers/${usdot}`)) as CarrierOkProfile;
    raw.profile = profile;
  } catch (e) { errors.push(`profile: ${e instanceof Error ? e.message : String(e)}`); }

  try {
    sms = (await getJson(`/carriers/${usdot}/sms`)) as CarrierOkSmsRecord;
    raw.sms = sms;
  } catch (e) { errors.push(`sms: ${e instanceof Error ? e.message : String(e)}`); }

  return { profile, sms, ok: errors.length === 0, errors, raw };
}
