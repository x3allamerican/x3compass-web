"use client";

import { useEffect, useState, useMemo } from "react";

type AppRow = {
  id: string;
  submitted_at: string;
  name: string;
  email: string;
  phone: string | null;
  linkedin: string | null;
  company: string;
  state: string;
  years: string | null;
  client_count: string | null;
  services: string;
  fee_range: string | null;
  why_compass: string;
  current_tools: string | null;
  timeline: string | null;
  credentials: string | null;
  reference_carrier: string | null;
  email_id: string | null;
  status: string;
  notes: string | null;
  reviewed_at: string | null;
  reviewed_by: string | null;
};

const STATUSES = [
  "new",
  "contacted",
  "meeting_set",
  "signed",
  "declined",
  "duplicate",
];

const STATUS_COLORS: Record<string, string> = {
  new: "#FACC15",
  unreviewed: "#FACC15", // legacy alias
  contacted: "#16C7FF",
  meeting_set: "#A78BFA",
  signed: "#34D399",
  declined: "#94A3B8",
  duplicate: "#64748B",
};

// === Triage scorecard (mirrors partner-kit/08-PARTNER-LAUNCH-PLAYBOOK.md § E2) ===
function triageScore(r: AppRow): { score: number; tier: "HOT" | "WARM" | "COLD"; signals: string[] } {
  let score = 0;
  const signals: string[] = [];

  // Carrier count (3× weight)
  const cc = (r.client_count || "").toLowerCase();
  if (/(5|6|7|8|9|1[0-9]|[2-9][0-9])\+?(\s|$|car)/.test(cc) || /5\+/.test(cc)) {
    score += 6;
    signals.push("5+ carriers");
  } else if (/(1|2|3|4)(\s|$|car)/.test(cc) || /1-4/.test(cc) || /1.4/.test(cc)) {
    score += 3;
    signals.push("1-4 carriers");
  }

  // Years in business (1×)
  const yrs = (r.years || "").toLowerCase();
  if (/(5|6|7|8|9|1[0-9]|[2-9][0-9])\+?\s*(yr|year)/.test(yrs)) {
    score += 2;
    signals.push("5+ yrs");
  } else if (/(2|3|4)\s*(yr|year)/.test(yrs)) {
    score += 1;
    signals.push("2-5 yrs");
  }

  // Credentials (1×)
  const creds = (r.credentials || "").toLowerCase();
  if (/csp|natmi|cdt|cdsq|trans/.test(creds)) {
    score += 2;
    signals.push("Credentialed");
  }

  // Why answer quality (2×) · naive heuristic
  const why = (r.why_compass || "").toLowerCase();
  if (why.length > 250 && /(scale|roi|client|grow|automat|ai|leverage)/.test(why)) {
    score += 4;
    signals.push("Strong 'why'");
  } else if (why.length > 100) {
    score += 2;
    signals.push("Decent 'why'");
  }

  // Reference (2×)
  if ((r.reference_carrier || "").length > 30) {
    score += 4;
    signals.push("Reference provided");
  }

  let tier: "HOT" | "WARM" | "COLD" = "COLD";
  if (score >= 15) tier = "HOT";
  else if (score >= 8) tier = "WARM";

  return { score, tier, signals };
}

export default function AdminPartnersPage() {
  const [key, setKey] = useState<string>("");
  const [rows, setRows] = useState<AppRow[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [filter, setFilter] = useState<string>("all");

  // Load key from localStorage on mount
  useEffect(() => {
    const stored = typeof window !== "undefined" ? localStorage.getItem("x3_admin_key") : null;
    if (stored) setKey(stored);
  }, []);

  async function loadRows(useKey: string) {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/partners?key=${encodeURIComponent(useKey)}`);
      const j = (await res.json()) as { ok: boolean; rows?: AppRow[]; error?: string };
      if (!j.ok) throw new Error(j.error || "Failed to load");
      setRows(j.rows || []);
      localStorage.setItem("x3_admin_key", useKey);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Load failed");
      setRows(null);
    } finally {
      setLoading(false);
    }
  }

  async function updateRow(id: string, updates: { status?: string; notes?: string }) {
    try {
      const res = await fetch(`/api/admin/partners?key=${encodeURIComponent(key)}&id=${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });
      const j = (await res.json()) as { ok: boolean; error?: string };
      if (!j.ok) throw new Error(j.error || "Update failed");
      await loadRows(key);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Update failed");
    }
  }

  const filteredRows = useMemo(() => {
    if (!rows) return [];
    if (filter === "all") return rows;
    if (filter === "active") return rows.filter((r) => r.status !== "declined" && r.status !== "duplicate");
    return rows.filter((r) => r.status === filter);
  }, [rows, filter]);

  const selected = filteredRows.find((r) => r.id === selectedId) || null;

  const stats = useMemo(() => {
    if (!rows) return null;
    return {
      total: rows.length,
      unreviewed: rows.filter((r) => r.status === "unreviewed").length,
      hot: rows.filter((r) => triageScore(r).tier === "HOT" && r.status === "unreviewed").length,
      signed: rows.filter((r) => r.status === "signed").length,
    };
  }, [rows]);

  if (!rows && !loading) {
    return (
      <div style={{ minHeight: "100vh", background: "#000000", color: "white", padding: "60px 24px", display: "grid", placeItems: "center" }}>
        <div style={{ maxWidth: 420, width: "100%" }}>
          <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 8 }}>Admin · Partners</h1>
          <p style={{ color: "#94A3B8", fontSize: 14, marginBottom: 24 }}>
            Internal review dashboard for Compass Partner applications. Requires admin key.
          </p>
          <input
            type="password"
            value={key}
            onChange={(e) => setKey(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && key && loadRows(key)}
            placeholder="Admin key"
            style={{
              width: "100%",
              padding: "12px 14px",
              borderRadius: 8,
              background: "#0F2438",
              border: "1px solid #1E3556",
              color: "white",
              fontSize: 14,
              marginBottom: 12,
            }}
          />
          <button
            onClick={() => key && loadRows(key)}
            disabled={!key}
            style={{
              width: "100%",
              padding: "12px 14px",
              borderRadius: 8,
              background: "linear-gradient(135deg, #16C7FF, #16C7FF)",
              color: "#000000",
              fontWeight: 700,
              border: 0,
              cursor: key ? "pointer" : "not-allowed",
              opacity: key ? 1 : 0.6,
            }}
          >
            Unlock
          </button>
          {error && <p style={{ color: "#F87171", fontSize: 13, marginTop: 12 }}>{error}</p>}
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: "#000000", color: "white" }}>
      {/* Header */}
      <div style={{ background: "#091525", borderBottom: "1px solid #1E3556", padding: "16px 24px" }}>
        <div style={{ maxWidth: 1400, margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <h1 style={{ fontSize: 20, fontWeight: 800, margin: 0 }}>Admin · Partner applications</h1>
            <p style={{ fontSize: 12, color: "#94A3B8", margin: "2px 0 0 0" }}>
              Internal · X3 Fleet Safety LLC
            </p>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button
              onClick={() => loadRows(key)}
              disabled={loading}
              style={{
                padding: "8px 14px",
                borderRadius: 6,
                background: "#1E3556",
                color: "white",
                border: 0,
                fontSize: 13,
                cursor: "pointer",
              }}
            >
              {loading ? "Loading…" : "Refresh"}
            </button>
            <button
              onClick={() => {
                localStorage.removeItem("x3_admin_key");
                setKey("");
                setRows(null);
              }}
              style={{
                padding: "8px 14px",
                borderRadius: 6,
                background: "#0F2438",
                color: "#94A3B8",
                border: "1px solid #1E3556",
                fontSize: 13,
                cursor: "pointer",
              }}
            >
              Lock
            </button>
          </div>
        </div>
      </div>

      {/* Stats strip */}
      {stats && (
        <div style={{ background: "#0F2438", borderBottom: "1px solid #1E3556", padding: "16px 24px" }}>
          <div style={{ maxWidth: 1400, margin: "0 auto", display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 24 }}>
            <Stat label="Total applications" value={stats.total} />
            <Stat label="Unreviewed" value={stats.unreviewed} color={stats.unreviewed > 0 ? "#FACC15" : "white"} />
            <Stat label="Hot leads waiting" value={stats.hot} color={stats.hot > 0 ? "#16C7FF" : "white"} />
            <Stat label="Partners signed" value={stats.signed} color="#34D399" />
          </div>
        </div>
      )}

      {/* Filter chips */}
      <div style={{ maxWidth: 1400, margin: "0 auto", padding: "16px 24px", display: "flex", gap: 8, flexWrap: "wrap" }}>
        {["all", "active", ...STATUSES].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            style={{
              padding: "6px 12px",
              borderRadius: 14,
              border: 0,
              fontSize: 12,
              cursor: "pointer",
              background: filter === f ? "#16C7FF" : "#1E3556",
              color: filter === f ? "#000000" : "white",
              fontWeight: filter === f ? 700 : 500,
              textTransform: "capitalize",
            }}
          >
            {f.replace("_", " ")} {filter === f && rows && `(${filteredRows.length})`}
          </button>
        ))}
      </div>

      {/* List + detail */}
      <div style={{ maxWidth: 1400, margin: "0 auto", padding: "0 24px 40px", display: "grid", gridTemplateColumns: "minmax(0, 1fr) minmax(0, 1.5fr)", gap: 20 }}>
        {/* List */}
        <div style={{ background: "#0F2438", borderRadius: 12, border: "1px solid #1E3556", overflow: "hidden", maxHeight: "75vh", overflowY: "auto" }}>
          {filteredRows.length === 0 ? (
            <div style={{ padding: 40, textAlign: "center", color: "#94A3B8", fontSize: 14 }}>No applications match the filter.</div>
          ) : (
            filteredRows.map((r) => {
              const t = triageScore(r);
              return (
                <div
                  key={r.id}
                  onClick={() => setSelectedId(r.id)}
                  style={{
                    padding: "12px 14px",
                    borderBottom: "1px solid #1E3556",
                    cursor: "pointer",
                    background: selectedId === r.id ? "#143553" : "transparent",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <div style={{ fontWeight: 600, fontSize: 14, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                        {r.name}
                      </div>
                      <div style={{ fontSize: 12, color: "#94A3B8", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                        {r.company} · {r.state}
                      </div>
                    </div>
                    <TierBadge tier={t.tier} score={t.score} />
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 6 }}>
                    <StatusDot status={r.status} />
                    <span style={{ fontSize: 11, color: "#94A3B8" }}>
                      {r.status} · {new Date(r.submitted_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Detail */}
        <div style={{ background: "#0F2438", borderRadius: 12, border: "1px solid #1E3556", padding: 24, maxHeight: "75vh", overflowY: "auto" }}>
          {!selected ? (
            <div style={{ color: "#94A3B8", textAlign: "center", padding: 60 }}>Select an application on the left</div>
          ) : (
            <ApplicantDetail row={selected} updateRow={updateRow} />
          )}
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value, color = "white" }: { label: string; value: number; color?: string }) {
  return (
    <div>
      <div style={{ fontSize: 12, color: "#94A3B8", textTransform: "uppercase", letterSpacing: 1.5, fontWeight: 600 }}>{label}</div>
      <div style={{ fontSize: 28, fontWeight: 800, color, marginTop: 4 }}>{value}</div>
    </div>
  );
}

function StatusDot({ status }: { status: string }) {
  return <span style={{ display: "inline-block", width: 8, height: 8, borderRadius: 4, background: STATUS_COLORS[status] || "#64748B" }} />;
}

function TierBadge({ tier, score }: { tier: "HOT" | "WARM" | "COLD"; score: number }) {
  const colors = {
    HOT: { bg: "#16C7FF", fg: "#000000" },
    WARM: { bg: "#FACC15", fg: "#000000" },
    COLD: { bg: "#475569", fg: "white" },
  }[tier];
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 4, background: colors.bg, color: colors.fg, fontSize: 10, fontWeight: 800, padding: "3px 8px", borderRadius: 10, letterSpacing: 0.5 }}>
      {tier} · {score}
    </span>
  );
}

function ApplicantDetail({ row, updateRow }: { row: AppRow; updateRow: (id: string, u: { status?: string; notes?: string }) => void }) {
  const t = triageScore(row);
  const [notes, setNotes] = useState(row.notes || "");
  const [savedNotes, setSavedNotes] = useState(row.notes || "");

  useEffect(() => {
    setNotes(row.notes || "");
    setSavedNotes(row.notes || "");
  }, [row.id, row.notes]);

  return (
    <div>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 16 }}>
        <div>
          <h2 style={{ fontSize: 22, fontWeight: 800, margin: 0 }}>{row.name}</h2>
          <div style={{ color: "#94A3B8", fontSize: 14, marginTop: 2 }}>
            {row.company} · {row.state}
          </div>
        </div>
        <TierBadge tier={t.tier} score={t.score} />
      </div>

      <div style={{ background: "#143553", padding: 14, borderRadius: 8, marginBottom: 16, fontSize: 13 }}>
        <strong style={{ color: "#16C7FF" }}>Triage signals:</strong> {t.signals.join(" · ") || "—"}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "120px 1fr", gap: "8px 14px", fontSize: 13, marginBottom: 20 }}>
        <Label>Email</Label>
        <div><a href={`mailto:${row.email}`} style={{ color: "#16C7FF" }}>{row.email}</a></div>
        <Label>Phone</Label>
        <div>{row.phone || "—"}</div>
        <Label>LinkedIn</Label>
        <div>{row.linkedin ? <a href={row.linkedin} target="_blank" rel="noopener noreferrer" style={{ color: "#16C7FF" }}>{row.linkedin}</a> : "—"}</div>
        <Label>Years</Label>
        <div>{row.years || "—"}</div>
        <Label>Clients</Label>
        <div>{row.client_count || "—"}</div>
        <Label>Services</Label>
        <div>{row.services}</div>
        <Label>Typical fee</Label>
        <div>{row.fee_range || "—"}</div>
        <Label>Timeline</Label>
        <div>{row.timeline || "—"}</div>
        <Label>Credentials</Label>
        <div>{row.credentials || "—"}</div>
        <Label>Reference</Label>
        <div>{row.reference_carrier || "—"}</div>
        <Label>Submitted</Label>
        <div>{new Date(row.submitted_at).toLocaleString()}</div>
      </div>

      <Section title="Why Compass Partner">{row.why_compass}</Section>
      {row.current_tools && <Section title="Current tools">{row.current_tools}</Section>}

      <div style={{ marginTop: 20, paddingTop: 20, borderTop: "1px solid #1E3556" }}>
        <Label>Status</Label>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 6 }}>
          {STATUSES.map((s) => (
            <button
              key={s}
              onClick={() => updateRow(row.id, { status: s })}
              style={{
                padding: "6px 12px",
                borderRadius: 6,
                border: 0,
                fontSize: 12,
                cursor: "pointer",
                background: row.status === s ? STATUS_COLORS[s] : "#1E3556",
                color: row.status === s ? "#000000" : "white",
                fontWeight: row.status === s ? 700 : 500,
                textTransform: "capitalize",
              }}
            >
              {s.replace("_", " ")}
            </button>
          ))}
        </div>
      </div>

      <div style={{ marginTop: 20 }}>
        <Label>Notes</Label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={4}
          style={{
            width: "100%",
            marginTop: 6,
            padding: 12,
            borderRadius: 8,
            background: "#000000",
            color: "white",
            border: "1px solid #1E3556",
            fontSize: 13,
            fontFamily: "inherit",
            resize: "vertical",
          }}
        />
        <button
          onClick={() => {
            updateRow(row.id, { notes });
            setSavedNotes(notes);
          }}
          disabled={notes === savedNotes}
          style={{
            marginTop: 8,
            padding: "8px 14px",
            borderRadius: 6,
            background: notes === savedNotes ? "#1E3556" : "linear-gradient(135deg, #16C7FF, #16C7FF)",
            color: notes === savedNotes ? "#64748B" : "#000000",
            fontWeight: 700,
            border: 0,
            fontSize: 13,
            cursor: notes === savedNotes ? "not-allowed" : "pointer",
          }}
        >
          Save notes
        </button>
      </div>

      <div style={{ marginTop: 24, paddingTop: 20, borderTop: "1px solid #1E3556", display: "flex", gap: 8, flexWrap: "wrap" }}>
        <a
          href={`mailto:${row.email}?subject=Re%3A%20your%20Compass%20Partner%20application&body=Hi%20${encodeURIComponent(row.name.split(" ")[0])}%2C%0A%0AThanks%20for%20applying%20to%20the%20X3%20Compass%20Partner%20program.%20`}
          style={{ padding: "8px 14px", borderRadius: 6, background: "#16C7FF", color: "#000000", fontWeight: 700, fontSize: 13, textDecoration: "none" }}
        >
          ✉ Reply by email
        </a>
        <a
          href="https://calendly.com/joshua-x3compass/partner-discovery"
          target="_blank"
          rel="noopener noreferrer"
          style={{ padding: "8px 14px", borderRadius: 6, background: "#1E3556", color: "white", fontWeight: 700, fontSize: 13, textDecoration: "none" }}
        >
          🗓 Open Calendly link
        </a>
      </div>
    </div>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return <div style={{ color: "#94A3B8", fontSize: 11, textTransform: "uppercase", letterSpacing: 1.5, fontWeight: 600 }}>{children}</div>;
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{ color: "#16C7FF", fontSize: 13, fontWeight: 700, marginBottom: 6 }}>{title}</div>
      <div style={{ background: "#091525", padding: 14, borderRadius: 8, fontSize: 13, lineHeight: 1.55, whiteSpace: "pre-wrap" }}>{children}</div>
    </div>
  );
}
