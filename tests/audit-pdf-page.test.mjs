import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const page = new URL("../src/app/app/audit-export/page.tsx", import.meta.url);

test("audit export page offers authenticated native PDF downloads", () => {
  const source = readFileSync(page, "utf8");
  assert.match(source, /Audit-ready PDFs/);
  assert.match(source, /useDrivers/);
  assert.match(source, /getSession/);
  assert.match(source, /Authorization/);
  assert.match(source, /\/api\/audit\/pdf\?type=/);
  assert.match(source, /dq-file/);
  assert.match(source, /drug-alcohol/);
  assert.match(source, /accident-register/);
  assert.match(source, /URL\.createObjectURL/);
  assert.match(source, /URL\.revokeObjectURL/);
  assert.doesNotMatch(source, /DEMO_PDF|demoPdf|withDemoFallback/);
});

test("DQ file selection is explicit and errors remain visible", () => {
  const source = readFileSync(page, "utf8");
  assert.match(source, /Select a driver/);
  assert.match(source, /driver_id/);
  assert.match(source, /pdfError/);
  assert.match(source, /role="alert"/);
  assert.match(source, /disabled=.*selectedDriverId/);
});
