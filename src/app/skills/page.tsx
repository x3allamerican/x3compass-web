"use client";

import Link from "next/link";
import { useState, useMemo } from "react";
import SiteShell from "@/components/SiteShell";
import catalog from "@/data/skills.json";

type Skill = {
  id: string;
  name: string;
  cfr: string;
  cat: string;
  q: string;
  status: "published" | "coming-soon";
  preview?: boolean;
};

const SKILLS = catalog as Skill[];

// Category sort weights (higher = first)
const CAT_ORDER: Record<string, number> = {
  "DQ Files": 100, "Medical": 95, "MVR": 90, "Background": 85,
  "D&A Testing": 80, "Clearinghouse": 78,
  "HOS / ELD": 70, "Vehicles & PM": 65, "Inspections": 60,
  "CSA Scoring": 55, "DataQ": 53,
  "Training": 50, "Accidents": 45, "Cargo Securement": 40, "IFTA / Fuel Tax": 35,
  "Hazmat": 30, "Insurance": 25, "Records": 20, "Audits": 18, "Authority": 15,
  "Financial": 10, "Cross-border": 5, "Hiring": 3, "Workers Comp": 2,
  "General Compliance": 1,
};

const CATEGORY_DESCRIPTIONS: Record<string, string> = {
  "DQ Files": "Driver qualification files — § 391.51 the twelve documents",
  "Medical": "Medical examiner certificates, sleep apnea, vision standards",
  "MVR": "Motor vehicle records, annual reviews, continuous monitoring",
  "Background": "FCRA-compliant background checks, prior-employer inquiries",
  "D&A Testing": "Drug & alcohol — pre-employment, random, post-accident, RTD",
  "Clearinghouse": "FMCSA Clearinghouse queries and reporting",
  "HOS / ELD": "Hours of service, ELD compliance, RODS, exceptions",
  "Vehicles & PM": "Preventive maintenance, annual DOT inspection, DVIRs",
  "Inspections": "Roadside inspections, levels, OOS responses",
  "CSA Scoring": "BASIC scores, percentiles, intervention thresholds",
  "DataQ": "Inspection challenges, evidence standards, win patterns",
  "Training": "ELDT, defensive driving, refreshers, supervisor training",
  "Accidents": "DOT-recordable definitions, accident register, investigation",
  "Cargo Securement": "Working load limits, tiedowns, commodity-specific rules",
  "IFTA / Fuel Tax": "IFTA quarterlies, IRP, fuel reporting, jurisdiction allocation",
  "Hazmat": "Placarding, segregation, ERG, security plans, TSA-H endorsement",
  "Insurance": "MCS-90, cargo liability, BMC filings, claim workflows",
  "Records": "Retention schedules by record type, electronic records, audit packs",
  "Audits": "Compliance reviews, safety audits, off-site investigations",
  "Authority": "MC numbers, DOT numbers, reinstatement, MCS-150 updates",
  "Financial": "BMC-91 filings, insurance proof, financial responsibility",
  "Cross-border": "Canada / Mexico operating, manifest filing",
  "Hiring": "Employment applications, driver qualification, onboarding",
  "Workers Comp": "Driver injury, return-to-work, OSHA reporting",
  "General Compliance": "Cross-cutting FMCSA topics",
};

function tally(skills: Skill[]) {
  const counts = new Map<string, number>();
  for (const s of skills) counts.set(s.cat, (counts.get(s.cat) || 0) + 1);
  return Array.from(counts.entries())
    .sort((a, b) => (CAT_ORDER[b[0]] || 0) - (CAT_ORDER[a[0]] || 0))
    .map(([cat, n]) => ({ cat, n }));
}

export default function SkillsCatalogPage() {
  const [filter, setFilter] = useState<string>("ALL");
  const [statusFilter, setStatusFilter] = useState<"all" | "published" | "coming-soon">("all");
  const [search, setSearch] = useState<string>("");

  const filtered = useMemo(() => {
    return SKILLS.filter((s) => {
      if (filter !== "ALL" && s.cat !== filter) return false;
      if (statusFilter !== "all" && s.status !== statusFilter) return false;
      if (search.trim()) {
        const q = search.toLowerCase();
        return s.name.toLowerCase().includes(q) || s.cfr.toLowerCase().includes(q) || s.q.toLowerCase().includes(q);
      }
      return true;
    });
  }, [filter, statusFilter, search]);

  const catBuckets = tally(SKILLS);
  const totalPublished = SKILLS.filter((s) => s.status === "published").length;
  const totalComing = SKILLS.filter((s) => s.status === "coming-soon").length;

  return (
    <SiteShell>
      <div className="bg-[var(--bg)] text-[var(--fg)] min-h-screen">
        {/* Hero with real compliance-folder photo */}
        <section className="relative overflow-hidden border-b border-[var(--border)]">
          <div className="absolute inset-0 -z-10">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/photos/compliance-folder.jpg" alt="" aria-hidden="true" width="2400" height="1600" loading="lazy" decoding="async" className="w-full h-full object-cover opacity-20" />
            <div className="absolute inset-0 bg-gradient-to-b from-[var(--bg)]/85 via-[var(--bg)]/95 to-[var(--bg)]" />
          </div>
          <div className="max-w-7xl mx-auto px-6 pt-16 pb-12 relative">
            <Link href="/" className="text-[12px] text-[var(--fg-muted)] hover:text-[var(--fg)] inline-flex items-center gap-2 mb-6">
              ← Back to home
            </Link>
            <div className="text-[11px] tracking-[.18em] uppercase font-bold text-[#22D3EE] mb-3">
              THE COMPASS SKILL LIBRARY · OPEN-SOURCED ON GITHUB
            </div>
            <h1 className="text-[36px] sm:text-[48px] font-extrabold tracking-tight text-[var(--fg)] mb-3 leading-tight">
              All 300 FMCSA skills.{" "}
              <span className="serif-italic" style={{ color: "#22D3EE" }}>One library.</span>
            </h1>
            <p className="text-[16px] text-[var(--fg-muted)] max-w-3xl mb-8">
              Every Compass skill is a published, version-controlled prompt with the actual CFR section it answers from. All {totalPublished} live now in {catBuckets.length} categories.{" "}
              <a
                href="https://github.com/x3fleetsafety/skills"
                target="_blank"
                rel="noopener"
                className="text-[#22D3EE] font-bold hover:underline"
              >
                Audit the source on GitHub ↗
              </a>
            </p>

            {/* Stat strip */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
              {[
                { l: "Published skills", v: totalPublished, c: "#22D3EE" },
                { l: "Categories", v: catBuckets.length, c: "#A78BFA" },
                { l: "Apache 2.0 licensed", v: "Open source", c: "#10B981", small: true },
                { l: "CFR coverage", v: "Parts 380–399 + Part 172–180", c: "#FBBF24", small: true },
              ].map((s, i) => (
                <div key={i} className="rounded-2xl p-4 border border-[var(--border)]" style={{ background: "linear-gradient(180deg, #15233D 0%, #0F1C32 100%)" }}>
                  <div className="text-[10px] tracking-[.14em] uppercase font-bold text-white/50 mb-1">{s.l}</div>
                  <div className={`${s.small ? "text-[15px]" : "text-[28px]"} font-black leading-none`} style={{ color: s.c }}>
                    {s.v}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Filter bar */}
        <section className="bg-[var(--bg-3)] border-b border-[var(--border)] sticky top-16 z-30 backdrop-blur-md">
          <div className="max-w-7xl mx-auto px-6 py-4 flex flex-wrap items-center gap-3">
            {/* Search */}
            <div className="relative flex-1 min-w-[200px]">
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by skill name, CFR section, or question…"
                className="w-full bg-[var(--surface-3)] border border-[var(--border)] rounded-full pl-10 pr-4 py-2.5 text-[13px] text-[var(--fg)] placeholder:text-white/35 focus:outline-none focus:border-[#22D3EE]"
              />
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/40">🔍</span>
            </div>

            {/* Status pill — only shown when there are coming-soon entries */}
            {totalComing > 0 && (
              <div className="flex items-center gap-1 rounded-full border border-[var(--border)] p-1 bg-[var(--surface-3)]">
                {(["all", "published", "coming-soon"] as const).map((opt) => (
                  <button
                    key={opt}
                    onClick={() => setStatusFilter(opt)}
                    className={`px-3 py-1.5 rounded-full text-[11px] font-bold transition-colors ${
                      statusFilter === opt ? "text-[var(--bg)] bg-[#22D3EE]" : "text-[var(--fg-muted)] hover:text-white"
                    }`}
                  >
                    {opt === "all" ? "All" : opt === "published" ? `Live · ${totalPublished}` : `Roadmap · ${totalComing}`}
                  </button>
                ))}
              </div>
            )}

            <div className="text-[11px] text-[var(--fg-muted)] font-mono">
              Showing <strong className="text-[var(--fg)]">{filtered.length}</strong> of {SKILLS.length}
            </div>
          </div>

          {/* Category chips */}
          <div className="max-w-7xl mx-auto px-6 pb-4 flex flex-wrap gap-1.5">
            <button
              onClick={() => setFilter("ALL")}
              className={`px-3 py-1.5 rounded-full text-[11px] font-bold border transition-colors ${
                filter === "ALL" ? "bg-[#22D3EE]/15 border-[#22D3EE] text-white" : "border-[var(--border)] text-[var(--fg-muted)] hover:text-white"
              }`}
            >
              All · {SKILLS.length}
            </button>
            {catBuckets.map(({ cat, n }) => (
              <button
                key={cat}
                onClick={() => setFilter(cat)}
                className={`px-3 py-1.5 rounded-full text-[11px] font-bold border transition-colors ${
                  filter === cat ? "bg-[#22D3EE]/15 border-[#22D3EE] text-white" : "border-[var(--border)] text-[var(--fg-muted)] hover:text-white"
                }`}
              >
                {cat} · {n}
              </button>
            ))}
          </div>
        </section>

        {/* Catalog grid */}
        <section className="max-w-7xl mx-auto px-6 py-10">
          {filter !== "ALL" && CATEGORY_DESCRIPTIONS[filter] && (
            <div className="mb-6 rounded-xl px-4 py-3 border border-[var(--border)] text-[13px] text-[var(--fg-muted)]" style={{ background: "linear-gradient(180deg, #15233D 0%, #0F1C32 100%)" }}>
              <strong className="text-[#22D3EE]">{filter}</strong> · {CATEGORY_DESCRIPTIONS[filter]}
            </div>
          )}

          {filtered.length === 0 ? (
            <div className="text-center py-20">
              <div className="text-[48px] mb-3">🔍</div>
              <div className="text-[var(--fg)] font-bold mb-2">No skills match your filters</div>
              <button onClick={() => { setFilter("ALL"); setStatusFilter("all"); setSearch(""); }} className="text-[12px] text-[#22D3EE] font-bold hover:underline">
                Clear filters →
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {filtered.map((s) => (
                <SkillTile key={s.id} skill={s} />
              ))}
            </div>
          )}
        </section>

        {/* Bottom CTA */}
        <section className="bg-[var(--bg-3)] border-t border-[var(--border)] py-16">
          <div className="max-w-3xl mx-auto px-6 text-center">
            <div className="text-[11px] tracking-[.18em] uppercase font-bold text-[#22D3EE] mb-3">
              EVERY SKILL · INSIDE EVERY COMPASS SUBSCRIPTION
            </div>
            <h2 className="text-[28px] sm:text-[36px] font-extrabold tracking-tight text-[var(--fg)] mb-3 leading-tight">
              All 300 unlock with one signup.
            </h2>
            <p className="text-[15px] text-[var(--fg-muted)] mb-6">
              DIY $25/driver · DFY $50/driver · 7-day free trial, no card required.
            </p>
            <Link
              href="/signup"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-full font-bold text-[15px] text-[var(--bg)]"
              style={{ background: "linear-gradient(135deg, #22D3EE, #06B6D4)", boxShadow: "0 6px 18px rgba(34, 211, 238, 0.32)" }}
            >
              ★ Start free trial →
            </Link>
          </div>
        </section>
      </div>
    </SiteShell>
  );
}

function SkillTile({ skill }: { skill: Skill }) {
  const isComing = skill.status === "coming-soon";
  return (
    <div
      className={`rounded-xl p-4 border transition-all relative ${
        isComing ? "border-[var(--border)] bg-[var(--surface-3)]/50" : "border-[var(--border)] hover:border-[#22D3EE]/40"
      }`}
      style={!isComing ? { background: "linear-gradient(180deg, #15233D 0%, #0F1C32 100%)" } : undefined}
    >
      <div className="flex items-center gap-2 flex-wrap mb-2">
        <span className="text-[9.5px] font-bold tracking-wider text-[#22D3EE] bg-[#22D3EE]/10 border border-[#22D3EE]/25 px-2 py-0.5 rounded-full font-mono">
          {skill.cfr}
        </span>
        <span className="text-[9px] font-extrabold uppercase tracking-wider text-[var(--fg-faint)]">
          {skill.cat}
        </span>
        {skill.preview && (
          <span className="text-[9px] font-extrabold tracking-wider text-[var(--bg)] bg-[#22D3EE] px-2 py-0.5 rounded-full">
            ★ PREVIEW
          </span>
        )}
        {isComing && (
          <span className="text-[9px] font-extrabold tracking-wider text-amber-300 bg-amber-500/10 border border-amber-500/25 px-2 py-0.5 rounded-full">
            COMING Q3
          </span>
        )}
      </div>
      <div className={`text-[14px] font-bold mb-1 ${isComing ? "text-[var(--fg-muted)]" : "text-white"}`}>
        {skill.name}
      </div>
      {skill.q && (
        <div className="text-[12px] italic text-[var(--fg-muted)] line-clamp-2">&ldquo;{skill.q}&rdquo;</div>
      )}
    </div>
  );
}
