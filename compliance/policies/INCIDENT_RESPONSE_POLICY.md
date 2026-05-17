# Incident Response Policy

**Owner:** Joshua Kovarik (CEO / sole officer)
**Effective:** 2026-05-17
**Review cadence:** Annually + after every Sev 1 incident. Next review: 2027-05-17 (or sooner if invoked).
**Maps to SOC 2 TSC:** CC7.3, CC7.4, CC7.5

## 1 · Purpose

Define how X3 Compass detects, responds to, contains, recovers from, and learns from security and availability incidents. The plan assumes a single on-call (Joshua) today and is written so the same playbook works as the team grows.

## 2 · Scope

Any event affecting:

- **Confidentiality** of customer data (unauthorized read or exfiltration)
- **Integrity** of customer data (unauthorized write, corruption, deletion)
- **Availability** of customer-facing services (`x3compass.com`, `app.x3compass.com`, `/api/ask`, billing, login)
- **The eCFR-citation pipeline** producing materially wrong compliance answers to customers

Vendor outages affecting customers are in scope when they hit our customer-facing surface.

## 3 · Severity tiers

| Sev | Definition | Examples | Customer comms |
|-----|------------|----------|----------------|
| **P1 — Critical** | Confirmed data breach OR full production outage > 15 min OR any incident requiring customer notification under our DPA | Supabase data leak; Pages-wide 5xx; Stripe webhook delivers a real payment to wrong carrier; AI brain serves a hallucinated CFR citation to a customer in a regulated answer | Status page within 1 hour; per-customer email within 24 hours; full disclosure within 72 hours |
| **P2 — High** | Partial outage > 30 min OR degraded experience for > 25% of users OR security-relevant near-miss | `/api/ask` 5xx for one cohort; Checkr webhook backlog > 1 hour; SSO broken for a single carrier | Status page within 2 hours; affected-cohort email within 24 hours |
| **P3 — Moderate** | Functional bug, no customer data at risk, no service-wide impact | Wrong number in a dashboard widget; cosmetic break on /partners | Resolved in next deploy; no individual comms |
| **P4 — Low** | Internal-only or non-customer-visible | Doctor agent runs over budget; flaky journey probe | Logged, not escalated |

## 4 · Detection sources (Fort Knox v4)

The Fort Knox stack already does the detection work. Sources, in order of trust:

1. **Uptime workflow** — synthetic checks against `x3compass.com`, `/api/ask`, `/api/ask-demo`, `/api/health`. Failures fire the doctor.
2. **Journey probes** — Playwright runs that simulate sign-up to /app/ask to audit export. A break here is treated as P1 until proven otherwise.
3. **Deploy watcher** — every Cloudflare Pages deploy is verified by hitting 5 canary URLs. A bad deploy auto-pages.
4. **Vendor pollers** — Supabase, Cloudflare, Stripe, Anthropic, Checkr status pages. Vendor incidents become our incidents the moment they affect customers.
5. **Client error aggregator** — JS errors and `/api/ask` 5xx batches by signature; threshold crossings fire alerts.
6. **eCFR citation verifier** — every Ask Compass response is round-tripped to eCFR.gov. A drop in verification rate fires a P1 ML/content alert.
7. **Customer reports** — `support@x3compass.com`, in-app feedback. Treated as P2 until triaged.
8. **External security report** — `security@x3compass.com`. P1 until proven lower.

## 5 · Roles

Today: every role below is Joshua. As the team grows, each role gets a named owner and a backup.

- **Incident Commander (IC).** Runs the response, holds the timeline, decides severity, owns customer comms.
- **Technical Lead (TL).** Drives the investigation, makes fix-vs-rollback calls, runs the runbook commands.
- **Communications Lead (CL).** Owns the status page, the per-customer email, the public postmortem. Reports to IC.
- **Scribe.** Records timeline, decisions, evidence as the incident unfolds.

For a P1 the IC and TL must be different people once a second hire exists.

## 6 · Playbook (P1)

The Fort Knox **doctor agent** drives the first 15 minutes automatically. The human playbook starts when the doctor escalates or when the incident is reported by a customer.

### Minute 0–5 — Detect & declare

1. Acknowledge the alert.
2. Declare severity in the response channel (today: a private GitHub issue tagged `incident-p1`; later: dedicated Slack/PagerDuty).
3. Start the incident timeline in `incidents/{YYYY-MM-DD}-{slug}.md`.
4. Snapshot the relevant Cloudflare deploy ID, Supabase migration ID, and the last 50 lines of the doctor's log into the timeline.

### Minute 5–30 — Contain

5. If a bad deploy is the suspected cause: **roll back** to the last green Cloudflare Pages deploy. This is the default first move because it's reversible and fast.
6. If the issue is a vendor outage: confirm on the vendor's status page, post our status, and pause any retries that could amplify their problem.
7. If confidentiality is suspected (a leak), **rotate every key in scope first**, then investigate. Order is fixed: rotate first, investigate second. Loss of a key never blocks a rollback.
8. If integrity is suspected (a bad write), pause the upstream job that produced the writes. Do not delete evidence.

### Minute 30+ — Eradicate, recover, document

9. Identify root cause. Write it down before fixing. The fix that lands without a written root cause goes back to staging.
10. Deploy the fix to staging, run the journey probes, then promote to production.
11. Re-run the verification: uptime green, journey probes green, eCFR verifier green.
12. Update the public status page with "Resolved" and a one-paragraph summary.

### Within 72 hours — Postmortem

13. Write a blameless postmortem in `incidents/{YYYY-MM-DD}-{slug}.md`. Required sections: timeline, impact (customers affected, data affected, dollars), root cause, contributing factors, what went well, what went badly, action items with owners and due dates.
14. File each action item as a tracked task. Don't close the incident until every action item is either done or has a committed completion date.
15. Publish a public version on the `/changelog` if the incident was visible to customers.

## 7 · Customer notification under the DPA

When customer data is confirmed exposed (read, modified, or exfiltrated by an unauthorized party):

- **Within 72 hours** of confirmation: notify every affected carrier admin by email. The notice includes: what data, when, what we've done, what they should do.
- **Concurrently:** notify any regulatory body required by the carrier's jurisdiction. We support carrier-led notification — we provide them the facts and the templates.
- **Records:** all notifications are logged in `compliance/soc2/incident-notifications/`.

## 8 · The eCFR-accuracy carve-out

X3 Compass's product promise is that every regulatory answer carries a real, verified CFR citation. A material failure of that promise is itself an incident, not just a bug.

Triggers:

- The daily citation verifier drops below 95% verified citations in a 1,000-answer rolling window
- A customer reports an answer with a hallucinated citation (citation not present in eCFR or text does not match)
- The CFR eval harness regression score drops by > 5 points

Response: same severity matrix. P1 if the failure is reaching production answers; P2 if caught upstream (eval harness, staging).

## 9 · Drills

We will run at least two tabletop incident drills per year, scenarios pulled from real risks in the register:

- "Supabase service-role key is leaked in a GitHub issue"
- "Cloudflare is down for 4 hours — what happens to billing, support, and customer comms"
- "Customer reports the AI brain told them the wrong driver disqualification rule"

Drill results are documented in `compliance/soc2/drills/` and feed back into this policy.

## 10 · Change history

| Date       | Author  | Change |
|------------|---------|--------|
| 2026-05-17 | Joshua  | Initial version (Sprint #9, SOC 2 prep) |
