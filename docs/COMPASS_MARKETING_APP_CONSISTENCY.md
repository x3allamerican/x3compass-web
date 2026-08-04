# Compass marketing and app consistency

This review reconciles customer-facing Compass copy with the pricing and checkout behavior implemented in this repository. It changes source only; it does not deploy or modify Stripe or Cloudflare.

## Canonical customer story

- Compass is a self-service AI product with one graduated, per-driver subscription.
- The implemented bands are $50 for drivers 1–50, $40 for 51–75, $30 for 76–100, and $25 for 101+, applied marginally, with a $100 monthly minimum.
- A 100-driver account totals $4,250 per month under that calculation.
- The Compass subscription includes the Compass product suite and Hazmat capability.
- The trial lasts seven days and does not require a card. Afterward, the customer may activate the single subscription or cancel.
- X3 Fleet Safety is a separate, human-led service. A dedicated human safety advisor is not included in a Compass subscription.

Reusable customer copy lives in `src/lib/pricing.ts` as `COMPASS_COPY`. Checkout pricing remains calculated by the pricing functions in that module; the onboarding and checkout APIs remain the executable contract.

## Discrepancies resolved

| Area | Previous inconsistency | Resolution |
| --- | --- | --- |
| Marketing pricing | Copy referred to multiple tiers and choosing a plan. | Copy now describes one graduated plan. |
| Trial conversion | Copy told customers to pick a plan after trial. | Copy now says activate the single plan or cancel. |
| Billing settings | Controls offered to switch or change plans. | Controls now manage the subscription or show pricing details. |
| Delivery mode | Compass copy blurred self-service software and human-led Fleet Safety. | Copy states the boundary and separate contract explicitly. |
| Included service | Structured metadata included a dedicated safety advisor. | The unsupported inclusion was removed. |
| API regression fixture | A checkout test sent the obsolete `plan: "diy"` payload. | The fixture now sends the supported driver quantity. |

## Claims requiring owner evidence

This consistency pass did not validate or expand the following existing marketing claims: the 67,000-document corpus size, twelve live brains, live verification of every citation, the 90-day audit-readiness promise, or its refund terms. They remain unchanged rather than being silently reinterpreted. Before publication changes, the claim owner should retain dated evidence for corpus counts and brain availability, verify that live citation behavior matches the absolute wording, and have the refund promise and qualification criteria approved as an enforceable customer policy.

No prices, capabilities, or service commitments were invented in this review.
