# Compliance calendar API

`GET /api/compliance-calendar?carrier_id=<uuid>&as_of=YYYY-MM-DD` is tenant scoped. It reads dated driver, MVR, D&A, vehicle, and carrier evidence and returns recurring due items with current, due, overdue, or evidence-missing status. Date rules are deterministic and do not declare regulatory compliance.
