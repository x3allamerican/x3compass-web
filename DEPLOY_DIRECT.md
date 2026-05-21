# Direct deploy to Cloudflare Pages (bypassing GitHub)

GitHub is blocking pushes from this account, but Cloudflare Pages can be deployed directly via Wrangler. This pushes the 23 queued commits live in ~3 minutes.

## The 2-command path (from your Mac)

```bash
cd ~/Documents/Claude/Projects/X3\ All-American/X3\ Fleet\ Safety/X3\ Compass/x3compass-redesign/web

# Build the static site (produces ./out/)
npm install --no-audit --no-fund   # only if first time / lockfile changed
npm run build

# Deploy directly to the existing x3compass-web Pages project
npx wrangler@latest pages deploy out --project-name x3compass-web --commit-dirty=true
```

When Wrangler runs, it'll prompt for browser auth the first time (opens Cloudflare in your browser, you click Approve). After that, the token is cached in `~/.wrangler/config/default.toml`.

## Or non-interactive (use the Cloudflare API token from secrets.env)

```bash
cd ~/Documents/Claude/Projects/X3\ All-American/X3\ Fleet\ Safety/X3\ Compass/x3compass-redesign/web

# Set credentials from your secrets.env
export CLOUDFLARE_API_TOKEN=$(grep ^CLOUDFLARE_API_TOKEN= ~/Documents/Claude/Projects/X3\ All-American/X3\ Fleet\ Safety/secrets.env | cut -d= -f2-)
export CLOUDFLARE_ACCOUNT_ID=$(grep ^CLOUDFLARE_ACCOUNT_ID= ~/Documents/Claude/Projects/X3\ All-American/X3\ Fleet\ Safety/secrets.env | cut -d= -f2-)

# Build + deploy
npm install --no-audit --no-fund
npm run build
npx wrangler@latest pages deploy out --project-name x3compass-web --commit-dirty=true
```

## What gets deployed

The 23 unpushed commits, in this order (oldest → newest):

1. `efa2ce5` audit-log: real compass_audit_log backend
2. `04a48a6` finance: CHAMPION rebuild
3. `aa60c78` finance-team: 5→9 agents
4. `feb8e9e` Integrations live probes + 4 Finance Team agents
5. `e8f4890` a11y: --fg-faint slate-600
6. `d5f03ca` seo: /pricing title + per-page metadata
7. `bf0651d` /pricing migrate to SiteShell
8. `37265e8` perf: skeleton loaders
9. `b0cc884` security + funnel
10. `71add7b` perf (Batch B)
11. `4efeae9` a11y (Batch C)
12. `4b28113` perf+sec (Batch D)
13. `67be824` trust (Batch E)
14. `857d10a` checkr: smoke + webhook fix + backfill
15. `f67b7ab` background-checks: AppShell + X3 fallback
16. `e381346` checkr: ReportsOverview scope fix
17. `1bd6bd0` a11y contrast: 9 marketing files
18. `0106261` a11y contrast: 26 files site-wide
19. `6d93727` mvr-continuous: full vertical
20. `4908f91` mvr-continuous: setup checklist
21. `a2eb6d3` mvr: restore three-mode DataSourceCard
22. `ab55f1a` mvr: rebuild picker — 3 distinct paths
23. `44ca6b2` **mvr: rebuild to match classic app layout** ← what you came to see

## What you'll see when it's live

Visit https://x3compass-web.pages.dev/app/mvr — should show:

- **Hero**: "You pull the MVR. Compass reads it and does the rest." + 3 numbered steps
- **3 educational FAQ cards** (When? What? Where?) — click to expand
- **Drag-drop upload zone** for PDF/JPG/PNG/WEBP
- **Continuous monitoring callout** (∞ symbol, $5/driver/mo Checkr Continuous MVR opt-in)
- **4 KPI tiles**: Active drivers / Current / Due soon / Overdue+Missing
- **Per-driver tracker** with search + status filter

## After GitHub is restored

Once the suspension is lifted, run a normal `git push origin main` and Cloudflare will detect the existing deployments are ahead of `main` — it will skip redeploying and just mark the GitHub commits as already-deployed. No conflict.

## Migration reminder

Still need to apply `supabase/migrations/20260520_continuous_checks.sql` to your Supabase DB before the continuous-monitoring callout can actually enroll a driver. See `MVR_MONITORING_SETUP.md` for the 60-second Supabase Studio paste.
