# Vendor Management Policy

**Owner:** Joshua Kovarik (CEO / sole officer)
**Effective:** 2026-05-17
**Review cadence:** Annually + on any new vendor onboarding. Next review: 2027-05-17.
**Maps to SOC 2 TSC:** CC9.2

## 1 · Purpose

X3 Compass is a thin platform on top of a small set of carefully chosen vendors. This policy defines how we evaluate, contract with, monitor, and offboard those vendors so that customer data stays protected at every link in the chain.

## 2 · Sub-processor list (current)

The vendors below process customer data or operate production infrastructure. This list is also published at `/security` (the public version) and is the authoritative reference for the DPA we offer customers.

| Vendor | Purpose | Data category | DPA on file | SOC 2 Type II | Region |
|--------|---------|--------------|-------------|---------------|--------|
| **Supabase** | Postgres database, Auth, Storage | Customer data of record (drivers, vehicles, files) | Yes | Yes (issued by Supabase) | US-East (AWS) |
| **Cloudflare** | Pages, Workers, R2, DNS, WAF, Email Routing | All web traffic + customer documents in R2 | Yes (in Master Subscription Agreement) | Yes (Cloudflare publishes report) | Global edge |
| **Stripe** | Billing, subscriptions, payment processing | Carrier billing record + Stripe customer ID | Yes | Yes | US |
| **Checkr** | FCRA-compliant background checks | Driver PII (SSN-last-4, DOB, license #) | Yes — Subscriber Agreement | Yes | US |
| **Anthropic** | Claude API inference | Only the text the user enters into Ask Compass | Yes — Enterprise terms | Yes — Anthropic publishes report | US |
| **Resend** | Transactional email | Recipient email + message contents (auth links, digest) | Yes | In progress (Resend publishes status) | US |
| **Twilio** | Transactional SMS + STOP handling | Recipient phone, message text | Yes | Yes | US |
| **GitHub** | Source code, GitHub Actions | Source code, CI logs — no customer data | Yes (in GitHub Enterprise terms) | Yes | US |

No vendor on this list is a "data broker" or resells customer data. All sub-processors are bound to written contractual obligations that survive the X3 Compass contract with the customer.

## 3 · Vendor onboarding (new vendor)

Before signing or wiring a new vendor into production, complete this checklist and store the result in `compliance/soc2/vendor-reviews/{vendor}-{YYYY-MM-DD}.md`.

### 3.1 Required materials

- [ ] Most recent SOC 2 Type II report (or equivalent — ISO 27001, etc.). If none, document why we're proceeding and what compensating controls we'll add.
- [ ] Vendor's privacy policy
- [ ] Vendor's security overview / whitepaper
- [ ] DPA / sub-processor agreement signed before any customer data flows
- [ ] Status page URL (we monitor it in Fort Knox)
- [ ] Incident notification SLA in writing
- [ ] Data deletion / export commitment in writing

### 3.2 Risk classification

Each vendor is classified at onboarding:

| Tier | Definition | Examples |
|------|------------|----------|
| **Critical** | Holds customer data of record or is on the critical request path | Supabase, Cloudflare, Stripe |
| **Important** | Processes some customer data, but loss is recoverable | Checkr, Anthropic, Resend, Twilio |
| **Operational** | No customer data; supports internal operations | GitHub Actions, Linear, password manager |

Critical and Important vendors get the full review. Operational vendors get a lightweight check (privacy policy + 2FA enforced for our account).

### 3.3 Approval

For the company as it stands today, Joshua approves every new vendor and records the decision in the vendor review doc. When a security lead is in place, vendor onboarding requires their sign-off as well.

## 4 · Ongoing monitoring

### 4.1 Annual security review

Every Critical and Important vendor is re-reviewed annually:

- Pull the latest SOC 2 Type II report
- Note any qualifications or material exceptions
- Confirm the DPA is still in force and the sub-processor list is unchanged
- Confirm pricing, rate limits, and contractual commitments still match production usage

Results live in `compliance/soc2/vendor-reviews/{vendor}-annual-{YYYY}.md`.

### 4.2 Status page monitoring

Every Critical vendor's status page is polled by the Fort Knox vendor-poller. When any vendor is in `partial_outage` or worse, the doctor agent is notified and the on-call (Joshua) gets a Cloudflare email.

### 4.3 Incident notification SLA

Every Critical and Important vendor has a contractual obligation to notify us of a security incident affecting our data. Our internal SLA in response:

| Vendor severity | Our internal action |
|-----------------|---------------------|
| Confirmed breach affecting our data | Customer notification within 72 hours under our DPA |
| Confirmed breach of vendor's environment, our data not confirmed affected | Internal investigation within 24 hours, customer notification within 7 days if escalates |
| Outage with data exposure unconfirmed | Status update on x3compass.com within 4 hours |

### 4.4 Bus-factor mitigation

The single highest-risk vendor exposure today is **us**: one founder. The vendor list is intentionally small so that if Joshua is hit by a bus, a successor can audit the entire stack in a single weekend.

## 5 · Offboarding a vendor

When a vendor is replaced or removed:

1. Confirm the replacement vendor is fully cut over and tested.
2. Confirm no customer data remains in the old vendor's environment (export + verify deletion in writing).
3. Rotate any keys the old vendor held.
4. Update §2 of this document.
5. Update `/security` public sub-processor list.
6. Send a sub-processor change notice to customers under the DPA (30-day notice).

## 6 · Exceptions

If a vendor is used in production without meeting the onboarding bar, the exception is recorded in `compliance/soc2/exceptions/` with: vendor, gap, compensating control, expected remediation date, and approval signature.

## 7 · Change history

| Date       | Author  | Change |
|------------|---------|--------|
| 2026-05-17 | Joshua  | Initial version (Sprint #9, SOC 2 prep) |
