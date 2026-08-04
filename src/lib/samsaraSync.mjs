const text = (value, max=200) => typeof value === "string" && value.trim() ? value.trim().slice(0,max) : null;
const number = (value) => Number.isFinite(Number(value)) ? Number(value) : null;

export function nextCursor(payload) {
  return payload?.pagination?.hasNextPage === true && text(payload?.pagination?.endCursor, 500) ? payload.pagination.endCursor : null;
}

export function mapSamsaraDrivers(rows) {
  return (Array.isArray(rows) ? rows : []).flatMap((row) => {
    const id = text(row?.id, 160); const name = text(row?.name, 240);
    if (!id || !name || row?.driverActivationStatus === "deactivated") return [];
    const parts = name.split(/\s+/).filter(Boolean);
    if (parts.length < 2) return [];
    return [{ source_vendor:"samsara", source_id:id, first_name:parts[0], last_name:parts.slice(1).join(" "), email:text(row?.email,320), phone:text(row?.phone,40), status:"active" }];
  });
}

export function mapSamsaraDailyLogs(rows) {
  return (Array.isArray(rows) ? rows : []).flatMap((row) => {
    const driverId = text(row?.driver?.id || row?.driverId, 160);
    const start = text(row?.startTime || row?.startDate, 40);
    const date = start && /^\d{4}-\d{2}-\d{2}/.test(start) ? start.slice(0,10) : null;
    if (!driverId || !date) return [];
    const durations = row?.dutyStatusDurations && typeof row.dutyStatusDurations === "object" ? row.dutyStatusDurations : {};
    const driveMs = number(durations.driveDurationMs); const onDutyMs = number(durations.onDutyDurationMs);
    const meters = number(row?.distanceTraveledMeters);
    return [{ source_vendor:"samsara", source_id:`${driverId}:${date}`, source_driver_id:driverId, log_date:date, total_drive_minutes:driveMs == null ? null : Math.round(driveMs/60000), total_on_duty_minutes:onDutyMs == null ? null : Math.round(onDutyMs/60000), distance_miles:meters == null ? null : Math.round((meters/1609.344)*100)/100, eld_source:"samsara", certified:Boolean(text(row?.logCertifiedAtTime,40)), violations:Array.isArray(row?.violations) ? row.violations : [] }];
  });
}
