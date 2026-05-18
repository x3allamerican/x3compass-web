/**
 * Shared helpers for the AI Finance Team agents.
 *  - recordUsage(): writes a row to compass_usage_events for per-carrier COGS
 *  - postJournal(): writes balanced double-entry to compass_journal_entries + lines
 *  - ANTHROPIC_PRICING + STRIPE_FEE_RATE + RESEND_PRICING constants
 */
import { supaFetch } from "./supabase-admin";

export interface Env {
  SUPABASE_URL?: string;
  SUPABASE_SERVICE_ROLE?: string;
}

// Per-million-token prices for the models we use (US, prod tier)
export const ANTHROPIC_PRICING: Record<string, { in_per_mtok: number; out_per_mtok: number }> = {
  "claude-sonnet-4-6":   { in_per_mtok: 3.00,  out_per_mtok: 15.00 },
  "claude-opus-4-6":     { in_per_mtok: 15.00, out_per_mtok: 75.00 },
  "claude-haiku-4-5":    { in_per_mtok: 0.80,  out_per_mtok: 4.00  },
};
export const STRIPE_FEE_RATE = 0.029;
export const STRIPE_FEE_FIXED_CENTS = 30;
export const RESEND_COST_PER_EMAIL_CENTS = 0.04;   // ~$0.0004 per email at the volume tier
export const TWILIO_COST_PER_SMS_CENTS   = 0.79;   // ~$0.0079 per SMS US

export function anthropicCostCents(model: string, tokensIn: number, tokensOut: number): number {
  const p = ANTHROPIC_PRICING[model] || ANTHROPIC_PRICING["claude-sonnet-4-6"];
  const dollars = (tokensIn / 1_000_000) * p.in_per_mtok + (tokensOut / 1_000_000) * p.out_per_mtok;
  return Math.round(dollars * 100);
}

export async function recordUsage(env: Env, row: {
  carrier_id?: string | null;
  vendor: string;
  service: string;
  units_in?: number;
  units_out?: number;
  cost_cents: number;
  agent_name?: string;
  agent_run_id?: string;
  request_id?: string;
  metadata?: Record<string, unknown>;
}): Promise<void> {
  if (row.cost_cents <= 0) return;
  try {
    const supa = supaFetch(env);
    await supa.insert("compass_usage_events", {
      ts:           new Date().toISOString(),
      carrier_id:   row.carrier_id || null,
      vendor:       row.vendor,
      service:      row.service,
      units_in:     row.units_in  || 0,
      units_out:    row.units_out || 0,
      cost_cents:   row.cost_cents,
      agent_name:   row.agent_name || null,
      agent_run_id: row.agent_run_id || null,
      request_id:   row.request_id || null,
      metadata:     row.metadata || null,
    });
  } catch (e) {
    // Never block business logic on telemetry failures
    console.error("[recordUsage] failed:", e);
  }
}

/**
 * Post a balanced double-entry journal. Validates debits = credits before insert.
 * Returns entry_id on success, throws on imbalance or DB error.
 */
export async function postJournal(env: Env, entry: {
  entry_date?: string;
  reference?: string;
  source: string;
  description?: string;
  carrier_id?: string | null;
  agent_name?: string;
  agent_run_id?: string;
  posted?: boolean;
  lines: Array<{ account_code: string; debit_cents?: number; credit_cents?: number; memo?: string }>;
}): Promise<string> {
  const entryDate = entry.entry_date || new Date().toISOString().slice(0, 10);
  const period    = entryDate.slice(0, 7);

  let totalDebit = 0, totalCredit = 0;
  for (const l of entry.lines) {
    totalDebit  += l.debit_cents  || 0;
    totalCredit += l.credit_cents || 0;
  }
  if (totalDebit !== totalCredit) {
    throw new Error(`Journal imbalance: debits=${totalDebit} credits=${totalCredit} ref=${entry.reference}`);
  }
  if (totalDebit === 0) throw new Error("Journal entry must have non-zero amount");

  const supa = supaFetch(env);
  const [inserted] = await supa.insert("compass_journal_entries", {
    entry_date:    entryDate,
    period,
    reference:     entry.reference || null,
    source:        entry.source,
    description:   entry.description || null,
    carrier_id:    entry.carrier_id || null,
    agent_name:    entry.agent_name || null,
    agent_run_id:  entry.agent_run_id || null,
    posted:        entry.posted !== false,
    created_by:    entry.agent_name ? `agent:${entry.agent_name}` : "system",
  }) as Array<{ id: string }>;
  const entryId = inserted.id;

  for (const l of entry.lines) {
    await supa.insert("compass_journal_lines", {
      entry_id:     entryId,
      account_code: l.account_code,
      debit_cents:  l.debit_cents  || 0,
      credit_cents: l.credit_cents || 0,
      memo:         l.memo || null,
    });
  }
  return entryId;
}

/**
 * Pretty-format cents as USD for memos.
 */
export function fmtCents(c: number): string {
  return (c / 100).toLocaleString("en-US", { style: "currency", currency: "USD" });
}
