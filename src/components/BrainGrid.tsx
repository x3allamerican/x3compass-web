"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type Brain = {
  icon: string;
  title: string;
  cfr: string;
  desc: string;
  href: string;
  shortLabel: string; // for the "Open ___ →" link
};

const BRAINS: Brain[] = [
  { icon: "📁", title: "DQ Files Brain",        cfr: "49 CFR § 391.51",        desc: "All 12 driver-qualification documents per driver · application, MVR, med cert, road test, ELDT, Clearinghouse query. Missing slots glow red.",                                  href: "/dq-files",     shortLabel: "DQ Files" },
  { icon: "🧪", title: "Drug & Alcohol Brain",  cfr: "49 CFR Part 382",        desc: "Pre-employment, random, post-accident, RTD. Random-rate progress bars vs § 382.305. Clearinghouse queries on the calendar.",                                                    href: "/drug-alcohol", shortLabel: "Drug & Alcohol" },
  { icon: "🪪", title: "MVR Brain",             cfr: "49 CFR § 391.25",        desc: "Annual MVR review log per driver, per state. Overdue drivers surface automatically. Continuous-monitoring upgrade in one click.",                                              href: "/mvr",          shortLabel: "MVR" },
  { icon: "🎓", title: "Training Brain",        cfr: "49 CFR Part 380",        desc: "ELDT theory + BTW with TPR registry flag, supervisor D&A, defensive driving, pre-trip, cargo, hazmat. Expiry tracking on every course.",                                       href: "/training",     shortLabel: "Training" },
  { icon: "🚛", title: "Vehicles & PM Brain",   cfr: "49 CFR § 396.3 / 396.17", desc: "Power-unit inventory, annual DOT inspection tracker, PM schedule. VIN, plate, GVWR, OOS flags · and a 396 PM template generator on demand.",                                  href: "/vehicles",     shortLabel: "Vehicles" },
  { icon: "🚨", title: "Incidents Brain",       cfr: "49 CFR § 390.15",        desc: "DOT-recordable crash register with 3-year retention. Severity, preventability, post-accident test triggers. Audit-ready by export.",                                         href: "/accidents",    shortLabel: "Accidents" },
  { icon: "🔎", title: "Inspections Brain",     cfr: "49 CFR § 396.9",         desc: "Roadside inspections + internal DVIRs. Level I–VI tracked. Clean-inspection rate surfaced live with DataQ dispute suggestions.",                                              href: "/inspections",  shortLabel: "Inspections" },
  { icon: "📊", title: "CSA · DataQ Brain",     cfr: "49 CFR Part 385",        desc: "Live SMS percentile by BASIC. DataQ dispute drafter for contestable violations. 21 win-pattern templates. Avg win: $300.",                                                    href: "/inspections",  shortLabel: "CSA / DataQ" },
  { icon: "⚠️", title: "Hazmat Brain",          cfr: "49 CFR Part 172",        desc: "Placarding wizard, segregation tables, TSA H-endorsement clock, shipping-paper validator. 100 hazmat-only skills.",                                                           href: "/hazmat",           shortLabel: "Hazmat Center" },
  { icon: "⚖️", title: "Legal · Litigation",    cfr: "FMCSR + Tort",           desc: "Subpoena response checklist, litigation-hold protocol, retention map, adverse-action letter with FCRA-compliant timing.",                                                    href: "/ask?skill=litigation-hold-protocol", shortLabel: "Legal" },
  { icon: "💰", title: "Finance · IFTA Brain",  cfr: "IFTA · § 367 UCR",       desc: "Cost-per-mile modeling, IFTA quarterly filing, UCR registration windows, fuel-tax reconciliation across all jurisdictions.",                                                  href: "/ifta",         shortLabel: "IFTA" },
  { icon: "📧", title: "Daily Digest Brain",    cfr: "Branded email",          desc: "7am every morning: expiring DQ docs, CDLs, med certs, PM-due vehicles. Never start the day wondering what's about to blow up.",                                              href: "/settings",     shortLabel: "Digest settings" },
];

export default function BrainGrid() {
  const [loggedIn, setLoggedIn] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setLoggedIn(localStorage.getItem("x3-session") === "true");
      setHydrated(true);
    }
  }, []);

  // 100waystosay-style: gradient stripe across the top edge of each card.
  // Each brain gets its own gradient direction/intensity by index for variety.
  const cardBase =
    "relative bg-black border border-[#1E3556] rounded-2xl p-6 pt-7 transition-all block overflow-hidden";
  const cardInteractive = "hover:border-[#16C7FF]/50 hover:shadow-[0_0_28px_rgba(22,199,255,0.25)] hover:-translate-y-0.5";
  const cardStatic = "cursor-default";

  // Six gradient variants — cycled across the 12 brains for color rotation.
  // All stay within the brand cyan family but vary direction + accent stop.
  const STRIPES = [
    "linear-gradient(90deg, #16C7FF 0%, #16C7FF 50%, #16C7FF 100%)",
    "linear-gradient(90deg, #16C7FF 0%, #16C7FF 50%, #5EE5FF 100%)",
    "linear-gradient(90deg, #5EE5FF 0%, #16C7FF 50%, #16C7FF 100%)",
    "linear-gradient(90deg, #16C7FF 0%, #5EE5FF 50%, #16C7FF 100%)",
    "linear-gradient(90deg, #16C7FF 0%, #5EE5FF 50%, #16C7FF 100%)",
    "linear-gradient(90deg, #5EE5FF 0%, #16C7FF 50%, #16C7FF 100%)",
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
      {BRAINS.map((b, i) => {
        // Before hydration / when logged out: render a non-link <div> so the card doesn't navigate
        const isLink = hydrated && loggedIn;

        const stripe = STRIPES[i % STRIPES.length];

        const inner = (
          <>
            {/* Top gradient stripe · 100waystosay-style accent */}
            <span
              aria-hidden="true"
              className="absolute left-0 right-0 top-0 h-[3px]"
              style={{ background: stripe }}
            />
            <div className="text-[28px] mb-3">{b.icon}</div>
            <h3 className="text-[18px] font-bold text-white mb-2">{b.title}</h3>
            <div className="inline-block text-[11px] font-bold tracking-wider text-[#16C7FF] bg-[#16C7FF]/10 border border-[#16C7FF]/25 px-2 py-1 rounded-full font-mono mb-3">
              {b.cfr}
            </div>
            <p className="text-[14px] text-white/65 leading-relaxed">{b.desc}</p>
            {isLink && (
              <div className="mt-4 text-[13px] font-bold text-[#16C7FF]">
                Open {b.shortLabel} →
              </div>
            )}
          </>
        );

        return isLink ? (
          <Link key={i} href={b.href} className={`${cardBase} ${cardInteractive}`}>
            {inner}
          </Link>
        ) : (
          <div key={i} className={`${cardBase} ${cardStatic}`}>
            {inner}
          </div>
        );
      })}
    </div>
  );
}
