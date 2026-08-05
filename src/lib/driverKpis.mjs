const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;
const DAY_MS = 86_400_000;

function requireCalendarDate(value) {
  const parsed = typeof value === "string" && ISO_DATE.test(value) ? new Date(`${value}T00:00:00Z`) : null;
  if (!parsed || Number.isNaN(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== value) {
    throw new TypeError("buildDriverKpis asOf must be a valid YYYY-MM-DD calendar date");
  }
  return parsed;
}

/**
 * @param {Array<{
 *   status: string,
 *   hire_date: string | null,
 *   created_at: string,
 *   termination_date: string | null,
 *   cdl_expires_on: string | null,
 *   medical_card_expires_on: string | null
 * }>} drivers
 * @param {string} asOf
 */
export function buildDriverKpis(drivers, asOf) {
  const asOfDate = requireCalendarDate(asOf);
  const in30 = new Date(asOfDate.getTime() + 30 * DAY_MS).toISOString().slice(0, 10);
  const inactiveCutoff = new Date(asOfDate.getTime() - 90 * DAY_MS).toISOString().slice(0, 10);
  const monthStart = `${asOf.slice(0, 8)}01`;
  let active = 0;
  let pending = 0;
  let newThisMonth = 0;
  let inactiveTerminated90 = 0;
  let cdlExp30 = 0;
  let medExp30 = 0;

  for (const driver of drivers) {
    if (driver.status === "active") active += 1;
    if (driver.status === "pending_hire") pending += 1;
    const joinedOn = driver.hire_date || driver.created_at.slice(0, 10);
    if (joinedOn >= monthStart && joinedOn <= asOf) newThisMonth += 1;
    if (["inactive", "terminated"].includes(driver.status) && driver.termination_date && driver.termination_date >= inactiveCutoff && driver.termination_date <= asOf) inactiveTerminated90 += 1;
    if (driver.cdl_expires_on && driver.cdl_expires_on >= asOf && driver.cdl_expires_on <= in30) cdlExp30 += 1;
    if (driver.medical_card_expires_on && driver.medical_card_expires_on >= asOf && driver.medical_card_expires_on <= in30) medExp30 += 1;
  }

  return { active, pending, newThisMonth, inactiveTerminated90, cdlExp30, medExp30 };
}
