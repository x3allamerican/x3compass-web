/**
 * CarrierOk helpers — FMCSA SAFER data + CSA snapshot lookups.
 * Stubbed for v1; real integration goes in once CarrierOk Dev tier is approved.
 *
 * Used by agent-registry's csa-baseline + csa-monitor agents.
 */

export interface CarrierOkEnv {
  CARRIEROK_API_KEY?: string;
  CARRIEROK_API_BASE?: string;
}

export interface CarrierOkPayload {
  ok: boolean;
  errors: string[];
  sms?: {
    unsafe_driving?:        { measure: number; threshold: number; alert: boolean };
    hours_of_service?:      { measure: number; threshold: number; alert: boolean };
    driver_fitness?:        { measure: number; threshold: number; alert: boolean };
    controlled_substances?: { measure: number; threshold: number; alert: boolean };
    vehicle_maintenance?:   { measure: number; threshold: number; alert: boolean };
    hazmat?:                { measure: number; threshold: number; alert: boolean };
    crash_indicator?:       { measure: number; threshold: number; alert: boolean };
  };
  carrier?: {
    legal_name?: string;
    dba_name?: string;
    operating_status?: string;
    safety_rating?: string;
    power_units?: number;
    drivers?: number;
  };
  fetched_at?: string;
}

export interface SnapshotRow {
  carrier_id: string;
  fetched_at: string;
  unsafe_driving:        number | null;
  hours_of_service:      number | null;
  driver_fitness:        number | null;
  controlled_substances: number | null;
  vehicle_maintenance:   number | null;
  hazmat:                number | null;
  crash_indicator:       number | null;
  raw: CarrierOkPayload;
}

/**
 * Fetch a CarrierOk SMS snapshot for a USDOT.
 * v1: returns { ok: false, errors: [...] } if not configured — caller falls back gracefully.
 */
export async function fetchCarrierOk(env: CarrierOkEnv, usdot: string | null): Promise<CarrierOkPayload> {
  if (!usdot) return { ok: false, errors: ["No USDOT number on carrier record"] };
  if (!env.CARRIEROK_API_KEY) return { ok: false, errors: ["CARRIEROK_API_KEY not configured"] };
  const base = env.CARRIEROK_API_BASE || "https://api.carrierok.com";
  try {
    const res = await fetch(`${base}/v1/carriers/${encodeURIComponent(usdot)}/sms`, {
      headers: { Authorization: `Bearer ${env.CARRIEROK_API_KEY}` },
    });
    if (!res.ok) return { ok: false, errors: [`CarrierOk ${res.status}: ${await res.text()}`] };
    const data = await res.json() as Partial<CarrierOkPayload>;
    return { ok: true, errors: [], ...data, fetched_at: new Date().toISOString() };
  } catch (e) {
    return { ok: false, errors: [e instanceof Error ? e.message : String(e)] };
  }
}

/**
 * Map a CarrierOk payload into a row for compass_csa_snapshots.
 */
export function mapToSnapshot(carrierId: string, payload: CarrierOkPayload): SnapshotRow {
  const sms = payload.sms || {};
  return {
    carrier_id: carrierId,
    fetched_at: payload.fetched_at || new Date().toISOString(),
    unsafe_driving:        sms.unsafe_driving?.measure        ?? null,
    hours_of_service:      sms.hours_of_service?.measure      ?? null,
    driver_fitness:        sms.driver_fitness?.measure        ?? null,
    controlled_substances: sms.controlled_substances?.measure ?? null,
    vehicle_maintenance:   sms.vehicle_maintenance?.measure   ?? null,
    hazmat:                sms.hazmat?.measure                ?? null,
    crash_indicator:       sms.crash_indicator?.measure       ?? null,
    raw: payload,
  };
}
