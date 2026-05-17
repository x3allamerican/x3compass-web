/**
 * DOT-compliant Hazmat Placard — backed by real Wikimedia Commons SVG assets.
 *
 * The previous version of this component generated placards inline in code.
 * That worked but the placards weren't quite right (proportions, symbols,
 * exact colors). Joshua wanted real placards. So this version renders
 * actual public-domain DOT placard images from /public/placards/.
 *
 * Source: Wikimedia Commons (Category:Dangerous_goods_placards) — most files
 * are public domain U.S. Government works, the GHS pictograms and NFPA 704
 * template are released as PD-self. See /public/placards/manifest.json for
 * per-file attribution + source URLs, and public/placards/LICENSES.md.
 *
 * Public API is backwards-compatible with the prior in-code generator.
 */

export type HazardClass =
  | "1" | "1.1" | "1.2" | "1.3" | "1.4" | "1.5" | "1.6"
  | "2" | "2.1" | "2.2" | "2.3"
  | "3"
  | "4" | "4.1" | "4.2" | "4.3"
  | "5" | "5.1" | "5.2"
  | "6" | "6.1" | "6.2"
  | "7"
  | "8"
  | "9";

/**
 * Maps a HazardClass (parent or sub-division) to the canonical placard
 * filename in /public/placards/. When a parent class is selected (e.g. "4")
 * we default to the first sub-division ("4.1") since DOT requires a specific
 * division marker on the placard.
 */
const PLACARD_FILE: Record<HazardClass, string> = {
  "1":   "class-1-1.svg",     // generic Class 1 → 1.1 representative
  "1.1": "class-1-1.svg",
  "1.2": "class-1-2.svg",
  "1.3": "class-1-3.svg",
  "1.4": "class-1-4.svg",
  "1.5": "class-1-5.svg",
  "1.6": "class-1-6.svg",
  "2":   "class-2-2.svg",     // generic gas → non-flammable
  "2.1": "class-2-1.svg",
  "2.2": "class-2-2.svg",
  "2.3": "class-2-3.svg",
  "3":   "class-3.svg",
  "4":   "class-4-1.svg",
  "4.1": "class-4-1.svg",
  "4.2": "class-4-2.svg",
  "4.3": "class-4-3.svg",
  "5":   "class-5-1.svg",
  "5.1": "class-5-1.svg",
  "5.2": "class-5-2.svg",
  "6":   "class-6-1.svg",
  "6.1": "class-6-1.svg",
  "6.2": "class-6-2.svg",
  "7":   "class-7.svg",
  "8":   "class-8.svg",
  "9":   "class-9.svg",
};

const CLASS_NAME: Record<HazardClass, string> = {
  "1":   "Explosives",
  "1.1": "Explosives 1.1",
  "1.2": "Explosives 1.2",
  "1.3": "Explosives 1.3",
  "1.4": "Explosives 1.4",
  "1.5": "Blasting Agent 1.5",
  "1.6": "Explosives 1.6",
  "2":   "Non-Flammable Gas",
  "2.1": "Flammable Gas",
  "2.2": "Non-Flammable Gas",
  "2.3": "Poison Gas",
  "3":   "Flammable Liquid",
  "4":   "Flammable Solid",
  "4.1": "Flammable Solid",
  "4.2": "Spontaneously Combustible",
  "4.3": "Dangerous When Wet",
  "5":   "Oxidizer",
  "5.1": "Oxidizer",
  "5.2": "Organic Peroxide",
  "6":   "Toxic / Poison",
  "6.1": "Toxic / Poison",
  "6.2": "Infectious Substance",
  "7":   "Radioactive",
  "8":   "Corrosive",
  "9":   "Miscellaneous",
};

export type PlacardSpec = {
  /** Hazard class or division — drives which real placard image is shown */
  hazardClass: HazardClass;
  /** Optional UN/NA number rendered as a white-bar overlay (per § 172.332) */
  unNumber?: string;
  /** Optional class name caption shown below; auto-derived from hazardClass if omitted */
  className?: string;
  /** Rendered width in CSS pixels (placard is square; height = width) */
  size?: number;
  /** Show a "DOT" badge — kept for backwards-compat, ignored in this version */
  showDot?: boolean;
};

export default function Placard({
  hazardClass,
  unNumber,
  className,
  size = 200,
}: PlacardSpec) {
  const file = PLACARD_FILE[hazardClass];
  const niceName = className ?? CLASS_NAME[hazardClass];
  const ariaLabel = `DOT hazmat placard — ${niceName}${unNumber ? ` — UN${unNumber}` : ""}`;

  // UN-number overlay: a white rectangle with the 4-digit number, sized
  // proportionally to the placard. Per § 172.332(b), the digits are 3 in
  // tall on a 10.75" placard. We scale to roughly 16% of placard height.
  return (
    <div
      className="relative inline-block select-none"
      style={{ width: size, height: size }}
      aria-label={ariaLabel}
      role="img"
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={`/placards/${file}`}
        alt={niceName}
        width={size}
        height={size}
        draggable={false}
        className="block w-full h-full"
        style={{ imageRendering: "auto" }}
      />
      {unNumber && (
        <div
          className="absolute left-1/2 -translate-x-1/2 flex items-center justify-center bg-white border border-black/80 font-black text-black"
          style={{
            bottom: `${size * 0.18}px`,
            width: `${size * 0.34}px`,
            height: `${size * 0.11}px`,
            fontSize: `${size * 0.085}px`,
            letterSpacing: "0.05em",
            fontFamily: "ui-monospace, monospace",
          }}
        >
          {unNumber}
        </div>
      )}
    </div>
  );
}

/**
 * Get the public file path for a given hazard class. Used by gallery code
 * that wants to render the asset directly without the overlay wrapper.
 */
export function placardAssetPath(cls: HazardClass): string {
  return `/placards/${PLACARD_FILE[cls]}`;
}
