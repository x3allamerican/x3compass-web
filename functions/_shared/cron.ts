// Cron helpers — minimal scheduler utilities.
// computeNextRun: given a cron expression and a reference date, returns the next firing.
//
// v1: supports the common patterns ("0 6 * * *", "*/15 * * * *", "0 */4 * * *",
//     "0 0 * * MON", "0 9 1 * *"). For exotic ranges, install `cron-parser`
//     and swap this implementation.

const MONTHS: Record<string, number> = {
  jan: 1, feb: 2, mar: 3, apr: 4, may: 5, jun: 6,
  jul: 7, aug: 8, sep: 9, oct: 10, nov: 11, dec: 12,
};
const DAYS: Record<string, number> = {
  sun: 0, mon: 1, tue: 2, wed: 3, thu: 4, fri: 5, sat: 6,
};

function expand(field: string, lo: number, hi: number): Set<number> {
  const out = new Set<number>();
  for (const part of field.split(",")) {
    if (part === "*") {
      for (let i = lo; i <= hi; i++) out.add(i);
      continue;
    }
    const stepMatch = part.match(/^(.+)\/(\d+)$/);
    const step = stepMatch ? Number(stepMatch[2]) : 1;
    const range = stepMatch ? stepMatch[1] : part;
    let a = lo, b = hi;
    if (range === "*") { /* keep defaults */ }
    else if (range.includes("-")) { const [x, y] = range.split("-"); a = Number(x); b = Number(y); }
    else { a = b = Number(range); }
    for (let i = a; i <= b; i += step) out.add(i);
  }
  return out;
}

export function computeNextRun(cronExpr: string, from: Date = new Date()): Date {
  const parts = cronExpr.trim().split(/\s+/);
  if (parts.length !== 5) throw new Error(`Invalid cron expression: ${cronExpr}`);
  const [minF, hourF, domF, monF, dowF] = parts;
  // Normalize month/day names
  const normMon = monF.toLowerCase().replace(/(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)/g, m => String(MONTHS[m]));
  const normDow = dowF.toLowerCase().replace(/(sun|mon|tue|wed|thu|fri|sat)/g, m => String(DAYS[m]));

  const mins = expand(minF, 0, 59);
  const hrs  = expand(hourF, 0, 23);
  const doms = expand(domF, 1, 31);
  const mons = expand(normMon, 1, 12);
  const dows = expand(normDow, 0, 6);

  const next = new Date(from.getTime() + 60_000);
  next.setSeconds(0, 0);
  for (let safety = 0; safety < 60 * 24 * 366 * 2; safety++) {
    if (mons.has(next.getMonth() + 1) && doms.has(next.getDate()) && dows.has(next.getDay())
        && hrs.has(next.getHours()) && mins.has(next.getMinutes())) {
      return next;
    }
    next.setMinutes(next.getMinutes() + 1);
  }
  throw new Error(`No matching time found for cron: ${cronExpr}`);
}
