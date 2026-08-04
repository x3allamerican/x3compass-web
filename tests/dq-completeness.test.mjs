import assert from "node:assert/strict";
import test from "node:test";
import { dqDocumentStatus, recomputeDqCompleteness } from "../src/lib/dqCompleteness.mjs";

const requirements = [
  { key: "application", alwaysRequired: true },
  { key: "medical", alwaysRequired: true },
  { key: "eldt", alwaysRequired: false },
];

test("DQ status uses inclusive 30-day boundaries and separates expired documents", () => {
  const today = "2026-08-04";
  assert.equal(dqDocumentStatus(undefined, today), "missing");
  assert.equal(dqDocumentStatus({ status: "complete", expires_date: "2026-08-03" }, today), "expired");
  assert.equal(dqDocumentStatus({ status: "complete", expires_date: "2026-08-04" }, today), "expiring");
  assert.equal(dqDocumentStatus({ status: "complete", expires_date: "2026-09-03" }, today), "expiring");
  assert.equal(dqDocumentStatus({ status: "complete", expires_date: "2026-09-04" }, today), "complete");
});

test("completeness recomputes from the actual required checklist and document map", () => {
  const result = recomputeDqCompleteness({
    driverId: "driver-1",
    requirements,
    documents: {
      "driver-1::application": { status: "complete", expires_date: null },
      "driver-1::medical": { status: "complete", expires_date: "2026-08-20" },
      "driver-1::eldt": { status: "complete", expires_date: null },
    },
    today: "2026-08-04",
  });
  assert.deepEqual(result, { complete: 2, required: 2, expiring30: 1, expired: 0, missing: 0, percent: 100 });
});

test("conditional checklist rows do not lower completeness without applicability facts", () => {
  const result = recomputeDqCompleteness({ driverId: "driver-1", requirements, documents: {}, today: "2026-08-04" });
  assert.deepEqual(result, { complete: 0, required: 2, expiring30: 0, expired: 0, missing: 2, percent: 0 });
});
