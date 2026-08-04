# Stripe Checkout, Webhook, and Provisioning Audit

Audited 2026-08-03 against the source on `main`. This is a source review and
test record; it does not assert that any environment variable, webhook endpoint,
Stripe object, or deployment is configured in production.

## End-to-end flow

1. The authenticated browser posts driver quantity to
   `functions/api/stripe/create-checkout-session.ts`.
2. The handler verifies the Supabase user token, resolves that user through
   `compass_carrier_users`, and takes `carrier.id` from the server-side relation.
   The browser cannot supply the carrier identifier used for checkout.
3. The handler creates a Stripe subscription Checkout Session using the single
   configured graduated per-driver Price. It sends carrier and plan metadata on
   both the Checkout Session and the future Subscription.
4. Stripe posts the exact raw event body to `functions/api/stripe/webhook.ts`.
   The handler verifies a current `v1` HMAC signature before JSON parsing or any
   database write.
5. The event ID is inserted into `compass_stripe_events`. A duplicate insert is
   acknowledged without repeating provisioning, making replay idempotent.
6. `checkout.session.completed` stores the Stripe customer/subscription IDs and
   activates the carrier. Subscription events independently resolve the carrier
   from subscription metadata, update status/current-period end, and set the
   single `compass` service tier.
7. Invoice success restores `active`; invoice failure sets `past_due` and may
   send the carrier contact a payment-failure notice.
8. A successfully handled event receives `processed_at`. The client receives a
   small success document; provider and database error bodies remain server-side.

## Findings and disposition

| Severity | Finding | Disposition |
|---|---|---|
| P0 | Checkout and portal handlers returned raw Stripe response bodies in `detail`; catch paths returned internal exception messages. | Fixed on current `main`. Provider/configuration failures now use the opaque correlation-ID security error contract; logs retain endpoint name and HTTP status without response bodies. |
| P0 | Webhook processing failures returned `String(err)` to the caller. | Fixed. Failures are logged server-side and use the same opaque client contract. |
| P0 | Checkout Session metadata was not copied onto the Subscription. A `customer.subscription.created` event arriving before `checkout.session.completed` could fail to resolve a carrier. | Fixed. Carrier and plan metadata are explicitly attached through `subscription_data[metadata]`. |
| P1 | Signature verification considered only the first `v1` value, which could reject a valid event during Stripe signing-secret rotation. | Fixed. Verification accepts any valid `v1` candidate while retaining constant-time comparison and the five-minute replay window. |
| P1 | A non-duplicate failure inserting the idempotency event could be swallowed and provisioning could continue without an event ledger row. | Fixed. Only duplicate/409 failures are acknowledged; every other insert failure aborts processing. |

## Verification contract

`tests/stripe-billing-contract.test.mjs` proves:

- a current signature over the exact raw body is accepted;
- body tampering, a stale timestamp, and the wrong secret are rejected;
- signing-secret rotation with multiple `v1` values is supported;
- the shared provider-failure response exposes no `detail` field;
- checkout carries carrier and plan metadata into the Subscription.

Run:

```bash
node --test tests/stripe-billing-contract.test.mjs
```

## Required release verification

Before launch, an authorized operator must use Stripe test mode to record one
successful checkout, one invalid-signature rejection, one replayed event, one
subscription update, one payment failure, and one portal-session creation. The
operator must confirm the carrier state transition and event-ledger row after
each case. This PR performs no live request, charge, webhook delivery, database
write, deployment, or environment inspection.
