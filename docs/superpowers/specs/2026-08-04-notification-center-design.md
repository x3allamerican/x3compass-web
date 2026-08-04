# Notification Center — Design

The notification log is the existing carrier-scoped event feed. The completion tranche adds read state rather than introducing a competing table. The UI authenticates every request, the API checks membership, and update predicates include both carrier and record identity.

Unread state is explicit (`read_at`), independent from channel delivery fields. Producers use stable dedupe keys so retries do not multiply customer alerts. The header bell links to the center and displays the authenticated tenant's unread count.

Expiration and MVR events persist in-app evidence only during real (non-dry-run) agent/webhook execution. Tests mock all external calls. This change does not schedule agents, configure webhooks, apply schema, send live email, or deploy code.
