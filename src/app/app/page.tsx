"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import AppShell from "@/components/AppShell";

// ─────────────────────────────────────────────────────────────────────────────
// SHAPES — must stay in sync with /functions/api/dashboard.ts
// ─────────────────────────────────────────────────────────────────────────────
type Kpi = { label: string; value: string; trend: string; trendNeg: boolean; spark: string };
type ActionItem = { l: string; meta: string; pill: string };
type ActionCard = { icon: string; title: string; cfr: string; items: ActionItem[]; foot: string; href: string };
type Basic = { name: string; value: number };
type Expir = { who: string; what: string; cfr: string; pill: string; color: string };

type DashboardData = {
  header: { greeting_name: string; carrier_label: string; summary: string };
  kpis: Kpi[];
  actions: ActionCard[];
  basics: Basic[];
  expir: Expir[];
};

// ─────────────────────────────────────────────────────────────────────────────
// INITIAL STATE — identical to the prior hardcoded values so the UI is
// byte-for-byte the same on first paint. Replaced by /api/dashboard on mount.
// ─────────────────────────────────────────────────────────────────────────────
const INITIAL: DashboardData = {
  header: {
    greeting_name: "Joshua",
    carrier_label: "DASHBOARD · APEX LOGISTICS LLC · DOT #8001247",
    summary: "72 drivers · 67 power units · 85% compliance health · 42 open alerts · DIY plan",
  },
  kpis: [
    { label: "CSA percentile",       value: "57th",   trend: "↓ 12",    trendNeg: true,  spark: "0,28 20,24 40,26 60,20 80,22 100,18 120,14 140,16 160,12 180,10 200,8" },
    { label: "Clean inspection rate", value: "89%",    trend: "↑ 4",     trendNeg: false, spark: "0,22 20,24 40,18 60,20 80,16 100,14 120,12 140,14 160,10 180,8 200,6" },
    { label: "DataQ wins · YTD",      value: "$18.4k", trend: "↑ $2.1k", trendNeg: false, spark: "0,32 20,30 40,28 60,24 80,22 100,18 120,14 140,16 160,12 180,8 200,4" },
    { label: "Audit readiness",       value: "94%",    trend: "↑ 6",     trendNeg: false, spark: "0,30 20,28 40,24 60,22 80,18 100,16 120,12 140,10 160,8 180,6 200,4" },
  ],
  basics: [
    { name: "Unsafe driving",    value: 42 },
    { name: "HOS compliance",    value: 78 },
    { name: "Driver fitness",    value: 31 },
    { name: "Controlled subs",   value: 18 },
    { name: "Vehicle maint",     value: 64 },
    { name: "Hazmat compliance", value: 22 },
    { name: "Crash indicator",   value: 55 },
  ],
  expir: [
    { who: "Sarah Johnson",  what: "MVR",          cfr: "§ 391.25", pill: "Overdue 3d", color: "red" },
    { who: "Ricardo Torres", what: "Med cert",     cfr: "§ 391.43", pill: "14 days",    color: "amber" },
    { who: "Emma Park",      what: "ELDT training",cfr: "Part 380", pill: "19 days",    color: "amber" },
    { who: "Truck 4287",     what: "Annual DOT",   cfr: "§ 396.17", pill: "22 days",    color: "amber" },
    { who: "Mike Kowalski",  what: "CDL",          cfr: "§ 383.93", pill: "28 days",    color: "green" },
  ],
  actions: [
    { icon: "📁", title: "DQ Documents Expiring", cfr: "49 CFR § 391.51", foot: "Open DQ files →", href: "/app/dq-files", items: [
      { l: "motor vehicle record", meta: "Nancy Walker · May 15",     pill: "3652d overdue" },
      { l: "eldt training cert",   meta: "Lawrence Sanchez · Aug 14", pill: "3561d overdue" },
      { l: "medical examiner cert", meta: "Terry Ramirez · Nov 2",    pill: "3481d overdue" },
      { l: "eldt training cert",   meta: "Ronald Watson · Nov 29",    pill: "3454d overdue" },
      { l: "medical examiner cert", meta: "Jacob Roberts · Jul 5",    pill: "3236d overdue" },
    ]},
    { icon: "🪪", title: "CDL Expirations", cfr: "49 CFR § 383", foot: "Open drivers →", href: "/app/drivers", items: [
      { l: "Margaret Rodriguez", meta: "Expires Dec 30", pill: "14381d overdue" },
      { l: "Douglas Hernandez",  meta: "Expires Oct 10", pill: "11905d overdue" },
      { l: "Anthony Green",      meta: "Expires Nov 13", pill: "11141d overdue" },
      { l: "Benjamin Morales",   meta: "Expires Dec 26", pill: "11098d overdue" },
      { l: "Eric Martinez",      meta: "Expires Aug 29", pill: "10851d overdue" },
    ]},
    { icon: "🩺", title: "Medical Certificates", cfr: "49 CFR § 391.45", foot: "Upload new cert →", href: "/app/dq-files", items: [
      { l: "Zachary Mitchell",  meta: "Expires Jan 31", pill: "469d overdue" },
      { l: "Anthony Green",     meta: "Expires Feb 11", pill: "458d overdue" },
      { l: "Kevin Hernandez",   meta: "Expires Apr 1",  pill: "409d overdue" },
      { l: "Jerry Long",        meta: "Expires Jan 8",  pill: "127d overdue" },
      { l: "Lawrence Gonzalez", meta: "Expires Jan 12", pill: "123d overdue" },
    ]},
    { icon: "🔧", title: "Preventive Maintenance", cfr: "49 CFR § 396.3 / § 396.17", foot: "Open vehicles →", href: "/app/vehicles", items: [
      { l: "Unit 156A", meta: "PM due Jan 1",  pill: "134d overdue" },
      { l: "Unit 109",  meta: "PM due Jan 4",  pill: "131d overdue" },
      { l: "Unit 154",  meta: "PM due Jan 22", pill: "113d overdue" },
      { l: "Unit 167",  meta: "PM due Jan 29", pill: "106d overdue" },
      { l: "Unit 134",  meta: "PM due Feb 7",  pill: "97d overdue" },
    ]},
  ],
};

const pillColor = (c: string) => {
  if (c === "red")   return "bg-rose-500/15 text-rose-300 border border-rose-500/30";
  if (c === "amber") return "bg-amber-500/15 text-amber-300 border border-amber-500/30";
  if (c === "green") return "bg-emerald-500/15 text-emerald-300 border border-emerald-500/30";
  return "bg-slate-500/15 text-slate-300";
};

const basicColor = (v: number) => {
  if (v < 50)  return "#22D3EE";
  if (v < 75)  return "#FBBF24";
  return "#F87171";
};

const lastScanLabel = (d: Date | null) => {
  if (!d) return "demo mode";
  const mins = Math.floor((Date.now() - d.getTime()) / 60_000);
  if (mins < 1) return "just now";
  if (mins === 1) return "1 min ago";
  return `${mins} min ago`;
};

export default function Dashboard() {
  const [data, setData] = useState<DashboardData>(INITIAL);
  const [isDemo, setIsDemo] = useState<boolean>(true);
  const [lastScan, setLastScan] = useState<Date | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const r = await fetch("/api/dashboard", { cache: "no-store" });
        if (!r.ok) return;
        const body = await r.json() as { ok: boolean; demo: boolean; data?: DashboardData };
        if (!body.ok || !body.data) return;
        if (cancelled) return;
        setData(body.data);
        setIsDemo(!!body.demo);
        setLastScan(new Date());
      } catch {
        // network error → keep initial demo state
      }
    })();
    return () => { cancelled = true; };
  }, []);

  return (
    <AppShell
      title={`Welcome, ${data.header.greeting_name}`}
      crumbs={data.header.carrier_label}
      actions={
        <>
          <button className="hidden md:inline-flex items-center gap-2 px-3 py-2 rounded-full text-[12px] font-semibold text-white border border-white/15 hover:bg-white/5">
            ⬆ Import CSV
          </button>
          <Link
            href="#"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-[13px] font-semibold text-[#0A1929]"
            style={{
              background: "linear-gradient(135deg, #22D3EE, #06B6D4)",
              boxShadow: "0 4px 12px rgba(34, 211, 238, 0.32)",
            }}
          >
            ★ Ask Compass →
          </Link>
        </>
      }
    >
      <div className="px-6 py-8 space-y-8">
        {/* WELCOME STRIP */}
        <section
          className="rounded-2xl p-8 relative overflow-hidden border border-[#1E3556]"
          style={{
            background: "linear-gradient(135deg, #0F1C32 0%, #15233D 100%)",
          }}
        >
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background:
                "radial-gradient(900px 500px at 20% 0%, rgba(34, 211, 238, 0.22), transparent 60%), radial-gradient(700px 400px at 90% 100%, rgba(6, 182, 212, 0.16), transparent 60%)",
            }}
          />
          <div className="relative flex flex-wrap items-center justify-between gap-6">
            <div>
              <h1 className="text-[32px] sm:text-[40px] font-extrabold text-white leading-tight tracking-tight">
                Welcome, <span className="serif-italic" style={{ color: "#22D3EE" }}>{data.header.greeting_name}.</span>
              </h1>
              <p className="text-white/70 text-[14px] mt-2">
                {data.header.summary}
              </p>
            </div>
            <a
              href="#actions"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full font-semibold text-[14px] text-white border border-white/20 hover:bg-white/5"
            >
              See what needs you today ↓
            </a>
          </div>
        </section>

        {/* KPI ROW */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {data.kpis.map((k, i) => (
            <div
              key={i}
              className="rounded-2xl p-5 border border-[#1E3556] relative overflow-hidden"
              style={{
                background: "linear-gradient(180deg, #15233D 0%, #0F1C32 100%)",
                boxShadow: "0 1px 0 rgba(34, 211, 238, 0.08) inset, 0 12px 32px rgba(0,0,0,0.35)",
              }}
            >
              <div className="text-[11px] tracking-[.14em] uppercase font-bold text-[#22D3EE] mb-2">{k.label}</div>
              <div className="flex items-baseline gap-2 mb-2">
                <div className="text-[32px] font-black text-white leading-none">{k.value}</div>
                <div className={`text-[13px] font-bold ${k.trendNeg ? "text-rose-400" : "text-emerald-400"}`}>
                  {k.trend}
                </div>
              </div>
              <svg viewBox="0 0 200 38" className="w-full h-10" preserveAspectRatio="none">
                <defs>
                  <linearGradient id={`g-${i}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#22D3EE" stopOpacity="0.35" />
                    <stop offset="100%" stopColor="#22D3EE" stopOpacity="0" />
                  </linearGradient>
                </defs>
                <polyline fill={`url(#g-${i})`} stroke="none" points={`${k.spark} 200,38 0,38`} />
                <polyline fill="none" stroke="#22D3EE" strokeWidth="2" points={k.spark} />
              </svg>
            </div>
          ))}
        </div>

        {/* COMPASS AGENT */}
        <div
          className="rounded-2xl p-6 relative overflow-hidden border"
          style={{
            background: "linear-gradient(135deg, #15233D 0%, #0F1C32 100%)",
            borderColor: "rgba(34, 211, 238, 0.35)",
          }}
        >
          <div
            className="absolute -top-16 -right-16 w-56 h-56 rounded-full blur-3xl pointer-events-none"
            style={{ background: "radial-gradient(circle, rgba(34, 211, 238, 0.22), transparent 70%)" }}
          />
          <div className="flex gap-4 items-start relative">
            <div
              className="w-11 h-11 rounded-full grid place-items-center font-black text-[20px] flex-shrink-0"
              style={{
                background: "linear-gradient(135deg, #22D3EE, #06B6D4)",
                color: "#0A1929",
                boxShadow: "0 0 20px rgba(34, 211, 238, 0.45)",
              }}
            >
              ∞
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-2 flex-wrap">
                <span className="font-extrabold text-white">Compass</span>
                <span className="text-[12px] text-white/50">· your AI Safety Director · last scan {lastScanLabel(lastScan)}</span>
              </div>
              <p className="text-[15px] text-white/90 leading-relaxed mb-4">
                Your <strong className="text-[#22D3EE]">HOS BASIC</strong> just spiked from 64 to 78. Three roadside violations on{" "}
                <strong className="text-white">Ricardo Torres</strong> in the last 14 days look contestable — two have time-of-day errors and one cites the wrong CFR. DataQ win probability:{" "}
                <strong className="text-[#22D3EE]">72%</strong>. Want me to draft them?
              </p>
              <div className="flex gap-2 flex-wrap">
                <Link href="/app/inspections" className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-[13px] font-semibold text-[#0A1929]"
                  style={{ background: "linear-gradient(135deg, #22D3EE, #06B6D4)", boxShadow: "0 4px 12px rgba(34, 211, 238, 0.32)" }}
                >
                  Draft DataQ disputes →
                </Link>
                <Link href="/app/ask" className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-[13px] font-semibold text-white border border-white/20 hover:bg-white/5">
                  Ask something else
                </Link>
                <button className="text-[13px] py-2 px-4 text-white/60 hover:text-white">Dismiss</button>
              </div>
            </div>
          </div>
        </div>

        {/* TWO-PANEL */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="rounded-2xl p-6 border border-[#1E3556]" style={{ background: "linear-gradient(180deg, #15233D 0%, #0F1C32 100%)" }}>
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-[15px] font-extrabold text-white">CSA BASIC scores</h3>
              <span className="text-[10px] font-mono text-[#22D3EE] bg-[#22D3EE]/10 border border-[#22D3EE]/25 px-2 py-1 rounded-full">Part 385</span>
            </div>
            <div className="space-y-3">
              {data.basics.map((b) => (
                <div key={b.name} className="grid grid-cols-[120px_1fr_36px] gap-3 items-center">
                  <div className="text-[13px] font-semibold text-white/85">{b.name}</div>
                  <div className="h-2 rounded-full bg-[#1E3556] overflow-hidden">
                    <div className="h-full rounded-full" style={{ width: `${b.value}%`, background: basicColor(b.value), boxShadow: `0 0 10px ${basicColor(b.value)}80` }} />
                  </div>
                  <div className="text-[13px] font-bold text-white text-right">{b.value}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl p-6 border border-[#1E3556]" style={{ background: "linear-gradient(180deg, #15233D 0%, #0F1C32 100%)" }}>
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-[15px] font-extrabold text-white">Expirations · next 30 days</h3>
              <span className="text-[10px] font-mono text-[#22D3EE] bg-[#22D3EE]/10 border border-[#22D3EE]/25 px-2 py-1 rounded-full">§ 391</span>
            </div>
            <div className="divide-y divide-[#1E3556]">
              {data.expir.length === 0 ? (
                <div className="py-6 text-center text-[13px] text-white/45">No expirations in the next 30 days.</div>
              ) : data.expir.map((e, i) => (
                <div key={i} className="py-3 flex items-center justify-between gap-3">
                  <div>
                    <div className="text-[14px] font-bold text-white">{e.who}</div>
                    <div className="text-[12px] text-white/45 font-mono">{e.what} · {e.cfr}</div>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-[11px] font-bold ${pillColor(e.color)}`}>{e.pill}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ACTION ITEMS */}
        <div id="actions">
          <div className="flex items-baseline justify-between mb-5 flex-wrap gap-2">
            <div>
              <div className="text-[11px] tracking-[.18em] uppercase font-bold text-[#22D3EE] mb-1">
                01 · ACTION ITEMS · WHAT NEEDS YOU TODAY
              </div>
              <h2 className="text-[22px] font-extrabold text-white">
                {data.actions.reduce((n, a) => n + a.items.length, 0)
                  ? `${data.actions.reduce((n, a) => n + a.items.length, 0)} things waiting on you.`
                  : "Nothing waiting on you today."}
              </h2>
            </div>
            <div className="text-[12px] text-white/45">
              {isDemo ? "Demo data · connect Supabase to light up" : `Live · refreshed ${lastScanLabel(lastScan)}`}
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {data.actions.map((a, i) => (
              <div key={i} className="rounded-2xl p-5 border border-[#1E3556] flex flex-col" style={{ background: "linear-gradient(180deg, #15233D 0%, #0F1C32 100%)" }}>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[18px]">{a.icon}</span>
                  <h3 className="text-[12px] font-extrabold tracking-wide uppercase text-white">{a.title}</h3>
                </div>
                <div className="text-[11px] font-mono text-[#22D3EE]/70 mb-4">{a.cfr}</div>
                <div className="divide-y divide-[#1E3556] flex-1">
                  {a.items.length === 0 ? (
                    <div className="py-6 text-center text-[12px] text-white/45">Nothing overdue — nice.</div>
                  ) : a.items.map((it, j) => (
                    <div key={j} className="py-2.5 flex items-center justify-between gap-2">
                      <div className="min-w-0">
                        <div className="text-[13px] font-bold text-white truncate">{it.l}</div>
                        <div className="text-[11px] text-white/50">{it.meta}</div>
                      </div>
                      <span className="text-[10px] font-bold tracking-wide uppercase px-2 py-1 rounded bg-amber-500/15 text-amber-300 border border-amber-500/30 whitespace-nowrap">
                        {it.pill}
                      </span>
                    </div>
                  ))}
                </div>
                <Link href={a.href} className="text-[13px] font-bold text-[#22D3EE] mt-4 pt-4 border-t border-[#1E3556] hover:text-[#67E8F9]">
                  {a.foot}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
