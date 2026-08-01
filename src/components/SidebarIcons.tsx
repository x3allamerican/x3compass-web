"use client";

/* ============================================================
   SidebarIcons · Lucide-style stroke icons for SidebarV2
   ------------------------------------------------------------
   Replaces the emoji icons that don't match app.x3compass.com.
   All icons render at 20×20 with currentColor stroke so they
   inherit the nav item's text color (bright white in our theme).
   ============================================================ */

import { ReactNode } from "react";

type IconProps = { size?: number; stroke?: number; className?: string };

const base = (size = 20, stroke = 1.6): React.SVGProps<SVGSVGElement> => ({
  width: size, height: size, viewBox: "0 0 24 24", fill: "none",
  stroke: "currentColor", strokeWidth: stroke, strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const, "aria-hidden": true,
});

// Compass / navigation
export const IconDashboard = (p: IconProps = {}) => (
  <svg {...base(p.size, p.stroke)}><circle cx="12" cy="12" r="9"/><polygon points="16 8 14 14 8 16 10 10 16 8"/></svg>
);

// Driver Brain · person
export const IconDriver = (p: IconProps = {}) => (
  <svg {...base(p.size, p.stroke)}><circle cx="12" cy="8" r="4"/><path d="M4 21v-1a6 6 0 0 1 6-6h4a6 6 0 0 1 6 6v1"/></svg>
);

// Vehicle Brain · truck
export const IconVehicle = (p: IconProps = {}) => (
  <svg {...base(p.size, p.stroke)}><path d="M1 17h14V5H1z"/><path d="M15 9h4l3 4v4h-7"/><circle cx="6" cy="19" r="2"/><circle cx="18" cy="19" r="2"/></svg>
);

// Ops Brain · settings gear
export const IconOps = (p: IconProps = {}) => (
  <svg {...base(p.size, p.stroke)}><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09a1.65 1.65 0 0 0 1.51-1 1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33h0a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82v0a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
);

// Audit & Reports · clipboard
export const IconAudit = (p: IconProps = {}) => (
  <svg {...base(p.size, p.stroke)}><rect x="8" y="2" width="8" height="4" rx="1"/><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><path d="M9 12h6"/><path d="M9 16h6"/></svg>
);

// Finance · dollar
export const IconFinance = (p: IconProps = {}) => (
  <svg {...base(p.size, p.stroke)}><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
);

// Integrations · plug
export const IconIntegrations = (p: IconProps = {}) => (
  <svg {...base(p.size, p.stroke)}><path d="M9 2v6M15 2v6"/><path d="M6 8h12v4a6 6 0 0 1-12 0z"/><path d="M12 18v3"/></svg>
);

// Ask Compass · sparkles
export const IconAsk = (p: IconProps = {}) => (
  <svg {...base(p.size, p.stroke)}><path d="M12 3l1.5 4.5L18 9l-4.5 1.5L12 15l-1.5-4.5L6 9l4.5-1.5z"/><path d="M19 14l.75 2.25L22 17l-2.25.75L19 20l-.75-2.25L16 17l2.25-.75z"/></svg>
);

// Hazmat · warning triangle
export const IconHazmat = (p: IconProps = {}) => (
  <svg {...base(p.size, p.stroke)}><path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
);

// Bulk Import · upload
export const IconImport = (p: IconProps = {}) => (
  <svg {...base(p.size, p.stroke)}><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
);

// Settings · same as ops gear (smaller)
export const IconSettings = IconOps;

/** Map keys → icons so SidebarV2 can look up by string id. */
export const SIDEBAR_ICONS: Record<string, (p?: IconProps) => ReactNode> = {
  dashboard:     IconDashboard,
  "driver-brain":IconDriver,
  "vehicle-brain":IconVehicle,
  "ops-brain":   IconOps,
  audit:         IconAudit,
  finance:       IconFinance,
  integrations:  IconIntegrations,
  ask:           IconAsk,
  hazmat:        IconHazmat,
  "bulk-import": IconImport,
  settings:      IconSettings,
};
