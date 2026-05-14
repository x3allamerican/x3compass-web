import Link from "next/link";

const KPIS = [
  { label: "CSA percentile",       value: "57th",   trend: "↓ 12", trendNeg: true,  spark: "0,28 20,24 40,26 60,20 80,22 100,18 120,14 140,16 160,12 180,10 200,8",  stroke: "#DC2626" },
  { label: "Clean inspection rate", value: "89%",    trend: "↑ 4",  trendNeg: false, spark: "0,22 20,24 40,18 60,20 80,16 100,14 120,12 140,14 160,10 180,8 200,6",  stroke: "#0A1A3C" },
  { label: "DataQ wins · YTD",      value: "$18.4k", trend: "↑ $2.1k", trendNeg: false, spark: "0,32 20,30 40,28 60,24 80,22 100,18 120,14 140,16 160,12 180,8 200,4",  stroke: "#FFC72C" },
  { label: "Audit readiness",       value: "94%",    trend: "↑ 6",  trendNeg: false, spark: "0,30 20,28 40,24 60,22 80,18 100,16 120,12 140,10 160,8 180,6 200,4",   stroke: "#0A1A3C" },
];

const ACTIONS = [
  {
    icon: "📁", title: "DQ Documents Expiring", cfr: "49 CFR § 391.51",
    items: [
      { l: "motor vehicle record", meta: "Nancy Walker · May 15",      pill: "3652d overdue" },
      { l: "eldt training cert",   meta: "Lawrence Sanchez · Aug 14",  pill: "3561d overdue" },
      { l: "medical examiner cert", meta: "Terry Ramirez · Nov 2",     pill: "3481d overdue" },
      { l: "eldt training cert",   meta: "Ronald Watson · Nov 29",     pill: "3454d overdue" },
      { l: "medical examiner cert", meta: "Jacob Roberts · Jul 5",     pill: "3236d overdue" },
    ],
    foot: "Open DQ files →",
  },
  {
    icon: "🪪", title: "CDL Expirations", cfr: "49 CFR § 383",
    items: [
      { l: "Margaret Rodriguez",  meta: "Expires Dec 30",  pill: "14381d overdue" },
      { l: "Douglas Hernandez",   meta: "Expires Oct 10",  pill: "11905d overdue" },
      { l: "Anthony Green",       meta: "Expires Nov 13",  pill: "11141d overdue" },
      { l: "Benjamin Morales",    meta: "Expires Dec 26",  pill: "11098d overdue" },
      { l: "Eric Martinez",       meta: "Expires Aug 29",  pill: "10851d overdue" },
    ],
    foot: "Open drivers →",
  },
  {
    icon: "🩺", title: "Medical Certificates", cfr: "49 CFR § 391.45",
    items: [
      { l: "Zachary Mitchell",    meta: "Expires Jan 31",  pill: "469d overdue" },
      { l: "Anthony Green",       meta: "Expires Feb 11",  pill: "458d overdue" },
      { l: "Kevin Hernandez",     meta: "Expires Apr 1",   pill: "409d overdue" },
      { l: "Jerry Long",          meta: "Expires Jan 8",   pill: "127d overdue" },
      { l: "Lawrence Gonzalez",   meta: "Expires Jan 12",  pill: "123d overdue" },
    ],
    foot: "Upload new cert →",
  },
  {
    icon: "🔧", title: "Preventive Maintenance", cfr: "49 CFR § 396.3 / § 396.17",
    items: [
      { l: "Unit 156A", meta: "PM due Jan 1",  pill: "134d overdue" },
      { l: "Unit 109",  meta: "PM due Jan 4",  pill: "131d overdue" },
      { l: "Unit 154",  meta: "PM due Jan 22", pill: "113d overdue" },
      { l: "Unit 167",  meta: "PM due Jan 29", pill: "106d overdue" },
      { l: "Unit 134",  meta: "PM due Feb 7",  pill: "97d overdue" },
    ],
    foot: "Open vehicles →",
  },
];

const BASICS = [
  { name: "Unsafe driving",     value: 42, status: "ok" },
  { name: "HOS compliance",     value: 78, status: "warn" },
  { name: "Driver fitness",     value: 31, status: "ok" },
  { name: "Controlled subs",    value: 18, status: "ok" },
  { name: "Vehicle maint",      value: 64, status: "warn" },
  { name: "Hazmat compliance",  value: 22, status: "ok" },
  { name: "Crash indicator",    value: 55, status: "warn" },
];

const EXPIR = [
  { who: "Sarah Johnson",  what: "MVR",          cfr: "§ 391.25",  pill: "Overdue 3d", color: "red" },
  { who: "Ricardo Torres", what: "Med cert",     cfr: "§ 391.43",  pill: "14 days",    color: "amber" },
  { who: "Emma Park",      what: "ELDT training",cfr: "Part 380",  pill: "19 days",    color: "amber" },
  { who: "Truck 4287",     what: "Annual DOT",   cfr: "§ 396.17",  pill: "22 days",    color: "amber" },
  { who: "Mike Kowalski",  what: "CDL",          cfr: "§ 383.93",  pill: "28 days",    color: "green" },
];

const pillColor = (c: string) => {
  if (c === "red")   return "bg-[color:var(--red)]/15 text-[color:var(--red)]";
  if (c === "amber") return "bg-[#FEF3C7] text-[#B45309]";
  if (c === "green") return "bg-[#DCFCE7] text-[#166534]";
  return "bg-gray-100 text-gray-700";
};

const basicColor = (v: number) => {
  if (v < 50)  return "#166534";
  if (v < 75)  return "#B45309";
  return "#B91C1C";
};

export default function Dashboard() {
  return (
    <div className="bg-[color:var(--cream)] min-h-screen">
      {/* DARK WELCOME STRIP */}
      <section className="navy-strip">
        <div className="max-w-7xl mx-auto px-6 py-12">
          <div className="flex flex-wrap items-center justify-between gap-6">
            <div>
              <h1 className="text-[36px] sm:text-[48px] font-extrabold text-white leading-tight tracking-tight">
                Welcome,{" "}
                <span className="serif-italic text-[color:var(--red)]">Joshua.</span>
              </h1>
              <p className="text-white/75 text-[15px] mt-2">
                Your fleet&apos;s compliance brain. Apex Logistics LLC · DOT #8001247 · 72 drivers · 67 power units · DIY plan.
              </p>
            </div>
            <div className="flex gap-3 flex-wrap">
              <Link href="#" className="btn-red bg-[color:var(--red)]">★ Ask Compass →</Link>
              <a href="#actions" className="btn-outline bg-transparent border-white text-white hover:bg-white hover:text-[color:var(--navy)]">
                See what needs you today ↓
              </a>
            </div>
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-6 py-10 space-y-10">
        {/* KPI ROW */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          {KPIS.map((k, i) => (
            <div key={i} className="bg-[color:var(--paper)] rounded-2xl p-5 border border-[color:var(--hairline)]">
              <div className="text-[11px] tracking-[.14em] uppercase font-bold text-[color:var(--red)] mb-2">
                {k.label}
              </div>
              <div className="flex items-baseline gap-2">
                <div className="text-[34px] font-black text-[color:var(--navy)] leading-none">{k.value}</div>
                <div className={`text-[13px] font-bold ${k.trendNeg ? "text-[color:var(--red)]" : "text-[#166534]"}`}>
                  {k.trend}
                </div>
              </div>
              <svg viewBox="0 0 200 38" className="w-full h-10 mt-3" preserveAspectRatio="none">
                <polyline fill="none" stroke={k.stroke} strokeWidth="2" points={k.spark} />
              </svg>
            </div>
          ))}
        </div>

        {/* COMPASS AGENT MESSAGE */}
        <div className="bg-[color:var(--paper)] border border-[color:var(--red)]/30 rounded-2xl p-6 relative overflow-hidden">
          <div className="absolute -top-12 -right-12 w-48 h-48 bg-[color:var(--red)]/5 rounded-full blur-2xl" />
          <div className="flex gap-4 items-start relative">
            <div className="w-10 h-10 rounded-full bg-[color:var(--navy)] text-[color:var(--gold)] grid place-items-center font-black text-[18px] flex-shrink-0">
              ∞
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <span className="font-extrabold text-[color:var(--navy)]">Compass</span>
                <span className="text-[12px] text-[color:var(--ink-muted)]">· your AI Safety Director · last scan 2 min ago</span>
              </div>
              <p className="text-[15px] text-[color:var(--navy)] leading-relaxed mb-4">
                Your <strong>HOS BASIC</strong> just spiked from 64 to 78. Three roadside violations on{" "}
                <strong>Ricardo Torres</strong> in the last 14 days look contestable — two have time-of-day errors and one cites the wrong CFR. DataQ win probability:{" "}
                <strong className="text-[color:var(--red)]">72%</strong>. Want me to draft them?
              </p>
              <div className="flex gap-2 flex-wrap">
                <Link href="#" className="btn-red text-[13px] py-2 px-4">Draft DataQ disputes →</Link>
                <Link href="#" className="btn-outline text-[13px] py-2 px-4">Ask something else</Link>
                <button className="text-[13px] py-2 px-4 text-[color:var(--ink-muted)] hover:text-[color:var(--navy)]">
                  Dismiss
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* TWO-PANEL: CSA + EXPIRATIONS */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <div className="bg-[color:var(--paper)] border border-[color:var(--hairline)] rounded-2xl p-6">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-[16px] font-extrabold text-[color:var(--navy)]">CSA BASIC scores</h3>
              <span className="text-[11px] font-mono text-[color:var(--red)] bg-[color:var(--red)]/10 px-2 py-1 rounded-full">Part 385</span>
            </div>
            <div className="space-y-3">
              {BASICS.map((b) => (
                <div key={b.name} className="grid grid-cols-[120px_1fr_36px] gap-3 items-center">
                  <div className="text-[13px] font-semibold text-[color:var(--navy)]">{b.name}</div>
                  <div className="h-2 rounded-full bg-[color:var(--hairline)] overflow-hidden">
                    <div className="h-full rounded-full" style={{ width: `${b.value}%`, background: basicColor(b.value) }} />
                  </div>
                  <div className="text-[13px] font-bold text-[color:var(--navy)] text-right">{b.value}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-[color:var(--paper)] border border-[color:var(--hairline)] rounded-2xl p-6">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-[16px] font-extrabold text-[color:var(--navy)]">Expirations · next 30 days</h3>
              <span className="text-[11px] font-mono text-[color:var(--red)] bg-[color:var(--red)]/10 px-2 py-1 rounded-full">§ 391</span>
            </div>
            <div className="divide-y divide-[color:var(--hairline)]">
              {EXPIR.map((e, i) => (
                <div key={i} className="py-3 flex items-center justify-between gap-3">
                  <div>
                    <div className="text-[14px] font-bold text-[color:var(--navy)]">{e.who}</div>
                    <div className="text-[12px] text-[color:var(--ink-muted)] font-mono">{e.what} · {e.cfr}</div>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-[11px] font-bold ${pillColor(e.color)}`}>
                    {e.pill}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ACTION ITEMS */}
        <div id="actions">
          <div className="flex items-baseline justify-between mb-6">
            <div>
              <div className="eyebrow mb-1">01 · ACTION ITEMS · WHAT NEEDS YOU TODAY</div>
              <h2 className="text-[24px] font-extrabold text-[color:var(--navy)]">
                Eight things waiting on you.
              </h2>
            </div>
            <div className="text-[12px] text-[color:var(--ink-muted)]">Generated 2:38 PM</div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            {ACTIONS.map((a, i) => (
              <div key={i} className="bg-[color:var(--paper)] border border-[color:var(--hairline)] rounded-2xl p-5 flex flex-col">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[18px]">{a.icon}</span>
                  <h3 className="text-[13px] font-extrabold tracking-wide uppercase text-[color:var(--navy)]">{a.title}</h3>
                </div>
                <div className="text-[11px] font-mono text-[color:var(--ink-muted)] mb-4">{a.cfr}</div>
                <div className="divide-y divide-[color:var(--hairline)] flex-1">
                  {a.items.map((it, j) => (
                    <div key={j} className="py-2.5 flex items-center justify-between gap-2">
                      <div className="min-w-0">
                        <div className="text-[13px] font-bold text-[color:var(--navy)] truncate">{it.l}</div>
                        <div className="text-[11px] text-[color:var(--ink-muted)]">{it.meta}</div>
                      </div>
                      <span className="text-[10px] font-bold tracking-wide uppercase px-2 py-1 rounded bg-[#FEF3C7] text-[#B45309] whitespace-nowrap">
                        {it.pill}
                      </span>
                    </div>
                  ))}
                </div>
                <Link href="#" className="text-[13px] font-bold text-[color:var(--red)] mt-4 pt-4 border-t border-[color:var(--hairline)]">
                  {a.foot}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* FLOATING COMPASS BUBBLE */}
      <Link
        href="#"
        className="fixed bottom-6 right-6 w-14 h-14 rounded-full bg-[color:var(--navy)] text-[color:var(--gold)] grid place-items-center font-black text-[22px] shadow-2xl border-2 border-[color:var(--gold)] z-40"
        aria-label="Ask Compass"
      >
        ∞
      </Link>
    </div>
  );
}
