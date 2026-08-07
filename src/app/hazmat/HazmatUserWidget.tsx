"use client";

/* Client island for the Hazmat topbar identity widget.
 * Lives separately from HazmatAppShell so the parent stays a Server
 * Component (so the <link rel="stylesheet"> tags for the static x3
 * stylesheets render server-side and there's no FOUC on first paint).
 *
 * Reads the Supabase session via useUser → derives a display name +
 * initials from full_name → email local-part → "Driver". Falls back
 * to "X3 Compass / Signed out" if no cached session is available.
 */

import { useUser } from "@/lib/useUser";

function deriveDisplayUser(user: ReturnType<typeof useUser>["user"]) {
  if (!user) return { name: "X3 Compass", role: "Signed out", initials: "X3", email: "" };
  const metaName =
    (user.user_metadata?.full_name as string | undefined) ||
    (user.user_metadata?.name as string | undefined) ||
    "";
  const emailLocal = (user.email || "").split("@")[0] || "";
  const display = (metaName || emailLocal).trim() || "Driver";
  const initials =
    display
      .split(/[\s.\-_@]+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((p) => p[0]?.toUpperCase() || "")
      .join("") || "JK";
  return {
    name: display,
    role: (user.user_metadata?.role as string | undefined) || "Fleet Manager",
    initials,
    email: user.email || "",
  };
}

export default function HazmatUserWidget() {
  const { user } = useUser();
  const me = deriveDisplayUser(user);
  return (
    <div className="topbar-user" title={me.email}>
      <div className="topbar-user-avatar">{me.initials}</div>
      <div className="topbar-user-text">
        <div className="topbar-user-name">{me.name}</div>
        <div className="topbar-user-role">{me.role}</div>
      </div>
      <span style={{ color: "var(--fg-faint)", fontSize: 11 }}>▾</span>
    </div>
  );
}
