import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const page = new URL("../src/app/app/drug-alcohol/page.tsx", import.meta.url);
const panel = new URL("../src/components/app/ClearinghouseStatusPanel.tsx", import.meta.url);
const docs = new URL("../docs/api/clearinghouse-status.md", import.meta.url);

test("real D&A page renders Clearinghouse status with and without test rows", () => {
  const source = readFileSync(page, "utf8");
  assert.match(source, /ClearinghouseStatusPanel/);
  assert.ok((source.match(/<ClearinghouseStatusPanel/g) || []).length >= 2);
});

test("Clearinghouse panel uses authenticated real data and exposes grounded driver statuses", () => {
  const source = readFileSync(panel, "utf8");
  assert.match(source, /Clearinghouse query status/);
  assert.match(source, /getSession/);
  assert.match(source, /Authorization/);
  assert.match(source, /\/api\/clearinghouse\/status/);
  for (const value of ["current", "due", "overdue", "missing_evidence", "pre_employment_full", "annual_limited"]) assert.match(source, new RegExp(value));
  assert.match(source, /Record query evidence/);
  assert.match(source, /role="alert"/);
  assert.match(source, /Decision support only/);
  assert.doesNotMatch(source, /DEMO|demoData|withDemoFallback|eligible to drive/i);
});

test("Clearinghouse API docs match the read and record contracts", () => {
  const source = readFileSync(docs, "utf8");
  assert.match(source, /GET `\/api\/clearinghouse\/status`/);
  assert.match(source, /POST `\/api\/clearinghouse\/status`/);
  assert.match(source, /NEEDS CLAUDE TO APPLY/);
  for (const code of ["400", "401", "404", "503"]) assert.match(source, new RegExp(code));
  assert.match(source, /does not call FMCSA/i);
});
