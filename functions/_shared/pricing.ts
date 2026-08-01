// Graduated pricing for Pages Functions. Mirror of src/lib/pricing.ts BANDS.
// ONE plan — no DIY/DFY. Keep in sync with src/lib/pricing.ts.
const BANDS: Array<{ from: number; to: number | null; rate: number }> = [
  { from: 1, to: 50, rate: 50 },
  { from: 51, to: 75, rate: 40 },
  { from: 76, to: 100, rate: 30 },
  { from: 101, to: null, rate: 25 },
];
const MONTHLY_MINIMUM = 100;
export const SERVICE_TIER = "compass";

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
export function monthlyCents(driverCount: number): number { return monthlyFor(driverCount) * 100; }
