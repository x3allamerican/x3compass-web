import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const page = new URL("../src/app/app/inspections/page.tsx", import.meta.url);
const panel = new URL("../src/components/app/DataqChallengePanel.tsx", import.meta.url);

test("inspection register exposes DataQ actions only to the real challenge workspace", () => {
  const source = readFileSync(page, "utf8");
  assert.match(source, /DataqChallengePanel/);
  assert.match(source, /Start DataQ/);
  assert.match(source, /initialInspectionId/);
  assert.match(source, /!isDemo/);
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
