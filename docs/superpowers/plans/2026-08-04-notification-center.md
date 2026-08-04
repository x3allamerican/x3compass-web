# Notification Center — Implementation Plan

1. Lock the tenant, read-state, bell, and producer contracts with regression tests.
2. Extend the notification log schema additively with read and dedupe fields.
3. Add carrier-scoped unread output and mark-read mutation to the existing API.
4. Authenticate the page, render unread state, and add per-row and bulk actions.
5. Load the unread count in the shared shell and link the bell to the center.
6. Persist deduplicated expiration-digest and continuous-MVR-change events.
7. Verify domain, API security, TypeScript, production build, and repository hygiene before opening the stacked draft PR.
