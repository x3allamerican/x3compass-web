# Staging Environment Workflow

Cloudflare Pages auto-generates a preview deployment for every non-`main` branch push. We use these as our deliberate staging environment.

## Workflow

```
main branch        →  https://x3compass-web.pages.dev          (production)
feature/<branch>   →  https://<short>.x3compass-web.pages.dev  (preview)
```

## Env vars on previews

Cloudflare Pages keeps a separate `preview` environment-variable bucket. Preview and production credentials must remain isolated; production service-role and provider secrets must never be copied into previews.

1. **Stripe:** use test-mode credentials and matching test prices only.
2. **Supabase:** use a separate non-production project. A separate schema under a production service-role credential is not sufficient isolation.
3. **Resend:** use a dedicated test sender and recipient allowlist.
4. **Checkr and vendors:** use staging credentials and staging webhook secrets only.
5. **Uploads:** use a preview-only `UPLOAD_TOKEN_SECRET` and non-production object storage.
6. **CORS:** list only exact preview origins in `APP_ALLOWED_ORIGINS`.

If any isolated dependency is unavailable, omit that preview binding. Secure handlers return a service-unavailable response rather than falling back to production data.

Credential changes require an authorized human operator following the secrets-management procedure. Never place secret values in source control, shell history, tickets, CI output, or pull-request comments.

## Test workflow

1. Create a feature branch: `git checkout -b feature/new-thing`
2. Push it: `git push -u origin feature/new-thing`
3. Cloudflare builds the preview → comments URL on the GitHub PR
4. Playwright suite runs against production (the default `PW_BASE_URL`). To test against the preview instead:
   - Add `PW_BASE_URL` to the workflow with the preview URL
   - Or trigger workflow manually: Actions → playwright → "Run workflow" → set base URL

## Promotion

PR review + Playwright pass → merge to `main` → auto-deploys to production.
