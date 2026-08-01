/**
 * Single source of truth for X3 Compass pricing.
 *
 * Canon set by founder 2026-07-31: ONE plan, graduated per-driver.
 * Every X3 product is included — there is no DIY/DFY split any more.
 *
 * GRADUATED (marginal), not flat: each band applies only to the drivers that
 * fall inside it, the same way tax brackets work. A 100-driver fleet pays
 * 50x$50 + 25x$40 + 25x$30 = $4,250 — NOT 100x$30.
 *
 * IMPORTANT: import from this module. Do not hardcode prices in pages.
 * The previous version of this file also called itself canon, but nothing
 * imported it — and the homepage, /pricing, and the in-app billing tab drifted
 * to four different price structures. That drift is the bug this file exists
 * to prevent.
 */

export type Band = {
  /** first driver number in this band (1-indexed, inclusive) */
  from: number;
  /** last driver number in this band (inclusive); null = unbounded */
  to: number | null;
  /** $ per driver / month for drivers inside this band */
  rate: number;
  /** human label for pricing tables */
  label: string;
};

export const BANDS: Band[] = [
  { from: 1,   to: 50,   rate: 50, label: "Drivers 1–50" },
  { from: 51,  to: 75,   rate: 40, label: "Drivers 51–75" },
  { from: 76,  to: 100,  rate: 30, label: "Drivers 76–100" },
  { from: 101, to: null, rate: 25, label: "Drivers 101+" },
];

/** Monthly floor. A 1-driver carrier pays the minimum, not $50. */
export const MONTHLY_MINIMUM = 100;

/** Rate the *next* driver added would be billed at. */
export function marginalRate(driverCount: number): number {
  const n = Math.max(1, Math.floor(driverCount));
  const band = BANDS.find((b) => n >= b.from && (b.to === null || n <= b.to));
  return band ? band.rate : BANDS[BANDS.length - 1].rate;
}

/** Graduated monthly total, before tax and before any add-ons. */
export function monthlyFor(driverCount: number): number {
  const n = Math.max(0, Math.floor(driverCount));
  if (n === 0) return 0;

  let total = 0;
  for (const b of BANDS) {
    if (n < b.from) break;
    const upper = b.to === null ? n : Math.min(n, b.to);
    total += (upper - b.from + 1) * b.rate;
  }
  return Math.max(total, MONTHLY_MINIMUM);
}

/** Blended $/driver — what the customer actually feels. */
export function effectiveRate(driverCount: number): number {
  const n = Math.max(1, Math.floor(driverCount));
  return monthlyFor(n) / n;
}

/** Per-band breakdown for "show your work" pricing tables and invoices. */
export function breakdown(driverCount: number): Array<{
  label: string;
  drivers: number;
  rate: number;
  subtotal: number;
}> {
  const n = Math.max(0, Math.floor(driverCount));
  const rows: Array<{ label: string; drivers: number; rate: number; subtotal: number }> = [];
  for (const b of BANDS) {
    if (n < b.from) break;
    const upper = b.to === null ? n : Math.min(n, b.to);
    const count = upper - b.from + 1;
    rows.push({ label: b.label, drivers: count, rate: b.rate, subtotal: count * b.rate });
  }
  return rows;
}

export const PLAN = {
  name: "X3 Compass",
  tagline: "Every X3 product included",
  billing: "Graduated per-driver · billed monthly",
  trialDays: 7,
  trialRequiresCard: false,
} as const;

/**
 * Hazmat is INCLUDED in the plan as of 2026-07-31.
 *
 * There is no longer a $99/mo Hazmat add-on. "Every X3 product included"
 * means every product — the Hazmat Center ships with the plan at every
 * fleet size. Kept as a named export so any surface that still wants to
 * merchandise the capability can do so without reintroducing a price.
 */
export const HAZMAT = {
  name: "Hazmat Center",
  included: true,
  features: [
    "100+ hazmat-specific skills (Parts 100-180)",
    "Interactive placard wizard with live preview",
    "Shipping paper template builder",
    "Emergency response info (ERG) lookups",
    "Hazardous waste manifest mode",
    "PHMSA registration cross-reference",
  ],
} as const;

/** Formatting helper so every surface renders money identically. */
export function usd(n: number): string {
  return `$${n.toLocaleString("en-US", { maximumFractionDigits: 0 })}`;
}
