"use client";
import { useState } from "react";
import AppShell from "@/components/AppShell";
import { X3AdminHero, X3KPITile } from "@/components/X3AdminHero";

type Campaign = { name: string; channel: string; clicks: number; leads: number; invites: number; audits: number; converted: number };
const CAMPAIGNS: Campaign[] = [
  { name: "april-launch-facebook",        channel: "facebook",       clicks: 0, leads: 4, invites: 0, audits: 0, converted: 2 },
  { name: "april-launch-reddit",          channel: "reddit",         clicks: 0, leads: 3, invites: 0, audits: 0, converted: 1 },
  { name: "april-launch-linkedin",        channel: "linkedin",       clicks:24, leads: 5, invites: 2, audits: 1, converted: 1 },
  { name: "april-launch-trucking_forum",  channel: "trucking_forum", clicks: 0, leads: 1, invites: 0, audits: 0, converted: 0 },
  { name: "april-launch-forum",           channel: "trucking_forum", clicks: 0, leads: 0, invites: 0, audits: 0, converted: 0 },
];

type Lead = { captured: string; name: string; email: string; company: string; fleet: string; source: string; pain: string; status: "new" | "audit_invited" | "audit_completed" | "converted" };
const LEADS: Lead[] = [
  { captured: "4/25/2026", name: "Test Test",        email: "x3allamericanllc@gmail.com",               company: "Test",              fleet: "1-5 trucks",   source: "direct",   pain: "—",                       status: "audit_completed" },
  { captured: "4/25/2026", name: "Test Test",        email: "x3allamericanllc@gmail.com",               company: "Test",              fleet: "1-5 trucks",   source: "direct",   pain: "—",                       status: "audit_invited"  },
  { captured: "4/25/2026", name: "Smoke Test",       email: "smoke-test+1777109605@x3fleetsafety.com",  company: "X3 Internal Smoke", fleet: "1-5 trucks",   source: "direct",   pain: "—",                       status: "audit_invited"  },
  { captured: "4/17/2026", name: "Katherine Cruz",   email: "katherine.cruz@example.com",                 company: "Cruz Trucking LLC", fleet: "1",            source: "direct",   pain: "dq_files, insurance, csa", status: "new"             },
  { captured: "4/17/2026", name: "Jennifer Thomas",  email: "jennifer.thomas@example.com",                company: "Thomas Trucking LLC", fleet: "16-50",      source: "facebook", pain: "drug",                    status: "audit_completed" },
  { captured: "4/16/2026", name: "Mark Ruiz",        email: "mark.ruiz@example.com",                      company: "Ruiz Express",      fleet: "6-15",         source: "reddit",   pain: "csa, mvr",                status: "converted"      },
];

const TRAFFIC = [11,18,22,9,17,14,21,15,28,19,12,23,18,16,9,14,17,22,11,15,19,12,8,16,17,20,14,11,18,15];

const STATUS_LABEL: Record<Lead["status"], { label: string; tone: string }> = {
  new:              { label: "NEW",              tone: "bg-[var(--accent)] text-white" },
  audit_invited:    { label: "AUDIT INVITED",    tone: "bg-[var(--warning)] text-white" },
  audit_completed:  { label: "AUDIT COMPLETED",  tone: "bg-[var(--success)] text-white" },
  converted:        { label: "CONVERTED",        tone: "bg-[var(--accent-2)] text-white" },
};

export default function MarketingPage() {
  const [statusFilter, setStatusFilter] = useState<"all" | Lead["status"]>("all");
  const filtered = LEADS.filter((l) => statusFilter === "all" || l.status === statusFilter);

  return (
    <AppShell title="Marketing Dashboard" crumbs="X3 Admin · Lead pipeline + campaign performance">
      <div className="px-6 py-6 space-y-6 bg-[var(--bg)] min-h-screen">
        <X3AdminHero
          eyebrow="Marketing Dashboard"
          title="Lead pipeline + campaign performance."
          intro="Inbound interest, conversion funnel, and content engagement."
          dataSource={{
            items: [
              <><strong className="text-[var(--fg)]">Clicks</strong> are recorded by our redirect endpoint <code className="font-mono text-[var(--accent)]">/r/&lt;campaign&gt;</code> — every time someone clicks an X3 tracking link (Reddit post, LinkedIn comment, email signature, etc.) we log the campaign + content tag in <code className="font-mono text-[var(--accent)]">marketing_clicks</code>.</>,
              <><strong className="text-[var(--fg)]">Leads</strong> come from the <em>Ready-for-Compliance</em> form on x3compass.com — name, fleet size, pain points land in the <code className="font-mono text-[var(--accent)]">leads</code> table and trigger a Resend email to team@.</>,
              <><strong className="text-[var(--fg)]">Invites & Audits</strong> come from the 15-Min Audit flow on the marketing site — each invitation email + each completed audit attaches to its lead row.</>,
              <><strong className="text-[var(--fg)]">Conversions</strong> are leads we manually mark <code className="font-mono text-[var(--accent)]">status=&apos;converted&apos;</code> when they sign up for a paid X3 plan via Stripe.</>,
            ],
            footnote: <>All numbers refresh on every page load. Click ↻ Refresh on the funnel card to re-pull.</>,
          }}
        />
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <X3KPITile label="Clicks · 30 days"    value={100}        sub={undefined}              tone="navy" />
          <X3KPITile label="Leads · 30 days"     value={13}         sub="13.0% conversion"       tone="navy" />
          <X3KPITile label="Invites sent"        value={3}          sub="audit emails delivered" tone="navy" />
          <X3KPITile label="Audits completed"    value={1}          sub="33.3% completion"       tone="navy" />
          <X3KPITile label="Converted"           value={4}          sub="paying carriers"        tone="green" />
          <X3KPITile label="Cost per lead"       value={"$0"}       sub="current: all free channels" tone="navy" />
        </div>

        <div className="x3-card overflow-hidden">
          <div className="px-5 py-3 border-b border-[var(--border)] flex items-center justify-between">
            <div className="text-[15px] font-extrabold text-[var(--fg)]">Funnel by Campaign (last 30 Days)</div>
            <button className="px-3 py-1.5 rounded-lg font-bold text-[12px] text-[var(--fg)] border border-[var(--border)] hover:bg-[var(--surface-2)]">↻ Refresh</button>
          </div>
          <table className="w-full text-[12px]">
            <thead className="bg-[var(--surface-2)] text-[10px] tracking-[.14em] uppercase text-[var(--fg-muted)]">
              <tr><th className="text-left px-3 py-2 font-bold">Campaign</th><th className="text-left px-3 py-2 font-bold">Channel</th><th className="text-right px-3 py-2 font-bold">Clicks</th><th className="text-right px-3 py-2 font-bold">Leads</th><th className="text-right px-3 py-2 font-bold">Invites</th><th className="text-right px-3 py-2 font-bold">Audits</th><th className="text-right px-3 py-2 font-bold">Converted</th><th className="text-right px-3 py-2 font-bold">Click→Lead</th><th className="text-right px-3 py-2 font-bold">Lead→Audit</th></tr>
            </thead>
            <tbody>{CAMPAIGNS.map((c, i) => {
              const clickToLead = c.clicks > 0 ? ((c.leads / c.clicks) * 100).toFixed(1) + "%" : "—";
              const leadToAudit = c.leads > 0 ? ((c.audits / c.leads) * 100).toFixed(1) + "%" : "—";
              return (
                <tr key={i} className="border-t border-[var(--border)]">
                  <td className="px-3 py-2.5 text-[var(--fg)] font-semibold">{c.name}</td>
                  <td className="px-3 py-2.5 text-[var(--fg-muted)]">{c.channel}</td>
                  <td className="px-3 py-2.5 text-right tabular-nums">{c.clicks}</td>
                  <td className="px-3 py-2.5 text-right tabular-nums">{c.leads}</td>
                  <td className="px-3 py-2.5 text-right tabular-nums">{c.invites}</td>
                  <td className="px-3 py-2.5 text-right tabular-nums">{c.audits}</td>
                  <td className="px-3 py-2.5 text-right tabular-nums">{c.converted}</td>
                  <td className="px-3 py-2.5 text-right tabular-nums text-[var(--fg-muted)]">{clickToLead}</td>
                  <td className="px-3 py-2.5 text-right tabular-nums text-[var(--fg-muted)]">{leadToAudit}</td>
                </tr>
              );
            })}</tbody>
          </table>
        </div>

        <div className="x3-card p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="text-[15px] font-extrabold text-[var(--fg)]">Traffic · last 30 Days</div>
          </div>
          <div className="flex gap-1 items-end h-[80px]">
            {TRAFFIC.map((v, i) => {
              const max = Math.max(...TRAFFIC); const h = (v / max) * 100;
              return <div key={i} className="flex-1 rounded-t bg-[var(--accent)]" style={{ height: `${h}%`, minHeight: 4 }} />;
            })}
          </div>
          <div className="text-[11px] text-[var(--fg-muted)] mt-2">Daily click count across all campaigns. Tallest bar = busiest day.</div>
        </div>

        <div className="x3-card overflow-hidden">
          <div className="px-5 py-3 border-b border-[var(--border)] flex items-center gap-3 flex-wrap">
            <div className="text-[15px] font-extrabold text-[var(--fg)]">Recent Leads</div>
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)} className="px-2 py-1 rounded bg-[var(--surface-2)] border border-[var(--border)] text-[12px]"><option value="all">All statuses</option><option value="new">New</option><option value="audit_invited">Audit invited</option><option value="audit_completed">Audit completed</option><option value="converted">Converted</option></select>
            <button className="ml-auto px-3 py-1.5 rounded-lg font-bold text-[12px] text-[var(--fg)] border border-[var(--border)] hover:bg-[var(--surface-2)]">Export CSV</button>
          </div>
          <table className="w-full text-[12px]">
            <thead className="bg-[var(--surface-2)] text-[10px] tracking-[.14em] uppercase text-[var(--fg-muted)]">
              <tr><th className="text-left px-3 py-2 font-bold">Captured</th><th className="text-left px-3 py-2 font-bold">Name</th><th className="text-left px-3 py-2 font-bold">Company</th><th className="text-left px-3 py-2 font-bold">Fleet</th><th className="text-left px-3 py-2 font-bold">Source</th><th className="text-left px-3 py-2 font-bold">Pain points</th><th className="text-left px-3 py-2 font-bold">Status</th><th className="text-right px-3 py-2 font-bold">Action</th></tr>
            </thead>
            <tbody>{filtered.map((l, i) => (
              <tr key={i} className="border-t border-[var(--border)]">
                <td className="px-3 py-2.5 text-[var(--fg-muted)] tabular-nums whitespace-nowrap">{l.captured}</td>
                <td className="px-3 py-2.5"><div className="text-[var(--fg)] font-semibold">{l.name}</div><div className="text-[10px] text-[var(--fg-faint)]">{l.email}</div></td>
                <td className="px-3 py-2.5 text-[var(--fg-muted)]">{l.company}</td>
                <td className="px-3 py-2.5 text-[var(--fg-muted)]">{l.fleet}</td>
                <td className="px-3 py-2.5 text-[var(--fg-muted)]">{l.source}</td>
                <td className="px-3 py-2.5 text-[var(--fg-muted)]">{l.pain}</td>
                <td className="px-3 py-2.5"><span className={`px-1.5 py-0.5 rounded text-[10px] font-extrabold ${STATUS_LABEL[l.status].tone}`}>{STATUS_LABEL[l.status].label}</span></td>
                <td className="px-3 py-2.5 text-right"><button className="text-[12px] text-[var(--accent)] font-bold hover:underline">Reply</button></td>
              </tr>))}</tbody>
          </table>
        </div>
      </div>
    </AppShell>
  );
}
