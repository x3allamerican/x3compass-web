import Image from "next/image";

/**
 * FounderNote — earnest, no fake testimonial.
 * Joshua's name + signature (typed) + the real "why" + the verifiable fact
 * that he runs an MC-authorized for-hire carrier.
 */
export default function FounderNote() {
  return (
    <section className="border-y border-[var(--border)] bg-[var(--bg-3)]">
      <div className="max-w-5xl mx-auto px-6 py-16 grid md:grid-cols-[1fr_1.4fr] gap-10 items-center">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/photos/founder-route-map.jpg" alt="Highway route planning"
             className="w-full h-64 md:h-80 object-cover rounded-2xl border border-[var(--border)]" />
        <div>
          <div className="text-[10px] tracking-[.18em] uppercase font-bold text-[var(--accent)] mb-3">
            A note from the founder
          </div>
          <p className="text-[18px] text-[var(--fg)] leading-relaxed mb-4">
            I built Compass because I run a carrier and the compliance work was eating my weekends.
            DQ files, MVRs, drug testing windows, Clearinghouse queries — every one of them a 49 CFR
            citation I had to keep in my head. The fancy fleet platforms wanted a $50k/yr enterprise
            check and still didn't tell me what to do next.
          </p>
          <p className="text-[15px] text-[var(--fg-muted)] leading-relaxed mb-5">
            So we built one. Every answer cites the CFR. Every skill is open-source on GitHub so you can
            inspect what your money is buying. And the platform we use ourselves is the same one we sell.
            If it can't keep my carrier audit-ready, I won't ship it to yours.
          </p>
          <div className="font-mono italic text-[18px] text-[var(--accent)]">— Joshua Kovarik</div>
          <div className="text-[12px] text-[var(--fg-faint)] mt-1">
            Founder · X3 Fleet Safety LLC · MC-authorized for-hire carrier
          </div>
        </div>
      </div>
    </section>
  );
}
