import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const pagePath = new URL("../src/app/calendar/page.tsx", import.meta.url);
const shellPath = new URL("../src/components/AppShell.tsx", import.meta.url);

test("native calendar page uses authenticated evidence and the shared engine", () => {
  const source = readFileSync(pagePath, "utf8");
  assert.match(source, /getSession/);
  assert.match(source, /Authorization/);
  assert.match(source, /\/api\/compliance-calendar/);
  assert.match(source, /buildComplianceCalendar/);
  assert.match(source, /citation/);
  assert.match(source, /confirm_applicability/);
  assert.match(source, /evidence_missing/);
  assert.doesNotMatch(source, /DEMO|demoData|withDemoFallback/);
});

test("shared app navigation exposes the compliance calendar", () => {
  const source = readFileSync(shellPath, "utf8");
  assert.match(source, /href: "\/calendar"/);
  assert.match(source, /label: "Compliance Calendar"/);
});
