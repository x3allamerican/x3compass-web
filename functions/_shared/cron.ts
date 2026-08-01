/**
 * Tiny cron-expression "next run" calculator. Handles the cron formats we use:
 *   - "*\/N * * * *"     every N minutes
 *   - "0 H * * *"       daily at hour H
 *   - "M H * * *"       daily at H:M
 *   - "0 H * * D"       weekly on day D (0=Sun..6=Sat)
 *   - "0 H * * D1-D5"   weekly on day range
 *   - "0 H D * *"       monthly on day D
 *   - "0 H D M1,M2,M3 *" specific months
 *
 * Returns null for expressions outside this subset. All times are UTC.
 *
 * This is a deliberate subset — not a full cron parser. The X3 agents all use
 * one of these patterns. If you add an agent with a more exotic schedule,
 * extend this parser or just hardcode its cron_expr to compute next-run
 * elsewhere.
 */
export function computeNextRun(expr: string, from = new Date()): Date | null {
  const parts = expr.trim().split(/\s+/);
  if (parts.length !== 5) return null;
  const [m, h, dom, mon, dow] = parts;
  const next = new Date(from);
  next.setUTCSeconds(0, 0);

  // Every N minutes: "*/N * * * *"
  if (/^\*\/\d+$/.test(m) && h === "*" && dom === "*" && mon === "*" && dow === "*") {
    const n = parseInt(m.slice(2), 10);
    const cur = next.getUTCMinutes();
    const add = n - (cur % n);
    next.setUTCMinutes(cur + add);
    return next;
  }

  // Daily at exact H:M (m and h both numeric, rest *)
  if (/^\d+$/.test(m) && /^\d+$/.test(h) && dom === "*" && mon === "*" && dow === "*") {
    next.setUTCHours(parseInt(h, 10), parseInt(m, 10), 0, 0);
    if (next <= from) next.setUTCDate(next.getUTCDate() + 1);
    return next;
  }

  // Weekly on day(s): "0 H * * D" or "0 H * * D1-D2"
  if (/^\d+$/.test(m) && /^\d+$/.test(h) && dom === "*" && mon === "*" && /^[\d,\-]+$/.test(dow)) {
    const days = expandList(dow);
    for (let i = 0; i < 14; i++) {
      const c = new Date(next); c.setUTCDate(c.getUTCDate() + i); c.setUTCHours(parseInt(h, 10), parseInt(m, 10), 0, 0);
      if (c > from && days.includes(c.getUTCDay())) return c;
    }
    return null;
  }

  // Monthly on specific day: "0 H D * *" or month-restricted: "0 H D M1,M2,M3 *"
  if (/^\d+$/.test(m) && /^\d+$/.test(h) && /^\d+$/.test(dom) && /^[\d,\*]+$/.test(mon) && dow === "*") {
    const D = parseInt(dom, 10);
    const months = mon === "*" ? null : expandList(mon).map((x) => x - 1); // 0..11
    for (let i = 0; i < 366; i++) {
      const c = new Date(next); c.setUTCDate(c.getUTCDate() + i); c.setUTCHours(parseInt(h, 10), parseInt(m, 10), 0, 0);
      if (c <= from) continue;
      if (c.getUTCDate() !== D) continue;
      if (months && !months.includes(c.getUTCMonth())) continue;
      return c;
    }
    return null;
  }

  return null;
}

function expandList(s: string): number[] {
  const out: number[] = [];
  for (const tok of s.split(",")) {
    const m = tok.match(/^(\d+)-(\d+)$/);
    if (m) for (let i = parseInt(m[1], 10); i <= parseInt(m[2], 10); i++) out.push(i);
    else out.push(parseInt(tok, 10));
  }
  return out;
}
