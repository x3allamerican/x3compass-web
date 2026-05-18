/**
 * Shared vendor mapper — normalizes any vendor's driver payload into a
 * compass_drivers-shaped row so we have ONE upsert path no matter where the
 * data came from (CSV, TenStreet, DriverReach, HireRight, custom API).
 *
 * Adding a new vendor: write a function that returns NormalizedDriver[] from
 * the raw vendor response, then route it through upsertDrivers() below.
 */

export interface NormalizedDriver {
  // Required for upsert
  first_name: string;
  last_name: string;

  // Strongly recommended (used as conflict key when paired with carrier_id)
  cdl_number?: string | null;
  cdl_state?: string | null;
  cdl_class?: string | null;       // 'A' | 'B' | 'C' | 'none'
  cdl_expires_on?: string | null;  // ISO YYYY-MM-DD

  // Common fields
  middle_name?: string | null;
  email?: string | null;
  phone?: string | null;
  date_of_birth?: string | null;
  medical_card_expires_on?: string | null;
  hire_date?: string | null;
  termination_date?: string | null;
  status?: "active" | "pending_hire" | "on_leave" | "inactive" | "terminated";

  // Source provenance
  source_vendor?: string;
  source_id?: string;  // vendor's record ID, for round-trip dedupe
}

// ─────────────────────────────────────────────────────────────────────────────
// CSV column mapping — accepts both the project's "license_*" template and
// the canonical compass_drivers column names so users don't get bitten by either.
// ─────────────────────────────────────────────────────────────────────────────
const CSV_ALIASES: Record<string, keyof NormalizedDriver | "ignore"> = {
  first_name: "first_name",
  middle_name: "middle_name",
  last_name: "last_name",
  email: "email",
  phone: "phone",
  date_of_birth: "date_of_birth",
  dob: "date_of_birth",

  license_number: "cdl_number",
  cdl_number: "cdl_number",
  license_state: "cdl_state",
  cdl_state: "cdl_state",
  license_class: "cdl_class",
  cdl_class: "cdl_class",
  license_expiration: "cdl_expires_on",
  cdl_expires_on: "cdl_expires_on",
  cdl_expiration: "cdl_expires_on",

  medical_cert_expiration: "medical_card_expires_on",
  medical_card_expires_on: "medical_card_expires_on",
  med_card_expires: "medical_card_expires_on",

  hire_date: "hire_date",
  termination_date: "termination_date",
  status: "status",
};

export function mapCsvRow(headers: string[], row: string[]): NormalizedDriver | null {
  const out: NormalizedDriver = { first_name: "", last_name: "" };
  for (let i = 0; i < headers.length; i++) {
    const headerKey = headers[i]?.trim().toLowerCase();
    const target = CSV_ALIASES[headerKey];
    if (!target || target === "ignore") continue;
    const v = (row[i] ?? "").trim();
    if (!v) continue;
    // narrow status to allowed values
    if (target === "status") {
      const s = v.toLowerCase();
      if (["active", "pending_hire", "on_leave", "inactive", "terminated"].includes(s)) {
        out.status = s as NormalizedDriver["status"];
      }
      continue;
    }
    (out as unknown as Record<string, unknown>)[target] = v;
  }
  if (!out.first_name || !out.last_name) return null;
  out.source_vendor = "csv";
  return out;
}

// ─────────────────────────────────────────────────────────────────────────────
// TenStreet mapper — the official TenStreet "Driver Applicant Export" API
// returns XML; the user is expected to convert to JSON upstream OR we use
// their newer JSON endpoint when they roll us API access.
// ─────────────────────────────────────────────────────────────────────────────
type TenStreetApplicant = {
  applicant_id?: string;
  first_name?: string;
  last_name?: string;
  middle_name?: string;
  email?: string;
  phone_mobile?: string;
  dob?: string;
  license_number?: string;
  license_state?: string;
  license_class?: string;
  license_exp?: string;
  med_card_exp?: string;
  application_status?: string;
};

export function mapTenStreet(applicants: TenStreetApplicant[]): NormalizedDriver[] {
  return applicants
    .filter(a => a.first_name && a.last_name)
    .map(a => ({
      first_name: a.first_name!,
      last_name:  a.last_name!,
      middle_name: a.middle_name || null,
      email:       a.email || null,
      phone:       a.phone_mobile || null,
      date_of_birth: a.dob || null,
      cdl_number:  a.license_number || null,
      cdl_state:   a.license_state || null,
      cdl_class:   (a.license_class || "").toUpperCase() || null,
      cdl_expires_on: a.license_exp || null,
      medical_card_expires_on: a.med_card_exp || null,
      status: (a.application_status === "hired" ? "active" : "pending_hire") as NormalizedDriver["status"],
      source_vendor: "tenstreet",
      source_id: a.applicant_id,
    }));
}

// ─────────────────────────────────────────────────────────────────────────────
// DriverReach mapper — placeholder for the moment we sign with them.
// Documented to keep the shape stable for future vendors.
// ─────────────────────────────────────────────────────────────────────────────
type DriverReachCandidate = {
  id?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  phoneNumber?: string;
  cdlNumber?: string;
  cdlState?: string;
  cdlExpiration?: string;
  medicalExpiration?: string;
  status?: string;
};

export function mapDriverReach(candidates: DriverReachCandidate[]): NormalizedDriver[] {
  return candidates
    .filter(c => c.firstName && c.lastName)
    .map(c => ({
      first_name: c.firstName!,
      last_name:  c.lastName!,
      email:      c.email || null,
      phone:      c.phoneNumber || null,
      cdl_number: c.cdlNumber || null,
      cdl_state:  c.cdlState || null,
      cdl_expires_on: c.cdlExpiration || null,
      medical_card_expires_on: c.medicalExpiration || null,
      status: "pending_hire" as NormalizedDriver["status"],
      source_vendor: "driverreach",
      source_id: c.id,
    }));
}

// ─────────────────────────────────────────────────────────────────────────────
// Single upsert path — every vendor + CSV path ends here.
// ─────────────────────────────────────────────────────────────────────────────
export interface SupaEnv {
  SUPABASE_URL?: string;
  SUPABASE_SERVICE_ROLE?: string;
}

export interface UpsertResult {
  inserted: number;
  updated: number;
  skipped: number;
  errors: { row: number; reason: string }[];
}

export async function upsertDrivers(
  env: SupaEnv,
  carrierId: string,
  rows: NormalizedDriver[],
): Promise<UpsertResult> {
  const result: UpsertResult = { inserted: 0, updated: 0, skipped: 0, errors: [] };
  if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE) {
    result.errors.push({ row: -1, reason: "Server missing SUPABASE_URL / SUPABASE_SERVICE_ROLE" });
    return result;
  }
  const base = env.SUPABASE_URL.replace(/\/$/, "");
  const sr = env.SUPABASE_SERVICE_ROLE;

  // We upsert in batches of 50 to stay under Cloudflare's subrequest budget.
  const BATCH = 50;
  for (let i = 0; i < rows.length; i += BATCH) {
    const slice = rows.slice(i, i + BATCH).map((r, j) => {
      if (!r.first_name || !r.last_name) {
        result.errors.push({ row: i + j, reason: "missing first_name or last_name" });
        return null;
      }
      return {
        carrier_id: carrierId,
        first_name: r.first_name,
        last_name:  r.last_name,
        middle_name: r.middle_name || null,
        email:       r.email || null,
        phone:       r.phone || null,
        date_of_birth: r.date_of_birth || null,
        cdl_number:  r.cdl_number || null,
        cdl_state:   r.cdl_state || null,
        cdl_class:   r.cdl_class || null,
        cdl_expires_on: r.cdl_expires_on || null,
        medical_card_expires_on: r.medical_card_expires_on || null,
        hire_date:    r.hire_date || null,
        termination_date: r.termination_date || null,
        status:       r.status || "pending_hire",
      };
    }).filter(Boolean);

    if (slice.length === 0) {
      result.skipped += rows.slice(i, i + BATCH).length;
      continue;
    }

    try {
      // on_conflict only works if a unique index exists on (carrier_id, cdl_number).
      // Without that, we let Supabase reject duplicates and count them as errors.
      const r = await fetch(`${base}/rest/v1/compass_drivers?on_conflict=carrier_id,cdl_number`, {
        method: "POST",
        headers: {
          apikey: sr,
          Authorization: `Bearer ${sr}`,
          "Content-Type": "application/json",
          Prefer: "resolution=merge-duplicates,return=representation",
        },
        body: JSON.stringify(slice),
      });
      if (!r.ok) {
        const text = await r.text();
        // Fallback: try plain insert if conflict-target column doesn't exist
        if (r.status === 400 && text.includes("constraint")) {
          const r2 = await fetch(`${base}/rest/v1/compass_drivers`, {
            method: "POST",
            headers: { apikey: sr, Authorization: `Bearer ${sr}`, "Content-Type": "application/json", Prefer: "return=representation" },
            body: JSON.stringify(slice),
          });
          if (r2.ok) {
            const ins = (await r2.json()) as unknown[];
            result.inserted += ins.length;
          } else {
            result.errors.push({ row: i, reason: `batch insert ${r2.status}: ${(await r2.text()).slice(0, 200)}` });
          }
          continue;
        }
        result.errors.push({ row: i, reason: `batch ${r.status}: ${text.slice(0, 200)}` });
        continue;
      }
      const ins = (await r.json()) as unknown[];
      // We can't easily tell inserted vs updated without a returning clause that
      // distinguishes; treat all as inserted for v1 (the user-visible total
      // is "X processed", which is what they care about).
      result.inserted += ins.length;
    } catch (err) {
      result.errors.push({ row: i, reason: `batch exception: ${err instanceof Error ? err.message : String(err)}` });
    }
  }
  return result;
}

// ─────────────────────────────────────────────────────────────────────────────
// Track a vendor sync run on compass_vendor_integrations
// ─────────────────────────────────────────────────────────────────────────────
export async function markVendorSync(
  env: SupaEnv,
  carrierId: string,
  vendor: string,
  result: { success: boolean; count: number; error?: string },
): Promise<void> {
  if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE) return;
  const base = env.SUPABASE_URL.replace(/\/$/, "");
  const sr = env.SUPABASE_SERVICE_ROLE;
  const body = result.success
    ? { status: "connected", last_sync_at: new Date().toISOString(), last_sync_count: result.count, last_error_text: null }
    : { status: "error", last_error_at: new Date().toISOString(), last_error_text: result.error?.slice(0, 1000) || "unknown" };
  try {
    await fetch(`${base}/rest/v1/compass_vendor_integrations?carrier_id=eq.${carrierId}&vendor=eq.${vendor}`, {
      method: "PATCH",
      headers: { apikey: sr, Authorization: `Bearer ${sr}`, "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  } catch {
    // best-effort; don't break the sync itself if the tracker write fails
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// VEHICLE PATH — parallel structure to the driver path above.
// Common Normalized shape + per-vendor adapters + single upsertVehicles().
// ─────────────────────────────────────────────────────────────────────────────

export interface NormalizedVehicle {
  // Strongly recommended (used as conflict key when paired with carrier_id)
  vin?: string | null;

  // Identity
  license_plate?: string | null;
  license_plate_state?: string | null;
  year?: number | null;
  make?: string | null;
  model?: string | null;

  // Specs
  gvwr_lbs?: number | null;
  vehicle_type?: string | null;   // 'tractor' | 'straight_truck' | 'trailer' | 'tank' | 'dump' | 'bus' | 'other'
  fuel_type?: string | null;
  current_odometer?: number | null;

  // Lifecycle
  in_service_date?: string | null;
  out_of_service_date?: string | null;
  status?: "active" | "out_of_service" | "sold" | "totaled";

  // Compliance dates
  last_dot_inspection_on?: string | null;
  next_dot_inspection_due?: string | null;

  // Provenance
  source_vendor?: string;
  source_id?: string;
}

const VEHICLE_CSV_ALIASES: Record<string, keyof NormalizedVehicle | "ignore"> = {
  // Canonical
  vin: "vin",
  license_plate: "license_plate",
  license_plate_state: "license_plate_state",
  year: "year",
  make: "make",
  model: "model",
  gvwr_lbs: "gvwr_lbs",
  vehicle_type: "vehicle_type",
  fuel_type: "fuel_type",
  current_odometer: "current_odometer",
  in_service_date: "in_service_date",
  out_of_service_date: "out_of_service_date",
  status: "status",
  last_dot_inspection_on: "last_dot_inspection_on",
  next_dot_inspection_due: "next_dot_inspection_due",

  // Common shorthand from the project's /app/import template
  unit_number: "ignore",  // we key on VIN; unit numbers vary by fleet convention
  gvwr: "gvwr_lbs",
  annual_inspection_date: "last_dot_inspection_on",
  pm_due_date: "next_dot_inspection_due",
  next_pm_due_at: "next_dot_inspection_due",
  next_inspection_due: "next_dot_inspection_due",
  plate: "license_plate",
  plate_state: "license_plate_state",
  odometer: "current_odometer",
  mileage: "current_odometer",
};

const ALLOWED_VEHICLE_TYPES = new Set(["tractor","straight_truck","trailer","tank","dump","bus","other"]);
const ALLOWED_VEHICLE_STATUSES = new Set(["active","out_of_service","sold","totaled"]);

function toIntOrNull(v: string): number | null {
  if (v == null || v === "") return null;
  const cleaned = v.toString().replace(/[^\d-]/g, "");
  if (!cleaned) return null;
  const n = parseInt(cleaned, 10);
  return Number.isFinite(n) ? n : null;
}

export function mapCsvVehicleRow(headers: string[], row: string[]): NormalizedVehicle | null {
  const out: NormalizedVehicle = {};
  for (let i = 0; i < headers.length; i++) {
    const headerKey = headers[i]?.trim().toLowerCase();
    const target = VEHICLE_CSV_ALIASES[headerKey];
    if (!target || target === "ignore") continue;
    const v = (row[i] ?? "").trim();
    if (!v) continue;
    if (target === "year" || target === "gvwr_lbs" || target === "current_odometer") {
      const n = toIntOrNull(v);
      if (n !== null) (out as unknown as Record<string, unknown>)[target] = n;
      continue;
    }
    if (target === "vehicle_type") {
      const s = v.toLowerCase().replace(/\s+/g, "_");
      if (ALLOWED_VEHICLE_TYPES.has(s)) out.vehicle_type = s;
      continue;
    }
    if (target === "status") {
      const s = v.toLowerCase().replace(/\s+/g, "_");
      if (ALLOWED_VEHICLE_STATUSES.has(s)) out.status = s as NormalizedVehicle["status"];
      continue;
    }
    if (target === "license_plate_state") {
      out.license_plate_state = v.toUpperCase().slice(0, 2);
      continue;
    }
    (out as unknown as Record<string, unknown>)[target] = v;
  }
  // Need at minimum a VIN or a plate to identify a vehicle.
  if (!out.vin && !out.license_plate) return null;
  out.source_vendor = "csv";
  return out;
}

// Samsara — telematics + ELD. The Samsara fleet API returns vehicles via
// GET /fleet/vehicles. We support the v2 JSON shape; older clients can map
// upstream and pass through .rows[].
type SamsaraVehicle = {
  id?: string | number;
  name?: string;            // unit number; we drop unless they put VIN here
  vin?: string;
  licensePlate?: string;
  make?: string;
  model?: string;
  year?: number;
  gvwr?: number;
  vehicleType?: string;
};
export function mapSamsara(vehicles: SamsaraVehicle[]): NormalizedVehicle[] {
  return vehicles
    .filter(v => v.vin || v.licensePlate)
    .map(v => ({
      vin: v.vin || null,
      license_plate: v.licensePlate || null,
      year: typeof v.year === "number" ? v.year : null,
      make: v.make || null,
      model: v.model || null,
      gvwr_lbs: typeof v.gvwr === "number" ? v.gvwr : null,
      vehicle_type: ((): NormalizedVehicle["vehicle_type"] => {
        const t = (v.vehicleType || "").toLowerCase();
        if (t === "truck") return "straight_truck";
        if (t === "tractor") return "tractor";
        if (t === "trailer") return "trailer";
        return null;
      })(),
      status: "active" as NormalizedVehicle["status"],
      source_vendor: "samsara",
      source_id: v.id != null ? String(v.id) : undefined,
    }));
}

// Motive (formerly KeepTruckin) — also a telematics provider, similar shape
type MotiveVehicle = {
  id?: string | number;
  number?: string;
  vin?: string;
  license_plate_number?: string;
  license_plate_state?: string;
  make?: string;
  model?: string;
  year?: number;
  status?: string;
};
export function mapMotive(vehicles: MotiveVehicle[]): NormalizedVehicle[] {
  return vehicles
    .filter(v => v.vin || v.license_plate_number)
    .map(v => ({
      vin: v.vin || null,
      license_plate: v.license_plate_number || null,
      license_plate_state: v.license_plate_state || null,
      year: typeof v.year === "number" ? v.year : null,
      make: v.make || null,
      model: v.model || null,
      status: v.status === "deactivated" ? "out_of_service" : "active",
      source_vendor: "motive",
      source_id: v.id != null ? String(v.id) : undefined,
    }));
}

export async function upsertVehicles(
  env: SupaEnv,
  carrierId: string,
  rows: NormalizedVehicle[],
): Promise<UpsertResult> {
  const result: UpsertResult = { inserted: 0, updated: 0, skipped: 0, errors: [] };
  if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE) {
    result.errors.push({ row: -1, reason: "Server missing SUPABASE_URL / SUPABASE_SERVICE_ROLE" });
    return result;
  }
  const base = env.SUPABASE_URL.replace(/\/$/, "");
  const sr = env.SUPABASE_SERVICE_ROLE;
  const BATCH = 50;

  for (let i = 0; i < rows.length; i += BATCH) {
    const slice = rows.slice(i, i + BATCH).map((r, j) => {
      if (!r.vin && !r.license_plate) {
        result.errors.push({ row: i + j, reason: "missing vin or license_plate" });
        return null;
      }
      return {
        carrier_id: carrierId,
        vin: r.vin || null,
        license_plate: r.license_plate || null,
        license_plate_state: r.license_plate_state || null,
        year: r.year || null,
        make: r.make || null,
        model: r.model || null,
        gvwr_lbs: r.gvwr_lbs || null,
        vehicle_type: r.vehicle_type || null,
        fuel_type: r.fuel_type || null,
        current_odometer: r.current_odometer || null,
        in_service_date: r.in_service_date || null,
        out_of_service_date: r.out_of_service_date || null,
        status: r.status || "active",
        last_dot_inspection_on: r.last_dot_inspection_on || null,
        next_dot_inspection_due: r.next_dot_inspection_due || null,
      };
    }).filter(Boolean);
    if (slice.length === 0) {
      result.skipped += rows.slice(i, i + BATCH).length;
      continue;
    }

    try {
      const r = await fetch(`${base}/rest/v1/compass_vehicles?on_conflict=carrier_id,vin`, {
        method: "POST",
        headers: {
          apikey: sr,
          Authorization: `Bearer ${sr}`,
          "Content-Type": "application/json",
          Prefer: "resolution=merge-duplicates,return=representation",
        },
        body: JSON.stringify(slice),
      });
      if (!r.ok) {
        const text = await r.text();
        if (r.status === 400 && text.includes("constraint")) {
          const r2 = await fetch(`${base}/rest/v1/compass_vehicles`, {
            method: "POST",
            headers: { apikey: sr, Authorization: `Bearer ${sr}`, "Content-Type": "application/json", Prefer: "return=representation" },
            body: JSON.stringify(slice),
          });
          if (r2.ok) {
            const ins = (await r2.json()) as unknown[];
            result.inserted += ins.length;
          } else {
            result.errors.push({ row: i, reason: `batch insert ${r2.status}: ${(await r2.text()).slice(0, 200)}` });
          }
          continue;
        }
        result.errors.push({ row: i, reason: `batch ${r.status}: ${text.slice(0, 200)}` });
        continue;
      }
      const ins = (await r.json()) as unknown[];
      result.inserted += ins.length;
    } catch (err) {
      result.errors.push({ row: i, reason: `batch exception: ${err instanceof Error ? err.message : String(err)}` });
    }
  }
  return result;
}
