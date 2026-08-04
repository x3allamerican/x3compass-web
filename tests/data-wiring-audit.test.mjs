import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const audit = await readFile(new URL("../docs/DATA_WIRING_DEFECTS.md", import.meta.url), "utf8");

test("data-wiring audit records the ten prioritized fix tranches", () => {
  for (let number = 1; number <= 10; number += 1) {
    assert.match(audit, new RegExp(`DW-${String(number).padStart(3, "0")}`));
  }
});

test("data-wiring audit accounts for every current app page", () => {
  const routes = [
    "/app", "accidents", "ask", "audit-export", "audit-log", "background-checks", "background",
    "clearinghouse", "control-center", "csa", "da-concierge", "document-lookup", "dq-files",
    "driver-invites", "drivers", "drug-alcohol", "finance-team", "finance", "forms", "hazmat/audit",
    "hazmat/emergency-response", "hazmat/exemptions", "hazmat/lithium", "hazmat", "hazmat/placard-wizard",
    "hazmat/security-plan", "hazmat/shipping-papers", "hazmat/substances", "hazmat/training", "hos", "ifta",
    "import", "inspections", "integrations", "marketing", "mvr", "notifications", "onboarding", "pdf-test",
    "prospects", "scorecards", "settings/billing", "settings", "training", "vehicles",
  ];

  assert.equal(routes.length, 45);
  for (const route of routes) assert.ok(audit.includes(`\`${route}\``), `missing ${route}`);
});

test("audit states the real-data-or-empty and same-row-set invariants", () => {
  assert.match(audit, /real carrier-scoped data or an honest empty state/);
  assert.match(audit, /same effective row set and time window/);
  assert.match(audit, /never demo data/);
});
