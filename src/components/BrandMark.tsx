"use client";

/**
 * BrandMark · single source of truth for the X3 brand-family logo.
 *
 * Uses the actual high-res master image (1536×1024 PNG from Joshua's design)
 * cropped + composited into per-variant lockups in /public/.
 *
 *   - "fleet-safety" → /x3-lockup-fleet-safety.png  (parent company hub)
 *   - "compass"      → /x3-lockup-compass.png       (product marketing + app)
 *   - "hazmat"       → /x3-lockup-hazmat.png        (hazmat vertical)
 *   - "education"    → /x3-lockup-education.png     (education vertical)
 *   - "mark-only"    → /x3-mark.png                 (favicon-style, no wordmark)
 *
 * USE CASES
 *   Header (TopNav):    <BrandMark variant="compass" href="/" size="md" />
 *   Sidebar:            <BrandMark variant="compass" size="sm" />
 *   Footer:             <BrandMark variant="compass" size="md" />
 *   Marketing hero:     <BrandMark variant="compass" size="xl" />
 */

import Image from "next/image";
import Link from "next/link";

export type BrandVariant =
  | "fleet-safety"
  | "compass"
  | "hazmat"
  | "education"
  | "dot-skills"
  | "mark-only";

type Size = "sm" | "md" | "lg" | "xl";

const LOCKUP: Record<Exclude<BrandVariant, "mark-only">, string> = {
  "fleet-safety": "/x3-lockup-fleet-safety.png",
  "compass":      "/x3-logo-v0.png",  // X3 FLEET SAFETY lockup · master brand on this site
  "hazmat":       "/x3-lockup-hazmat.png",
  "education":    "/x3-lockup-education.png",
  "dot-skills":   "/x3-lockup-dot-skills.png",
};

// Per-variant aspect ratio (W/H). Most lockups are 1536×1024 (1.5), but
// x3-logo-v0.png ships at 181×102 (1.775).
const LOCKUP_ASPECT: Record<Exclude<BrandVariant, "mark-only">, number> = {
  "fleet-safety": 1.5,
  "compass":      181 / 102,
  "hazmat":       1.5,
  "education":    1.5,
  "dot-skills":   1.5,
};

const ALT: Record<BrandVariant, string> = {
  "fleet-safety": "X3 Fleet Safety",
  "compass":      "X3 Compass",
  "hazmat":       "X3 Hazmat",
  "education":    "X3 Education",
  "dot-skills":   "X3 DOT Skills",
  "mark-only":    "X3",
};

// Heights are what we set; aspect ratio is preserved via Image width/height props
// The master lockup is 1536×1024 (3:2 ratio).
// The mark-only image is 1024×1024 (1:1).
const SIZING: Record<Size, { lockupHeight: number; markHeight: number }> = {
  sm: { lockupHeight: 36, markHeight: 32 },
  md: { lockupHeight: 56, markHeight: 44 },
  lg: { lockupHeight: 72, markHeight: 60 },
  xl: { lockupHeight: 200, markHeight: 160 },
};

interface BrandMarkProps {
  variant?: BrandVariant;
  size?: Size;
  href?: string;
  className?: string;
  priority?: boolean;
}

export default function BrandMark({
  variant = "compass",
  size = "md",
  href,
  className = "",
  priority = false,
}: BrandMarkProps) {
  const s = SIZING[size];

  const img =
    variant === "mark-only" ? (
      <Image
        src="/x3-mark.png"
        alt={ALT[variant]}
        width={s.markHeight}
        height={s.markHeight}
        priority={priority}
        className="object-contain"
      />
    ) : (
      <Image
        src={LOCKUP[variant]}
        alt={ALT[variant]}
        width={Math.round(s.lockupHeight * LOCKUP_ASPECT[variant])}
        height={s.lockupHeight}
        priority={priority}
        className="object-contain"
      />
    );

  const body = <div className={`inline-flex items-center ${className}`}>{img}</div>;

  return href ? (
    <Link href={href} className="inline-flex items-center group" aria-label={ALT[variant]}>
      {body}
    </Link>
  ) : (
    body
  );
}
