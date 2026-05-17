import Link from "next/link";
import SiteShell from "@/components/SiteShell";

export const metadata = {
  title: "Changelog — X3 Compass",
  description: "We build in the open. Every shipped feature, every fix, every milestone. Updated continuously.",
};

type Entry = {
  date: string;
  tag: "feature" | "fix" | "infra" | "design";
  title: string;
  body: string;
};

const TAG_STYLES: Record<Entry["tag"], { label: string; cls: string }> = {
  feature: { label: "FEATURE",     cls: "text-[var(--accent)]  bg-[var(--accent)]/10  border-[var(--accent)]/30" },
  fix:     { label: "FIX",         cls: "text-[var(--success)] bg-[var(--success)]/10 border-[var(--success)]/30" },
  infra:   { label: "INFRA",       cls: "text-[var(--warning)] bg-[var(--warning)]/10 border-[var(--warning)]/30" },
  design:  { label: "DESIGN",      cls: "text-purple-400        bg-purple-400/10       border-purple-400/30" },
};

// Curated changelog — written for carriers, not engineers
const ENTRIES: Entry[] = [
  {
    date: "May 17, 2026",
    tag: "design",
    title: "Site redesign — sprints 1-4: from generic AI-template to trucking-native",
    body:
      "Replaced every emoji icon with a real photo. Added 16 authentic trucking/compliance photos sourced from Pexels + Unsplash. Real brand SVGs for every integration (Stripe, Anthropic, Supabase, Cloudflare, Resend, Twilio, Checkr). Built /trust transparency page. Live Ask Compass demo widget — no signup, 5 free questions per IP per 6h, every CFR citation round-tripped against eCFR. Page heroes on /pricing, /partners, /faq. Number counters on the stat band. Per-brain hover-expand with example questions. Light + dark mode with persistent toggle.",
  },
  {
    date: "May 17, 2026",
    tag: "feature",
    title: "Prompt Intelligence v1 — every customer query measured, improved weekly",
    body:
      "Every /api/ask response now logs to compass_prompt_eval with the cited CFR sections, eCFR verification status, and citation quality score. Weekly auto-report flags categories with quality < 0.9 so the system prompt can be tuned. Foundation for the open-source skills library to keep improving with every customer query.",
  },
  {
    date: "May 17, 2026",
    tag: "infra",
    title: "Fort Knox v4 — 8 production monitors, autonomous incident response",
    body:
      "Synthetic journey probes every 15 min. Cloudflare deploy-failure watcher every 10 min. Stripe webhook health every 30 min. Supabase security + performance advisor poll. Client-error spike aggregator. Doctor agent with 14 known incident patterns auto-resolves Cloudflare swaps, transient 403s, and upstream incidents without paging a human.",
  },
  {
    date: "May 17, 2026",
    tag: "feature",
    title: "Hazmat Center — 40 real DOT placards sourced from Wikimedia Commons",
    body:
      "Every Class 1-9 placard, every RAM label, every GHS pictogram, the NFPA 704 diamond. All from authoritative public-domain sources. Replaces the in-code SVG generator. Real placards, real regulations, instantly recognizable to anyone who's handled hazmat freight.",
  },
  {
    date: "May 17, 2026",
    tag: "feature",
    title: "CFR Eval Baseline — 85.0% on 60 questions across 15 categories",
    body:
      "Benchmark of vanilla Claude on 60 hand-crafted FMCSA questions. Each question round-trips against the live eCFR registry. Drives every skill-builder we ship. Public number: 51 of 60 questions correctly cited (claude-sonnet-4-6, vanilla — improvements come from skill grounding).",
  },
  {
    date: "May 16, 2026",
    tag: "feature",
    title: "Background Checks — Checkr embedded NewInvitation + ReportsOverview",
    body:
      "Driver-side: FCRA-compliant disclosure + consent flow embedded in /app/background-checks. Carrier-side: live status tracking from Checkr's webhook. Fully wired to compass_background_checks. Order, deliver, archive without leaving Compass.",
  },
  {
    date: "May 16, 2026",
    tag: "feature",
    title: "Full /app shell wired to real per-tenant Supabase data",
    body:
      "16 application pages — Drivers, Vehicles, DQ Files, D&A, Training, MVR, HOS, Inspections, Accidents, IFTA, Audit Export, Settings, etc. All reading from the customer's own Supabase rows, all RLS-isolated by carrier_id, all with CRUD wired against compass_* tables.",
  },
  {
    date: "May 16, 2026",
    tag: "feature",
    title: "Partner Program v2 — 30% commission floor, application + admin pipe",
    body:
      "DOT compliance consultants can resell Compass at their own price; we pay 30% of net revenue or a $10/driver floor (whichever is higher). Application form at /partners. Admin review dashboard at /admin/partners. Full reseller agreement reviewed through the Legal OS three-pass.",
  },
  {
    date: "May 15, 2026",
    tag: "feature",
    title: "Stripe Checkout live + 7-day free trial with no card",
    body:
      "DIY at $25/driver/mo, DFY at $50/driver/mo, Hazmat add-on at $99/mo flat. Trial requires no credit card. Stripe webhook signature verified, idempotent event handling, subscription state synced to compass_carriers.",
  },
  {
    date: "May 14, 2026",
    tag: "feature",
    title: "v1.0 of the open-source skills library — 100 published FMCSA skills on GitHub",
    body:
      "Every skill is a versioned prompt + a CFR-cited sample answer. MIT licensed. Anyone can inspect what Compass actually knows. github.com/x3fleetsafety/skills.",
  },
];

export default function ChangelogPage() {
  return (
    <SiteShell>
      <div className="bg-[var(--bg)] text-[var(--fg)]">
        {/* HERO */}
        <section className="border-b border-[var(--border)]">
          <div className="max-w-5xl mx-auto px-6 py-20">
            <div className="text-[11px] tracking-[.18em] uppercase font-bold text-[var(--accent)] mb-3">
              Built in the open
            </div>
            <h1 className="text-[44px] sm:text-[56px] md:text-[64px] font-extrabold tracking-tight leading-[1.05] mb-4">
              Changelog.{" "}
              <span className="serif-italic" style={{ color: "#22D3EE" }}>Every week.</span>
            </h1>
            <p className="text-[18px] text-[var(--fg-muted)] max-w-3xl">
              We ship continuously and we list it all. No marketing-speak. If we fixed it, broke it,
              shipped it, or learned from it — it&apos;s on this page.
            </p>
          </div>
        </section>

        {/* TIMELINE */}
        <section className="max-w-5xl mx-auto px-6 py-12">
          <ol className="relative border-l-2 border-[var(--border)] ml-3 space-y-8">
            {ENTRIES.map((e, i) => {
              const tag = TAG_STYLES[e.tag];
              return (
                <li key={i} className="ml-8 relative">
                  {/* Dot */}
                  <span className="absolute -left-[2.4rem] top-2 w-4 h-4 rounded-full border-2 border-[var(--bg)] bg-[var(--accent)]" />

                  <div className="x3-card p-6">
                    <div className="flex flex-wrap items-center gap-3 mb-3">
                      <span className={`text-[10px] font-bold tracking-wider px-2 py-0.5 rounded-full border ${tag.cls}`}>
                        {tag.label}
                      </span>
                      <span className="text-[12px] text-[var(--fg-faint)]">{e.date}</span>
                    </div>
                    <h2 className="text-[18px] font-bold text-[var(--fg)] mb-2 leading-snug">{e.title}</h2>
                    <p className="text-[14px] text-[var(--fg-muted)] leading-relaxed">{e.body}</p>
                  </div>
                </li>
              );
            })}
          </ol>

          <div className="mt-12 text-center">
            <p className="text-[13px] text-[var(--fg-faint)] mb-4">
              Want the every-commit firehose? It&apos;s public.
            </p>
            <a
              href="https://github.com/x3fleetsafety/x3compass-web/commits/main"
              target="_blank" rel="noreferrer"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-[13px] font-bold text-[var(--fg)] border border-[var(--border)] hover:border-[var(--accent)] hover:text-[var(--accent)] transition-colors"
            >
              View raw git history on GitHub →
            </a>
          </div>
        </section>

        {/* CTA */}
        <section className="border-t border-[var(--border)] bg-[var(--bg-3)] py-16">
          <div className="max-w-3xl mx-auto px-6 text-center">
            <h2 className="text-[28px] sm:text-[36px] font-extrabold text-[var(--fg)] mb-3">
              See it in action.
            </h2>
            <p className="text-[15px] text-[var(--fg-muted)] mb-6">
              7-day free trial. No card. The product you see above ships to your tenant the moment you sign up.
            </p>
            <Link
              href="/signup"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-full font-bold text-[15px] text-[var(--accent-fg)] bg-[var(--accent)] hover:bg-[var(--accent-2)]"
            >
              ★ Start free trial →
            </Link>
          </div>
        </section>
      </div>
    </SiteShell>
  );
}
