"use client";
import { useState } from "react";
export default function ROICalculator() {
  const [drivers, setDrivers] = useState(20);
  const monthly = drivers * 10;
  const saved = drivers * 45;
  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-6 space-y-4">
      <h3 className="text-lg font-black">ROI Calculator</h3>
      <label className="block text-[14px]">
        <span className="text-[var(--muted)]">Driver count:</span>
        <input type="number" value={drivers} min={1} max={500} onChange={(e) => setDrivers(Math.max(1, Number(e.target.value) || 1))} className="ml-3 px-3 py-1 rounded border border-[var(--border)] bg-[var(--bg)] text-[var(--fg)] w-24" />
      </label>
      <div className="grid grid-cols-2 gap-4">
        <div><div className="text-[12px] text-[var(--muted)]">Compass monthly</div><div className="text-2xl font-black">${monthly}</div></div>
        <div><div className="text-[12px] text-[var(--muted)]">Est. monthly savings</div><div className="text-2xl font-black text-emerald-600">${saved}</div></div>
      </div>
      <p className="text-[11px] text-[var(--muted)]">Based on industry average of $45/driver/month in compliance admin time saved.</p>
    </div>
  );
}
