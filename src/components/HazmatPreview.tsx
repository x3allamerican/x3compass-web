/**
 * Inline marketing-page preview of the X3 Compass Hazmat Center.
 * Shows: Placard Wizard input + result preview, segregation matrix,
 * UN1203 lookup card. Marketing context — no interaction required.
 */
export default function HazmatPreview() {
  return (
    <div className="rounded-2xl overflow-hidden border border-[var(--border)] shadow-[0_24px_72px_rgba(0,0,0,0.55)] text-left" style={{ background: "var(--bg)" }}>
      {/* Faux browser chrome */}
      <div className="flex items-center gap-2 px-4 py-3 bg-[var(--bg-3)] border-b border-[var(--border)]">
        <div className="flex gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-[#FF5F57]" />
          <span className="w-2.5 h-2.5 rounded-full bg-[#FEBC2E]" />
          <span className="w-2.5 h-2.5 rounded-full bg-[#28C840]" />
        </div>
        <div className="flex-1 mx-3 px-3 py-1 rounded-md bg-[var(--bg)] border border-[var(--border)] text-[10px] text-[var(--fg-faint)] font-mono truncate">
          x3compass.com/hazmat
        </div>
      </div>

      {/* Header strip */}
      <div className="px-5 py-4 border-b border-[var(--border)] bg-[var(--surface-3)] flex items-center justify-between gap-3 flex-wrap">
        <div>
          <div className="text-[9px] tracking-[.16em] uppercase font-extrabold text-[var(--accent)] mb-0.5">
            X3 COMPASS · HAZMAT CENTER · 49 CFR PARTS 172–180
          </div>
          <h3 className="text-[var(--fg)] font-extrabold text-[16px]">100 hazmat skills · live tools</h3>
        </div>
        <span className="text-[10px] font-bold text-amber-700 dark:text-amber-300 bg-amber-500/10 border border-amber-500/30 px-2 py-1 rounded-full">
          ⚠ Hazmat add-on · $99/mo
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-[1.2fr_1fr] gap-3 p-4">
        {/* Placard Wizard card */}
        <div className="rounded-xl border border-[var(--border)] p-4" style={{ background: "linear-gradient(180deg, var(--surface) 0%, var(--surface-3) 100%)" }}>
          <div className="text-[9px] tracking-[.16em] uppercase font-extrabold text-[var(--accent)] mb-2">
            ★ TOOL 1 · PLACARD WIZARD
          </div>
          <div className="text-[var(--fg)] font-bold text-[13px] mb-3">Lookup: 4,000 lbs · UN1203</div>

          {/* Faux input rows */}
          <div className="space-y-2 mb-3">
            <div className="flex items-center gap-2 text-[10.5px]">
              <span className="text-[var(--fg-muted)] w-12 flex-shrink-0">UN #</span>
              <span className="font-mono text-[var(--fg)] bg-[var(--bg)] border border-[var(--border)] rounded px-2 py-1 flex-1">UN1203</span>
            </div>
            <div className="flex items-center gap-2 text-[10.5px]">
              <span className="text-[var(--fg-muted)] w-12 flex-shrink-0">Weight</span>
              <span className="font-mono text-[var(--fg)] bg-[var(--bg)] border border-[var(--border)] rounded px-2 py-1 flex-1">4,000 lbs</span>
            </div>
          </div>

          {/* Result */}
          <div className="rounded-lg p-3 border" style={{
            background: "linear-gradient(135deg, rgba(34, 211, 238, 0.10), rgba(15, 28, 50, 0.5))",
            borderColor: "rgba(34, 211, 238, 0.30)",
          }}>
            <div className="flex items-center gap-3 mb-2">
              {/* Diamond placard */}
              <div className="w-14 h-14 relative flex-shrink-0" style={{ transform: "rotate(45deg)" }}>
                <div className="absolute inset-0 bg-[#E11D48] rounded-sm grid place-items-center" style={{ transform: "rotate(-45deg)" }}>
                  <div className="text-center">
                    <div className="text-[var(--fg)] font-black text-[8.5px] leading-none">FLAMMABLE</div>
                    <div className="text-[var(--fg)] font-black text-[15px] leading-none mt-0.5">3</div>
                    <div className="text-[var(--fg)] font-mono text-[7.5px] mt-0.5">UN1203</div>
                  </div>
                </div>
              </div>
              <div>
                <div className="text-[10.5px] text-[var(--fg-muted)]">Placards required (4):</div>
                <div className="text-[var(--fg)] font-bold text-[12px]">Both sides + both ends</div>
                <div className="text-[10px] text-emerald-700 dark:text-emerald-300 mt-0.5">✓ Above 1,001 lb threshold</div>
              </div>
            </div>
            <div className="text-[10px] text-[var(--fg-muted)] leading-relaxed pt-2 border-t border-[var(--border)]/60">
              <strong className="text-[var(--fg)]">Driver requires:</strong> CDL with H endorsement · TSA threat assessment · ERG copy in cab · § 397.19 instructions.
            </div>
          </div>
        </div>

        {/* Right column: Segregation + ERG quick-link */}
        <div className="space-y-3">
          {/* Segregation matrix card */}
          <div className="rounded-xl border border-[var(--border)] p-4" style={{ background: "linear-gradient(180deg, var(--surface) 0%, var(--surface-3) 100%)" }}>
            <div className="text-[9px] tracking-[.16em] uppercase font-extrabold text-[var(--accent)] mb-2">
              ★ TOOL 2 · SEGREGATION MATRIX · § 177.848
            </div>
            <div className="text-[var(--fg)] font-bold text-[12px] mb-2">Class 3 + Class 8</div>
            <div className="rounded-lg border border-[var(--border)] overflow-hidden">
              <table className="w-full text-[10px]">
                <thead className="bg-[var(--bg-3)]">
                  <tr>
                    <th className="text-left text-[var(--fg-faint)] font-bold p-1.5"></th>
                    <th className="text-center text-[var(--fg-faint)] font-bold p-1.5">Cl 3</th>
                    <th className="text-center text-[var(--fg-faint)] font-bold p-1.5">Cl 5.1</th>
                    <th className="text-center text-[var(--fg-faint)] font-bold p-1.5">Cl 8</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-t border-[var(--border)]">
                    <td className="text-[var(--fg-muted)] font-bold p-1.5">Cl 3</td>
                    <td className="text-center text-[var(--fg-faint)] p-1.5">—</td>
                    <td className="text-center text-rose-700 dark:text-rose-300 p-1.5">X</td>
                    <td className="text-center bg-[var(--accent)]/15 text-[var(--accent)] font-bold p-1.5">O</td>
                  </tr>
                  <tr className="border-t border-[var(--border)]">
                    <td className="text-[var(--fg-muted)] font-bold p-1.5">Cl 8</td>
                    <td className="text-center text-[var(--accent)] font-bold p-1.5">O</td>
                    <td className="text-center text-rose-700 dark:text-rose-300 p-1.5">X</td>
                    <td className="text-center text-[var(--fg-faint)] p-1.5">—</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div className="mt-2 text-[10px] text-emerald-700 dark:text-emerald-300 font-bold">
              ✓ Loadable together with separation
            </div>
          </div>

          {/* Skill grid mini */}
          <div className="rounded-xl border border-[var(--border)] p-3" style={{ background: "linear-gradient(180deg, var(--surface) 0%, var(--surface-3) 100%)" }}>
            <div className="text-[9px] tracking-[.16em] uppercase font-extrabold text-[var(--accent)] mb-2">
              ★ TOOL 3 · 100 HAZMAT SKILLS · ASK COMPASS
            </div>
            <div className="grid grid-cols-2 gap-1.5">
              {[
                { c: "Class 1", n: "Explosive divisions" },
                { c: "§ 397.5", n: "Attendance rules" },
                { c: "TSA H", n: "Endorsement clock" },
                { c: "ERG 2024", n: "Emergency lookup" },
              ].map((s, i) => (
                <div key={i} className="rounded p-2 border border-[var(--border)] text-[9.5px]" style={{ background: "var(--surface-3)" }}>
                  <div className="font-mono text-[var(--accent)] text-[8px] mb-0.5">{s.c}</div>
                  <div className="text-[var(--fg)] font-bold leading-tight">{s.n}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
