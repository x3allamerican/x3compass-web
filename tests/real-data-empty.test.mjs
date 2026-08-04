import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("operational dashboards never substitute demo rows for empty API data", async () => {
  const [marketing, prospects, integrations] = await Promise.all([
    read("src/app/app/marketing/page.tsx"),
    read("src/app/app/prospects/page.tsx"),
    read("src/app/app/integrations/page.tsx"),
  ]);

  assert.match(marketing, /const LEADS = api\?\.recent_leads \|\| \[\]/);
  assert.doesNotMatch(marketing, /const LEADS =[^\n]*DEMO_LEADS/);
  assert.match(prospects, /const ROWS_ALL\s+= api\?\.rows\?\.all_in_region \|\| \[\]/);
  assert.doesNotMatch(prospects, /const ROWS_ALL[^\n]*DEMO_/);
  assert.match(integrations, /const VENDORS = api\?\.vendors \|\| \[\]/);
});

test("tenant notification rules and channels are empty when the API returns none", async () => {
  const source = await read("src/app/app/notifications/page.tsx");

  assert.match(source, /active_rules: 0, critical_rules: 0/);
  assert.match(source, /api\?\.active_rules \|\| \(allowDemo \? DEMO_RULES : \[\]\)/);
  assert.match(source, /api\?\.channel_breakdown \|\| \(allowDemo \? DEMO_CHANNELS : \[\]\)/);
});

test("driver KPI labels use their stated date windows", async () => {
  const source = await read("src/app/app/drivers/page.tsx");

  assert.match(source, /joinedOn >= monthStart && joinedOn <= today/);
  assert.match(source, /termination_date >= inactiveCutoff && d\.termination_date <= today/);
  assert.match(source, /value=\{kpis\.newThisMonth\}/);
  assert.match(source, /value=\{kpis\.inactiveTerminated90\}/);
  assert.match(source, /cdl_expires_on >= today && d\.cdl_expires_on <= in30/);
});
