"use client";

/* Tiny client island — just the live UN→placard demo.
   Kept narrow on purpose so the parent /app/hazmat/page.tsx
   can stay a Server Component and prerender statically. */

import { useEffect, useRef, useState } from "react";

const DEMO_DATA: Record<string, { name: string; cls: string; classDesc: string }> = {
  "1203": { name: "Gasoline",                  cls: "3",   classDesc: "Class 3 · Flammable Liquid · PG II" },
  "1993": { name: "Flammable Liquid, n.o.s.",  cls: "3",   classDesc: "Class 3 · Flammable Liquid · PG II/III" },
  "3480": { name: "Lithium-Ion Batteries",     cls: "9",   classDesc: "Class 9 · Misc Dangerous Goods · No PG" },
  "1830": { name: "Sulfuric Acid",             cls: "8",   classDesc: "Class 8 · Corrosive · PG II" },
  "1075": { name: "Liquefied Petroleum Gases (LPG)", cls: "2.1", classDesc: "Class 2.1 · Flammable Gas · No PG" },
};

declare global {
  // eslint-disable-next-line no-var
  var renderPlacardSvg: ((cls: string, un: string, size: number) => string) | undefined;
}

export default function HazmatPlacardDemo() {
  const [un, setUn] = useState("1203");
  const placardWrapRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const data = DEMO_DATA[un];
    const wrap = placardWrapRef.current;
    if (!wrap || !data) return;
    const render = () => {
      if (typeof window.renderPlacardSvg === "function") {
        wrap.innerHTML = window.renderPlacardSvg(data.cls, un, 200);
      } else {
        wrap.innerHTML = `<div style="width:200px;height:200px;background:rgba(0,178,253,0.1);border:2px solid #00B2FD;border-radius:8px;display:flex;align-items:center;justify-content:center;color:#67E8F9;font-weight:800;">UN ${un}</div>`;
      }
    };
    render();
    // Script may load after first paint; retry once.
    const timer = setTimeout(render, 250);
    return () => clearTimeout(timer);
  }, [un]);

  const handleUnChange = (next: string) => {
    const cleaned = next.replace(/\D/g, "").trim();
    setUn(cleaned || "1203");
  };
  const data = DEMO_DATA[un] ?? DEMO_DATA["1203"];

  return (
    <div className="hz-demo-stage">
      <div className="hz-demo-input-block">
        <label htmlFor="demo-un-input">UN / NA ID</label>
        <input
          id="demo-un-input"
          className="hz-demo-input"
          type="text"
          inputMode="numeric"
          placeholder="1203"
          value={un}
          autoComplete="off"
          aria-describedby="demo-suggestions"
          onChange={(e) => handleUnChange(e.target.value)}
        />
        <div className="hz-demo-suggestions" id="demo-suggestions" aria-label="Try these examples">
          {Object.keys(DEMO_DATA).map((k) => (
            <button key={k} type="button" className="hz-demo-chip" onClick={() => setUn(k)}>
              UN {k}
            </button>
          ))}
        </div>
        <div className="hz-demo-meta">
          This is a live preview of the Placard Wizard. The full tool adds mixed-load DANGEROUS detection, specialty markings, Class 1 compatibility groups, and a UN-number plate generator.
        </div>
      </div>
      <div className="hz-demo-result" id="demo-result">
        <div className="hz-demo-result-name">{data.name}</div>
        <div className="hz-demo-result-class">{data.classDesc}</div>
        <div className="hz-demo-placard-wrap" ref={placardWrapRef} aria-live="polite" />
        <div className="hz-demo-cite">
          Required placard per <strong>49 CFR § 172.504</strong>
        </div>
      </div>
    </div>
  );
}
