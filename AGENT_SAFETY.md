# X3 Compass — Agent Safety Standing Orders

**Owner:** Joshua Kovarik · **Last updated:** 2026-05-17 · **Applies to:** every autonomous agent run inside x3compass-web (doctor, news-monitor, skill-builders, future agents).

This document is the standing rulebook. The doctor's playbook is for *patterns*; this is for *limits*. Every agent must obey these before doing anything else.

---

## 1. Action budget (per agent, per hour)

| Severity | Budget | What counts |
|---|---|---|
| `safe` (read-only) | unlimited | curl probes, status-page lookups, reading repo files, GitHub API reads, GET to /api/health |
| `auto` (mutate, low-blast) | 10/hr | redeploys, closing+labeling issues, posting issue comments, creating issues with auto labels |
| `human` (mutate, high-blast) | **0** | anything below in §4 |

If an agent hits its `auto` budget, it must stop and tag `needs-human` instead of continuing. Budget resets at the top of the next hour.

**Why:** prevents a buggy agent from creating an infinite remediation loop (redeploy storm, comment flood, etc.). Borrowed from Google SRE's error-budget pattern.

---

## 2. Safe-action whitelist (what `auto` agents may do unattended)

Only these specific operations are pre-authorized. Anything not on this list requires a human.

- **Redeploy** a Cloudflare Pages project (via wrangler / API) — only on `auto-fix-redeploy` label, max once per 30 min per project
- **Close** an Issue with label `uptime-alert` and add label `auto-resolved` when probes go green
- **Comment** on an Issue with diagnosis output
- **Add labels** to Issues from this set only: `auto-resolved`, `needs-human`, `investigating`, `false-positive`, `fmcsa-news`, `skill-candidate`
- **Open** an Issue with prefix `[doctor]` or `[news]` or `[skill-eval]`
- **Read** any file in the repo
- **Read** Cloudflare/Supabase/Stripe/Anthropic status pages
- **Read** GitHub Actions run logs
- **Push** to branches matching `agent/*` (never `main`)
- **Open a PR** from an `agent/*` branch to `main` (requires human merge — never self-merge)

---

## 3. Forbidden actions (never, even with a human label)

Hard stops. If an agent's playbook ever tells it to do one of these, the agent ignores the playbook and escalates.

- Rotate or write any production secret (Stripe, Supabase, Cloudflare, Anthropic, Resend, Checkr)
- Apply a Supabase migration or run any DDL
- Push directly to `main` or any protected branch
- Merge its own PR
- Delete any branch, issue, or PR
- Force-push
- Modify billing records (Stripe subscriptions, invoices, customers)
- Send email to customers or partners
- Change DNS, custom domain bindings, or Cloudflare zone settings
- Modify GitHub org/team/permission settings
- Disable, edit, or remove this file or `.doctor/playbook.md`

---

## 4. Escalation thresholds

The agent must tag `needs-human` and post a diagnosis (then stop) when ANY of these are true:

- Same probe failed > 2 minutes across 3 re-checks
- Auto-fix recipe ran but probe is still red after 5 minutes
- More than 3 failure patterns detected in one issue body (suggests upstream outage — call it)
- The diagnosis doesn't match any pattern in `playbook.md`
- Action budget exhausted for the hour
- Any upstream status page reports `degraded` or `incident`
- An `auto` action returned a 4xx or 5xx
- A skill-builder agent's CFR-citation accuracy on the latest run dropped below 95% (see §6)

---

## 5. Logging requirements

Every agent run must produce:

1. A timestamp at start + end
2. The list of actions it considered (the agent's plan)
3. The list of actions it actually executed, with outcome
4. The budget consumed
5. A one-line summary suitable for a human triage scan

This goes into the issue comment for doctor runs, or into a daily summary artifact for news/skill-builder runs.

---

## 6. CFR-skill builder additional rules

Skill-builder agents have a separate, stricter ruleset because hallucinated CFR citations destroy our credibility.

- Every CFR section a skill cites MUST round-trip against the eCFR API (`ecfr.federalregister.gov/api/versioner/v1/full/...`) within the same run that generated it. If the section doesn't exist or doesn't contain the claimed text, the skill is rejected and the run is logged.
- Every quoted regulation text must be an exact substring of the live CFR text. Paraphrase is fine. Made-up quotes are an immediate `needs-human` escalation.
- Every skill must pass the eval set in `.skill-builder/cfr-eval-set.json` before merge — score < 95% blocks the PR.
- Skill PRs go to `agent/skill-builder/*` branches. Human merges.
- A skill that contradicts an existing published skill is `needs-human` for reconciliation, never silent overwrite.

---

## 7. Multi-agent coordination

When more than one agent is running:

- All agents read this file first
- All agents use distinct branch namespaces (`agent/doctor/*`, `agent/news/*`, `agent/skill-builder/fmcsa/*`, etc.)
- Agents don't open issues if there's already an open issue with the same label set from the same agent in the last hour
- The doctor is the only agent allowed to close `uptime-alert` issues
- A coordinator agent (future) will hold the work queue; until then, cron schedules are staggered (doctor on-demand, news 09:00 ET, skill-builders disabled until eval harness is green)

---

## 8. How agents grow smarter without growing more dangerous

When a human resolves an issue the doctor escalated:

1. The human appends a new pattern to `.doctor/playbook.md` describing the symptom + cause + fix
2. If the fix involves a new safe-action, the human appends it to §2 of this file
3. The agent never expands its own whitelist — humans do
4. Patterns over 6 months old without recurrence are pruned during quarterly review

This is the only sanctioned learning loop. Self-modification of safety rules is forbidden (§3).

---

## 9. Kill switch

If an agent is misbehaving, the human runs:

```bash
gh workflow disable doctor.yml --repo x3fleetsafety/x3compass-web
gh workflow disable uptime.yml --repo x3fleetsafety/x3compass-web
gh workflow disable fmcsa-news-monitor.yml --repo x3fleetsafety/x3compass-web
```

Or via the GitHub UI: Actions → workflow → ⋮ → Disable workflow.

Every agent workflow MUST have `workflow_dispatch:` so the human can also manually run it after fixing, and MUST respect `repository_dispatch` of type `agents_pause` (TODO once we have a coordinator).

---

## 10. Reviewed by

| Date | Reviewer | Notes |
|---|---|---|
| 2026-05-17 | Joshua Kovarik | Initial draft, before standing up news monitor + skill-builders |
