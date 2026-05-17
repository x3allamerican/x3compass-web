"use client";
import Link from "next/link";
import AppShell from "@/components/AppShell";

export default function DaConciergePage() {
  return (
    <AppShell crumbs="D&A CONCIERGE" title="Drug & Alcohol Concierge">
      <div className="p-6 max-w-3xl space-y-6">
        <div className="rounded-2xl border border-[var(--accent)]/50 p-6" style={{ background: "linear-gradient(180deg, var(--surface), var(--surface-3))" }}>
          <div className="text-[10px] tracking-[.16em] uppercase text-[var(--accent)] font-extrabold mb-2">DFY service · included on $50/driver tier</div>
          <h2 className="text-2xl font-extrabold mb-3">We run your Drug & Alcohol program for you.</h2>
          <p className="text-[var(--fg-muted)] mb-4 leading-relaxed">
            Pre-employment, random pool selection (truly random, audit-ready), post-accident, reasonable-suspicion, return-to-duty, and follow-up tests. We coordinate the collection sites, manage the MRO chain, file every result in the FMCSA Clearinghouse, and pull annual queries on your behalf — fully compliant with 49 CFR Parts 40 & 382.
          </p>
          <div className="grid grid-cols-2 gap-3 mb-4">
            <Bullet>50-state collection-site network</Bullet>
            <Bullet>Random-pool quarterly selection</Bullet>
            <Bullet>MRO review on every test</Bullet>
            <Bullet>Auto Clearinghouse query + report</Bullet>
            <Bullet>Refusal & shy-bladder protocol</Bullet>
            <Bullet>SAP referral on positive results</Bullet>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link href="/app/drug-alcohol" className="px-5 py-2.5 rounded-lg font-extrabold text-[13px] text-[var(--bg)]" style={{ background: "linear-gradient(135deg, var(--accent), var(--accent-2))" }}>View test history →</Link>
            <a href="mailto:joshua@x3compass.com?subject=Enroll%20in%20D%26A%20Concierge" className="px-5 py-2.5 rounded-lg font-bold text-[13px] text-[var(--fg)] border border-[var(--border)] hover:border-[var(--accent)]">Email to enroll</a>
          </div>
        </div>
        <p className="text-[12px] text-[var(--fg-muted)]">On the DIY plan? You can self-manage from the <Link href="/app/drug-alcohol" className="text-[var(--accent)] underline">Drug & Alcohol</Link> tracker. Upgrade to DFY anytime from <Link href="/app/settings/billing" className="text-[var(--accent)] underline">Billing</Link>.</p>
      </div>
    </AppShell>
  );
}

function Bullet({ children }: { children: React.ReactNode }) {
  return <div className="flex items-start gap-2 text-[13px] text-[var(--fg-muted)]"><span className="text-[var(--accent)] mt-0.5">✓</span><span>{children}</span></div>;
}
