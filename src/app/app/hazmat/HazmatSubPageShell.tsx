/* ============================================================
   X3 COMPASS · HAZMAT SUB-PAGE SHELL
   ------------------------------------------------------------
   Shared wrapper for the 9 /app/hazmat/* sub-pages so every
   sub-page renders with:
     · HazmatAppShell (sidebar + topbar + brand-box)
     · EducationHubCard at the TOP (Drivers · Employers ·
       Compliance Officers) with the AI Concierge button
     · Page-specific body content below (the page's own
       hz-page-bar + interactive tool + tables)

   No generic SubPageShell hero — each page renders the static
   reference's `.hz-page-bar` itself, so we mirror the static
   pixel-for-pixel.
   ============================================================ */

import { ReactNode } from "react";
import HazmatAppShell from "./HazmatAppShell";
import EducationHubCard, { type Audience } from "@/components/EducationHubCard";
import ConciergeModal from "@/components/ConciergeModal";
import EducationHubModal from "@/components/EducationHubModal";
import HazmatPillBar from "./HazmatPillBar";

type Props = {
  /** Sidebar highlight id (must match HazmatAppShell's SIDEBAR ids,
   *  e.g. "hazmat-placard-wizard", "hazmat-substances") */
  activeId: string;
  /** Topbar title — typically the page's display label */
  pageTitle: string;
  /** Page-specific body content. Render the page's static
   *  `.hz-page-bar` + main interactive content here. */
  children: ReactNode;
  /** Education Hub surface label, e.g., "Placard Wizard" */
  eduSurface: string;
  /** Education Hub subtitle (one-line context) */
  eduSubtitle: string;
  /** 3 audience cards for the Education Hub */
  eduAudiences: Audience[];
  /** Concierge deep-link, defaults to /app/ask?context=hazmat */
  conciergeHref?: string;
  /** When true, render a compact 2-pill bar at the top
   *  (Education Hub + Ask AI Concierge — both open as modals)
   *  instead of the full inline Education Hub card. */
  pillMode?: boolean;
};

export default function HazmatSubPageShell({
  activeId,
  pageTitle,
  children,
  eduSurface,
  eduSubtitle,
  eduAudiences,
  conciergeHref = "/app/ask?context=hazmat",
  pillMode = false,
}: Props) {
  return (
    <HazmatAppShell activeId={activeId} pageTitle={pageTitle}>
      {pillMode ? (
        /* PILL MODE — compact 2-pill bar. Both pills open modals. */
        <HazmatPillBar
          surface={eduSurface}
          subtitle={eduSubtitle}
          audiences={eduAudiences}
          conciergeHref={conciergeHref}
        />
      ) : (
        /* CARD MODE (default) — full inline Education Hub card. */
        <div style={{ marginBottom: 22 }}>
          <EducationHubCard
            surface={eduSurface}
            subtitle={eduSubtitle}
            conciergeHref={conciergeHref}
            audiences={eduAudiences}
          />
        </div>
      )}

      {/* ============== PAGE-SPECIFIC BODY ============== */}
      <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
        {children}
      </div>

      {/* ============== IN-PAGE OVERLAYS ============== */}
      <ConciergeModal />
      <EducationHubModal />
    </HazmatAppShell>
  );
}
