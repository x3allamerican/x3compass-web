import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("inspection and accident imports authenticate and refresh partial successes", async () => {
  for (const name of ["Inspection", "Accident"]) {
    const source = await read(`src/components/app/${name}ImportModal.tsx`);
    assert.match(source, /getSupabase\(\)\.auth\.getSession\(\)/);
    assert.match(source, /Authorization: `Bearer \$\{token\}`/);
    assert.match(source, /body\.inserted > 0/);
    assert.match(source, /result\.errors\.map/);
  }
});

test("import handlers reject malformed dates and numeric fields before writing", async () => {
  for (const route of ["inspections", "accidents"]) {
    const source = await read(`functions/api/${route}/import.ts`);
    assert.match(source, /validIsoDate/);
    assert.match(source, /nonNegativeInt/);
    assert.match(source, /submitted: parsed\.length - 1/);
  }
});

test("import targets match the page read tables and templates are repository files", async () => {
  const [inspectionApi, inspectionPage, accidentApi, accidentPage, inspectionTemplate, accidentTemplate] = await Promise.all([
    read("functions/api/inspections/import.ts"), read("src/app/app/inspections/page.tsx"),
    read("functions/api/accidents/import.ts"), read("src/app/app/accidents/page.tsx"),
    read("public/templates/inspections-import.csv"), read("public/templates/accidents-import.csv"),
  ]);
  assert.match(inspectionApi, /compass_inspections/); assert.match(inspectionPage, /compass_inspections/);
  assert.match(accidentApi, /compass_accidents/); assert.match(accidentPage, /compass_accidents/);
  assert.match(inspectionTemplate, /^inspection_date,/);
  assert.match(accidentTemplate, /^accident_date,/);
});
