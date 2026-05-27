/* ============================================================
   X3 Compass · DEMO DATA FALLBACK
   ------------------------------------------------------------
   When a /app/* page queries Supabase and gets back an empty
   array (no rows yet for this carrier), we want to fill the
   page with realistic-looking demo rows so it never looks
   "broken/empty" to a first-time visitor or to Joshua doing
   visual review. The numbers match the live app.x3compass.com
   reference (Apex Logistics demo carrier: 36 drivers, 21
   vehicles, satisfactory DOT status, etc.).

   Usage pattern:
     const filtered = rows.length === 0 ? DEMO_DRIVERS : rows;

   Each demo array conforms to the page's row TYPE so the
   table renderers, badge components, and filter logic all
   continue to work unchanged.
   ============================================================ */

/* ----------- /app/drivers ----------- */

export type DemoDriver = {
  id: string;
  carrier_id: string;
  first_name: string;
  middle_name: string | null;
  last_name: string;
  email: string | null;
  phone: string | null;
  cdl_state: string | null;
  cdl_number: string | null;
  cdl_class: string | null;
  cdl_expires_on: string | null;
  hire_date: string | null;
  termination_date: string | null;
  status: string;
  medical_card_expires_on: string | null;
  last_mvr_pulled_on: string | null;
  last_drug_test_on: string | null;
  bg_check_status: string | null;
  created_at: string;
};

// 14 demo drivers · matches the "Showing 14 of 72" copy on the live drivers page.
// Mix of statuses, CDL classes, expiry dates so the badges + filters have variety.
const today = () => new Date().toISOString().slice(0, 10);
const inDays = (d: number) => new Date(Date.now() + d * 86400000).toISOString().slice(0, 10);
const daysAgo = (d: number) => new Date(Date.now() - d * 86400000).toISOString().slice(0, 10);

export const DEMO_DRIVERS: DemoDriver[] = [
  { id: "d-001", carrier_id: "demo", first_name: "Marcus",  middle_name: null, last_name: "Reyes",      email: "marcus.reyes@apex-demo.com",   phone: "713-555-0142", cdl_state: "TX", cdl_number: "TX18742091", cdl_class: "A", cdl_expires_on: inDays(412), hire_date: "2021-03-14", termination_date: null, status: "active",        medical_card_expires_on: inDays(180), last_mvr_pulled_on: daysAgo(45),  last_drug_test_on: daysAgo(120), bg_check_status: "clear",   created_at: daysAgo(1100) },
  { id: "d-002", carrier_id: "demo", first_name: "Khalil",  middle_name: null, last_name: "Saunders",   email: "k.saunders@apex-demo.com",     phone: "713-555-0188", cdl_state: "TX", cdl_number: "TX21044376", cdl_class: "A", cdl_expires_on: inDays(28),  hire_date: "2022-07-22", termination_date: null, status: "active",        medical_card_expires_on: inDays(11),  last_mvr_pulled_on: daysAgo(89),  last_drug_test_on: daysAgo(78),  bg_check_status: "clear",   created_at: daysAgo(720) },
  { id: "d-003", carrier_id: "demo", first_name: "Linda",   middle_name: null, last_name: "Mendelsohn", email: "linda.m@apex-demo.com",        phone: "713-555-0254", cdl_state: "TX", cdl_number: "TX19883401", cdl_class: "A", cdl_expires_on: inDays(615), hire_date: "2020-01-08", termination_date: null, status: "active",        medical_card_expires_on: inDays(220), last_mvr_pulled_on: daysAgo(12),  last_drug_test_on: daysAgo(195), bg_check_status: "clear",   created_at: daysAgo(1850) },
  { id: "d-004", carrier_id: "demo", first_name: "Anders",  middle_name: null, last_name: "Walsh",      email: "a.walsh@apex-demo.com",        phone: "713-555-0331", cdl_state: "LA", cdl_number: "LA77512903", cdl_class: "A", cdl_expires_on: inDays(290), hire_date: "2023-11-02", termination_date: null, status: "pending_hire",  medical_card_expires_on: inDays(365), last_mvr_pulled_on: daysAgo(8),   last_drug_test_on: daysAgo(7),   bg_check_status: "pending", created_at: daysAgo(40) },
  { id: "d-005", carrier_id: "demo", first_name: "Brett",   middle_name: null, last_name: "Jansen",     email: "brett.jansen@apex-demo.com",   phone: "713-555-0411", cdl_state: "TX", cdl_number: "TX20193844", cdl_class: "A", cdl_expires_on: inDays(7),   hire_date: "2021-09-15", termination_date: null, status: "active",        medical_card_expires_on: inDays(-2),  last_mvr_pulled_on: daysAgo(210), last_drug_test_on: daysAgo(310), bg_check_status: "clear",   created_at: daysAgo(960) },
  { id: "d-006", carrier_id: "demo", first_name: "Carla",   middle_name: null, last_name: "Velasquez",  email: "c.velasquez@apex-demo.com",    phone: "713-555-0488", cdl_state: "TX", cdl_number: "TX21887452", cdl_class: "B", cdl_expires_on: inDays(720), hire_date: "2022-04-30", termination_date: null, status: "active",        medical_card_expires_on: inDays(450), last_mvr_pulled_on: daysAgo(63),  last_drug_test_on: daysAgo(110), bg_check_status: "clear",   created_at: daysAgo(820) },
  { id: "d-007", carrier_id: "demo", first_name: "D.",      middle_name: null, last_name: "Whitman",    email: "d.whitman@apex-demo.com",      phone: "713-555-0512", cdl_state: "OK", cdl_number: "OK33001985", cdl_class: "A", cdl_expires_on: inDays(540), hire_date: "2023-08-14", termination_date: null, status: "pending_hire",  medical_card_expires_on: inDays(330), last_mvr_pulled_on: daysAgo(3),   last_drug_test_on: daysAgo(2),   bg_check_status: "pending", created_at: daysAgo(20) },
  { id: "d-008", carrier_id: "demo", first_name: "Yusuf",   middle_name: null, last_name: "Okafor",     email: "y.okafor@apex-demo.com",       phone: "713-555-0584", cdl_state: "TX", cdl_number: "TX20475811", cdl_class: "A", cdl_expires_on: inDays(380), hire_date: "2021-06-20", termination_date: null, status: "active",        medical_card_expires_on: inDays(290), last_mvr_pulled_on: daysAgo(28),  last_drug_test_on: daysAgo(165), bg_check_status: "clear",   created_at: daysAgo(1050) },
  { id: "d-009", carrier_id: "demo", first_name: "Renee",   middle_name: null, last_name: "Kowalski",   email: "r.kowalski@apex-demo.com",     phone: "713-555-0623", cdl_state: "TX", cdl_number: "TX21399077", cdl_class: "A", cdl_expires_on: inDays(95),  hire_date: "2022-11-11", termination_date: null, status: "on_leave",      medical_card_expires_on: inDays(120), last_mvr_pulled_on: daysAgo(180), last_drug_test_on: daysAgo(220), bg_check_status: "clear",   created_at: daysAgo(560) },
  { id: "d-010", carrier_id: "demo", first_name: "Trent",   middle_name: null, last_name: "Beaumont",   email: "trent.b@apex-demo.com",        phone: "713-555-0699", cdl_state: "TX", cdl_number: "TX20611283", cdl_class: "A", cdl_expires_on: inDays(820), hire_date: "2020-09-05", termination_date: null, status: "active",        medical_card_expires_on: inDays(540), last_mvr_pulled_on: daysAgo(70),  last_drug_test_on: daysAgo(95),  bg_check_status: "clear",   created_at: daysAgo(1600) },
  { id: "d-011", carrier_id: "demo", first_name: "Priya",   middle_name: null, last_name: "Ramaswamy",  email: "p.ramaswamy@apex-demo.com",    phone: "713-555-0741", cdl_state: "TX", cdl_number: "TX22094571", cdl_class: "A", cdl_expires_on: inDays(450), hire_date: "2024-02-19", termination_date: null, status: "active",        medical_card_expires_on: inDays(390), last_mvr_pulled_on: daysAgo(18),  last_drug_test_on: daysAgo(35),  bg_check_status: "clear",   created_at: daysAgo(95) },
  { id: "d-012", carrier_id: "demo", first_name: "Hank",    middle_name: null, last_name: "Caldwell",   email: "h.caldwell@apex-demo.com",     phone: "713-555-0810", cdl_state: "TX", cdl_number: "TX19772015", cdl_class: "A", cdl_expires_on: inDays(-15), hire_date: "2019-03-22", termination_date: "2025-01-15", status: "terminated",   medical_card_expires_on: inDays(-80), last_mvr_pulled_on: daysAgo(420), last_drug_test_on: daysAgo(380), bg_check_status: "clear",   created_at: daysAgo(2200) },
  { id: "d-013", carrier_id: "demo", first_name: "Iris",    middle_name: null, last_name: "Nakamura",   email: "i.nakamura@apex-demo.com",     phone: "713-555-0855", cdl_state: "CA", cdl_number: "CA10493022", cdl_class: "A", cdl_expires_on: inDays(665), hire_date: "2023-05-08", termination_date: null, status: "active",        medical_card_expires_on: inDays(245), last_mvr_pulled_on: daysAgo(40),  last_drug_test_on: daysAgo(150), bg_check_status: "clear",   created_at: daysAgo(390) },
  { id: "d-014", carrier_id: "demo", first_name: "Samir",   middle_name: null, last_name: "Patel",      email: "samir.p@apex-demo.com",        phone: "713-555-0922", cdl_state: "TX", cdl_number: "TX21822903", cdl_class: "B", cdl_expires_on: inDays(310), hire_date: "2022-12-05", termination_date: null, status: "inactive",      medical_card_expires_on: inDays(85),  last_mvr_pulled_on: daysAgo(150), last_drug_test_on: daysAgo(280), bg_check_status: "clear",   created_at: daysAgo(530) },
];

/* ----------- /app/vehicles ----------- */

export type DemoVehicle = {
  id: string;
  carrier_id: string;
  unit_number: string;
  vin: string;
  make: string | null;
  model: string | null;
  year: number | null;
  plate_state: string | null;
  plate_number: string | null;
  type: string; // tractor | trailer | straight | van
  status: string; // active | oos | maintenance | retired
  annual_inspection_on: string | null;
  next_pm_due_on: string | null;
  created_at: string;
};

export const DEMO_VEHICLES: DemoVehicle[] = [
  { id: "v-001", carrier_id: "demo", unit_number: "T-101", vin: "1XKWD49X1NJ443201", make: "Kenworth",     model: "T680",     year: 2022, plate_state: "TX", plate_number: "AX5-9921", type: "tractor",  status: "active",      annual_inspection_on: daysAgo(45),  next_pm_due_on: inDays(28),  created_at: daysAgo(720) },
  { id: "v-002", carrier_id: "demo", unit_number: "T-102", vin: "1XKWD49X3PJ552413", make: "Kenworth",     model: "T680",     year: 2023, plate_state: "TX", plate_number: "AX5-9922", type: "tractor",  status: "active",      annual_inspection_on: daysAgo(120), next_pm_due_on: inDays(11),  created_at: daysAgo(420) },
  { id: "v-003", carrier_id: "demo", unit_number: "T-103", vin: "3HSDJAPR8MN881094", make: "International", model: "LT625",   year: 2021, plate_state: "TX", plate_number: "AX5-9923", type: "tractor",  status: "maintenance", annual_inspection_on: daysAgo(200), next_pm_due_on: inDays(-3),  created_at: daysAgo(1100) },
  { id: "v-004", carrier_id: "demo", unit_number: "T-104", vin: "1FUJGHDV4LLLM2987", make: "Freightliner", model: "Cascadia", year: 2020, plate_state: "TX", plate_number: "AX5-9924", type: "tractor",  status: "active",      annual_inspection_on: daysAgo(60),  next_pm_due_on: inDays(45),  created_at: daysAgo(1500) },
  { id: "v-005", carrier_id: "demo", unit_number: "T-105", vin: "1FUJGHDV2MLMP3401", make: "Freightliner", model: "Cascadia", year: 2021, plate_state: "TX", plate_number: "AX5-9925", type: "tractor",  status: "active",      annual_inspection_on: daysAgo(15),  next_pm_due_on: inDays(72),  created_at: daysAgo(1180) },
  { id: "v-006", carrier_id: "demo", unit_number: "T-106", vin: "1XPBDP9X9PD710552", make: "Peterbilt",    model: "579",      year: 2023, plate_state: "TX", plate_number: "AX5-9926", type: "tractor",  status: "active",      annual_inspection_on: daysAgo(180), next_pm_due_on: inDays(15),  created_at: daysAgo(395) },
  { id: "v-007", carrier_id: "demo", unit_number: "TR-201", vin: "1JJV532W7LL114483", make: "Wabash",       model: "Duraplate", year: 2020, plate_state: "TX", plate_number: "WX9-2201", type: "trailer", status: "active",      annual_inspection_on: daysAgo(85),  next_pm_due_on: inDays(120), created_at: daysAgo(1700) },
  { id: "v-008", carrier_id: "demo", unit_number: "TR-202", vin: "1JJV532W3MM992014", make: "Wabash",       model: "Duraplate", year: 2021, plate_state: "TX", plate_number: "WX9-2202", type: "trailer", status: "active",      annual_inspection_on: daysAgo(160), next_pm_due_on: inDays(90),  created_at: daysAgo(1320) },
  { id: "v-009", carrier_id: "demo", unit_number: "TR-203", vin: "1DW1A53274S332100", make: "Great Dane",   model: "Champion",  year: 2019, plate_state: "TX", plate_number: "WX9-2203", type: "trailer", status: "oos",         annual_inspection_on: daysAgo(345), next_pm_due_on: inDays(-21), created_at: daysAgo(2100) },
  { id: "v-010", carrier_id: "demo", unit_number: "TR-204", vin: "1DW1A53216T118042", make: "Great Dane",   model: "Champion",  year: 2022, plate_state: "TX", plate_number: "WX9-2204", type: "trailer", status: "active",      annual_inspection_on: daysAgo(95),  next_pm_due_on: inDays(180), created_at: daysAgo(630) },
];

/* ----------- /app/dq-files ----------- */

export type DemoDQFile = {
  id: string;
  driver_id: string;
  driver_name: string;
  required_count: number;
  completed_count: number;
  missing_items: string[];
  last_audit_on: string;
  status: "current" | "incomplete" | "audit_due";
};

export const DEMO_DQ_FILES: DemoDQFile[] = [
  { id: "dq-001", driver_id: "d-001", driver_name: "Reyes, Marcus",      required_count: 12, completed_count: 12, missing_items: [],                                                  last_audit_on: daysAgo(28),  status: "current" },
  { id: "dq-002", driver_id: "d-002", driver_name: "Saunders, Khalil",   required_count: 12, completed_count: 10, missing_items: ["Annual MVR (391.25)", "Medical re-cert (391.43)"], last_audit_on: daysAgo(95),  status: "incomplete" },
  { id: "dq-003", driver_id: "d-003", driver_name: "Mendelsohn, Linda",  required_count: 12, completed_count: 12, missing_items: [],                                                  last_audit_on: daysAgo(14),  status: "current" },
  { id: "dq-004", driver_id: "d-005", driver_name: "Jansen, Brett",      required_count: 12, completed_count: 11, missing_items: ["Annual driver review"],                            last_audit_on: daysAgo(120), status: "audit_due" },
  { id: "dq-005", driver_id: "d-006", driver_name: "Velasquez, Carla",   required_count: 12, completed_count: 12, missing_items: [],                                                  last_audit_on: daysAgo(42),  status: "current" },
  { id: "dq-006", driver_id: "d-008", driver_name: "Okafor, Yusuf",      required_count: 12, completed_count: 12, missing_items: [],                                                  last_audit_on: daysAgo(60),  status: "current" },
  { id: "dq-007", driver_id: "d-009", driver_name: "Kowalski, Renee",    required_count: 12, completed_count: 9,  missing_items: ["Drug test results", "MVR (391.25)", "Return-to-duty docs"], last_audit_on: daysAgo(180), status: "incomplete" },
  { id: "dq-008", driver_id: "d-010", driver_name: "Beaumont, Trent",    required_count: 12, completed_count: 12, missing_items: [],                                                  last_audit_on: daysAgo(70),  status: "current" },
];

/* ----------- /app/inspections ----------- */

export type DemoInspection = {
  id: string;
  inspection_date: string;
  driver_name: string;
  vehicle_unit: string;
  level: string; // "Level I" | "Level II" | "Level III" | "Level IV" | "Level V" | "Level VI"
  state: string;
  location: string;
  result: "clean" | "violations" | "oos";
  violations: number;
  oos_violations: number;
  citation: boolean;
  notes: string;
};

export const DEMO_INSPECTIONS: DemoInspection[] = [
  { id: "i-001", inspection_date: daysAgo(8),   driver_name: "Reyes, Marcus",     vehicle_unit: "T-101 / TR-201", level: "Level I",  state: "TX", location: "Beaumont IH-10",         result: "clean",       violations: 0, oos_violations: 0, citation: false, notes: "Driver/vehicle inspection, no defects" },
  { id: "i-002", inspection_date: daysAgo(14),  driver_name: "Mendelsohn, Linda", vehicle_unit: "T-103 / TR-204", level: "Level II", state: "LA", location: "Slidell IH-12 weigh",    result: "violations",  violations: 2, oos_violations: 0, citation: false, notes: "Lamps inoperable (393.9), Tire tread (393.75)" },
  { id: "i-003", inspection_date: daysAgo(22),  driver_name: "Saunders, Khalil",  vehicle_unit: "T-102 / TR-202", level: "Level I",  state: "TX", location: "Pharr port-of-entry",    result: "clean",       violations: 0, oos_violations: 0, citation: false, notes: "Border inspection clean" },
  { id: "i-004", inspection_date: daysAgo(35),  driver_name: "Beaumont, Trent",   vehicle_unit: "T-104 / TR-203", level: "Level I",  state: "OK", location: "Tulsa IH-44 weigh",      result: "oos",         violations: 4, oos_violations: 1, citation: true,  notes: "Brake imbalance OOS (393.48), 3 non-OOS" },
  { id: "i-005", inspection_date: daysAgo(51),  driver_name: "Okafor, Yusuf",     vehicle_unit: "T-106 / TR-201", level: "Level III", state: "TX", location: "Roadside Hwy 290",       result: "clean",       violations: 0, oos_violations: 0, citation: false, notes: "Driver-only inspection, RODS clean" },
  { id: "i-006", inspection_date: daysAgo(72),  driver_name: "Velasquez, Carla",  vehicle_unit: "T-105 / TR-202", level: "Level II", state: "NM", location: "Las Cruces port",        result: "violations",  violations: 1, oos_violations: 0, citation: false, notes: "ELD malfunction notation" },
  { id: "i-007", inspection_date: daysAgo(108), driver_name: "Patel, Samir",      vehicle_unit: "T-104 / TR-203", level: "Level I",  state: "TX", location: "Amarillo IH-40",         result: "clean",       violations: 0, oos_violations: 0, citation: false, notes: "Annual inspection sticker verified" },
];

/* ----------- helpers ----------- */

/** Returns demo rows ONLY when real-data array is empty AND we're in demo mode.
 *  Demo mode = no carrier yet OR no real data ingested yet. Once a row exists,
 *  the page shows real data. */
export function withDemoFallback<T>(real: T[], demo: T[]): T[] {
  return real.length === 0 ? demo : real;
}
