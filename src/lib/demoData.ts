// Realistic dummy data for demo / unconnected carrier state.
// Mirrors the Compliance Command Center mockup numbers exactly so the dashboard
// renders the same screenshot.

export const DEMO_CARRIER = {
  name: "X3 Fleet Safety",
  dot_number: "241829",
  mc_number: "MC-845001",
  safety_rating: "Satisfactory",
  rating_date: "Dec 21, 1994",
  rating_type: "Non-Ratable",
  operating_authority: "Active — Authorized for Property",
  annual_miles: 797_944_751,
  reported_power_units: 10_260,
  reported_drivers: 12_986,
  reported_date: "MCS-150 · 2025",
  last_sync_at: "2026-04-22T08:08:00Z",
};

export const DEMO_FLEET = {
  active_drivers: 72,
  drivers_on_roster: 100,
  power_units: 67,
  tractors: 51,
  straight_trucks: 2,
  trailers: 13,
  open_alerts: 42,
  open_alerts_urgent: 15,
  cdls_expired: 5,
  mecs_expiring_30d: 5,
  dq_score_pct: 60,
  dq_docs_present: 413,
  dq_docs_total: 685,
  compliance_pct: 85,
  bipd_insurance: "$5M on file / $5M req",
  cargo_insurance: "$5K",
  crashes_24mo_total: 636,
  crashes_24mo_fatal: 12,
  crashes_24mo_injury: 217,
  driver_oos_rate_pct: 1,
  driver_oos_national_pct: 6.47,
  vehicle_oos_rate_pct: 13.3,
  vehicle_oos_national_pct: 22.28,
};

// Domain compliance bars (0–100)
export const COMPLIANCE_BARS: { label: string; pct: number; color: "green" | "yellow" | "red" }[] = [
  { label: "Driver Qualification (CDL)", pct: 93, color: "green" },
  { label: "Medical Certificates",       pct: 93, color: "green" },
  { label: "HOS / ELD",                  pct: 90, color: "green" },
  { label: "Drug & Alcohol",             pct: 95, color: "green" },
  { label: "Training Records",           pct: 90, color: "green" },
  { label: "Vehicle Maintenance",        pct: 79, color: "yellow" },
];

// CSA BASIC scores (MSR percentile — lower is better; threshold = intervention threshold)
export const CSA_BASICS: { name: string; msr: number; threshold: number; status: "ok" | "warn" | "alert" }[] = [
  { name: "Unsafe Driving",     msr: 0.52, threshold: 65, status: "warn"  },
  { name: "Crash Indicator",    msr: 0,    threshold: 65, status: "ok"    },
  { name: "HOS Compliance",     msr: 0.13, threshold: 65, status: "ok"    },
  { name: "Vehicle Maint.",     msr: 1.92, threshold: 80, status: "alert" },
  { name: "Hazmat",             msr: 0,    threshold: 80, status: "ok"    },
  { name: "Driver Fitness",     msr: 0.06, threshold: 80, status: "ok"    },
  { name: "Ctrl. Substances",   msr: 0,    threshold: 80, status: "ok"    },
];

export type ActionItem = { who: string; meta: string; status: string; statusKind: "overdue" | "warn" | "info" };

export const ACTION_ITEMS = {
  dq_docs_expiring: {
    title: "DQ Documents Expiring",
    cfr: "49 CFR § 391.51",
    items: [
      { who: "motor vehicle record",  meta: "Nancy Walker · May 15",      status: "365d OVERDUE", statusKind: "overdue" as const },
      { who: "eldt training cert",    meta: "Lawrence Sanchez · Aug 04",  status: "359d OVERDUE", statusKind: "overdue" as const },
      { who: "medical examiner cert", meta: "Terry Ramirez · Nov 2",      status: "343d OVERDUE", statusKind: "overdue" as const },
      { who: "eldt training cert",    meta: "Ronald Watson · Jun 28",     status: "345d OVERDUE", statusKind: "overdue" as const },
      { who: "medical examiner cert", meta: "Jacob Roberts · Jul 5",      status: "324d OVERDUE", statusKind: "overdue" as const },
    ] as ActionItem[],
    cta: { href: "/app/dq-files", label: "Open DQ files →" },
  },
  cdl_expirations: {
    title: "CDL Expirations",
    cfr: "49 CFR § 391.51",
    items: [
      { who: "Margaret Rodriguez", meta: "Expires Dec 30",  status: "5430d OVERDUE", statusKind: "overdue" as const },
      { who: "Douglas Hernandez",  meta: "Expires Oct 12",  status: "1190d OVERDUE", statusKind: "overdue" as const },
      { who: "Anthony Green",      meta: "Expires Nov 13",  status: "1114d OVERDUE", statusKind: "overdue" as const },
      { who: "Benjamin Morales",   meta: "Expires Dec 26",  status: "1102d OVERDUE", statusKind: "overdue" as const },
      { who: "Eric Martinez",      meta: "Expires Apr 4",   status: "598d OVERDUE",  statusKind: "overdue" as const },
    ] as ActionItem[],
    cta: { href: "/app/drivers", label: "Open drivers →" },
  },
  medical_certs: {
    title: "Medical Certificates",
    cfr: "49 CFR § 391.43",
    items: [
      { who: "Zachary Mitchell",   meta: "Expires Jan 13",  status: "473d OVERDUE",  statusKind: "overdue" as const },
      { who: "Anthony Green",      meta: "Expires Feb 24",  status: "462d OVERDUE",  statusKind: "overdue" as const },
      { who: "Kevin Hernandez",    meta: "Expires Apr 1",   status: "413d OVERDUE",  statusKind: "overdue" as const },
      { who: "Jerry Long",         meta: "Expires Jan 8",   status: "1310d OVERDUE", statusKind: "overdue" as const },
      { who: "Laurence Gonzalez",  meta: "Expires Mar 9",   status: "1270d OVERDUE", statusKind: "overdue" as const },
    ] as ActionItem[],
    cta: { href: "/app/dq-files", label: "Upload new cert →" },
  },
  preventive_maint: {
    title: "Preventive Maintenance",
    cfr: "49 CFR § 396.17",
    items: [
      { who: "Unit 156A", meta: "PM due Jan 1",  status: "138d OVERDUE", statusKind: "overdue" as const },
      { who: "Unit 109",  meta: "PM due Jan 4",  status: "135d OVERDUE", statusKind: "overdue" as const },
      { who: "Unit 154",  meta: "PM due Jan 22", status: "117d OVERDUE", statusKind: "overdue" as const },
      { who: "Unit 167",  meta: "PM due Jan 14", status: "110d OVERDUE", statusKind: "overdue" as const },
      { who: "Unit 134",  meta: "PM due Jan 1",  status: "101d OVERDUE", statusKind: "overdue" as const },
    ] as ActionItem[],
    cta: { href: "/app/vehicles", label: "Open vehicles →" },
  },
  incidents_awaiting: {
    title: "Incidents Awaiting Review",
    cfr: "Preventability classification",
    items: [
      { who: "Mar 22 · severe",   meta: "Joshua Lee",       status: "CLASSIFY", statusKind: "warn" as const },
      { who: "Feb 8 · severe",    meta: "Emma Cooper",      status: "CLASSIFY", statusKind: "warn" as const },
      { who: "Dec 22 · minor",    meta: "Ronald Watson",    status: "CLASSIFY", statusKind: "warn" as const },
      { who: "Sep 15 · moderate", meta: "Edward Alvarez",   status: "CLASSIFY", statusKind: "warn" as const },
      { who: "Jul 13 · minor",    meta: "Joseph Morris",    status: "CLASSIFY", statusKind: "warn" as const },
    ] as ActionItem[],
    cta: { href: "/app/accidents", label: "Open register →" },
  },
  eldt_incomplete: {
    title: "ELDT Incomplete",
    cfr: "49 CFR § 380",
    items: [
      { who: "Michael Patel",    meta: "Missing: theory + BTW",   status: "LOG ELDT", statusKind: "warn" as const },
      { who: "Matthew Rivera",   meta: "Missing: theory + BTW",   status: "LOG ELDT", statusKind: "warn" as const },
      { who: "Anna Sanders",     meta: "Missing: theory + BTW",   status: "LOG ELDT", statusKind: "warn" as const },
      { who: "Richard Anderson", meta: "Missing: theory + BTW",   status: "LOG ELDT", statusKind: "warn" as const },
      { who: "Benjamin Morales", meta: "Missing: theory + BTW",   status: "LOG ELDT", statusKind: "warn" as const },
    ] as ActionItem[],
    cta: { href: "/app/training", label: "Open training log →" },
  },
  training_expiring: {
    title: "Training Expiring / Expired",
    cfr: "49 CFR Part 380",
    items: [
      { who: "defensive driving",     meta: "Kyle Williams · Apr 28",     status: "3247d OVERDUE", statusKind: "overdue" as const },
      { who: "hazmat awareness",      meta: "Terry Ramirez · Aug 20",     status: "3194d OVERDUE", statusKind: "overdue" as const },
      { who: "pre trip inspection",   meta: "Edward Alvarez · Mar 17",    status: "2965d OVERDUE", statusKind: "overdue" as const },
      { who: "eldt btw",              meta: "Lawrence Sanchez · Apr 29",  status: "2843d OVERDUE", statusKind: "overdue" as const },
      { who: "cargo securement",      meta: "Nathan Cruz · Dec 5",        status: "2772d OVERDUE", statusKind: "overdue" as const },
    ] as ActionItem[],
    cta: { href: "/app/training", label: "Open training log →" },
  },
  clearinghouse_owed: {
    title: "Clearinghouse Reporting Owed",
    cfr: "49 CFR § 382.705 · 3 business days",
    items: [
      { who: "Christine Wilson",  meta: "positive · Feb 22",  status: "REPORT", statusKind: "warn" as const },
      { who: "Douglas Hernandez", meta: "positive · Feb 16",  status: "REPORT", statusKind: "warn" as const },
      { who: "Lawrence Sanchez",  meta: "positive · Jan 26",  status: "REPORT", statusKind: "warn" as const },
      { who: "Matthew Rivera",    meta: "positive · Jan 18",  status: "REPORT", statusKind: "warn" as const },
      { who: "Ronald Watson",     meta: "positive · Nov 17",  status: "REPORT", statusKind: "warn" as const },
    ] as ActionItem[],
    cta: { href: "/app/drug-alcohol", label: "Mark reported →" },
  },
};

// Driver status pie
export const DRIVER_STATUS = [
  { label: "Active",      count: 72, color: "#10B981" },
  { label: "On leave",    count:  8, color: "#FBBF24" },
  { label: "Inactive",    count: 12, color: "#9CA3AF" },
  { label: "Terminated",  count:  8, color: "#EF4444" },
];

// CDL expiration buckets (active drivers)
export const CDL_BUCKETS = [
  { label: "Expired",      count: 45 },
  { label: "0–30 days",    count:  4 },
  { label: "30–90 days",   count:  3 },
  { label: "60–90 days",   count:  6 },
  { label: "Over 90 days", count: 42 },
];

// Vehicle types pie
export const VEHICLE_TYPES = [
  { label: "Tractor",        count: 51, color: "#0E7490" },
  { label: "Trailer",        count: 13, color: "#FACC15" },
  { label: "Straight truck", count:  2, color: "#3B82F6" },
  { label: "Van",            count:  1, color: "#A78BFA" },
];

// Maintenance & inspection KPIs
export const MAINTENANCE_KPIS = [
  { label: "Inspection overdue", value: 83, sub: "past annual",   tone: "red"   as const },
  { label: "Inspection ≤30d",    value:  0, sub: "next 30 days",  tone: "green" as const },
  { label: "PM overdue",         value: 40, sub: "past due",      tone: "yellow" as const },
  { label: "PM ≤30d",            value: 12, sub: "next 30 days",  tone: "green" as const },
];

// Inspections last 6 months (clean/violations/out-of-service) — Dec25..Apr26
export const INSPECTIONS_BARS = [
  { month: "Dec 25", clean: 1,   violations: 0,   oos: 0 },
  { month: "Jan 26", clean: 2,   violations: 0,   oos: 0 },
  { month: "Feb 26", clean: 1.6, violations: 1,   oos: 0.3 },
  { month: "Mar 26", clean: 1.8, violations: 0.5, oos: 0.5 },
  { month: "Apr 26", clean: 2.5, violations: 0.3, oos: 0.5 },
];

// Drug & Alcohol — tests by type, stacked
export const DA_TESTS_BY_TYPE = [
  { type: "Pre-employment",   negative: 100, dilute: 5, canceled: 0, positive: 6, refusal: 4 },
  { type: "Random",           negative: 100, dilute: 8, canceled: 3, positive: 5, refusal: 4 },
  { type: "Post-accident",    negative:   2, dilute: 0, canceled: 0, positive: 0, refusal: 0 },
  { type: "Reasonable susp.", negative:   3, dilute: 0, canceled: 0, positive: 0, refusal: 0 },
];

// Monthly testing trend
export const DA_MONTHLY = [
  { m: "Nov 25", total: 8,  positives: 1 },
  { m: "Dec 25", total: 12, positives: 0 },
  { m: "Jan 26", total: 14, positives: 1 },
  { m: "Feb 26", total: 9,  positives: 0 },
  { m: "Mar 26", total: 11, positives: 1 },
  { m: "Apr 26", total: 8,  positives: 0 },
];

// HOS / ELD metrics
export const HOS_METRICS = {
  total_logs_30d: 216,
  violations_30d: 0,
  avg_drive: "5h 39m",
  total_miles_30d: 68_797.1,
};

// Document expiration stacked bar (0-30 / 31-60 / 61-90 days)
export const DOC_EXPIRATIONS = [
  { kind: "CDL",      "0_30": 4, "31_60": 1, "61_90": 0 },
  { kind: "MEC",      "0_30": 4, "31_60": 2, "61_90": 1 },
  { kind: "Training", "0_30": 5, "31_60": 1, "61_90": 3 },
];

// Training by topic (completed / in-progress / expired)
export const TRAINING_TOPICS = [
  { topic: "Supervisor DBA",     completed: 32, in_progress: 6,  expired: 6 },
  { topic: "Pre-Trip",           completed: 30, in_progress: 8,  expired: 3 },
  { topic: "Defensive Driving",  completed: 30, in_progress: 5,  expired: 4 },
  { topic: "ELDT BTW",           completed: 26, in_progress: 7,  expired: 4 },
  { topic: "Distracted Driving", completed: 26, in_progress: 4,  expired: 3 },
  { topic: "Cargo Securement",   completed: 25, in_progress: 7,  expired: 2 },
  { topic: "HOS Refresher",      completed: 22, in_progress: 6,  expired: 2 },
  { topic: "ELDT Theory",        completed: 18, in_progress: 5,  expired: 2 },
  { topic: "Winter Driving",     completed: 14, in_progress: 4,  expired: 2 },
  { topic: "Hazmat",             completed:  9, in_progress: 3,  expired: 1 },
];

// Vendor integrations + connection status
export const INTEGRATIONS = [
  { vendor: "Stripe",    purpose: "Billing + subscriptions",          status: "Connected",  badge: "Live"     },
  { vendor: "Checkr",    purpose: "FCRA background checks",           status: "Connected",  badge: "Live"     },
  { vendor: "Anthropic", purpose: "Claude (AI brain)",                status: "Connected",  badge: "Live"     },
  { vendor: "Supabase",  purpose: "Database + Auth + Storage",        status: "Connected",  badge: "Live"     },
  { vendor: "Cloudflare",purpose: "Hosting + WAF + edge",             status: "Connected",  badge: "Live"     },
  { vendor: "Resend",    purpose: "Transactional email",              status: "Connected",  badge: "Live"     },
  { vendor: "Twilio",    purpose: "Transactional SMS + STOP handling",status: "Connected",  badge: "Live"     },
  { vendor: "Motive",    purpose: "ELD telematics",                   status: "Available",  badge: "Q3 2026"  },
  { vendor: "Samsara",   purpose: "ELD telematics",                   status: "Available",  badge: "Q3 2026"  },
  { vendor: "Geotab",    purpose: "ELD telematics",                   status: "Available",  badge: "Q3 2026"  },
  { vendor: "SambaSafety",purpose:"Continuous MVR monitoring",        status: "Available",  badge: "Q3 2026"  },
  { vendor: "Quest",     purpose: "D&A collection sites",             status: "Available",  badge: "Q4 2026"  },
  { vendor: "CarrierOk", purpose: "CSA scores + SAFER data",          status: "In trial",   badge: "Pending"  },
  { vendor: "FMCSA Clearinghouse", purpose: "Drug & alcohol federal registry", status: "Manual", badge: "Awaiting API" },
];
