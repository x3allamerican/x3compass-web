# X3 Compass — SOC 2 Type II Controls Matrix

**Last reviewed:** 2026-05-17  ·  **Owner:** Joshua Kovarik  ·  **Target attestation:** Q4 2026

This document maps every applicable AICPA SOC 2 Trust Services Criterion (2017 TSC, updated 2022) to our concrete implementation, evidence sources, and the gap (if any) we still need to close.

**Scope (Phase 1):** Security TSC only. Availability + Confidentiality + Processing Integrity + Privacy added in Phase 2 once Security is in observation period.

**Audit type:** Type II — 6-12 month observation period required before attestation. Earliest attestation: Q4 2026 (assumes prep complete by end of May 2026, 6-month observation starts June 1).

---

## CC1 — Control Environment

| Ref     | Criterion (paraphrased)                        | Our control                                                                         | Evidence                                                          | Status   | Gap |
|---------|------------------------------------------------|-------------------------------------------------------------------------------------|-------------------------------------------------------------------|----------|-----|
| CC1.1   | Demonstrates commitment to integrity / ethics  | AGENT_SAFETY.md, Code of Conduct, public Trust + Security pages                     | Repo files; /trust + /security                                    | ✅ In place | none |
| CC1.2   | Board exercises oversight                      | LLC Operating Agreement (1 member: Joshua); quarterly self-review documented        | Operating agreement; quarterly review doc                         | ✅ In place | none |
| CC1.3   | Management establishes structure / responsibility | Single-owner LLC; documented owner duties; new-hire role docs as team grows       | This doc; future org chart                                        | ⚠️ Partial | Re-doc on first hire |
| CC1.4   | Demonstrates commitment to competence          | Founder has DOT compliance background + MC-authorized carrier; code review standards | LinkedIn; X3 Fleet Safety LLC USDOT lookup                        | ✅ In place | none |
| CC1.5   | Holds individuals accountable                  | Performance reviews tied to control objectives once team > 1                        | This doc                                                          | ⚠️ Partial | Implement on first hire |

## CC2 — Communication and Information

| Ref     | Criterion                                              | Our control                                                                       | Evidence                                                       | Status      | Gap |
|---------|--------------------------------------------------------|-----------------------------------------------------------------------------------|----------------------------------------------------------------|-------------|-----|
| CC2.1   | Internal information needed for controls               | RUNBOOK.md + AGENT_SAFETY.md + .doctor/playbook.md committed to repo              | Repo                                                           | ✅ In place | none |
| CC2.2   | Communicates to internal users                         | Slack-equivalent during solo phase; documented in Notion as team grows            | Future Notion                                                  | ⚠️ Partial | First hire |
| CC2.3   | Communicates to external users (customers)             | /trust, /security, /changelog, /docs, /help, /case-studies — all public           | These URLs                                                     | ✅ In place | none |

## CC3 — Risk Assessment

| Ref     | Criterion                                          | Our control                                                                                 | Evidence                                       | Status      | Gap |
|---------|----------------------------------------------------|---------------------------------------------------------------------------------------------|-----------------------------------------------|-------------|-----|
| CC3.1   | Specifies risk objectives                          | RISK_REGISTER.md — 12 enumerated risks with likelihood × impact scores                      | compliance/soc2/RISK_REGISTER.md              | ✅ In place | none |
| CC3.2   | Identifies + analyzes risks                        | Quarterly risk-register review by Joshua + (future) head of eng                             | Quarterly review minutes                       | ⚠️ Partial | First quarterly run: 2026-06-30 |
| CC3.3   | Considers fraud                                    | Vendor management, dual-control on production access, audit logs on every write              | compliance/policies/ACCESS_CONTROL_POLICY.md  | ✅ In place | none |
| CC3.4   | Identifies + analyzes change                       | Every prod change is a git commit; commit log = change log                                  | git log + /changelog                          | ✅ In place | none |

## CC4 — Monitoring Activities

| Ref     | Criterion                                  | Our control                                                                            | Evidence                                                | Status      | Gap |
|---------|--------------------------------------------|----------------------------------------------------------------------------------------|---------------------------------------------------------|-------------|-----|
| CC4.1   | Ongoing + separate evaluations             | 8 monitoring workflows (uptime, doctor, journey-probes, vendor-health, etc.)           | .github/workflows/                                      | ✅ In place | none |
| CC4.2   | Communicates deficiencies + tracks         | GitHub Issues with `incident` label; doctor auto-files                                 | Issue tracker                                           | ✅ In place | none |

## CC5 — Control Activities

| Ref     | Criterion                                       | Our control                                                                          | Evidence                                            | Status      | Gap |
|---------|-------------------------------------------------|--------------------------------------------------------------------------------------|-----------------------------------------------------|-------------|-----|
| CC5.1   | Selects + develops control activities           | This controls matrix exists                                                          | This doc                                            | ✅ In place | none |
| CC5.2   | Selects + develops technology controls          | RLS, JWT auth, WAF, TLS 1.3, HMAC webhook verification                                | /security                                           | ✅ In place | none |
| CC5.3   | Deploys via policies + procedures               | AGENT_SAFETY.md, ACCESS_CONTROL_POLICY.md, INCIDENT_RESPONSE_POLICY.md, RUNBOOK.md     | compliance/policies/                                | ✅ In place | none |

## CC6 — Logical and Physical Access Controls

| Ref     | Criterion                                                | Our control                                                                       | Evidence                                                  | Status      | Gap |
|---------|----------------------------------------------------------|-----------------------------------------------------------------------------------|-----------------------------------------------------------|-------------|-----|
| CC6.1   | Logical access — security software, infrastructure        | Cloudflare WAF, Supabase RLS, IP allowlists on admin endpoints                    | /security § 02-04                                          | ✅ In place | none |
| CC6.2   | Prior to issuing access — authorize + register             | New-user invite flow logs to compass_carrier_users with invited_by                | compass_carrier_users.invited_by audit column             | ✅ In place | none |
| CC6.3   | Removes access — revoke when no longer needed              | Quarterly access review; immediate revocation on offboarding                       | Quarterly review minutes (Q3 first review)                | ⚠️ Partial | First quarterly review: 2026-09-30 |
| CC6.4   | Restricts access to information assets — least privilege   | Service-role keys server-side only; users RLS-scoped to their carrier             | Migration history                                          | ✅ In place | none |
| CC6.5   | Discontinues logical + physical protection on disposal     | Account deletion flow purges from active tier in 30 days; encrypted backups age out per Supabase | compass_data_retention.md (next milestone)            | ⚠️ Partial | Write the retention policy doc |
| CC6.6   | Implements logical controls — external                     | Cloudflare WAF on every public endpoint; rate limits on /api/*                    | wrangler.toml, rate-limit code                            | ✅ In place | none |
| CC6.7   | Restricts transmission, movement, removal of info          | TLS 1.3 + HSTS on every endpoint; audit-export ZIPs signed-URL 24h expiry         | /security § 04                                            | ✅ In place | none |
| CC6.8   | Implements controls to prevent + detect unauthorized software | All deploys via main branch + CF Pages; only Joshua can push to main today        | Branch protection + ruleset                               | ✅ In place | none |

## CC7 — System Operations

| Ref     | Criterion                                  | Our control                                                                       | Evidence                                                  | Status      | Gap |
|---------|--------------------------------------------|-----------------------------------------------------------------------------------|-----------------------------------------------------------|-------------|-----|
| CC7.1   | Detects + addresses anomalies              | uptime + journey-probes + Lighthouse CI + axe-core + client-error-spike workflows | .github/workflows/                                        | ✅ In place | none |
| CC7.2   | Monitors externally + internally           | Doctor playbook (14 patterns) + status pages (cloudflarestatus, status.supabase)   | .doctor/playbook.md                                       | ✅ In place | none |
| CC7.3   | Evaluates security events                  | All incident issues labeled `incident`; weekly self-review                         | Issue history                                             | ✅ In place | none |
| CC7.4   | Responds to identified incidents           | INCIDENT_RESPONSE_POLICY.md                                                       | compliance/policies/                                       | ✅ In place | none |
| CC7.5   | Identifies + develops recovery + restoration | Supabase point-in-time recovery; weekly backup sanity check; documented            | Future runbook addition                                   | ⚠️ Partial | Document weekly backup sanity-check procedure |

## CC8 — Change Management

| Ref     | Criterion                                       | Our control                                                                       | Evidence                                                  | Status      | Gap |
|---------|-------------------------------------------------|-----------------------------------------------------------------------------------|-----------------------------------------------------------|-------------|-----|
| CC8.1   | Authorizes, designs, develops, tests, deploys   | Every prod change = git PR; CI runs playwright + axe + lighthouse on push         | .github/workflows/                                        | ✅ In place | none |

## CC9 — Risk Mitigation

| Ref     | Criterion                                       | Our control                                                                       | Evidence                                                  | Status      | Gap |
|---------|-------------------------------------------------|-----------------------------------------------------------------------------------|-----------------------------------------------------------|-------------|-----|
| CC9.1   | Identifies + mitigates business disruption risks | RISK_REGISTER.md + multi-vendor approach (no single point of failure on payment, AI, data) | compliance/soc2/RISK_REGISTER.md                  | ✅ In place | none |
| CC9.2   | Manages vendor + business partner risks         | VENDOR_MANAGEMENT_POLICY.md — DPA on file for every vendor that touches customer data | compliance/policies/                                  | ✅ In place | none |

---

## Summary

**Total CC controls evaluated:** 32 (across CC1-CC9)
- ✅ **In place:** 26 (81%)
- ⚠️ **Partial / gap noted:** 6 (19%)
- ❌ **Not implemented:** 0

**Gaps to close before observation period:**
1. CC1.5 + CC2.2 — first-hire processes (low priority until first hire)
2. CC3.2 — first quarterly risk review (target: 2026-06-30)
3. CC6.3 — first quarterly access review (target: 2026-09-30)
4. CC6.5 — write the data-retention policy doc (target: 2026-06-01)
5. CC7.5 — document weekly backup sanity-check procedure (target: 2026-06-15)

**Next milestone:** Engage SOC 2 auditor for readiness assessment (~$10-15k, target: 2026-07-01). Observation period begins after readiness. Type II report expected Q4 2026.

---

## Maintenance

This document is reviewed:
- **Monthly** by Joshua (first Monday of each month)
- **On every significant control change** (e.g. new vendor added, policy updated, role created)
- **After every customer-impacting incident** (must we add a control to prevent the recurrence?)

A new git commit to this file is the record. The git log of this file is the change history.
