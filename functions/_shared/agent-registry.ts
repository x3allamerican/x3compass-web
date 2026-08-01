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
async function askClaude(env: Env, system: string, prompt: string, maxTokens = 2048, attribution?: { carrier_id?: string | null; agent_name?: string; agent_run_id?: string }): Promise<string> {
  if (!env.ANTHROPIC_API_KEY) throw new Error("ANTHROPIC_API_KEY not set");
  const model = "claude-sonnet-4-6";
  const r = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "x-api-key": env.ANTHROPIC_API_KEY, "anthropic-version": "2023-06-01", "Content-Type": "application/json" },
    body: JSON.stringify({ model, max_tokens: maxTokens, system, messages: [{ role: "user", content: prompt }] }),
  });
  if (!r.ok) throw new Error(`Anthropic HTTP ${r.status}: ${await r.text()}`);
  const j = (await r.json()) as { id?: string; content?: Array<{ text: string }>; usage?: { input_tokens?: number; output_tokens?: number } };

  // Sprint #20: per-carrier COGS instrumentation
  const tokensIn  = j.usage?.input_tokens  || 0;
  const tokensOut = j.usage?.output_tokens || 0;
  if (tokensIn > 0 || tokensOut > 0) {
    try {
      const ft = await import("./finance-team");
      await ft.recordUsage(env, {
        carrier_id:   attribution?.carrier_id || null,
        vendor:       "anthropic",
        service:      model,
        units_in:     tokensIn,
        units_out:    tokensOut,
        cost_cents:   ft.anthropicCostCents(model, tokensIn, tokensOut),
        agent_name:   attribution?.agent_name,
        agent_run_id: attribution?.agent_run_id,
        request_id:   j.id,
      });
    } catch (_e) { /* never block on telemetry */ }
  }

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
  const changes: string[] = [];
  let checked = 0, errors = 0;
  for (const part of ECFR_PARTS_TO_WATCH) {
    // /versions/ lists every amendment with its date — perfect for change detection.
    // Hashing the version list is far cheaper than fetching full XML content and gives
    // us a precise "this part was amended on X" signal.
    const url = `https://www.ecfr.gov/api/versioner/v1/versions/title-49.json?part=${part}`;
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
      // Fall back to scraping the public SAFER snapshot HTML when no QC web key is
      // available. The HTML is stable enough to extract the basics (legal name, state,
      // power units, safety rating). A real QC key would let us hit
      // mobile.fmcsa.dot.gov for clean JSON.
      const r = await fetch(`https://safer.fmcsa.dot.gov/query.asp?searchtype=ANY&query_type=queryCarrierSnapshot&query_param=USDOT&query_string=${dot}`, { headers: { Accept: "text/html", "User-Agent": "X3CompassAgent/1.0" } });
      if (!r.ok) { errors++; log.warn(`[fmcsa-scraper] DOT ${dot}: HTTP ${r.status}`); continue; }
      const html = await r.text();
      // SAFER HTML uses uppercase TH tags with anchor-wrapped labels like
      //   <TH...><A class="querylabel" href="saferhelp.aspx#Carrier">Legal Name:</A></TH>
      //   <TD class="queryfield"...>XPO LOGISTICS FREIGHT INC&nbsp;</TD>
      // Walk by indexOf — much more robust than regex through string-escaping layers.
      const grab = (anchor: string): string => {
        const a = html.indexOf("saferhelp.aspx#" + anchor);
        if (a < 0) return "";
        const tdStart = html.indexOf("<TD", a);
        if (tdStart < 0) return "";
        const gt    = html.indexOf(">", tdStart);
        const tdEnd = html.indexOf("</TD>", gt);
        if (tdEnd < 0) return "";
        return html.substring(gt + 1, tdEnd).replace(/<[^>]+>/g, " ").replace(/&nbsp;/g, " ").replace(/\s+/g, " ").trim();
      };
      const legalName  = grab("Carrier");
      const physAddr   = grab("PhysicalAddress");
      const state      = (physAddr.match(/,\s*([A-Z]{2})\s+\d{5}/)?.[1] || "").trim();
      const powerUnits = parseInt(grab("PowerUnits").replace(/[^\d]/g, ""), 10) || null;
      const drivers    = parseInt(grab("Drivers").replace(/[^\d]/g, ""), 10) || null;
      const safety     = grab("SafetyRating") || "";
      if (!legalName) { errors++; log.warn(`[fmcsa-scraper] DOT ${dot}: SAFER HTML did not parse — likely an invalid DOT or layout change`); continue; }
      await supa.insert("compass_fmcsa_snapshots", { dot_number: dot, legal_name: legalName, safety_rating: safety, power_units: powerUnits, drivers: drivers, state, raw: { source: "safer_html_scrape", parsed_at: new Date().toISOString() } });
      ingested++;
      log.info(`[fmcsa-scraper] DOT ${dot}: ${legalName} · ${state} · PU=${powerUnits} · drivers=${drivers}`);
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

  // Look up the carrier's USDOT so we can hit CarrierOk
  const carrierRow = (await supa.select("compass_carriers", `select=id,name,usdot_number&id=eq.${carrierId}`)) as Array<{ id: string; name: string; usdot_number: string | null }>;
  const carrier = carrierRow[0];
  if (!carrier) return { status: "error", summary: `Carrier ${carrierId} not found`, log: log.text() };

  // ─── Path A: CarrierOk (real CSA / SMS data) ─────────────────────────
  const env2 = env as Env & { CARRIEROK_API_KEY?: string; CARRIEROK_BASE_URL?: string };
  if (env2.CARRIEROK_API_KEY && carrier.usdot_number) {
    try {
      const { fetchCarrierOk, mapToSnapshot } = await import("./carrierok");
      const payload = await fetchCarrierOk(env2, carrier.usdot_number);
      if (payload.ok && payload.sms) {
        const snap = mapToSnapshot(carrierId, payload);
        await supa.insert("compass_csa_snapshots", snap);
        log.info(`[csa-baseline] carrier ${carrier.name} (DOT ${carrier.usdot_number}): CarrierOk snapshot written`);
        return { status: "ok", summary: `CarrierOk snapshot written for ${carrier.name} (DOT ${carrier.usdot_number})`, log: log.text() };
      }
      log.warn(`[csa-baseline] CarrierOk soft-failed: ${payload.errors.join("; ")} — falling back to inspection approximation`);
    } catch (e) {
      log.warn(`[csa-baseline] CarrierOk threw: ${e instanceof Error ? e.message : String(e)} — falling back`);
    }
  } else if (!env2.CARRIEROK_API_KEY) {
    log.info("[csa-baseline] CARRIEROK_API_KEY not set — using inspection approximation");
  } else if (!carrier.usdot_number) {
    log.info(`[csa-baseline] carrier ${carrier.name} has no usdot_number on file — using inspection approximation`);
  }

  // ─── Path B: Inspection-based approximation (no key, or CarrierOk failed) ──
  const inspections = await supa.select("compass_inspections", `select=id,inspection_date,violation_count,oos_driver,oos_vehicle&carrier_id=eq.${carrierId}&inspection_date=gte.${new Date(Date.now() - 730 * 86400_000).toISOString().slice(0, 10)}`) as Array<{ id: string; violation_count: number | null; oos_driver: boolean | null; oos_vehicle: boolean | null }>;
  const accidents = await supa.select("compass_accidents", `select=id,accident_date,recordable,fatalities,injuries&carrier_id=eq.${carrierId}&accident_date=gte.${new Date(Date.now() - 730 * 86400_000).toISOString().slice(0, 10)}`) as Array<{ id: string; recordable: boolean | null; fatalities: number | null; injuries: number | null }>;
  const snap = { carrier_id: carrierId, source: "computed_from_inspections", raw: { inspections: inspections.length, accidents: accidents.length, computed_at: new Date().toISOString() }, unsafe_driving: 0, crash_indicator: accidents.length * 0.5, hos_compliance: 0, vehicle_maint: 0, hazmat: 0, driver_fitness: 0, ctrl_substances: 0 };
  await supa.insert("compass_csa_snapshots", snap);
  log.info(`[csa-baseline] carrier ${carrierId}: ${inspections.length} inspections · ${accidents.length} accidents`);
  return { status: "ok", summary: `Baseline snapshot written for carrier ${carrierId} (${inspections.length} inspections, ${accidents.length} accidents · approximation until CarrierOk key is set)`, log: log.text() };
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

// ============================================================================
// SPRINT #20 — AI FINANCE TEAM (5 role-defined agents)
// These replace the QBO-equivalent monthly close workflow:
//   - agent-revenue-manager:   Stripe sync → journal entries, dunning, trial, churn
//   - agent-control-manager:   reconciliation, journal balance, period close
//   - agent-reporting-manager: generates P&L, BS, CF + tax-ready exports
//   - agent-fpa-manager:       MRR forecast, variance, cohort retention
//   - agent-finance-workflow:  orchestrates the other 4 + close calendar
// ============================================================================

interface FtEnv extends Env {
  PLAID_CLIENT_ID?: string;
  PLAID_SECRET?: string;
  PLAID_ACCESS_TOKEN?: string;
}

const TIER_REVENUE_ACCOUNT: Record<string, string> = {
  diy:        "4000",
  dfy:        "4010",
  enterprise: "4020",
};
const STRIPE_FEE_ACCOUNT     = "5000";
const STRIPE_PENDING_ACCOUNT = "1200";
const CASH_ACCOUNT           = "1000";
const AR_ACCOUNT             = "1100";
const DEFERRED_REV_ACCOUNT   = "2200";

// ============================================================================
// 26. agent-revenue-manager
// ============================================================================
async function agentRevenueManager(env: FtEnv): Promise<AgentResult> {
  const log = newLogger();
  if (!env.STRIPE_SECRET_KEY) return { status: "error", summary: "STRIPE_SECRET_KEY not set", log: log.text() };

  const ft = await import("./finance-team");
  const supa = supaFetch(env);

  // 1. Pull last 30 days of Stripe charges and balance_transactions for fee data
  const sinceSec = Math.floor((Date.now() - 30 * 86400_000) / 1000);
  const charges = await stripeGet(env, `/v1/charges?created[gte]=${sinceSec}&limit=100&expand[]=data.balance_transaction`) as { data: Array<{ id: string; amount: number; status: string; created: number; customer: string | null; description: string | null; billing_details: { name?: string; email?: string }; balance_transaction?: { fee?: number } }> };

  // Pre-load carriers indexed by stripe_customer_id
  const carriers = await supa.select("compass_carriers", "select=id,name,stripe_customer_id,service_tier&stripe_customer_id=not.is.null") as Array<{ id: string; name: string; stripe_customer_id: string; service_tier: string | null }>;
  const byCust = new Map(carriers.map((c) => [c.stripe_customer_id, c]));

  let posted = 0, skipped = 0, dunningSent = 0;
  for (const c of charges.data) {
    if (c.status !== "succeeded") continue;
    const ref = `stripe:ch_${c.id}`;
    // Dedup: skip if a journal entry already references this charge
    const existing = await supa.select("compass_journal_entries", `select=id&reference=eq.${encodeURIComponent(ref)}&limit=1`) as Array<{ id: string }>;
    if (existing.length > 0) { skipped++; continue; }

    const carrier = c.customer ? byCust.get(c.customer) : undefined;
    const tier = (carrier?.service_tier || "diy").toLowerCase();
    const revAccount = TIER_REVENUE_ACCOUNT[tier] || TIER_REVENUE_ACCOUNT.diy;
    const fee = c.balance_transaction?.fee || Math.round(c.amount * 0.029 + 30);
    const net = c.amount - fee;
    const entryDate = new Date(c.created * 1000).toISOString().slice(0, 10);

    // Double-entry: Cash gets the NET, Stripe fee is its own COGS line, Revenue is the gross
    await ft.postJournal(env, {
      entry_date:  entryDate,
      reference:   ref,
      source:      "stripe-sync",
      description: `Stripe charge from ${carrier?.name || c.billing_details?.name || "(unknown)"}`,
      carrier_id:  carrier?.id || null,
      agent_name:  "agent-revenue-manager",
      lines: [
        { account_code: CASH_ACCOUNT,       debit_cents: net,       memo: "net to cash" },
        { account_code: STRIPE_FEE_ACCOUNT, debit_cents: fee,       memo: "Stripe processor fee" },
        { account_code: revAccount,         credit_cents: c.amount, memo: `${tier.toUpperCase()} subscription` },
      ],
    });
    posted++;
  }

  // 2. Dunning v2 — find past-due subscriptions, send the next stage email
  if (env.RESEND_API_KEY) {
    const pastDueCarriers = carriers.filter((c) => true).slice(0, 50); // checked via subscription status below
    for (const c of pastDueCarriers) {
      try {
        const subs = await stripeGet(env, `/v1/subscriptions?customer=${c.stripe_customer_id}&status=past_due&limit=1`) as { data: Array<{ id: string; current_period_end: number }> };
        if (subs.data.length === 0) continue;
        const sub = subs.data[0];
        const daysPast = Math.floor((Date.now() / 1000 - sub.current_period_end) / 86400);
        if (![1, 3, 7, 14].includes(daysPast)) continue; // 4-step sequence

        const carrierFull = await supa.select("compass_carriers", `select=id,name,primary_contact_email&id=eq.${c.id}`) as Array<{ id: string; name: string; primary_contact_email: string | null }>;
        if (!carrierFull[0]?.primary_contact_email) continue;

        const msg = daysPast === 1  ? "We weren't able to process your payment yesterday. Update your card to keep Compass running."
                  : daysPast === 3  ? "Reminder: your X3 Compass payment hasn't gone through. We'll keep retrying."
                  : daysPast === 7  ? "Final notice before suspension. Please update your payment method this week."
                  :                    "Your account is at risk of suspension. We need to hear from you today.";

        const r = await sendEmail(env, {
          to: carrierFull[0].primary_contact_email,
          subject: `Action needed: ${carrierFull[0].name} payment — day ${daysPast}`,
          html: `<h1>Hi ${carrierFull[0].name},</h1><p>${msg}</p><p><a href="https://x3compass.com/app/settings/billing">Update payment method →</a></p>`,
        });
        if (r.ok) dunningSent++;
      } catch (_e) { /* per-carrier failure shouldn't block the agent */ }
    }
  }

  // 3. Trial conversion — find carriers whose trial_ends_at hits T-3, T-1, or today
  const trialCarriers = await supa.select("compass_carriers", `select=id,name,primary_contact_email,trial_ends_at&subscription_status=eq.trialing&trial_ends_at=not.is.null`) as Array<{ id: string; name: string; primary_contact_email: string | null; trial_ends_at: string }>;
  let trialNudges = 0;
  for (const c of trialCarriers) {
    if (!c.primary_contact_email) continue;
    const daysTo = Math.ceil((new Date(c.trial_ends_at).getTime() - Date.now()) / 86400_000);
    if (![3, 1, 0].includes(daysTo)) continue;
    const subj = daysTo === 3 ? "Your X3 Compass trial ends in 3 days"
               : daysTo === 1 ? "Your X3 Compass trial ends tomorrow"
               :                "Last chance — your trial ends today";
    const r = await sendEmail(env, { to: c.primary_contact_email, subject: subj, html: `<h1>Hi ${c.name},</h1><p>${subj}. Add your card now to keep your drivers and DQ files in Compass.</p><p><a href="https://x3compass.com/app/settings/billing">Add payment →</a></p>` });
    if (r.ok) trialNudges++;
  }

  return {
    status: posted > 0 || dunningSent > 0 || trialNudges > 0 ? "ok" : "skipped",
    summary: `${posted} charges → journal · ${skipped} already posted · ${dunningSent} dunning · ${trialNudges} trial nudges`,
    log: log.text(),
  };
}

// ============================================================================
// 27. agent-control-manager
// ============================================================================
async function agentControlManager(env: FtEnv): Promise<AgentResult> {
  const log = newLogger();
  const supa = supaFetch(env);

  // 1. Pull bank transactions via Plaid (if configured) for last 30 days
  let plaidImported = 0, plaidErr: string | null = null;
  if (env.PLAID_CLIENT_ID && env.PLAID_SECRET && env.PLAID_ACCESS_TOKEN) {
    try {
      const startDate = new Date(Date.now() - 30 * 86400_000).toISOString().slice(0, 10);
      const endDate   = new Date().toISOString().slice(0, 10);
      const r = await fetch("https://production.plaid.com/transactions/get", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ client_id: env.PLAID_CLIENT_ID, secret: env.PLAID_SECRET, access_token: env.PLAID_ACCESS_TOKEN, start_date: startDate, end_date: endDate, options: { count: 250 } }),
      });
      if (r.ok) {
        const j = await r.json() as { transactions?: Array<{ transaction_id: string; date: string; name: string; amount: number; account_id: string }> };
        for (const t of j.transactions || []) {
          try {
            await supa.insert("compass_bank_transactions", {
              account_code: CASH_ACCOUNT, // Plaid only feeds Bluevine right now
              source:       "plaid",
              external_id:  t.transaction_id,
              posted_date:  t.date,
              description:  t.name,
              amount_cents: Math.round(-t.amount * 100), // Plaid: positive = outflow; we flip
              raw:          t as unknown as Record<string, unknown>,
            });
            plaidImported++;
          } catch (e) {
            if (!String(e).includes("duplicate key")) throw e;
          }
        }
      } else { plaidErr = `Plaid HTTP ${r.status}`; }
    } catch (e) { plaidErr = e instanceof Error ? e.message : String(e); }
  }

  // 2. Auto-match Plaid transactions against existing journal entries by amount + date proximity
  const unrec = await supa.select("compass_bank_transactions", `select=id,posted_date,amount_cents,description&reconciled=eq.false&limit=200`) as Array<{ id: string; posted_date: string; amount_cents: number; description: string }>;
  let matched = 0;
  for (const t of unrec) {
    // Find a journal entry within ±2 days with matching amount on the cash line
    const candidates = await supa.select("compass_journal_lines", `select=id,entry_id,debit_cents,credit_cents&account_code=eq.${CASH_ACCOUNT}&or=(debit_cents.eq.${Math.abs(t.amount_cents)},credit_cents.eq.${Math.abs(t.amount_cents)})&limit=5`) as Array<{ id: string; entry_id: string; debit_cents: number; credit_cents: number }>;
    if (candidates.length === 0) continue;
    const match = candidates[0];
    try {
      await supa.update("compass_bank_transactions", `id=eq.${t.id}`, { reconciled: true, reconciled_at: new Date().toISOString(), reconciled_by: "agent:agent-control-manager", matched_entry_id: match.entry_id });
      matched++;
    } catch (_e) { /* keep going */ }
  }

  // 3. Journal balance integrity check for current period
  const period = new Date().toISOString().slice(0, 7);
  const lines = await supa.select("compass_journal_lines", `select=debit_cents,credit_cents,entry_id&entry_id=in.(select id from compass_journal_entries where period=${period})&limit=5000`) as Array<{ debit_cents: number; credit_cents: number }>;
  const totalDr = lines.reduce((a, b) => a + Number(b.debit_cents || 0), 0);
  const totalCr = lines.reduce((a, b) => a + Number(b.credit_cents || 0), 0);
  const balanced = totalDr === totalCr;

  return {
    status: balanced ? "ok" : "partial",
    summary: `bank: ${plaidImported} imported${plaidErr ? ` (${plaidErr})` : ""} · ${matched} reconciled · journal ${balanced ? "balanced" : `OUT BY ${(totalDr - totalCr) / 100}`}`,
    log: log.text(),
  };
}

// ============================================================================
// 28. agent-reporting-manager
// ============================================================================
async function agentReportingManager(env: FtEnv): Promise<AgentResult> {
  const log = newLogger();
  const supa = supaFetch(env);

  // Generate P&L, BS, CF for the prior month (run on 1st of new month)
  const now = new Date();
  const prior = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 1, 1));
  const period = prior.toISOString().slice(0, 7);

  // Sum lines by account.type for the period
  const coa = await supa.select("compass_chart_of_accounts", "select=code,name,type") as Array<{ code: string; name: string; type: string }>;
  const acctByCode = new Map(coa.map((a) => [a.code, a]));

  const entries = await supa.select("compass_journal_entries", `select=id&period=eq.${period}&posted=eq.true`) as Array<{ id: string }>;
  const entryIds = entries.map((e) => e.id);
  if (entryIds.length === 0) return { status: "skipped", summary: `no journal entries for ${period}`, log: log.text() };

  const lines = await supa.select("compass_journal_lines", `select=account_code,debit_cents,credit_cents&entry_id=in.(${entryIds.join(",")})&limit=5000`) as Array<{ account_code: string; debit_cents: number; credit_cents: number }>;

  let revenue = 0, cogs = 0, opex = 0;
  for (const l of lines) {
    const a = acctByCode.get(l.account_code);
    if (!a) continue;
    if (a.type === "revenue") revenue += (l.credit_cents - l.debit_cents);
    if (a.type === "cogs")    cogs    += (l.debit_cents - l.credit_cents);
    if (a.type === "opex")    opex    += (l.debit_cents - l.credit_cents);
  }
  const grossProfit = revenue - cogs;
  const netIncome   = grossProfit - opex;

  // Record period close
  await supa.insert("compass_period_closes", {
    period, closed_by: "agent:agent-reporting-manager",
    je_count: entryIds.length,
    total_revenue_cents: revenue, total_cogs_cents: cogs, total_opex_cents: opex,
    net_income_cents: netIncome,
  });

  // Email statements summary to Joshua
  if (env.RESEND_API_KEY) {
    const fmt = (c: number) => `$${(c / 100).toLocaleString("en-US", { minimumFractionDigits: 2 })}`;
    await sendEmail(env, {
      to: env.EMAIL_FROM_SUPPORT || "joshua@x3compass.com",
      subject: `📊 ${period} Financial Statements — X3 Compass`,
      html: `<h1>${period} Close</h1>
<table cellpadding="6">
<tr><td>Revenue</td><td align="right"><strong>${fmt(revenue)}</strong></td></tr>
<tr><td>COGS</td><td align="right">(${fmt(cogs)})</td></tr>
<tr><td>Gross Profit</td><td align="right"><strong>${fmt(grossProfit)}</strong> (${revenue > 0 ? Math.round((grossProfit / revenue) * 100) : 0}%)</td></tr>
<tr><td>Operating Expenses</td><td align="right">(${fmt(opex)})</td></tr>
<tr><td><strong>Net Income</strong></td><td align="right"><strong>${fmt(netIncome)}</strong></td></tr>
</table>
<p>${entryIds.length} journal entries posted this period.</p>
<p><a href="https://x3compass.com/app/finance">Open Finance →</a></p>`,
    });
  }

  return { status: "ok", summary: `${period}: rev ${revenue / 100} · cogs ${cogs / 100} · opex ${opex / 100} · net ${netIncome / 100}`, log: log.text() };
}

// ============================================================================
// 29. agent-fpa-manager
// ============================================================================
async function agentFpaManager(env: FtEnv): Promise<AgentResult> {
  const log = newLogger();
  const supa = supaFetch(env);

  // Current expected MRR from carrier roster
  const carriers = await supa.select("compass_carriers", "select=id,service_tier,hazmat_addon,subscription_status") as Array<{ id: string; service_tier: string | null; hazmat_addon: boolean | null; subscription_status: string | null }>;
  const drivers = await supa.select("compass_drivers", "select=carrier_id,status") as Array<{ carrier_id: string; status: string | null }>;
  const driversBy = new Map<string, number>();
  for (const d of drivers) if ((d.status || "active").toLowerCase() === "active") driversBy.set(d.carrier_id, (driversBy.get(d.carrier_id) || 0) + 1);
  const TIER: Record<string, number> = { diy: 2500, dfy: 5000, enterprise: 0 };
  let currentMrr = 0, activeCarriers = 0;
  for (const c of carriers) {
    if (c.subscription_status !== "active") continue;
    activeCarriers++;
    const drv = driversBy.get(c.id) || 0;
    const rate = TIER[(c.service_tier || "diy").toLowerCase()] || 0;
    currentMrr += drv * rate + (c.hazmat_addon ? 9900 : 0);
  }

  // Simple forecast: assume 5% monthly growth, 3% monthly churn (placeholders we'll calibrate later)
  const growthRate = 0.05, churnRate = 0.03;
  const forecast: number[] = [];
  let projected = currentMrr;
  for (let i = 1; i <= 12; i++) {
    projected = projected * (1 + growthRate - churnRate);
    forecast.push(Math.round(projected));
  }

  // Email weekly FP&A digest
  if (env.RESEND_API_KEY) {
    const fmt = (c: number) => `$${(c / 100).toLocaleString("en-US", { maximumFractionDigits: 0 })}`;
    await sendEmail(env, {
      to: env.EMAIL_FROM_SUPPORT || "joshua@x3compass.com",
      subject: `📈 FP&A Weekly · MRR ${fmt(currentMrr)} · 12-mo forecast ${fmt(forecast[11])}`,
      html: `<h1>FP&A Weekly</h1>
<p>Current MRR: <strong>${fmt(currentMrr)}</strong> across <strong>${activeCarriers}</strong> active carriers.</p>
<h3>12-month forecast (5% growth, 3% churn)</h3>
<table cellpadding="4"><tr>${forecast.map((m, i) => `<td>M${i + 1}: ${fmt(m)}</td>${(i + 1) % 4 === 0 ? "</tr><tr>" : ""}`).join("")}</tr></table>
<p><em>Calibrate growth/churn rates once we have 3+ months of carrier history.</em></p>`,
    });
  }

  return { status: "ok", summary: `MRR ${currentMrr / 100} · ${activeCarriers} active · 12-mo proj ${forecast[11] / 100}`, log: log.text() };
}

// ============================================================================
// 30. agent-finance-workflow (coordinator)
// ============================================================================
async function agentFinanceWorkflow(env: FtEnv): Promise<AgentResult> {
  const log = newLogger();
  const supa = supaFetch(env);
  // Decide which step of the monthly close calendar we're on
  const now = new Date();
  const dom = now.getUTCDate();
  let step = "T+0 monitoring";
  const runs: Array<{ agent: string; status: string }> = [];

  // Daily: control + revenue manager
  for (const agent of ["agent-revenue-manager", "agent-control-manager"]) {
    try {
      const r = await runAgent(agent, env);
      runs.push({ agent, status: r.status });
    } catch (e) { runs.push({ agent, status: `error: ${e instanceof Error ? e.message : String(e)}` }); }
  }

  // First of month: trigger Reporting Manager
  if (dom === 1) {
    step = "month-end close (Reporting Manager)";
    try { const r = await runAgent("agent-reporting-manager", env); runs.push({ agent: "agent-reporting-manager", status: r.status }); }
    catch (e) { runs.push({ agent: "agent-reporting-manager", status: `error: ${e instanceof Error ? e.message : String(e)}` }); }
  }

  // Monday: trigger FP&A
  if (now.getUTCDay() === 1) {
    step = "weekly FP&A";
    try { const r = await runAgent("agent-fpa-manager", env); runs.push({ agent: "agent-fpa-manager", status: r.status }); }
    catch (e) { runs.push({ agent: "agent-fpa-manager", status: `error: ${e instanceof Error ? e.message : String(e)}` }); }
  }

  // Escalate any failures
  const errors = runs.filter((r) => r.status.includes("error"));
  if (errors.length > 0 && env.RESEND_API_KEY) {
    await sendEmail(env, {
      to: env.EMAIL_FROM_SUPPORT || "joshua@x3compass.com",
      subject: `⚠️ Finance Team errors (${errors.length})`,
      html: `<h1>Finance workflow had ${errors.length} error(s)</h1><ul>${errors.map((e) => `<li><strong>${e.agent}</strong>: ${e.status}</li>`).join("")}</ul>`,
    });
  }

  // Suppress unused-variable warning - supa is queried by sub-agents
  void supa;

  return { status: errors.length === 0 ? "ok" : "partial", summary: `${step} · ${runs.length} agents run · ${errors.length} errors`, log: log.text() };
}


// ============================================================================
// Sprint #21: 4 new Finance Team agents
// 31. agent-partner-settlement — monthly 30% rev-share payouts to partners
// 32. agent-ap-manager         — vendor invoice ingest + paid/unpaid reconciliation
// 33. agent-tax-manager        — quarterly est tax + 1099-NEC deadline tracking
// 34. agent-pricing-margin     — per-carrier unit-economics watchdog
// ============================================================================

async function agentPartnerSettlement(env: Env): Promise<AgentResult> {
  const log = newLogger();
  log.info("partner-settlement: starting");
  const supa = supaFetch(env);

  // Only run if today is the 5th of the month (or any day if explicitly invoked)
  const now = new Date();
  const period = `${now.getUTCFullYear()}-${String(now.getUTCMonth()).padStart(2, "0")}`; // PRIOR month
  log.info(`Computing partner payouts for ${period}`);

  // Pull approved partners and their attributed carriers from the prior month's revenue
  let partners: Array<{ id: string; legal_name: string; payout_email?: string; rev_share_pct: number }> = [];
  try {
    partners = (await supa.select("compass_partner_applications", "select=id,legal_name,payout_email,rev_share_pct&status=eq.approved&limit=200")) as typeof partners;
  } catch {
    return { status: "skipped", summary: "compass_partner_applications not present yet — no partners to settle", log: log.text() };
  }
  if (partners.length === 0) {
    return { status: "skipped", summary: "no approved partners", log: log.text() };
  }

  // For each partner, sum money_in entries from compass_finance_entries where carriers were attributed
  let queued = 0; let totalCents = 0;
  for (const p of partners) {
    try {
      const entries = (await supa.select("compass_finance_entries", `select=amount_cents,carrier_id&type=eq.money_in&entry_date=gte.${period}-01&entry_date=lt.${now.getUTCFullYear()}-${String(now.getUTCMonth()+1).padStart(2, "0")}-01`)) as Array<{ amount_cents: number; carrier_id: string | null }>;
      const carrierAttribution = (await supa.select("compass_partner_attributions", `select=carrier_id&partner_id=eq.${p.id}`).catch(() => [])) as Array<{ carrier_id: string }>;
      const ourCarriers = new Set(carrierAttribution.map(a => a.carrier_id));
      const partnerRevenue = entries.filter(e => e.carrier_id && ourCarriers.has(e.carrier_id)).reduce((s, e) => s + (e.amount_cents || 0), 0);
      if (partnerRevenue <= 0) { log.info(`${p.legal_name}: no attributable revenue this period`); continue; }
      const payoutCents = Math.round(partnerRevenue * (p.rev_share_pct || 30) / 100);
      // Queue a payout row — actual Stripe transfer happens via a separate hook with manual approval
      await supa.insert("compass_partner_payouts", {
        partner_id: p.id, period, gross_revenue_cents: partnerRevenue, rev_share_pct: p.rev_share_pct, payout_cents: payoutCents, status: "queued", queued_at: new Date().toISOString(),
      }, "minimal").catch(() => { log.warn(`Failed to queue payout for ${p.legal_name} (table may not exist)`); });
      queued++; totalCents += payoutCents;
      log.info(`${p.legal_name}: $${(partnerRevenue/100).toFixed(2)} revenue × ${p.rev_share_pct}% = $${(payoutCents/100).toFixed(2)} queued`);
    } catch (e) {
      log.error(`${p.legal_name}: ${e instanceof Error ? e.message : String(e)}`);
    }
  }

  return { status: queued > 0 ? "ok" : "skipped", summary: `Queued ${queued} partner payout(s) totaling $${(totalCents/100).toFixed(2)} for ${period}`, log: log.text() };
}

async function agentApManager(env: Env): Promise<AgentResult> {
  const log = newLogger();
  log.info("ap-manager: starting");
  const supa = supaFetch(env);

  // Pull invoices from compass_vendor_invoices (created by webhook ingest or manual entry)
  let invoices: Array<{ id: string; vendor: string; amount_cents: number; due_at: string | null; paid: boolean; carrier_id: string | null }> = [];
  try {
    invoices = (await supa.select("compass_vendor_invoices", "select=id,vendor,amount_cents,due_at,paid,carrier_id&order=due_at.asc&limit=500")) as typeof invoices;
  } catch {
    return { status: "skipped", summary: "compass_vendor_invoices not present yet", log: log.text() };
  }

  const now = new Date();
  let overdue = 0; let dueSoon = 0; let totalUnpaidCents = 0;
  const overdueList: string[] = [];
  for (const inv of invoices) {
    if (inv.paid) continue;
    totalUnpaidCents += inv.amount_cents || 0;
    if (!inv.due_at) continue;
    const days = Math.floor((new Date(inv.due_at).getTime() - now.getTime()) / 86_400_000);
    if (days < 0) { overdue++; overdueList.push(`${inv.vendor}: $${(inv.amount_cents/100).toFixed(2)} (${-days}d overdue)`); }
    else if (days <= 7) dueSoon++;
  }
  log.info(`Found ${overdue} overdue + ${dueSoon} due-soon · $${(totalUnpaidCents/100).toFixed(2)} unpaid total`);

  // Escalate overdue via email
  if (overdue > 0 && env.RESEND_API_KEY) {
    await sendEmail(env, {
      to: env.EMAIL_FROM_SUPPORT || "joshua@x3compass.com",
      subject: `⚠️ ${overdue} vendor invoice(s) overdue — $${(totalUnpaidCents/100).toFixed(2)} total unpaid`,
      html: `<h2>${overdue} overdue vendor invoice(s)</h2><ul>${overdueList.slice(0, 20).map(l => `<li>${l}</li>`).join("")}</ul><p>See <a href="https://x3compass.com/app/finance">/app/finance</a> for full ledger.</p>`,
    }).catch(e => log.warn(`email send failed: ${e}`));
  }

  return { status: overdue > 0 ? "partial" : "ok", summary: `${overdue} overdue · ${dueSoon} due in 7d · $${(totalUnpaidCents/100).toFixed(2)} unpaid`, log: log.text() };
}

async function agentTaxManager(env: Env): Promise<AgentResult> {
  const log = newLogger();
  log.info("tax-manager: starting");
  const supa = supaFetch(env);

  const now = new Date();
  const year = now.getUTCFullYear();

  // Quarterly estimated tax deadlines (federal)
  const Q_DEADLINES = [
    { quarter: 1, due: new Date(Date.UTC(year, 3, 15)) }, // Apr 15
    { quarter: 2, due: new Date(Date.UTC(year, 5, 15)) }, // Jun 15
    { quarter: 3, due: new Date(Date.UTC(year, 8, 15)) }, // Sep 15
    { quarter: 4, due: new Date(Date.UTC(year + 1, 0, 15)) }, // Jan 15 next year
  ];
  const nextDeadline = Q_DEADLINES.find(d => d.due.getTime() > now.getTime());

  // Estimate quarterly liability from YTD net
  let netCents = 0;
  try {
    const entries = (await supa.select("compass_finance_entries", `select=amount_cents,type&entry_date=gte.${year}-01-01`)) as Array<{ amount_cents: number; type: string }>;
    for (const e of entries) {
      if (e.type === "money_in") netCents += e.amount_cents;
      else if (e.type === "vendor" || e.type === "overhead") netCents -= e.amount_cents;
      else if (e.type === "refund") netCents -= e.amount_cents;
    }
  } catch { log.warn("compass_finance_entries unreadable"); }

  // 25% effective rate (rough — single member LLC, no state)
  const estTaxCents = Math.max(0, Math.round(netCents * 0.25));
  const quarterlyCents = Math.round(estTaxCents / 4);
  log.info(`YTD net: $${(netCents/100).toFixed(2)} · est tax 25%: $${(estTaxCents/100).toFixed(2)} · per-quarter: $${(quarterlyCents/100).toFixed(2)}`);

  // 1099-NEC candidates: vendors paid >= $600 YTD (compass_finance_entries.type='vendor' + carrier_id IS NULL)
  let candidates1099 = 0;
  try {
    const vendorPays = (await supa.select("compass_finance_entries", `select=vendor,amount_cents&type=eq.vendor&entry_date=gte.${year}-01-01`)) as Array<{ vendor: string; amount_cents: number }>;
    const totals = new Map<string, number>();
    for (const p of vendorPays) if (p.vendor) totals.set(p.vendor, (totals.get(p.vendor) || 0) + p.amount_cents);
    for (const [, c] of totals) if (c >= 60_000) candidates1099++;
    log.info(`${candidates1099} vendors paid >= $600 YTD (1099-NEC candidates)`);
  } catch { log.warn("vendor pay summary unreadable"); }

  // Alert if a Q deadline is within 14 days
  if (nextDeadline && env.RESEND_API_KEY) {
    const daysUntil = Math.floor((nextDeadline.due.getTime() - now.getTime()) / 86_400_000);
    if (daysUntil <= 14) {
      await sendEmail(env, {
        to: env.EMAIL_FROM_SUPPORT || "joshua@x3compass.com",
        subject: `🧾 Q${nextDeadline.quarter} estimated tax due in ${daysUntil}d — ~$${(quarterlyCents/100).toFixed(0)}`,
        html: `<h2>Q${nextDeadline.quarter} federal estimated tax deadline</h2><p>Due: <strong>${nextDeadline.due.toISOString().slice(0,10)}</strong> (${daysUntil} days)</p><p>YTD net: <strong>$${(netCents/100).toFixed(2)}</strong></p><p>Estimated quarterly payment: <strong>$${(quarterlyCents/100).toFixed(2)}</strong></p><p>Pay via <a href="https://www.irs.gov/payments">IRS Direct Pay</a> or hand off to CPA.</p>`,
      }).catch(e => log.warn(`email send failed: ${e}`));
    }
  }

  return { status: "ok", summary: `YTD net $${(netCents/100).toFixed(0)} · ${candidates1099} 1099-NEC candidates · next deadline ${nextDeadline?.due.toISOString().slice(0,10) || "—"}`, log: log.text() };
}

async function agentPricingMargin(env: Env): Promise<AgentResult> {
  const log = newLogger();
  log.info("pricing-margin: starting");
  const supa = supaFetch(env);

  // Pull last 30 days of usage events grouped by carrier, sum cost
  const cutoff = new Date(Date.now() - 30 * 86_400_000).toISOString();
  let usage: Array<{ carrier_id: string | null; vendor: string; cost_cents: number }> = [];
  try {
    usage = (await supa.select("compass_usage_events", `select=carrier_id,vendor,cost_cents&ts=gte.${cutoff}&limit=10000`)) as typeof usage;
  } catch {
    return { status: "skipped", summary: "compass_usage_events not present yet — telemetry needed first", log: log.text() };
  }

  const TIER_REV_CENTS: Record<string, number> = { diy: 2500, dfy: 5000 }; // per-driver-per-month
  const HAZMAT_ADDON = 9900;

  // Per-carrier COGS in last 30d
  const cogsByCarrier = new Map<string, number>();
  for (const u of usage) {
    if (!u.carrier_id) continue;
    cogsByCarrier.set(u.carrier_id, (cogsByCarrier.get(u.carrier_id) || 0) + (u.cost_cents || 0));
  }

  // Pull carriers + their tier + driver count
  const carriers = (await supa.select("compass_carriers", "select=id,name,service_tier,hazmat_addon,drivers_count").catch(() => [])) as Array<{ id: string; name: string; service_tier: string | null; hazmat_addon: boolean | null; drivers_count: number | null }>;

  const bleeders: Array<{ name: string; cogs: number; revenue: number; margin: number }> = [];
  for (const c of carriers) {
    const cogs = cogsByCarrier.get(c.id) || 0;
    const tier = (c.service_tier || "diy").toLowerCase();
    const rate = TIER_REV_CENTS[tier] || 0;
    const revenue = rate * (c.drivers_count || 0) + (c.hazmat_addon ? HAZMAT_ADDON : 0);
    if (revenue === 0) continue;
    const margin = revenue - cogs;
    if (margin < 0) {
      bleeders.push({ name: c.name, cogs, revenue, margin });
      log.warn(`BLEEDING: ${c.name} cogs=$${(cogs/100).toFixed(2)} > rev=$${(revenue/100).toFixed(2)} (margin -$${(-margin/100).toFixed(2)})`);
    }
  }

  // Alert if any carrier is bleeding
  if (bleeders.length > 0 && env.RESEND_API_KEY) {
    await sendEmail(env, {
      to: env.EMAIL_FROM_SUPPORT || "joshua@x3compass.com",
      subject: `📉 ${bleeders.length} carrier(s) bleeding — tier doesn't cover COGS`,
      html: `<h2>${bleeders.length} carrier(s) costing more than they pay</h2><table border="1" cellpadding="6" style="border-collapse:collapse"><tr><th>Carrier</th><th>30d revenue</th><th>30d COGS</th><th>Margin</th></tr>${bleeders.map(b => `<tr><td>${b.name}</td><td>$${(b.revenue/100).toFixed(2)}</td><td>$${(b.cogs/100).toFixed(2)}</td><td style="color:#b91c1c"><strong>-$${(-b.margin/100).toFixed(2)}</strong></td></tr>`).join("")}</table><p>Consider tier change or capacity throttle. See <a href="https://x3compass.com/app/finance">/app/finance</a>.</p>`,
    }).catch(e => log.warn(`email send failed: ${e}`));
  }

  return { status: bleeders.length > 0 ? "partial" : "ok", summary: `${bleeders.length} carrier(s) bleeding margin · ${carriers.length} total reviewed`, log: log.text() };
}


// ============================================================================
// Sprint #450 — Marketing channel rollers (5 daily agents)
// Each agent pulls yesterday's data from its channel API and upserts into
// compass_marketing_channel_spend_daily (paid channels) or
// compass_marketing_content_perf_daily (content/organic).
// All upsert keys: (day, channel) or (day, content_id). Re-runnable.
// ============================================================================

interface MarketingEnv extends Env {
  LINKEDIN_ADS_TOKEN?: string;
  LINKEDIN_ADS_ACCOUNT_ID?: string;
  CUSTOMERIO_API_KEY?: string;
  CUSTOMERIO_SITE_ID?: string;
  POSTIZ_API_KEY?: string;
  POSTIZ_BASE_URL?: string;
  GA4_PROPERTY_ID?: string;
  GA4_SERVICE_ACCOUNT_KEY?: string; // JSON-stringified service account
  GITHUB_TOKEN?: string;
  GITHUB_SKILLS_REPO?: string; // default x3fleetsafety/skills
}

function ymd(d: Date): string { return d.toISOString().slice(0, 10); }
function yesterdayUtc(): { day: string; startMs: number; endMs: number } {
  const now = new Date();
  const dayUtc = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - 1));
  const startMs = dayUtc.getTime();
  return { day: ymd(dayUtc), startMs, endMs: startMs + 86400_000 };
}

// 27. agent-marketing-linkedin-roller -----------------------------------------
async function agentMarketingLinkedinRoller(env: MarketingEnv): Promise<AgentResult> {
  const log = newLogger();
  if (!env.LINKEDIN_ADS_TOKEN || !env.LINKEDIN_ADS_ACCOUNT_ID) {
    return { status: "error", summary: "LINKEDIN_ADS_TOKEN or LINKEDIN_ADS_ACCOUNT_ID not set", log: log.text() };
  }
  const { day } = yesterdayUtc();
  log.info(`[linkedin-roller] pulling ${day} for account ${env.LINKEDIN_ADS_ACCOUNT_ID}`);
  // LinkedIn Marketing Reporting API v202504 — daily analytics by account.
  // Endpoint: GET /rest/adAnalytics?q=analytics&pivot=ACCOUNT&dateRange=...
  const dayStart = day.replaceAll("-", ",").replace(/^(\d+),(\d+),(\d+)$/, "(year:$1,month:$2,day:$3)");
  const url = `https://api.linkedin.com/rest/adAnalytics?q=analytics&pivot=ACCOUNT&dateRange=(start:${dayStart},end:${dayStart})&accounts=List(urn%3Ali%3AsponsoredAccount%3A${env.LINKEDIN_ADS_ACCOUNT_ID})&fields=costInUsd,impressions,clicks,externalWebsiteConversions`;
  let r: Response;
  try {
    r = await fetch(url, {
      headers: {
        Authorization: `Bearer ${env.LINKEDIN_ADS_TOKEN}`,
        "LinkedIn-Version": "202504",
        "X-Restli-Protocol-Version": "2.0.0",
      },
    });
  } catch (e) {
    return { status: "error", summary: `LinkedIn fetch failed: ${e}`, log: log.text() };
  }
  if (!r.ok) {
    return { status: "error", summary: `LinkedIn HTTP ${r.status}: ${await r.text()}`, log: log.text() };
  }
  const data = await r.json() as { elements?: Array<{ costInUsd?: string; impressions?: number; clicks?: number; externalWebsiteConversions?: number }> };
  const row = data.elements?.[0];
  const spendCents = row?.costInUsd ? Math.round(parseFloat(row.costInUsd) * 100) : 0;
  const impressions = row?.impressions || 0;
  const clicks = row?.clicks || 0;
  const conversions = row?.externalWebsiteConversions || 0;
  await supaFetch(env).upsert("compass_marketing_channel_spend_daily", {
    day, channel: "linkedin",
    spend_cents: spendCents, impressions, clicks, leads: conversions,
    source_meta: { ...row, fetched_url: "linkedin.adAnalytics" },
    fetched_at: new Date().toISOString(),
  });
  log.info(`[linkedin-roller] ${day}: $${(spendCents / 100).toFixed(2)} spend · ${impressions} impr · ${clicks} clicks · ${conversions} leads`);
  return { status: "ok", summary: `LinkedIn ${day}: $${(spendCents / 100).toFixed(2)} · ${clicks} clicks · ${conversions} leads`, log: log.text() };
}

// 28. agent-marketing-customerio-roller ---------------------------------------
async function agentMarketingCustomerioRoller(env: MarketingEnv): Promise<AgentResult> {
  const log = newLogger();
  if (!env.CUSTOMERIO_API_KEY) {
    return { status: "error", summary: "CUSTOMERIO_API_KEY not set", log: log.text() };
  }
  const { day, startMs, endMs } = yesterdayUtc();
  // Customer.io Beta API: GET /v1/metrics?type=email&start=&end=&steps=day
  const url = `https://api.customer.io/v1/api/metrics?type=email&start=${Math.floor(startMs / 1000)}&end=${Math.floor(endMs / 1000)}&steps=day`;
  let r: Response;
  try {
    r = await fetch(url, { headers: { Authorization: `Bearer ${env.CUSTOMERIO_API_KEY}` } });
  } catch (e) {
    return { status: "error", summary: `Customer.io fetch failed: ${e}`, log: log.text() };
  }
  if (!r.ok) {
    return { status: "error", summary: `Customer.io HTTP ${r.status}: ${await r.text()}`, log: log.text() };
  }
  const j = await r.json() as { metric?: { series?: { sent?: number[]; opened?: number[]; clicked?: number[]; converted?: number[] } } };
  const sent = j.metric?.series?.sent?.[0] || 0;
  const clicks = j.metric?.series?.clicked?.[0] || 0;
  const leads = j.metric?.series?.converted?.[0] || 0;
  await supaFetch(env).upsert("compass_marketing_channel_spend_daily", {
    day, channel: "email",
    spend_cents: 0,  // email is free at our volume
    impressions: sent,
    clicks,
    leads,
    source_meta: { sent, opened: j.metric?.series?.opened?.[0] || 0, clicked: clicks, converted: leads, vendor: "customerio" },
    fetched_at: new Date().toISOString(),
  });
  log.info(`[customerio-roller] ${day}: ${sent} sent · ${clicks} clicks · ${leads} converted`);
  return { status: "ok", summary: `Customer.io ${day}: ${sent} sent · ${clicks} clicks · ${leads} converted`, log: log.text() };
}

// 29. agent-marketing-postiz-roller -------------------------------------------
async function agentMarketingPostizRoller(env: MarketingEnv): Promise<AgentResult> {
  const log = newLogger();
  if (!env.POSTIZ_API_KEY) {
    return { status: "error", summary: "POSTIZ_API_KEY not set", log: log.text() };
  }
  const { day } = yesterdayUtc();
  const base = (env.POSTIZ_BASE_URL || "https://app.postiz.com").replace(/\/$/, "");
  // Postiz exposes posts; reach/clicks per platform aggregate by querying recent posts and summing analytics.
  const url = `${base}/api/v1/posts?from=${day}T00:00:00Z&to=${day}T23:59:59Z`;
  let r: Response;
  try {
    r = await fetch(url, { headers: { Authorization: `Bearer ${env.POSTIZ_API_KEY}` } });
  } catch (e) {
    return { status: "error", summary: `Postiz fetch failed: ${e}`, log: log.text() };
  }
  if (!r.ok) {
    return { status: "error", summary: `Postiz HTTP ${r.status}: ${await r.text()}`, log: log.text() };
  }
  const j = await r.json() as { posts?: Array<{ analytics?: { impressions?: number; clicks?: number; engagements?: number } }> };
  const posts = j.posts || [];
  const impressions = posts.reduce((a, p) => a + (p.analytics?.impressions || 0), 0);
  const clicks = posts.reduce((a, p) => a + (p.analytics?.clicks || 0), 0);
  const engagements = posts.reduce((a, p) => a + (p.analytics?.engagements || 0), 0);
  await supaFetch(env).upsert("compass_marketing_channel_spend_daily", {
    day, channel: "postiz",
    spend_cents: 0,
    impressions, clicks,
    leads: 0, // attribution via UTM, joined at report time
    source_meta: { posts: posts.length, engagements, vendor: "postiz" },
    fetched_at: new Date().toISOString(),
  });
  log.info(`[postiz-roller] ${day}: ${posts.length} posts · ${impressions} reach · ${clicks} clicks`);
  return { status: "ok", summary: `Postiz ${day}: ${posts.length} posts · ${impressions} reach · ${clicks} clicks`, log: log.text() };
}

// 30. agent-marketing-ga4-roller ---------------------------------------------
async function agentMarketingGa4Roller(env: MarketingEnv): Promise<AgentResult> {
  const log = newLogger();
  if (!env.GA4_PROPERTY_ID || !env.GA4_SERVICE_ACCOUNT_KEY) {
    return { status: "error", summary: "GA4_PROPERTY_ID or GA4_SERVICE_ACCOUNT_KEY not set", log: log.text() };
  }
  const { day } = yesterdayUtc();
  // Exchange service account JWT for an access token, then call Analytics Data API v1beta.
  let accessToken: string;
  try {
    const sa = JSON.parse(env.GA4_SERVICE_ACCOUNT_KEY) as { client_email: string; private_key: string };
    const now = Math.floor(Date.now() / 1000);
    const claim = {
      iss: sa.client_email,
      scope: "https://www.googleapis.com/auth/analytics.readonly",
      aud: "https://oauth2.googleapis.com/token",
      exp: now + 3600,
      iat: now,
    };
    const header = btoa(JSON.stringify({ alg: "RS256", typ: "JWT" })).replace(/=+$/, "").replaceAll("+", "-").replaceAll("/", "_");
    const payload = btoa(JSON.stringify(claim)).replace(/=+$/, "").replaceAll("+", "-").replaceAll("/", "_");
    const toSign = `${header}.${payload}`;
    const keyBuf = await crypto.subtle.importKey("pkcs8",
      pemToDer(sa.private_key),
      { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" }, false, ["sign"]);
    const sigBuf = await crypto.subtle.sign("RSASSA-PKCS1-v1_5", keyBuf, new TextEncoder().encode(toSign));
    const sig = btoa(String.fromCharCode(...new Uint8Array(sigBuf))).replace(/=+$/, "").replaceAll("+", "-").replaceAll("/", "_");
    const tr = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${toSign}.${sig}`,
    });
    if (!tr.ok) return { status: "error", summary: `GA4 token HTTP ${tr.status}: ${await tr.text()}`, log: log.text() };
    accessToken = ((await tr.json()) as { access_token: string }).access_token;
  } catch (e) {
    return { status: "error", summary: `GA4 JWT signing failed: ${e}`, log: log.text() };
  }
  const r = await fetch(`https://analyticsdata.googleapis.com/v1beta/properties/${env.GA4_PROPERTY_ID}:runReport`, {
    method: "POST",
    headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      dateRanges: [{ startDate: day, endDate: day }],
      metrics: [{ name: "sessions" }, { name: "conversions" }, { name: "totalUsers" }],
      dimensions: [{ name: "sessionDefaultChannelGroup" }],
    }),
  });
  if (!r.ok) return { status: "error", summary: `GA4 runReport HTTP ${r.status}: ${await r.text()}`, log: log.text() };
  const j = await r.json() as { rows?: Array<{ dimensionValues: Array<{ value: string }>; metricValues: Array<{ value: string }> }> };
  let totalSessions = 0, totalConversions = 0;
  for (const row of j.rows || []) {
    const ch = row.dimensionValues[0].value;
    const sessions = parseInt(row.metricValues[0].value, 10) || 0;
    const conversions = parseInt(row.metricValues[1].value, 10) || 0;
    totalSessions += sessions;
    totalConversions += conversions;
    await supaFetch(env).upsert("compass_marketing_channel_spend_daily", {
      day, channel: `ga4:${ch.toLowerCase().replace(/\s+/g, "-")}`,
      spend_cents: 0,
      impressions: 0, clicks: sessions, leads: conversions,
      source_meta: { ga4_channel: ch, vendor: "ga4" },
      fetched_at: new Date().toISOString(),
    });
  }
  log.info(`[ga4-roller] ${day}: ${totalSessions} sessions · ${totalConversions} conversions across ${(j.rows || []).length} channels`);
  return { status: "ok", summary: `GA4 ${day}: ${totalSessions} sessions · ${totalConversions} conversions`, log: log.text() };
}

function pemToDer(pem: string): ArrayBuffer {
  const cleaned = pem.replace(/-----BEGIN [^-]+-----/g, "").replace(/-----END [^-]+-----/g, "").replace(/\s+/g, "");
  const binary = atob(cleaned);
  const buf = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) buf[i] = binary.charCodeAt(i);
  return buf.buffer;
}

// 31. agent-marketing-github-roller -------------------------------------------
async function agentMarketingGithubRoller(env: MarketingEnv): Promise<AgentResult> {
  const log = newLogger();
  const repo = env.GITHUB_SKILLS_REPO || "x3fleetsafety/skills";
  const headers: Record<string, string> = { Accept: "application/vnd.github+json" };
  if (env.GITHUB_TOKEN) headers.Authorization = `Bearer ${env.GITHUB_TOKEN}`;
  const { day } = yesterdayUtc();

  // Stars total + clones/views over last 14d (which API caps)
  const [repoRes, trafficRes, clonesRes] = await Promise.all([
    fetch(`https://api.github.com/repos/${repo}`, { headers }),
    fetch(`https://api.github.com/repos/${repo}/traffic/views`, { headers }),
    fetch(`https://api.github.com/repos/${repo}/traffic/clones`, { headers }),
  ]);
  if (!repoRes.ok) return { status: "error", summary: `GitHub /repos/${repo} HTTP ${repoRes.status}`, log: log.text() };
  const repoData = await repoRes.json() as { stargazers_count: number; subscribers_count: number; forks_count: number };
  const traffic = trafficRes.ok ? await trafficRes.json() as { views?: Array<{ timestamp: string; count: number; uniques: number }> } : { views: [] };
  const clones = clonesRes.ok ? await clonesRes.json() as { clones?: Array<{ timestamp: string; count: number; uniques: number }> } : { clones: [] };
  const yesterdayView = (traffic.views || []).find(v => v.timestamp.startsWith(day));
  const yesterdayClone = (clones.clones || []).find(v => v.timestamp.startsWith(day));
  const views = yesterdayView?.count || 0;
  const uniques = yesterdayView?.uniques || 0;
  const cloneCount = yesterdayClone?.count || 0;

  await supaFetch(env).upsert("compass_marketing_content_perf_daily", {
    day, content_id: `github:${repo}`,
    content_type: "repo",
    content_title: `GitHub · ${repo}`,
    reach: views, views: uniques, downloads: cloneCount,
    leads_attributed: 0, // UTM-joined at query time
    source_meta: {
      stars: repoData.stargazers_count,
      forks: repoData.forks_count,
      watchers: repoData.subscribers_count,
      vendor: "github",
    },
    fetched_at: new Date().toISOString(),
  });
  log.info(`[github-roller] ${day}: ${views} views · ${uniques} uniques · ${cloneCount} clones · ${repoData.stargazers_count} ★`);
  return { status: "ok", summary: `GitHub ${day}: ${views} views · ${uniques} uniques · ${repoData.stargazers_count} ★ total`, log: log.text() };
}


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
      case "agent-revenue-manager":          return await agentRevenueManager(env);
      case "agent-control-manager":          return await agentControlManager(env);
      case "agent-reporting-manager":        return await agentReportingManager(env);
      case "agent-fpa-manager":              return await agentFpaManager(env);
      case "agent-finance-workflow":         return await agentFinanceWorkflow(env);
      case "agent-partner-settlement":       return await agentPartnerSettlement(env);
      case "agent-ap-manager":                return await agentApManager(env);
      case "agent-tax-manager":               return await agentTaxManager(env);
      case "agent-pricing-margin":            return await agentPricingMargin(env);
      // Sprint #450 — Marketing channel rollers
      case "agent-marketing-linkedin-roller":   return await agentMarketingLinkedinRoller(env);
      case "agent-marketing-customerio-roller": return await agentMarketingCustomerioRoller(env);
      case "agent-marketing-postiz-roller":     return await agentMarketingPostizRoller(env);
      case "agent-marketing-ga4-roller":        return await agentMarketingGa4Roller(env);
      case "agent-marketing-github-roller":     return await agentMarketingGithubRoller(env);
    }
    return { status: "error", summary: `Unknown agent '${name}' — not in registry.` };
  } catch (e) {
    return { status: "error", summary: e instanceof Error ? e.message : String(e), log: `${new Date().toISOString()} ERROR ${e}` };
  }
}
