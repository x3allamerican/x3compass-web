import Link from "next/link";

/**
 * Founder card — a pre-revenue B2B SaaS without customer logos benefits
 * from putting the founder's face (or credentials) on the page. This card
 * humanizes the product + ties it to a real person with DOT compliance
 * background.
 *
 * Drops into any marketing page section.
 */
export default function FounderCard() {
  return (
    <section aria-labelledby="founder-name" className="x3-card p-6 my-12 max-w-3xl mx-auto">
      <div className="flex items-start gap-5 flex-wrap">
        <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[var(--accent)] to-[var(--accent-2)] grid place-items-center font-black text-[var(--bg)] text-[28px] shrink-0">
          JK
        </div>
        <div className="flex-1 min-w-[200px]">
          <div className="text-[10px] tracking-[.18em] uppercase font-extrabold text-[var(--accent)] mb-1">Founder</div>
          <h2 id="founder-name" className="text-[20px] font-extrabold text-[var(--fg)] mb-2">Joshua Kovarik</h2>
          <p className="text-[14px] text-[var(--fg-muted)] leading-relaxed mb-3">
            DOT-compliance operator turned software founder. Built X3 Fleet Safety servicing dozens
            of small carriers, then realized the same AI brain could scale to thousands. X3 Compass
            is that brain — productized, CFR-cited, and priced so a 5-truck owner-operator can
            afford the same compliance posture as a 500-truck enterprise.
          </p>
          <div className="flex gap-3 text-[12px] font-bold">
            <Link href="/trust" className="text-[var(--accent)] hover:underline">Read the trust page →</Link>
            <a href="mailto:joshua@x3compass.com" className="text-[var(--accent)] hover:underline">joshua@x3compass.com</a>
          </div>
        </div>
      </div>
    </section>
  );
}
