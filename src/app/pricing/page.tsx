import Link from "next/link";
import SiteShell from "@/components/SiteShell";
import ROICalculator from "@/components/ROICalculator";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Pricing",
  description: "$25/driver/mo DIY, $50/driver/mo DFY, $99/mo Hazmat add-on. 7-day free trial. No credit card required.",
  openGraph: { title: "Pricing · X3 Compass", description: "$25/driver DIY, $50/driver DFY, $99/mo Hazmat. 7-day free trial. No card.", type: "website" },
};

const PLANS = [
  { name: "DIY", price: 25, blurb: "AI Safety Director + 300+ FMCSA skills · you operate it.", features: ["AI brain across 12 compliance domains","300+ CFR-cited skills","DataQ dispute drafter","Placard wizard + 100 hazmat skills (with add-on)","Driver Qualification File generator","Auto MVR pull cadence","Email support"], cta: { label: "Start 7-day free trial", href: "/signup?plan=diy" } },
  { name: "DFY", price: 50, blurb: "Done-for-you. We operate Compass on your account.", features: ["Everything in DIY","Dedicated safety advisor","Monthly compliance review call","FMCSA audit prep included","We file MVRs, drug tests, Clearinghouse","Priority slack + phone support","Same-day DataQ dispute filing"], featured: true, cta: { label: "Start 7-day free trial", href: "/signup?plan=dfy" } },
  { name: "Enterprise", price: null, blurb: "100+ trucks, multi-yard, integrations, custom SLAs.", features: ["Everything in DFY","Multi-tenant org structure","SSO + SCIM","Custom integrations","Dedicated CSM + named legal counsel","Custom data residency","MSA + signed BAA"], cta: { label: "Talk to us", href: "/partners" } },
];

const HAZMAT_FEATURES = ["100+ hazmat-specific skills (Parts 100-180)","Interactive placard wizard with live preview","Shipping paper template builder","Emergency response info (ERG) lookups","Hazardous waste manifest mode","PHMSA registration cross-reference"];

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
          <h1 className="text-4xl md:text-5xl font-extrabold mb-4 tracking-tight">Simple, transparent <span style={{ background: "linear-gradient(135deg, var(--accent), var(--accent-2))", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>per-driver</span> pricing</h1>
            <p className="text-[var(--fg-muted)] text-lg max-w-2xl mx-auto">7-day free trial. No credit card required. Cancel anytime.</p>
          </div>
        </div>
      </section>

      <div className="max-w-6xl mx-auto px-6 py-14">
        <div className="grid md:grid-cols-3 gap-6 mb-14">
          {PLANS.map((p) => (
            <div key={p.name} className={`rounded-2xl p-7 border ${p.featured ? "border-[var(--accent)]" : "border-[var(--border)]"} relative`} style={{ background: p.featured ? "linear-gradient(180deg, var(--surface) 0%, var(--surface-3) 100%)" : "var(--surface-3)" }}>
              {p.featured && <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full text-[10px] tracking-[.18em] uppercase font-extrabold text-[var(--bg)]" style={{ background: "linear-gradient(135deg, var(--accent), var(--accent-2))" }}>Most popular</div>}
              <div className="text-[var(--accent)] tracking-[.18em] text-[11px] uppercase font-bold mb-2">{p.name}</div>
              <div className="flex items-baseline gap-1 mb-2">
                {p.price === null ? <div className="text-3xl font-extrabold">Custom</div> : <><div className="text-5xl font-extrabold">${p.price}</div><div className="text-[var(--fg-muted)]">/driver/mo</div></>}
              </div>
              <div className="text-[13px] text-[var(--fg-muted)] mb-5">{p.blurb}</div>
              <Link href={p.cta.href} className={`block text-center w-full py-3 rounded-lg font-extrabold text-[13px] mb-6 ${p.featured ? "text-[var(--bg)]" : "text-[var(--fg)]"}`} style={p.featured ? { background: "linear-gradient(135deg, var(--accent), var(--accent-2))" } : { background: "var(--bg)", border: "1px solid var(--border)" }}>{p.cta.label}</Link>
              <ul className="space-y-2">{p.features.map((f, i) => (<li key={i} className="text-[13px] text-[var(--fg-muted)] flex items-start gap-2"><span className="text-[var(--accent)] font-bold mt-0.5">✓</span><span>{f}</span></li>))}</ul>
            </div>
          ))}
        </div>
        {/* ROI calculator · interactive widget */}
        <div className="mb-14">
          <ROICalculator />
        </div>

        <div className="rounded-2xl p-8 border border-[#FACC15] mb-14" style={{ background: "linear-gradient(180deg, var(--surface-2) 0%, var(--surface-3) 100%)" }}>
          <div className="md:flex md:items-center md:justify-between gap-6">
            <div className="md:flex-1 mb-4 md:mb-0">
              <div className="text-amber-700 dark:text-[#FACC15] tracking-[.18em] text-[11px] uppercase font-bold mb-2">Add-on</div>
              <h3 className="text-2xl font-extrabold mb-2">Hazmat Center · +$99/mo flat</h3>
              <p className="text-[var(--fg-muted)] text-[14px] max-w-xl">Stack on any plan when you transport placardable hazmat. 100+ skills covering 49 CFR Parts 100-180.</p>
              <ul className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-1 mt-4">{HAZMAT_FEATURES.map((f, i) => (<li key={i} className="text-[12px] text-[var(--fg-muted)] flex items-start gap-2"><span className="text-amber-700 dark:text-[#FACC15] mt-0.5">▲</span><span>{f}</span></li>))}</ul>
            </div>
            <Link href="/hazmat" className="inline-block px-5 py-3 rounded-lg font-extrabold text-[13px] text-[var(--bg)]" style={{ background: "linear-gradient(135deg, #FACC15, #F59E0B)" }}>Tour the Hazmat Center →</Link>
          </div>
        </div>
        <div className="grid md:grid-cols-2 gap-6 mb-14">
          {[["Is the trial really free?","Yes · 7 days, no card required. We don't auto-charge."],["Can I bring my own drug consortium, ELD, MVR vendor?","Yes on DIY; DFY bundles a Compass-managed consortium."],["Does the price include FMCSA filings?","USDOT/MC filing fees are paid directly to FMCSA."],["Can I cancel anytime?","Yes. Self-serve from your billing portal."],["Annual billing discount?","10% off annual. Reach out for the link."],["500 drivers?","Enterprise · let's talk."]].map(([q,a], i) => (
            <div key={i} className="rounded-xl p-5 bg-[var(--surface-3)] border border-[var(--border)]"><div className="font-extrabold text-[var(--fg)] mb-1.5">{q}</div><div className="text-[13px] text-[var(--fg-muted)]">{a}</div></div>
          ))}
        </div>
        <div className="text-center">
          <Link href="/signup" className="inline-block px-6 py-3 rounded-lg font-extrabold text-[14px] text-[var(--bg)]" style={{ background: "linear-gradient(135deg, var(--accent), var(--accent-2))", boxShadow: "0 12px 28px rgba(2, 6, 12, 0.45)" }}>Start your free trial →</Link>
        </div>
      </div>
    </SiteShell>
  );
}
