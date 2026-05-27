"use client";

/* ============================================================
   CTPAPickerCard · three-mode D&A consortium picker
   ------------------------------------------------------------
   Same pattern as the MVR three-mode DataSourceCard (#218/#219):

     [ Recommended ]                [ I have one · connect ]              [ I have one · manual ]
     Set me up with Procom          DISA · Quest · LabCorp · etc.         Type your TPA name
     X3 introduces · 24-hr setup    API connector when live · CSV         CSV upload only
     $75 drug · $50 BAT             until then                             You email us results

   Once a mode is selected, the card collapses to a compact
   "Your C/TPA: <Name> · <Phone>" badge with a small "Change"
   button. Underlying data lives on carriers.ctpa_id +
   ctpa_mode (see migration 20260527c_ctpa_marketplace.sql).

   POSTs to /api/carrier/set-ctpa.
   ============================================================ */

import { useEffect, useMemo, useState } from "react";
import { getSupabase } from "@/lib/supabase";
import ProcomDisclosureModal from "@/components/ProcomDisclosureModal";

type Mode = "procom_referral" | "byo_connected" | "byo_manual";

export type Ctpa = {
  id: string;
  slug: string;
  legal_name: string;
  fmcsa_clearinghouse_name: string;
  primary_phone: string | null;
  primary_email: string | null;
  website_url: string | null;
  api_capable: boolean;
  api_connector_status: "none" | "planned" | "beta" | "live";
  is_recommended: boolean;
};

type CarrierCtpaState = {
  ctpa_id: string | null;
  ctpa_mode: Mode | null;
  ctpa_custom_name: string | null;
};

type Props = {
  carrierId: string | undefined;
  initial?: CarrierCtpaState & { ctpa?: Ctpa | null };
  onChange?: (next: { mode: Mode; ctpa: Ctpa; custom_name: string | null }) => void;
};

export default function CTPAPickerCard({ carrierId, initial, onChange }: Props) {
  const [marketplace, setMarketplace] = useState<Ctpa[]>([]);
  const [selectedSlug, setSelectedSlug] = useState<string>(initial?.ctpa?.slug || "");
  const [mode, setMode] = useState<Mode | null>(initial?.ctpa_mode || null);
  const [customName, setCustomName] = useState<string>(initial?.ctpa_custom_name || "");
  const [pickerOpen, setPickerOpen] = useState<boolean>(!initial?.ctpa_mode);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<{ kind: "ok" | "err"; text: string } | null>(null);
  // Procom disclosure modal · two roles: enrollment-time consent + post-enrollment reference.
  const [procomModalOpen, setProcomModalOpen] = useState(false);
  const [procomModalReadOnly, setProcomModalReadOnly] = useState(false);

  // Hydrate the marketplace once.
  useEffect(() => {
    getSupabase()
      .from("compass_ctpas")
      .select("*")
      .order("is_recommended", { ascending: false })
      .order("legal_name", { ascending: true })
      .then(({ data }) => setMarketplace((data as Ctpa[]) || []));
  }, []);

  const procom = useMemo(() => marketplace.find((c) => c.slug === "procom") || null, [marketplace]);
  const selectedCtpa = useMemo(() => marketplace.find((c) => c.slug === selectedSlug) || initial?.ctpa || null, [marketplace, selectedSlug, initial]);

  async function save(
    nextMode: Mode,
    nextCtpa: Ctpa,
    nextCustom: string | null,
    disclosureAck?: { acked: true; version: string }
  ) {
    if (!carrierId) {
      // Demo mode short-circuit.
      setNotice({
        kind: "ok",
        text: `Demo mode · would have set your C/TPA to ${nextCtpa.legal_name} (${nextMode})${disclosureAck ? ` · ack'd ${disclosureAck.version}` : ""}.`,
      });
      setPickerOpen(false);
      setProcomModalOpen(false);
      onChange?.({ mode: nextMode, ctpa: nextCtpa, custom_name: nextCustom });
      return;
    }
    setBusy(true);
    setNotice(null);
    try {
      const token = (await getSupabase().auth.getSession()).data.session?.access_token;
      const res = await fetch("/api/carrier/set-ctpa", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({
          ctpa_slug: nextCtpa.slug,
          custom_name: nextCustom,
          mode: nextMode,
          ...(disclosureAck
            ? { disclosure_acked: true, disclosure_version: disclosureAck.version }
            : {}),
        }),
      });
      const data = await res.json().catch(() => ({ ok: false, error: "Bad response" }));
      if (!data.ok) {
        setNotice({ kind: "err", text: data.error || "Save failed" });
      } else {
        setNotice({ kind: "ok", text: data.note || "Saved." });
        setMode(nextMode);
        setPickerOpen(false);
        setProcomModalOpen(false);
        onChange?.({ mode: nextMode, ctpa: nextCtpa, custom_name: nextCustom });
      }
    } catch (e) {
      setNotice({ kind: "err", text: e instanceof Error ? e.message : "Network error" });
    }
    setBusy(false);
  }

  // ------- COLLAPSED VIEW (a C/TPA is already chosen) -------
  if (!pickerOpen && mode && selectedCtpa) {
    const displayName = selectedCtpa.slug === "other" && customName ? customName : selectedCtpa.legal_name;
    return (
      <section className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5" style={{ boxShadow: "var(--card-shadow)" }}>
        <header className="flex items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            <div className="text-[10px] tracking-[.16em] uppercase text-[var(--accent)] font-extrabold mb-1">🧪 Your D&A consortium</div>
            <h3 className="text-[15px] font-extrabold text-[var(--fg)] m-0">{displayName}</h3>
            <p className="text-[12px] text-[var(--fg-muted)] mt-1.5 leading-relaxed">
              {selectedCtpa.primary_phone && <span><strong>{selectedCtpa.primary_phone}</strong> · </span>}
              {selectedCtpa.primary_email && <a href={`mailto:${selectedCtpa.primary_email}`} className="text-[var(--accent)] hover:underline">{selectedCtpa.primary_email}</a>}
              {selectedCtpa.website_url && <> · <a href={selectedCtpa.website_url} target="_blank" rel="noopener noreferrer" className="text-[var(--accent)] hover:underline">website ↗</a></>}
            </p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              <ModePill mode={mode} />
              {mode === "byo_connected" && selectedCtpa.api_connector_status !== "live" && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30">
                  Connector {selectedCtpa.api_connector_status} · use CSV upload until live
                </span>
              )}
            </div>
          </div>
          <div className="shrink-0 flex flex-col items-end gap-1.5">
            <button
              onClick={() => setPickerOpen(true)}
              className="px-3 py-1.5 rounded-lg text-[11px] font-bold text-[var(--fg)] border border-[var(--border)] hover:border-[var(--accent)]"
            >
              Change
            </button>
            {/* Post-enrollment reference for Procom · re-open the disclosure read-only */}
            {mode === "procom_referral" && selectedCtpa?.slug === "procom" && (
              <button
                onClick={() => { setProcomModalReadOnly(true); setProcomModalOpen(true); }}
                className="text-[10.5px] font-bold text-[var(--accent)] hover:underline"
              >
                View Procom program ↗
              </button>
            )}
          </div>
        </header>
        {notice && (
          <div role="status" className={`mt-4 rounded-lg p-3 text-[12px] ${notice.kind === "ok" ? "bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300" : "bg-rose-500/10 border border-rose-500/30 text-rose-700 dark:text-rose-300"}`}>
            {notice.text}
          </div>
        )}

        {/* Procom disclosure modal · accessible from the collapsed view in read-only mode */}
        <ProcomDisclosureModal
          open={procomModalOpen}
          readOnly={procomModalReadOnly}
          busy={busy}
          onClose={() => setProcomModalOpen(false)}
          onConfirm={(version) => procom && save("procom_referral", procom, null, { acked: true, version })}
        />
      </section>
    );
  }

  // ------- EXPANDED VIEW (no C/TPA yet OR changing) -------
  return (
    <section className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5" style={{ boxShadow: "var(--card-shadow)" }}>
      <header className="mb-4">
        <div className="text-[10px] tracking-[.16em] uppercase text-[var(--accent)] font-extrabold mb-1">🧪 D&A consortium · pick your path</div>
        <h3 className="text-[16px] font-extrabold text-[var(--fg)] m-0">Who manages your DOT drug & alcohol program?</h3>
        <p className="text-[12px] text-[var(--fg-muted)] mt-1 leading-relaxed">
          Every CDL operation needs a C/TPA (consortium/third-party administrator) per 49 CFR §382.705. X3 Compass works with whichever path fits you.
        </p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {/* MODE 1 · Procom referral · opens disclosure modal first (NOT immediate save) */}
        <Card
          title="Set me up with Procom"
          subtitle="RECOMMENDED · X3 partner"
          tone="cyan"
          body="X3 refers you to Procom (ADTC). Procom contracts directly with you · 24-hr enrollment · their portal, their billing, their TPA insurance. Cleanest path."
          bullets={[
            "$75 drug · $50 BAT · annual fees per fleet size",
            "Procom is the recommended default in our marketplace",
            "Designate Procom as your C/TPA in FMCSA Clearinghouse · we walk you through it",
          ]}
          cta="Review program · pick Procom →"
          disabled={busy || !procom}
          onClick={() => {
            // Open the formal Procom disclosure modal · carrier must ack BEFORE save.
            setProcomModalReadOnly(false);
            setProcomModalOpen(true);
          }}
        />

        {/* MODE 2 · BYO connected (existing TPA + API path) */}
        <Card
          title="Connect my existing C/TPA"
          subtitle="API CONNECTOR · WHEN LIVE"
          tone="violet"
          body="Already with DISA, Quest, LabCorp, or another national TPA? Pick from our marketplace. We'll surface their contact info + (when our connector for them is live) pull results automatically."
          bullets={[
            "12+ national TPAs in our marketplace",
            "API connectors landing per-TPA · CSV upload works in the meantime",
            "Results flow into the same dashboard · no portal-switching",
          ]}
          cta="Pick from marketplace →"
          disabled={busy}
          onClick={() => setSelectedSlug("disa")}
        />

        {/* MODE 3 · BYO manual */}
        <Card
          title="Track manually"
          subtitle="YOU HAVE ONE · NO INTEGRATION"
          tone="amber"
          body="You have a regional / smaller C/TPA we don't have a connector for yet. Tell us their name + contact. You upload result CSVs whenever they email them."
          bullets={[
            "Free-text C/TPA name + contact info",
            "CSV upload endpoint mirrors how your TPA sends results",
            "Positives auto-flagged for FMCSA Clearinghouse reporting",
          ]}
          cta="Add my C/TPA →"
          disabled={busy}
          onClick={() => setSelectedSlug("other")}
        />
      </div>

      {/* SECONDARY · MARKETPLACE PICKER (when MODE 2 or 3 is being filled in) */}
      {selectedSlug && selectedSlug !== "procom" && (
        <div className="mt-5 rounded-xl border border-[var(--border)] bg-[var(--surface-2)] p-4">
          <label className="block text-[10px] tracking-[.14em] uppercase font-bold text-[var(--fg-muted)] mb-2">
            Pick your C/TPA from the marketplace
          </label>
          <select
            value={selectedSlug}
            onChange={(e) => setSelectedSlug(e.target.value)}
            className="w-full px-3 py-2 rounded-lg text-[13px] bg-[var(--surface)] border border-[var(--border)] text-[var(--fg)] focus:outline-none focus:border-[var(--accent)]"
          >
            <option value="">— select a C/TPA —</option>
            {marketplace
              .filter((c) => c.slug !== "procom")
              .map((c) => (
                <option key={c.slug} value={c.slug}>
                  {c.legal_name} {c.api_capable ? `· (API ${c.api_connector_status})` : "· (manual only)"}
                </option>
              ))}
          </select>

          {selectedCtpa?.slug === "other" && (
            <input
              type="text"
              value={customName}
              onChange={(e) => setCustomName(e.target.value)}
              placeholder="Type your C/TPA's legal name (as registered with FMCSA)"
              className="mt-3 w-full px-3 py-2 rounded-lg text-[13px] bg-[var(--surface)] border border-[var(--border)] text-[var(--fg)] focus:outline-none focus:border-[var(--accent)]"
            />
          )}

          {selectedCtpa && selectedCtpa.slug !== "procom" && (
            <div className="mt-4 flex flex-wrap gap-2">
              <button
                disabled={busy || (selectedCtpa.slug === "other" && !customName.trim())}
                onClick={() => save("byo_connected", selectedCtpa, selectedCtpa.slug === "other" ? customName.trim() : null)}
                className="px-3.5 py-2 rounded-lg text-[12px] font-extrabold text-[var(--bg)] disabled:opacity-50"
                style={{ background: "linear-gradient(135deg, var(--accent), var(--accent-2))" }}
                title={selectedCtpa.api_connector_status === "none" ? "No connector yet · use 'Track manually' instead" : "Lock in as connected"}
              >
                {busy ? "Saving…" : selectedCtpa.api_connector_status === "live" ? "Lock in · connect API →" : "Lock in · connector planned →"}
              </button>
              <button
                disabled={busy || (selectedCtpa.slug === "other" && !customName.trim())}
                onClick={() => save("byo_manual", selectedCtpa, selectedCtpa.slug === "other" ? customName.trim() : null)}
                className="px-3.5 py-2 rounded-lg text-[12px] font-bold text-[var(--fg)] border border-[var(--border)] hover:border-[var(--accent)] disabled:opacity-50"
              >
                {busy ? "Saving…" : "Lock in · CSV upload only →"}
              </button>
            </div>
          )}
        </div>
      )}

      {notice && (
        <div role="status" className={`mt-4 rounded-lg p-3 text-[12px] ${notice.kind === "ok" ? "bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300" : "bg-rose-500/10 border border-rose-500/30 text-rose-700 dark:text-rose-300"}`}>
          {notice.text}
        </div>
      )}

      {/* Procom disclosure modal · mounted on the expanded view too · same instance.
          Opens when the carrier clicks the Procom Card · closes on ack OR cancel. */}
      <ProcomDisclosureModal
        open={procomModalOpen}
        readOnly={procomModalReadOnly}
        busy={busy}
        onClose={() => setProcomModalOpen(false)}
        onConfirm={(version) => procom && save("procom_referral", procom, null, { acked: true, version })}
      />
    </section>
  );
}

/* ----------------- helpers ----------------- */

function ModePill({ mode }: { mode: Mode }) {
  const label: Record<Mode, string> = {
    procom_referral: "Procom referral · X3 partner",
    byo_connected:   "BYO · API connected",
    byo_manual:      "BYO · manual CSV",
  };
  const tone: Record<Mode, string> = {
    procom_referral: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30",
    byo_connected:   "bg-violet-500/15  text-violet-700  dark:text-violet-300  border-violet-500/30",
    byo_manual:      "bg-amber-500/15   text-amber-700   dark:text-amber-300   border-amber-500/30",
  };
  return <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${tone[mode]}`}>{label[mode]}</span>;
}

function Card({
  title, subtitle, tone, body, bullets, cta, disabled, onClick,
}: {
  title: string; subtitle: string; tone: "cyan" | "violet" | "amber";
  body: string; bullets: string[]; cta: string; disabled?: boolean; onClick: () => void;
}) {
  const stripe: Record<typeof tone, string> = {
    cyan:   "linear-gradient(90deg, #16C7FF, #0EA5E9)",
    violet: "linear-gradient(90deg, #A78BFA, #8B5CF6)",
    amber:  "linear-gradient(90deg, #FBBF24, #F59E0B)",
  };
  return (
    <article className="relative rounded-xl border border-[var(--border)] bg-[var(--surface-2)] p-4 overflow-hidden flex flex-col gap-3">
      <span aria-hidden style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: stripe[tone] }} />
      <div>
        <div className="text-[13px] font-extrabold text-[var(--fg)]">{title}</div>
        <div className="text-[9.5px] tracking-[1.2px] uppercase font-bold text-[var(--fg-faint)] mt-1">{subtitle}</div>
      </div>
      <p className="text-[12px] text-[var(--fg-muted)] leading-relaxed m-0">{body}</p>
      <ul className="list-none p-0 m-0 space-y-1.5">
        {bullets.map((b, i) => (
          <li key={i} className="text-[11px] text-[var(--fg-muted)] flex gap-2 items-start leading-snug">
            <span aria-hidden className="text-[var(--accent)] shrink-0 mt-0.5">·</span>
            <span>{b}</span>
          </li>
        ))}
      </ul>
      <button
        disabled={disabled}
        onClick={onClick}
        className="mt-auto px-3 py-2 rounded-lg text-[12px] font-extrabold text-[var(--bg)] disabled:opacity-50"
        style={{ background: "linear-gradient(135deg, var(--accent), var(--accent-2))" }}
      >
        {cta}
      </button>
    </article>
  );
}
