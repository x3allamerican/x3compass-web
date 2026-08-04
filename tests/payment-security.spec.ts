import { expect, test } from "@playwright/test";
import { parseDriverQuantity } from "../functions/api/stripe/create-checkout-session";
import { reserveStripeEvent } from "../functions/api/stripe/webhook";

test("checkout accepts only bounded whole driver quantities", () => {
  expect(parseDriverQuantity(1)).toBe(1);
  expect(parseDriverQuantity("100000")).toBe(100000);
  for (const value of [undefined, null, 0, -1, 1.5, "1.5", 100001, Infinity, "not-a-number"]) {
    expect(parseDriverQuantity(value)).toBeNull();
  }
});

test("an unprocessed duplicate Stripe event is retried", async () => {
  const store = {
    insert: async () => { throw new Error("Supabase insert compass_stripe_events 409: duplicate"); },
    select: async () => [{ processed_at: null }],
  };
  await expect(reserveStripeEvent(store, { id: "evt_retry", type: "invoice.payment_succeeded", data: { object: {} } }))
    .resolves.toBe("retry");
});

test("a processed duplicate Stripe event is acknowledged without replay", async () => {
  const store = {
    insert: async () => { throw new Error("Supabase insert compass_stripe_events 409: duplicate"); },
    select: async () => [{ processed_at: "2026-08-02T00:00:00.000Z" }],
  };
  await expect(reserveStripeEvent(store, { id: "evt_done", type: "invoice.payment_succeeded", data: { object: {} } }))
    .resolves.toBe("processed");
});

test("non-conflict event persistence failures remain failures", async () => {
  const store = {
    insert: async () => { throw new Error("Supabase unavailable"); },
    select: async () => [],
  };
  await expect(reserveStripeEvent(store, { id: "evt_error", type: "invoice.payment_succeeded", data: { object: {} } }))
    .rejects.toThrow("Supabase unavailable");
});
