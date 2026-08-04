# Audit PDF API

`GET /api/audit/pdf?carrier_id=<uuid>&type=<dq|da|accident>&driver_id=<uuid>` requires tenant membership. DQ exports require a driver belonging to the same carrier. The function renders a native PDF from authorized database evidence, records the export audit event, and never substitutes demo records when evidence is absent.
