"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";

type Brain = {
  example: string;
  photo: string;        // /photos/{slug}.jpg
  title: string;
  cfr: string;
  desc: string;
  href: string;
  shortLabel: string;
};

const BRAINS: Brain[] = [
  { photo: "/photos/brain-dq-files.jpg",       title: "DQ Files Brain", example: "Try: 'What's required in a § 391.21 application?'", cfr: "49 CFR § 391.51",         desc: "All 12 driver-qualification documents per driver — application, MVR, med cert, road test, ELDT, Clearinghouse query. Missing slots glow red.", href: "/app/dq-files",     shortLabel: "DQ Files" },
  { photo: "/photos/brain-drug-alcohol.jpg",   title: "Drug & Alcohol Brain", example: "Try: 'Random rate for 2026 — what % must I hit?'", cfr: "49 CFR Part 382",         desc: "Pre-employment, random, post-accident, RTD. Random-rate progress bars vs § 382.305. Clearinghouse queries on the calendar.",                  href: "/app/drug-alcohol", shortLabel: "Drug & Alcohol" },
  { photo: "/photos/brain-mvr.jpg",            title: "MVR Brain", example: "Try: 'Annual MVR review — what state-by-state for a multi-state driver?'", cfr: "49 CFR § 391.25",         desc: "Annual MVR review log per driver, per state. Overdue drivers surface automatically. Continuous-monitoring upgrade in one click.",            href: "/app/mvr",          shortLabel: "MVR" },
  { photo: "/photos/brain-training.jpg",       title: "Training Brain", example: "Try: 'Is ELDT BTW required for an existing CDL driver?'", cfr: "49 CFR Part 380",         desc: "ELDT theory + BTW with TPR registry flag, supervisor D&A, defensive driving, pre-trip, cargo, hazmat. Expiry tracking on every course.",   href: "/app/training",     shortLabel: "Training" },
  { photo: "/photos/brain-vehicles.jpg",       title: "Vehicles & PM Brain", example: "Try: 'Annual DOT inspection rules under § 396.17'", cfr: "49 CFR § 396.3 / 396.17", desc: "Power-unit inventory, annual DOT inspection tracker, PM schedule. VIN, plate, GVWR, OOS flags — and a 396 PM template generator on demand.", href: "/app/vehicles",     shortLabel: "Vehicles" },
  { photo: "/photos/brain-incidents.jpg",      title: "Incidents Brain", example: "Try: 'Post-accident D&A — who triggers § 382.303?'", cfr: "49 CFR § 390.15",         desc: "DOT-recordable crash register with 3-year retention. Severity, preventability, post-accident test triggers. Audit-ready by export.",        href: "/app/accidents",    shortLabel: "Accidents" },
  { photo: "/photos/brain-inspections.jpg",    title: "Inspections Brain", example: "Try: 'Level I vs Level II — what's the difference?'", cfr: "49 CFR § 396.9",          desc: "Roadside inspections + internal DVIRs. Level I–VI tracked. Clean-inspection rate surfaced live with DataQ dispute suggestions.",            href: "/app/inspections",  shortLabel: "Inspections" },
  { photo: "/photos/brain-csa.jpg",            title: "CSA · DataQ Brain", example: "Try: 'How do I dispute a CSA violation via DataQ?'", cfr: "49 CFR Part 385",         desc: "Live SMS percentile by BASIC. DataQ dispute drafter for contestable violations. 21 win-pattern templates. Avg win: $300.",                   href: "/app/inspections",  shortLabel: "CSA / DataQ" },
  { photo: "/photos/brain-hazmat.jpg",         title: "Hazmat Brain", example: "Try: '4,000 lbs of UN1203 — do I need a placard?'", cfr: "49 CFR Part 172",         desc: "Placarding wizard, segregation tables, TSA H-endorsement clock, shipping-paper validator. 100 hazmat-only skills.",                         href: "/hazmat",           shortLabel: "Hazmat Center" },
  { photo: "/photos/brain-ask-compass.jpg",    title: "Legal · Litigation", example: "Try: 'Subpoena response checklist for an FMCSA inquiry'", cfr: "FMCSR + Tort",            desc: "Subpoena response checklist, litigation-hold protocol, retention map, adverse-action letter with FCRA-compliant timing.",                   href: "/app/ask?skill=litigation-hold-protocol", shortLabel: "Legal" },
  { photo: "/photos/brain-ifta.jpg",           title: "Finance · IFTA Brain", example: "Try: 'Q2 IFTA filing — what's the deadline?'", cfr: "IFTA · § 367 UCR",        desc: "Cost-per-mile modeling, IFTA quarterly filing, UCR registration windows, fuel-tax reconciliation across all jurisdictions.",                href: "/app/ifta",         shortLabel: "IFTA" },
  { photo: "/photos/brain-daily-digest.jpg",   title: "Daily Digest Brain", example: "Try: 'Set my daily digest for 6am Pacific'", cfr: "Branded email",           desc: "7am every morning: expiring DQ docs, CDLs, med certs, PM-due vehicles. Never start the day wondering what's about to blow up.",              href: "/app/settings",     shortLabel: "Digest settings" },
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

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {BRAINS.map((b, i) => {
        const isLink = hydrated && loggedIn;

        const inner = (
          <>
            {/* Photo with cyan accent overlay */}
            <div className="relative aspect-[16/10] overflow-hidden">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={b.photo}
                alt={b.title}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                loading={i < 3 ? "eager" : "lazy"}
              />
              {/* Bottom-up gradient for legibility */}
              <div className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-[var(--surface)] via-[var(--surface)]/80 to-transparent" />
              {/* CFR badge over photo */}
              <div className="absolute top-3 left-3 text-[10px] font-bold tracking-wider text-[var(--accent)] bg-[var(--bg)]/85 backdrop-blur-sm border border-[var(--accent)]/40 px-2 py-1 rounded-full font-mono">
                {b.cfr}
              </div>
            </div>
            <div className="px-6 pb-6 pt-4 -mt-1">
              <h3 className="text-[18px] font-bold text-[var(--fg)] mb-2">{b.title}</h3>
              <p className="text-[14px] text-[var(--fg-muted)] leading-relaxed">{b.desc}</p>
              {b.example && (
                <div className="mt-4 text-[12px] italic text-[var(--accent)] opacity-0 max-h-0 group-hover:opacity-100 group-hover:max-h-12 transition-all duration-300 overflow-hidden">
                  {b.example}
                </div>
              )}
              {isLink && (
                <div className="mt-2 text-[13px] font-bold text-[var(--accent)]">
                  Open {b.shortLabel} →
                </div>
              )}
            </div>
          </>
        );

        const cls = "x3-card x3-card-hover group block overflow-hidden p-0";
        return isLink ? (
          <Link key={i} href={b.href} className={cls}>{inner}</Link>
        ) : (
          <div key={i} className={`${cls} cursor-default`}>{inner}</div>
        );
      })}
    </div>
  );
}
