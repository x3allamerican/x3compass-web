"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

export type Skill = {
  cat: string;
  cfr: string;
  name: string;
  q: string;
  /** Short, realistic Compass-style answer with CFR citations */
  a: string;
};

const SKILLS: Skill[] = [
  { cat: "dqf", cfr: "§ 391.51", name: "Driver Qualification File", q: "What's missing from this DQF?",
    a: "Per **49 CFR § 391.51(b)**, you need 12 documents in every DQF. Most fleets miss these 3:\n\n1. The **annual driver's certificate of violations** under § 391.27 — required even if zero violations.\n2. **Previous-employer safety performance history** under § 391.23(d) — must show you sent the request, got a response, OR documented 30-day non-response.\n3. **Medical examiner verification** — the examiner's National Registry number on file (§ 391.51(b)(7)).\n\nUpload your DQF and Compass will scan against all 12 slots and tell you exactly which are missing." },

  { cat: "dqf", cfr: "§ 391.41", name: "Medical Certification", q: "Driver's med card expired — can he drive?",
    a: "**No.** Per **49 CFR § 391.41(a)**, a CMV driver must hold a current Medical Examiner's Certificate (MEC, MCSA-5876). An expired card disqualifies him from safety-sensitive driving until renewed.\n\nWhat to do today:\n• Pull him from the schedule\n• Send him to a National Registry-certified medical examiner\n• If he's at a 1-year cert (vs the 2-year max), confirm the underlying condition didn't worsen\n• Log the gap in your DQF — auditors look for it\n\nDriving with expired cert = **§ 391.45 violation** + likely CSA Driver Fitness BASIC hit." },

  { cat: "dqf", cfr: "FCRA", name: "Adverse Action Prep", q: "How do I write the FCRA denial letter?",
    a: "FCRA adverse-action requires a **two-letter sequence** per **15 U.S.C. § 1681m**:\n\n**Letter 1 (pre-adverse):** Within reasonable time of the negative report, send the candidate (a) a copy of the consumer report, (b) the FTC \"Summary of Your Rights,\" and (c) notice that adverse action is being considered. Wait 5 business days minimum.\n\n**Letter 2 (final adverse):** State the action, name and address of the consumer reporting agency, that the agency did not make the decision, and the candidate's right to dispute.\n\n*Syed v. M-I LLC* (9th Cir. 2017) — your initial FCRA disclosure must be a **standalone document**. Bundling it with the application is a willful violation, $1,000–$1,000+ per applicant. Compass DFY drafts both letters from the candidate's Checkr/Sterling report." },

  { cat: "hos", cfr: "Part 395", name: "Hours of Service", q: "Walk me through the 14-hour rule",
    a: "**49 CFR § 395.3(a)(2)** — once a property-carrying driver comes on duty after 10 consecutive hours off, the **14-hour clock** starts ticking and **does NOT pause for breaks or off-duty time during the day.**\n\nWithin those 14 hours:\n• Maximum **11 hours driving** (§ 395.3(a)(3))\n• **30-min break** required after 8 cumulative hours driving (§ 395.3(a)(3)(ii))\n• On-duty (not driving) time still counts toward the 14\n\nException: **§ 395.1(o) 16-hour rule** — once per 7 days, returning to home terminal, can extend to 16.\n\nWhen Ricardo hit 13.8/14 yesterday, Compass automatically pinged his ELD with a stop-now alert at the 12-minute warning." },

  { cat: "hos", cfr: "§ 395.20", name: "ELD Compliance", q: "My ELD says malfunction — what now?",
    a: "Per **49 CFR § 395.34**, when an ELD malfunctions:\n\n1. **Note the malfunction** — driver writes it on his RODS the same day\n2. **Reconstruct the day on paper** — RODS for current 24 hours + the previous 7 days if not retrievable\n3. **Notify the carrier within 24 hours**\n4. **Repair, replace, or service within 8 days**\n5. Carrier may request **extension** from FMCSA if not feasible (rare)\n\nDon't ignore it. A persistent malfunction with no paper backup = inspector-cited HOS violation regardless of compliance reality.\n\nCheck Compass HOS module → ELD Malfunctions panel for the current count across your fleet." },

  { cat: "hos", cfr: "§ 395.1(g)", name: "Split-Sleeper Berth", q: "Explain the 7/3 split",
    a: "**49 CFR § 395.1(g)** allows splitting the 10-hour off-duty requirement. The 2020 HOS revision made the split flexible: **7+3, 8+2, OR equivalent** — both periods together = at least 10 hours.\n\nThe rules:\n• One period must be at least **2 hours** off-duty (not in sleeper)\n• The other must be at least **7 hours in sleeper**\n• Neither counts against the 14-hour driving window\n• 14-hour clock effectively pauses during the longer rest\n\nCommon use: 7-hour sleeper at a truck stop + 3-hour break at the delivery dock. Restart the clock without losing a full day.\n\nCompass HOS auto-recognizes split logs from Motive/Samsara/Geotab feeds — no manual flagging needed." },

  { cat: "da", cfr: "Part 382", name: "Drug & Alcohol Testing", q: "What's my random rate this year?",
    a: "**Current FMCSA rates (2026):**\n• Controlled substances: **50%** annually\n• Alcohol: **10%** annually\n\nFMCSA sets these in a Federal Register notice each January. The 50% drug rate has been in effect since 2020 because the positive-rate threshold (>1.0%) was exceeded.\n\nHow your % is calculated: total tests in calendar year ÷ average driver count = your random rate. You must hit 50%/10% in **each quarter** (not just year-end average) — bunching all tests in December = violation.\n\nCompass D&A → Random Pool view shows your current % YTD vs target. Right now you're at **42%** drug · **9%** alcohol — Q4 needs 8 more drug tests to clear the threshold." },

  { cat: "da", cfr: "§ 382.701", name: "Clearinghouse Queries", q: "When is a full query required?",
    a: "**49 CFR § 382.701** requires:\n\n• **Full (pre-employment) query** — before allowing a new driver to perform safety-sensitive functions. Driver must consent electronically in the Clearinghouse.\n• **Limited query** — annually for every current driver. Driver consents once at hire (covers all future limited queries).\n• **Within 1 business day** — report every positive test, refusal, return-to-duty determination, and follow-up testing completion to the Clearinghouse.\n\nA full query costs ~$1.25 (when pre-purchased in bundles). A limited query ~$1.25 each.\n\nIf a driver shows \"prohibited\" status, **you cannot let them drive** until they complete return-to-duty (SAP evaluation, treatment, RTD test, follow-up testing schedule).\n\nCompass D&A automatically fires the limited query 11 months after the last one." },

  { cat: "da", cfr: "§ 382.303", name: "Post-Accident Testing", q: "Driver had a crash. Now what?",
    a: "Run through the **§ 382.303** triggers:\n\n1. **Was there a fatality?** Any fatality (driver, passenger, third party) → post-accident testing required regardless of fault.\n2. **Bodily injury requiring treatment AWAY from scene + citation issued to the CMV driver?** → Required.\n3. **Disabling damage requiring tow-away + citation issued to the CMV driver?** → Required.\n\nNo trigger = no required test. But document the determination (a one-pager why no test was given).\n\nDeadlines:\n• **Alcohol test within 8 hours** of accident\n• **Controlled substance test within 32 hours**\n\nIf the driver is hospitalized and can't be tested in time, document the medical impossibility — that preserves your record.\n\nCompass Post-Accident wizard walks you through all 3 triggers and auto-files the result to the Clearinghouse if positive." },

  { cat: "csa", cfr: "Part 385", name: "CSA / BASIC Scoring", q: "Why did my HOS BASIC spike?",
    a: "**HOS Compliance BASIC** is calculated from inspection violations weighted by severity and time-weighted (recent inspections count more).\n\nCommon causes for a sudden spike:\n• **One high-severity inspection** (e.g., § 395.3 14-hour violation = 7-point weight) can push you above 65th percentile if your peer group is small.\n• **Recency multiplier** — violations within 6 months count 3×, 6–12 months 2×, 12–24 months 1×.\n• **Peer group change** — FMCSA reassigns peer groups by power-unit count and exposure.\n\nWhat to do:\n1. Pull every HOS-tagged inspection in the past 24 months from the Compass Inspections module.\n2. Identify any that look contestable (officer error, wrong driver, technology malfunction).\n3. File DataQ challenges for the contestable ones — average reversal rate from Compass: **64%**.\n\nReversed violations leave the BASIC math within 30 days." },

  { cat: "csa", cfr: "Part 386", name: "DataQ Disputes ⭐", q: "Is this inspection contestable?",
    a: "Compass evaluates contestability across 8 patterns. The high-success ones:\n\n**Pattern 1 — Identity error.** Wrong driver named in the inspection. Win rate: ~95%.\n**Pattern 4 — Officer documentation error.** The cited time conflicts with ELD record. Win rate: ~78%.\n**Pattern 7 — Citation references wrong CFR provision.** Common with § 395 sections. Win rate: ~65%.\n**Pattern 9 — DOT-recordable crash misclassified.** Win rate: ~70%.\n\nLow-win patterns:\n**Pattern 12 — \"Officer was wrong about the law.\"** Win rate: ~15%. Don't file unless you have published FMCSA guidance contradicting them.\n\nUpload the inspection report and Compass cross-references against ELD/dispatch/maintenance records, generates the DataQ challenge filing, and tracks the state's 30-day response window." },

  { cat: "csa", cfr: "§ 385.6", name: "Intervention Thresholds", q: "What triggers a CR notice?",
    a: "**Compliance Review (CR)** triggers per **49 CFR § 385.4** + FMCSA enforcement priorities:\n\n• **2+ BASICs at alert threshold** for 6 consecutive months\n• **High recordable crash rate** vs peer group\n• **Pattern of fatal crashes** (any year)\n• **Failed Safety Audit** (new-entrant carriers within 12 months)\n• **Repeat off-site investigation findings**\n\nFor general freight: alert = 65th percentile. For passenger/hazmat: 60th.\n\nBefore the CR notice, FMCSA usually sends an **Off-Site Investigation** request (less formal). Treat it like the audit — same materials.\n\nIf you're at 2 BASICs at alert right now, you have ~12-18 months to bring them down before CR-level intervention. Compass CSA module shows your current trajectory and the trend." },

  { cat: "vehicles", cfr: "Part 396", name: "Maintenance Program", q: "Build me a 396 PM schedule",
    a: "**49 CFR § 396.3** requires a systematic inspection, repair, and maintenance program. FMCSA doesn't mandate specific intervals — you must define and follow them in writing.\n\nIndustry-standard intervals (what auditors expect to see):\n• **A-service:** every 10,000-15,000 miles (oil, filters, lights, fluids, brake adjustment)\n• **B-service:** every 30,000-45,000 miles (A + brake reline check, ABS scan, suspension)\n• **C-service:** every 60,000-100,000 miles (everything + transmission, differential, full DOT)\n• **Annual DOT inspection** (§ 396.17): every 12 months — required regardless of mileage\n\nRetention: **§ 396.3(c)** — records for 1 year + 6 months after vehicle leaves your control.\n\nGive Compass your fleet via CSV and we'll generate the PM calendar by VIN. Already integrated with Fleetio, Whip Around, Motive, Samsara." },

  { cat: "vehicles", cfr: "§ 396.17", name: "Annual DOT Inspection", q: "What's checked in the annual?",
    a: "**49 CFR § 396.17 + Appendix G** — 14 vehicle systems must be inspected annually by a qualified inspector:\n\n1. Brake system  2. Coupling devices  3. Exhaust  4. Fuel system  5. Lighting devices  6. Safe loading  7. Steering mechanism  8. Suspension  9. Frame  10. Tires  11. Wheels & rims  12. Windshield glazing  13. Windshield wipers  14. Pollution control (where state-required)\n\n**Inspector qualifications** (§ 396.19) — must have:\n• 1 year experience as a mechanic/inspector OR equivalent training\n• Knowledge of FMVSS + § 393 specifications\n• Be able to identify defective vehicle components\n\nCert retained **14 months** in the vehicle file. Inspector qualification record retained **1 year** after inspector leaves.\n\nCompass Vehicles module shows your fleet's next-due dates by VIN and flags inspectors whose qual records are about to expire." },

  { cat: "vehicles", cfr: "§ 396.11", name: "DVIR Records", q: "Are DVIRs required if no defects?",
    a: "**Updated rule (effective 12/18/2014):** No-defect DVIRs are **not required** for property-carrying motor carriers.\n\nDrivers must still:\n• Perform the post-trip inspection\n• Report any defects affecting safety in writing\n• If defects exist: the carrier must certify repairs (or that repairs aren't needed)\n\nThe rule that DID NOT change:\n• Pre-trip inspection still required (§ 392.7) — driver visually checks the vehicle, but no paperwork is generated unless defects.\n• Passenger-carrying vehicles still need DVIRs daily regardless of defects.\n\nRecord retention for DVIRs WITH defects: **3 months from date of inspection** (§ 396.11(c)(2)).\n\nCompass Vehicles accepts no-defect DVIRs (creates a clean log without paperwork) and routes defect DVIRs to the maintenance workflow automatically." },

  { cat: "hazmat", cfr: "Part 172", name: "Hazmat Placarding", q: "4,000 lbs of UN1203 — placards?",
    a: "**UN1203 = Gasoline, Class 3 (Flammable Liquid).**\n\n**Placards required:** YES. Threshold for Class 3 is **1,001 lbs aggregate gross weight** per **49 CFR § 172.504 Table 2**. At 4,000 lbs you're well over.\n\n**Which placard:** RED **FLAMMABLE 3** with UN1203 marking on the bottom corner (or four-digit ID separately displayed).\n\n**Placement:** Both sides + both ends of the vehicle (4 placards minimum). Visible from a distance equal to placard height + 3 feet.\n\n**Driver requirements:**\n• HazMat (H) endorsement on CDL\n• TSA threat assessment (renew every 5 years)\n• Emergency Response Information (ERG-equivalent) in cab\n• Route plan if required by state\n\nUse the Compass Placard Wizard — type \"UN1203 4000 lb\" and it generates the loadout sheet, placard order, and driver brief." },

  { cat: "hazmat", cfr: "§ 177.848", name: "Segregation Tables", q: "Class 3 + Class 8 together?",
    a: "**§ 177.848 Segregation Table** — Class 3 (Flammable Liquid) + Class 8 (Corrosive):\n\n**Result: \"O\" = May be loaded together with restrictions.**\n\nSpecifically:\n• Class 3 + Class 8 **with no other prohibitions** = OK to load same vehicle.\n• If the Class 8 is **also Class 5.1 oxidizer** (e.g., hydrogen peroxide): \"X\" = **PROHIBITED.**\n• If either is **packing group I** in non-IBC packaging: extra distance requirements apply.\n• Separation: Class 3 and Class 8 packages must not be in physical contact (use blocking/bracing).\n\nThe Compass Hazmat Segregation Wizard does the lookup automatically — input the UN numbers and it tells you compatible / incompatible / restricted with the citation.\n\nDocumented segregation review goes into your Hazmat Compliance Audit packet." },

  { cat: "hazmat", cfr: "49 CFR 1572", name: "TSA H Endorsement", q: "How long is H valid?",
    a: "**HME (Hazmat Endorsement) renewal cycle: every 5 years per TSA.**\n\nThe H endorsement on a CDL requires a TSA Security Threat Assessment under **49 CFR Part 1572**. Two components:\n\n• **Initial assessment** — fingerprints + background check via TSA Universal Enrollment Services (UES). ~$86.50 fee. 30–60 day turnaround.\n• **Renewal assessment** — required when state CDL is up for renewal or every 5 years, whichever is sooner.\n\nDisqualifying factors (§ 1572.103):\n• Felony conviction in past 7 years involving terrorism, espionage, sedition, treason, RICO, certain firearms, weapons, etc.\n• Mental capacity adjudications\n• Wanted/fugitive status\n\nIf disqualified, driver can apply for a waiver. Compass HazMat tracker shows each driver's H expiration alongside state CDL renewal dates so you avoid double-jeopardy lapse." },
];

function SkillCard({ skill, onClick }: { skill: Skill; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="text-left rounded-2xl p-5 border border-[var(--border)] bg-[var(--surface-3)] hover:border-[var(--accent)]/50 hover:bg-[var(--surface-2)] transition-colors relative pr-10 group"
      style={{ background: "linear-gradient(180deg, var(--surface) 0%, var(--surface-3) 100%)" }}
    >
      <div className="inline-block text-[10px] font-bold tracking-wider text-[var(--accent)] bg-[var(--accent)]/10 border border-[var(--accent)]/25 px-2 py-1 rounded-full font-mono mb-2">
        {skill.cfr}
      </div>
      <div className="text-[15px] font-bold text-[var(--fg)] mb-1">{skill.name}</div>
      <div className="text-[13px] italic text-[var(--fg-muted)]">&ldquo;{skill.q}&rdquo;</div>
      <div className="absolute right-5 top-5 text-[var(--accent)] font-bold group-hover:translate-x-0.5 transition-transform">→</div>
      <div className="text-[10px] text-[var(--accent)]/0 group-hover:text-[var(--accent)]/80 mt-3 font-semibold transition-colors">
        Preview sample answer ↗
      </div>
    </button>
  );
}

function renderAnswer(answer: string) {
  // Light markdown: **bold** + bullets + line breaks
  const lines = answer.split("\n");
  const blocks: React.ReactNode[] = [];
  let listBuf: string[] = [];

  const flushList = () => {
    if (listBuf.length) {
      blocks.push(
        <ul key={`l${blocks.length}`} className="list-disc pl-5 space-y-1.5 my-2.5 text-[var(--fg-muted)]">
          {listBuf.map((li, i) => (
            <li key={i} dangerouslySetInnerHTML={{ __html: renderInline(li) }} />
          ))}
        </ul>
      );
      listBuf = [];
    }
  };

  for (const raw of lines) {
    const t = raw.trim();
    if (!t) {
      flushList();
      continue;
    }
    if (/^[•\-\d]+[.)]?\s/.test(t)) {
      // bullet or numbered item
      listBuf.push(t.replace(/^[•\-\d]+[.)]?\s/, ""));
    } else {
      flushList();
      blocks.push(
        <p key={`p${blocks.length}`} className="text-[13.5px] text-[var(--fg-muted)] leading-relaxed my-2" dangerouslySetInnerHTML={{ __html: renderInline(t) }} />
      );
    }
  }
  flushList();
  return blocks;
}

function renderInline(s: string) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    // **bold**
    .replace(/\*\*([^*]+)\*\*/g, '<strong class="text-[var(--fg)] font-bold">$1</strong>')
    // CFR-like spans become cyan
    .replace(/(§\s?\d+\.\d+(?:\([a-z0-9]+\))?(?:\([a-z0-9]+\))?|49 CFR (?:§\s?)?\d+(?:\.\d+)?|Part \d+|15 U\.S\.C\.\s?§\s?\d+(?:\([a-z0-9]+\))?(?:\([a-z0-9]+\))?|UN\d{4}|MCSA-\d+|FMVSS|FCRA)/g, '<span class="text-[var(--accent)] font-mono">$1</span>');
}

export default function SkillsExplorer() {
  const [openSkill, setOpenSkill] = useState<Skill | null>(null);

  // ESC to close
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpenSkill(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {SKILLS.map((s, i) => (
          <SkillCard key={i} skill={s} onClick={() => setOpenSkill(s)} />
        ))}
      </div>

      {/* Modal */}
      {openSkill && (
        <div
          className="fixed inset-0 z-50 grid place-items-center bg-black/70 backdrop-blur-sm p-4 overflow-y-auto"
          onClick={() => setOpenSkill(null)}
        >
          <div
            className="w-full max-w-2xl rounded-2xl border border-[var(--border)] my-8"
            style={{ background: "linear-gradient(180deg, var(--surface) 0%, var(--surface-3) 100%)" }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="px-6 pt-6 pb-5 border-b border-[var(--border)]">
              <div className="flex items-start justify-between gap-4 mb-3">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[11px] font-extrabold tracking-wider text-[var(--accent)] bg-[var(--accent)]/10 border border-[var(--accent)]/25 px-2.5 py-1 rounded-full font-mono">
                    {openSkill.cfr}
                  </span>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--fg-faint)]">
                    Live skill · sample answer
                  </span>
                </div>
                <button
                  onClick={() => setOpenSkill(null)}
                  className="text-[var(--fg-muted)] hover:text-[var(--fg)] text-[20px] leading-none -mt-1"
                  aria-label="Close"
                >
                  ✕
                </button>
              </div>
              <h3 className="text-[22px] font-extrabold text-[var(--fg)] mb-2">{openSkill.name}</h3>
              <div className="rounded-lg bg-[var(--bg)] border border-[var(--border)] px-4 py-3 text-[14px] text-[var(--fg-muted)] italic">
                &ldquo;{openSkill.q}&rdquo;
              </div>
            </div>

            {/* Sample answer */}
            <div className="px-6 py-5">
              <div className="flex items-center gap-2 mb-3">
                <div
                  className="w-7 h-7 rounded-full grid place-items-center text-[var(--bg)] font-black text-[14px]"
                  style={{ background: "linear-gradient(135deg, var(--accent), var(--accent-2))" }}
                >
                  ∞
                </div>
                <div className="text-[12px] font-extrabold text-[var(--fg)]">Compass · sample answer</div>
              </div>
              <div className="space-y-1">
                {renderAnswer(openSkill.a)}
              </div>
            </div>

            {/* CTA footer */}
            <div className="px-6 py-5 border-t border-[var(--border)] bg-[var(--bg)]/60 rounded-b-2xl">
              <div className="text-[13px] text-[var(--fg-muted)] mb-3">
                This is one of <strong className="text-[var(--fg)]">300 published skills.</strong> Every Compass answer cites the actual CFR — and runs against your fleet&apos;s real data.
              </div>
              <div className="flex flex-wrap gap-2 items-center justify-between">
                <div className="text-[11px] text-[var(--fg-faint)]">
                  Press <kbd className="px-1.5 py-0.5 rounded bg-[var(--border)] text-[var(--fg-muted)] font-mono text-[10px]">Esc</kbd> to close
                </div>
                <div className="flex gap-2 flex-wrap">
                  <button
                    onClick={() => setOpenSkill(null)}
                    className="text-[12.5px] font-semibold text-[var(--fg-muted)] hover:text-[var(--fg)] px-4 py-2 rounded-full border border-white/20 hover:bg-white/5"
                  >
                    Browse more skills
                  </button>
                  <Link
                    href="/signup"
                    className="text-[12.5px] font-bold text-[var(--bg)] px-5 py-2 rounded-full whitespace-nowrap"
                    style={{
                      background: "linear-gradient(135deg, var(--accent), var(--accent-2))",
                      boxShadow: "0 4px 12px rgba(34, 211, 238, 0.32)",
                    }}
                  >
                    Ask this with my fleet → Start free trial
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
