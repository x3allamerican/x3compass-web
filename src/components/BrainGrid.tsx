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
  { icon: "📁", title: "DQ Files Brain",        cfr: "49 CFR § 391.51",        desc: "All 12 driver-qualification documents per driver — application, MVR, med cert, road test, ELDT, Clearinghouse query. Missing slots glow red.",                                  href: "/app/dq-files",     shortLabel: "DQ Files" },
  { icon: "🧪", title: "Drug & Alcohol Brain",  cfr: "49 CFR Part 382",        desc: "Pre-employment, random, post-accident, RTD. Random-rate progress bars vs § 382.305. Clearinghouse queries on the calendar.",                                                    href: "/app/drug-alcohol", shortLabel: "Drug & Alcohol" },
  { icon: "🪪", title: "MVR Brain",             cfr: "49 CFR § 391.25",        desc: "Annual MVR review log per driver, per state. Overdue drivers surface automatically. Continuous-monitoring upgrade in one click.",                                              href: "/app/mvr",          shortLabel: "MVR" },
  { icon: "🎓", title: "Training Brain",        cfr: "49 CFR Part 380",        desc: "ELDT theory + BTW with TPR registry flag, supervisor D&A, defensive driving, pre-trip, cargo, hazmat. Expiry tracking on every course.",                                       href: "/app/training",     shortLabel: "Training" },
  { icon: "🚛", title: "Vehicles & PM Brain",   cfr: "49 CFR § 396.3 / 396.17", desc: "Power-unit inventory, annual DOT inspection tracker, PM schedule. VIN, plate, GVWR, OOS flags — and a 396 PM template generator on demand.",                                  href: "/app/vehicles",     shortLabel: "Vehicles" },
  { icon: "🚨", title: "Incidents Brain",       cfr: "49 CFR § 390.15",        desc: "DOT-recordable crash register with 3-year retention. Severity, preventability, post-accident test triggers. Audit-ready by export.",                                         href: "/app/accidents",    shortLabel: "Accidents" },
  { icon: "🔎", title: "Inspections Brain",     cfr: "49 CFR § 396.9",         desc: "Roadside inspections + internal DVIRs. Level I–VI tracked. Clean-inspection rate surfaced live with DataQ dispute suggestions.",                                              href: "/app/inspections",  shortLabel: "Inspections" },
  { icon: "📊", title: "CSA · DataQ Brain",     cfr: "49 CFR Part 385",        desc: "Live SMS percentile by BASIC. DataQ dispute drafter for contestable violations. 21 win-pattern templates. Avg win: $300.",                                                    href: "/app/inspections",  shortLabel: "CSA / DataQ" },
  { icon: "⚠️", title: "Hazmat Brain",          cfr: "49 CFR Part 172",        desc: "Placarding wizard, segregation tables, TSA H-endorsement clock, shipping-paper validator. 100 hazmat-only skills.",                                                           href: "/hazmat",           shortLabel: "Hazmat Center" },
  { icon: "⚖️", title: "Legal · Litigation",    cfr: "FMCSR + Tort",           desc: "Subpoena response checklist, litigation-hold protocol, retention map, adverse-action letter with FCRA-compliant timing.",                                                    href: "/app/ask?skill=litigation-hold-protocol", shortLabel: "Legal" },
  { icon: "💰", title: "Finance · IFTA Brain",  cfr: "IFTA · § 367 UCR",       desc: "Cost-per-mile modeling, IFTA quarterly filing, UCR registration windows, fuel-tax reconciliation across all jurisdictions.",                                                  href: "/app/ifta",         shortLabel: "IFTA" },
  { icon: "📧", title: "Daily Digest Brain",    cfr: "Branded email",          desc: "7am every morning: expiring DQ docs, CDLs, med certs, PM-due vehicles. Never start the day wondering what's about to blow up.",                                              href: "/app/settings",     shortLabel: "Digest settings" },
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

  const cardBase =
    "bg-[#15233D] border border-[#1E3556] rounded-2xl p-6 transition-colors block";
  const cardInteractive = "hover:border-[#22D3EE]/40";
  const cardStatic = "cursor-default";

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
      {BRAINS.map((b, i) => {
        // Before hydration / when logged out: render a non-link <div> so the card doesn't navigate
        const isLink = hydrated && loggedIn;

        const inner = (
          <>
            <div className="text-[28px] mb-3">{b.icon}</div>
            <h3 className="text-[18px] font-bold text-white mb-2">{b.title}</h3>
            <div className="inline-block text-[11px] font-bold tracking-wider text-[#22D3EE] bg-[#22D3EE]/10 border border-[#22D3EE]/25 px-2 py-1 rounded-full font-mono mb-3">
              {b.cfr}
            </div>
            <p className="text-[14px] text-white/65 leading-relaxed">{b.desc}</p>
            {isLink && (
              <div className="mt-4 text-[13px] font-bold text-[#22D3EE]">
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
