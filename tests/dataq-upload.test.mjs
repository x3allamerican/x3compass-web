import assert from "node:assert/strict";
import test from "node:test";
import { uploadDataqEvidence } from "../src/lib/dataqUpload.mjs";

test("uploads DataQ evidence through the authenticated signed relay", async () => {
  const original = globalThis.fetch;
  const calls = [];
  globalThis.fetch = async (input, init) => {
    calls.push({ url: String(input), init });
    if (String(input) === "/api/uploads/sign") return Response.json({ ok: true, put_url: "/api/uploads/put", object_key: "carriers/c/dataq/key-report.pdf" });
    if (String(input) === "/api/uploads/put") return Response.json({ ok: true });
    throw new Error(`unexpected ${input}`);
  };
  try {
    const file = Object.assign(new Blob(["evidence"], { type: "application/pdf" }), { name: "report.pdf" });
    const result = await uploadDataqEvidence(file, "jwt");
    assert.deepEqual(result, { ok: true, evidence: { label: "report.pdf", file_name: "report.pdf", object_key: "carriers/c/dataq/key-report.pdf", content_type: "application/pdf", size_bytes: 8 } });
    assert.equal(JSON.parse(calls[0].init.body).folder, "dataq");
    assert.equal(calls[0].init.headers.Authorization, "Bearer jwt");
    assert.equal(calls[1].init.method, "PUT");
  } finally { globalThis.fetch = original; }
});

test("rejects missing sessions, empty files, and oversized files before upload", async () => {
  const tiny = Object.assign(new Blob(["x"]), { name: "x.txt" });
  assert.deepEqual(await uploadDataqEvidence(tiny, ""), { ok: false, error: "Not signed in" });
  const empty = Object.assign(new Blob([]), { name: "empty.pdf" });
  assert.equal((await uploadDataqEvidence(empty, "jwt")).ok, false);
  const oversized = { name: "huge.pdf", type: "application/pdf", size: 25 * 1024 * 1024 + 1 };
  assert.equal((await uploadDataqEvidence(oversized, "jwt")).ok, false);
});
