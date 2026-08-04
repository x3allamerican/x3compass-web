# Secret Exposure Sweep — 2026-08-02

## Scope and handling

Gitleaks 8.30.1 scanned the reachable history and the Task 1 remediated tree with 100% redaction. The exact commit count may increase as reviewed branches merge. This report contains path/type/count only and no detected values or credentials.

## Result

- Full reachable history after tenant-isolation reconciliation: 5 redacted detections across 3 path/type groups.
- Current Task 1 tree: 2 detections; the legacy public HazMat JWT asset is removed.
- The removed JWT decoded as a public Supabase `anon` role, not `service_role`. It remains in Git history and warrants access-log review plus rotation consideration.
- The remaining generic API-key and curl-auth-user matches are non-secret fallback/probe patterns, not embedded production credential values. They remain fingerprinted so the full-history baseline is explicit rather than silently excluded by broad paths.
- No live worker response or provider was invoked. Task 1's response-redaction and opaque-error tests cover the known privileged response paths.

The committed `.gitleaksignore` is a non-secret fingerprint baseline, not a safety declaration. CI scans full history and rejects every new fingerprint.

## Path/type inventory

| Path | Detector | Count | Current after Task 1 |
|---|---|---:|---|
| `.github/workflows/vendor-health.yml` | `curl-auth-user` | 1 | Yes — non-secret probe credential pattern |
| `functions/api/admin/dispatch.ts` | `generic-api-key` | 1 | Yes — non-secret unconfigured fallback pattern |
| `public/hazmat/hz-supabase.js` | `jwt` | 1 | No — removed by Task 1 |

## Required follow-up

1. Review authorized Supabase and Cloudflare access logs for use of the historical public client credential.
2. Rotate the anonymous project key if the owner determines the historical surface exceeded intended public access.
3. Merge this stacked PR only after the tenant-isolation PR it depends on.
