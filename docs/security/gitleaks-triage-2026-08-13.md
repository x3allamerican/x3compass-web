# Gitleaks triage — 2026-08-13

The full-history scan identified four historical fingerprints. They are
allowlisted by exact commit, path, and rule in `.gitleaksignore`; new
fingerprints remain blocking.

| Finding | Disposition |
|---|---|
| `workers/agent-dispatcher-cron/src/index.js` generic-api-key | False positive: the match is the `env.X3_INTERNAL_SECRET` variable reference, not a value. |
| `functions/api/admin/dispatch.ts` generic-api-key | False positive: the match is the `ctx.env.X3_INTERNAL_SECRET` variable reference, not a value. |
| `.github/workflows/vendor-health.yml` curl-auth-user | False positive: the command uses the Actions `STRIPE_SECRET_KEY` environment variable; no value is committed. |
| `services/weasyprint/README.md` curl-auth-header | Local development placeholder in documentation; no production credential. |
| `public/hazmat/hz-supabase.js` historical JWT | Public Supabase anon key from an old demo bundle, removed from current source. It is not a service-role credential; any dashboard key rotation remains an owner-only follow-up. |

No secret value is reproduced here. The scan still fails on any finding whose
fingerprint is not explicitly listed above.
