import Link from "next/link";
import SiteShell from "@/components/SiteShell";
import ROICalculator from "@/components/ROICalculator";
import type { Metadata } from "next";
import { BANDS, MONTHLY_MINIMUM, PLAN, HAZMAT, monthlyFor, effectiveRate, breakdown, usd } from "@/lib/pricing";

export const metadata: Metadata = {
  title: "Pricing",
  description:
    "Graduated per-driver pricing: $50/driver for drivers 1–50, $40 for 51–75, $30 for 76–100, $25 for 101+. $100/mo minimum. Every X3 product included — hazmat too, at no extra cost. 7-day free trial, no card.",
  openGraph: {
    title: "Pricing · X3 Compass",
    description: "Graduated per-driver pricing from $50/driver. Every X3 product included. 7-day free trial, no card.",
    type: "website",
  },
};

/** Fleet sizes we show a worked total for. */
const EXAMPLES = [10, 25, 50, 75, 100, 150];

export default function PricingPage() {
  return (
    <SiteShell>
      {/* HERO with real fleet-yard photo */}
      <section className="relative overflow-hidden border-b border-[var(--border)]">
        <div className="absolute inset-0 -z-10">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/photos/pricing-yard.jpg" alt="" aria-hidden="true" width="2400" height="1600" loading="lazy" decoding="async" className="w-full h-full object-cover opacity-25" />
          <div className="absolute inset-0 bg-gradient-to-b from-[var(--bg)]/85 via-[var(--bg)]/95 to-[var(--bg)]" />
        </div>
        <div className="max-w-6xl mx-auto px-6 pt-20 pb-10 relative">
          <div className="text-center">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--surface)] border border-[var(--border)] text-[11px] tracking-[.18em] uppercase text-[var(--accent)] font-bold mb-4">Pricing</div>
            <h1 className="text-4xl md:text-5xl font-extrabold mb-4 tracking-tight">
              One plan.{" "}
              <span style={{ background: "linear-gradient(135deg, var(--accent), var(--accent-2))", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                The more you run, the less you pay.
              </span>
            </h1>
            <p className="text-[var(--fg-muted)] text-lg max-w-2xl mx-auto">
              Every X3 product included. 7-day free trial, no credit card required. Cancel anytime.
            </p>
          </div>
        </div>
      </section>

      <div className="max-w-6xl mx-auto px-6 py-14">
        {/* ── THE PLAN + THE LADDER ─────────────────────────────── */}
        <div className="grid lg:grid-cols-5 gap-6 mb-14">
          {/* plan card */}
          <div className="lg:col-span-2 rounded-2xl p-7 border border-[var(--accent)] relative" style={{ background: "linear-gradient(180deg, var(--surface) 0%, var(--surface-3) 100%)" }}>
            <div className="text-[var(--accent)] tracking-[.18em] text-[11px] uppercase font-bold mb-2">{PLAN.name}</div>
            <div className="flex items-baseline gap-1 mb-1">
              <div className="text-5xl font-extrabold">${BANDS[0].rate}</div>
              <div className="text-[var(--fg-muted)]">/driver/mo</div>
            </div>
            <div className="text-[12px] text-[var(--fg-muted)] mb-4">
              starting rate · drops to ${BANDS[BANDS.length - 1].rate}/driver as you grow
            </div>
            <div className="text-[13px] text-[var(--fg)] font-bold mb-1">{PLAN.tagline}</div>
            <div className="text-[13px] text-[var(--fg-muted)] mb-5">{PLAN.billing} · {usd(MONTHLY_MINIMUM)}/mo minimum</div>
            <Link href="https://app.x3compass.com/signup" className="block text-center w-full py-3 rounded-lg font-extrabold text-[13px] text-[var(--bg)] mb-6" style={{ background: "linear-gradient(135deg, var(--accent), var(--accent-2))" }}>
              Start {PLAN.trialDays}-day free trial
            </Link>
            <ul className="space-y-2">
              {[
                "Every X3 product — no tier gates, no upsell",
                "AI brain across 12 compliance domains",
                "Full CFR-cited knowledge base",
                "DataQ dispute drafter",
                "Driver Qualification File generator",
                "Auto MVR pull cadence",
                "Unlimited team seats",
                "One-click audit export · your data, always",
              ].map((f, i) => (
                <li key={i} className="text-[13px] text-[var(--fg-muted)] flex items-start gap-2">
                  <span className="text-[var(--accent)] font-bold mt-0.5">✓</span><span>{f}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* the ladder + worked examples */}
          <div className="lg:col-span-3 rounded-2xl p-7 border border-[var(--border)]" style={{ background: "var(--surface-3)" }}>
            <div className="text-[var(--accent)] tracking-[.18em] text-[11px] uppercase font-bold mb-3">How it&rsquo;s calculated</div>
            <p className="text-[13px] text-[var(--fg-muted)] mb-5">
              Graduated, like tax brackets. Each rate applies only to the drivers inside that band —
              adding your 51st driver doesn&rsquo;t reprice the first 50.
            </p>

            <div className="rounded-xl border border-[var(--border)] overflow-hidden mb-6">
              <table className="w-full text-[13px]">
                <thead>
                  <tr className="text-[10px] tracking-[.14em] uppercase text-[var(--fg-muted)]" style={{ background: "var(--bg)" }}>
                    <th className="text-left font-bold px-4 py-2.5">Band</th>
                    <th className="text-right font-bold px-4 py-2.5">Rate per driver / mo</th>
                  </tr>
                </thead>
                <tbody>
                  {BANDS.map((b) => (
                    <tr key={b.label} className="border-t border-[var(--border)]">
                      <td className="px-4 py-2.5 text-[var(--fg)]">{b.label}</td>
                      <td className="px-4 py-2.5 text-right font-extrabold text-[var(--fg)] tabular-nums">${b.rate}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="text-[10px] tracking-[.14em] uppercase text-[var(--fg-muted)] font-bold mb-2">What that costs</div>
            <div className="rounded-xl border border-[var(--border)] overflow-hidden">
              <table className="w-full text-[13px]">
                <thead>
                  <tr className="text-[10px] tracking-[.14em] uppercase text-[var(--fg-muted)]" style={{ background: "var(--bg)" }}>
                    <th className="text-left font-bold px-4 py-2.5">Fleet</th>
                    <th className="text-right font-bold px-4 py-2.5">Monthly</th>
                    <th className="text-right font-bold px-4 py-2.5">Effective / driver</th>
                  </tr>
                </thead>
                <tbody>
                  {EXAMPLES.map((n) => (
                    <tr key={n} className="border-t border-[var(--border)]">
                      <td className="px-4 py-2.5 text-[var(--fg)]">{n} drivers</td>
                      <td className="px-4 py-2.5 text-right font-extrabold text-[var(--fg)] tabular-nums">{usd(monthlyFor(n))}</td>
                      <td className="px-4 py-2.5 text-right text-[var(--fg-muted)] tabular-nums">${effectiveRate(n).toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* show the work on one representative fleet */}
            <div className="mt-5 rounded-xl border border-[var(--border)] p-4" style={{ background: "var(--bg)" }}>
              <div className="text-[10px] tracking-[.14em] uppercase text-[var(--fg-muted)] font-bold mb-2">
                Worked example · 100 drivers
              </div>
              <ul className="space-y-1">
                {breakdown(100).map((r) => (
                  <li key={r.label} className="flex justify-between text-[12px] text-[var(--fg-muted)] tabular-nums">
                    <span>{r.label} · {r.drivers} × ${r.rate}</span>
                    <span>{usd(r.subtotal)}</span>
                  </li>
                ))}
                <li className="flex justify-between text-[13px] font-extrabold text-[var(--fg)] border-t border-[var(--border)] pt-1.5 mt-1.5 tabular-nums">
                  <span>Total</span><span>{usd(monthlyFor(100))}/mo</span>
                </li>
              </ul>
            </div>

            <p className="text-[11px] text-[var(--fg-muted)] mt-4">
              {usd(MONTHLY_MINIMUM)}/mo minimum applies to the smallest fleets. Running 250+ drivers or need
              multi-yard, SSO and a custom SLA? <Link href="/partners" className="text-[var(--accent)] font-bold hover:underline">Talk to us →</Link>
            </p>
          </div>
        </div>

        {/* ROI calculator · interactive widget */}
        <div className="mb-14">
          <ROICalculator />
        </div>

        <div className="rounded-2xl p-8 border border-[#FACC15] mb-14" style={{ background: "linear-gradient(180deg, var(--surface-2) 0%, var(--surface-3) 100%)" }}>
          <div className="md:flex md:items-center md:justify-between gap-6">
            <div className="md:flex-1 mb-4 md:mb-0">
              <div className="text-amber-700 dark:text-[#FACC15] tracking-[.18em] text-[11px] uppercase font-bold mb-2">Included</div>
              <h3 className="text-2xl font-extrabold mb-2">{HAZMAT.name} · included</h3>
              <p className="text-[var(--fg-muted)] text-[14px] max-w-xl">No add-on, no upcharge. If you haul placardable hazmat it is already in your plan — 100+ skills covering 49 CFR Parts 100-180.</p>
              <ul className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-1 mt-4">
                {HAZMAT.features.map((f, i) => (
                  <li key={i} className="text-[12px] text-[var(--fg-muted)] flex items-start gap-2">
                    <span className="text-amber-700 dark:text-[#FACC15] mt-0.5">▲</span><span>{f}</span>
                  </li>
                ))}
              </ul>
            </div>
            <Link href="/hazmat" className="inline-block px-5 py-3 rounded-lg font-extrabold text-[13px] text-[var(--bg)]" style={{ background: "linear-gradient(135deg, #FACC15, #F59E0B)" }}>Tour the Hazmat Center →</Link>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6 mb-14">
          {([
            ["Is the trial really free?", "Yes · 7 days, no card required. We don't auto-charge."],
            ["What does “graduated” mean?", `Each band applies only to the drivers in it. At 100 drivers you pay ${usd(monthlyFor(100))} — 50×$50 plus 25×$40 plus 25×$30 — not 100×$30.`],
            ["Do I lose features at the lower rates?", "No. Every X3 product is included at every fleet size. The rate drops as you grow; the product doesn't change."],
            ["Does the price include FMCSA filings?", "USDOT/MC filing fees are paid directly to FMCSA."],
            ["Can I cancel anytime?", "Yes. Self-serve from your billing portal. You keep every export."],
            ["250+ drivers?", "Let's talk — multi-yard, SSO, custom SLA."],
          ] as Array<[string, string]>).map(([q, a], i) => (
            <div key={i} className="rounded-xl p-5 bg-[var(--surface-3)] border border-[var(--border)]">
              <div className="font-extrabold text-[var(--fg)] mb-1.5">{q}</div>
              <div className="text-[13px] text-[var(--fg-muted)]">{a}</div>
            </div>
          ))}
        </div>

        <div className="text-center">
          <Link href="https://app.x3compass.com/signup" className="inline-block px-6 py-3 rounded-lg font-extrabold text-[14px] text-[var(--bg)]" style={{ background: "linear-gradient(135deg, var(--accent), var(--accent-2))", boxShadow: "0 12px 28px rgba(2, 6, 12, 0.45)" }}>Start your free trial →</Link>
        </div>
      </div>
    </SiteShell>
  );
}
