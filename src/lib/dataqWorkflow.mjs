const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const TARGETS = new Set(["inspection", "crash"]);
const TERMINAL = new Set(["approved", "denied"]);
const NEXT = {
  submitted: new Set(["under_review", "approved", "denied"]),
  under_review: new Set(["approved", "denied"]),
  approved: new Set(),
  denied: new Set(),
};

function text(value, max) {
  if (typeof value !== "string") return null;
  const normalized = value.trim();
  return normalized && normalized.length <= max ? normalized : null;
}

function validDate(value) {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(date.valueOf()) && date.toISOString().slice(0, 10) === value;
}

export function validateChallengeCreate(input) {
  const targetType = input?.target_type;
  const targetId = input?.target_id;
  const issueSummary = text(input?.issue_summary, 4000);
  const requestedCorrection = text(input?.requested_correction, 2000);
  const submittedOn = input?.submitted_on;
  const trackingNumber = input?.tracking_number == null || input.tracking_number === "" ? null : text(input.tracking_number, 120);
  if (!TARGETS.has(targetType) || !UUID.test(targetId || "") || !issueSummary || !requestedCorrection || !validDate(submittedOn) || (input?.tracking_number && !trackingNumber)) {
    return { ok: false, error: "invalid_challenge" };
  }
  return { ok: true, value: { targetType, targetId, issueSummary, requestedCorrection, submittedOn, trackingNumber } };
}

export function validateStatusTransition(current, next, notes) {
  if (!NEXT[current]?.has(next)) return { ok: false, error: "invalid_status_transition" };
  if (TERMINAL.has(next) && !text(notes, 4000)) return { ok: false, error: "agency_response_notes_required" };
  return { ok: true };
}

export function normalizeEvidence(input) {
  const label = text(input?.label, 200);
  const fileName = text(input?.file_name, 255);
  const objectKey = text(input?.object_key, 1000);
  const contentType = text(input?.content_type, 120);
  const sizeBytes = input?.size_bytes;
  if (!label || !fileName || !objectKey || !/^carriers\/[0-9a-f-]{36}\/dataq\/[A-Za-z0-9._/-]+$/i.test(objectKey) || objectKey.includes("..") || !contentType || !Number.isInteger(sizeBytes) || sizeBytes < 1 || sizeBytes > 25 * 1024 * 1024) {
    return { ok: false, error: "invalid_evidence" };
  }
  return { ok: true, value: { label, fileName, objectKey, contentType, sizeBytes } };
}
