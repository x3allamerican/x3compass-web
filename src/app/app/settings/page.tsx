import Link from "next/link";
import AppShell from "@/components/AppShell";
import PageGuide from "@/components/PageGuide";

const TEAM = [
  { initials: "JK", name: "Joshua Kovarik",   email: "joshua@x3compass.com",  role: "Owner",      lastSeen: "Active now" },
  { initials: "RT", name: "Ricardo Torres",   email: "ricardo@apexlogistics.com", role: "Driver", lastSeen: "2 hr ago" },
  { initials: "DM", name: "Dana Mitchell",    email: "dana@apexlogistics.com",    role: "Dispatcher", lastSeen: "Yesterday" },
  { initials: "BR", name: "Brad Reynolds",    email: "brad@apexlogistics.com",    role: "Safety", lastSeen: "Mar 18" },
];

const ROLE_COLOR: Record<string, string> = {
  Owner: "bg-[#22D3EE]/15 text-[#22D3EE] border border-[#22D3EE]/30",
  Driver: "bg-slate-500/15 text-slate-300 border border-slate-500/30",
  Dispatcher: "bg-violet-500/15 text-violet-300 border border-violet-500/30",
  Safety: "bg-emerald-500/15 text-emerald-300 border border-emerald-500/30",
  Billing: "bg-amber-500/15 text-amber-300 border border-amber-500/30",
};

const NOTIFICATIONS = [
  { evt: "DQ document expires in 30/14/7 days",    cfr: "§ 391.51",   email: true,  sms: false, app: true,  daily: true },
  { evt: "Med cert expires in 30/14/7 days",        cfr: "§ 391.43",   email: true,  sms: true,  app: true,  daily: true },
  { evt: "Annual MVR review due",                   cfr: "§ 391.25",   email: true,  sms: false, app: true,  daily: true },
  { evt: "Clearinghouse annual query due",          cfr: "§ 382.701",  email: true,  sms: false, app: true,  daily: true },
  { evt: "Roadside inspection logged (any)",        cfr: "§ 396.9",    email: true,  sms: true,  app: true,  daily: false },
  { evt: "Inspection flagged as contestable",       cfr: "Part 386",   email: true,  sms: true,  app: true,  daily: false },
  { evt: "HOS BASIC percentile crosses threshold",  cfr: "Part 385",   email: true,  sms: false, app: true,  daily: false },
  { evt: "Accident logged",                          cfr: "§ 390.15",   email: true,  sms: true,  app: true,  daily: false },
  { evt: "Random D&A selection due",                 cfr: "§ 382.305",  email: true,  sms: false, app: true,  daily: false },
  { evt: "ELD malfunction detected",                 cfr: "§ 395.20",   email: false, sms: true,  app: true,  daily: false },
];

const Pill = ({ on }: { on: boolean }) => (
  <span className={`inline-flex items-center justify-center w-10 h-6 rounded-full ${on ? "bg-[#22D3EE]/15" : "bg-white/5"} border ${on ? "border-[#22D3EE]/40" : "border-white/10"}`}>
    <span className={`w-4 h-4 rounded-full transition-transform ${on ? "translate-x-2 bg-[#22D3EE]" : "-translate-x-2 bg-white/30"}`} />
  </span>
);

export default function SettingsPage() {
  return (
    <AppShell title="Settings" crumbs="ACCOUNT · WORKSPACE & TEAM">
      <div className="px-6 py-8 max-w-6xl mx-auto space-y-6">
        {/* HOW THIS PAGE WORKS */}
        <PageGuide
          cfr="Carrier configuration · no specific CFR"
          what="Your carrier identity, billing, notification preferences, integrations, team seats, and Compass behavior settings."
          who="Carrier admins. Most settings are one-time setup; you'll come back occasionally to add a new integration or adjust notification rules."
          howTo={[
            { n: 1, title: "Fill out carrier profile", detail: "Carrier name, DOT#, MC#, operating authority, fleet size, primary terminal address. Used in audit packets and all generated documents." },
            { n: 2, title: "Connect integrations", detail: "Centralized view of every vendor integration — ELDs, fuel cards, MVR services, drug-testing labs, payroll. OAuth or API-key flow per integration." },
            { n: 3, title: "Configure notifications", detail: "Per-event rules: who gets notified when (CSA score change, expiration warnings, OOS events, positive D&A tests). Email + SMS routing." },
            { n: 4, title: "Invite your team", detail: "Add safety director, dispatcher, fleet manager roles. Each has different access — safety has DQF + D&A; dispatcher has HOS; etc." },
          ]}
          askCompassLinks={[
            { label: "How do I add a team member?", query: "How do I add a team member" },
            { label: "Which integrations should I connect first?", query: "Which integrations should I connect first" },
          ]}
        />

        {/* TABS */}
        <div className="flex gap-1 p-1 rounded-lg bg-[#15233D] border border-[#1E3556] w-fit">
          {["Carrier profile", "Team", "Notifications", "API & Integrations", "Billing"].map((t, i) => (
            <button
              key={i}
              className={`px-4 py-2 rounded-md text-[13px] font-bold ${
                i === 0
                  ? "bg-[#22D3EE]/15 text-[#22D3EE]"
                  : "text-white/65 hover:text-white"
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        {/* CARRIER PROFILE */}
        <div className="rounded-2xl p-6 border border-[#1E3556]" style={{ background: "linear-gradient(180deg, #15233D 0%, #0F1C32 100%)" }}>
          <div className="flex items-center justify-between mb-5 flex-wrap gap-2">
            <h3 className="text-[16px] font-extrabold text-white">Carrier profile</h3>
            <span className="text-[10px] font-mono text-[#22D3EE]/70">FMCSA REGISTRATION</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {[
              { label: "Legal name", value: "Apex Logistics LLC", help: "Per DOT registration" },
              { label: "DOT #",     value: "8001247",            help: "USDOT decal number" },
              { label: "MC #",      value: "MC-1098432",         help: "Motor Carrier authority" },
              { label: "EIN",       value: "84-3392851",         help: "Federal Employer ID" },
              { label: "Principal place of business", value: "1240 Logistics Way, Houston, TX 77032", help: "" },
              { label: "Operating authority",  value: "Authorized to operate as Common Carrier (Property)", help: "" },
              { label: "Hazmat-registered",    value: "Yes · DOT Hazmat ID 062118-091X", help: "EPA Hazmat registration" },
              { label: "Insurance · BIPD",     value: "$1,000,000 / $5,000,000 · Sentry Insurance", help: "Carrier liability" },
            ].map((f, i) => (
              <div key={i}>
                <label className="block text-[11px] tracking-wider uppercase font-bold text-white/55 mb-1.5">{f.label}</label>
                <input
                  type="text"
                  defaultValue={f.value}
                  className="w-full bg-[#0A1929] border border-[#1E3556] rounded-lg px-3 py-2.5 text-[13.5px] text-white focus:border-[#22D3EE] focus:outline-none focus:ring-2 focus:ring-[#22D3EE]/20"
                />
                {f.help && <div className="text-[11px] text-white/45 mt-1">{f.help}</div>}
              </div>
            ))}
          </div>
          <div className="mt-6 flex gap-2">
            <button className="px-5 py-2.5 rounded-full text-[13px] font-bold text-[#0A1929]"
              style={{ background: "linear-gradient(135deg, #22D3EE, #06B6D4)", boxShadow: "0 4px 12px rgba(34, 211, 238, 0.32)" }}
            >
              Save changes
            </button>
            <button className="px-5 py-2.5 rounded-full text-[13px] font-bold text-white border border-white/20 hover:bg-white/5">
              Discard
            </button>
          </div>
        </div>

        {/* TEAM */}
        <div className="rounded-2xl border border-[#1E3556] overflow-hidden" style={{ background: "linear-gradient(180deg, #15233D 0%, #0F1C32 100%)" }}>
          <div className="px-6 py-5 border-b border-[#1E3556] flex items-center justify-between flex-wrap gap-3">
            <div>
              <h3 className="text-[16px] font-extrabold text-white">Team members</h3>
              <p className="text-[13px] text-white/55 mt-0.5">Unlimited seats on every plan. Each member has their own login.</p>
            </div>
            <button className="px-4 py-2 rounded-full text-[13px] font-bold text-[#0A1929]"
              style={{ background: "linear-gradient(135deg, #22D3EE, #06B6D4)" }}
            >
              + Invite member
            </button>
          </div>
          <div className="divide-y divide-[#1E3556]">
            {TEAM.map((m, i) => (
              <div key={i} className="px-6 py-3.5 flex items-center justify-between gap-3 flex-wrap">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-full grid place-items-center font-extrabold text-[11px] text-[#0A1929] flex-shrink-0"
                    style={{ background: "linear-gradient(135deg, #22D3EE, #06B6D4)" }}
                  >
                    {m.initials}
                  </div>
                  <div className="min-w-0">
                    <div className="text-white font-bold truncate">{m.name}</div>
                    <div className="text-white/55 text-[12px] truncate">{m.email}</div>
                  </div>
                </div>
                <div className="flex items-center gap-3 flex-wrap">
                  <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold ${ROLE_COLOR[m.role]}`}>{m.role}</span>
                  <span className="text-[11px] text-white/45">{m.lastSeen}</span>
                  <button className="text-[12px] font-bold text-[#22D3EE] hover:text-[#67E8F9]">Edit</button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* NOTIFICATIONS */}
        <div className="rounded-2xl border border-[#1E3556] overflow-hidden" style={{ background: "linear-gradient(180deg, #15233D 0%, #0F1C32 100%)" }}>
          <div className="px-6 py-5 border-b border-[#1E3556]">
            <h3 className="text-[16px] font-extrabold text-white">Notification rules</h3>
            <p className="text-[13px] text-white/55 mt-0.5">Per-event control. Daily digest aggregates everything marked “digest” at 7am.</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-[13px]">
              <thead className="bg-[#0F1C32]/60">
                <tr className="text-left text-[10px] tracking-[.14em] uppercase font-bold text-white/45">
                  <th className="py-3 px-6">Event</th>
                  <th className="py-3 px-3">CFR</th>
                  <th className="py-3 px-3 text-center">Email</th>
                  <th className="py-3 px-3 text-center">SMS</th>
                  <th className="py-3 px-3 text-center">In-app</th>
                  <th className="py-3 px-3 text-center">Daily digest</th>
                  <th className="py-3 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1E3556]">
                {NOTIFICATIONS.map((n, i) => (
                  <tr key={i} className="hover:bg-[#22D3EE]/5">
                    <td className="py-3 px-6 text-white/90 font-semibold">{n.evt}</td>
                    <td className="py-3 px-3 font-mono text-[11px] text-[#22D3EE]/80">{n.cfr}</td>
                    <td className="py-3 px-3 text-center"><Pill on={n.email} /></td>
                    <td className="py-3 px-3 text-center"><Pill on={n.sms} /></td>
                    <td className="py-3 px-3 text-center"><Pill on={n.app} /></td>
                    <td className="py-3 px-3 text-center"><Pill on={n.daily} /></td>
                    <td className="py-3 px-6 text-right text-[12px]">
                      <button className="text-[#22D3EE] font-bold hover:text-[#67E8F9]">Test send</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* API & INTEGRATIONS */}
        <div className="rounded-2xl p-6 border border-[#1E3556]" style={{ background: "linear-gradient(180deg, #15233D 0%, #0F1C32 100%)" }}>
          <h3 className="text-[16px] font-extrabold text-white mb-4">API & data integrations</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-[11px] tracking-wider uppercase font-bold text-white/55 mb-1.5">Endpoint URL</label>
              <div className="flex gap-2">
                <code className="flex-1 bg-[#0A1929] border border-[#1E3556] rounded-lg px-3 py-2.5 text-[13px] font-mono text-[#22D3EE]">
                  https://api.x3compass.com/v1/ingest
                </code>
                <button className="px-3 py-2.5 rounded-lg text-[12px] font-bold text-white border border-white/20 hover:bg-white/5">Copy</button>
              </div>
            </div>
            <div>
              <label className="block text-[11px] tracking-wider uppercase font-bold text-white/55 mb-1.5">API key</label>
              <div className="flex gap-2">
                <code className="flex-1 bg-[#0A1929] border border-[#1E3556] rounded-lg px-3 py-2.5 text-[13px] font-mono text-white/85">
                  cmpss_live_••••••••••••••••••••••3pK9
                </code>
                <button className="px-3 py-2.5 rounded-lg text-[12px] font-bold text-white border border-white/20 hover:bg-white/5">Reveal</button>
                <button className="px-3 py-2.5 rounded-lg text-[12px] font-bold text-white border border-white/20 hover:bg-white/5">Rotate</button>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-3">
              <a href="#" className="rounded-xl p-4 bg-[#0A1929] border border-[#1E3556] hover:border-[#22D3EE]/40">
                <div className="text-[20px] mb-2">📄</div>
                <div className="text-[13px] font-bold text-white mb-1">API docs</div>
                <div className="text-[11px] text-white/55">Endpoints, schemas, examples</div>
              </a>
              <a href="#" className="rounded-xl p-4 bg-[#0A1929] border border-[#1E3556] hover:border-[#22D3EE]/40">
                <div className="text-[20px] mb-2">📥</div>
                <div className="text-[13px] font-bold text-white mb-1">CSV templates</div>
                <div className="text-[11px] text-white/55">Drivers, vehicles, inspections, D&A</div>
              </a>
              <a href="#" className="rounded-xl p-4 bg-[#0A1929] border border-[#1E3556] hover:border-[#22D3EE]/40">
                <div className="text-[20px] mb-2">🔔</div>
                <div className="text-[13px] font-bold text-white mb-1">Webhooks</div>
                <div className="text-[11px] text-white/55">Subscribe to events from X3</div>
              </a>
            </div>
          </div>
        </div>

        {/* BILLING */}
        <div className="rounded-2xl p-6 border border-[#1E3556]" style={{ background: "linear-gradient(180deg, #15233D 0%, #0F1C32 100%)" }}>
          <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
            <h3 className="text-[16px] font-extrabold text-white">Plan & billing</h3>
            <span className="px-3 py-1 rounded-full text-[11px] font-bold bg-[#22D3EE]/15 text-[#22D3EE] border border-[#22D3EE]/30">
              DIY · Compass AI · 72 drivers
            </span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-5">
            <div>
              <div className="text-[10px] tracking-[.14em] uppercase font-bold text-white/55 mb-1">Current plan</div>
              <div className="text-[18px] font-extrabold text-white">DIY · $25/driver</div>
              <div className="text-[12px] text-white/55">$1,800 / mo at 72 drivers</div>
            </div>
            <div>
              <div className="text-[10px] tracking-[.14em] uppercase font-bold text-white/55 mb-1">Add-ons</div>
              <div className="text-[18px] font-extrabold text-white">Hazmat · $99/mo</div>
              <div className="text-[12px] text-white/55">Placard Wizard + 100 hazmat skills</div>
            </div>
            <div>
              <div className="text-[10px] tracking-[.14em] uppercase font-bold text-white/55 mb-1">Next invoice</div>
              <div className="text-[18px] font-extrabold text-white">$1,899 · Jun 14</div>
              <div className="text-[12px] text-white/55">Visa ending 4421</div>
            </div>
          </div>
          <div className="flex gap-2 flex-wrap">
            <button className="px-4 py-2 rounded-full text-[13px] font-bold text-[#0A1929]" style={{ background: "linear-gradient(135deg, #22D3EE, #06B6D4)" }}>
              Upgrade to DFY · $50/driver
            </button>
            <button className="px-4 py-2 rounded-full text-[13px] font-bold text-white border border-white/20 hover:bg-white/5">
              View invoices
            </button>
            <button className="px-4 py-2 rounded-full text-[13px] font-bold text-white border border-white/20 hover:bg-white/5">
              Update payment
            </button>
            <Link href="/#pricing" className="px-4 py-2 rounded-full text-[13px] font-bold text-white border border-white/20 hover:bg-white/5">
              Compare plans
            </Link>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
