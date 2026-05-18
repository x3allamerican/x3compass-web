import { requireSuperAdmin, unauthorized, serverError, type AdminEnv } from "../../../_shared/admin-auth";
import { supaFetch } from "../../../_shared/supabase-admin";

function escCsv(v: unknown): string {
  if (v === null || v === undefined) return "";
  const s = String(v);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export const onRequestGet: PagesFunction<AdminEnv> = async (ctx) => {
  const who = await requireSuperAdmin(ctx); if (!who) return unauthorized();
  const url = new URL(ctx.request.url);
  const month = url.searchParams.get("month") || new Date().toISOString().slice(0, 7);
  const [y, m] = month.split("-").map((n) => parseInt(n, 10));
  const start = new Date(Date.UTC(y, m - 1, 1)).toISOString().slice(0, 10);
  const end   = new Date(Date.UTC(y, m,     1)).toISOString().slice(0, 10);
  try {
    const supa = supaFetch(ctx.env);
    const rows = await supa.select("compass_finance_entries", `select=entry_date,type,carrier_name,vendor,category,description,amount_cents,paid&entry_date=gte.${start}&entry_date=lt.${end}&order=entry_date.desc`) as Array<{ entry_date: string; type: string; carrier_name: string | null; vendor: string | null; category: string | null; description: string | null; amount_cents: number; paid: boolean }>;
    const header = "date,type,carrier,vendor,category,description,amount_usd,paid";
    const body = rows.map((r) => [r.entry_date, r.type, r.carrier_name || "", r.vendor || "", r.category || "", r.description || "", ((r.type === "money_in" || r.type === "owed" ? r.amount_cents : -r.amount_cents) / 100).toFixed(2), r.paid ? "yes" : "no"].map(escCsv).join(",")).join("\n");
    return new Response(`${header}\n${body}\n`, { headers: { "Content-Type": "text/csv", "Content-Disposition": `attachment; filename="x3-finance-${month}.csv"` } });
  } catch (e) { return serverError(e instanceof Error ? e.message : String(e)); }
};
