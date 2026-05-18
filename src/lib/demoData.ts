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

// ============================================================================
// X3 Internal Admin — Cross-tenant operations console
// Mirrors app.x3fleetsafety.com/admin Control Center exactly.
// ============================================================================

export type ScheduledAgent = {
  name: string;
  cadence: string;
  last_run: string;
  result: "ok" | "partial" | "error" | "skipped" | "never";
  enabled: boolean;
  description: string;
};

export type OnDemandAgent = {
  name: string;
  trigger: string;
  last_run: string;
  result: "ok" | "partial" | "error";
  enabled: boolean;
  description: string;
};

export type AgentStub = { name: string; reason: string };

export const SCHEDULED_AGENTS: ScheduledAgent[] = [
  { name: "agent-billing-watchdog",          cadence: "Every 6 hours",                                       last_run: "Never",  result: "never",   enabled: true, description: "Polls Stripe for failed payments, near-expirations, and reconciliation drift. Pages Joshua on past-due >7d." },
  { name: "agent-csa-snapshot-reminder",     cadence: "Monthly · 1st · 1pm UTC",                             last_run: "May 1",  result: "ok",      enabled: true, description: "Reminds carriers their monthly CSA snapshot is ready and pulls the latest CarrierOk feed (when live)." },
  { name: "agent-data-retention-purge",      cadence: "Quarterly · 1st of Jan/Apr/Jul/Oct · 2pm UTC",        last_run: "Apr 27", result: "ok",      enabled: true, description: "Honors GDPR/CCPA + our DPA retention windows: purges expired driver PII, old MVR pulls, archived D&A results." },
  { name: "agent-driver-doc-ingest",         cadence: "Every 10 minutes",                                    last_run: "9m ago", result: "skipped", enabled: true, description: "Watches each carrier's connected Drive/Box folder for new DQ documents and routes them to the right driver record." },
  { name: "agent-driver-reminders",          cadence: "Daily · 11am UTC",                                    last_run: "14h ago",result: "ok",      enabled: true, description: "Sends CDL/MEC/MVR/D&A reminders to drivers via email + SMS following the carrier's notification rules." },
  { name: "agent-email-result-catcher",      cadence: "Every 15 minutes",                                    last_run: "4m ago", result: "ok",      enabled: true, description: "Polls a shared inbox for inbound vendor results (lab reports, MVR PDFs, BG check artifacts) and attaches them to the right record." },
  { name: "agent-financial-aggregator",      cadence: "Daily · 3am UTC",                                     last_run: "22h ago",result: "ok",      enabled: true, description: "Rolls Stripe + Checkr + MVR + D&A vendor charges into the daily Finance ledger." },
  { name: "agent-financial-dunning",         cadence: "Daily · 1pm UTC",                                     last_run: "12h ago",result: "ok",      enabled: true, description: "Dunning workflow for overdue customer invoices: reminder → escalation → service-pause warning." },
  { name: "agent-financial-monthly-close",   cadence: "Monthly · 1st · 5am UTC",                             last_run: "Never",  result: "never",   enabled: true, description: "Closes the prior month: tallies revenue, vendor pass-thru, overhead; locks the ledger; emails Joshua the close packet." },
  { name: "agent-fmcsa-outreach",            cadence: "Weekly · Mon–Fri · 2pm UTC",                          last_run: "Never",  result: "never",   enabled: true, description: "Sends the prospect outreach email (new-entrant-intro or conditional-help) Tue/Wed/Thu, capped 50/day." },
  { name: "agent-fmcsa-scraper",             cadence: "Weekly · Mon · 9am UTC",                              last_run: "Never",  result: "never",   enabled: true, description: "Pulls the FMCSA SAFER bulk census + Carrier Snapshot for the 5-state region (MI/OH/IN/IL/WI), filters to ICP, lands in fmcsa_prospects." },
  { name: "agent-ifta-quarterly-reminder",   cadence: "Daily · 1pm UTC",                                     last_run: "May 1",  result: "ok",      enabled: true, description: "30-day, 14-day, 7-day reminders before each IFTA filing deadline (Apr 30 / Jul 31 / Oct 31 / Jan 31)." },
  { name: "agent-inbox-triage",              cadence: "Every 15 minutes",                                    last_run: "4m ago", result: "ok",      enabled: true, description: "Triages incoming support@x3compass.com email: routes auto-replies, files driver-portal questions, escalates RED items to Joshua." },
  { name: "agent-keepalive",                 cadence: "Daily · 12pm UTC",                                    last_run: "Never",  result: "never",   enabled: true, description: "Heartbeat that pings every connected vendor (Stripe, Checkr, Anthropic, Supabase, Resend, Twilio) — sanity check that creds still work." },
  { name: "agent-monthly-client-report",     cadence: "Monthly · 1st · 6am UTC",                             last_run: "May 1",  result: "partial", enabled: true, description: "Generates each carrier's monthly compliance report PDF + emails the carrier admin. Partial = 2 carriers missing CarrierOk data." },
  { name: "agent-ops-sheet-mirror",          cadence: "Every 5 minutes",                                     last_run: "4m ago", result: "ok",      enabled: true, description: "Mirrors carrier/driver/alert/job counts from Supabase to the X3 Operations Google Sheet for cross-tool reporting." },
  { name: "agent-portfolio-brief",           cadence: "Daily · 10am UTC",                                    last_run: "15h ago",result: "ok",      enabled: true, description: "Generates the daily portfolio brief (across all carriers) and emails Joshua + Mike. Includes new alerts, churn risk, NPS." },
  { name: "agent-regulatory-scanner",        cadence: "Weekly · Mon · 9am UTC",                              last_run: "6d ago", result: "error",   enabled: true, description: "Scans FMCSA + eCFR + Federal Register for changes affecting our skills. ERROR: eCFR API rate limit since Mon — needs key rotation." },
  { name: "agent-topic-discovery",           cadence: "Weekly · Tue · 9am UTC",                              last_run: "5d ago", result: "error",   enabled: true, description: "Surfaces new skill topics from /api/ask logs + customer questions. ERROR: vector index quota hit — needs Pinecone upgrade." },
];

export const ONDEMAND_AGENTS: OnDemandAgent[] = [
  { name: "agent-csa-baseline",       trigger: "Queued inputs", last_run: "Apr 23", result: "ok", enabled: true, description: "Computes a carrier's CSA baseline (last 24mo of inspections + crashes) on initial onboarding. Triggers on new carrier signup." },
  { name: "agent-csa-monitor",        trigger: "Queued inputs", last_run: "Apr 23", result: "ok", enabled: true, description: "Watches SAFER + CarrierOk for any BASIC percentile crossing the carrier's threshold. Fires an alert + opens a DataQ workflow draft." },
  { name: "agent-dataq-drafter",      trigger: "Queued inputs", last_run: "1m ago", result: "ok", enabled: true, description: "Drafts the FMCSA DataQ challenge form when a non-preventable accident or wrongly-attributed violation is flagged. Joshua signs off before submission." },
  { name: "agent-research-topic",     trigger: "Queued inputs", last_run: "1m ago", result: "ok", enabled: true, description: "Researches a new compliance topic surfaced by topic-discovery: pulls CFR sections, FMCSA guidance memos, case law. Produces a markdown brief." },
  { name: "agent-synthesize-form",    trigger: "Queued inputs", last_run: "1m ago", result: "ok", enabled: true, description: "Generates a new auto-fillable FCRA/CFR-anchored form template from the research-topic output. Lands in /app/forms once Joshua approves." },
  { name: "agent-synthesize-training",trigger: "Queued inputs", last_run: "1m ago", result: "ok", enabled: true, description: "Generates a new ELDT-style training module (markdown + quiz) from the research-topic output. Lands in /app/training catalog." },
];

export const STUB_AGENTS: AgentStub[] = [
  { name: "agent-onboarding-concierge", reason: "STUB — needs auth trigger wiring. Will run on every new carrier signup to walk them through the 5-step onboarding checklist via in-app + email." },
];

export const ADMIN_KPIS = {
  agents_active: 25,
  agents_total: 26,
  agents_stubs: 1,
  runs_24h: 1000,
  runs_ok: 851,
  runs_err: 1,
  runs_other: 148,
  open_alerts: 168,
  open_blocker: 12,
  open_urgent: 126,
  last_close: "Pending",
  last_close_next: "1st of month 1am ET",
};

export type CarrierPref = { name: string; dot: string; mode: "Realtime" | "Digest"; send_hour: string; monthly: boolean; reg: boolean; qbr: boolean; expiry: boolean; csa: boolean; ifta: boolean; inspect: boolean };

export const CARRIER_PREFS: CarrierPref[] = [
  { name: "DEMO · Apex",                dot: "8001247", mode: "Digest",   send_hour: "8am", monthly: true,  reg: true,  qbr: true,  expiry: true,  csa: true,  ifta: true,  inspect: true  },
  { name: "DEMO · Beacon",              dot: "8002520", mode: "Realtime", send_hour: "8am", monthly: true,  reg: true,  qbr: true,  expiry: true,  csa: true,  ifta: true,  inspect: true  },
  { name: "BigRigSafety",               dot: "1234567", mode: "Realtime", send_hour: "8am", monthly: true,  reg: true,  qbr: true,  expiry: true,  csa: true,  ifta: true,  inspect: true  },
  { name: "DEMO · Cascade",             dot: "8003724", mode: "Realtime", send_hour: "8am", monthly: true,  reg: true,  qbr: true,  expiry: true,  csa: true,  ifta: true,  inspect: true  },
  { name: "DEMO · Delta",               dot: "8004949", mode: "Realtime", send_hour: "8am", monthly: true,  reg: true,  qbr: true,  expiry: true,  csa: true,  ifta: true,  inspect: true  },
  { name: "Domino's Pizza Distribution LLC", dot: "202173", mode: "Realtime", send_hour: "8am", monthly: true,  reg: true,  qbr: true,  expiry: true,  csa: true,  ifta: true,  inspect: true  },
  { name: "DEMO · Echo",                dot: "8005611", mode: "Realtime", send_hour: "9am", monthly: true,  reg: true,  qbr: true,  expiry: true,  csa: true,  ifta: false, inspect: true  },
  { name: "DEMO · Foxtrot",             dot: "8006284", mode: "Digest",   send_hour: "7am", monthly: true,  reg: true,  qbr: false, expiry: true,  csa: true,  ifta: true,  inspect: true  },
];

export type ActivityRow = { when: string; agent: string; status: "ok" | "skipped" | "error" | "partial"; duration: string; summary: string };

export const ACTIVITY_LOG: ActivityRow[] = [
  { when: "5/17/2026, 9:20:01 PM", agent: "agent-ops-sheet-mirror",     status: "ok",      duration:  "6.3s", summary: "Mirrored 28 carriers, 1000 drivers, 168 alerts, 200 jobs to X3 Operations sheet." },
  { when: "5/17/2026, 9:20:00 PM", agent: "agent-driver-doc-ingest",    status: "skipped", duration: "15.3s", summary: "No new documents in any carrier's Drive inbox." },
  { when: "5/17/2026, 9:20:00 PM", agent: "agent-synthesize-form",      status: "ok",      duration:  "0.0s", summary: "Nothing queued." },
  { when: "5/17/2026, 9:20:00 PM", agent: "agent-dataq-drafter",        status: "ok",      duration:  "0.0s", summary: "Nothing queued." },
  { when: "5/17/2026, 9:20:00 PM", agent: "agent-research-topic",       status: "ok",      duration:  "0.1s", summary: "Nothing queued." },
  { when: "5/17/2026, 9:20:00 PM", agent: "agent-synthesize-training",  status: "ok",      duration:  "0.1s", summary: "Nothing queued." },
  { when: "5/17/2026, 9:18:00 PM", agent: "agent-dataq-drafter",        status: "ok",      duration:  "0.1s", summary: "Nothing queued." },
  { when: "5/17/2026, 9:18:00 PM", agent: "agent-research-topic",       status: "ok",      duration:  "0.1s", summary: "Nothing queued." },
  { when: "5/17/2026, 9:15:00 PM", agent: "agent-ops-sheet-mirror",     status: "ok",      duration:  "5.9s", summary: "Mirrored 28 carriers, 1000 drivers, 167 alerts, 199 jobs." },
  { when: "5/17/2026, 9:15:00 PM", agent: "agent-inbox-triage",         status: "ok",      duration:  "2.1s", summary: "Triaged 4 inbound emails: 2 auto-replied · 1 routed to driver portal · 1 escalated." },
  { when: "5/17/2026, 9:10:00 PM", agent: "agent-driver-doc-ingest",    status: "skipped", duration: "14.8s", summary: "No new documents in any carrier's Drive inbox." },
  { when: "5/17/2026, 9:05:00 PM", agent: "agent-ops-sheet-mirror",     status: "ok",      duration:  "6.1s", summary: "Mirrored 28 carriers, 1000 drivers, 167 alerts, 198 jobs." },
  { when: "5/17/2026, 9:00:00 PM", agent: "agent-email-result-catcher", status: "ok",      duration:  "1.2s", summary: "Polled 28 inboxes. 0 new vendor results." },
  { when: "5/17/2026, 9:00:00 PM", agent: "agent-driver-doc-ingest",    status: "skipped", duration: "14.6s", summary: "No new documents." },
  { when: "5/17/2026, 8:50:00 PM", agent: "agent-driver-doc-ingest",    status: "skipped", duration: "15.1s", summary: "No new documents." },
];
