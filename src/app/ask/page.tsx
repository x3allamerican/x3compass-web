import AskCompassDemo from "@/components/AskCompassDemo";
import SiteShell from "@/components/SiteShell";
import Link from "next/link";

export const metadata = {
  title: "Ask Compass — public demo",
  description: "Ask the X3 Compass AI brain a real FMCSA compliance question and get an answer with the exact CFR section cited. No login. No credit card. Rate-limited to 5 questions per IP per 6 hours.",
};

export default function PublicAskPage() {
  return (
    <SiteShell>
      <div className="bg-[var(--bg)] text-[var(--fg)] min-h-screen">
        <section className="border-b border-[var(--border)]">
          <div className="max-w-4xl mx-auto px-6 py-14">
            <div className="text-[11px] tracking-[.18em] uppercase font-bold text-[var(--accent)] mb-3">
              Public demo · No signup · Live AI brain
            </div>
            <h1 className="text-[40px] sm:text-[52px] font-extrabold tracking-tight leading-[1.05] mb-4">
              Ask Compass.{" "}
              <span className="serif-italic" style={{ color: "var(--accent)" }}>Real answer. Real citation.</span>
            </h1>
            <p className="text-[16px] text-[var(--fg-muted)] max-w-2xl">
              Every answer cites the exact CFR section. We round-trip the citation against eCFR.gov before showing
              you the response — if the verification fails, we tell you. Rate-limited to 5 questions per IP per 6 hours.
              For unlimited, <Link href="/signup" className="text-[var(--accent)] font-bold hover:underline">start a 7-day trial</Link>.
            </p>
          </div>
        </section>

        <section className="max-w-4xl mx-auto px-6 py-10">
          <AskCompassDemo />
        </section>

        <section className="max-w-4xl mx-auto px-6 pb-16">
          <div className="x3-card p-6">
            <div className="text-[10px] tracking-[.18em] uppercase font-bold text-[var(--fg-muted)] mb-3">What you can ask</div>
            <div className="grid sm:grid-cols-2 gap-3 text-[14px] text-[var(--fg-muted)]">
              <div>• What's required for pre-employment drug testing under § 382.301?</div>
              <div>• When does a CDL get federally disqualified for life?</div>
              <div>• What's the difference between a Level 1 and Level 2 roadside inspection?</div>
              <div>• How do I file a DataQ challenge for a non-preventable accident?</div>
              <div>• What goes in a Driver Qualification File under § 391.51?</div>
              <div>• What placards do I need for a UN1993 Class 3 PG II shipment?</div>
            </div>
          </div>
        </section>
      </div>
    </SiteShell>
  );
}
