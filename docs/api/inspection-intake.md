# Inspection report intake API

`POST /api/inspections/parse` accepts an authenticated JSON request containing `filename`, `mime_type`, and base64 report bytes in `file_base64`. The maximum decoded-report envelope is enforced at approximately 20 MB.

The response contains normalized `extracted` inspection fields, `needs_manual`, and `review_status: needs_human_review`. A successful extraction is never treated as a regulatory determination. Callers must present the review form and retain unknown or unmapped violation codes for human classification.

The endpoint is read/transform only. Saving the reviewed record uses the existing tenant-scoped `compass_inspections` workflow.

Supported types are PDF, PNG, JPEG, and WebP. Missing AI configuration and provider or parse failures return an empty manual-review result rather than fabricated data.
