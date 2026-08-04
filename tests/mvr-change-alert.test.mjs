import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";
import { mvrChangeAlert, shouldSendMvrChangeAlert } from "../functions/_shared/mvr-change-alert.mjs";

test("only the first deduplicated report claim may send an alert", () => {
  assert.equal(shouldSendMvrChangeAlert([{ id: "event-1" }]), true);
  assert.equal(shouldSendMvrChangeAlert([]), false);
  assert.equal(shouldSendMvrChangeAlert(undefined), false);
});

test("webhook claims the report before sending and ignores unmonitored candidates", async () => {
  const webhook = await readFile(new URL("../functions/api/screenings/webhook.ts", import.meta.url), "utf8");
  const unmonitoredReturn = webhook.indexOf("if (!mon) return; // not a monitored driver");
  const claim = webhook.indexOf("shouldSendMvrChangeAlert(claimed)");
  const email = webhook.indexOf("await sendEmail(env");
  assert.ok(unmonitoredReturn >= 0);
  assert.ok(claim > unmonitoredReturn);
  assert.ok(email > claim);
  assert.match(webhook, /resolution=ignore-duplicates,return=representation/);
});

test("MVR change alert is factual, escaped, and links to the MVR workspace", () => {
  const alert = mvrChangeAlert({
    carrierName: "Acme <Fleet>",
    result: "review & verify",
    violationsCount: 2,
    reportId: "rpt_123",
    siteUrl: "https://x3compass.com/",
  });
  assert.match(alert.subject, /MVR change detected/);
  assert.match(alert.html, /Acme &lt;Fleet&gt;/);
  assert.match(alert.html, /review &amp; verify/);
  assert.match(alert.html, /2 reported violation records/);
  assert.match(alert.html, /https:\/\/x3compass\.com\/app\/mvr/);
  assert.doesNotMatch(alert.html, /<Fleet>/);
});
