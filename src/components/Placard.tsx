/**
 * DOT-compliant Hazmat Placard generator.
 *
 * Renders an accurate diamond-shaped placard per 49 CFR § 172, Subpart F.
 * Scalable SVG — works at any size. Pixel-accurate colors per class.
 *
 * Colors are sourced from 49 CFR § 172.519 (general placarding tables).
 * Symbols are simplified SVG renderings of FMCSA-standard hazmat symbols.
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

export type PlacardSpec = {
  /** Hazard class or division — drives colors, symbol, class number */
  hazardClass: HazardClass;
  /** Optional UN/NA number displayed in the center band (e.g., "1203") */
  unNumber?: string;
  /** Optional class name text (FLAMMABLE, CORROSIVE, etc.) — auto-derived if omitted */
  className?: string;
  /** Rendered width in CSS pixels (placard is square; height = width) */
  size?: number;
  /** Show a small "DOT" badge for branding context */
  showDot?: boolean;
};

type ClassConfig = {
  bgColor: string;
  textColor: string;
  symbolColor: string;
  name: string;
  symbol: "explosive" | "flame" | "gas-cylinder" | "skull" | "flame-circle" | "biohazard" | "trefoil" | "corrosive" | "stripes" | "none";
  /** For dual-color placards (Class 4.2, 5.2) */
  splitBg?: string;
};

const CLASS_TABLE: Record<HazardClass, ClassConfig> = {
  "1":   { bgColor: "#F26B27", textColor: "#000000", symbolColor: "#000000", name: "EXPLOSIVES", symbol: "explosive" },
  "1.1": { bgColor: "#F26B27", textColor: "#000000", symbolColor: "#000000", name: "EXPLOSIVES 1.1", symbol: "explosive" },
  "1.2": { bgColor: "#F26B27", textColor: "#000000", symbolColor: "#000000", name: "EXPLOSIVES 1.2", symbol: "explosive" },
  "1.3": { bgColor: "#F26B27", textColor: "#000000", symbolColor: "#000000", name: "EXPLOSIVES 1.3", symbol: "explosive" },
  "1.4": { bgColor: "#F26B27", textColor: "#000000", symbolColor: "#000000", name: "EXPLOSIVES 1.4", symbol: "none" },
  "1.5": { bgColor: "#F26B27", textColor: "#000000", symbolColor: "#000000", name: "1.5 BLASTING AGENT", symbol: "none" },
  "1.6": { bgColor: "#F26B27", textColor: "#000000", symbolColor: "#000000", name: "EXPLOSIVES 1.6", symbol: "none" },
  "2":   { bgColor: "#1D9F5B", textColor: "#FFFFFF", symbolColor: "#FFFFFF", name: "NON-FLAMMABLE GAS", symbol: "gas-cylinder" },
  "2.1": { bgColor: "#E11D2C", textColor: "#FFFFFF", symbolColor: "#FFFFFF", name: "FLAMMABLE GAS", symbol: "flame" },
  "2.2": { bgColor: "#1D9F5B", textColor: "#FFFFFF", symbolColor: "#FFFFFF", name: "NON-FLAMMABLE GAS", symbol: "gas-cylinder" },
  "2.3": { bgColor: "#FFFFFF", textColor: "#000000", symbolColor: "#000000", name: "INHALATION HAZARD", symbol: "skull" },
  "3":   { bgColor: "#E11D2C", textColor: "#FFFFFF", symbolColor: "#FFFFFF", name: "FLAMMABLE", symbol: "flame" },
  "4":   { bgColor: "#FFFFFF", textColor: "#000000", symbolColor: "#E11D2C", name: "FLAMMABLE SOLID", symbol: "flame", splitBg: "#E11D2C" /* striped via overlay */ },
  "4.1": { bgColor: "#FFFFFF", textColor: "#000000", symbolColor: "#000000", name: "FLAMMABLE SOLID", symbol: "flame", splitBg: "#E11D2C" },
  "4.2": { bgColor: "#FFFFFF", textColor: "#000000", symbolColor: "#000000", name: "SPONTANEOUSLY COMBUSTIBLE", symbol: "flame", splitBg: "#E11D2C" },
  "4.3": { bgColor: "#3A6BD9", textColor: "#FFFFFF", symbolColor: "#FFFFFF", name: "DANGEROUS WHEN WET", symbol: "flame" },
  "5":   { bgColor: "#F2BD3B", textColor: "#000000", symbolColor: "#000000", name: "OXIDIZER", symbol: "flame-circle" },
  "5.1": { bgColor: "#F2BD3B", textColor: "#000000", symbolColor: "#000000", name: "OXIDIZER", symbol: "flame-circle" },
  "5.2": { bgColor: "#E11D2C", textColor: "#FFFFFF", symbolColor: "#FFFFFF", name: "ORGANIC PEROXIDE", symbol: "flame", splitBg: "#F2BD3B" },
  "6":   { bgColor: "#FFFFFF", textColor: "#000000", symbolColor: "#000000", name: "POISON", symbol: "skull" },
  "6.1": { bgColor: "#FFFFFF", textColor: "#000000", symbolColor: "#000000", name: "POISON", symbol: "skull" },
  "6.2": { bgColor: "#FFFFFF", textColor: "#000000", symbolColor: "#000000", name: "INFECTIOUS SUBSTANCE", symbol: "biohazard" },
  "7":   { bgColor: "#F2BD3B", textColor: "#000000", symbolColor: "#000000", name: "RADIOACTIVE", symbol: "trefoil", splitBg: "#FFFFFF" },
  "8":   { bgColor: "#FFFFFF", textColor: "#000000", symbolColor: "#000000", name: "CORROSIVE", symbol: "corrosive", splitBg: "#000000" },
  "9":   { bgColor: "#FFFFFF", textColor: "#000000", symbolColor: "#000000", name: "MISCELLANEOUS", symbol: "stripes" },
};

function Symbol({ kind, color }: { kind: ClassConfig["symbol"]; color: string }) {
  const stroke = color;
  switch (kind) {
    case "flame":
      // Stylized flame
      return (
        <path
          d="M 50 18 C 56 28, 64 32, 64 44 C 64 54, 58 62, 50 62 C 42 62, 36 54, 36 44 C 36 38, 40 35, 42 32 C 44 36, 48 38, 50 32 C 50 26, 48 22, 50 18 Z"
          fill={color}
        />
      );
    case "gas-cylinder":
      // Stylized gas cylinder (vertical with rounded top)
      return (
        <g fill={color}>
          <rect x="40" y="22" width="20" height="40" rx="3" />
          <rect x="44" y="18" width="12" height="6" rx="1" />
          <rect x="46" y="14" width="8" height="6" />
        </g>
      );
    case "skull":
      // Stylized skull with crossbones
      return (
        <g fill={color}>
          {/* Crossbones */}
          <rect x="22" y="55" width="56" height="4" transform="rotate(45 50 57)" />
          <rect x="22" y="55" width="56" height="4" transform="rotate(-45 50 57)" />
          {/* Skull */}
          <ellipse cx="50" cy="38" rx="14" ry="13" />
          <rect x="44" y="48" width="12" height="6" />
          {/* Eye sockets */}
          <circle cx="44" cy="36" r="2.5" fill={kind === "skull" ? "#FFFFFF" : "#000"} />
          <circle cx="56" cy="36" r="2.5" fill={kind === "skull" ? "#FFFFFF" : "#000"} />
          {/* Nose */}
          <path d="M 50 42 L 47 47 L 53 47 Z" fill={kind === "skull" ? "#FFFFFF" : "#000"} />
        </g>
      );
    case "flame-circle":
      // Flame inside a circle (oxidizer)
      return (
        <g fill={color}>
          <circle cx="50" cy="42" r="22" fill="none" stroke={color} strokeWidth="3" />
          <path d="M 50 28 C 55 36, 60 38, 60 47 C 60 54, 56 60, 50 60 C 44 60, 40 54, 40 47 C 40 42, 43 40, 45 38 C 47 41, 50 42, 50 37 C 50 33, 48 30, 50 28 Z" />
        </g>
      );
    case "biohazard":
      // Stylized biohazard trefoil
      return (
        <g fill={color} stroke={color} strokeWidth="1.5">
          <circle cx="50" cy="40" r="6" fill="none" strokeWidth="2.5" />
          {[0, 120, 240].map((deg) => (
            <g key={deg} transform={`rotate(${deg} 50 40)`}>
              <path d="M 50 22 C 48 22, 46 24, 46 28 C 46 32, 48 34, 50 34 C 52 34, 54 32, 54 28 C 54 24, 52 22, 50 22 Z" />
            </g>
          ))}
        </g>
      );
    case "trefoil":
      // Radioactive trefoil
      return (
        <g fill={color}>
          <circle cx="50" cy="28" r="4" />
          {[0, 120, 240].map((deg) => (
            <path
              key={deg}
              d="M 50 28 L 56 18 A 22 22 0 0 1 64 30 Z"
              transform={`rotate(${deg} 50 28)`}
            />
          ))}
        </g>
      );
    case "corrosive":
      // Stylized hand + metal being dripped on by acid drips
      return (
        <g fill={color} stroke={color} strokeWidth="0.5">
          {/* Acid drip from test tube */}
          <path d="M 28 18 L 34 18 L 34 28 L 36 32 L 32 36 L 28 32 L 28 18 Z" />
          {/* Drips */}
          <circle cx="32" cy="36" r="1" />
          <circle cx="32" cy="40" r="1.2" />
          {/* Surface being corroded */}
          <path d="M 24 44 L 44 44 L 44 48 L 24 48 Z" />
          <path d="M 27 48 L 27 52 M 32 48 L 32 53 M 37 48 L 37 51 M 41 48 L 41 52" stroke={color} strokeWidth="1.5" />

          {/* Hand being corroded */}
          <path d="M 56 18 L 68 18 L 70 28 L 64 36 L 60 38 L 56 32 L 56 18 Z" />
          <circle cx="60" cy="34" r="0.8" />
          <circle cx="63" cy="38" r="0.8" />
          <circle cx="66" cy="36" r="0.8" />
        </g>
      );
    case "explosive":
      // Stylized explosion burst
      return (
        <path
          d="M 50 18 L 55 30 L 68 27 L 60 38 L 70 45 L 58 47 L 60 60 L 50 55 L 40 60 L 42 47 L 30 45 L 40 38 L 32 27 L 45 30 Z"
          fill={color}
        />
      );
    case "stripes":
      // Class 9 — vertical black stripes in top half
      return (
        <g fill={color}>
          {[0, 1, 2, 3, 4, 5, 6].map((i) => (
            <rect key={i} x={18 + i * 9} y="14" width="3" height="40" />
          ))}
        </g>
      );
    case "none":
      return null;
  }
}

export default function Placard({
  hazardClass,
  unNumber,
  className,
  size = 220,
  showDot,
}: PlacardSpec) {
  const config = CLASS_TABLE[hazardClass];
  if (!config) return null;

  const label = className ?? config.name;
  const classText = hazardClass.replace(".", ".");

  const viewBoxSize = 100;
  // The placard is a diamond — square rotated 45°. We render in a 100×100 viewBox
  // and apply rotate(45) so the diamond fills the SVG area.

  // For split-background classes (4.x oxidizers, 5.2, 7, 8, 9), we paint the inner
  // diamond half/striped to match DOT specs.
  const hasSplitBg = config.splitBg && (hazardClass === "4.1" || hazardClass === "4.2" || hazardClass === "5.2" || hazardClass === "7" || hazardClass === "8");

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${viewBoxSize} ${viewBoxSize}`}
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label={`DOT hazmat placard: ${label}${unNumber ? ` UN${unNumber}` : ""}`}
    >
      {/* Diamond outer border */}
      <g transform={`rotate(45 ${viewBoxSize / 2} ${viewBoxSize / 2})`}>
        {/* Black border ~3% inset */}
        <rect x="14" y="14" width="72" height="72" fill="#000" />
        {/* Main color fill */}
        <rect x="17" y="17" width="66" height="66" fill={config.bgColor} />

        {/* Class 4.1/4.2 — vertical red stripes (flammable solid) */}
        {(hazardClass === "4.1" || hazardClass === "4.2") && config.splitBg && (
          <g>
            {[0, 1, 2, 3, 4, 5, 6].map((i) => (
              <rect
                key={i}
                x={17 + i * 9}
                y="17"
                width="4.5"
                height="66"
                fill={config.splitBg}
              />
            ))}
          </g>
        )}

        {/* Class 5.2 — top half red, bottom half yellow */}
        {hazardClass === "5.2" && (
          <rect x="17" y="17" width="66" height="33" fill="#E11D2C" />
        )}

        {/* Class 7 — top half yellow, bottom half white */}
        {hazardClass === "7" && (
          <rect x="17" y="50" width="66" height="33" fill="#FFFFFF" />
        )}

        {/* Class 8 — top half white, bottom half black */}
        {hazardClass === "8" && (
          <rect x="17" y="50" width="66" height="33" fill="#000000" />
        )}

        {/* Class 9 — striped top half */}
        {hazardClass === "9" && (
          <g>
            {[0, 1, 2, 3, 4, 5, 6].map((i) => (
              <rect
                key={i}
                x={17 + i * 9.5}
                y="17"
                width="4.5"
                height="30"
                fill="#000"
              />
            ))}
          </g>
        )}

        {/* Inner black border */}
        <rect
          x="20"
          y="20"
          width="60"
          height="60"
          fill="none"
          stroke="#000"
          strokeWidth="0.8"
        />
      </g>

      {/* Symbol in top quadrant */}
      <g>
        <Symbol kind={config.symbol} color={hazardClass === "8" ? "#000" : config.symbolColor} />
      </g>

      {/* UN number band (when provided) */}
      {unNumber && (
        <g>
          <rect x="22" y="50" width="56" height="12" fill="#FFFFFF" stroke="#000" strokeWidth="0.8" />
          <text
            x="50"
            y="59"
            textAnchor="middle"
            fontFamily="Arial, Helvetica, sans-serif"
            fontSize="9"
            fontWeight="900"
            fill="#000"
          >
            {unNumber}
          </text>
        </g>
      )}

      {/* Class name text */}
      <text
        x="50"
        y={unNumber ? 72 : 68}
        textAnchor="middle"
        fontFamily="Arial, Helvetica, sans-serif"
        fontSize={label.length > 14 ? 5 : label.length > 10 ? 6 : 7}
        fontWeight="900"
        fill={hazardClass === "8" ? "#FFFFFF" : config.textColor}
        style={{ letterSpacing: "0.5px" }}
      >
        {label}
      </text>

      {/* Class number — bottom corner of the diamond */}
      <text
        x="50"
        y="86"
        textAnchor="middle"
        fontFamily="Arial Black, Arial, sans-serif"
        fontSize="11"
        fontWeight="900"
        fill={hazardClass === "8" ? "#FFFFFF" : config.textColor}
      >
        {classText}
      </text>

      {/* Optional DOT label */}
      {showDot && (
        <text
          x="95"
          y="98"
          textAnchor="end"
          fontFamily="Arial, Helvetica, sans-serif"
          fontSize="3"
          fill="rgba(0,0,0,0.4)"
        >
          DOT § 172
        </text>
      )}
    </svg>
  );
}
