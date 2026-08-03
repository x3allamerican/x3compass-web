import assert from "node:assert/strict";
import { createHmac } from "node:crypto";
import { readFile } from "node:fs/promises";
import test from "node:test";

import {
  opaqueStripeFailure,
  verifyStripeSignature,
} from "../functions/_shared/stripe-security.mjs";

const secret = "whsec_test_contract_only";
const payload = JSON.stringify({ id: "evt_contract", type: "checkout.session.completed" });

function signature(body, timestamp, signingSecret = secret) {
  return createHmac("sha256", signingSecret).update(`${timestamp}.${body}`).digest("hex");
}

test("accepts a current Stripe signature over the exact raw body", async () => {
  const now = 1_800_000_000;
  const header = `t=${now},v1=${signature(payload, now)}`;

  assert.equal(await verifyStripeSignature(payload, header, secret, now), true);
});

test("rejects tampering, stale signatures, and the wrong signing secret", async () => {
  const now = 1_800_000_000;
  const valid = signature(payload, now);

  assert.equal(await verifyStripeSignature(`${payload} `, `t=${now},v1=${valid}`, secret, now), false);
  assert.equal(await verifyStripeSignature(payload, `t=${now - 301},v1=${signature(payload, now - 301)}`, secret, now), false);
  assert.equal(await verifyStripeSignature(payload, `t=${now},v1=${valid}`, "wrong-secret", now), false);
});

test("accepts a valid rotating v1 signature when another v1 value is invalid", async () => {
  const now = 1_800_000_000;
  const header = `t=${now},v1=${"0".repeat(64)},v1=${signature(payload, now)}`;

  assert.equal(await verifyStripeSignature(payload, header, secret, now), true);
});

test("returns an opaque client failure without upstream detail", () => {
  const response = opaqueStripeFailure();

  assert.deepEqual(response, { ok: false, error: "Billing service unavailable" });
  assert.equal("detail" in response, false);
});

test("checkout attaches carrier identity to the subscription for race-safe provisioning", async () => {
  const source = await readFile(
    new URL("../functions/api/stripe/create-checkout-session.ts", import.meta.url),
    "utf8",
  );

  assert.match(source, /subscription_data\[metadata\]\[carrier_id\]/);
  assert.match(source, /subscription_data\[metadata\]\[plan\]/);
});

test("event-ledger failures use the opaque webhook response contract", async () => {
  const source = await readFile(
    new URL("../functions/api/stripe/webhook.ts", import.meta.url),
    "utf8",
  );

  assert.doesNotMatch(source, /catch \(err\) \{[\s\S]*?throw err;[\s\S]*?\}/);
  assert.match(source, /\[stripe-webhook\] event ledger failure/);
});
