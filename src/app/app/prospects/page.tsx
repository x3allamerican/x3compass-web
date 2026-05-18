"use client";
import { useState } from "react";
import AppShell from "@/components/AppShell";
import { X3AdminHero, X3KPITile, X3AdminTabs } from "@/components/X3AdminHero";

type Prospect = { registered: string; dot: string; legal: string; city: string; state: string; power_units: number; drivers: number; rating: string; email: string; intent: "new_entrant" | "below_sat" | "in_region"; outreach?: "sent" | "replied" | "queued" };

const PROSPECTS: Prospect[] = [
  { registered: "2025-09-12", dot: "4250912", legal: "Northstar Logistics LLC",   city: "Detroit",       state: "MI", power_units:  8, drivers: 11, rating: "—",            email: "ops@northstarlog.com",    intent: "new_entrant", outreach: "sent" },
  { registered: "2025-11-04", dot: "4271104", legal: "Buckeye Bulk Haulers",        city: "Columbus",      state: "OH", power_units: 14, drivers: 17, rating: "—",            email: "dispatch@buckeyebulk.com",intent: "new_entrant", outreach: "replied" },
  { registered: "2026-01-22", dot: "4360122", legal: "Hoosier Express Carriers",   city: "Indianapolis",  state: "IN", power_units:  6, drivers:  9, rating: "—",            email: "owner@hoosierexp.com",    intent: "new_entrant", outreach: "queued" },
  { registered: "2026-02-08", dot: "4380208", legal: "Lakeshore Transit Inc",       city: "Milwaukee",     state: "WI", power_units: 23, drivers: 28, rating: "—",            email: "safety@lakeshoretransit.com", intent: "new_entrant" },
  { registered: "2026-03-15", dot: "4400315", legal: "Prairie Wind Trucking",       city: "Springfield",   state: "IL", power_units: 11, drivers: 13, rating: "—",            email: "contact@prairiewind.co",  intent: "new_entrant" },
  { registered: "2018-04-02", dot: "3120402", legal: "Westgate Auto Transport",    city: "Grand Rapids",  state: "MI", power_units: 17, drivers: 21, rating: "Conditional",  email: "j.kim@westgateauto.com",  intent: "below_sat",   outreach: "sent" },
  { registered: "2017-06-19", dot: "2980619", legal: "Tri-State Cartage Co",        city: "Toledo",        state: "OH", power_units: 22, drivers: 26, rating: "Conditional",  email: "ops@tristatecartage.com", intent: "below_sat" },
  { registered: "2019-11-30", dot: "3201130", legal: "Mid-Continent Couriers",      city: "Champaign",     state: "IL", power_units: 19, drivers: 22, rating: "Unsatisfactory",email:"hr@midcontinent.co",      intent: "below_sat" },
];

const STATES = ["MI", "OH", "IN", "IL", "WI"];

export default function ProspectsPage() {
  const [tab, setTab] = useState("new");
  const inRegion        = PROSPECTS.length;
  const newEntrants     = PROSPECTS.filter((p) => p.intent === "new_entrant").length;
  const belowSat        = PROSPECTS.filter((p) => p.intent === "below_sat").length;
  const newThisWeek     = PROSPECTS.filter((p) => p.intent === "new_entrant" && p.registered > "2026-02-01").length;
  const outreachSent    = PROSPECTS.filter((p) => p.outreach === "sent" || p.outreach === "replied").length;
  const replies         = PROSPECTS.filter((p) => p.outreach === "replied").length;

  const filtered = (() => {
    if (tab === "new")        return PROSPECTS.filter((p) => p.intent === "new_entrant");
    if (tab === "below_sat")  return PROSPECTS.filter((p) => p.intent === "below_sat");
    if (tab === "all")        return PROSPECTS;
    if (tab === "this_week")  return PROSPECTS.filter((p) => p.registered > "2026-02-01");
    return PROSPECTS;
  })();

  return (
    <AppShell title="FMCSA Prospects" crumbs="X3 Admin · 5-State Region · Refreshed weekly">
      <div className="px-6 py-6 space-y-6 bg-[var(--bg)] min-h-screen">
        <X3AdminHero
          eyebrow="FMCSA Prospects · 5-State Region"
          title={<>Small carriers in MI · OH · IN · IL · WI — <span style={{ color: "#FACC15" }}>refreshed weekly.</span></>}
          intro={<>A weekly scrape pulls active interstate &amp; intrastate carriers in our 5-state region with <strong className="text-white">1–100 power units</strong> and an <strong className="text-white">email on file</strong> into the prospect list. Two signals get top billing: <strong className="text-white">new entrants under 12 months old</strong> (highest intent), and <strong className="text-white">conditional or unsatisfactory ratings</strong> (highest need for X3&apos;s help).</>}
          dataSource={{
            items: [
              <><strong className="text-[var(--fg)]">Source</strong> — the FMCSA SAFER bulk census (free, monthly refresh) for the universe + Carrier Snapshot (free, no key) for safety rating + new-entrant status. No paid APIs.</>,
              <><strong className="text-[var(--fg)]">Filter at ingest</strong> — <code className="font-mono text-[var(--accent)]">state IN (&apos;MI&apos;,&apos;OH&apos;,&apos;IN&apos;,&apos;IL&apos;,&apos;WI&apos;)</code>, <code className="font-mono text-[var(--accent)]">power_units BETWEEN 1 AND 25</code>, <code className="font-mono text-[var(--accent)]">operating_status=&apos;ACTIVE&apos;</code>, <code className="font-mono text-[var(--accent)]">email IS NOT NULL</code>. Anything outside the ICP is discarded before it hits the table.</>,
              <><strong className="text-[var(--fg)]">The scraper</strong> runs every Monday at 4am ET — see <code className="font-mono text-[var(--accent)]">agent-fmcsa-scraper</code> in Control Center → Agents. Run summary lands in <code className="font-mono text-[var(--accent)]">fmcsa_scraper_runs</code>.</>,
              <><strong className="text-[var(--fg)]">Outreach</strong> is sent by <code className="font-mono text-[var(--accent)]">agent-fmcsa-outreach</code> Tue/Wed/Thu at 9am ET, capped 50/day. Below-satisfactory carriers are flagged for Joshua to handle personally — bulk auto-outreach skips them.</>,
            ],
          }}
        />
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <X3KPITile label="In-region carriers"   value={inRegion}      sub="5-state · ≤100 trucks · email" tone="navy" />
          <X3KPITile label="New entrants <12 mo"  value={newEntrants}   sub="highest intent"               tone="green" />
          <X3KPITile label="Below satisfactory"   value={belowSat}      sub="highest need"                 tone="red" />
          <X3KPITile label="New this week"        value={newThisWeek}   sub="first_seen_at < 7d"           tone="navy" />
          <X3KPITile label="Outreach sent"        value={outreachSent}  sub="cumulative"                   tone="navy" />
          <X3KPITile label="Replies"              value={replies}       sub="positive intent"              tone="green" />
        </div>

        <div className="x3-card p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="text-[15px] font-extrabold text-[var(--fg)]">📊 Fleet size distribution (power units)</div>
            <div className="text-[11px] text-[var(--fg-muted)]">Showing: <span className="text-[var(--accent)] font-bold">All in-region carriers</span></div>
          </div>
          <div className="grid grid-cols-5 gap-3 h-[120px] items-end">
            {[
              { range: "1-5",   count: 18 }, { range: "6-10",  count: 26 },
              { range: "11-20", count: 21 }, { range: "21-50", count: 12 },
              { range: "51-100", count:  4 },
            ].map((b) => {
              const max = 26; const h = (b.count / max) * 100;
              return (
                <div key={b.range} className="flex flex-col items-center gap-1.5">
                  <div className="text-[11px] font-bold text-[var(--fg)]">{b.count}</div>
                  <div className="w-full rounded-t" style={{ height: `${h}%`, background: "var(--accent)" }} />
                  <div className="text-[10px] text-[var(--fg-muted)]">{b.range} PU</div>
                </div>
              );
            })}
          </div>
        </div>

        <div>
          <X3AdminTabs active={tab} onChange={setTab} tabs={[
            { key: "new",       label: "🌱 New entrants <12 mo"   },
            { key: "below_sat", label: "⚠ Below satisfactory"     },
            { key: "all",       label: "📓 All in-region carriers" },
            { key: "this_week", label: "✨ New this week"          },
            { key: "outreach",  label: "📩 Outreach log"          },
            { key: "template",  label: "📨 Email template"        },
            { key: "scraper",   label: "⏰ Scraper runs"           },
          ]} />

          {(tab === "new" || tab === "below_sat" || tab === "all" || tab === "this_week") && (
            <div className="x3-card overflow-hidden mt-4">
              <div className="px-5 py-3 border-b border-[var(--border)] flex items-center justify-between flex-wrap gap-3">
                <div>
                  <div className="text-[14px] font-extrabold text-[var(--fg)]">{tab === "new" ? "🌱 New entrants · registered in the last 12 months" : tab === "below_sat" ? "⚠ Below satisfactory · highest help-need" : tab === "this_week" ? "✨ New this week · first_seen_at < 7d" : "📓 All in-region carriers"}</div>
                  <div className="text-[11px] text-[var(--fg-muted)] mt-0.5">{tab === "new" ? "Highest intent — they're still building compliance habits." : tab === "below_sat" ? "Joshua handles personally — bulk auto-outreach is paused for these." : "Click any column header arrow to filter."}</div>
                </div>
                <div className="flex gap-2">
                  <button className="px-3 py-1.5 rounded-lg font-bold text-[12px] text-[var(--fg)] border border-[var(--border)] hover:bg-[var(--surface-2)]">↓ Export CSV</button>
                  <button className="px-3 py-1.5 rounded-lg font-extrabold text-[12px] text-[var(--accent-fg)]" style={{ background: "linear-gradient(135deg, var(--accent), var(--accent-2))" }}>📩 Bulk outreach</button>
                </div>
              </div>
              {tab === "new" && (
                <div className="px-5 py-3 bg-[var(--success)]/10 border-b border-[var(--border)] text-[12px] text-[var(--fg-muted)]">These carriers are within the FMCSA New Entrant Safety Assurance Program window (49 CFR 385.305). They get the auto-outreach intro email first.</div>
              )}
              <table className="w-full text-[12px]">
                <thead className="bg-[var(--surface-2)] text-[10px] tracking-[.14em] uppercase text-[var(--fg-muted)]">
                  <tr><th className="text-left px-3 py-2 font-bold">Registered ↓</th><th className="text-left px-3 py-2 font-bold">DOT #</th><th className="text-left px-3 py-2 font-bold">Legal Name</th><th className="text-left px-3 py-2 font-bold">City</th><th className="text-left px-3 py-2 font-bold">State</th><th className="text-right px-3 py-2 font-bold">Power Units</th><th className="text-right px-3 py-2 font-bold">Drivers</th><th className="text-left px-3 py-2 font-bold">Rating</th><th className="text-left px-3 py-2 font-bold">Email</th><th className="text-left px-3 py-2 font-bold">Outreach</th></tr>
                </thead>
                <tbody>{filtered.map((p, i) => (
                  <tr key={i} className="border-t border-[var(--border)] hover:bg-[var(--surface-2)]/40">
                    <td className="px-3 py-2.5 text-[var(--fg-muted)] tabular-nums">{p.registered}</td>
                    <td className="px-3 py-2.5 text-[var(--accent)] font-mono">{p.dot}</td>
                    <td className="px-3 py-2.5 text-[var(--fg)] font-semibold">{p.legal}</td>
                    <td className="px-3 py-2.5 text-[var(--fg-muted)]">{p.city}</td>
                    <td className="px-3 py-2.5 text-[var(--fg-muted)]">{p.state}</td>
                    <td className="px-3 py-2.5 text-right tabular-nums">{p.power_units}</td>
                    <td className="px-3 py-2.5 text-right tabular-nums">{p.drivers}</td>
                    <td className="px-3 py-2.5">{p.rating === "Conditional" ? <span className="px-1.5 py-0.5 rounded text-[10px] font-extrabold bg-[var(--warning)]/15 text-[var(--warning)]">Conditional</span> : p.rating === "Unsatisfactory" ? <span className="px-1.5 py-0.5 rounded text-[10px] font-extrabold bg-[var(--danger)]/15 text-[var(--danger)]">Unsatisfactory</span> : <span className="text-[var(--fg-muted)]">—</span>}</td>
                    <td className="px-3 py-2.5 text-[var(--fg-muted)] font-mono">{p.email}</td>
                    <td className="px-3 py-2.5">{p.outreach === "replied" ? <span className="text-[var(--success)] font-bold">✓ REPLIED</span> : p.outreach === "sent" ? <span className="text-[var(--accent)]">SENT</span> : p.outreach === "queued" ? <span className="text-[var(--warning)]">QUEUED</span> : <span className="text-[var(--fg-faint)]">—</span>}</td>
                  </tr>))}</tbody>
              </table>
            </div>
          )}

          {tab === "outreach" && (
            <div className="x3-card overflow-hidden mt-4">
              <div className="px-5 py-3 border-b border-[var(--border)]">
                <div className="text-[14px] font-extrabold text-[var(--fg)]">📩 Outreach log</div>
                <div className="text-[11px] text-[var(--fg-muted)] mt-0.5">Every send by agent-fmcsa-outreach. Filter by status, campaign, or carrier.</div>
              </div>
              <table className="w-full text-[12px]">
                <thead className="bg-[var(--surface-2)] text-[10px] tracking-[.14em] uppercase text-[var(--fg-muted)]"><tr><th className="text-left px-3 py-2 font-bold">Sent</th><th className="text-left px-3 py-2 font-bold">Carrier</th><th className="text-left px-3 py-2 font-bold">DOT #</th><th className="text-left px-3 py-2 font-bold">Campaign</th><th className="text-left px-3 py-2 font-bold">Status</th><th className="text-left px-3 py-2 font-bold">Subject</th></tr></thead>
                <tbody>
                  <tr className="border-t border-[var(--border)]"><td className="px-3 py-2.5 text-[var(--fg-muted)]">2026-05-13 09:02</td><td className="px-3 py-2.5 text-[var(--fg)] font-semibold">Northstar Logistics LLC</td><td className="px-3 py-2.5 font-mono text-[var(--accent)]">4250912</td><td className="px-3 py-2.5 text-[var(--fg-muted)]">new-entrant-intro</td><td className="px-3 py-2.5"><span className="text-[var(--accent)] font-bold">DELIVERED</span></td><td className="px-3 py-2.5 text-[var(--fg-muted)]">Welcome to interstate trucking — 7 things every new carrier needs in their first 90 days</td></tr>
                  <tr className="border-t border-[var(--border)]"><td className="px-3 py-2.5 text-[var(--fg-muted)]">2026-05-13 09:02</td><td className="px-3 py-2.5 text-[var(--fg)] font-semibold">Buckeye Bulk Haulers</td><td className="px-3 py-2.5 font-mono text-[var(--accent)]">4271104</td><td className="px-3 py-2.5 text-[var(--fg-muted)]">new-entrant-intro</td><td className="px-3 py-2.5"><span className="text-[var(--success)] font-bold">REPLIED</span></td><td className="px-3 py-2.5 text-[var(--fg-muted)]">Welcome to interstate trucking — 7 things every new carrier needs in their first 90 days</td></tr>
                  <tr className="border-t border-[var(--border)]"><td className="px-3 py-2.5 text-[var(--fg-muted)]">2026-05-06 09:02</td><td className="px-3 py-2.5 text-[var(--fg)] font-semibold">Westgate Auto Transport</td><td className="px-3 py-2.5 font-mono text-[var(--accent)]">3120402</td><td className="px-3 py-2.5 text-[var(--fg-muted)]">conditional-help</td><td className="px-3 py-2.5"><span className="text-[var(--accent)] font-bold">DELIVERED</span></td><td className="px-3 py-2.5 text-[var(--fg-muted)]">Spotted your Conditional rating — here&apos;s the 5-step path back to Satisfactory</td></tr>
                </tbody>
              </table>
            </div>
          )}

          {tab === "template" && (
            <div className="x3-card p-5 mt-4 space-y-4">
              <div className="text-[15px] font-extrabold text-[var(--fg)]">📨 Email templates</div>
              <div className="rounded-lg border border-[var(--border)] p-4 bg-[var(--surface-2)]">
                <div className="text-[11px] tracking-[.14em] uppercase font-bold text-[var(--accent)] mb-2">new-entrant-intro</div>
                <div className="text-[13px] text-[var(--fg)] font-semibold mb-2">Subject: Welcome to interstate trucking — 7 things every new carrier needs in their first 90 days</div>
                <div className="text-[12px] text-[var(--fg-muted)] font-mono leading-relaxed whitespace-pre-wrap">{`Hi {{first_name}},

Saw your USDOT registration ({{dot_number}}) come through last {{registered_month}}. Congrats on the new authority — that's a real accomplishment.

I run X3 Compass, an AI Safety Director for small fleets. We're not selling ELDs or training videos. We're the brain that watches your CDL expirations, drug-test windows, MVR pulls, IFTA filings, and CSA scores — and tells you exactly what's due before FMCSA does.

If you'd like a free 15-minute audit of where your DQ files stand right now, reply with a good time. No pitch, no obligation — you'll just walk away with a checklist.

Joshua Kovarik
Founder, X3 Compass
joshua@x3compass.com`}</div>
              </div>
              <div className="rounded-lg border border-[var(--border)] p-4 bg-[var(--surface-2)]">
                <div className="text-[11px] tracking-[.14em] uppercase font-bold text-[var(--accent)] mb-2">conditional-help</div>
                <div className="text-[13px] text-[var(--fg)] font-semibold mb-2">Subject: Spotted your Conditional rating — here&apos;s the 5-step path back to Satisfactory</div>
                <div className="text-[12px] text-[var(--fg-muted)]">Sent only to carriers flagged Conditional or Unsatisfactory in the SAFER feed. Personally reviewed by Joshua before send.</div>
              </div>
            </div>
          )}

          {tab === "scraper" && (
            <div className="x3-card overflow-hidden mt-4">
              <div className="px-5 py-3 border-b border-[var(--border)]">
                <div className="text-[14px] font-extrabold text-[var(--fg)]">⏰ Scraper runs</div>
                <div className="text-[11px] text-[var(--fg-muted)] mt-0.5">agent-fmcsa-scraper · weekly Mondays 4am ET. Latest 5 runs.</div>
              </div>
              <table className="w-full text-[12px]">
                <thead className="bg-[var(--surface-2)] text-[10px] tracking-[.14em] uppercase text-[var(--fg-muted)]"><tr><th className="text-left px-3 py-2 font-bold">Run started</th><th className="text-left px-3 py-2 font-bold">Duration</th><th className="text-right px-3 py-2 font-bold">Rows ingested</th><th className="text-right px-3 py-2 font-bold">New entrants found</th><th className="text-right px-3 py-2 font-bold">Below-sat flagged</th><th className="text-left px-3 py-2 font-bold">Status</th></tr></thead>
                <tbody>
                  <tr className="border-t border-[var(--border)]"><td className="px-3 py-2.5 text-[var(--fg-muted)] tabular-nums">2026-05-13 04:00</td><td className="px-3 py-2.5 text-[var(--fg-muted)]">9m 42s</td><td className="px-3 py-2.5 text-right tabular-nums">81</td><td className="px-3 py-2.5 text-right tabular-nums">5</td><td className="px-3 py-2.5 text-right tabular-nums">3</td><td className="px-3 py-2.5"><span className="text-[var(--success)] font-bold">✓ OK</span></td></tr>
                  <tr className="border-t border-[var(--border)]"><td className="px-3 py-2.5 text-[var(--fg-muted)] tabular-nums">2026-05-06 04:00</td><td className="px-3 py-2.5 text-[var(--fg-muted)]">11m 04s</td><td className="px-3 py-2.5 text-right tabular-nums">79</td><td className="px-3 py-2.5 text-right tabular-nums">6</td><td className="px-3 py-2.5 text-right tabular-nums">3</td><td className="px-3 py-2.5"><span className="text-[var(--success)] font-bold">✓ OK</span></td></tr>
                  <tr className="border-t border-[var(--border)]"><td className="px-3 py-2.5 text-[var(--fg-muted)] tabular-nums">2026-04-29 04:00</td><td className="px-3 py-2.5 text-[var(--fg-muted)]">8m 51s</td><td className="px-3 py-2.5 text-right tabular-nums">76</td><td className="px-3 py-2.5 text-right tabular-nums">4</td><td className="px-3 py-2.5 text-right tabular-nums">2</td><td className="px-3 py-2.5"><span className="text-[var(--success)] font-bold">✓ OK</span></td></tr>
                  <tr className="border-t border-[var(--border)]"><td className="px-3 py-2.5 text-[var(--fg-muted)] tabular-nums">2026-04-22 04:00</td><td className="px-3 py-2.5 text-[var(--fg-muted)]">10m 12s</td><td className="px-3 py-2.5 text-right tabular-nums">77</td><td className="px-3 py-2.5 text-right tabular-nums">5</td><td className="px-3 py-2.5 text-right tabular-nums">2</td><td className="px-3 py-2.5"><span className="text-[var(--success)] font-bold">✓ OK</span></td></tr>
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}
