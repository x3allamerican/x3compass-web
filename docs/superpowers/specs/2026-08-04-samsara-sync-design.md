# Samsara Sync Depth — Design

Samsara is the first deep telematics adapter because the repository already had its authenticated vehicle route and official APIs cover drivers and HOS. The adapter expands that route rather than creating parallel connectors.

Stable Samsara IDs are stored as source provenance and used as tenant-scoped conflict keys. This avoids CDL-based duplication and supports drivers whose Samsara record does not contain license evidence. Single-word or missing driver names are omitted for human resolution instead of fabricated. HOS rows link only after a local source-ID match.

Every vendor page is cursor-drained with a hard 100-page safety ceiling. Upstream and reconciliation failures update integration error state and return an opaque error to the caller. The customer Settings surface shows last-sync timestamp/count and invokes only the authenticated route.

All verification uses mocked responses. No credential, deployment, migration, vendor call, or database write is performed by Codex.
