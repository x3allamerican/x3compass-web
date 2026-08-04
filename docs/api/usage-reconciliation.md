# Monthly usage reconciliation

`GET /api/billing/usage-reconciliation?carrier_id=<uuid>&month=YYYY-MM` is an authenticated, tenant-scoped, read-only report.

Operational quantities come from carrier-filtered records:

- active `compass_mvr_monitors`;
- month-created `compass_mvr_records` whose source is `checkr_continuous`;
- month-created Checkr `vendor_orders`.

Stripe invoices are retrieved by the carrier's server-side customer ID. Invoice lines participate only when line or Price metadata contains `x3_usage_type` equal to `mvr_monitors`, `mvr_triggered_reports`, or `background_checks`. Unlabeled lines are reported as unclassified and never silently assigned.

Each category reports actual quantity, invoice quantity, delta, and `matched`, `missing_from_invoice`, `invoice_over`, or `invoice_under`. The endpoint never creates or updates an invoice, invoice item, subscription, meter, or Stripe customer.
