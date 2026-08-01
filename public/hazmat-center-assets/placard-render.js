/* =================================================================
   DOT-SPEC HAZMAT PLACARD RENDERER v2
   - 20 hazard-class placards from Wikimedia (DOT hazmat class X.svg)
   - 18 Class 1 compatibility group placards (UN 1.1A-1.6N)
   - 19 specialty markings (Dangerous, Marine Pollutant, Combustible,
     Fumigation, Inhalation, ORM-D, Fissile, Lithium, Blasting Agents,
     Limited Quantity, Class 9 label, Org Peroxide, ERG plate, etc.)
   - Inline fallback SVG for any class not yet imaged
   ================================================================= */

// Hazard-class placard files we have on disk
const PLACARD_FILES = {
  // Class 1 compatibility groups
  "1.1":"class-1.1.svg","1.1A":"class-1.1A.svg","1.1B":"class-1.1B.svg","1.1C":"class-1.1C.svg",
  "1.1D":"class-1.1D.svg","1.1E":"class-1.1E.svg","1.1F":"class-1.1F.svg","1.1G":"class-1.1G.svg",
  "1.2":"class-1.2.svg","1.3":"class-1.3.svg","1.3G":"class-1.3G.svg",
  "1.4":"class-1.4.svg","1.4C":"class-1.4C.svg","1.4D":"class-1.4D.svg","1.4S":"class-1.4S.svg",
  "1.5":"class-1.5.svg","1.6":"class-1.6.svg","1.6N":"class-1.6N.svg",
  // Class 2
  "2.1":"class-2.1.svg","2.2":"class-2.2.svg","2.3":"class-2.3.svg",
  // Class 3
  "3":"class-3.svg",
  // Class 4
  "4.1":"class-4.1.svg","4.2":"class-4.2.svg","4.3":"class-4.3.svg",
  // Class 5
  "5.1":"class-5.1.svg","5.2":"class-5.2.svg",
  // Class 6
  "6.1":"class-6.1.svg","6.2":"class-6.2.svg",
  // Class 7-9
  "7":"class-7.svg","8":"class-8.svg","9":"class-9.svg"
};

// Specialty placards/markings keyed by short name
const SPECIALTY_PLACARDS = {
  "dangerous":              { file: "placard-dangerous.svg",                  name: "DANGEROUS",                cfr: "172.504(b)",     desc: "Mixed-load placard for non-bulk shipments of 2+ classes" },
  "marine-pollutant":       { file: "placard-marine-pollutant.svg",           name: "MARINE POLLUTANT",          cfr: "172.322",        desc: "Environmentally hazardous substances in marine transport" },
  "combustible":            { file: "placard-combustible.svg",                name: "COMBUSTIBLE",               cfr: "173.150(f)",     desc: "Reclassified flammable liquid (FP > 60.5°C)" },
  "inhalation-hazard":      { file: "placard-inhalation-hazard.svg",          name: "INHALATION HAZARD",         cfr: "172.313",        desc: "PIH marking — required for Class 2.3 Zone A/B + 6.1 Zone A/B" },
  "inhal-hazard-class-2":   { file: "placard-inhal-hazard-class-2.svg",       name: "INHALATION HAZARD — Class 2", cfr: "172.313",      desc: "Class 2.3 toxic gas Hazard Zone A/B placard" },
  "inhal-hazard-class-6":   { file: "placard-inhal-hazard-class-6.svg",       name: "INHALATION HAZARD — Class 6", cfr: "172.313",      desc: "Class 6.1 PG I Hazard Zone A/B placard" },
  "fumigation":             { file: "placard-fumigation.svg",                 name: "DANGER · FUMIGATION",       cfr: "172.302(g)",     desc: "Required when shipper fumigates the freight container" },
  "keep-from-heat":         { file: "placard-keep-from-heat.svg",             name: "KEEP AWAY FROM HEAT",       cfr: "172.317",        desc: "Class 5.2 organic peroxide additional marking" },
  "orm-d":                  { file: "placard-orm-d.svg",                      name: "ORM-D CONSUMER COMMODITY",  cfr: "Historical (deprec. 2021)", desc: "Old consumer-commodity marking — replaced by Limited Quantity" },
  "lithium-batteries":      { file: "placard-lithium-batteries.svg",          name: "LITHIUM BATTERY",           cfr: "172.401, 173.185", desc: "UN 3480/3481/3090/3091 lithium battery handling mark" },
  "blasting-agents":        { file: "placard-blasting-agents.svg",            name: "BLASTING AGENTS",           cfr: "172.510",        desc: "Bulk blasting agents (Div 1.5D)" },
  "fissile":                { file: "placard-fissile.svg",                    name: "FISSILE",                   cfr: "173.453",        desc: "Fissile radioactive material" },
  "biohazard-medical-waste":{ file: "placard-biohazard-medical-waste.svg",    name: "BIOHAZARD — Regulated Medical Waste", cfr: "173.197", desc: "Class 6.2 regulated medical waste label" },
  "organic-peroxide-label": { file: "placard-organic-peroxide-label.svg",     name: "ORGANIC PEROXIDE (label)",  cfr: "172.426",        desc: "Class 5.2 label (post-2007 update)" },
  "organic-peroxide-placard":{file: "placard-organic-peroxide-placard.svg",   name: "ORGANIC PEROXIDE (placard)",cfr: "172.552",        desc: "Class 5.2 placard (post-2007 update)" },
  "class-5.2-un-number":    { file: "placard-class-5.2-un-number.svg",        name: "Class 5.2 with UN Number",  cfr: "172.332",        desc: "Bulk Class 5.2 placard with UN number in band" },
  "misc-hazmat-class-9":    { file: "placard-misc-hazmat-class-9.svg",        name: "Class 9 Label (4 lines)",   cfr: "172.446",        desc: "Current Class 9 misc hazmat label — replaces old hatched version" },
  "lq-air":                 { file: "placard-lq-air.svg",                     name: "LIMITED QUANTITY — AIR",    cfr: "173.27",         desc: "Air-transport limited-quantity marking" },
  "lq-surface":             { file: "placard-lq-surface.svg",                 name: "LIMITED QUANTITY — SURFACE",cfr: "172.315",        desc: "Surface-transport limited-quantity marking" },
  "erg-numbered-1219":      { file: "placard-erg-numbered-1219.svg",          name: "ERG Numbered Placard (UN 1219)", cfr: "172.332",   desc: "Example bulk placard with UN number plate (UN 1219 Isopropanol)" },
  "un-number-plate-blank":  { file: "placard-un-number-plate-blank.svg",      name: "UN NUMBER PLATE (blank)",   cfr: "172.332",        desc: "Blank orange UN-number plate template — overlay any UN ID" }
};

// Friendly class names
const PLACARD_NAMES = {
  "1":"EXPLOSIVES","1.1":"EXPLOSIVES 1.1","1.2":"EXPLOSIVES 1.2","1.3":"EXPLOSIVES 1.3",
  "1.4":"EXPLOSIVES 1.4","1.5":"BLASTING AGENT 1.5","1.6":"EXPLOSIVES 1.6",
  "2":"GAS","2.1":"FLAMMABLE GAS","2.2":"NON-FLAMMABLE GAS","2.3":"INHALATION HAZARD",
  "3":"FLAMMABLE",
  "4":"FLAMMABLE SOLID","4.1":"FLAMMABLE SOLID","4.2":"SPONTANEOUSLY COMBUSTIBLE","4.3":"DANGEROUS WHEN WET",
  "5":"OXIDIZER","5.1":"OXIDIZER","5.2":"ORGANIC PEROXIDE",
  "6":"POISON","6.1":"POISON","6.2":"INFECTIOUS SUBSTANCE",
  "7":"RADIOACTIVE","8":"CORROSIVE","9":"CLASS 9"
};

// Inline-SVG fallback (used only when no image file exists)
const FB_TABLE = {
  "1":   { bg: "#F26B27", text: "#000000", name: "EXPLOSIVES" },
  "1.5": { bg: "#F26B27", text: "#000000", name: "BLASTING AGENT 1.5" }
};
function renderPlacardFallback(hazardClass, unNumber, size) {
  const cfg = FB_TABLE[hazardClass] || { bg: "#94A3B8", text: "#FFFFFF", name: `CLASS ${hazardClass}` };
  const unBand = unNumber ? `<rect x="22" y="50" width="56" height="12" fill="#FFF" stroke="#000" stroke-width="0.8"/><text x="50" y="59" text-anchor="middle" font-family="Arial Black,Arial,sans-serif" font-size="9" font-weight="900" fill="#000">${unNumber}</text>` : "";
  return `<svg width="${size}" height="${size}" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="DOT placard: ${cfg.name}">
    <g transform="rotate(45 50 50)"><rect x="14" y="14" width="72" height="72" fill="#000"/><rect x="17" y="17" width="66" height="66" fill="${cfg.bg}"/></g>
    ${unBand}
    <text x="50" y="${unNumber ? 72 : 68}" text-anchor="middle" font-family="Arial Black,Arial,sans-serif" font-size="${cfg.name.length>14?5:7}" font-weight="900" fill="${cfg.text}">${cfg.name}</text>
    <text x="50" y="86" text-anchor="middle" font-family="Arial Black,Arial,sans-serif" font-size="11" font-weight="900" fill="${cfg.text}">${hazardClass}</text>
  </svg>`;
}

/* Main hazard-class renderer */
function renderPlacardSvg(hazardClass, unNumber, size) {
  size = size || 240;
  const file = PLACARD_FILES[hazardClass];
  if (file) {
    const unBadge = unNumber ? `
      <div style="position:absolute;left:50%;top:48%;transform:translateX(-50%);background:#FFFFFF;border:1.5px solid #0A1628;padding:2px 12px;border-radius:2px;font-family:'Arial Black','Arial',sans-serif;font-size:${Math.max(11, size*0.075)}px;font-weight:900;color:#0A1628;letter-spacing:0.5px;box-shadow:0 1px 2px rgba(0,0,0,0.3);">${unNumber}</div>` : "";
    const accLabel = `DOT placard Class ${hazardClass}${PLACARD_NAMES && PLACARD_NAMES[hazardClass] ? ' — ' + PLACARD_NAMES[hazardClass] : ''}${unNumber ? ', UN ' + unNumber : ''}`;
    return `<div role="img" aria-label="${accLabel}" style="position:relative;display:inline-block;width:${size}px;height:${size}px;">
      <img src="/assets/placards/${file}" alt="" aria-hidden="true" style="width:${size}px;height:${size}px;display:block;" />
      ${unBadge}
    </div>`;
  }
  return renderPlacardFallback(hazardClass, unNumber, size);
}

/* Specialty placard renderer */
function renderSpecialtyPlacard(key, size) {
  size = size || 200;
  const cfg = SPECIALTY_PLACARDS[key];
  if (!cfg) return `<div style="color:#94A3B8;padding:24px;text-align:center;">Unknown specialty: ${key}</div>`;
  return `<img src="/assets/placards/${cfg.file}" alt="${cfg.name}" title="${cfg.name} — 49 CFR ${cfg.cfr}" style="width:${size}px;height:${size}px;display:block;" />`;
}

/* UN-number-plate renderer — DOT-spec inline SVG per 49 CFR § 172.332
   Orange rectangle (5:2 aspect), 15mm black border, UN number in 100mm-tall black Arial Black.
   Width default 280px ≈ 400mm at print scale. */
function renderUnNumberPlate(unNumber, size) {
  size = size || 280;
  const h = Math.round(size * 0.4);   // 5:2 plate aspect ratio
  const num = String(unNumber || "").replace(/\D/g,'').slice(0,4);
  const display = num || '____';
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${h}" viewBox="0 0 250 100" role="img" aria-label="UN Number Plate ${display}">
    <rect x="0" y="0" width="250" height="100" fill="#FF8C00" stroke="#000000" stroke-width="7"/>
    <text x="125" y="73" text-anchor="middle" font-family="Arial Black, Arial, sans-serif" font-weight="900" font-size="64" letter-spacing="2" fill="#000000">${display}</text>
  </svg>`;
}

window.renderPlacardSvg = renderPlacardSvg;
window.renderSpecialtyPlacard = renderSpecialtyPlacard;
window.renderUnNumberPlate = renderUnNumberPlate;
window.PLACARD_FILES = PLACARD_FILES;
window.SPECIALTY_PLACARDS = SPECIALTY_PLACARDS;
window.PLACARD_NAMES = PLACARD_NAMES;
window.PLACARD_CLASS_TABLE = {};
Object.keys(PLACARD_NAMES).forEach(k => { window.PLACARD_CLASS_TABLE[k] = { name: PLACARD_NAMES[k] }; });
