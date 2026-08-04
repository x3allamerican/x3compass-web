import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("new-carrier onboarding makes driver roster import the primary second step", async () => {
  const source = await read("src/app/app/onboarding/page.tsx");

  assert.match(source, /import\s+\{\s*DriverImportModal\s*\}/);
  assert.match(source, /2 · Import your drivers/);
  assert.match(source, /Import driver roster/);
  assert.match(source, /setShowDriverImport\(true\)/);
});

test("successful onboarding import advances without inventing demo rows", async () => {
  const source = await read("src/app/app/onboarding/page.tsx");

  assert.match(source, /<DriverImportModal/);
  assert.match(source, /onImported=\{\(\) => \{\s*setShowDriverImport\(false\);\s*setStep\(3\);/s);
  assert.doesNotMatch(source, /DEMO_DRIVERS|demoFallback/);
});

test("manual single-driver entry remains available as a secondary path", async () => {
  const source = await read("src/app/app/onboarding/page.tsx");

  assert.match(source, /Or add one driver manually/);
  assert.match(source, /Add driver →/);
  assert.match(source, /Skip for now/);
});

test("authenticated app smoke contract includes onboarding", async () => {
  const gates = await read("tests/app-gates.spec.ts");

  assert.match(gates, /["']\/app\/onboarding["']/);
});
