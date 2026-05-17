# Staging Environment Workflow

Cloudflare Pages auto-generates a preview deployment for every non-`main` branch push. We use these as our deliberate staging environment.

## Workflow

```
main branch        →  https://x3compass-web.pages.dev          (production)
feature/<branch>   →  https://<short>.x3compass-web.pages.dev  (preview)
```

## Env vars on previews

Cloudflare Pages keeps a separate `preview` env-var bucket. Currently it mirrors production (we PATCH both at once via the API). For real isolation:

1. **Stripe**: swap `STRIPE_SECRET_KEY` to `sk_test_...` + create matching test prices
2. **Supabase**: optionally use a separate `compass_staging_*` schema OR a separate Supabase project
3. **Resend**: use a dedicated `staging@x3compass.com` from-address that doesn't go to real customers

To set preview-only env vars via the Cloudflare API:

```bash
curl -X PATCH -H "Authorization: Bearer $CF_TOKEN" \
  "https://api.cloudflare.com/client/v4/accounts/$CF_ACCT/pages/projects/x3compass-web" \
  --data '{"deployment_configs":{"preview":{"env_vars":{"STRIPE_SECRET_KEY":{"type":"secret_text","value":"sk_test_..."}}}}}'
```

## Test workflow

1. Create a feature branch: `git checkout -b feature/new-thing`
2. Push it: `git push -u origin feature/new-thing`
3. Cloudflare builds the preview → comments URL on the GitHub PR
4. Playwright suite runs against production (the default `PW_BASE_URL`). To test against the preview instead:
   - Add `PW_BASE_URL` to the workflow with the preview URL
   - Or trigger workflow manually: Actions → playwright → "Run workflow" → set base URL

## Promotion

PR review + Playwright pass → merge to `main` → auto-deploys to production.
