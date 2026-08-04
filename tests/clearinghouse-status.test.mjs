import assert from "node:assert/strict";
import test from "node:test";
import { buildClearinghouseStatus } from "../src/lib/clearinghouseStatus.mjs";

const drivers = [
  { id: "d1", first_name: "Ada", last_name: "Lovelace", status: "active", hire_date: "2024-01-01" },
  { id: "d2", first_name: "Grace", last_name: "Hopper", status: "active", hire_date: "2024-01-01" },
  { id: "d3", first_name: "Katherine", last_name: "Johnson", status: "active", hire_date: "2024-01-01" },
  { id: "d4", first_name: "Edsger", last_name: "Dijkstra", status: "pending_hire", hire_date: "2026-09-01" },
];

test("computes grounded annual due states and accepts full queries as annual coverage", () => {
  const result = buildClearinghouseStatus({ asOf: "2026-08-04", drivers, queries: [
    { driver_id: "d1", query_type: "annual_limited", query_run_at: "2025-08-04", result: "no_information" },
    { driver_id: "d2", query_type: "pre_employment_full", query_run_at: "2025-01-01", result: "no_information" },
    { driver_id: "d4", query_type: "pre_employment_full", query_run_at: "2026-08-01", result: "no_information" },
  ], consents: [], violations: [] });
  assert.deepEqual(result.drivers.map(({ driverId, annualStatus, annualDueOn, preEmploymentFull }) => ({ driverId, annualStatus, annualDueOn, preEmploymentFull })), [
    { driverId: "d1", annualStatus: "due", annualDueOn: "2026-08-04", preEmploymentFull: "missing_evidence" },
    { driverId: "d2", annualStatus: "overdue", annualDueOn: "2026-01-01", preEmploymentFull: "recorded" },
    { driverId: "d3", annualStatus: "missing_evidence", annualDueOn: null, preEmploymentFull: "missing_evidence" },
    { driverId: "d4", annualStatus: "current", annualDueOn: "2027-08-01", preEmploymentFull: "recorded" },
  ]);
  assert.deepEqual(result.summary, { totalDrivers: 4, current: 1, due: 1, overdue: 1, missingEvidence: 1, prohibitedStatusRecorded: 0 });
});

test("uses inclusive 30-day due boundary and clamps leap-day anniversaries", () => {
  const result = buildClearinghouseStatus({ asOf: "2025-01-29", drivers: drivers.slice(0, 2), queries: [
    { driver_id: "d1", query_type: "annual_limited", query_run_at: "2024-02-29", result: "no_information" },
    { driver_id: "d2", query_type: "annual_limited", query_run_at: "2024-03-01", result: "no_information" },
  ], consents: [], violations: [] });
  assert.deepEqual(result.drivers.map((row) => [row.annualDueOn, row.annualStatus]), [["2025-02-28", "due"], ["2025-03-01", "current"]]);
});

test("derives consent and prohibited flags only from recorded evidence", () => {
  const result = buildClearinghouseStatus({ asOf: "2026-08-04", drivers, queries: [], consents: [
    { driver_id: "d1", consent_requested_at: "2026-01-01", consent_received_at: "2026-01-02", consent_expires_on: "2027-01-02", consent_revoked_at: null },
    { driver_id: "d2", consent_requested_at: "2025-01-01", consent_received_at: "2025-01-02", consent_expires_on: "2026-01-02", consent_revoked_at: null },
    { driver_id: "d3", consent_requested_at: "2026-01-01", consent_received_at: null, consent_expires_on: null, consent_revoked_at: "2026-02-01" },
  ], violations: [{ driver_id: "d2", prohibited_status_active: true }] });
  assert.deepEqual(result.drivers.map((row) => [row.driverId, row.consentStatus, row.prohibitedStatusRecorded]), [
    ["d1", "received", false], ["d2", "expired", true], ["d3", "revoked", false], ["d4", "not_recorded", false],
  ]);
  assert.match(result.guardrail, /human review/i);
  assert.match(result.citations.join(" "), /382\.701/);
});

test("rejects malformed as-of dates and ignores pending/error queries as completion evidence", () => {
  assert.throws(() => buildClearinghouseStatus({ asOf: "2026-02-30", drivers: [], queries: [], consents: [], violations: [] }), /asOf/);
  const result = buildClearinghouseStatus({ asOf: "2026-08-04", drivers: drivers.slice(0, 1), queries: [
    { driver_id: "d1", query_type: "annual_limited", query_run_at: "2026-01-01", result: "pending" },
    { driver_id: "d1", query_type: "annual_limited", query_run_at: "2026-02-01", result: "error" },
  ], consents: [], violations: [] });
  assert.equal(result.drivers[0].annualStatus, "missing_evidence");
});
