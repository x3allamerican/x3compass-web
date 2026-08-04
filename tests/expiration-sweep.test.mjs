import assert from "node:assert/strict";
import test from "node:test";

import {
  buildExpirationDigest,
  renderExpirationDigestHtml,
  renderExpirationDigestText,
} from "../functions/_shared/expiration-sweep.mjs";

const carrier = { id: "carrier-1", name: "X3 & Sons", primary_contact_email: "safety@example.test" };

test("classifies real CDL and MEC dates at overdue, inclusive 30-day, and inclusive 60-day boundaries", () => {
  const digest = buildExpirationDigest({
    asOf: "2026-08-04",
    carrier,
    drivers: [
      { id: "d1", first_name: "Ada", last_name: "Lovelace", status: "active", cdl_expires_on: "2026-08-03", medical_card_expires_on: "2026-09-04" },
      { id: "d2", first_name: "Grace", last_name: "Hopper", status: "active", cdl_expires_on: "2026-09-03", medical_card_expires_on: "2026-10-03" },
      { id: "d3", first_name: "Inactive", last_name: "Person", status: "inactive", cdl_expires_on: "2026-08-05", medical_card_expires_on: null },
    ],
    mvrRecords: [],
    insuranceDocuments: [],
  });

  assert.deepEqual(digest.items.map((item) => [item.id, item.daysRemaining, item.urgency]), [
    ["cdl:d1", -1, "overdue"],
    ["cdl:d2", 30, "due_30"],
    ["mec:d1", 31, "due_60"],
    ["mec:d2", 60, "due_60"],
  ]);
  assert.deepEqual(digest.counts, { total: 4, overdue: 1, due_30: 1, due_60: 2 });
});

test("uses only the latest MVR and adds one calendar year with leap-day clamping", () => {
  const digest = buildExpirationDigest({
    asOf: "2025-02-01",
    carrier,
    drivers: [{ id: "d1", first_name: "Ada", last_name: "Lovelace", status: "active" }],
    mvrRecords: [
      { id: "old", driver_id: "d1", pulled_on: "2024-01-15" },
      { id: "latest", driver_id: "d1", pulled_on: "2024-02-29" },
      { id: "invalid", driver_id: "d1", pulled_on: "not-a-date" },
    ],
    insuranceDocuments: [],
  });

  assert.equal(digest.items.length, 1);
  assert.deepEqual(digest.items[0], {
    id: "mvr:d1",
    category: "mvr",
    subject: "Ada Lovelace",
    sourceDate: "2024-02-29",
    dueDate: "2025-02-28",
    daysRemaining: 27,
    urgency: "due_30",
    evidence: "Latest recorded MVR pull: 2024-02-29.",
    citation: "49 CFR 391.25",
  });
});

test("includes only dated insurance evidence with conservative document types", () => {
  const digest = buildExpirationDigest({
    asOf: "2026-08-04",
    carrier,
    drivers: [{ id: "d1", first_name: "Ada", last_name: "Lovelace", status: "active" }],
    mvrRecords: [],
    insuranceDocuments: [
      { id: "i1", driver_id: null, doc_type: "commercial_insurance", expires_on: "2026-08-20" },
      { id: "i2", driver_id: "d1", doc_type: "cargo_policy", expires_on: "2026-09-10" },
      { id: "i3", driver_id: null, doc_type: "medical_certificate", expires_on: "2026-08-10" },
      { id: "i4", driver_id: null, doc_type: "MCS-90", expires_on: null },
      { id: "i5", driver_id: null, doc_type: "liability", expires_on: "2027-01-01" },
    ],
  });

  assert.deepEqual(digest.items.map((item) => [item.id, item.subject, item.urgency]), [
    ["insurance:i1", "Carrier insurance", "due_30"],
    ["insurance:i2", "Ada Lovelace", "due_60"],
  ]);
});

test("renders escaped one-carrier HTML and equivalent plain text", () => {
  const digest = buildExpirationDigest({
    asOf: "2026-08-04",
    carrier: { ...carrier, name: "X3 <script>alert(1)</script>" },
    drivers: [{ id: "d1", first_name: "Ada <Admin>", last_name: "& Co", status: "active", cdl_expires_on: "2026-08-20" }],
    mvrRecords: [], insuranceDocuments: [],
  });
  const html = renderExpirationDigestHtml(digest);
  const text = renderExpirationDigestText(digest);

  assert.match(html, /X3 &lt;script&gt;alert\(1\)&lt;\/script&gt;/);
  assert.match(html, /Ada &lt;Admin&gt; &amp; Co/);
  assert.doesNotMatch(html, /<script>/);
  assert.match(text, /Ada <Admin> & Co/);
  assert.match(text, /49 CFR 383\.23/);
});

test("rejects malformed as-of dates and omits missing or beyond-horizon evidence", () => {
  assert.throws(() => buildExpirationDigest({ asOf: "08/04/2026", carrier, drivers: [], mvrRecords: [], insuranceDocuments: [] }), /asOf/);
  const digest = buildExpirationDigest({
    asOf: "2026-08-04", carrier,
    drivers: [{ id: "d1", first_name: "No", last_name: "Dates", status: "active", cdl_expires_on: null, medical_card_expires_on: "2026-10-04" }],
    mvrRecords: [], insuranceDocuments: [],
  });
  assert.equal(digest.items.length, 0);
});
