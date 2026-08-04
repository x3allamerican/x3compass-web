import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";

test("screenings documentation covers every handler route and environment override", async () => {
  const doc = await readFile(new URL("../docs/api/screenings.md", import.meta.url), "utf8");
  for (const route of [
    "/api/screenings/order",
    "/api/screenings/continuous-mvr/enroll",
    "/api/screenings/continuous-mvr/unenroll",
    "/api/screenings/continuous-mvr/list",
    "/api/screenings/mvr/parse",
    "/api/screenings/webhook",
  ]) assert.match(doc, new RegExp(route.replaceAll("/", "\\/")), route);
  for (const variable of [
    "CHECKR_CONTINUOUS_MVR_PATH", "CHECKR_CONTINUOUS_MVR_TYPE", "CHECKR_DEFAULT_NODE",
    "CHECKR_CONTINUOUS_MVR_CANCEL_PATH", "CHECKR_CONTINUOUS_MVR_CANCEL_METHOD",
    "CHECKR_STAGING_WEBHOOK_SECRET", "CHECKR_LIVE_WEBHOOK_SECRET", "ANTHROPIC_API_KEY",
  ]) assert.match(doc, new RegExp(variable), variable);
});

test("documentation records tenant derivation and manual-extraction degradation", async () => {
  const doc = await readFile(new URL("../docs/api/screenings.md", import.meta.url), "utf8");
  assert.match(doc, /requireTenant/);
  assert.match(doc, /never establishes authority/);
  assert.match(doc, /NEEDS_BASELINE/);
  assert.match(doc, /ACCOUNT_NOT_APPROVED/);
  assert.match(doc, /needs_manual/);
  assert.match(doc, /unmonitored candidate does not/);
});
