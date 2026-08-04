import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const page = new URL("../src/app/app/inspections/page.tsx", import.meta.url);
const panel = new URL("../src/components/app/DataqChallengePanel.tsx", import.meta.url);
const apiDoc = new URL("../docs/api/dataq-challenges.md", import.meta.url);

test("inspection register exposes DataQ actions only to the real challenge workspace", () => {
  const source = readFileSync(page, "utf8");
  assert.match(source, /DataqChallengePanel/);
  assert.match(source, /Start DataQ/);
  assert.match(source, /initialInspectionId/);
  assert.match(source, /!isDemo/);
});

test("DataQ API documentation matches the source-only workflow contract", () => {
  const source = readFileSync(apiDoc, "utf8");
  assert.match(source, /GET `\/api\/dataq\/challenges`/);
  assert.match(source, /POST `\/api\/dataq\/challenges`/);
  assert.match(source, /PATCH `\/api\/dataq\/challenges`/);
  for (const status of ["submitted", "under_review", "approved", "denied"]) assert.match(source, new RegExp(status));
  for (const code of ["401", "404", "409", "503"]) assert.match(source, new RegExp(code));
  assert.match(source, /NEEDS CLAUDE TO APPLY/);
  assert.match(source, /does not submit/i);
});

test("challenge workspace uses authenticated real data, explicit sources, evidence, and visible errors", () => {
  const source = readFileSync(panel, "utf8");
  assert.match(source, /DataQ challenge workspace/);
  assert.match(source, /getSession/);
  assert.match(source, /Authorization/);
  assert.match(source, /\/api\/dataq\/challenges/);
  assert.match(source, /uploadDataqEvidence/);
  assert.match(source, /Select an inspection/);
  assert.match(source, /issue_summary/);
  assert.match(source, /requested_correction/);
  assert.match(source, /agency_response_notes/);
  assert.match(source, /role="alert"/);
  assert.match(source, /Decision support only/);
  assert.doesNotMatch(source, /DEMO|demoData|withDemoFallback|win rate|likely approved/i);
});
