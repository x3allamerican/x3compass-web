/**
 * Finance Team helpers — usage tracking + cost calculation for AI agents.
 * Records token usage to compass_agent_usage table, computes Anthropic API costs.
 */
import { supaFetch, type SupaEnv } from "./supabase-admin";

export interface FinanceEnv extends SupaEnv {}

export interface UsageRecord {
  carrier_id: string | null;
  vendor: string;
  service: string;
  units_in: number;
  units_out: number;
  cost_cents: number;
  agent_name?: string;
  [k: string]: unknown;
}

/**
 * Anthropic pricing per 1M tokens (USD), as of 2026-05.
 * Update when pricing changes.
 */
const ANTHROPIC_PRICING: Record<string, { in: number; out: number }> = {
  "claude-opus-4-6":      { in: 15.00, out: 75.00 },
  "claude-sonnet-4-6":    { in:  3.00, out: 15.00 },
  "claude-haiku-4-5":     { in:  0.80, out:  4.00 },
  "claude-sonnet-4-5":    { in:  3.00, out: 15.00 },
  "claude-haiku-4-5-20251001": { in: 0.80, out: 4.00 },
};

export function anthropicCostCents(model: string, tokensIn: number, tokensOut: number): number {
  const key = Object.keys(ANTHROPIC_PRICING).find(k => model.startsWith(k)) || "claude-sonnet-4-6";
  const p = ANTHROPIC_PRICING[key];
  const usd = (tokensIn / 1_000_000) * p.in + (tokensOut / 1_000_000) * p.out;
  return Math.round(usd * 100);
}

export async function recordUsage(env: FinanceEnv, rec: UsageRecord): Promise<void> {
  try {
    const supa = supaFetch(env);
    await supa.insert("compass_agent_usage", {
      carrier_id: rec.carrier_id,
      vendor:     rec.vendor,
      service:    rec.service,
      units_in:   rec.units_in,
      units_out:  rec.units_out,
      cost_cents: rec.cost_cents,
      agent_name: rec.agent_name || null,
      recorded_at: new Date().toISOString(),
    });
  } catch {
    // Best-effort logging — never break the calling agent
  }
}

export interface JournalLine {
  account_code: string;
  debit_cents?: number;
  credit_cents?: number;
  memo?: string;
}

export interface JournalEntry {
  entry_date: string;       // YYYY-MM-DD
  reference: string;        // unique idempotency key (e.g. stripe charge id)
  source: string;           // "stripe-sync" | "manual" | "agent-x"
  description: string;
  carrier_id: string | null;
  agent_name?: string;
  lines: JournalLine[];
}

/**
 * Post a double-entry journal — header to compass_journal_entries, lines to
 * compass_journal_lines. Idempotent by reference: if a row with the same
 * reference already exists, this is a no-op.
 */
export async function postJournal(env: FinanceEnv, entry: JournalEntry): Promise<{ ok: boolean; id?: string; skipped?: boolean }> {
  try {
    const supa = supaFetch(env);
    // Idempotency check
    const existing = await supa.select(
      "compass_journal_entries",
      `select=id&reference=eq.${encodeURIComponent(entry.reference)}&limit=1`,
    );
    if (existing.length > 0) return { ok: true, skipped: true };

    const header = await supa.insert("compass_journal_entries", {
      entry_date:  entry.entry_date,
      reference:   entry.reference,
      source:      entry.source,
      description: entry.description,
      carrier_id:  entry.carrier_id,
      agent_name:  entry.agent_name || null,
      posted_at:   new Date().toISOString(),
    });
    const headerRow = Array.isArray(header) && header.length > 0
      ? header[0] as { id?: string }
      : null;
    const journalId = headerRow?.id;
    if (!journalId) return { ok: false };

    const lines = entry.lines.map((l) => ({
      journal_id:   journalId,
      account_code: l.account_code,
      debit_cents:  l.debit_cents  || 0,
      credit_cents: l.credit_cents || 0,
      memo:         l.memo         || null,
    }));
    await supa.insert("compass_journal_lines", lines);
    return { ok: true, id: journalId };
  } catch {
    return { ok: false };
  }
}
