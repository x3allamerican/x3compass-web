"use client";

import { useState, useMemo } from "react";
import Placard, { HazardClass } from "@/components/Placard";
import {
  Substance,
  searchSubstances,
  lookupSubstance,
  getSegregationCode,
  placardingThresholdSummary,
  UN_SUBSTANCES,
} from "@/data/un-substances";

/**
 * Interactive Placard Wizard.
 *
 * The user types a UN number, substance name, or common name. Compass looks
 * up the substance and renders the live DOT-compliant placard with all
 * placarding, segregation, and ERG requirements.
 */
export default function PlacardWizardLive() {
  const [query, setQuery] = useState("");
  const [weight, setWeight] = useState<number | "">(4000);
  const [picked, setPicked] = useState<Substance | null>(
    UN_SUBSTANCES.find((s) => s.un === "1203") ?? null,
  );

  const suggestions = useMemo(() => {
    if (!query || query === picked?.commonName || query === picked?.name || query === picked?.un) return [];
    return searchSubstances(query, 6);
  }, [query, picked]);

  const subject = picked;

  // Compute placard class (use subclass if present, else class)
  const placardClass = (subject?.subclass ?? subject?.class ?? "3") as HazardClass;

  // Placarding decision
  const placardRequired = useMemo(() => {
    if (!subject) return null;
    if (subject.placardThresholdLb === null) return { required: true, reason: "Table 1 — any quantity requires placarding" };
    const w = typeof weight === "number" ? weight : 0;
    return {
      required: w >= subject.placardThresholdLb,
      reason: w >= subject.placardThresholdLb
        ? `Aggregate weight ${w.toLocaleString()} lbs ≥ ${subject.placardThresholdLb.toLocaleString()} lb threshold`
        : `Aggregate weight ${w.toLocaleString()} lbs is below the ${subject.placardThresholdLb.toLocaleString()} lb threshold — no placarding required`,
    };
  }, [subject, weight]);

  // Segregation conflicts — find common classes that conflict with this one
  const segregationConflicts = useMemo(() => {
    if (!subject) return [];
    const ours = subject.subclass ?? subject.class;
    const conflicts: { cls: string; code: string; label: string }[] = [];
    for (const c of ["1", "1.4", "2.1", "2.3", "3", "4.1", "4.2", "4.3", "5.1", "5.2", "6.1", "7", "8"]) {
      if (c === ours) continue;
      const code = getSegregationCode(ours, c);
      if (code === "X" || code === "A") {
        conflicts.push({
          cls: c,
          code,
          label: code === "X" ? "Prohibited" : "Away from",
        });
      }
    }
    return conflicts;
  }, [subject]);

  return (
    <div className="bg-[#15233D] border border-[#1E3556] rounded-2xl p-6 text-left max-w-3xl mx-auto">
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_220px] gap-6 items-start">
        {/* LEFT: Form + result */}
        <div>
          {/* Input row */}
          <div className="grid grid-cols-1 sm:grid-cols-[1fr_1fr] gap-3 mb-3">
            <div className="relative">
              <label className="text-[10px] tracking-[.14em] uppercase font-bold text-white/55 block mb-1">
                UN number or substance
              </label>
              <input
                type="text"
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  const found = lookupSubstance(e.target.value);
                  if (found) setPicked(found);
                }}
                placeholder="UN1203, gasoline, sulfuric acid…"
                className="w-full bg-[#0A1929] border border-[#1E3556] rounded-lg px-4 py-3 text-white text-[15px] font-mono focus:outline-none focus:border-[#22D3EE]"
              />
              {suggestions.length > 0 && (
                <div className="absolute z-30 left-0 right-0 top-full mt-1 bg-[#0F1C32] border border-[#22D3EE]/40 rounded-lg overflow-hidden shadow-[0_18px_50px_rgba(0,0,0,0.55)]">
                  {suggestions.map((s) => (
                    <button
                      key={s.un + s.name}
                      onClick={() => {
                        setPicked(s);
                        setQuery(s.commonName ?? s.name);
                      }}
                      className="w-full text-left px-3 py-2 hover:bg-[#22D3EE]/10 border-b border-[#1E3556] last:border-0"
                    >
                      <div className="flex items-center gap-2 text-[12px]">
                        <span className="font-mono text-[#22D3EE] font-bold">UN{s.un}</span>
                        <span className="text-white font-semibold">{s.commonName ?? s.name}</span>
                        <span className="ml-auto text-[10px] text-white/55 font-mono">
                          Class {s.subclass ?? s.class}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div>
              <label className="text-[10px] tracking-[.14em] uppercase font-bold text-white/55 block mb-1">
                Aggregate weight (lbs)
              </label>
              <input
                type="number"
                value={weight}
                onChange={(e) => setWeight(e.target.value === "" ? "" : Number(e.target.value))}
                placeholder="4000"
                className="w-full bg-[#0A1929] border border-[#1E3556] rounded-lg px-4 py-3 text-white text-[15px] font-mono focus:outline-none focus:border-[#22D3EE]"
              />
            </div>
          </div>

          {/* Compass result */}
          {subject && placardRequired && (
            <div
              className="rounded-xl p-4 border"
              style={{
                background: placardRequired.required
                  ? "linear-gradient(135deg, rgba(225, 29, 44, 0.10), rgba(15, 28, 50, 0.5))"
                  : "linear-gradient(135deg, rgba(34, 211, 238, 0.08), rgba(15, 28, 50, 0.5))",
                borderColor: placardRequired.required ? "rgba(225, 29, 44, 0.40)" : "rgba(34, 211, 238, 0.30)",
              }}
            >
              <div className="text-[11px] tracking-[.14em] uppercase font-extrabold text-[#22D3EE] mb-2">
                ⚡ Compass · {placardRequired.required ? "PLACARDING REQUIRED" : "No placarding required at this weight"}
              </div>
              <div className="text-white text-[14px] font-bold mb-1">
                {subject.commonName ?? subject.name}
              </div>
              <div className="text-[12px] text-white/65 leading-relaxed mb-3">
                <strong className="text-white">UN{subject.un}</strong> · Class {subject.subclass ?? subject.class}{subject.pg ? ` · PG ${subject.pg}` : ""} · ERG Guide{" "}
                <strong className="font-mono text-[#22D3EE]">{subject.erg}</strong>
              </div>
              <div className="text-[12.5px] text-white/85 leading-relaxed mb-3">
                {placardRequired.reason}.
                {placardRequired.required && " Apply the placard shown on the right to all 4 sides of the vehicle (both sides + both ends), visible from a distance per § 172.516(c)."}
              </div>

              {placardRequired.required && (
                <>
                  <div className="text-[10px] tracking-[.14em] uppercase font-bold text-white/55 mb-2">
                    Driver requirements
                  </div>
                  <ul className="text-[12px] text-white/80 space-y-1 mb-3">
                    <li>• <strong className="text-white">HazMat (H) endorsement</strong> on CDL</li>
                    <li>• <strong className="text-white">TSA Security Threat Assessment</strong> (renew every 5 years)</li>
                    <li>• <strong className="text-white">Emergency Response Information</strong> (ERG Guide {subject.erg}) in cab</li>
                    <li>• <strong className="text-white">Shipping papers</strong> per § 172.200 with proper shipping name, UN#, class, PG</li>
                    {subject.class === "1" && (
                      <li>• <strong className="text-white">Written route plan</strong> required for explosives per § 397.67</li>
                    )}
                    {subject.class === "7" && (
                      <li>• <strong className="text-white">Highway route-controlled quantity</strong> rules may apply (Class 7)</li>
                    )}
                  </ul>
                </>
              )}

              {segregationConflicts.length > 0 && (
                <>
                  <div className="text-[10px] tracking-[.14em] uppercase font-bold text-white/55 mb-2">
                    Segregation (§ 177.848)
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {segregationConflicts.map((c) => (
                      <span
                        key={c.cls}
                        className={`text-[10px] font-bold px-2 py-1 rounded ${
                          c.code === "X"
                            ? "bg-rose-500/15 text-rose-300 border border-rose-500/40"
                            : "bg-amber-500/15 text-amber-300 border border-amber-500/40"
                        }`}
                      >
                        Class {c.cls} · {c.label}
                      </span>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        {/* RIGHT: Live placard preview */}
        <div className="flex flex-col items-center">
          <div className="text-[10px] tracking-[.14em] uppercase font-bold text-[#22D3EE] mb-3">
            Required placard
          </div>
          {subject && placardRequired?.required ? (
            <>
              <Placard
                hazardClass={placardClass}
                unNumber={subject.un}
                size={200}
              />
              <div className="text-[10px] text-white/55 mt-3 text-center font-mono leading-relaxed">
                4 required<br />both sides + both ends
              </div>
              <button
                onClick={async () => {
                  // Download the real Wikimedia-sourced SVG for this class
                  try {
                    const cls = String(placardClass).replace(".", "-");
                    const src = `/placards/class-${cls}.svg`;
                    const res = await fetch(src);
                    const blob = await res.blob();
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement("a");
                    a.href = url;
                    a.download = `placard-class-${placardClass}-UN${subject.un}.svg`;
                    a.click();
                    URL.revokeObjectURL(url);
                  } catch (e) {
                    console.error("placard download failed", e);
                  }
                }}
                className="mt-3 text-[11px] font-bold text-[#22D3EE] hover:underline"
              >
                ⬇ Download placard SVG
              </button>
            </>
          ) : subject ? (
            <div className="rounded-lg p-4 border border-emerald-500/40 bg-emerald-500/5 text-center">
              <div className="text-emerald-300 text-[32px] mb-1">✓</div>
              <div className="text-[12px] text-white/75">Under threshold — no placard required at this weight</div>
            </div>
          ) : (
            <div className="text-[11px] text-white/45 italic text-center">
              Type a UN number or substance name to see the placard
            </div>
          )}
        </div>
      </div>

      <div className="border-t border-[#1E3556] mt-5 pt-4 text-[11px] text-white/45">
        <strong className="text-white/65">Disclaimer:</strong> This wizard runs against the most common 80+ UN substances per § 172.101 and provides general placarding guidance per § 172.504 + segregation guidance per § 177.848. Always verify against the most current Hazardous Materials Table and your specific shipper&apos;s instructions. Compass output is informational, not a substitute for trained hazmat compliance review.
      </div>
    </div>
  );
}
