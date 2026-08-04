import assert from "node:assert/strict";
import test from "node:test";
import {
  normalizeEvidence,
  validateChallengeCreate,
  validateStatusTransition,
} from "../src/lib/dataqWorkflow.mjs";

const UUID = "00000000-0000-4000-8000-000000000001";

test("validates an inspection-linked submitted challenge without deciding merit", () => {
  assert.deepEqual(validateChallengeCreate({
    target_type: "inspection",
    target_id: UUID,
    issue_summary: "The inspection report lists a vehicle that was not operated by this carrier.",
    requested_correction: "Correct the carrier association for the cited inspection.",
    submitted_on: "2026-08-04",
  }), {
    ok: true,
    value: {
      targetType: "inspection",
      targetId: UUID,
      issueSummary: "The inspection report lists a vehicle that was not operated by this carrier.",
      requestedCorrection: "Correct the carrier association for the cited inspection.",
      submittedOn: "2026-08-04",
      trackingNumber: null,
    },
  });
});

test("rejects unsupported targets, malformed ids, empty narratives, and invalid dates", () => {
  for (const input of [
    { target_type: "violation", target_id: UUID, issue_summary: "Specific facts", requested_correction: "Specific correction", submitted_on: "2026-08-04" },
    { target_type: "inspection", target_id: "not-a-uuid", issue_summary: "Specific facts", requested_correction: "Specific correction", submitted_on: "2026-08-04" },
    { target_type: "inspection", target_id: UUID, issue_summary: " ", requested_correction: "Specific correction", submitted_on: "2026-08-04" },
    { target_type: "crash", target_id: UUID, issue_summary: "Specific facts", requested_correction: "Specific correction", submitted_on: "2026-02-30" },
  ]) assert.equal(validateChallengeCreate(input).ok, false);
});

test("allows only forward agency-reported status transitions and requires terminal notes", () => {
  assert.deepEqual(validateStatusTransition("submitted", "under_review", ""), { ok: true });
  assert.deepEqual(validateStatusTransition("submitted", "approved", "Agency corrected the record."), { ok: true });
  assert.deepEqual(validateStatusTransition("under_review", "denied", "Agency declined the requested correction."), { ok: true });
  assert.equal(validateStatusTransition("submitted", "approved", "").ok, false);
  assert.equal(validateStatusTransition("under_review", "submitted", "").ok, false);
  assert.equal(validateStatusTransition("approved", "denied", "Agency changed its response.").ok, false);
  assert.equal(validateStatusTransition("submitted", "submitted", "").ok, false);
});

test("normalizes complete evidence metadata and rejects partial or unsafe object keys", () => {
  assert.deepEqual(normalizeEvidence({
    label: "Dispatch record",
    file_name: "dispatch.pdf",
    object_key: `carriers/${UUID}/dataq/file.pdf`,
    content_type: "application/pdf",
    size_bytes: 4200,
  }), { ok: true, value: {
    label: "Dispatch record", fileName: "dispatch.pdf", objectKey: `carriers/${UUID}/dataq/file.pdf`, contentType: "application/pdf", sizeBytes: 4200,
  } });
  assert.equal(normalizeEvidence({ label: "Dispatch", file_name: "dispatch.pdf" }).ok, false);
  assert.equal(normalizeEvidence({ label: "Dispatch", file_name: "dispatch.pdf", object_key: "../secret", content_type: "application/pdf", size_bytes: 10 }).ok, false);
  assert.equal(normalizeEvidence({ label: "Dispatch", file_name: "dispatch.pdf", object_key: `carriers/${UUID}/dataq/file.pdf`, content_type: "application/pdf", size_bytes: 30_000_000 }).ok, false);
});
