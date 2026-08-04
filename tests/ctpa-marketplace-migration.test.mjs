import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const sql = readFileSync(
  new URL("../supabase/migrations/20260804_compass_ctpa_marketplace.sql", import.meta.url),
  "utf8",
);

test("C/TPA migration owns the marketplace schema and read boundary", () => {
  assert.match(sql, /create table if not exists public\.compass_ctpas/i);
  assert.match(sql, /slug text not null unique/i);
  assert.match(sql, /fmcsa_clearinghouse_name text/i);
  assert.match(sql, /alter table public\.compass_ctpas enable row level security/i);
  assert.match(sql, /using \(is_active\)/i);
});

test("C/TPA seed contains the verified provider set and manual-entry sentinel", () => {
  for (const [slug, legalName, website] of [
    ["procom", "PROCOM LLC", "https://procomtesting.com"],
    ["disa", "DISA Global Solutions, Inc.", "https://disa.com"],
    ["national-drug-screening", "National Drug Screening, Inc.", "https://www.nationaldrugscreening.com"],
    ["foley", "Foley Carrier Services, LLC", "https://www.foleyservices.com"],
  ]) {
    assert.ok(sql.includes(`'${slug}'`), `missing slug ${slug}`);
    assert.ok(sql.includes(`'${legalName.replaceAll("'", "''")}'`), `missing legal name ${legalName}`);
    assert.ok(sql.includes(`'${website}'`), `missing website ${website}`);
  }

  assert.ok(sql.includes("'other'"), "manual-entry sentinel is required by the picker");
  assert.match(sql, /on conflict \(slug\) do update/i);
});

test("seed does not claim unverified connectors or registration names", () => {
  assert.doesNotMatch(sql, /true,\s*'(?:beta|live)'/i);
  assert.match(sql, /fmcsa_clearinghouse_name\s*\n\) values[\s\S]*null/i);
});
