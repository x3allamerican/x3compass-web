export const CSA_BASICS = [
  { key: "unsafe_driving", label: "Unsafe Driving", threshold: 65 },
  { key: "crash_indicator", label: "Crash Indicator", threshold: 65 },
  { key: "hos_compliance", label: "HOS Compliance", threshold: 65 },
  { key: "vehicle_maint", label: "Vehicle Maintenance", threshold: 80 },
  { key: "hazmat", label: "Hazardous Materials", threshold: 80 },
  { key: "driver_fitness", label: "Driver Fitness", threshold: 80 },
  { key: "ctrl_substances", label: "Controlled Substances", threshold: 80 },
];

function percentile(value) {
  if (value === null || value === undefined || value === "") return null;
  const number = Number(value);
  return Number.isFinite(number) ? Math.max(0, Math.min(100, number)) : null;
}

export function buildCsaScorecards(snapshots) {
  if (!Array.isArray(snapshots) || snapshots.length === 0) return [];
  const ordered = [...snapshots].sort((a, b) => String(a.taken_at).localeCompare(String(b.taken_at)));
  return CSA_BASICS.map((basic) => {
    const history = ordered.map((snapshot) => percentile(snapshot[basic.key])).filter((value) => value !== null);
    const value = percentile(ordered.at(-1)?.[basic.key]);
    const previous = ordered.length > 1 ? percentile(ordered.at(-2)?.[basic.key]) : null;
    const delta = value !== null && previous !== null ? Math.round((value - previous) * 10) / 10 : null;
    return {
      ...basic,
      value,
      state: value === null ? "unknown" : value >= basic.threshold ? "alert" : value >= basic.threshold * 0.75 ? "watch" : "below",
      delta,
      direction: delta === null || delta === 0 ? "flat" : delta > 0 ? "worsening" : "improving",
      history,
    };
  });
}
