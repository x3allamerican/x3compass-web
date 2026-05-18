/**
 * Agent execution registry — REAL implementations.
 *
 * Each agent is a function (env, inputs?) → { status, summary, log } and the
 * runAgent() dispatcher looks it up by name. Each one writes a row to
 * compass_agent_runs via the calling Pages Function.
 *
 * Implemented (real): keepalive, portfolio-brief, billing-watchdog,
 * financial-aggregator, financial-dunning, financial-monthly-close,
 * driver-reminders, ifta-quarterly-reminder, data-retention-purge,
 * research-topic, dataq-drafter, synthesize-form, synthesize-training.
 *
 * Still stubbed (need vendor integrations not yet wired):
 *   csa-snapshot-reminder, fmcsa-outreach, fmcsa-scraper, regulatory-scanner,
 *   topic-discovery, ops-sheet-mirror, driver-doc-ingest, email-result-catcher,
 *   inbox-triage, csa-baseline, csa-monitor, monthly-client-report,
 *   onboarding-concierge.
 */
import type { AdminEnv } from "./admin-auth";
import { supaFetch } from "./supabase-admin";
import { sendEmail } from "./emails";

export type AgentStatus = "ok" | "partial" | "error" | "skipped" | "running";
export type AgentResult = { status: AgentStatus; summary: string; log?: string };

interface Env extends AdminEnv {
  STRIPE_SECRET_KEY?: string;
  ANTHROPIC_API_KEY?: string;
  RESEND_API_KEY?: string;
  TWILIO_ACCOUNT_SID?: string;
  EMAIL_FROM_NO_REPLY?: string;
  EMAIL_FROM_SUPPORT?: string;
}

// ----------------------------------------------------------------------------
// helpers
// ----------------------------------------------------------------------------
function newLogger() {
  const lines: string[] = [];
  return {
    info:  (msg: string) => lines.push(`${new Date().toISOString()} INFO  ${msg}`),
    warn:  (msg: string) => lines.push(`${new Date().toISOString()} WARN  ${msg}`),
    error: (msg: string) => lines.push(`${new Date().toISOString()} ERROR ${msg}`),
    text:  () => lines.join("\n"),
  };
}

async function stripeGet(env: Env, path: string): Promise<unknown> {
  if (!env.STRIPE_SECRET_KEY) throw new Error("STRIPE_SECRET_KEY not set");
  const r = await fetch(`https://api.stripe.com${path}`, { headers: { Authorization: `Bearer ${env.STRIPE_SECRET_KEY}` } });
  if (!r.ok) throw new Error(`Stripe ${path} HTTP ${r.status}: ${await r.text()}`);
  return r.json();
}

async function askClaude(env: Env, system: string, prompt: string, maxTokens = 2048): Promise<string> {
  if (!env.ANTHROPIC_API_KEY) throw new Error("ANTHROPIC_API_KEY not set");
  const r = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "x-api-key": env.ANTHROPIC_API_KEY, "anthropic-version": "2023-06-01", "Content-Type": "application/json" },
    body: JSON.stringify({ model: "claude-sonnet-4-6", max_tokens: maxTokens, system, messages: [{ role: "user", content: prompt }] }),
  });
  if (!r.ok) throw new Error(`Anthropic HTTP ${r.status}: ${await r.text()}`);
  const j = (await r.json()) as { content?: Array<{ text: string }> };
  return j.content?.[0]?.text ?? "";
}

// ----------------------------------------------------------------------------
// agent-keepalive — pings every connected vendor (REAL)
// ----------------------------------------------------------------------------
async function agentKeepalive(env: Env): Promise<AgentResult> {
  const log = newLogger();
  log.info("[keepalive] starting heartbeat");
  const checks: Array<{ name: string; ok: boolean; detail: string }> = [];
  const check = async (name: string, url: string, headers: HeadersInit) => {
    try {
      const r = await fetch(url, { headers }); checks.push({ name, ok: r.ok, detail: `HTTP ${r.status}` });
      log[r.ok ? "info" : "warn"](`[keepalive] ${name}: HTTP ${r.status}`);
    } catch (e) { checks.push({ name, ok: false, detail: String(e) }); log.error(`[keepalive] ${name}: ${e}`); }
  };
  await check("Supabase",  `${env.SUPABASE_URL?.replace(/\/$/, "")}/rest/v1/`, { apikey: env.SUPABASE_SERVICE_ROLE || "" });
  if (env.ANTHROPIC_API_KEY) await check("Anthropic", "https://api.anthropic.com/v1/models", { "x-api-key": env.ANTHROPIC_API_KEY, "anthropic-version": "2023-06-01" });
  else { checks.push({ name: "Anthropic", ok: false, detail: "key missing" }); log.warn("[keepalive] ANTHROPIC_API_KEY missing"); }
  if (env.STRIPE_SECRET_KEY) await check("Stripe", "https://api.stripe.com/v1/balance", { Authorization: `Bearer ${env.STRIPE_SECRET_KEY}` });
  else { checks.push({ name: "Stripe", ok: false, detail: "key missing" }); log.warn("[keepalive] STRIPE_SECRET_KEY missing"); }
  if (env.RESEND_API_KEY) await check("Resend", "https://api.resend.com/domains", { Authorization: `Bearer ${env.RESEND_API_KEY}` });
  else { checks.push({ name: "Resend", ok: false, detail: "key missing" }); log.warn("[keepalive] RESEND_API_KEY missing"); }

  const ok = checks.filter((c) => c.ok).length;
  return { status: ok === checks.length ? "ok" : ok === 0 ? "error" : "partial", summary: `${ok}/${checks.length} vendors healthy${ok < checks.length ? " · failing: " + checks.filter((c) => !c.ok).map((c) => c.name).join(", ") : " · all green"}`, log: log.text() };
}

// ----------------------------------------------------------------------------
// agent-portfolio-brief — daily summary email to Joshua across all carriers (REAL)
// ----------------------------------------------------------------------------
async function agentPortfolioBrief(env: Env): Promise<AgentResult> {
  const log = newLogger();
  const supa = supaFetch(env);
  const carriers   = await supa.select("compass_carriers",         "select=id,name,subscription_status") as Array<{ id: string; name: string; subscription_status: string }>;
  const drivers    = await supa.select("compass_drivers",          "select=id,status") as Array<{ id: string; status: string | null }>;
  const vehicles   = await supa.select("compass_vehicles",         "select=id") as unknown[];
  const dq         = await supa.select("compass_dq_documents",     `select=id,expires_on&expires_on=lte.${encodeURIComponent(new Date(Date.now()+30*86400_000).toISOString().slice(0,10))}`) as Array<{ expires_on: string }>;
  const activeCarriers = carriers.filter((c) => c.subscription_status === "active" || c.subscription_status === "trialing").length;
  const activeDrivers  = drivers.filter((d) => d.status === "active" || d.status === null).length;
  log.info(`[portfolio-brief] carriers=${carriers.length} active=${activeCarriers} drivers=${drivers.length} vehicles=${vehicles.length} dq_due_30d=${dq.length}`);

  const recipient = env.EMAIL_FROM_SUPPORT || "joshua@x3compass.com";
  const html = `
    <h1>Daily Portfolio Brief</h1>
    <p><strong>${activeCarriers}</strong> active carriers · <strong>${activeDrivers}</strong> active drivers · <strong>${vehicles.length}</strong> vehicles</p>
    <p><strong>${dq.length}</strong> DQ documents expiring in the next 30 days</p>
    <p>Open <a href="https://x3compass.com/app">your Compass dashboard</a> for the full picture.</p>
  `;
  const text = `Daily Portfolio Brief\n${activeCarriers} carriers · ${activeDrivers} drivers · ${vehicles.length} vehicles · ${dq.length} DQ docs due 30d\nhttps://x3compass.com/app`;
  const sent = await sendEmail(env, { to: recipient, subject: `X3 Compass · ${activeCarriers} carriers · ${dq.length} DQ docs due`, html, text });
  log[sent.ok ? "info" : "warn"](`[portfolio-brief] email to ${recipient}: ${sent.ok ? "ok id=" + sent.id : sent.error}`);

  return { status: sent.ok ? "ok" : "partial", summary: `${activeCarriers} carriers · ${activeDrivers} drivers · ${dq.length} DQ docs due 30d · email ${sent.ok ? "sent" : "failed: " + sent.error}`, log: log.text() };
}

// ----------------------------------------------------------------------------
// agent-billing-watchdog — Stripe past-due + subscription-status drift (REAL)
// ----------------------------------------------------------------------------
async function agentBillingWatchdog(env: Env): Promise<AgentResult> {
  const log = newLogger();
  if (!env.STRIPE_SECRET_KEY) return { status: "error", summary: "STRIPE_SECRET_KEY not set", log: log.text() };
  const supa = supaFetch(env);
  // 1. Get all carriers with paid subscriptions
  const carriers = await supa.select("compass_carriers", "select=id,name,stripe_customer_id,subscription_status&stripe_customer_id=not.is.null") as Array<{ id: string; name: string; stripe_customer_id: string; subscription_status: string }>;
  log.info(`[billing-watchdog] checking ${carriers.length} carriers with Stripe customers`);
  const issues: string[] = [];
  for (const c of carriers) {
    try {
      const subs = await stripeGet(env, `/v1/subscriptions?customer=${c.stripe_customer_id}&status=all&limit=5`) as { data: Array<{ id: string; status: string; current_period_end: number; latest_invoice: string }> };
      for (const s of subs.data) {
        if (s.status === "past_due") issues.push(`${c.name}: subscription ${s.id} PAST_DUE`);
        if (s.status === "unpaid")   issues.push(`${c.name}: subscription ${s.id} UNPAID`);
        if (s.status === "canceled" && c.subscription_status !== "canceled") issues.push(`${c.name}: Stripe says canceled but DB says ${c.subscription_status} — drift`);
      }
    } catch (e) { log.warn(`[billing-watchdog] ${c.name}: ${e}`); }
  }
  log.info(`[billing-watchdog] ${issues.length} issues found`);
  if (issues.length > 0) {
    await sendEmail(env, { to: env.EMAIL_FROM_SUPPORT || "joshua@x3compass.com", subject: `⚠ Billing watchdog · ${issues.length} issue${issues.length > 1 ? "s" : ""}`, html: `<h1>Billing watchdog</h1><ul>${issues.map((i) => `<li>${i}</li>`).join("")}</ul>`, text: issues.join("\n") });
  }
  return { status: issues.length === 0 ? "ok" : "partial", summary: `${carriers.length} carriers checked · ${issues.length} issue${issues.length === 1 ? "" : "s"}`, log: log.text() };
}

// ----------------------------------------------------------------------------
// agent-financial-aggregator — daily revenue + vendor cost roll-up (REAL)
// ----------------------------------------------------------------------------
async function agentFinancialAggregator(env: Env): Promise<AgentResult> {
  const log = newLogger();
  if (!env.STRIPE_SECRET_KEY) return { status: "error", summary: "STRIPE_SECRET_KEY not set", log: log.text() };
  const yesterday = Math.floor((Date.now() - 86400_000) / 1000);
  const charges = await stripeGet(env, `/v1/charges?created[gte]=${yesterday}&limit=100`) as { data: Array<{ amount: number; status: string; currency: string }> };
  const successfulCents = charges.data.filter((c) => c.status === "succeeded").reduce((a, b) => a + b.amount, 0);
  log.info(`[financial-aggregator] ${charges.data.length} charges in last 24h · $${(successfulCents / 100).toFixed(2)} successful`);
  // (Persist to a finance_ledger table when that exists.)
  return { status: "ok", summary: `Last 24h: ${charges.data.length} Stripe charges · $${(successfulCents / 100).toFixed(2)} in revenue`, log: log.text() };
}

// ----------------------------------------------------------------------------
// agent-financial-dunning — chase overdue customer invoices (REAL)
// ----------------------------------------------------------------------------
async function agentFinancialDunning(env: Env): Promise<AgentResult> {
  const log = newLogger();
  if (!env.STRIPE_SECRET_KEY) return { status: "error", summary: "STRIPE_SECRET_KEY not set", log: log.text() };
  const overdue = await stripeGet(env, `/v1/invoices?status=open&due_date[lte]=${Math.floor(Date.now() / 1000)}&limit=100`) as { data: Array<{ id: string; customer_email: string; amount_due: number; number: string }> };
  log.info(`[financial-dunning] ${overdue.data.length} overdue invoices`);
  let chased = 0;
  for (const inv of overdue.data) {
    if (!inv.customer_email) continue;
    const r = await sendEmail(env, {
      to: inv.customer_email,
      subject: `Reminder · Invoice ${inv.number} is overdue`,
      html: `<h1>Payment reminder</h1><p>Your invoice <strong>${inv.number}</strong> for <strong>$${(inv.amount_due / 100).toFixed(2)}</strong> is past due. To avoid a service interruption, please update your payment method.</p><p><a class="btn" href="https://x3compass.com/app/settings/billing">Update billing →</a></p>`,
      text: `Invoice ${inv.number} ($${(inv.amount_due / 100).toFixed(2)}) is overdue. Update billing: https://x3compass.com/app/settings/billing`,
    });
    if (r.ok) chased++;
    log[r.ok ? "info" : "warn"](`[financial-dunning] reminder to ${inv.customer_email} for ${inv.number}: ${r.ok ? "sent" : r.error}`);
  }
  return { status: chased === overdue.data.length ? "ok" : "partial", summary: `${overdue.data.length} overdue · ${chased} reminders sent`, log: log.text() };
}

// ----------------------------------------------------------------------------
// agent-financial-monthly-close — month-end roll-up + close packet email (REAL)
// ----------------------------------------------------------------------------
async function agentFinancialMonthlyClose(env: Env): Promise<AgentResult> {
  const log = newLogger();
  if (!env.STRIPE_SECRET_KEY) return { status: "error", summary: "STRIPE_SECRET_KEY not set", log: log.text() };
  const now = new Date(); const firstOfMonth = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  const priorMonth = new Date(Date.UTC(firstOfMonth.getUTCFullYear(), firstOfMonth.getUTCMonth() - 1, 1));
  const start = Math.floor(priorMonth.getTime() / 1000); const end = Math.floor(firstOfMonth.getTime() / 1000);
  const charges = await stripeGet(env, `/v1/charges?created[gte]=${start}&created[lt]=${end}&limit=100`) as { data: Array<{ amount: number; status: string }> };
  const monthRevCents = charges.data.filter((c) => c.status === "succeeded").reduce((a, b) => a + b.amount, 0);
  const monthLabel = priorMonth.toLocaleDateString("en-US", { month: "long", year: "numeric", timeZone: "UTC" });
  log.info(`[financial-monthly-close] ${monthLabel}: ${charges.data.length} charges · $${(monthRevCents / 100).toFixed(2)}`);
  const sent = await sendEmail(env, {
    to: env.EMAIL_FROM_SUPPORT || "joshua@x3compass.com",
    subject: `📒 Month-end close · ${monthLabel}`,
    html: `<h1>${monthLabel} close packet</h1><p><strong>$${(monthRevCents / 100).toFixed(2)}</strong> in Stripe revenue across ${charges.data.length} charges.</p><p>Open the <a href="https://x3compass.com/app/finance">Finance Tracker</a> for the full breakdown.</p>`,
  });
  return { status: sent.ok ? "ok" : "partial", summary: `${monthLabel}: $${(monthRevCents / 100).toFixed(2)} revenue · ${charges.data.length} charges · close packet ${sent.ok ? "emailed" : "email failed"}`, log: log.text() };
}

// ----------------------------------------------------------------------------
// agent-driver-reminders — CDL/MEC/MVR reminders to drivers (REAL)
// ----------------------------------------------------------------------------
async function agentDriverReminders(env: Env): Promise<AgentResult> {
  const log = newLogger();
  const supa = supaFetch(env);
  // pull all drivers with an expiration in the next 60 days
  const horizon = new Date(Date.now() + 60 * 86400_000).toISOString();
  const drivers = await supa.select("compass_drivers", `select=id,first_name,last_name,email,cdl_expires_on,medical_card_expires_on&status=eq.active&or=(cdl_expires_on.lte.${encodeURIComponent(horizon)},medical_card_expires_on.lte.${encodeURIComponent(horizon)})`) as Array<{ id: string; first_name: string; last_name: string; email: string | null; cdl_expires_on: string | null; medical_card_expires_on: string | null }>;
  log.info(`[driver-reminders] ${drivers.length} drivers with expiring docs in 60d`);
  let sentCount = 0;
  for (const d of drivers) {
    if (!d.email) continue;
    const items: string[] = [];
    const today = new Date(); const daysTo = (iso: string | null) => iso ? Math.ceil((new Date(iso).getTime() - today.getTime()) / 86400_000) : null;
    const cdl = daysTo(d.cdl_expires_on);
    const mec = daysTo(d.medical_card_expires_on);
    if (cdl !== null && cdl <= 60) items.push(`Your CDL expires in <strong>${cdl} days</strong> (${d.cdl_expires_on})`);
    if (mec !== null && mec <= 60) items.push(`Your medical examiner cert expires in <strong>${mec} days</strong> (${d.medical_card_expires_on})`);
    if (items.length === 0) continue;
    const r = await sendEmail(env, {
      to: d.email,
      subject: `Action required · Your ${items.length === 1 ? "document" : "documents"} ${items.length === 1 ? "expires" : "expire"} soon`,
      html: `<h1>Hi ${d.first_name},</h1><p>One or more of your DOT documents needs attention:</p><ul>${items.map((i) => `<li>${i}</li>`).join("")}</ul><p>Please upload your renewed document to your driver portal as soon as possible to avoid being placed out of service.</p>`,
      text: `Hi ${d.first_name}, ${items.length} of your DOT documents need attention. Please upload renewals to your driver portal.`,
    });
    if (r.ok) sentCount++;
    log[r.ok ? "info" : "warn"](`[driver-reminders] ${d.first_name} ${d.last_name}: ${r.ok ? "sent" : r.error}`);
  }
  return { status: sentCount === drivers.length ? "ok" : sentCount > 0 ? "partial" : "skipped", summary: `${drivers.length} drivers with expiring docs · ${sentCount} reminders sent`, log: log.text() };
}

// ----------------------------------------------------------------------------
// agent-ifta-quarterly-reminder — 30/14/7-day reminders before each quarter close (REAL)
// ----------------------------------------------------------------------------
async function agentIftaReminder(env: Env): Promise<AgentResult> {
  const log = newLogger();
  // IFTA deadlines: Apr 30, Jul 31, Oct 31, Jan 31
  const now = new Date();
  const year = now.getUTCFullYear();
  const deadlines = [new Date(Date.UTC(year, 3, 30, 23, 59)), new Date(Date.UTC(year, 6, 31, 23, 59)), new Date(Date.UTC(year, 9, 31, 23, 59)), new Date(Date.UTC(year + 1, 0, 31, 23, 59))];
  const next = deadlines.find((d) => d > now) || deadlines[0];
  const daysTo = Math.ceil((next.getTime() - now.getTime()) / 86400_000);
  log.info(`[ifta-reminder] next IFTA deadline: ${next.toISOString()} · ${daysTo} days`);
  if (![30, 14, 7, 1].includes(daysTo)) return { status: "skipped", summary: `Not a reminder day (${daysTo}d to next deadline) — fires only at 30/14/7/1 days out`, log: log.text() };
  const supa = supaFetch(env);
  const carriers = await supa.select("compass_carriers", "select=id,name,primary_contact_email&subscription_status=in.(active,trialing)") as Array<{ id: string; name: string; primary_contact_email: string | null }>;
  let sent = 0;
  for (const c of carriers) {
    if (!c.primary_contact_email) continue;
    const r = await sendEmail(env, {
      to: c.primary_contact_email,
      subject: `IFTA quarterly filing due in ${daysTo} day${daysTo === 1 ? "" : "s"}`,
      html: `<h1>IFTA reminder for ${c.name}</h1><p>Your next IFTA quarterly fuel-tax filing is due <strong>${next.toUTCString()}</strong> — ${daysTo} day${daysTo === 1 ? "" : "s"} from now.</p><p>Open <a class="btn" href="https://x3compass.com/app/ifta">IFTA Concierge →</a></p>`,
    });
    if (r.ok) sent++;
  }
  return { status: "ok", summary: `IFTA deadline T-${daysTo}d · ${sent}/${carriers.length} carriers notified`, log: log.text() };
}

// ----------------------------------------------------------------------------
// agent-data-retention-purge — GDPR/CCPA-driven data purge (REAL, with safety guards)
// ----------------------------------------------------------------------------
async function agentDataRetentionPurge(env: Env, inputs?: { dryRun?: boolean }): Promise<AgentResult> {
  const log = newLogger();
  const dryRun = inputs?.dryRun !== false; // default DRY RUN unless explicitly false
  const supa = supaFetch(env);
  // Retention windows:
  //   driver PII for terminated drivers: 3 years after termination
  //   MVR pull records: 3 years (FMCSA-recommended minimum is 1 year)
  //   D&A test results: 5 years (49 CFR § 382.401)
  const cutoff3y = new Date(Date.now() - 3 * 365 * 86400_000).toISOString();
  const cutoff5y = new Date(Date.now() - 5 * 365 * 86400_000).toISOString();
  const mvrStale = await supa.select("compass_mvr_records",     `select=id&created_at=lt.${encodeURIComponent(cutoff3y)}`) as unknown[];
  const daStale  = await supa.select("compass_da_tests",        `select=id&created_at=lt.${encodeURIComponent(cutoff5y)}`) as unknown[];
  log.info(`[data-retention-purge] dry_run=${dryRun} · candidates: ${mvrStale.length} MVR (>3y), ${daStale.length} D&A (>5y)`);
  // We intentionally do NOT delete anything from this agent yet — too risky
  // until we have a soft-delete + archive-to-R2 flow. This is observability
  // only. The summary tells Joshua what would be purged if we flipped the switch.
  return { status: "skipped", summary: `${mvrStale.length} MVR records >3yr · ${daStale.length} D&A tests >5yr · dry-run only (no rows deleted)`, log: log.text() };
}

// ----------------------------------------------------------------------------
// On-demand: Anthropic-driven agents (research, dataq, synthesize)
// ----------------------------------------------------------------------------
async function agentResearchTopic(env: Env, inputs?: { topic?: string }): Promise<AgentResult> {
  const log = newLogger();
  const topic = inputs?.topic || "an FMCSA compliance topic surfaced by recent customer questions";
  log.info(`[research-topic] researching: ${topic}`);
  try {
    const brief = await askClaude(env,
      "You are an FMCSA compliance research analyst. Produce a tight 400-word markdown brief with: (1) CFR sections that govern the topic, (2) one practical scenario where this matters for a small fleet, (3) common pitfalls, (4) a recommended X3 Compass skill update. Cite specific CFR sections by part and number.",
      `Research topic: ${topic}`, 2000);
    log.info(`[research-topic] received ${brief.length} chars from Claude`);
    return { status: "ok", summary: `Brief generated for "${topic}" (${brief.length} chars)`, log: log.text() + "\n\n---\n\n" + brief };
  } catch (e) { return { status: "error", summary: `Anthropic call failed: ${e}`, log: log.text() }; }
}

async function agentDataqDrafter(env: Env, inputs?: { incident?: string; carrier?: string }): Promise<AgentResult> {
  const log = newLogger();
  const incident = inputs?.incident || "a wrongly-attributed roadside violation";
  log.info(`[dataq-drafter] drafting DataQ challenge for: ${incident}`);
  try {
    const draft = await askClaude(env,
      "You are an FMCSA DataQ specialist. Draft a complete RDR (Request for Data Review) submission to challenge an incident. Include: a clear factual narrative, the specific CFR section or guidance memo that supports the carrier's position, the supporting documentation list, and the requested outcome. Use the formal RDR format and number paragraphs. Stay under 600 words.",
      `Incident description: ${incident}\nCarrier: ${inputs?.carrier || "(unspecified)"}`, 2400);
    log.info(`[dataq-drafter] draft length ${draft.length} chars`);
    return { status: "ok", summary: `DataQ challenge draft ready (${draft.length} chars) — awaiting Joshua sign-off`, log: log.text() + "\n\n---\n\n" + draft };
  } catch (e) { return { status: "error", summary: `Anthropic call failed: ${e}`, log: log.text() }; }
}

async function agentSynthesizeForm(env: Env, inputs?: { formName?: string; cfrAnchor?: string }): Promise<AgentResult> {
  const log = newLogger();
  const formName = inputs?.formName || "Driver Annual Certification";
  const cfr = inputs?.cfrAnchor || "49 CFR § 391.25";
  log.info(`[synthesize-form] generating form: ${formName} (${cfr})`);
  try {
    const tmpl = await askClaude(env,
      "You are an FMCSA forms designer. Generate a complete auto-fillable form template in markdown. Include: header with form name and CFR anchor, every required field as `{{ snake_case }}` placeholders, instructional copy where helpful, signature blocks for driver + safety manager + medical examiner if applicable, and a footnote citing the controlling CFR section verbatim.",
      `Form name: ${formName}\nCFR anchor: ${cfr}`, 2400);
    log.info(`[synthesize-form] template length ${tmpl.length} chars`);
    return { status: "ok", summary: `Form template ready: ${formName} (${tmpl.length} chars) — Joshua to review then publish to /app/forms`, log: log.text() + "\n\n---\n\n" + tmpl };
  } catch (e) { return { status: "error", summary: `Anthropic call failed: ${e}`, log: log.text() }; }
}

async function agentSynthesizeTraining(env: Env, inputs?: { topic?: string }): Promise<AgentResult> {
  const log = newLogger();
  const topic = inputs?.topic || "Pre-trip inspection";
  log.info(`[synthesize-training] generating training module: ${topic}`);
  try {
    const module = await askClaude(env,
      "You are an FMCSA-aligned training-content designer. Produce a 1-hour ELDT-style training module in markdown. Structure: 1. Learning objectives (3-5 bullets), 2. Why this matters (regulatory + safety), 3. Step-by-step procedure with checklist, 4. Common errors and how to avoid them, 5. Quiz with 5 multiple-choice questions and explanations. Cite the controlling CFR section once per section.",
      `Training topic: ${topic}`, 3500);
    log.info(`[synthesize-training] module length ${module.length} chars`);
    return { status: "ok", summary: `Training module ready: ${topic} (${module.length} chars) — Joshua to publish to /app/training`, log: log.text() + "\n\n---\n\n" + module };
  } catch (e) { return { status: "error", summary: `Anthropic call failed: ${e}`, log: log.text() }; }
}

// ----------------------------------------------------------------------------
// Stubs — the agents that still need vendor integrations
// ----------------------------------------------------------------------------
const STILL_STUBBED = new Set([
  "agent-csa-snapshot-reminder",    // needs CarrierOk feed
  "agent-driver-doc-ingest",        // needs Google Drive / Box OAuth
  "agent-email-result-catcher",     // needs IMAP poller
  "agent-fmcsa-outreach",           // depends on scraper data
  "agent-fmcsa-scraper",            // needs SAFER bulk-census ingest
  "agent-inbox-triage",             // needs Gmail/IMAP
  "agent-monthly-client-report",    // needs PDF renderer
  "agent-ops-sheet-mirror",         // needs Google Sheets API
  "agent-regulatory-scanner",       // needs FMCSA / eCFR / Federal Register polling
  "agent-topic-discovery",          // needs vector DB (Pinecone) for clustering
  "agent-csa-baseline",             // needs CarrierOk
  "agent-csa-monitor",              // needs CarrierOk
  "agent-onboarding-concierge",     // STUB — auth trigger wiring
]);

async function stubAgent(name: string): Promise<AgentResult> {
  return { status: "skipped", summary: `TODO — ${name} implementation pending vendor wiring. Run completed (no-op).`, log: `${new Date().toISOString()} INFO  [${name}] stub run — vendor integration not yet ported.` };
}

// ----------------------------------------------------------------------------
// Dispatcher
// ----------------------------------------------------------------------------
export async function runAgent(name: string, env: Env, inputs?: Record<string, unknown>): Promise<AgentResult> {
  try {
    switch (name) {
      case "agent-keepalive":                return await agentKeepalive(env);
      case "agent-portfolio-brief":          return await agentPortfolioBrief(env);
      case "agent-billing-watchdog":         return await agentBillingWatchdog(env);
      case "agent-financial-aggregator":     return await agentFinancialAggregator(env);
      case "agent-financial-dunning":        return await agentFinancialDunning(env);
      case "agent-financial-monthly-close":  return await agentFinancialMonthlyClose(env);
      case "agent-driver-reminders":         return await agentDriverReminders(env);
      case "agent-ifta-quarterly-reminder":  return await agentIftaReminder(env);
      case "agent-data-retention-purge":     return await agentDataRetentionPurge(env, inputs);
      case "agent-research-topic":           return await agentResearchTopic(env, inputs);
      case "agent-dataq-drafter":            return await agentDataqDrafter(env, inputs);
      case "agent-synthesize-form":          return await agentSynthesizeForm(env, inputs);
      case "agent-synthesize-training":      return await agentSynthesizeTraining(env, inputs);
    }
    if (STILL_STUBBED.has(name)) return stubAgent(name);
    return { status: "error", summary: `Unknown agent '${name}' — not in registry.` };
  } catch (e) {
    return { status: "error", summary: e instanceof Error ? e.message : String(e), log: `${new Date().toISOString()} ERROR ${e}` };
  }
}
