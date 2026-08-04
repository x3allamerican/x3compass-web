import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

test("pricing and delivery-mode copy comes from the canonical pricing module", async () => {
  const [pricing, home, faq, layout] = await Promise.all([
    read("src/lib/pricing.ts"),
    read("src/app/page.tsx"),
    read("src/app/faq/page.tsx"),
    read("src/app/layout.tsx"),
  ]);

  assert.match(pricing, /export const COMPASS_COPY/);
  for (const source of [home, faq, layout]) assert.match(source, /COMPASS_COPY/);
  assert.match(pricing, /Fleet Safety is a separate human-led service/i);
});

test("one-plan app does not tell customers to choose or switch plans", async () => {
  const sources = await Promise.all([
    read("src/app/page.tsx"),
    read("src/app/faq/page.tsx"),
    read("src/app/app/settings/billing/page.tsx"),
  ]);
  const combined = sources.join("\n");

  for (const stale of ["Every tier", "pick a plan", "Switch plan", "change plan"])
    assert.doesNotMatch(combined, new RegExp(stale, "i"));
});

test("Compass subscription claims do not include a dedicated human safety advisor", async () => {
  const [layout, pricing] = await Promise.all([
    read("src/app/layout.tsx"),
    read("src/lib/pricing.ts"),
  ]);

  assert.doesNotMatch(layout, /dedicated safety advisor/i);
  assert.match(pricing, /not included in the Compass subscription/i);
});

test("checkout contract tests use the one-plan driver quantity input", async () => {
  const apiTest = await read("tests/api.spec.ts");

  assert.doesNotMatch(apiTest, /plan:\s*["']diy["']/);
  assert.match(apiTest, /drivers:\s*1/);
});
