"use client";

import { useEffect, useState } from "react";

type Vendor = {
  vendor: string;
  category: string;
  status: "available" | "configured" | "connected" | "syncing" | "error";
  last_sync_at?: string | null;
  last_sync_count?: number | null;
  last_error_text?: string | null;
  env_configured?: boolean;
};

const VENDOR_META: Record<string, { label: string; description: string; supports_sync: boolean }> = {
  tenstreet: {
    label: "TenStreet",
    description: "Applicant tracking system (ATS) · pulls completed driver applications into your DQ pipeline.",
    supports_sync: true,
  },
  driverreach: {
    label: "DriverReach",
    description: "Recruiting + ATS · drag-and-drop pipeline + DOT-compliant applications.",
    supports_sync: false,  // awaiting API contract
  },
  hireright: {
    label: "HireRight",
    description: "MVR + background screening. X3 pulls completed reports back into your screening ledger automatically.",
    supports_sync: true,
  },
  disa: {
    label: "DISA",
    description: "Drug & alcohol + background screening. X3 syncs completed results into your screening ledger automatically.",
    supports_sync: true,
  },
  samba_safety: {
    label: "SambaSafety",
    description: "Continuous MVR monitoring. Alerts you the day a driver picks up a violation, not 12 months later.",
    supports_sync: false,
  },
  checkr: {
    label: "Checkr",
    description: "Background checks. Already wired via Checkr Embeds on the Background Checks page.",
    supports_sync: false,
  },
  manual_api: {
    label: "Custom API",
    description: "Build your own integration against POST /api/drivers/import or /api/vehicles/import. Send JSON or CSV body and we'll upsert.",
    supports_sync: false,
  },
  samsara: {
    label: "Samsara",
    description: "ELD + telematics. Pulls your fleet vehicles (VIN, plate, year/make/model) directly into compass_vehicles.",
    supports_sync: true,
  },
  motive: {
    label: "Motive (KeepTruckin)",
    description: "ELD + fleet management. Vehicle roster + status sync into compass_vehicles.",
    supports_sync: true,
  },
  geotab: {
    label: "Geotab",
    description: "Telematics + fleet management. Vehicle data sync coming soon.",
    supports_sync: false,
  },
};

function badgeForStatus(status: string, envConfigured?: boolean): { label: string; cls: string } {
  if (status === "connected")  return { label: "Connected",   cls: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30" };
  if (status === "syncing")    return { label: "Syncing…",    cls: "bg-cyan-500/15 text-cyan-700 dark:text-cyan-300 border-cyan-500/30" };
  if (status === "error")      return { label: "Error",       cls: "bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-500/30" };
  if (status === "configured") return { label: "Configured",  cls: "bg-cyan-500/15 text-cyan-700 dark:text-cyan-300 border-cyan-500/30" };
  if (envConfigured)           return { label: "Ready to sync", cls: "bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30" };
  return { label: "Available", cls: "bg-[var(--surface-3)] text-[var(--fg-muted)] border-[var(--border)]" };
}

export function VendorConnectModal({
  carrierId,
  onClose,
  onImported,
  categories,
  title,
  subtitle,
}: {
  carrierId: string;
  onClose: () => void;
  onImported: () => void;
  categories?: string[];
  title?: string;
  subtitle?: string;
}) {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState<string | null>(null);
  const [syncResult, setSyncResult] = useState<{ vendor: string; ok: boolean; msg: string } | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const r = await fetch(`/api/vendors/list?carrier_id=${carrierId}`, { cache: "no-store" });
        const body = await r.json() as { vendors: Vendor[] };
        const all = body.vendors || [];
        const filtered = categories && categories.length > 0
          ? all.filter(v => categories.includes(v.category))
          : all;
        setVendors(filtered);
      } catch {
        setVendors([]);
      } finally {
        setLoading(false);
      }
    })();
  }, [carrierId, categories]);

  async function syncVendor(vendor: string) {
    setSyncing(vendor); setSyncResult(null);
    try {
      const r = await fetch(`/api/vendors/${vendor}/sync`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ carrier_id: carrierId }),
      });
      const body = await r.json() as { ok?: boolean; configured?: boolean; error?: string; fetched?: number; inserted?: number; updated?: number };
      if (r.status === 503 && body.configured === false) {
        setSyncResult({ vendor, ok: false, msg: body.error || "Vendor not configured." });
      } else if (body.ok) {
        const n = (body.inserted || 0) + (body.updated || 0);
        setSyncResult({ vendor, ok: true, msg: `✓ Synced ${n} of ${body.fetched || 0} from ${VENDOR_META[vendor]?.label || vendor}.` });
        onImported();
      } else {
        setSyncResult({ vendor, ok: false, msg: body.error || "Sync failed." });
      }
    } catch (err) {
      setSyncResult({ vendor, ok: false, msg: err instanceof Error ? err.message : String(err) });
    } finally {
      setSyncing(null);
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/60 grid place-items-center p-4" onClick={onClose}>
      <div className="bg-[var(--surface-2)] rounded-2xl border border-[var(--border)] max-w-3xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="p-6 border-b border-[var(--border)] flex items-center justify-between">
          <div>
            <h2 className="text-[20px] font-extrabold text-[var(--fg)]">{title || "Connect a vendor"}</h2>
            <p className="text-[12px] text-[var(--fg-muted)] mt-1">{subtitle || "Pull data automatically from your existing systems."}</p>
          </div>
          <button onClick={onClose} aria-label="Close dialog" className="text-[var(--fg-muted)] hover:text-[var(--fg)] text-xl leading-none">×</button>
        </div>

        <div className="p-6 space-y-3">
          {loading ? (
            <div className="text-center py-12 text-[var(--fg-muted)] text-sm">Loading vendors…</div>
          ) : vendors.length === 0 ? (
            <div className="text-center py-12 text-[var(--fg-muted)] text-sm">No vendors configured.</div>
          ) : (
            vendors.map(v => {
              const meta = VENDOR_META[v.vendor] || { label: v.vendor, description: "—", supports_sync: false };
              const badge = badgeForStatus(v.status, v.env_configured);
              const isThisSyncing = syncing === v.vendor;
              const r = syncResult?.vendor === v.vendor ? syncResult : null;
              return (
                <div key={v.vendor} className="rounded-xl border border-[var(--border)] bg-[var(--bg)] p-4">
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <div className="text-[15px] font-extrabold text-[var(--fg)]">{meta.label}</div>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold border ${badge.cls}`}>{badge.label}</span>
                        <span className="text-[10px] font-mono text-[var(--fg-faint)] uppercase tracking-wider">{v.category}</span>
                      </div>
                      <div className="text-[12px] text-[var(--fg-muted)]">{meta.description}</div>
                      {v.last_sync_at && (
                        <div className="text-[11px] text-[var(--fg-faint)] mt-1">
                          Last sync: {new Date(v.last_sync_at).toLocaleString()}
                          {typeof v.last_sync_count === "number" && ` · ${v.last_sync_count} drivers`}
                        </div>
                      )}
                    </div>
                    <div className="flex-shrink-0">
                      {meta.supports_sync ? (
                        <button
                          onClick={() => syncVendor(v.vendor)}
                          disabled={isThisSyncing}
                          className="px-3 py-1.5 rounded-lg font-extrabold text-[12px] text-[var(--bg)] disabled:opacity-50"
                          style={{ background: "linear-gradient(135deg, var(--accent), var(--accent-2))" }}
                        >
                          {isThisSyncing ? "Syncing…" : v.last_sync_at ? "Re-sync" : "Sync now"}
                        </button>
                      ) : v.vendor === "manual_api" ? (
                        <a href="https://github.com/x3fleetsafety" target="_blank" rel="noopener" className="px-3 py-1.5 rounded-lg font-bold text-[12px] text-[var(--fg)] border border-[var(--border)] inline-block">
                          API docs →
                        </a>
                      ) : (
                        <span className="px-3 py-1.5 rounded-lg font-bold text-[12px] text-[var(--fg-muted)] border border-[var(--border)] inline-block">
                          Talk to sales
                        </span>
                      )}
                    </div>
                  </div>
                  {r && (
                    <div className={`mt-2 text-[12px] rounded-lg p-2 ${r.ok ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300" : "bg-rose-500/10 text-rose-700 dark:text-rose-300"}`}>
                      {r.msg}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        <div className="p-6 border-t border-[var(--border)] flex justify-end">
          <button onClick={onClose} className="px-4 py-2 rounded-lg font-bold text-[13px] text-[var(--fg-muted)] border border-[var(--border)] hover:text-[var(--fg)]">Close</button>
        </div>
      </div>
    </div>
  );
}
