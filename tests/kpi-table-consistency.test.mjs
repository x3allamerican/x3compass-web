import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const read = (route) => readFile(new URL(`../src/app/app/${route}/page.tsx`, import.meta.url), "utf8");

test("background tiles reduce the same order rows as the table", async () => {
  const source = await read("background-checks");
  assert.match(source, /const completed = orders\.filter\(isCompletedOrder\)\.length/);
  assert.match(source, /const consider = orders\.filter\(needsAdverseReview\)\.length/);
  assert.match(source, /filtered\.length\} of \{orders\.length/);
});

test("D&A tiles and table share the real test-row collection", async () => {
  const source = await read("drug-alcohol");
  assert.match(source, /const total = rows\.length/);
  assert.match(source, /rows\.filter\(r => r\.result === "Pending"\)\.length/);
  assert.match(source, /\{rows\.map\(\(t\) =>/);
});

test("DQ coverage uses the same document map for roster and active driver", async () => {
  const source = await read("dq-files");
  assert.match(source, /const summaries = useMemo\(\(\) => Object\.fromEntries/);
  assert.match(source, /recomputeDqCompleteness\(\{/);
  assert.match(source, /const summaryFor = \(driverId: string\) => summaries\[driverId\]/);
});

test("MVR tiles and table share computed driverRows", async () => {
  const source = await read("mvr");
  assert.match(source, /current: driverRows\.filter/);
  assert.match(source, /const filteredDrivers = driverRows\.filter/);
});

test("inspection and accident counts use their displayed row sets", async () => {
  const [inspections, accidents] = await Promise.all([read("inspections"), read("accidents")]);
  assert.match(inspections, /filtered\.length\} of \{effectiveRows\.length/);
  assert.match(accidents, /filtered\.length\} of \{rows\.length/);
});
