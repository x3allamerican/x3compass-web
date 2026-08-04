# Usage Reconciliation — Design

The report compares auditable operational counts with explicitly labeled Stripe invoice quantities. It does not calculate prices, infer which unlabeled line represents a product, or mutate billing.

Tenant authority is established before operational or Stripe reads. Every database query contains the authorized carrier ID. Stripe customer identity comes from the carrier record, never the request. A carrier without a Stripe customer receives actual counts compared with an empty invoice rather than fabricated billing data.

The Billing page presents the source month, quantities, deltas, and mismatch class. Fixture tests cover exact matches, overbilling, underbilling, missing categories, and unknown lines. No live Stripe request or write is made during verification.
