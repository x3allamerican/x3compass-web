"use client";
import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import AppShell from "@/components/AppShell";
import { useUser } from "@/lib/useUser";
import { useIsSuperAdmin } from "@/lib/superAdmin";

type Post = {
  id: string;
  carrier_id: string | null;
  platform: string;
  status: "pending" | "approved" | "rejected" | "posted" | "failed";
  body: string;
  image_url: string | null;
  scheduled_at: string | null;
  posted_at: string | null;
  posted_url: string | null;
  rejection_reason: string | null;
  ai_generated: boolean;
  ai_prompt_used: string | null;
  created_at: string;
};

type Counts = { pending: number; approved: number; rejected: number; posted: number; failed: number; total: number };

const PLATFORMS = [
  { id: "all",       label: "All platforms" },
  { id: "x",         label: "Twitter / X" },
  { id: "linkedin",  label: "LinkedIn" },
  { id: "tiktok",    label: "TikTok" },
  { id: "instagram", label: "Instagram" },
  { id: "reddit",    label: "Reddit" },
  { id: "facebook",  label: "Facebook" },
  { id: "threads",   label: "Threads" },
];

// Uniform pill, theme-aware (matches the accidents/dq-grid palette)
function Pill({ cls, children }: { cls: string; children: React.ReactNode }) {
  return <span className={`inline-block min-w-[88px] px-2 py-1 text-[10px] rounded-full font-extrabold border ${cls} whitespace-nowrap text-center tracking-wider uppercase`}>{children}</span>;
}
const PLATFORM_PILL: Record<string, string> = {
  x:         "bg-black text-white border-black dark:bg-black dark:text-white dark:border-white/60",
  linkedin:  "bg-blue-700 text-white border-blue-800 dark:bg-blue-500/45 dark:text-blue-50 dark:border-blue-300/80",
  tiktok:    "bg-pink-600 text-white border-pink-700 dark:bg-pink-500/45 dark:text-pink-50 dark:border-pink-300/80",
  instagram: "bg-purple-600 text-white border-purple-700 dark:bg-purple-500/45 dark:text-purple-50 dark:border-purple-300/80",
  reddit:    "bg-orange-600 text-white border-orange-700 dark:bg-orange-500/45 dark:text-orange-50 dark:border-orange-300/80",
  facebook:  "bg-blue-600 text-white border-blue-700 dark:bg-blue-500/45 dark:text-blue-50 dark:border-blue-300/80",
  threads:   "bg-slate-800 text-white border-slate-900 dark:bg-slate-700 dark:text-white dark:border-slate-300/80",
};
const STATUS_PILL: Record<string, string> = {
  pending:  "bg-amber-600 text-white border-amber-700 dark:bg-amber-500/45 dark:text-amber-50 dark:border-amber-300/80",
  approved: "bg-blue-700 text-white border-blue-800 dark:bg-blue-500/45 dark:text-blue-50 dark:border-blue-300/80",
  rejected: "bg-slate-500 text-white border-slate-600 dark:bg-slate-500/45 dark:text-slate-50 dark:border-slate-300/80",
  posted:   "bg-green-700 text-white border-green-800 dark:bg-emerald-500/45 dark:text-emerald-50 dark:border-emerald-300/80",
  failed:   "bg-red-700 text-white border-red-800 dark:bg-rose-500/45 dark:text-rose-50 dark:border-rose-300/80",
};

const charLimit = (p: string) => p === "x" ? 280 : p === "tiktok" ? 150 : p === "reddit" ? 10000 : 3000;

export default function SocialAdminPage() {
  const { carrier } = useUser();
  const isSuperAdmin = useIsSuperAdmin();
  const [rows, setRows] = useState<Post[]>([]);
  const [counts, setCounts] = useState<Counts>({ pending: 0, approved: 0, rejected: 0, posted: 0, failed: 0, total: 0 });
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"pending" | "approved" | "rejected" | "posted">("pending");
  const [platform, setPlatform] = useState<string>("all");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [editing, setEditing] = useState<Post | null>(null);
  const [showGen, setShowGen] = useState(false);

  async function refresh() {
    if (!carrier) return;
    setLoading(true);
    const qs = new URLSearchParams({ carrier_id: carrier.id, status: tab, platform });
    const r = await fetch(`/api/admin/social/list?${qs}`);
    const body = await r.json() as { ok: boolean; rows?: Post[]; counts?: Counts };
    if (body.ok) { setRows(body.rows || []); setCounts(body.counts || counts); }
    setLoading(false);
    setSelected(new Set());
  }
  useEffect(() => { if (carrier) refresh(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [carrier, tab, platform]);

  async function bulkSet(status: string) {
    if (selected.size === 0) return;
    await fetch("/api/admin/social/bulk", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ids: [...selected], status }) });
    refresh();
  }
  async function approveOne(id: string) {
    await fetch("/api/admin/social/update", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, status: "approved" }) });
    refresh();
  }
  async function rejectOne(id: string) {
    const reason = prompt("Reason for rejecting?") || "";
    await fetch("/api/admin/social/update", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, status: "rejected", rejection_reason: reason }) });
    refresh();
  }
  async function publishOne(id: string) {
    const r = await fetch("/api/admin/social/publish", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) });
    const body = await r.json();
    if (body.configured === false) alert(`Postiz not configured: ${body.error}`);
    else if (!body.ok) alert(`Publish failed: ${body.error}`);
    refresh();
  }

  const allVisibleSelected = useMemo(() => rows.length > 0 && rows.every(r => selected.has(r.id)), [rows, selected]);
  function toggleAllVisible() {
    if (allVisibleSelected) setSelected(new Set());
    else setSelected(new Set(rows.map(r => r.id)));
  }

  if (!isSuperAdmin) {
    return (
      <AppShell title="Social Media Manager" crumbs="ADMIN · SOCIAL">
        <div className="p-10 text-center">
          <h1 className="text-2xl font-bold mb-2">Restricted</h1>
          <p className="text-[var(--fg-muted)]">This page is for X3 super-admins only.</p>
          <Link href="/app" className="text-[var(--accent)] hover:underline mt-4 inline-block">← Back to dashboard</Link>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell title="★ Social Media Manager" crumbs="ADMIN · SOCIAL · Review · approve · edit launch-month posts"
      actions={<>
        <Link href="/app" className="text-[12px] text-[var(--fg-muted)] hover:text-[var(--fg)]">← Back to dashboard</Link>
        <button onClick={() => setShowGen(true)} className="px-4 py-2 rounded-lg font-extrabold text-[12px] text-[var(--bg)]" style={{ background: "linear-gradient(135deg, var(--accent), var(--accent-2))" }}>★ Generate drafts</button>
      </>}
    >
      <div className="p-6 space-y-5">

        {/* Status tabs */}
        <div className="flex gap-2 flex-wrap">
          {(["pending","approved","rejected","posted"] as const).map(t => {
            const active = tab === t;
            return (
              <button key={t} onClick={() => setTab(t)} className={`px-4 py-2 rounded-lg text-[12px] font-extrabold uppercase tracking-wider border ${active ? "bg-[var(--accent)] text-[var(--bg)] border-[var(--accent)]" : "bg-[var(--surface-3)] text-[var(--fg)] border-[var(--border)] hover:bg-[var(--surface-2)]"}`}>
                {t} <span className="ml-1.5 px-2 py-0.5 rounded-full text-[10px] bg-black/20">{counts[t]}</span>
              </button>
            );
          })}
        </div>

        {/* Platform filter */}
        <div className="flex flex-wrap gap-2">
          {PLATFORMS.map(p => (
            <button key={p.id} onClick={() => setPlatform(p.id)} className={`px-3 py-1.5 rounded-full text-[11px] font-bold border ${platform === p.id ? "bg-[var(--accent)] text-[var(--bg)] border-[var(--accent)]" : "bg-[var(--surface-3)] text-[var(--fg)] border-[var(--border)] hover:bg-[var(--surface-2)]"}`}>{p.label}</button>
          ))}
        </div>

        {/* Bulk actions row */}
        <div className="flex items-center justify-between flex-wrap gap-3 px-1">
          <div className="flex items-center gap-3 text-[12px]">
            <label className="flex items-center gap-2 text-[var(--fg-muted)]">
              <input type="checkbox" checked={allVisibleSelected} onChange={toggleAllVisible} className="rounded" />
              Select all visible
            </label>
            <span className="text-[var(--fg-muted)]">{selected.size} selected · {rows.length} on page · {counts.total} total</span>
          </div>
          <div className="flex gap-2 flex-wrap">
            <button onClick={() => bulkSet("approved")} disabled={selected.size === 0} className="px-3 py-1.5 rounded-lg text-[12px] font-extrabold text-white bg-green-700 hover:bg-green-800 disabled:opacity-40 dark:bg-emerald-500/45 dark:hover:bg-emerald-500/60">★ Approve all selected ({selected.size})</button>
            <button onClick={() => bulkSet("rejected")} disabled={selected.size === 0} className="px-3 py-1.5 rounded-lg text-[12px] font-bold text-white bg-slate-500 hover:bg-slate-600 disabled:opacity-40">Reject all</button>
          </div>
        </div>

        {/* Posts list */}
        {loading ? (
          <div className="text-center py-16 text-[var(--fg-muted)] text-sm">Loading…</div>
        ) : rows.length === 0 ? (
          <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-3)] p-12 text-center">
            <div className="text-3xl mb-3">📭</div>
            <h3 className="text-[var(--fg)] font-bold text-lg mb-2">No {tab} posts</h3>
            <p className="text-[var(--fg-muted)] text-sm mb-5 max-w-md mx-auto">
              {tab === "pending" ? "Click ★ Generate drafts to seed launch-month posts with AI." : `Move posts here from the ${tab === "approved" ? "Pending" : "Approved"} tab.`}
            </p>
            {tab === "pending" && <button onClick={() => setShowGen(true)} className="px-5 py-2.5 rounded-lg font-extrabold text-[13px] text-[var(--bg)]" style={{ background: "linear-gradient(135deg, var(--accent), var(--accent-2))" }}>★ Generate drafts</button>}
          </div>
        ) : (
          <div className="space-y-3">
            {rows.map(r => (
              <div key={r.id} className="rounded-xl border border-[var(--border)] bg-[var(--surface-3)] p-4 hover:bg-[var(--surface-2)] transition-colors">
                <div className="flex items-start gap-3">
                  <input type="checkbox" checked={selected.has(r.id)} onChange={(e)=>{const s = new Set(selected); if (e.target.checked) s.add(r.id); else s.delete(r.id); setSelected(s);}} className="mt-1.5 rounded" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      <Pill cls={PLATFORM_PILL[r.platform] || PLATFORM_PILL.x}>{r.platform === "x" ? "X/Twitter" : r.platform}</Pill>
                      <Pill cls={STATUS_PILL[r.status]}>{r.status}</Pill>
                      {r.ai_generated && <span className="text-[10px] tracking-wider uppercase font-bold text-[var(--fg-muted)]">★ AI draft</span>}
                      {r.scheduled_at && <span className="text-[10px] text-[var(--fg-muted)]">📅 {new Date(r.scheduled_at).toLocaleString()}</span>}
                      {r.posted_at && <span className="text-[10px] text-[var(--fg-muted)]">✓ Posted {new Date(r.posted_at).toLocaleString()}</span>}
                    </div>
                    <div className="text-[14px] text-[var(--fg)] whitespace-pre-wrap mb-2">{r.body}</div>
                    <div className="text-[11px] text-[var(--fg-muted)] flex items-center gap-3 flex-wrap">
                      <span>{r.body.length}/{charLimit(r.platform)} chars</span>
                      {r.body.length > charLimit(r.platform) && <span className="text-rose-500 font-bold">⚠ over limit</span>}
                      {r.rejection_reason && <span className="text-rose-500">Rejected: {r.rejection_reason}</span>}
                    </div>
                  </div>
                  <div className="flex flex-col gap-1.5 flex-shrink-0">
                    {r.status === "pending" && <>
                      <button onClick={() => approveOne(r.id)} className="px-3 py-1.5 rounded-lg text-[11px] font-extrabold text-white bg-green-700 hover:bg-green-800 dark:bg-emerald-500/45">✓ Approve</button>
                      <button onClick={() => setEditing(r)}     className="px-3 py-1.5 rounded-lg text-[11px] font-bold text-[var(--fg)] border border-[var(--border)] hover:bg-[var(--surface-2)]">✏️ Edit</button>
                      <button onClick={() => rejectOne(r.id)}   className="px-3 py-1.5 rounded-lg text-[11px] font-bold text-[var(--fg-muted)] border border-[var(--border)] hover:bg-[var(--surface-2)]">✗ Reject</button>
                    </>}
                    {r.status === "approved" && <>
                      <button onClick={() => publishOne(r.id)} className="px-3 py-1.5 rounded-lg text-[11px] font-extrabold text-white bg-blue-700 hover:bg-blue-800 dark:bg-blue-500/45">🚀 Publish via Postiz</button>
                      <button onClick={() => setEditing(r)}    className="px-3 py-1.5 rounded-lg text-[11px] font-bold text-[var(--fg)] border border-[var(--border)] hover:bg-[var(--surface-2)]">✏️ Edit</button>
                    </>}
                    {(r.status === "rejected" || r.status === "failed") && <button onClick={() => approveOne(r.id)} className="px-3 py-1.5 rounded-lg text-[11px] font-bold text-[var(--fg)] border border-[var(--border)] hover:bg-[var(--surface-2)]">↺ Re-queue</button>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showGen && carrier && <GenerateModal carrierId={carrier.id} onClose={() => setShowGen(false)} onDone={() => { setShowGen(false); refresh(); }} />}
      {editing && <EditModal post={editing} onClose={() => setEditing(null)} onSaved={() => { setEditing(null); refresh(); }} />}
    </AppShell>
  );
}

function GenerateModal({ carrierId, onClose, onDone }: { carrierId: string; onClose: () => void; onDone: () => void }) {
  const [topic, setTopic] = useState("X3 Fleet Safety launch month — DOT compliance for SMB carriers 1-100 trucks");
  const [platforms, setPlatforms] = useState<Set<string>>(new Set(["x","linkedin"]));
  const [count, setCount] = useState(5);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function generate() {
    if (platforms.size === 0) { setError("Pick at least one platform"); return; }
    setBusy(true); setError(null);
    try {
      const r = await fetch("/api/admin/social/generate", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ carrier_id: carrierId, topic, platforms: [...platforms], count }) });
      const body = await r.json();
      if (body.configured === false) setError(body.error || "Anthropic not configured");
      else if (!body.ok) setError(body.error || "Generation failed");
      else onDone();
    } catch (err) { setError(err instanceof Error ? err.message : String(err)); }
    finally { setBusy(false); }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/60 grid place-items-center p-4" onClick={onClose}>
      <div className="bg-[var(--surface-2)] rounded-2xl border border-[var(--border)] max-w-2xl w-full" onClick={(e) => e.stopPropagation()}>
        <div className="p-6 border-b border-[var(--border)] flex items-center justify-between">
          <h2 className="text-[20px] font-extrabold text-[var(--fg)]">★ Generate AI drafts</h2>
          <button onClick={onClose} className="text-[var(--fg-muted)] hover:text-[var(--fg)] text-xl leading-none">×</button>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className="text-[11px] tracking-wider uppercase font-bold text-[var(--fg-muted)] mb-1 block">Topic / theme</label>
            <textarea value={topic} onChange={(e)=>setTopic(e.target.value)} rows={3} className="w-full px-3 py-2 rounded-lg bg-[var(--bg)] border border-[var(--border)] text-[var(--fg)] text-sm" />
            <div className="text-[11px] text-[var(--fg-muted)] mt-1">Claude will write {count} posts per selected platform in X3FS's plain-English, CFR-cited voice.</div>
          </div>
          <div>
            <label className="text-[11px] tracking-wider uppercase font-bold text-[var(--fg-muted)] mb-2 block">Platforms ({platforms.size})</label>
            <div className="flex flex-wrap gap-2">
              {PLATFORMS.filter(p => p.id !== "all").map(p => (
                <button key={p.id} onClick={() => { const s = new Set(platforms); if (s.has(p.id)) s.delete(p.id); else s.add(p.id); setPlatforms(s); }} className={`px-3 py-1.5 rounded-full text-[11px] font-bold border ${platforms.has(p.id) ? "bg-[var(--accent)] text-[var(--bg)] border-[var(--accent)]" : "bg-[var(--surface-3)] text-[var(--fg)] border-[var(--border)]"}`}>{p.label}</button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-[11px] tracking-wider uppercase font-bold text-[var(--fg-muted)] mb-1 block">Posts per platform</label>
            <input type="number" min={1} max={20} value={count} onChange={(e)=>setCount(parseInt(e.target.value)||5)} className="w-24 px-3 py-2 rounded-lg bg-[var(--bg)] border border-[var(--border)] text-[var(--fg)] text-sm" />
          </div>
          {error && <div className="rounded-lg border border-rose-500/40 bg-rose-500/10 p-3 text-[13px] text-rose-300">{error}</div>}
        </div>
        <div className="p-6 border-t border-[var(--border)] flex justify-end gap-2">
          <button onClick={onClose} disabled={busy} className="px-4 py-2 rounded-lg font-bold text-[13px] text-[var(--fg-muted)] border border-[var(--border)]">Cancel</button>
          <button onClick={generate} disabled={busy} className="px-5 py-2 rounded-lg font-extrabold text-[13px] text-[var(--bg)] disabled:opacity-40" style={{ background: "linear-gradient(135deg, var(--accent), var(--accent-2))" }}>{busy ? "Generating…" : `★ Generate ${count * platforms.size} drafts`}</button>
        </div>
      </div>
    </div>
  );
}

function EditModal({ post, onClose, onSaved }: { post: Post; onClose: () => void; onSaved: () => void }) {
  const [body, setBody] = useState(post.body);
  const [scheduledAt, setScheduledAt] = useState(post.scheduled_at ? post.scheduled_at.slice(0, 16) : "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function save() {
    setBusy(true); setError(null);
    try {
      const r = await fetch("/api/admin/social/update", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: post.id, body, scheduled_at: scheduledAt ? new Date(scheduledAt).toISOString() : null }) });
      const j = await r.json();
      if (!j.ok) { setError(j.error || "Save failed"); return; }
      onSaved();
    } catch (err) { setError(err instanceof Error ? err.message : String(err)); }
    finally { setBusy(false); }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/60 grid place-items-center p-4" onClick={onClose}>
      <div className="bg-[var(--surface-2)] rounded-2xl border border-[var(--border)] max-w-2xl w-full" onClick={(e) => e.stopPropagation()}>
        <div className="p-6 border-b border-[var(--border)] flex items-center justify-between">
          <h2 className="text-[20px] font-extrabold text-[var(--fg)]">Edit {post.platform} post</h2>
          <button onClick={onClose} className="text-[var(--fg-muted)] hover:text-[var(--fg)] text-xl leading-none">×</button>
        </div>
        <div className="p-6 space-y-4">
          <textarea value={body} onChange={(e)=>setBody(e.target.value)} rows={8} className="w-full px-3 py-2 rounded-lg bg-[var(--bg)] border border-[var(--border)] text-[var(--fg)] text-sm" />
          <div className="text-[11px] text-[var(--fg-muted)]">{body.length}/{charLimit(post.platform)} chars{body.length > charLimit(post.platform) && <span className="ml-2 text-rose-500 font-bold">⚠ over limit</span>}</div>
          <div>
            <label className="text-[11px] tracking-wider uppercase font-bold text-[var(--fg-muted)] mb-1 block">Schedule for</label>
            <input type="datetime-local" value={scheduledAt} onChange={(e)=>setScheduledAt(e.target.value)} className="px-3 py-2 rounded-lg bg-[var(--bg)] border border-[var(--border)] text-[var(--fg)] text-sm" />
          </div>
          {error && <div className="rounded-lg border border-rose-500/40 bg-rose-500/10 p-3 text-[13px] text-rose-300">{error}</div>}
        </div>
        <div className="p-6 border-t border-[var(--border)] flex justify-end gap-2">
          <button onClick={onClose} disabled={busy} className="px-4 py-2 rounded-lg font-bold text-[13px] text-[var(--fg-muted)] border border-[var(--border)]">Cancel</button>
          <button onClick={save} disabled={busy} className="px-5 py-2 rounded-lg font-extrabold text-[13px] text-[var(--bg)]" style={{ background: "linear-gradient(135deg, var(--accent), var(--accent-2))" }}>{busy ? "Saving…" : "Save changes"}</button>
        </div>
      </div>
    </div>
  );
}
