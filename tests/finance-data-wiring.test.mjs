import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const source = await readFile(new URL("../src/lib/useFinance.ts", import.meta.url), "utf8");

test("finance hook loads both ledger and client views for the selected month", () => {
  assert.match(source, /view=ledger/);
  assert.match(source, /view=by-client/);
  assert.match(source, /encodeURIComponent\(month\)/);
  assert.match(source, /setEntries\(ledger\.entries \|\| \[\]\)/);
  assert.match(source, /setClientRows\(clients\.rows \|\| \[\]\)/);
});

test("finance requests authenticate and mutations refresh the same row sets", () => {
  assert.match(source, /Authorization: `Bearer \$\{session\.access_token\}`/);
  assert.match(source, /method: "POST"/);
  assert.match(source, /await refresh\(\)/);
  assert.doesNotMatch(source, /TODO: fetch/);
});
