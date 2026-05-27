"use client";

/* ============================================================
   /app/pdf-test · Phase 1 verification page
   ------------------------------------------------------------
   Internal-use page. Joshua (or any admin) hits this, clicks a
   template button, and downloads the resulting PDF. The point:
   visually confirm the X3 Compass letterhead + brand footer
   render correctly via Cloudflare Browser Rendering BEFORE we
   wire PDF generation into the real surfaces (Hazmat Center,
   audit-export, training-certs, etc.).

   Three test templates:
     - letterhead-test            · minimal "does it look right"
     - hazmat-audit-checklist     · the real high-value Hazmat doc
     - training-certificate       · the branded cert format

   When CF_ACCOUNT_ID + CF_BROWSER_RENDERING_TOKEN env vars are
   not yet set in CF Pages, the endpoint returns a 503 with a
   useful setup error · we surface that inline so Joshua knows
   what to configure.
   ============================================================ */

import { useState } from "react";
import AppShell from "@/components/AppShell";

type TemplateRow = {
  slug: string;
  title: string;
  description: string;
  sampleData: Record<string, unknown>;
};

const TEMPLATES: TemplateRow[] = [
  {
    slug: "letterhead-test",
    title: "Letterhead test",
    description: "Minimal multi-page doc · confirm the X3 Compass logo, cyan accent line, and footer all render correctly across page breaks.",
    sampleData: { carrierName: "Apex Logistics", userName: "Joshua Kovarik" },
  },
  {
    slug: "hazmat-audit-checklist",
    title: "Hazmat audit checklist",
    description: "Real Hazmat Center deliverable · 12-row §172 audit table with CFR citations, pill statuses, signature line. The high-value test.",
    sampleData: { carrierName: "Apex Logistics", usdotNumber: "1234567", preparedBy: "Joshua Kovarik" },
  },
  {
    slug: "training-certificate",
    title: "Training certificate",
    description: "Branded certificate format · large centered name, course title, signature block. The high-fidelity cert case.",
    sampleData: { driverName: "Marcus Reyes", courseTitle: "Hazardous Materials General Awareness", certNumber: "X3-2026-DEMO-0001" },
  },
];

export default function PdfTestPage() {
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<{ slug: string; text: string; detail?: string; setup_doc?: string } | null>(null);

  async function generate(t: TemplateRow) {
    setBusy(t.slug);
    setError(null);
    try {
      const res = await fetch("/api/pdf/render", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ template: t.slug, data: t.sampleData }),
      });

      const contentType = res.headers.get("Content-Type") || "";
      if (!res.ok || !contentType.includes("application/pdf")) {
        const errBody = await res.json().catch(() => ({ error: `HTTP ${res.status}` }));
        setError({
          slug: t.slug,
          text: errBody.error || `Render failed (HTTP ${res.status})`,
          detail: errBody.detail,
          setup_doc: errBody.setup_doc,
        });
        return;
      }

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${t.slug}-${Date.now()}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (e) {
      setError({ slug: t.slug, text: e instanceof Error ? e.message : "Network error" });
    }
    setBusy(null);
  }

  return (
    <AppShell crumbs="ADMIN · PDF VERIFICATION" title="PDF Test · letterhead spike">
      <div className="p-6 space-y-6">
        {/* Header / intro */}
        <section className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5" style={{ boxShadow: "var(--card-shadow)" }}>
          <div className="text-[10px] tracking-[.16em] uppercase text-[var(--accent)] font-extrabold mb-1">📄 PHASE 1 · VISUAL VERIFICATION</div>
          <h2 className="text-[16px] font-extrabold text-[var(--fg)] m-0">Generate a branded sample PDF</h2>
          <p className="text-[12.5px] text-[var(--fg-muted)] leading-relaxed mt-1.5">
            Click any template below to download a sample PDF rendered through Cloudflare Browser Rendering. The X3 Compass logo should appear top-left on every page, with a cyan accent line under the header and a brand footer with page X of Y. If the download fails, check the setup notice that appears below.
          </p>
          <p className="text-[11px] text-[var(--fg-faint)] mt-2 m-0">
            Backend: <code className="text-[10.5px] bg-[var(--surface-3)] px-1.5 rounded">POST /api/pdf/render</code> · template registry: <code className="text-[10.5px] bg-[var(--surface-3)] px-1.5 rounded">/src/lib/pdfTemplates/index.ts</code>
          </p>
        </section>

        {/* Template cards */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {TEMPLATES.map((t) => (
            <article key={t.slug} className="relative rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5 overflow-hidden flex flex-col gap-3" style={{ boxShadow: "var(--card-shadow)" }}>
              <span aria-hidden style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: "linear-gradient(90deg, var(--accent), var(--accent-2))" }} />
              <div>
                <div className="text-[9.5px] tracking-[1.2px] uppercase font-bold text-[var(--fg-faint)]">Template</div>
                <div className="text-[14px] font-extrabold text-[var(--fg)] mt-1">{t.title}</div>
              </div>
              <p className="text-[12px] text-[var(--fg-muted)] leading-relaxed m-0">{t.description}</p>
              <div className="text-[10.5px] text-[var(--fg-faint)] font-mono bg-[var(--surface-3)] rounded p-2 leading-snug">
                {JSON.stringify(t.sampleData, null, 0).slice(0, 200)}
              </div>
              <button
                onClick={() => generate(t)}
                disabled={busy !== null}
                className="mt-auto px-3 py-2 rounded-lg text-[12px] font-extrabold text-[var(--bg)] disabled:opacity-50"
                style={{ background: "linear-gradient(135deg, var(--accent), var(--accent-2))" }}
              >
                {busy === t.slug ? "Rendering…" : "Generate PDF →"}
              </button>
            </article>
          ))}
        </section>

        {/* Error / setup state */}
        {error && (
          <section role="status" className="rounded-xl border border-rose-500/40 bg-rose-500/5 p-5">
            <div className="text-[10px] tracking-[.16em] uppercase text-rose-700 dark:text-rose-300 font-extrabold mb-2">⚠ Render failed · {error.slug}</div>
            <p className="text-[13px] text-[var(--fg)] m-0 font-semibold">{error.text}</p>
            {error.detail && (
              <pre className="mt-3 text-[11px] bg-[var(--surface-3)] p-3 rounded overflow-x-auto whitespace-pre-wrap">{error.detail}</pre>
            )}
            {error.setup_doc && (
              <p className="text-[12px] text-[var(--fg-muted)] mt-3 m-0">
                Setup steps: <code className="bg-[var(--surface-3)] px-1.5 py-0.5 rounded text-[11px]">{error.setup_doc}</code> in the repo root. Two env vars (<code className="bg-[var(--surface-3)] px-1.5 py-0.5 rounded text-[11px]">CF_ACCOUNT_ID</code>, <code className="bg-[var(--surface-3)] px-1.5 py-0.5 rounded text-[11px]">CF_BROWSER_RENDERING_TOKEN</code>) need to be set in Cloudflare Pages settings.
              </p>
            )}
          </section>
        )}

        {/* Footer · what to look for */}
        <section className="rounded-xl border border-[var(--border)] bg-[var(--surface-2)] p-5">
          <div className="text-[10px] tracking-[.16em] uppercase text-[var(--accent)] font-extrabold mb-2">✓ WHAT GOOD LOOKS LIKE</div>
          <ul className="space-y-1.5 text-[12.5px] text-[var(--fg-muted)] leading-relaxed m-0 pl-5">
            <li>X3 Compass logo + wordmark visible top-left on EVERY page (incl. page 2+)</li>
            <li>Cyan accent line (1px, <code className="text-[11px] bg-[var(--surface-3)] px-1.5 rounded">#16C7FF</code>) directly under the header content</li>
            <li>Date in top-right corner of each page</li>
            <li>Footer: brand line on the left, &quot;Page X of Y&quot; on the right</li>
            <li>Letter-size page (8.5 × 11 in), 1.1 in top margin, 0.85 in bottom, 0.6 in sides</li>
            <li>CFR citations render in cyan monospace (<code className="text-[11px] bg-[var(--surface-3)] px-1.5 rounded">§ 172.704(a)(1)</code> style)</li>
            <li>Status pills (✓ Complete / ⚠ Expiring / ✕ Missing) keep their colors</li>
          </ul>
        </section>
      </div>
    </AppShell>
  );
}
