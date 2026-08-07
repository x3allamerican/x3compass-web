/* ============================================================
   X3 Compass · DEMO DATA FALLBACK
   ------------------------------------------------------------
   When a /* page queries Supabase and gets back an empty
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

/* ----------- /drivers ----------- */

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

/* ----------- /vehicles ----------- */

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

/* ----------- /dq-files ----------- */

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

/* ----------- /inspections ----------- */

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

/* ----------- /clearinghouse ----------- */

export type DemoClearinghouseQuery = {
  id: string;
  driver_id: string;
  driver_name: string;
  query_type: "pre_employment_full" | "annual_limited" | "triggered_full";
  query_run_at: string;
  result: "information" | "no_information" | "pending" | "error";
  consent_received_at: string | null;
  cost_cents: number;
  fmcsa_query_id: string | null;
};

export const DEMO_CLEARINGHOUSE_QUERIES: DemoClearinghouseQuery[] = [
  { id: "chq-001", driver_id: "d-001", driver_name: "Reyes, Marcus",      query_type: "annual_limited",      query_run_at: daysAgo(38),  result: "no_information", consent_received_at: null,            cost_cents: 125, fmcsa_query_id: "FMCSA-26-04-19-A7912" },
  { id: "chq-002", driver_id: "d-002", driver_name: "Saunders, Khalil",   query_type: "annual_limited",      query_run_at: daysAgo(72),  result: "information",    consent_received_at: null,            cost_cents: 125, fmcsa_query_id: "FMCSA-26-03-16-K1284" },
  { id: "chq-003", driver_id: "d-002", driver_name: "Saunders, Khalil",   query_type: "triggered_full",      query_run_at: daysAgo(71),  result: "no_information", consent_received_at: daysAgo(71),     cost_cents: 125, fmcsa_query_id: "FMCSA-26-03-17-K1290" },
  { id: "chq-004", driver_id: "d-004", driver_name: "Walsh, Anders",      query_type: "pre_employment_full", query_run_at: daysAgo(40),  result: "no_information", consent_received_at: daysAgo(41),     cost_cents: 125, fmcsa_query_id: "FMCSA-26-04-17-W5503" },
  { id: "chq-005", driver_id: "d-003", driver_name: "Mendelsohn, Linda",  query_type: "annual_limited",      query_run_at: daysAgo(14),  result: "no_information", consent_received_at: null,            cost_cents: 125, fmcsa_query_id: "FMCSA-26-05-13-M8841" },
  { id: "chq-006", driver_id: "d-007", driver_name: "Whitman, D.",        query_type: "pre_employment_full", query_run_at: daysAgo(20),  result: "pending",        consent_received_at: daysAgo(20),     cost_cents: 125, fmcsa_query_id: null },
  { id: "chq-007", driver_id: "d-010", driver_name: "Beaumont, Trent",    query_type: "annual_limited",      query_run_at: daysAgo(95),  result: "no_information", consent_received_at: null,            cost_cents: 125, fmcsa_query_id: "FMCSA-26-02-22-B3047" },
  { id: "chq-008", driver_id: "d-008", driver_name: "Okafor, Yusuf",      query_type: "annual_limited",      query_run_at: daysAgo(60),  result: "no_information", consent_received_at: null,            cost_cents: 125, fmcsa_query_id: "FMCSA-26-03-28-O9912" },
];

export type DemoClearinghouseViolation = {
  id: string;
  driver_id: string;
  driver_name: string;
  violation_type: "positive_drug_test" | "positive_alcohol_test" | "test_refusal" | "actual_knowledge" | "pre_employment_positive";
  violation_date: string;
  reported_by: "carrier" | "mro" | "sap" | "service_agent";
  prohibited_status_active: boolean;
  sap_evaluation_complete: boolean;
  return_to_duty_complete: boolean;
  notes: string;
};

export const DEMO_CLEARINGHOUSE_VIOLATIONS: DemoClearinghouseViolation[] = [
  { id: "chv-001", driver_id: "d-012", driver_name: "Caldwell, Hank",   violation_type: "positive_drug_test", violation_date: daysAgo(330), reported_by: "mro",           prohibited_status_active: false, sap_evaluation_complete: true,  return_to_duty_complete: true,  notes: "Pre-employment positive · cleared via SAP evaluation 2025-08-12 · 6-test follow-up 4-of-6 complete" },
  { id: "chv-002", driver_id: "d-009", driver_name: "Kowalski, Renee",  violation_type: "test_refusal",       violation_date: daysAgo(45),  reported_by: "service_agent", prohibited_status_active: true,  sap_evaluation_complete: false, return_to_duty_complete: false, notes: "Refusal during random pool selection · SAP referral sent 2026-04-15 · pending evaluation" },
];

export type DemoClearinghouseConsent = {
  id: string;
  driver_id: string;
  driver_name: string;
  consent_type: "pre_employment" | "triggered_24hr";
  consent_requested_at: string;
  consent_deadline_at: string | null;
  consent_received_at: string | null;
  status: "pending" | "received" | "expired";
};

export const DEMO_CLEARINGHOUSE_CONSENTS: DemoClearinghouseConsent[] = [
  { id: "chc-001", driver_id: "d-005", driver_name: "Jansen, Brett",   consent_type: "triggered_24hr",  consent_requested_at: new Date(Date.now() - 8 * 3600000).toISOString(),  consent_deadline_at: new Date(Date.now() + 16 * 3600000).toISOString(), consent_received_at: null,        status: "pending" },
  { id: "chc-002", driver_id: "d-013", driver_name: "Nakamura, Iris",  consent_type: "pre_employment",  consent_requested_at: daysAgo(2),                                       consent_deadline_at: null,                                              consent_received_at: null,        status: "pending" },
  { id: "chc-003", driver_id: "d-004", driver_name: "Walsh, Anders",   consent_type: "pre_employment",  consent_requested_at: daysAgo(42),                                      consent_deadline_at: null,                                              consent_received_at: daysAgo(41), status: "received" },
];

/* ----------- /hos ----------- */

export type DemoHosLog = {
  id: string;
  driver_id: string;
  driver_name: string;
  log_date: string;
  total_drive_minutes: number;
  total_on_duty_minutes: number;
  hours_70_8: number;          // running total of last 8 days
  violations: Array<{ cfr: string; label: string; severity: "warning" | "violation" }>;
  eld_source: string | null;   // "motive" | "samsara" | "geotab" | "keeptruckin" | null (manual)
  certified: boolean;
};

export const DEMO_HOS_LOGS: DemoHosLog[] = [
  // Today
  { id: "hl-001", driver_id: "d-005", driver_name: "Jansen, Brett",       log_date: today(), total_drive_minutes: 695, total_on_duty_minutes: 845, hours_70_8: 68.4, violations: [{ cfr: "§395.3(a)(1)", label: "11-hr drive limit exceeded by 35m", severity: "violation" }, { cfr: "§395.3(c)", label: "Approaching 70-hr/8-day · 1.6h headroom", severity: "warning" }], eld_source: "motive",  certified: false },
  { id: "hl-002", driver_id: "d-002", driver_name: "Saunders, Khalil",    log_date: today(), total_drive_minutes: 640, total_on_duty_minutes: 820, hours_70_8: 58.1, violations: [], eld_source: "motive",  certified: false },
  { id: "hl-003", driver_id: "d-001", driver_name: "Reyes, Marcus",       log_date: today(), total_drive_minutes: 540, total_on_duty_minutes: 720, hours_70_8: 49.8, violations: [], eld_source: "samsara", certified: true  },
  // Yesterday
  { id: "hl-004", driver_id: "d-009", driver_name: "Kowalski, Renee",     log_date: daysAgo(1), total_drive_minutes: 480, total_on_duty_minutes: 630, hours_70_8: 41.2, violations: [{ cfr: "§395.3(a)(3)(ii)", label: "30-min break missed after 8.4 cumulative drive hrs", severity: "violation" }], eld_source: "geotab",  certified: true },
  { id: "hl-005", driver_id: "d-006", driver_name: "Velasquez, Carla",    log_date: daysAgo(1), total_drive_minutes: 525, total_on_duty_minutes: 705, hours_70_8: 47.5, violations: [], eld_source: "samsara", certified: true },
  { id: "hl-006", driver_id: "d-008", driver_name: "Okafor, Yusuf",       log_date: daysAgo(1), total_drive_minutes: 615, total_on_duty_minutes: 815, hours_70_8: 52.0, violations: [], eld_source: "motive",  certified: true },
  // 2 days ago
  { id: "hl-007", driver_id: "d-010", driver_name: "Beaumont, Trent",     log_date: daysAgo(2), total_drive_minutes: 580, total_on_duty_minutes: 760, hours_70_8: 50.3, violations: [], eld_source: "motive",  certified: true },
  { id: "hl-008", driver_id: "d-005", driver_name: "Jansen, Brett",       log_date: daysAgo(2), total_drive_minutes: 660, total_on_duty_minutes: 845, hours_70_8: 53.7, violations: [{ cfr: "§395.3(a)(2)", label: "14-hr duty window exceeded by 25m", severity: "violation" }], eld_source: "motive",  certified: true },
  { id: "hl-009", driver_id: "d-011", driver_name: "Ramaswamy, Priya",    log_date: daysAgo(2), total_drive_minutes: 450, total_on_duty_minutes: 600, hours_70_8: 39.8, violations: [], eld_source: "keeptruckin", certified: true },
  // 3-5 days ago
  { id: "hl-010", driver_id: "d-003", driver_name: "Mendelsohn, Linda",   log_date: daysAgo(3), total_drive_minutes: 600, total_on_duty_minutes: 800, hours_70_8: 48.0, violations: [], eld_source: "samsara", certified: true },
  { id: "hl-011", driver_id: "d-002", driver_name: "Saunders, Khalil",    log_date: daysAgo(3), total_drive_minutes: 610, total_on_duty_minutes: 790, hours_70_8: 47.3, violations: [], eld_source: "motive",  certified: true },
  { id: "hl-012", driver_id: "d-007", driver_name: "Whitman, D.",         log_date: daysAgo(4), total_drive_minutes: 0,   total_on_duty_minutes: 0,   hours_70_8: 0.0,  violations: [{ cfr: "§395.8(k)", label: "Missing RODS · ELD malfunction reported, not yet repaired", severity: "warning" }], eld_source: null, certified: false },
  { id: "hl-013", driver_id: "d-001", driver_name: "Reyes, Marcus",       log_date: daysAgo(5), total_drive_minutes: 555, total_on_duty_minutes: 735, hours_70_8: 42.1, violations: [], eld_source: "samsara", certified: true },
];

/* ----------- helpers ----------- */

/** Returns demo rows ONLY when real-data array is empty AND we're in demo mode.
 *  Demo mode = no carrier yet OR no real data ingested yet. Once a row exists,
 *  the page shows real data. */
export function withDemoFallback<T>(real: T[], demo: T[], allowDemo: boolean = false): T[] {
  // Demo rows are ONLY for the unauthenticated marketing/preview experience.
  // A real authenticated carrier (allowDemo=false) with zero rows must see an
  // empty table + honest empty state — never another company's demo data.
  if (real.length > 0) return real;
  return allowDemo ? demo : real;
}
