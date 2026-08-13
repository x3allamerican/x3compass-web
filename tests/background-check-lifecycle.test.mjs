import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const pagePath = new URL("../src/app/background-checks/page.tsx", import.meta.url);

test("background-check list reads and surfaces the persisted Checkr lifecycle", async () => {
  const source = await readFile(pagePath, "utf8");

  assert.match(source, /eta_completion_at:\s*string \| null/);
  assert.match(source, /\.select\([^\n]*eta_completion_at/);
  assert.match(source, /Report status/);
  assert.match(source, /Estimated completion/);
  assert.match(source, /effective_status/);
});

test("adverse-action orders are visually and semantically distinct", async () => {
  const source = await readFile(pagePath, "utf8");

  assert.match(source, /function isAdverseAction/);
  assert.match(source, /data-adverse-action=/);
  assert.match(source, /Pre-adverse action/);
  assert.match(source, /Final adverse action/);
  assert.match(source, /FCRA review window/);
});

test("the zero-order state stays honest and actionable", async () => {
  const source = await readFile(pagePath, "utf8");

  assert.match(source, /No background checks ordered yet/);
  assert.match(source, /send the first secure invitation/);
});
