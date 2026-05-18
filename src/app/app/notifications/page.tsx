"use client";
import AppShell from "@/components/AppShell";
import { X3AdminHero, X3KPITile } from "@/components/X3AdminHero";

type Rule = { name: string; trigger: string; channels: string[]; recipients: string };
const RULES: Rule[] = [
  { name: "Account Security Event",     trigger: "Admin security event (login from new location, etc.).",          channels: ["email"],        recipients: "Defaults" },
  { name: "Annual MVR Due",              trigger: "Annual MVR review due. No driving-record events in 12 months.",  channels: ["email"],        recipients: "Defaults" },
  { name: "BG Check Consider",           trigger: "BG check shows \"consider\". Triggers FCRA adverse-action process (5-day timeline).", channels: ["email"], recipients: "Defaults" },
  { name: "CDL Expiring 14 Days",        trigger: "CDL expires in 14 days. Still email-only.",                      channels: ["email"],        recipients: "Defaults" },
  { name: "CDL Expiring 1 Day",          trigger: "CDL expires tomorrow. Driving illegally if not renewed.",        channels: ["email","sms"],  recipients: "Defaults" },
  { name: "CDL Expiring 30 Days",        trigger: "CDL expires in 30 days. Plenty of lead time.",                   channels: ["email"],        recipients: "Defaults" },
  { name: "CDL Expiring 7 Days",         trigger: "CDL expires in 7 days. Email plus driver-portal banner.",        channels: ["email"],        recipients: "Defaults" },
  { name: "Crash Reported",              trigger: "Crash event reported. Insurance + DataQ deadlines tight.",       channels: ["email","sms"],  recipients: "Defaults" },
  { name: "Daily Compliance Digest",     trigger: "Daily admin summary of expiring docs etc.",                       channels: ["email"],        recipients: "Defaults" },
  { name: "Driver Invite Initial",       trigger: "Carrier admin invites a new driver. SMS because drivers don't read email.", channels: ["sms"],   recipients: "Defaults" },
  { name: "Driver Invite Reminder 3day", trigger: "3-day no-action soft nudge.",                                    channels: ["email"],        recipients: "Defaults" },
  { name: "Driver Invite Reminder 7day", trigger: "7-day escalation when driver still hasn't onboarded.",           channels: ["sms"],          recipients: "Defaults" },
  { name: "Drug Test Missed",            trigger: "Driver missed their drug test. Must call carrier immediately.",  channels: ["sms"],          recipients: "Defaults" },
];

const CHANNELS = [
  { name: "SMS",    sent: 0, pct:  0 },
  { name: "Email",  sent: 3, pct: 96 },
  { name: "Push",   sent: 0, pct:  0 },
  { name: "In-App", sent: 0, pct:  0 },
];

const ICON: Record<string, string> = { email: "✉", sms: "💬", push: "🔔", inapp: "📱" };

export default function NotificationsPage() {
  return (
    <AppShell title="Notifications Center" crumbs="X3 Admin · Email · SMS · Push · In-App">
      <div className="px-6 py-6 space-y-6 bg-[var(--bg)] min-h-screen">
        <X3AdminHero
          eyebrow="Notification Center"
          title="Email, SMS, and in-app alerts."
          intro="Configurable rules across MEC, MVR, training, and roster events."
          dataSource={{
            items: [
              <><strong className="text-[var(--fg)]">Notifications</strong> are rows in the <code className="font-mono text-[var(--accent)]">notification_log</code> table — every email, SMS, push, and in-app alert X3 sends gets a row with channel, recipient, status, and timestamp.</>,
              <><strong className="text-[var(--fg)]">Email</strong> goes through <em>Resend</em> (delivery webhooks update status); <strong className="text-[var(--fg)]">SMS</strong> goes through <em>Twilio</em> (delivery callbacks update status); <strong className="text-[var(--fg)]">Push & In-App</strong> are handled by our own service worker.</>,
              <><strong className="text-[var(--fg)]">Active rules</strong> live in <code className="font-mono text-[var(--accent)]">notification_rules</code> — each row is one trigger (e.g. <em>medical-card 30d-out</em>) wired to one or more channels and recipient roles.</>,
              <><strong className="text-[var(--fg)]">SMS credits</strong> are tracked locally; we top up via Twilio and the counter decrements with each outbound text.</>,
            ],
            footnote: <>The 30 Days windows are rolling, computed from <code className="font-mono">sent_at</code> at page load. Critical alerts always fire regardless of digest mode.</>,
          }}
        />
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <X3KPITile label="Delivered · 30 days" value={3}        sub="Across all channels"  tone="navy" />
          <X3KPITile label="Delivery rate"        value={"100.0%"} sub="Industry avg 94%"     tone="navy" />
          <X3KPITile label="SMS credits"          value={"2,847"}  sub="Resets May 01"        tone="navy" />
          <X3KPITile label="Active rules"         value={30}       sub="4 critical paths"     tone="navy" />
        </div>
        <div className="grid lg:grid-cols-2 gap-4">
          <div className="x3-card p-5">
            <div className="text-[15px] font-extrabold text-[var(--fg)] mb-3">Delivery by Channel · last 30 Days</div>
            <div className="space-y-3">
              {CHANNELS.map((c) => (
                <div key={c.name}>
                  <div className="flex justify-between text-[12px] mb-1"><span className="font-semibold text-[var(--fg)]">{c.name}</span><span className="text-[var(--fg-muted)]">{c.sent} sends · last 30d</span></div>
                  <div className="h-2 rounded-full bg-[var(--surface-2)] overflow-hidden">
                    <div className="h-full rounded-full" style={{ width: `${c.pct}%`, background: "var(--success)" }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="x3-card overflow-hidden">
            <div className="px-5 py-3 border-b border-[var(--border)] flex items-center justify-between">
              <div className="text-[15px] font-extrabold text-[var(--fg)]">Active Alert Rules</div>
              <button className="px-3 py-1.5 rounded-lg font-extrabold text-[12px] text-[var(--accent-fg)]" style={{ background: "linear-gradient(135deg, var(--accent), var(--accent-2))" }}>+ New Rule</button>
            </div>
            <div className="overflow-y-auto" style={{ maxHeight: 540 }}>
            <table className="w-full text-[12px]">
              <thead className="bg-[var(--surface-2)] text-[10px] tracking-[.14em] uppercase text-[var(--fg-muted)] sticky top-0">
                <tr><th className="text-left px-3 py-2 font-bold">Rule</th><th className="text-left px-3 py-2 font-bold">Trigger</th><th className="text-left px-3 py-2 font-bold">Channels</th><th className="text-left px-3 py-2 font-bold">Recipients</th></tr>
              </thead>
              <tbody>{RULES.map((r, i) => (
                <tr key={i} className="border-t border-[var(--border)]">
                  <td className="px-3 py-2.5 text-[var(--fg)] font-semibold">{r.name}</td>
                  <td className="px-3 py-2.5 text-[var(--fg-muted)]">{r.trigger}</td>
                  <td className="px-3 py-2.5">{r.channels.map((c) => <span key={c} className="inline-block w-5 h-5 grid place-items-center text-[10px] bg-[var(--surface-2)] rounded mr-1" title={c}>{ICON[c]}</span>)}</td>
                  <td className="px-3 py-2.5 text-[var(--fg-muted)]">{r.recipients}</td>
                </tr>))}</tbody>
            </table>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
