import { expect, test } from "@playwright/test";
import { verifyStripeSignature } from "../functions/api/stripe/webhook";

async function stripeSignature(payload: string, timestamp: number, secret: string): Promise<string> {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey("raw", encoder.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const bytes = await crypto.subtle.sign("HMAC", key, encoder.encode(`${timestamp}.${payload}`));
  const value = Array.from(new Uint8Array(bytes), (byte) => byte.toString(16).padStart(2, "0")).join("");
  return `t=${timestamp},v1=${value}`;
}

test("accepts an authentic Stripe webhook inside the replay window", async () => {
  const now = 1_700_000_000;
  const payload = JSON.stringify({ id: "evt_test", type: "invoice.payment_succeeded" });
  const header = await stripeSignature(payload, now - 30, "webhook-secret");
  await expect(verifyStripeSignature(payload, header, "webhook-secret", now)).resolves.toBe(true);
});

test("rejects tampered and replayed Stripe webhooks", async () => {
  const now = 1_700_000_000;
  const payload = JSON.stringify({ id: "evt_test", type: "invoice.payment_succeeded" });
  const current = await stripeSignature(payload, now, "webhook-secret");
  const old = await stripeSignature(payload, now - 301, "webhook-secret");
  await expect(verifyStripeSignature(`${payload} `, current, "webhook-secret", now)).resolves.toBe(false);
  await expect(verifyStripeSignature(payload, old, "webhook-secret", now)).resolves.toBe(false);
});
