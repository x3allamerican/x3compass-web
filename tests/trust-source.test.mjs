import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const pagePath = new URL("../src/app/trust/page.tsx", import.meta.url);

test("trust route carries the family security and decision-support contract", async () => {
  const source = await readFile(pagePath, "utf8");

  for (const required of [
    "Trust & Security",
    "Data protection",
    "Infrastructure",
    "AI, honestly",
    "Reliability",
    "Your data, your control",
    "Responsible disclosure",
    "Not legal advice · Not an FMCSA determination.",
    'href="/privacy"',
    'href="/terms"',
  ]) {
    assert.match(source, new RegExp(required.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  }
});
