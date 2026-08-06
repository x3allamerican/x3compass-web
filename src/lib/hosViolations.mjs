// 49 CFR Part 395 — Hours of Service violation engine (property-carrying CMV, federal).
// Deterministic, limit-based checks from a daily log row. Where a check needs a full
// duty-status timeline (e.g. 30-min break placement), we only flag when the data is present.
export const HOS_LIMITS = { drive_min: 660, duty_window_min: 840, break_after_drive_min: 480, cycle_70_8: 70, cycle_60_7: 60 };
const n = (v) => (v == null || v === "" ? 0 : (typeof v === "number" ? v : parseFloat(v))) || 0;

export function computeHosViolations(row) {
  const drive = n(row.drive_min ?? row.total_drive_minutes);
  const duty = n(row.on_duty_min ?? row.total_on_duty_minutes);
  const cycleHrs = n(row.hours_70_8 ?? row.hours_cycle);
  const cycle = String(row.cycle || "70_8");
  const breakMin = row.break_min == null ? null : n(row.break_min);
  const cycleCap = cycle === "60_7" ? HOS_LIMITS.cycle_60_7 : HOS_LIMITS.cycle_70_8;
  const v = [];
  if (drive > HOS_LIMITS.drive_min)
    v.push({ code: "395.3(a)(1)", rule: "11-hour driving limit", severity: "critical", detail: `Drove ${(drive/60).toFixed(1)} h (limit 11 h).`, over_by_min: drive - HOS_LIMITS.drive_min });
  if (duty > HOS_LIMITS.duty_window_min)
    v.push({ code: "395.3(a)(2)", rule: "14-hour on-duty window", severity: "critical", detail: `On duty ${(duty/60).toFixed(1)} h (window 14 h).`, over_by_min: duty - HOS_LIMITS.duty_window_min });
  if (drive > HOS_LIMITS.break_after_drive_min && breakMin != null && breakMin < 30)
    v.push({ code: "395.3(a)(3)", rule: "30-minute break", severity: "serious", detail: `${(drive/60).toFixed(1)} h driving with only ${breakMin} min break (need 30 after 8 h).` });
  if (cycleHrs > cycleCap)
    v.push({ code: cycle === "60_7" ? "395.3(c)(1)" : "395.3(c)(2)", rule: `${cycleCap}-hour cycle`, severity: "critical", detail: `Cycle at ${cycleHrs.toFixed(1)} h (cap ${cycleCap} h).`, over_by_min: Math.round((cycleHrs-cycleCap)*60) });
  const atRisk = v.length === 0 && (drive >= HOS_LIMITS.drive_min*0.9 || duty >= HOS_LIMITS.duty_window_min*0.9 || cycleHrs >= cycleCap*0.9);
  const worst = v.some((x) => x.severity === "critical") ? "critical" : v.length ? "serious" : atRisk ? "at_risk" : "ok";
  return { violations: v, at_risk: atRisk, worst_severity: worst };
}

export function toHosLogRecord(row) {
  const driveMin = Math.round(n(row.drive_min ?? row.total_drive_minutes));
  const dutyMin = Math.round(n(row.on_duty_min ?? row.total_on_duty_minutes));
  const cyc = n(row.hours_70_8 ?? row.hours_cycle);
  const { violations, worst_severity } = computeHosViolations(row);
  return {
    driver_id: String(row.driver_id || "").trim(),
    log_date: String(row.log_date || "").trim(),
    total_drive_minutes: driveMin,
    total_on_duty_minutes: dutyMin,
    hours_70_8: cyc || null,
    violations, worst_severity,
    eld_source: (row.eld_source ? String(row.eld_source).trim() : "csv-import"),
    certified: String(row.certified).toLowerCase() === "true" || row.certified === true,
  };
}
