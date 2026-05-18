/**
 * Agent execution registry.
 *
 * Every X3 automation that runs inside a Pages Function lives here. Each agent
 * is a function (env) → { status, summary, log } and the runAgent() dispatcher
 * looks it up by name.
 *
 * Reference implementation: agent-keepalive. Pings every connected vendor and
 * reports their HTTP status. Proves the end-to-end pattern: cron fires →
 * /api/admin/agents/agent-keepalive/run → this registry → status row written.
 *
 * Other 25 agents are stubbed with status='skipped' until each is implemented.
 * Each stub is a real function — when you fill in the body, the rest of the
 * plumbing (logging, run-row, dispatcher) already works.
 */
import type { AdminEnv } from "./admin-auth";

export type AgentStatus = "ok" | "partial" | "error" | "skipped" | "running";
export type AgentResult = { status: AgentStatus; summary: string; log?: string };

interface Env extends AdminEnv {
  STRIPE_SECRET_KEY?: string;
  ANTHROPIC_API_KEY?: string;
  RESEND_API_KEY?: string;
  TWILIO_ACCOUNT_SID?: string;
  CLOUDFLARE_API_TOKEN?: string;
}

// ----------------------------------------------------------------------------
// agent-keepalive — REAL implementation
// ----------------------------------------------------------------------------
async function agentKeepalive(env: Env): Promise<AgentResult> {
  const lines: string[] = [];
  const ts = () => new Date().toISOString();
  const log = (level: string, msg: string) => lines.push(`${ts()} ${level.padEnd(5)} ${msg}`);

  log("INFO", `[agent-keepalive] starting heartbeat — runtime=cloudflare-pages-functions`);
  const checks: Array<{ name: string; ok: boolean; detail: string }> = [];

  // Supabase
  try {
    const r = await fetch(`${env.SUPABASE_URL?.replace(/\/$/, "")}/rest/v1/`, { headers: { apikey: env.SUPABASE_SERVICE_ROLE || "" } });
    checks.push({ name: "Supabase",   ok: r.ok,     detail: `HTTP ${r.status}` });
    log(r.ok ? "INFO" : "WARN", `[agent-keepalive] Supabase REST: HTTP ${r.status}`);
  } catch (e) { checks.push({ name: "Supabase", ok: false, detail: String(e) }); log("ERROR", `[agent-keepalive] Supabase REST: ${e}`); }

  // Anthropic
  if (env.ANTHROPIC_API_KEY) {
    try {
      const r = await fetch("https://api.anthropic.com/v1/models", { headers: { "x-api-key": env.ANTHROPIC_API_KEY, "anthropic-version": "2023-06-01" } });
      checks.push({ name: "Anthropic", ok: r.ok, detail: `HTTP ${r.status}` });
      log(r.ok ? "INFO" : "WARN", `[agent-keepalive] Anthropic: HTTP ${r.status}`);
    } catch (e) { checks.push({ name: "Anthropic", ok: false, detail: String(e) }); log("ERROR", `[agent-keepalive] Anthropic: ${e}`); }
  } else { checks.push({ name: "Anthropic", ok: false, detail: "ANTHROPIC_API_KEY not set" }); log("WARN", "[agent-keepalive] ANTHROPIC_API_KEY missing"); }

  // Stripe
  if (env.STRIPE_SECRET_KEY) {
    try {
      const r = await fetch("https://api.stripe.com/v1/balance", { headers: { Authorization: `Bearer ${env.STRIPE_SECRET_KEY}` } });
      checks.push({ name: "Stripe", ok: r.ok, detail: `HTTP ${r.status}` });
      log(r.ok ? "INFO" : "WARN", `[agent-keepalive] Stripe: HTTP ${r.status}`);
    } catch (e) { checks.push({ name: "Stripe", ok: false, detail: String(e) }); log("ERROR", `[agent-keepalive] Stripe: ${e}`); }
  } else { checks.push({ name: "Stripe", ok: false, detail: "STRIPE_SECRET_KEY not set" }); log("WARN", "[agent-keepalive] STRIPE_SECRET_KEY missing"); }

  // Resend
  if (env.RESEND_API_KEY) {
    try {
      const r = await fetch("https://api.resend.com/domains", { headers: { Authorization: `Bearer ${env.RESEND_API_KEY}` } });
      checks.push({ name: "Resend", ok: r.ok, detail: `HTTP ${r.status}` });
      log(r.ok ? "INFO" : "WARN", `[agent-keepalive] Resend: HTTP ${r.status}`);
    } catch (e) { checks.push({ name: "Resend", ok: false, detail: String(e) }); log("ERROR", `[agent-keepalive] Resend: ${e}`); }
  } else { checks.push({ name: "Resend", ok: false, detail: "RESEND_API_KEY not set" }); log("WARN", "[agent-keepalive] RESEND_API_KEY missing"); }

  const okCount = checks.filter((c) => c.ok).length;
  const totalCount = checks.length;
  const summary = `${okCount}/${totalCount} vendors healthy · ${checks.filter((c) => !c.ok).map((c) => c.name).join(", ") || "all green"}`;
  log("INFO", `[agent-keepalive] done — ${summary}`);

  return {
    status: okCount === totalCount ? "ok" : okCount === 0 ? "error" : "partial",
    summary,
    log: lines.join("\n"),
  };
}

// ----------------------------------------------------------------------------
// All other agents — stubbed but valid: each returns 'skipped' with a TODO.
// Implementing one of these is: replace this function body with real work.
// ----------------------------------------------------------------------------
const STUBBED_AGENTS = new Set([
  "agent-billing-watchdog", "agent-csa-snapshot-reminder", "agent-data-retention-purge",
  "agent-driver-doc-ingest", "agent-driver-reminders", "agent-email-result-catcher",
  "agent-financial-aggregator", "agent-financial-dunning", "agent-financial-monthly-close",
  "agent-fmcsa-outreach", "agent-fmcsa-scraper", "agent-ifta-quarterly-reminder",
  "agent-inbox-triage", "agent-monthly-client-report", "agent-ops-sheet-mirror",
  "agent-portfolio-brief", "agent-regulatory-scanner", "agent-topic-discovery",
  "agent-csa-baseline", "agent-csa-monitor", "agent-dataq-drafter",
  "agent-research-topic", "agent-synthesize-form", "agent-synthesize-training",
  "agent-onboarding-concierge",
]);

async function stubAgent(name: string): Promise<AgentResult> {
  return {
    status: "skipped",
    summary: `TODO — ${name} implementation not yet ported. Run completed successfully (no-op).`,
    log: `${new Date().toISOString()} INFO  [${name}] stub run — wire the real implementation in functions/_shared/agent-registry.ts`,
  };
}

export async function runAgent(name: string, env: Env): Promise<AgentResult> {
  if (name === "agent-keepalive") return agentKeepalive(env);
  if (STUBBED_AGENTS.has(name))   return stubAgent(name);
  return { status: "error", summary: `Unknown agent '${name}' — not in registry.` };
}
