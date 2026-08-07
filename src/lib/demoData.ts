/**
 * demoData.ts · fallback dashboard data shown when /api/dashboard returns no real data.
 * Used by src/app/page.tsx as the static demo state for the Compliance Command Center.
 *
 * Shape mirrors the ApiData type expected by the dashboard page.
 */

export const DEMO_CARRIER = {
  name: "Acme Trucking LLC",
  dot_number: "1234567",
  mc_number: "MC-987654",
  service_tier: "Pro",
  power_units: 28,
  drivers: 32,
  hazmat: false,
  safety_rating: "Satisfactory",
  rating_date: "2024-09-12",
  rating_type: "Compliance Review",
  csa_alerts: 2,
  last_inspection_at: "2026-04-18",
  annual_miles: 1_850_000,
  reported_drivers: 32,
  reported_power_units: 28,
};

export const DEMO_FLEET = {
  total_drivers: 32,
  active_drivers: 30,
  drivers_on_roster: 32,
  total_vehicles: 28,
  active_vehicles: 27,
  out_of_service: 1,
  inspections_30d: 14,
  violations_30d: 3,
  accidents_12mo: 1,

  // Compliance
  compliance_pct: 87,
  dq_score_pct: 94,
  dq_docs_present: 480,
  dq_docs_total: 512,
  mecs_expiring_30d: 3,
  mecs_expiring_60d: 5,
  cdls_expired: 1,

  // Alerts
  open_alerts: 14,
  open_alerts_urgent: 4,

  // Vehicle types
  power_units: 28,
  tractors: 22,
  trailers: 41,
  straight_trucks: 6,

  // CSA / OOS
  driver_oos_rate_pct: 3.1,
  driver_oos_national_pct: 5.5,
  vehicle_oos_rate_pct: 14.2,
  vehicle_oos_national_pct: 20.7,
  crashes_12mo: 1,
  crashes_24mo: 2,

  // Insurance
  bipd_insurance: "$1,000,000",
  cargo_insurance: "$100,000",
};

export const COMPLIANCE_BARS = [
  { label: "DQ Files",       pct: 94, total: 32, done: 30, color: "emerald" },
  { label: "MVRs current",   pct: 87, total: 32, done: 28, color: "cyan"    },
  { label: "Medical cards",  pct: 91, total: 32, done: 29, color: "amber"   },
  { label: "Drug & Alcohol", pct: 100,total: 32, done: 32, color: "violet"  },
  { label: "Training",       pct: 81, total: 32, done: 26, color: "rose"    },
  { label: "HOS logs",       pct: 96, total: 30, done: 29, color: "slate"   },
];

export const CSA_BASICS = [
  { basic: "Unsafe Driving",       pct: 42, threshold: 65, status: "ok"    },
  { basic: "Hours of Service",     pct: 38, threshold: 65, status: "ok"    },
  { basic: "Driver Fitness",       pct: 71, threshold: 80, status: "watch" },
  { basic: "Controlled Substances",pct: 12, threshold: 80, status: "ok"    },
  { basic: "Vehicle Maintenance",  pct: 58, threshold: 80, status: "ok"    },
  { basic: "Hazmat",               pct: 0,  threshold: 80, status: "n/a"   },
  { basic: "Crash Indicator",      pct: 29, threshold: 65, status: "ok"    },
];

/**
 * ACTION_ITEMS · each key is a section name; value is a card with title, CFR ref,
 * a list of items (driver/vehicle with status), and a call-to-action link.
 */
export type ActionItem = {
  who: string;
  meta: string;
  status: string;
  statusKind: "overdue" | "warn";
};

export type ActionCard = {
  title: string;
  cfr: string;
  items: ActionItem[];
  cta: { href: string; label: string };
};

export const ACTION_ITEMS: Record<string, ActionCard> = {
  medical: {
    title: "Renew expiring medical cards",
    cfr: "§ 391.43",
    items: [
      { who: "Mike Davis",   meta: "Expires Mar 12",  status: "OVERDUE",  statusKind: "overdue" },
      { who: "Sarah Lopez",  meta: "Expires Mar 28",  status: "16 DAYS",  statusKind: "warn"    },
      { who: "James Patel",  meta: "Expires Apr 04",  status: "23 DAYS",  statusKind: "warn"    },
    ],
    cta: { href: "/drivers", label: "Open Drivers →" },
  },
  mvr: {
    title: "Schedule annual MVRs",
    cfr: "§ 391.25",
    items: [
      { who: "Carlos Reyes", meta: "Last MVR Apr 2025", status: "OVERDUE", statusKind: "overdue" },
      { who: "Tina Brooks",  meta: "Due in 11 days",    status: "11 DAYS", statusKind: "warn"    },
    ],
    cta: { href: "/mvr", label: "Open MVR Tracker →" },
  },
  dq: {
    title: "Complete pending DQ files",
    cfr: "§ 391.51",
    items: [
      { who: "John Smith",  meta: "Missing PSP",       status: "ACTION",  statusKind: "warn" },
      { who: "Lee Johnson", meta: "Missing road test", status: "ACTION",  statusKind: "warn" },
    ],
    cta: { href: "/dq-files", label: "Open DQ Files →" },
  },
  vehicle: {
    title: "Address open vehicle defects",
    cfr: "§ 396.11",
    items: [
      { who: "Unit 217 (Volvo VNL)", meta: "Brake light DVIR", status: "OPEN", statusKind: "warn" },
    ],
    cta: { href: "/vehicles", label: "Open Vehicles →" },
  },
};
