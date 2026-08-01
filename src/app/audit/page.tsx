"use client";

import { useState, useMemo, useRef } from "react";
import Link from "next/link";
import SiteShell from "@/components/SiteShell";

interface Option {
  label: string;
  score: number;
  na?: boolean;
}

interface Question {
  n: number;
  type: "text" | "email" | "tel" | "radio";
  required?: boolean;
  cfr?: string;
  q: string;
  options?: Option[];
  scored: boolean;
}

interface Section {
  id: string;
  num: number;
  title: string;
  basic?: string;
  weight?: number; // 0..1 — only on scored sections
  icon: string;
  questions: Question[];
}

const SECTIONS: Section[] = [
  {
    id: "fleet",
    num: 1,
    title: "Your Fleet",
    icon: "🚛",
    questions: [
      { n: 1, type: "text", required: true, q: "What is your company name?", scored: false },
      { n: 2, type: "text", q: "What is your USDOT number?", scored: false },
      {
        n: 3, type: "radio", scored: false,
        q: "How many power units do you operate?",
        options: [
          { label: "1–3 (owner-op / micro-fleet)", score: 0 },
          { label: "4–10", score: 0 },
          { label: "11–25", score: 0 },
          { label: "26–50", score: 0 },
          { label: "51–100", score: 0 },
          { label: "100+", score: 0 },
        ],
      },
      {
        n: 4, type: "radio", scored: false,
        q: "What type of operation are you running?",
        options: [
          { label: "Interstate non-hazmat (general freight)", score: 0 },
          { label: "Interstate hazmat", score: 0 },
          { label: "Intrastate only", score: 0 },
          { label: "Passenger", score: 0 },
          { label: "Mixed", score: 0 },
        ],
      },
      {
        n: 5, type: "radio", scored: false,
        q: "How long have you held your DOT operating authority?",
        options: [
          { label: "Less than 12 months (New Entrant)", score: 0 },
          { label: "1–3 years", score: 0 },
          { label: "4–10 years", score: 0 },
          { label: "10+ years", score: 0 },
        ],
      },
      { n: 6, type: "text", required: true, q: "What is your name?", scored: false },
      {
        n: 7, type: "radio", scored: false,
        q: "How many drivers are on your payroll?",
        options: [
          { label: "1–2 drivers", score: 0 },
          { label: "3–5 drivers", score: 0 },
          { label: "6–10 drivers", score: 0 },
          { label: "11–25 drivers", score: 0 },
          { label: "26–50 drivers", score: 0 },
          { label: "51–100 drivers", score: 0 },
          { label: "100+ drivers", score: 0 },
        ],
      },
      { n: 8, type: "email", required: true, q: "What email should the X3 team reach you at?", scored: false },
      { n: 9, type: "tel", required: true, q: "What is the best phone number to reach you at?", scored: false },
    ],
  },
  {
    id: "dq", num: 2, title: "Driver Qualification Files", basic: "PART 391", weight: 0.20, icon: "📁",
    questions: [
      { n: 10, type: "radio", scored: true, cfr: "§ 391.51",
        q: "Do you maintain a complete Driver Qualification File for every driver per § 391.51?",
        options: [
          { label: "Yes, complete for every driver", score: 1 },
          { label: "Yes for most; some gaps exist", score: 0.6 },
          { label: "We know there are gaps or missing files", score: 0.2 },
          { label: "I'm not sure", score: 0 },
        ],
      },
      { n: 11, type: "radio", scored: true, cfr: "§§ 391.41–391.45",
        q: "Are CDL driver medical certifications verified via MVR (required since January 2026 — paper certs no longer accepted for CDL)?",
        options: [
          { label: "Yes, all CDL drivers verified via MVR", score: 1 },
          { label: "Partially — still transitioning", score: 0.5 },
          { label: "No, still relying on paper certs", score: 0 },
          { label: "Not applicable — no CDL drivers", score: 1, na: true },
        ],
      },
      { n: 12, type: "radio", scored: true, cfr: "§ 391.25",
        q: "Do you conduct the § 391.25 Annual Driving Record Review and document it with date + reviewer name?",
        options: [
          { label: "Yes, documented for every driver", score: 1 },
          { label: "Done, but not consistently documented", score: 0.5 },
          { label: "No", score: 0 },
        ],
      },
      { n: 13, type: "radio", scored: true, cfr: "§ 391.23",
        q: "Do you pull a 3-year MVR on every new hire before they drive?",
        options: [
          { label: "Yes, every time", score: 1 },
          { label: "Usually but not always", score: 0.5 },
          { label: "No", score: 0 },
        ],
      },
      { n: 14, type: "radio", scored: true, cfr: "§ 391.23(d)",
        q: "Do you complete a 3-year safety performance history check on every new driver?",
        options: [
          { label: "Yes, on every driver", score: 1 },
          { label: "Sometimes", score: 0.5 },
          { label: "No", score: 0 },
        ],
      },
      { n: 15, type: "radio", scored: true, cfr: "§§ 391.31–391.33",
        q: "Is a road test certificate (or equivalent per § 391.33) on file for every driver?",
        options: [
          { label: "Yes", score: 1 },
          { label: "Partial", score: 0.5 },
          { label: "No", score: 0 },
        ],
      },
    ],
  },
  {
    id: "hos", num: 3, title: "Hours of Service & ELD", basic: "PART 395", weight: 0.20, icon: "⏱️",
    questions: [
      { n: 16, type: "radio", scored: true, cfr: "§ 395.8",
        q: "Is your ELD provider on the FMCSA Registered ELD list?",
        options: [
          { label: "Yes, verified on FMCSA list", score: 1 },
          { label: "I think so, but haven't verified", score: 0.5 },
          { label: "No, or I don't use an ELD", score: 0 },
        ],
      },
      { n: 17, type: "radio", scored: true, cfr: "§ 395.22(h)",
        q: "Do you have documented ELD training for every driver per § 395.22(h)?",
        options: [
          { label: "Yes, documented for every driver", score: 1 },
          { label: "Done, not documented consistently", score: 0.5 },
          { label: "No", score: 0 },
        ],
      },
      { n: 18, type: "radio", scored: true, cfr: "§ 395.32",
        q: "Do you review and reconcile unassigned driving time within 14 days per § 395.32?",
        options: [
          { label: "Yes, weekly process in place", score: 1 },
          { label: "Occasionally", score: 0.5 },
          { label: "No / not sure what this is", score: 0 },
        ],
      },
      { n: 19, type: "radio", scored: true, cfr: "§ 395.8(k)",
        q: "Can you produce 6 months of ELD/RODS data on demand?",
        options: [
          { label: "Yes, exportable at any time", score: 1 },
          { label: "Sort of — would take time to produce", score: 0.5 },
          { label: "Short Haul Exception (150 air-mile radius)", score: 1, na: true },
          { label: "No", score: 0 },
        ],
      },
      { n: 20, type: "radio", scored: true, cfr: "49 CFR Part 395",
        q: "How many HOS violations have your drivers had in the last 90 days?",
        options: [
          { label: "Zero", score: 1 },
          { label: "1–3 (minor, coached)", score: 0.75 },
          { label: "4–10", score: 0.4 },
          { label: "More than 10", score: 0 },
          { label: "I don't track this", score: 0 },
        ],
      },
    ],
  },
  {
    id: "da", num: 4, title: "Drug & Alcohol Program", basic: "PARTS 382 & 40", weight: 0.20, icon: "💊",
    questions: [
      { n: 21, type: "radio", scored: true, cfr: "§ 382.601",
        q: "Do you have a written D&A policy with signed receipts from every driver per § 382.601?",
        options: [
          { label: "Yes, signed receipts on file", score: 1 },
          { label: "Policy exists, receipts inconsistent", score: 0.5 },
          { label: "No", score: 0 },
        ],
      },
      { n: 22, type: "radio", scored: true, cfr: "§ 382.305",
        q: "Are you enrolled in a C/TPA (Consortium/Third-Party Administrator) random pool at 50% drug / 10% alcohol annual rates?",
        options: [
          { label: "Yes, enrolled and compliant", score: 1 },
          { label: "Enrolled but not sure about rates", score: 0.5 },
          { label: "Not enrolled / solo operator managing own testing", score: 0 },
        ],
      },
      { n: 23, type: "radio", scored: true, cfr: "§ 382.701(a)",
        q: "Have you run Clearinghouse pre-employment full queries on every driver hired?",
        options: [
          { label: "Yes, every driver", score: 1 },
          { label: "Most, but gaps exist", score: 0.5 },
          { label: "No", score: 0 },
        ],
      },
      { n: 24, type: "radio", scored: true, cfr: "§ 382.701(b)",
        q: "Do you run annual Clearinghouse limited queries on every CDL driver?",
        options: [
          { label: "Yes, documented annually", score: 1 },
          { label: "Sometimes", score: 0.5 },
          { label: "No", score: 0 },
        ],
      },
      { n: 25, type: "radio", scored: true, cfr: "§ 382.603",
        q: "Do supervisors have documented reasonable-suspicion training (60 min drug + 60 min alcohol)?",
        options: [
          { label: "Yes, all supervisors trained & documented", score: 1 },
          { label: "Partial", score: 0.5 },
          { label: "No", score: 0 },
        ],
      },
      { n: 26, type: "radio", scored: true, cfr: "§ 40.3",
        q: "Have you designated a DER (Designated Employer Representative) in writing?",
        options: [
          { label: "Yes, documented", score: 1 },
          { label: "Informally / not sure", score: 0.5 },
          { label: "No", score: 0 },
        ],
      },
    ],
  },
  {
    id: "vm", num: 5, title: "Vehicle Maintenance", basic: "PART 396", weight: 0.15, icon: "🔧",
    questions: [
      { n: 27, type: "radio", scored: true, cfr: "§ 396.11",
        q: "Do drivers complete pre-trip and post-trip DVIRs per § 396.11?",
        options: [
          { label: "Yes, paper or digital, audited weekly", score: 1 },
          { label: "Yes but not consistently audited", score: 0.6 },
          { label: "No / inconsistent", score: 0 },
        ],
      },
      { n: 28, type: "radio", scored: true, cfr: "§ 396.17",
        q: "Do you have annual vehicle inspection records on file for 14 months per § 396.17?",
        options: [
          { label: "Yes, every vehicle, indexed", score: 1 },
          { label: "Most vehicles, some gaps", score: 0.5 },
          { label: "No", score: 0 },
        ],
      },
      { n: 29, type: "radio", scored: true, cfr: "§ 396.3",
        q: "Do you maintain a systematic preventive maintenance program per § 396.3?",
        options: [
          { label: "Yes, scheduled with PM intervals", score: 1 },
          { label: "Informal / reactive", score: 0.4 },
          { label: "No", score: 0 },
        ],
      },
      { n: 30, type: "radio", scored: true, cfr: "§ 396.19",
        q: "Are your annual inspectors qualified per § 396.19 with qualification documentation on file?",
        options: [
          { label: "Yes, documented", score: 1 },
          { label: "Not sure", score: 0.3 },
          { label: "No", score: 0 },
        ],
      },
    ],
  },
  {
    id: "gen", num: 6, title: "General Operations", basic: "PARTS 390 & 387", weight: 0.10, icon: "📋",
    questions: [
      { n: 31, type: "radio", scored: true, cfr: "§ 390.15",
        q: "Is your accident register for the preceding 3 years current per § 390.15?",
        options: [
          { label: "Yes, current and on file", score: 1 },
          { label: "Partial", score: 0.5 },
          { label: "No", score: 0 },
          { label: "No accidents to report", score: 1, na: true },
        ],
      },
      { n: 32, type: "radio", scored: true, cfr: "§ 390.19",
        q: "Is your MCS-150 updated within the last 24 months per § 390.19?",
        options: [
          { label: "Yes, updated within 24 months", score: 1 },
          { label: "Not sure of last update date", score: 0.3 },
          { label: "No / overdue", score: 0 },
        ],
      },
      { n: 33, type: "radio", scored: true, cfr: "§§ 387.7, 387.9",
        q: "Is your financial responsibility filing (MCS-90 / BMC-91) current with FMCSA?",
        options: [
          { label: "Yes, verified on FMCSA L&I system", score: 1 },
          { label: "Assumed current but not verified", score: 0.4 },
          { label: "No / lapsed", score: 0 },
        ],
      },
      { n: 34, type: "radio", scored: true, cfr: "§ 390.21",
        q: "Is your USDOT number displayed on both sides of every power unit per § 390.21?",
        options: [
          { label: "Yes, all units compliant", score: 1 },
          { label: "Some not marked", score: 0.4 },
          { label: "No / unsure", score: 0 },
        ],
      },
    ],
  },
  {
    id: "csa", num: 7, title: "CSA Scores & Recent History", weight: 0.15, icon: "📊",
    questions: [
      { n: 35, type: "radio", scored: true,
        q: "Are any of your CSA BASIC scores currently in alert status?",
        options: [
          { label: "No alerts on any BASIC", score: 1 },
          { label: "One BASIC in alert", score: 0.5 },
          { label: "Two or more BASICs in alert", score: 0 },
          { label: "I don't know / haven't checked", score: 0 },
        ],
      },
      { n: 36, type: "radio", scored: true,
        q: "How many roadside inspections has your fleet had in the last 24 months?",
        options: [
          { label: "Zero (little roadside exposure)", score: 1 },
          { label: "1–5", score: 0.8 },
          { label: "6–20", score: 0.5 },
          { label: "21–50", score: 0.3 },
          { label: "More than 50", score: 0 },
        ],
      },
      { n: 37, type: "radio", scored: true,
        q: "Have you had any FMCSA contact in the last 24 months (Compliance Review, New Entrant Audit, warning letter, intervention)?",
        options: [
          { label: "No contact", score: 1 },
          { label: "Warning letter only", score: 0.6 },
          { label: "New Entrant audit (passed)", score: 0.8 },
          { label: "Compliance Review (active or recent)", score: 0.2 },
          { label: "Conditional or Unsatisfactory rating", score: 0 },
        ],
      },
    ],
  },
];

const ALL_QUESTIONS = SECTIONS.flatMap((s) => s.questions);
const TOTAL_QUESTIONS = ALL_QUESTIONS.length;

// Fleet-size multiplier for the civil penalty exposure estimate.
// Indexed by Q3 answer position.
const FLEET_MULTIPLIER = [2, 3, 4, 5, 6, 7];

function riskBand(pct: number) {
  if (pct >= 85) return { label: "Strong", color: "#10B981", verdict: "Solid posture. Stay vigilant on the items below to keep your standing." };
  if (pct >= 70) return { label: "Elevated", color: "#16C7FF", verdict: "Defensible, with a handful of priority gaps to close before your next review." };
  if (pct >= 50) return { label: "Moderate Risk", color: "#F0B33A", verdict: "Meaningful gaps that need a structured remediation plan plus ongoing DataQ and audit-prep support." };
  return { label: "Severe Risk", color: "#FF5C5C", verdict: "Critical exposure. You need active intervention and audit defense — not a checklist." };
}

function recommendedTier(pct: number) {
  if (pct >= 85) return { name: "Self-Serve", price: "$97/mo" };
  if (pct >= 70) return { name: "Fleet Pilot", price: "$497/mo" };
  if (pct >= 50) return { name: "Fleet Commander", price: "$997/mo" };
  return { name: "Audit Defense", price: "$1,997/mo" };
}

function findingSeverity(score: number) {
  if (score < 0.4) return { label: "HIGH", color: "#FF5C5C" };
  if (score < 0.75) return { label: "MED", color: "#F0B33A" };
  return { label: "LOW", color: "#16C7FF" };
}

export default function AuditPage() {
  const [answers, setAnswers] = useState<Record<number, string | number>>({});
  const [stepIdx, setStepIdx] = useState(0);
  const [showResults, setShowResults] = useState(false);
  const [notified, setNotified] = useState(false);
  const topRef = useRef<HTMLDivElement>(null);

  const section = SECTIONS[stepIdx];

  const answeredCount = useMemo(() => {
    return ALL_QUESTIONS.filter((q) => {
      const v = answers[q.n];
      if (q.type === "radio") return typeof v === "number";
      return typeof v === "string" && v.trim().length > 0;
    }).length;
  }, [answers]);

  const sectionComplete = section.questions.every((q) => {
    if (q.type === "radio") return typeof answers[q.n] === "number";
    if (q.required) return typeof answers[q.n] === "string" && (answers[q.n] as string).trim().length > 0;
    return true;
  });

  // Pull carrier profile values
  const companyName = (answers[1] as string) || "Your Fleet";
  const usdotNum = (answers[2] as string) || "—";
  const fleetIdx = typeof answers[3] === "number" ? (answers[3] as number) : 2;
  const fleetLabel = SECTIONS[0].questions[2].options?.[fleetIdx]?.label || "—";
  const opIdx = typeof answers[4] === "number" ? (answers[4] as number) : 0;
  const opLabel = SECTIONS[0].questions[3].options?.[opIdx]?.label || "—";
  const authIdx = typeof answers[5] === "number" ? (answers[5] as number) : 1;
  const authLabel = SECTIONS[0].questions[4].options?.[authIdx]?.label || "—";

  // Per-section scores (weighted)
  const sectionScores = useMemo(() => {
    return SECTIONS.filter((s) => s.id !== "fleet").map((s) => {
      let earned = 0, denom = 0;
      s.questions.forEach((q) => {
        if (!q.scored) return;
        const idx = answers[q.n];
        if (typeof idx !== "number" || !q.options) return;
        const opt = q.options[idx];
        if (!opt || opt.na) return;
        denom += 1;
        earned += opt.score;
      });
      const pct = denom === 0 ? 0 : Math.round((earned / denom) * 100);
      return { id: s.id, title: s.title, basic: s.basic, weight: s.weight || 0, icon: s.icon, pct };
    });
  }, [answers]);

  // Weighted overall score
  const overallPct = useMemo(() => {
    let weighted = 0, weightSum = 0;
    sectionScores.forEach((s) => {
      weighted += s.pct * s.weight;
      weightSum += s.weight;
    });
    return weightSum === 0 ? 0 : Math.round(weighted / weightSum);
  }, [sectionScores]);

  const band = riskBand(overallPct);
  const tier = recommendedTier(overallPct);

  // Top findings — find scored questions with low scores
  const topFindings = useMemo(() => {
    const findings: { q: Question; sectionTitle: string; score: number; answerLabel: string }[] = [];
    SECTIONS.filter((s) => s.id !== "fleet").forEach((s) => {
      s.questions.forEach((q) => {
        if (!q.scored) return;
        const idx = answers[q.n];
        if (typeof idx !== "number" || !q.options) return;
        const opt = q.options[idx];
        if (!opt || opt.na || opt.score >= 0.75) return;
        findings.push({ q, sectionTitle: s.title, score: opt.score, answerLabel: opt.label });
      });
    });
    findings.sort((a, b) => a.score - b.score);
    return findings.slice(0, 4);
  }, [answers]);

  // Civil penalty exposure
  const penaltyExposure = useMemo(() => {
    const high = topFindings.filter((f) => f.score < 0.5).length;
    if (high === 0) return null;
    const mult = FLEET_MULTIPLIER[fleetIdx] || 3;
    const low = high * 2250;
    const highEst = Math.round(high * 3855 * mult);
    return { low, high: highEst, count: high };
  }, [topFindings, fleetIdx]);

  const reportDate = new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

  function setAns(n: number, v: string | number) {
    setAnswers((p) => ({ ...p, [n]: v }));
  }
  function scrollTop() {
    setTimeout(() => topRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 30);
  }
  function nextStep() {
    if (stepIdx < SECTIONS.length - 1) { setStepIdx(stepIdx + 1); scrollTop(); }
    else { setShowResults(true); scrollTop(); }
  }
  function prevStep() {
    if (stepIdx > 0) { setStepIdx(stepIdx - 1); scrollTop(); }
  }
  function reset() {
    setAnswers({}); setStepIdx(0); setShowResults(false); setNotified(false); scrollTop();
  }

  return (
    <SiteShell>
      <div className="bg-[#000000] text-white">
        <div ref={topRef} />

        {!showResults ? (
          <>
            {/* PROGRESS HEADER */}
            <section className="max-w-4xl mx-auto px-6 pt-10 pb-6">
              <div className="relative bg-black border border-[#1E3556] rounded-2xl p-6 overflow-hidden">
                <div aria-hidden="true" className="absolute left-0 right-0 top-0 h-[3px]"
                  style={{ background: "linear-gradient(90deg, transparent 0%, rgba(22, 199, 255, 0.6) 50%, transparent 100%)" }} />
                <div className="flex flex-wrap items-start justify-between gap-4 pt-1">
                  <div>
                    <div className="text-[11px] tracking-[.18em] uppercase font-bold text-[#16C7FF] mb-2">
                      STEP {section.num} OF {SECTIONS.length} · X3 QUICK SAFETY AUDIT
                    </div>
                    <h1 className="text-[28px] sm:text-[34px] font-extrabold text-white leading-tight">
                      {section.title}
                    </h1>
                    {section.basic && (
                      <div className="text-[12px] font-mono text-white/55 mt-1">{section.basic}</div>
                    )}
                  </div>
                  <div className="text-right">
                    <div className="text-[10px] tracking-[.18em] uppercase font-bold text-white/55 mb-1">ANSWERED</div>
                    <div className="text-[28px] font-black leading-none">
                      <span style={{ color: "#16C7FF" }}>{answeredCount}</span>
                      <span className="text-white/40"> / {TOTAL_QUESTIONS}</span>
                    </div>
                  </div>
                </div>
                <div className="mt-5 flex gap-1.5">
                  {SECTIONS.map((s, i) => (
                    <div key={s.id} className="flex-1 h-1.5 rounded-full"
                      style={{
                        background:
                          i < stepIdx ? "#16C7FF" :
                          i === stepIdx ? "linear-gradient(90deg, #16C7FF, #1E3556)" :
                          "#1E3556",
                      }} />
                  ))}
                </div>
              </div>
            </section>

            {/* QUESTIONS */}
            <div className="max-w-4xl mx-auto px-6 pb-10 space-y-4">
              {section.questions.map((q) => {
                const current = answers[q.n];
                return (
                  <div key={q.n} className="relative bg-black border border-[#1E3556] rounded-2xl p-5 overflow-hidden">
                    <div aria-hidden="true" className="absolute left-0 right-0 top-0 h-[3px]"
                      style={{ background: "linear-gradient(90deg, transparent 0%, rgba(22, 199, 255, 0.6) 50%, transparent 100%)" }} />
                    <div className="flex items-center gap-2 mb-1 pt-2 flex-wrap">
                      <span className="text-[11px] text-white/55">Question {q.n} of {TOTAL_QUESTIONS}</span>
                      {q.required && (<span className="text-[11px] font-bold text-[#FF5C5C]">· Required</span>)}
                      {q.cfr && (<span className="text-[11px] font-mono text-[#16C7FF]">· {q.cfr}</span>)}
                    </div>
                    <p className="text-[16px] font-bold text-white mb-4 leading-snug">{q.q}</p>

                    {q.type === "radio" && q.options && (
                      <div className="space-y-2">
                        {q.options.map((opt, i) => {
                          const active = current === i;
                          return (
                            <button key={i} onClick={() => setAns(q.n, i)}
                              className={`w-full text-left px-4 py-3 rounded-xl border transition-colors flex items-center gap-3 ${
                                active
                                  ? "bg-[#16C7FF]/15 border-[#16C7FF] text-white"
                                  : "bg-black border-[#1E3556] text-white/80 hover:text-white hover:border-[#16C7FF]/60"
                              }`}>
                              <span className={`w-5 h-5 rounded-full border-2 flex-shrink-0 grid place-items-center transition-colors ${
                                active ? "border-[#16C7FF]" : "border-[#1E3556]"
                              }`}>
                                {active && <span className="w-2 h-2 rounded-full bg-[#16C7FF]" />}
                              </span>
                              <span className="text-[14px]">{opt.label}</span>
                            </button>
                          );
                        })}
                      </div>
                    )}

                    {(q.type === "text" || q.type === "email" || q.type === "tel") && (
                      <input type={q.type} value={(current as string) || ""}
                        onChange={(e) => setAns(q.n, e.target.value)}
                        placeholder="Type your answer..."
                        className="w-full bg-black border border-[#1E3556] focus:border-[#16C7FF] rounded-xl px-4 py-3 text-[15px] text-white placeholder:text-white/30 outline-none transition-colors" />
                    )}
                  </div>
                );
              })}
            </div>

            {/* NAV BAR */}
            <div className="max-w-4xl mx-auto px-6 pb-20">
              <div className="bg-black border border-[#1E3556] rounded-2xl p-4 flex items-center justify-between">
                <button onClick={prevStep} disabled={stepIdx === 0}
                  className={`px-5 py-2.5 rounded-full text-[13px] font-bold transition-colors ${
                    stepIdx === 0 ? "text-white/30 cursor-not-allowed" : "text-white/70 hover:text-white"
                  }`}>← Back</button>
                <button onClick={nextStep} disabled={!sectionComplete}
                  className="px-6 py-2.5 rounded-full text-[14px] font-bold transition-all"
                  style={
                    sectionComplete
                      ? { background: "linear-gradient(135deg, #16C7FF, #16C7FF)", color: "#000000", boxShadow: "0 4px 12px rgba(2, 6, 12, 0.45)" }
                      : { background: "#1E3556", color: "rgba(255, 255, 255, 0.4)", cursor: "not-allowed" }
                  }>
                  {stepIdx === SECTIONS.length - 1 ? "See my Score →" : "Next Section →"}
                </button>
              </div>
            </div>
          </>
        ) : (
          /* ═══════════════════════ RESULTS DASHBOARD ═══════════════════════ */
          <div className="max-w-6xl mx-auto px-6 pt-10 pb-16">

            {/* HEADER */}
            <div className="relative bg-black border border-[#1E3556] rounded-2xl overflow-hidden mb-6">
              <div aria-hidden="true" className="absolute left-0 right-0 top-0 h-[3px]"
                style={{ background: "linear-gradient(90deg, transparent 0%, rgba(22, 199, 255, 0.6) 50%, transparent 100%)" }} />
              <div className="px-6 py-6 flex flex-wrap items-center justify-between gap-4">
                <div>
                  <div className="text-[11px] tracking-[.18em] uppercase font-bold text-[#16C7FF] mb-1">
                    YOUR AUDIT DASHBOARD
                  </div>
                  <h1 className="text-[28px] sm:text-[34px] font-extrabold text-white leading-tight">{companyName}</h1>
                  <div className="text-[13px] text-white/65 mt-1">
                    USDOT {usdotNum} · {opLabel} · {authLabel}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-[10px] tracking-[.18em] uppercase font-bold text-white/55 mb-1">REPORT DATE</div>
                  <div className="text-[16px] font-bold text-[#16C7FF]">{reportDate}</div>
                </div>
              </div>
            </div>

            {/* TOP ROW: Score gauge + Category breakdown */}
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-5 mb-6">
              {/* SCORE GAUGE */}
              <div className="lg:col-span-2 relative bg-black border border-[#1E3556] rounded-2xl p-6 overflow-hidden">
                <div aria-hidden="true" className="absolute left-0 right-0 top-0 h-[3px]"
                  style={{ background: "linear-gradient(90deg, transparent 0%, rgba(22, 199, 255, 0.6) 50%, transparent 100%)" }} />
                <div className="text-[11px] tracking-[.18em] uppercase font-bold text-[#16C7FF] text-center mb-4 pt-1">
                  OVERALL SCORE
                </div>
                <div className="relative w-[200px] h-[200px] mx-auto">
                  <svg viewBox="0 0 200 200" className="w-full h-full -rotate-90">
                    <circle cx="100" cy="100" r="84" fill="none" stroke="#1E3556" strokeWidth="16" />
                    <circle cx="100" cy="100" r="84" fill="none"
                      stroke={band.color} strokeWidth="16" strokeLinecap="round"
                      strokeDasharray={`${(overallPct / 100) * 528} 528`}
                      style={{ filter: `drop-shadow(0 0 12px ${band.color}66)` }} />
                  </svg>
                  <div className="absolute inset-0 grid place-items-center">
                    <div className="text-center">
                      <div className="text-[64px] font-black leading-none" style={{ color: band.color }}>{overallPct}</div>
                      <div className="text-[11px] text-white/55 mt-1">out of 100</div>
                    </div>
                  </div>
                </div>
                <div className="text-center mt-5">
                  <span className="inline-block px-4 py-1.5 rounded-full text-[11px] font-bold uppercase tracking-wider"
                    style={{ background: `${band.color}25`, color: band.color, border: `1px solid ${band.color}` }}>
                    ● {band.label}
                  </span>
                </div>
                <p className="text-[13px] text-white/70 text-center mt-4 leading-snug">{band.verdict}</p>

                <div className="border-t border-[#1E3556] mt-5 pt-4">
                  <div className="text-[10px] tracking-[.18em] uppercase font-bold text-white/55 text-center mb-1">
                    RECOMMENDED TIER
                  </div>
                  <div className="text-center">
                    <div className="text-[20px] font-extrabold text-white">{tier.name}</div>
                    <div className="text-[12px] text-[#16C7FF]">{tier.price}</div>
                  </div>
                </div>
              </div>

              {/* CATEGORY BREAKDOWN */}
              <div className="lg:col-span-3 relative bg-black border border-[#1E3556] rounded-2xl p-6 overflow-hidden">
                <div aria-hidden="true" className="absolute left-0 right-0 top-0 h-[3px]"
                  style={{ background: "linear-gradient(90deg, transparent 0%, rgba(22, 199, 255, 0.6) 50%, transparent 100%)" }} />
                <div className="text-[11px] tracking-[.18em] uppercase font-bold text-[#16C7FF] mb-5 pt-1">
                  CATEGORY BREAKDOWN
                </div>
                <div className="space-y-4">
                  {sectionScores.map((s) => {
                    const sb = riskBand(s.pct);
                    return (
                      <div key={s.id}>
                        <div className="flex items-baseline justify-between mb-1.5">
                          <div className="flex items-center gap-2">
                            <span className="text-[16px]" aria-hidden="true">{s.icon}</span>
                            <div>
                              <div className="text-[14px] font-bold text-white">{s.title}</div>
                              <div className="text-[10px] font-mono text-white/45">{s.basic || "CSA & RECENT HISTORY"} · {Math.round(s.weight * 100)}% weight</div>
                            </div>
                          </div>
                          <div className="text-[22px] font-black leading-none" style={{ color: sb.color }}>
                            {s.pct}<span className="text-[11px] text-white/45 font-normal">/100</span>
                          </div>
                        </div>
                        <div className="h-2 rounded-full bg-[#1E3556] overflow-hidden">
                          <div className="h-full rounded-full transition-all"
                            style={{ width: `${s.pct}%`, background: sb.color }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* BOTTOM ROW: Top Findings + Penalty Exposure */}
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-5 mb-6">
              {/* TOP FINDINGS */}
              <div className="lg:col-span-3 relative bg-black border border-[#1E3556] rounded-2xl p-6 overflow-hidden">
                <div aria-hidden="true" className="absolute left-0 right-0 top-0 h-[3px]"
                  style={{ background: "linear-gradient(90deg, transparent 0%, rgba(22, 199, 255, 0.6) 50%, transparent 100%)" }} />
                <div className="text-[11px] tracking-[.18em] uppercase font-bold text-[#16C7FF] mb-4 pt-1">
                  TOP FINDINGS · RANKED BY SEVERITY
                </div>
                {topFindings.length === 0 ? (
                  <p className="text-[14px] text-white/65 italic">No critical findings detected. Keep it up.</p>
                ) : (
                  <ul className="space-y-3">
                    {topFindings.map((f) => {
                      const sev = findingSeverity(f.score);
                      return (
                        <li key={f.q.n} className="bg-[#0B1A2E] border border-[#1E3556] rounded-xl p-4 border-l-4"
                          style={{ borderLeftColor: sev.color }}>
                          <div className="flex items-start gap-3">
                            <span className="text-[10px] font-black px-2 py-1 rounded text-white flex-shrink-0"
                              style={{ background: sev.color }}>{sev.label}</span>
                            <div className="min-w-0 flex-1">
                              <p className="text-[13px] font-bold text-white leading-snug mb-1.5">{f.q.q}</p>
                              {f.q.cfr && (
                                <div className="text-[11px] font-mono text-[#16C7FF] mb-1">
                                  {f.q.cfr} · <span className="text-white/55 font-sans">{f.sectionTitle}</span>
                                </div>
                              )}
                              <div className="text-[11px] italic text-white/55">
                                Your answer: &ldquo;{f.answerLabel}&rdquo;
                              </div>
                            </div>
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>

              {/* PENALTY EXPOSURE */}
              <div className="lg:col-span-2 space-y-5">
                {penaltyExposure ? (
                  <div className="relative rounded-2xl p-6 border overflow-hidden"
                    style={{ background: "linear-gradient(135deg, rgba(255, 92, 92, 0.10), rgba(11, 26, 46, 0.6))", borderColor: "rgba(255, 92, 92, 0.45)" }}>
                    <div aria-hidden="true" className="absolute left-0 right-0 top-0 h-[3px]"
                      style={{ background: "linear-gradient(90deg, transparent 0%, rgba(255, 92, 92, 0.8) 50%, transparent 100%)" }} />
                    <div className="text-[11px] tracking-[.18em] uppercase font-bold mb-3 pt-1" style={{ color: "#FF5C5C" }}>
                      ESTIMATED CIVIL PENALTY EXPOSURE
                    </div>
                    <div className="text-[32px] sm:text-[36px] font-black leading-tight" style={{ color: "#FF5C5C" }}>
                      ${penaltyExposure.low.toLocaleString()}<span className="text-white/55 font-normal text-[20px]"> – </span>${penaltyExposure.high.toLocaleString()}
                    </div>
                    <p className="text-[11px] italic text-white/60 mt-3 leading-snug">
                      Estimated per 49 CFR Part 386 App. B, scaled by your fleet size. Actual penalties vary by willfulness, prior history, and which sections are cited.
                    </p>
                    <div className="border-t border-[#1E3556] mt-4 pt-3 text-[11px] text-white/55">
                      <span style={{ color: "#FF5C5C" }} className="font-bold">{penaltyExposure.count}</span> high-severity finding{penaltyExposure.count === 1 ? "" : "s"} driving this estimate.
                    </div>
                  </div>
                ) : (
                  <div className="relative rounded-2xl p-6 border overflow-hidden bg-black border-[#10B981]/40">
                    <div aria-hidden="true" className="absolute left-0 right-0 top-0 h-[3px]"
                      style={{ background: "linear-gradient(90deg, transparent 0%, rgba(16, 185, 129, 0.8) 50%, transparent 100%)" }} />
                    <div className="text-[11px] tracking-[.18em] uppercase font-bold text-[#10B981] mb-2 pt-1">
                      ESTIMATED CIVIL PENALTY EXPOSURE
                    </div>
                    <div className="text-[28px] font-black text-[#10B981] leading-tight">$0</div>
                    <p className="text-[12px] italic text-white/60 mt-2">No high-severity gaps detected. You&apos;re in a defensible position.</p>
                  </div>
                )}

                {/* CARRIER PROFILE */}
                <div className="relative bg-black border border-[#1E3556] rounded-2xl p-5 overflow-hidden">
                  <div aria-hidden="true" className="absolute left-0 right-0 top-0 h-[3px]"
                    style={{ background: "linear-gradient(90deg, transparent 0%, rgba(22, 199, 255, 0.6) 50%, transparent 100%)" }} />
                  <div className="text-[11px] tracking-[.18em] uppercase font-bold text-[#16C7FF] mb-3 pt-1">
                    CARRIER PROFILE
                  </div>
                  <dl className="space-y-2 text-[13px]">
                    <div className="flex justify-between gap-3">
                      <dt className="text-white/55 uppercase text-[10px] tracking-wider font-bold pt-0.5">FLEET</dt>
                      <dd className="text-white font-semibold text-right">{fleetLabel}</dd>
                    </div>
                    <div className="flex justify-between gap-3">
                      <dt className="text-white/55 uppercase text-[10px] tracking-wider font-bold pt-0.5">AUTHORITY</dt>
                      <dd className="text-white font-semibold text-right">{authLabel}</dd>
                    </div>
                    <div className="flex justify-between gap-3">
                      <dt className="text-white/55 uppercase text-[10px] tracking-wider font-bold pt-0.5">OPERATION</dt>
                      <dd className="text-white font-semibold text-right text-[12px]">{opLabel}</dd>
                    </div>
                  </dl>
                </div>
              </div>
            </div>

            {/* CTA BLOCK */}
            <div className="relative bg-black border border-[#16C7FF]/50 rounded-2xl p-8 text-center overflow-hidden">
              <div aria-hidden="true" className="absolute left-0 right-0 top-0 h-[3px]"
                style={{ background: "linear-gradient(90deg, transparent 0%, rgba(22, 199, 255, 0.8) 50%, transparent 100%)" }} />
              <h2 className="text-[26px] sm:text-[32px] font-extrabold text-white mb-3 leading-tight">
                Want help closing the gaps?{" "}
                <span className="serif-italic" style={{ color: "#16C7FF" }}>Talk to X3.</span>
              </h2>
              <p className="text-[14px] text-white/70 mb-6 max-w-2xl mx-auto leading-relaxed">
                Tap below and we&apos;ll send your audit results to the X3 team. A real safety advisor will reach out within one business day to walk through your score, your CSA exposure, and the most useful next moves — no obligation, no Calendly maze.
              </p>
              <div className="flex flex-wrap gap-3 justify-center">
                <a href="mailto:joshua@x3fleetsafety.com?subject=15-min audit — ready for follow-up"
                  onClick={() => setNotified(true)}
                  className="inline-flex items-center gap-2 px-7 py-3 rounded-full font-bold text-[15px] text-[#000000]"
                  style={{ background: "linear-gradient(135deg, #16C7FF, #16C7FF)", boxShadow: "0 6px 18px rgba(2, 6, 12, 0.45)" }}>
                  {notified ? "✓ Sent — we'll reach out shortly" : "★ Notify Us — I'm Ready"}
                </a>
                <button onClick={() => window.print()}
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-full font-bold text-[14px] text-white border border-white/25 hover:bg-white/5 transition-colors">
                  Download PDF
                </button>
                <Link href="/app/ask"
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-full font-bold text-[14px] text-white border border-white/25 hover:bg-white/5 transition-colors">
                  Ask Compass
                </Link>
              </div>
              <p className="text-[11px] text-white/45 mt-5 italic">
                We won&apos;t share your info. We won&apos;t pretend to be DOT. If we don&apos;t hear back in 5 days, we stop emailing.
              </p>
              <button onClick={reset} className="mt-4 text-[12px] text-white/50 hover:text-white underline underline-offset-4">
                Re-take the audit
              </button>
            </div>

            {/* DISCLAIMER */}
            <p className="text-[11px] text-white/45 mt-6 leading-relaxed">
              <strong className="text-white/75">Disclaimer.</strong> This is a self-assessment based on your answers, not a formal compliance audit. It is not legal advice. Always verify current requirements at FMCSA.dot.gov and engage qualified counsel for regulatory matters.
            </p>
          </div>
        )}
      </div>
    </SiteShell>
  );
}
