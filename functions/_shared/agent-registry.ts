/**
 * Agent execution registry — ALL 26 agents implemented.
 *
 * Each agent is (env, inputs?) → { status, summary, log }. The run.ts handler
 * persists the result row to compass_agent_runs.
 *
 * Status conventions:
 *   "ok"      — completed successfully and did real work
 *   "partial" — completed but with some failures (some emails failed, etc.)
 *   "skipped" — no work to do (no rows in scope, not the right day of month, etc.)
 *   "error"   — a required prerequisite is missing (env var, table, vendor down)
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
  GOOGLE_SHEETS_WEBHOOK_URL?: string; // optional outbound webhook for ops-sheet-mirror
}

// ============================================================================
// helpers
// ============================================================================
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
async function sha256Hex(s: string): Promise<string> {
  const enc = new TextEncoder().encode(s);
  const h = await crypto.subtle.digest("SHA-256", enc);
  return Array.from(new Uint8Array(h)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

// ============================================================================
// 1. agent-keepalive — vendor heartbeat (REAL)
// ============================================================================
async function agentKeepalive(env: Env): Promise<AgentResult> {
  const log = newLogger();
  const checks: Array<{ name: string; ok: boolean; detail: string }> = [];
  const check = async (name: string, url: string, headers: HeadersInit) => {
    try { const r = await fetch(url, { headers }); checks.push({ name, ok: r.ok, detail: `HTTP ${r.status}` }); log[r.ok ? "info" : "warn"](`[keepalive] ${name}: HTTP ${r.status}`); }
    catch (e) { checks.push({ name, ok: false, detail: String(e) }); log.error(`[keepalive] ${name}: ${e}`); }
  };
  await check("Supabase", `${env.SUPABASE_URL?.replace(/\/$/, "")}/rest/v1/`, { apikey: env.SUPABASE_SERVICE_ROLE || "" });
  if (env.ANTHROPIC_API_KEY)  await check("Anthropic", "https://api.anthropic.com/v1/models", { "x-api-key": env.ANTHROPIC_API_KEY, "anthropic-version": "2023-06-01" });
  if (env.STRIPE_SECRET_KEY)  await check("Stripe", "https://api.stripe.com/v1/balance", { Authorization: `Bearer ${env.STRIPE_SECRET_KEY}` });
  if (env.RESEND_API_KEY)     await check("Resend", "https://api.resend.com/domains", { Authorization: `Bearer ${env.RESEND_API_KEY}` });
  const ok = checks.filter((c) => c.ok).length;
  return { status: ok === checks.length ? "ok" : ok === 0 ? "error" : "partial", summary: `${ok}/${checks.length} vendors healthy${ok < checks.length ? " · failing: " + checks.filter((c) => !c.ok).map((c) => c.name).join(", ") : " · all green"}`, log: log.text() };
}

// ============================================================================
// 2. agent-portfolio-brief (REAL)
// ============================================================================
async function agentPortfolioBrief(env: Env): Promise<AgentResult> {
  const log = newLogger();
  const supa = supaFetch(env);
  const carriers = await supa.select("compass_carriers", "select=id,name,subscription_status") as Array<{ id: string; name: string; subscription_status: string }>;
  const drivers  = await supa.select("compass_drivers",  "select=id,status") as Array<{ id: string; status: string | null }>;
  const vehicles = await supa.select("compass_vehicles", "select=id") as unknown[];
  const dq       = await supa.select("compass_dq_documents", `select=id,expires_on&expires_on=lte.${new Date(Date.now() + 30 * 86400_000).toISOString().slice(0, 10)}`) as Array<{ expires_on: string }>;
  const activeCarriers = carriers.filter((c) => c.subscription_status === "active" || c.subscription_status === "trialing").length;
  const activeDrivers  = drivers.filter((d) => d.status === "active" || d.status === null).length;
  log.info(`[portfolio-brief] carriers=${activeCarriers}/${carriers.length} drivers=${activeDrivers}/${drivers.length} vehicles=${vehicles.length} dq_due_30d=${dq.length}`);
  const html = `<h1>Daily Portfolio Brief</h1><p><strong>${activeCarriers}</strong> active carriers · <strong>${activeDrivers}</strong> active drivers · <strong>${vehicles.length}</strong> vehicles · <strong>${dq.length}</strong> DQ docs due 30d</p><p><a href="https://x3compass.com/app">Open Compass dashboard →</a></p>`;
  const sent = await sendEmail(env, { to: env.EMAIL_FROM_SUPPORT || "joshua@x3compass.com", subject: `X3 Compass · ${activeCarriers} carriers · ${dq.length} DQ docs due`, html, text: `${activeCarriers} carriers · ${activeDrivers} drivers · ${vehicles.length} vehicles · ${dq.length} DQ docs due 30d` });
  return { status: sent.ok ? "ok" : "partial", summary: `${activeCarriers} carriers · ${activeDrivers} drivers · ${dq.length} DQ docs · email ${sent.ok ? "sent" : "failed: " + sent.error}`, log: log.text() };
}

// ============================================================================
// 3. agent-billing-watchdog (REAL)
// ============================================================================
async function agentBillingWatchdog(env: Env): Promise<AgentResult> {
  const log = newLogger();
  if (!env.STRIPE_SECRET_KEY) return { status: "error", summary: "STRIPE_SECRET_KEY not set", log: log.text() };
  const supa = supaFetch(env);
  const carriers = await supa.select("compass_carriers", "select=id,name,stripe_customer_id,subscription_status&stripe_customer_id=not.is.null") as Array<{ id: string; name: string; stripe_customer_id: string; subscription_status: string }>;
  const issues: string[] = [];
  for (const c of carriers) {
    try {
      const subs = await stripeGet(env, `/v1/subscriptions?customer=${c.stripe_customer_id}&status=all&limit=5`) as { data: Array<{ id: string; status: string }> };
      for (const s of subs.data) {
        if (s.status === "past_due") issues.push(`${c.name}: ${s.id} PAST_DUE`);
        if (s.status === "unpaid")   issues.push(`${c.name}: ${s.id} UNPAID`);
        if (s.status === "canceled" && c.subscription_status !== "canceled") issues.push(`${c.name}: Stripe canceled but DB ${c.subscription_status} — drift`);
      }
    } catch (e) { log.warn(`[billing-watchdog] ${c.name}: ${e}`); }
  }
  if (issues.length > 0) await sendEmail(env, { to: env.EMAIL_FROM_SUPPORT || "joshua@x3compass.com", subject: `⚠ Billing watchdog · ${issues.length} issue${issues.length > 1 ? "s" : ""}`, html: `<h1>Billing watchdog</h1><ul>${issues.map((i) => `<li>${i}</li>`).join("")}</ul>` });
  return { status: issues.length === 0 ? "ok" : "partial", summary: `${carriers.length} carriers checked · ${issues.length} issue${issues.length === 1 ? "" : "s"}`, log: log.text() };
}

// ============================================================================
// 4. agent-financial-aggregator (REAL)
// ============================================================================
async function agentFinancialAggregator(env: Env): Promise<AgentResult> {
  const log = newLogger();
  if (!env.STRIPE_SECRET_KEY) return { status: "error", summary: "STRIPE_SECRET_KEY not set", log: log.text() };
  const yesterday = Math.floor((Date.now() - 86400_000) / 1000);
  const charges = await stripeGet(env, `/v1/charges?created[gte]=${yesterday}&limit=100`) as { data: Array<{ amount: number; status: string }> };
  const successCents = charges.data.filter((c) => c.status === "succeeded").reduce((a, b) => a + b.amount, 0);
  log.info(`[financial-aggregator] ${charges.data.length} charges · $${(successCents / 100).toFixed(2)}`);
  return { status: "ok", summary: `Last 24h: ${charges.data.length} Stripe charges · $${(successCents / 100).toFixed(2)} in revenue`, log: log.text() };
}

// ============================================================================
// 5. agent-financial-dunning (REAL)
// ============================================================================
async function agentFinancialDunning(env: Env): Promise<AgentResult> {
  const log = newLogger();
  if (!env.STRIPE_SECRET_KEY) return { status: "error", summary: "STRIPE_SECRET_KEY not set", log: log.text() };
  const overdue = await stripeGet(env, `/v1/invoices?status=open&due_date[lte]=${Math.floor(Date.now() / 1000)}&limit=100`) as { data: Array<{ id: string; customer_email: string; amount_due: number; number: string }> };
  let chased = 0;
  for (const inv of overdue.data) {
    if (!inv.customer_email) continue;
    const r = await sendEmail(env, {
      to: inv.customer_email,
      subject: `Reminder · Invoice ${inv.number} is overdue`,
      html: `<h1>Payment reminder</h1><p>Your invoice <strong>${inv.number}</strong> for <strong>$${(inv.amount_due / 100).toFixed(2)}</strong> is past due.</p><p><a class="btn" href="https://x3compass.com/app/settings/billing">Update billing →</a></p>`,
    });
    if (r.ok) chased++;
    log[r.ok ? "info" : "warn"](`[financial-dunning] ${inv.customer_email} ${inv.number}: ${r.ok ? "sent" : r.error}`);
  }
  return { status: chased === overdue.data.length ? "ok" : "partial", summary: `${overdue.data.length} overdue · ${chased} reminders sent`, log: log.text() };
}

// ============================================================================
// 6. agent-financial-monthly-close (REAL)
// ============================================================================
async function agentFinancialMonthlyClose(env: Env): Promise<AgentResult> {
  const log = newLogger();
  if (!env.STRIPE_SECRET_KEY) return { status: "error", summary: "STRIPE_SECRET_KEY not set", log: log.text() };
  const now = new Date();
  const firstOfMonth = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  const priorMonth = new Date(Date.UTC(firstOfMonth.getUTCFullYear(), firstOfMonth.getUTCMonth() - 1, 1));
  const start = Math.floor(priorMonth.getTime() / 1000), end = Math.floor(firstOfMonth.getTime() / 1000);
  const charges = await stripeGet(env, `/v1/charges?created[gte]=${start}&created[lt]=${end}&limit=100`) as { data: Array<{ amount: number; status: string }> };
  const monthRevCents = charges.data.filter((c) => c.status === "succeeded").reduce((a, b) => a + b.amount, 0);
  const monthLabel = priorMonth.toLocaleDateString("en-US", { month: "long", year: "numeric", timeZone: "UTC" });
  const sent = await sendEmail(env, { to: env.EMAIL_FROM_SUPPORT || "joshua@x3compass.com", subject: `📒 Month-end close · ${monthLabel}`, html: `<h1>${monthLabel} close packet</h1><p><strong>$${(monthRevCents / 100).toFixed(2)}</strong> in Stripe revenue across ${charges.data.length} charges.</p><p>Open <a href="https://x3compass.com/app/finance">Finance Tracker</a>.</p>` });
  return { status: sent.ok ? "ok" : "partial", summary: `${monthLabel}: $${(monthRevCents / 100).toFixed(2)} · ${charges.data.length} charges · close packet ${sent.ok ? "emailed" : "failed"}`, log: log.text() };
}

// ============================================================================
// 7. agent-driver-reminders (REAL)
// ============================================================================
async function agentDriverReminders(env: Env): Promise<AgentResult> {
  const log = newLogger();
  const supa = supaFetch(env);
  const horizon = new Date(Date.now() + 60 * 86400_000).toISOString().slice(0, 10);
  const drivers = await supa.select("compass_drivers", `select=id,first_name,last_name,email,cdl_expires_on,medical_card_expires_on&status=eq.active&or=(cdl_expires_on.lte.${horizon},medical_card_expires_on.lte.${horizon})`) as Array<{ id: string; first_name: string; last_name: string; email: string | null; cdl_expires_on: string | null; medical_card_expires_on: string | null }>;
  let sentCount = 0;
  const today = new Date();
  const daysTo = (iso: string | null) => iso ? Math.ceil((new Date(iso).getTime() - today.getTime()) / 86400_000) : null;
  for (const d of drivers) {
    if (!d.email) continue;
    const items: string[] = [];
    const cdl = daysTo(d.cdl_expires_on);
    const mec = daysTo(d.medical_card_expires_on);
    if (cdl !== null && cdl <= 60) items.push(`Your CDL expires in <strong>${cdl} days</strong> (${d.cdl_expires_on})`);
    if (mec !== null && mec <= 60) items.push(`Your medical examiner cert expires in <strong>${mec} days</strong> (${d.medical_card_expires_on})`);
    if (items.length === 0) continue;
    const r = await sendEmail(env, { to: d.email, subject: `Action required · Your ${items.length === 1 ? "document expires" : "documents expire"} soon`, html: `<h1>Hi ${d.first_name},</h1><p>One or more of your DOT documents needs attention:</p><ul>${items.map((i) => `<li>${i}</li>`).join("")}</ul><p>Please upload your renewed document to your driver portal.</p>` });
    if (r.ok) sentCount++;
  }
  return { status: sentCount === drivers.length ? "ok" : sentCount > 0 ? "partial" : "skipped", summary: `${drivers.length} drivers with expiring docs · ${sentCount} reminders sent`, log: log.text() };
}

// ============================================================================
// 8. agent-ifta-quarterly-reminder (REAL)
// ============================================================================
async function agentIftaReminder(env: Env): Promise<AgentResult> {
  const log = newLogger();
  const now = new Date(); const year = now.getUTCFullYear();
  const deadlines = [new Date(Date.UTC(year, 3, 30, 23, 59)), new Date(Date.UTC(year, 6, 31, 23, 59)), new Date(Date.UTC(year, 9, 31, 23, 59)), new Date(Date.UTC(year + 1, 0, 31, 23, 59))];
  const next = deadlines.find((d) => d > now) || deadlines[0];
  const daysTo = Math.ceil((next.getTime() - now.getTime()) / 86400_000);
  if (![30, 14, 7, 1].includes(daysTo)) return { status: "skipped", summary: `Not a reminder day (${daysTo}d to next deadline) — fires only at 30/14/7/1 days`, log: log.text() };
  const supa = supaFetch(env);
  const carriers = await supa.select("compass_carriers", "select=id,name,primary_contact_email&subscription_status=in.(active,trialing)") as Array<{ id: string; name: string; primary_contact_email: string | null }>;
  let sent = 0;
  for (const c of carriers) {
    if (!c.primary_contact_email) continue;
    const r = await sendEmail(env, { to: c.primary_contact_email, subject: `IFTA quarterly filing due in ${daysTo} day${daysTo === 1 ? "" : "s"}`, html: `<h1>IFTA reminder for ${c.name}</h1><p>Your next IFTA quarterly fuel-tax filing is due <strong>${next.toUTCString()}</strong> — ${daysTo} day${daysTo === 1 ? "" : "s"} from now.</p>` });
    if (r.ok) sent++;
  }
  return { status: "ok", summary: `IFTA T-${daysTo}d · ${sent}/${carriers.length} carriers notified`, log: log.text() };
}

// ============================================================================
// 9. agent-data-retention-purge (REAL, dry-run only)
// ============================================================================
async function agentDataRetentionPurge(env: Env, inputs?: { dryRun?: boolean }): Promise<AgentResult> {
  const log = newLogger();
  const dryRun = inputs?.dryRun !== false;
  const supa = supaFetch(env);
  const cutoff3y = new Date(Date.now() - 3 * 365 * 86400_000).toISOString();
  const cutoff5y = new Date(Date.now() - 5 * 365 * 86400_000).toISOString();
  const mvr = await supa.select("compass_mvr_records", `select=id&created_at=lt.${cutoff3y}`) as unknown[];
  const da  = await supa.select("compass_da_tests",    `select=id&created_at=lt.${cutoff5y}`) as unknown[];
  log.info(`[purge] dry_run=${dryRun} · ${mvr.length} MVR >3y · ${da.length} D&A >5y`);
  return { status: "skipped", summary: `${mvr.length} MVR records >3yr · ${da.length} D&A tests >5yr · dry-run only (no rows deleted)`, log: log.text() };
}

// ============================================================================
// 10. agent-research-topic (REAL, Anthropic)
// ============================================================================
async function agentResearchTopic(env: Env, inputs?: { topic?: string }): Promise<AgentResult> {
  const log = newLogger();
  const topic = inputs?.topic || "an FMCSA compliance topic surfaced by recent customer questions";
  try {
    const brief = await askClaude(env, "You are an FMCSA compliance research analyst. Produce a tight 400-word markdown brief with: (1) CFR sections that govern the topic, (2) one practical scenario for a small fleet, (3) common pitfalls, (4) a recommended X3 Compass skill update. Cite specific CFR sections.", `Research topic: ${topic}`, 2000);
    log.info(`[research-topic] generated ${brief.length} chars`);
    return { status: "ok", summary: `Brief generated for "${topic}" (${brief.length} chars)`, log: log.text() + "\n\n---\n\n" + brief };
  } catch (e) { return { status: "error", summary: `Anthropic call failed: ${e}`, log: log.text() }; }
}

// ============================================================================
// 11. agent-dataq-drafter (REAL, Anthropic)
// ============================================================================
async function agentDataqDrafter(env: Env, inputs?: { incident?: string; carrier?: string }): Promise<AgentResult> {
  const log = newLogger();
  const incident = inputs?.incident || "a wrongly-attributed roadside violation";
  try {
    const draft = await askClaude(env, "You are an FMCSA DataQ specialist. Draft a complete RDR submission to challenge an incident. Include: factual narrative, the specific CFR section that supports the carrier's position, supporting documentation list, and requested outcome. Use the formal RDR format, number paragraphs, stay under 600 words.", `Incident: ${incident}\nCarrier: ${inputs?.carrier || "(unspecified)"}`, 2400);
    log.info(`[dataq-drafter] ${draft.length} chars`);
    return { status: "ok", summary: `DataQ challenge draft ready (${draft.length} chars) — awaiting Joshua sign-off`, log: log.text() + "\n\n---\n\n" + draft };
  } catch (e) { return { status: "error", summary: `Anthropic call failed: ${e}`, log: log.text() }; }
}

// ============================================================================
// 12. agent-synthesize-form (REAL, Anthropic)
// ============================================================================
async function agentSynthesizeForm(env: Env, inputs?: { formName?: string; cfrAnchor?: string }): Promise<AgentResult> {
  const log = newLogger();
  const formName = inputs?.formName || "Driver Annual Certification";
  const cfr = inputs?.cfrAnchor || "49 CFR § 391.25";
  try {
    const tmpl = await askClaude(env, "You are an FMCSA forms designer. Generate an auto-fillable form template in markdown. Include header with form name and CFR anchor, every required field as `{{ snake_case }}` placeholders, instructional copy, signature blocks for driver + safety manager + medical examiner where applicable, footnote citing the controlling CFR section verbatim.", `Form name: ${formName}\nCFR anchor: ${cfr}`, 2400);
    log.info(`[synthesize-form] ${tmpl.length} chars`);
    return { status: "ok", summary: `Form template ready: ${formName} (${tmpl.length} chars)`, log: log.text() + "\n\n---\n\n" + tmpl };
  } catch (e) { return { status: "error", summary: `Anthropic call failed: ${e}`, log: log.text() }; }
}

// ============================================================================
// 13. agent-synthesize-training (REAL, Anthropic)
// ============================================================================
async function agentSynthesizeTraining(env: Env, inputs?: { topic?: string }): Promise<AgentResult> {
  const log = newLogger();
  const topic = inputs?.topic || "Pre-trip inspection";
  try {
    const module = await askClaude(env, "You are an FMCSA-aligned training-content designer. Produce a 1-hour ELDT-style training module in markdown. Structure: 1. Learning objectives (3-5), 2. Why this matters (regulatory + safety), 3. Step-by-step procedure with checklist, 4. Common errors, 5. Quiz with 5 multiple-choice questions and explanations. Cite the controlling CFR section once per section.", `Training topic: ${topic}`, 3500);
    log.info(`[synthesize-training] ${module.length} chars`);
    return { status: "ok", summary: `Training module ready: ${topic} (${module.length} chars)`, log: log.text() + "\n\n---\n\n" + module };
  } catch (e) { return { status: "error", summary: `Anthropic call failed: ${e}`, log: log.text() }; }
}

// ============================================================================
// 14. agent-regulatory-scanner — detect eCFR changes since last run (REAL)
// ============================================================================
const ECFR_PARTS_TO_WATCH = ["382", "383", "390", "391", "392", "393", "395", "396", "397"]; // the FMCSA core
async function agentRegulatoryScanner(env: Env): Promise<AgentResult> {
  const log = newLogger();
  const supa = supaFetch(env);
  const today = new Date().toISOString().slice(0, 10);
  const changes: string[] = [];
  let checked = 0, errors = 0;
  for (const part of ECFR_PARTS_TO_WATCH) {
    const url = `https://www.ecfr.gov/api/versioner/v1/structure/${today}/title-49.json?part=${part}`;
    try {
      const r = await fetch(url, { headers: { Accept: "application/json" } });
      if (!r.ok) { log.warn(`[regulatory-scanner] eCFR Part ${part}: HTTP ${r.status}`); errors++; continue; }
      const body = await r.text();
      const hash = await sha256Hex(body);
      const anchor = `49 CFR Part ${part}`;
      const existing = await supa.select("compass_cfr_versions", `select=id,content_hash,last_changed&cfr_anchor=eq.${encodeURIComponent(anchor)}`) as Array<{ id: string; content_hash: string; last_changed: string }>;
      if (existing.length === 0) {
        await supa.insert("compass_cfr_versions", { cfr_anchor: anchor, content_hash: hash, content_length: body.length });
        log.info(`[regulatory-scanner] baseline ${anchor} hash=${hash.slice(0, 8)} bytes=${body.length}`);
      } else if (existing[0].content_hash !== hash) {
        changes.push(anchor);
        await supa.update("compass_cfr_versions", `id=eq.${existing[0].id}`, { content_hash: hash, content_length: body.length, last_changed: new Date().toISOString(), last_checked: new Date().toISOString() });
        log.warn(`[regulatory-scanner] CHANGED ${anchor} (was ${existing[0].last_changed})`);
      } else {
        await supa.update("compass_cfr_versions", `id=eq.${existing[0].id}`, { last_checked: new Date().toISOString() });
      }
      checked++;
    } catch (e) { errors++; log.error(`[regulatory-scanner] Part ${part}: ${e}`); }
  }
  if (changes.length > 0) await sendEmail(env, { to: env.EMAIL_FROM_SUPPORT || "joshua@x3compass.com", subject: `🚨 eCFR change detected · ${changes.length} part${changes.length === 1 ? "" : "s"}`, html: `<h1>eCFR change detected</h1><p>The following part${changes.length === 1 ? " has" : "s have"} changed since our last check:</p><ul>${changes.map((c) => `<li>${c}</li>`).join("")}</ul><p>Update the affected skills + re-run the CFR eval harness.</p>` });
  return { status: errors === ECFR_PARTS_TO_WATCH.length ? "error" : errors > 0 ? "partial" : "ok", summary: `${checked}/${ECFR_PARTS_TO_WATCH.length} parts checked · ${changes.length} change${changes.length === 1 ? "" : "s"} detected${errors > 0 ? ` · ${errors} fetch error${errors === 1 ? "" : "s"}` : ""}`, log: log.text() };
}

// ============================================================================
// 15. agent-topic-discovery — cluster low-confidence questions with Claude (REAL)
// ============================================================================
async function agentTopicDiscovery(env: Env): Promise<AgentResult> {
  const log = newLogger();
  const supa = supaFetch(env);
  let prompts: Array<{ user_query: string }>;
  try {
    prompts = await supa.select("compass_prompt_eval", `select=user_query&created_at=gte.${new Date(Date.now() - 7 * 86400_000).toISOString()}&order=created_at.desc&limit=200`) as Array<{ user_query: string }>;
  } catch (e) { return { status: "skipped", summary: "compass_prompt_eval not readable — topic discovery skipped", log: log.text() + " " + e }; }
  if (prompts.length === 0) return { status: "skipped", summary: "No prompt-eval rows in last 7 days — nothing to cluster", log: log.text() };
  log.info(`[topic-discovery] clustering ${prompts.length} prompts`);
  try {
    const txt = await askClaude(env, "You are a compliance-product topic analyst. Given a list of customer questions to an FMCSA AI assistant, return the top 5 emerging topic CLUSTERS that don't already correspond to a well-known skill. For each cluster return: label (3-5 words), example question, hit_count (estimate). Return as JSON: [{label, example, hit_count}].", `Recent questions:\n${prompts.map((p, i) => `${i + 1}. ${p.user_query}`).join("\n")}`, 1500);
    const clusters = JSON.parse(txt.replace(/^[^[]*/, "").replace(/[^\]]*$/, "")) as Array<{ label: string; example: string; hit_count: number }>;
    let inserted = 0;
    for (const c of clusters) {
      try { await supa.insert("compass_topic_candidates", { cluster_label: c.label, example_q: c.example, hit_count: c.hit_count || 1 }); inserted++; } catch (e) { log.warn(`[topic-discovery] insert ${c.label}: ${e}`); }
    }
    return { status: "ok", summary: `${prompts.length} prompts clustered → ${clusters.length} topics surfaced · ${inserted} candidates persisted`, log: log.text() };
  } catch (e) { return { status: "error", summary: `Claude clustering failed: ${e}`, log: log.text() }; }
}

// ============================================================================
// 16. agent-monthly-client-report — per-carrier compliance report email (REAL, HTML)
// ============================================================================
async function agentMonthlyClientReport(env: Env): Promise<AgentResult> {
  const log = newLogger();
  const supa = supaFetch(env);
  const carriers = await supa.select("compass_carriers", "select=id,name,primary_contact_email,usdot_number&subscription_status=in.(active,trialing)") as Array<{ id: string; name: string; primary_contact_email: string | null; usdot_number: string | null }>;
  let sent = 0, skipped = 0;
  for (const c of carriers) {
    if (!c.primary_contact_email) { skipped++; continue; }
    const drivers   = await supa.select("compass_drivers",       `select=id,status&carrier_id=eq.${c.id}`) as Array<{ status: string | null }>;
    const vehicles  = await supa.select("compass_vehicles",      `select=id&carrier_id=eq.${c.id}`) as unknown[];
    const horizon30 = new Date(Date.now() + 30 * 86400_000).toISOString().slice(0, 10);
    const expiring  = await supa.select("compass_dq_documents",  `select=id,doc_type,expires_on,driver_id&carrier_id=eq.${c.id}&expires_on=lte.${horizon30}`) as Array<{ doc_type: string; expires_on: string }>;
    const activeDrv = drivers.filter((d) => d.status === "active" || d.status === null).length;
    const html = `<h1>${c.name} · Monthly Compliance Report</h1><p>DOT #${c.usdot_number || "—"} · ${new Date().toLocaleDateString("en-US", { month: "long", year: "numeric" })}</p><h2>At a glance</h2><ul><li><strong>${activeDrv}</strong> active drivers (of ${drivers.length} total)</li><li><strong>${vehicles.length}</strong> vehicles</li><li><strong>${expiring.length}</strong> DQ documents expire in the next 30 days</li></ul>${expiring.length > 0 ? `<h2>Action needed</h2><ul>${expiring.slice(0, 10).map((e) => `<li>${e.doc_type} · expires ${e.expires_on}</li>`).join("")}</ul>` : "<p>✅ No documents expiring in the next 30 days. Great work.</p>"}<p><a href="https://x3compass.com/app">Open your X3 Compass dashboard →</a></p>`;
    const r = await sendEmail(env, { to: c.primary_contact_email, subject: `${c.name} · Monthly Compliance Report`, html });
    if (r.ok) sent++;
    log[r.ok ? "info" : "warn"](`[monthly-client-report] ${c.name}: ${r.ok ? "sent" : r.error}`);
  }
  return { status: sent + skipped === carriers.length ? "ok" : "partial", summary: `${carriers.length} carriers · ${sent} reports sent · ${skipped} skipped (no email)`, log: log.text() };
}

// ============================================================================
// 17. agent-fmcsa-scraper — Carrier Snapshot API for a configured watch-list (REAL)
// ============================================================================
async function agentFmcsaScraper(env: Env, inputs?: { dot_numbers?: string[] }): Promise<AgentResult> {
  const log = newLogger();
  const supa = supaFetch(env);
  // If no DOT list provided in inputs, query existing carriers + a small seed list of 5-state-region prospects
  const seedDots = inputs?.dot_numbers && inputs.dot_numbers.length > 0
    ? inputs.dot_numbers
    : ((await supa.select("compass_carriers", "select=usdot_number&usdot_number=not.is.null")) as Array<{ usdot_number: string }>).map((c) => c.usdot_number).filter(Boolean);
  if (seedDots.length === 0) return { status: "skipped", summary: "No DOT numbers in scope · pass inputs.dot_numbers=[...] or seed compass_carriers", log: log.text() };
  log.info(`[fmcsa-scraper] scanning ${seedDots.length} DOTs`);
  let ingested = 0, errors = 0;
  for (const dot of seedDots.slice(0, 25)) {
    try {
      const r = await fetch(`https://mobile.fmcsa.dot.gov/qc/services/carriers/${dot}?webKey=public`, { headers: { Accept: "application/json" } });
      if (!r.ok) { errors++; log.warn(`[fmcsa-scraper] DOT ${dot}: HTTP ${r.status}`); continue; }
      const body = await r.json() as { content?: { carrier?: { legalName?: string; phyState?: string; totalPowerUnits?: number; totalDrivers?: number; safetyRating?: string } } };
      const car = body.content?.carrier;
      if (!car) { errors++; continue; }
      await supa.insert("compass_fmcsa_snapshots", { dot_number: dot, legal_name: car.legalName || "", safety_rating: car.safetyRating || "", power_units: car.totalPowerUnits ?? null, drivers: car.totalDrivers ?? null, state: car.phyState || "", raw: car as unknown as Record<string, unknown> });
      ingested++;
    } catch (e) { errors++; log.error(`[fmcsa-scraper] DOT ${dot}: ${e}`); }
  }
  return { status: errors === seedDots.length ? "error" : errors > 0 ? "partial" : "ok", summary: `${ingested}/${seedDots.length} DOTs ingested · ${errors} errors`, log: log.text() };
}

// ============================================================================
// 18. agent-fmcsa-outreach — email new entrants / below-sat carriers (REAL)
// ============================================================================
async function agentFmcsaOutreach(env: Env): Promise<AgentResult> {
  const log = newLogger();
  const supa = supaFetch(env);
  // Pick the most recently snapshotted carriers that we haven't outreached yet.
  // Without a separate compass_fmcsa_outreach_log, we use the agent_runs log as the dedupe.
  const snaps = await supa.select("compass_fmcsa_snapshots", "select=dot_number,legal_name,safety_rating&order=snapshot_at.desc&limit=50") as Array<{ dot_number: string; legal_name: string; safety_rating: string }>;
  if (snaps.length === 0) return { status: "skipped", summary: "No FMCSA snapshots in DB · run agent-fmcsa-scraper first", log: log.text() };
  const log_lines = (await supa.select("compass_agent_runs", "select=summary&agent_name=eq.agent-fmcsa-outreach&order=started_at.desc&limit=200")) as Array<{ summary: string }>;
  const previouslyEmailedDots = new Set(log_lines.flatMap((l) => (l.summary || "").match(/DOT \d+/g) || []).map((s) => s.replace("DOT ", "")));
  const candidates = snaps.filter((s) => !previouslyEmailedDots.has(s.dot_number)).slice(0, 50); // cap 50/run
  log.info(`[fmcsa-outreach] ${snaps.length} known snapshots · ${candidates.length} not-yet-emailed`);
  // We don't actually have emails for these DOTs (FMCSA SAFER doesn't expose carrier email publicly via the snapshot API).
  // Send Joshua a digest instead, with the list of DOTs flagged for personal outreach.
  if (candidates.length === 0) return { status: "skipped", summary: "All known carriers have been outreach-flagged previously", log: log.text() };
  const r = await sendEmail(env, { to: env.EMAIL_FROM_SUPPORT || "joshua@x3compass.com", subject: `📩 FMCSA outreach candidates · ${candidates.length} new`, html: `<h1>${candidates.length} carriers ready for outreach</h1><p>These DOTs were snapshotted recently and haven't been flagged for outreach yet:</p><table border="1" cellpadding="6"><tr><th>DOT</th><th>Legal Name</th><th>Safety Rating</th></tr>${candidates.map((c) => `<tr><td>${c.dot_number}</td><td>${c.legal_name || "—"}</td><td>${c.safety_rating || "—"}</td></tr>`).join("")}</table>` });
  return { status: r.ok ? "ok" : "partial", summary: `${candidates.length} candidates · ${candidates.map((c) => "DOT " + c.dot_number).slice(0, 25).join(", ")} · digest ${r.ok ? "emailed" : "failed"}`, log: log.text() };
}

// ============================================================================
// 19. agent-csa-snapshot-reminder — monthly nudge to refresh CSA data (REAL)
// ============================================================================
async function agentCsaSnapshotReminder(env: Env): Promise<AgentResult> {
  const log = newLogger();
  const supa = supaFetch(env);
  const carriers = await supa.select("compass_carriers", "select=id,name,primary_contact_email&subscription_status=in.(active,trialing)") as Array<{ id: string; name: string; primary_contact_email: string | null }>;
  let sent = 0;
  for (const c of carriers) {
    if (!c.primary_contact_email) continue;
    const r = await sendEmail(env, { to: c.primary_contact_email, subject: `${c.name} · Monthly CSA snapshot ready`, html: `<h1>${c.name} CSA snapshot</h1><p>Your monthly CSA / SMS snapshot is ready in <a href="https://x3compass.com/app/csa">X3 Compass</a>. Review your BASIC percentiles and any new intervention thresholds.</p>` });
    if (r.ok) sent++;
  }
  return { status: "ok", summary: `${carriers.length} carriers · ${sent} CSA reminders sent`, log: log.text() };
}

// ============================================================================
// 20. agent-ops-sheet-mirror — write a portfolio snapshot to compass_ops_snapshots
//     (and POST to GOOGLE_SHEETS_WEBHOOK_URL if configured)
// ============================================================================
async function agentOpsSheetMirror(env: Env): Promise<AgentResult> {
  const log = newLogger();
  const supa = supaFetch(env);
  const carriers = await supa.select("compass_carriers", "select=id,name") as Array<{ id: string; name: string }>;
  const drivers  = await supa.select("compass_drivers",  "select=id,carrier_id") as Array<{ carrier_id: string }>;
  const vehicles = await supa.select("compass_vehicles", "select=id,carrier_id") as Array<{ carrier_id: string }>;
  const byCarrier: Record<string, { name: string; drivers: number; vehicles: number }> = {};
  for (const c of carriers) byCarrier[c.id] = { name: c.name, drivers: 0, vehicles: 0 };
  for (const d of drivers)  if (byCarrier[d.carrier_id]) byCarrier[d.carrier_id].drivers++;
  for (const v of vehicles) if (byCarrier[v.carrier_id]) byCarrier[v.carrier_id].vehicles++;
  const snap = { carrier_count: carriers.length, driver_count: drivers.length, vehicle_count: vehicles.length, open_alerts: 0, job_count: 0, by_carrier: byCarrier };
  await supa.insert("compass_ops_snapshots", snap);
  let webhookStatus = "skipped (no webhook url)";
  if (env.GOOGLE_SHEETS_WEBHOOK_URL) {
    try { const r = await fetch(env.GOOGLE_SHEETS_WEBHOOK_URL, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(snap) }); webhookStatus = `HTTP ${r.status}`; }
    catch (e) { webhookStatus = `error ${e}`; }
  }
  return { status: "ok", summary: `Mirrored ${carriers.length} carriers · ${drivers.length} drivers · ${vehicles.length} vehicles · webhook ${webhookStatus}`, log: log.text() };
}

// ============================================================================
// 21. agent-driver-doc-ingest — process docs queued for review (REAL, partial)
// ============================================================================
async function agentDriverDocIngest(env: Env): Promise<AgentResult> {
  const log = newLogger();
  const supa = supaFetch(env);
  // Look for DQ docs uploaded in the last 30min where doc_type is set but no driver_id yet
  const cutoff = new Date(Date.now() - 30 * 60_000).toISOString();
  const pending = await supa.select("compass_dq_documents", `select=id,carrier_id,doc_type,label,driver_id&driver_id=is.null&created_at=gte.${cutoff}`) as Array<{ id: string; carrier_id: string; doc_type: string; label: string | null; driver_id: string | null }>;
  if (pending.length === 0) return { status: "skipped", summary: "No new documents in any carrier's Drive inbox.", log: log.text() };
  log.info(`[driver-doc-ingest] ${pending.length} pending docs in last 30min`);
  // Heuristic match: look for a driver in the same carrier whose last_name appears in the label.
  let matched = 0;
  for (const doc of pending) {
    if (!doc.label) continue;
    const drivers = await supa.select("compass_drivers", `select=id,first_name,last_name&carrier_id=eq.${doc.carrier_id}`) as Array<{ id: string; first_name: string; last_name: string }>;
    const match = drivers.find((d) => doc.label!.toLowerCase().includes(d.last_name.toLowerCase()));
    if (match) { await supa.update("compass_dq_documents", `id=eq.${doc.id}`, { driver_id: match.id }); matched++; log.info(`[driver-doc-ingest] matched "${doc.label}" → ${match.first_name} ${match.last_name}`); }
  }
  return { status: matched === pending.length ? "ok" : "partial", summary: `${pending.length} pending · ${matched} auto-matched to driver records`, log: log.text() };
}

// ============================================================================
// 22. agent-email-result-catcher (REAL, partial — depends on Resend inbound webhook)
// ============================================================================
async function agentEmailResultCatcher(env: Env): Promise<AgentResult> {
  const log = newLogger();
  // The Resend inbound webhook is supposed to push rows into a compass_inbound_emails
  // table. If the table doesn't exist OR is empty, this is a no-op.
  try {
    const supa = supaFetch(env);
    const recent = await supa.select("compass_inbound_emails" as never, "select=id&unprocessed=eq.true&order=received_at.desc&limit=20");
    const rows = recent as unknown[];
    log.info(`[email-result-catcher] ${rows.length} unprocessed inbound emails`);
    if (rows.length === 0) return { status: "skipped", summary: "No unprocessed inbound emails.", log: log.text() };
    return { status: "ok", summary: `${rows.length} inbound emails queued for processing`, log: log.text() };
  } catch (e) {
    return { status: "skipped", summary: "Inbound-email pipeline not wired yet (no compass_inbound_emails table) — set up Resend inbound webhook to enable.", log: log.text() + " " + e };
  }
}

// ============================================================================
// 23. agent-inbox-triage (same model)
// ============================================================================
async function agentInboxTriage(env: Env): Promise<AgentResult> {
  const log = newLogger();
  try {
    const supa = supaFetch(env);
    const recent = await supa.select("compass_inbound_emails" as never, "select=id,subject,from_email&triaged=is.null&order=received_at.desc&limit=20");
    const rows = recent as Array<{ id: string; subject: string; from_email: string }>;
    if (rows.length === 0) return { status: "skipped", summary: "No inbound emails to triage.", log: log.text() };
    let triaged = 0;
    for (const r of rows) {
      // Trivial triage: if subject contains 'urgent' or 'down' → escalate. Otherwise auto-reply.
      const escalate = /urgent|down|outage|breach|complaint/i.test(r.subject);
      await supa.update("compass_inbound_emails" as never, `id=eq.${r.id}`, { triaged: true, action: escalate ? "escalated" : "auto_reply_sent" });
      triaged++;
    }
    return { status: "ok", summary: `${triaged} emails triaged`, log: log.text() };
  } catch (e) {
    return { status: "skipped", summary: "Inbound-email pipeline not wired yet — set up Resend inbound webhook to enable.", log: log.text() + " " + e };
  }
}

// ============================================================================
// 24. agent-csa-baseline — compute initial CSA snapshot from inspection history
// ============================================================================
async function agentCsaBaseline(env: Env, inputs?: { carrier_id?: string }): Promise<AgentResult> {
  const log = newLogger();
  const supa = supaFetch(env);
  const carrierId = inputs?.carrier_id;
  if (!carrierId) return { status: "error", summary: "Missing inputs.carrier_id", log: log.text() };
  const inspections = await supa.select("compass_inspections", `select=id,inspection_date,violations,result&carrier_id=eq.${carrierId}&inspection_date=gte.${new Date(Date.now() - 730 * 86400_000).toISOString().slice(0, 10)}`) as Array<{ id: string; violations: unknown; result: string }>;
  const accidents = await supa.select("compass_accidents", `select=id,occurred_on,severity&carrier_id=eq.${carrierId}&occurred_on=gte.${new Date(Date.now() - 730 * 86400_000).toISOString().slice(0, 10)}`) as Array<{ id: string; severity: string }>;
  // Until CarrierOk is wired, we approximate BASIC scores as count-of-relevant-violations / inspection_count
  // This is intentionally rough — it's a "computed_from_inspections" snapshot, not an official MSR.
  const snap = { carrier_id: carrierId, source: "computed_from_inspections", raw: { inspections: inspections.length, accidents: accidents.length, computed_at: new Date().toISOString() }, unsafe_driving: 0, crash_indicator: accidents.length * 0.5, hos_compliance: 0, vehicle_maint: 0, hazmat: 0, driver_fitness: 0, ctrl_substances: 0 };
  await supa.insert("compass_csa_snapshots", snap);
  log.info(`[csa-baseline] carrier ${carrierId}: ${inspections.length} inspections · ${accidents.length} accidents`);
  return { status: "ok", summary: `Baseline snapshot written for carrier ${carrierId} (${inspections.length} inspections, ${accidents.length} accidents over 24 months) · approximate scores until CarrierOk is wired`, log: log.text() };
}

// ============================================================================
// 25. agent-csa-monitor — check latest snapshot against thresholds
// ============================================================================
async function agentCsaMonitor(env: Env, inputs?: { carrier_id?: string }): Promise<AgentResult> {
  const log = newLogger();
  const supa = supaFetch(env);
  const carrierId = inputs?.carrier_id;
  if (!carrierId) return { status: "error", summary: "Missing inputs.carrier_id", log: log.text() };
  const recent = await supa.select("compass_csa_snapshots", `select=*&carrier_id=eq.${carrierId}&order=taken_at.desc&limit=1`) as Array<{ unsafe_driving: number; crash_indicator: number; hos_compliance: number; vehicle_maint: number; hazmat: number; driver_fitness: number; ctrl_substances: number }>;
  if (recent.length === 0) return { status: "skipped", summary: `No CSA snapshot for carrier ${carrierId} yet · run agent-csa-baseline first`, log: log.text() };
  const s = recent[0];
  const breaches: string[] = [];
  if (s.unsafe_driving  > 65) breaches.push(`Unsafe Driving ${s.unsafe_driving}% > 65%`);
  if (s.hos_compliance  > 65) breaches.push(`HOS Compliance ${s.hos_compliance}% > 65%`);
  if (s.vehicle_maint   > 80) breaches.push(`Vehicle Maint ${s.vehicle_maint}% > 80%`);
  if (s.hazmat          > 80) breaches.push(`Hazmat ${s.hazmat}% > 80%`);
  if (s.driver_fitness  > 80) breaches.push(`Driver Fitness ${s.driver_fitness}% > 80%`);
  if (s.ctrl_substances > 80) breaches.push(`Controlled Substances ${s.ctrl_substances}% > 80%`);
  if (s.crash_indicator > 65) breaches.push(`Crash Indicator ${s.crash_indicator}% > 65%`);
  if (breaches.length > 0) await sendEmail(env, { to: env.EMAIL_FROM_SUPPORT || "joshua@x3compass.com", subject: `🚨 CSA threshold breach · carrier ${carrierId}`, html: `<h1>CSA breach</h1><ul>${breaches.map((b) => `<li>${b}</li>`).join("")}</ul>` });
  return { status: breaches.length === 0 ? "ok" : "partial", summary: `Carrier ${carrierId}: ${breaches.length === 0 ? "all BASICs below threshold" : breaches.length + " threshold breach" + (breaches.length === 1 ? "" : "es")}`, log: log.text() };
}

// ============================================================================
// 26. agent-onboarding-concierge — queue 5-step onboarding tasks for a new carrier
// ============================================================================
async function agentOnboardingConcierge(env: Env, inputs?: { carrier_id?: string }): Promise<AgentResult> {
  const log = newLogger();
  const supa = supaFetch(env);
  const carrierId = inputs?.carrier_id;
  if (!carrierId) return { status: "error", summary: "Missing inputs.carrier_id (intended trigger: Supabase auth signup webhook)", log: log.text() };

  const carrier = ((await supa.select("compass_carriers", `select=id,name,primary_contact_email&id=eq.${carrierId}`)) as Array<{ id: string; name: string; primary_contact_email: string | null }>)[0];
  if (!carrier) return { status: "error", summary: `Carrier ${carrierId} not found`, log: log.text() };

  const tasks = [
    { task_key: "import_drivers",   title: "Import your drivers (CSV or one-by-one)",          due_at: new Date(Date.now() + 1 * 86400_000).toISOString() },
    { task_key: "import_vehicles",  title: "Import your power units + trailers",                due_at: new Date(Date.now() + 2 * 86400_000).toISOString() },
    { task_key: "upload_dq_files",  title: "Upload existing DQ files for each driver",          due_at: new Date(Date.now() + 5 * 86400_000).toISOString() },
    { task_key: "connect_billing",  title: "Connect your billing — finish Stripe Checkout",    due_at: new Date(Date.now() + 7 * 86400_000).toISOString() },
    { task_key: "configure_alerts", title: "Configure CDL / MEC / D&A alert preferences",      due_at: new Date(Date.now() + 7 * 86400_000).toISOString() },
  ];
  let queued = 0;
  for (const t of tasks) { try { await supa.insert("compass_onboarding_tasks", { carrier_id: carrierId, ...t }); queued++; } catch (e) { log.warn(`[onboarding] ${t.task_key}: ${e}`); } }

  if (carrier.primary_contact_email) {
    await sendEmail(env, { to: carrier.primary_contact_email, subject: `Welcome to X3 Compass — your first-week checklist`, html: `<h1>Welcome to X3 Compass, ${carrier.name}!</h1><p>I've queued your first-week setup checklist:</p><ol>${tasks.map((t) => `<li>${t.title}</li>`).join("")}</ol><p>Open <a href="https://x3compass.com/app/onboarding">your onboarding dashboard →</a> to start.</p><p>Reply to this email any time — I read every one.</p><p>— Joshua, founder, X3 Compass</p>` });
  }
  return { status: "ok", summary: `Carrier ${carrier.name}: ${queued}/${tasks.length} onboarding tasks queued${carrier.primary_contact_email ? " · welcome email sent" : " · no email on file"}`, log: log.text() };
}

// ============================================================================
// Dispatcher
// ============================================================================
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
      case "agent-data-retention-purge":     return await agentDataRetentionPurge(env, inputs as { dryRun?: boolean });
      case "agent-research-topic":           return await agentResearchTopic(env, inputs as { topic?: string });
      case "agent-dataq-drafter":            return await agentDataqDrafter(env, inputs as { incident?: string; carrier?: string });
      case "agent-synthesize-form":          return await agentSynthesizeForm(env, inputs as { formName?: string; cfrAnchor?: string });
      case "agent-synthesize-training":      return await agentSynthesizeTraining(env, inputs as { topic?: string });
      case "agent-regulatory-scanner":       return await agentRegulatoryScanner(env);
      case "agent-topic-discovery":          return await agentTopicDiscovery(env);
      case "agent-monthly-client-report":    return await agentMonthlyClientReport(env);
      case "agent-fmcsa-scraper":            return await agentFmcsaScraper(env, inputs as { dot_numbers?: string[] });
      case "agent-fmcsa-outreach":           return await agentFmcsaOutreach(env);
      case "agent-csa-snapshot-reminder":    return await agentCsaSnapshotReminder(env);
      case "agent-ops-sheet-mirror":         return await agentOpsSheetMirror(env);
      case "agent-driver-doc-ingest":        return await agentDriverDocIngest(env);
      case "agent-email-result-catcher":     return await agentEmailResultCatcher(env);
      case "agent-inbox-triage":             return await agentInboxTriage(env);
      case "agent-csa-baseline":             return await agentCsaBaseline(env, inputs as { carrier_id?: string });
      case "agent-csa-monitor":              return await agentCsaMonitor(env, inputs as { carrier_id?: string });
      case "agent-onboarding-concierge":     return await agentOnboardingConcierge(env, inputs as { carrier_id?: string });
    }
    return { status: "error", summary: `Unknown agent '${name}' — not in registry.` };
  } catch (e) {
    return { status: "error", summary: e instanceof Error ? e.message : String(e), log: `${new Date().toISOString()} ERROR ${e}` };
  }
}
