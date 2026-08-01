/**
 * Top 80+ UN substances commonly encountered by US motor carriers.
 * Source: 49 CFR § 172.101 Hazardous Materials Table.
 *
 * Fields:
 *   un        · UN/NA number (without "UN" prefix)
 *   name      · proper shipping name (per § 172.101)
 *   class     · hazard class or division
 *   pg        · packing group (I, II, III, or undefined)
 *   erg       · ERG (Emergency Response Guidebook) guide number
 *   placardThresholdLb · aggregate weight threshold for placarding (per § 172.504 Table 2)
 *                       null = Table 1 substance (ANY quantity requires placarding)
 *   commonName · colloquial name shown in the UI
 */

export type Substance = {
  un: string;
  name: string;
  class: string;
  subclass?: string;
  pg?: "I" | "II" | "III";
  erg: string;
  placardThresholdLb: number | null;
  commonName?: string;
};

export const UN_SUBSTANCES: Substance[] = [
  // Class 3 · Flammable liquids (most common cargo)
  { un: "1203", name: "Gasoline", class: "3", pg: "II", erg: "128", placardThresholdLb: 1001, commonName: "Gasoline / Petrol" },
  { un: "1202", name: "Diesel fuel", class: "3", pg: "III", erg: "128", placardThresholdLb: 1001, commonName: "Diesel / #2 fuel oil" },
  { un: "1170", name: "Ethanol or Ethyl alcohol", class: "3", pg: "II", erg: "127", placardThresholdLb: 1001, commonName: "Ethanol" },
  { un: "1230", name: "Methanol", class: "3", pg: "II", erg: "131", placardThresholdLb: 1001, commonName: "Methanol / Wood alcohol" },
  { un: "1219", name: "Isopropanol", class: "3", pg: "II", erg: "129", placardThresholdLb: 1001, commonName: "Isopropyl alcohol (IPA)" },
  { un: "1090", name: "Acetone", class: "3", pg: "II", erg: "127", placardThresholdLb: 1001, commonName: "Acetone" },
  { un: "1294", name: "Toluene", class: "3", pg: "II", erg: "130", placardThresholdLb: 1001, commonName: "Toluene" },
  { un: "1307", name: "Xylenes", class: "3", pg: "II", erg: "130", placardThresholdLb: 1001, commonName: "Xylene" },
  { un: "1114", name: "Benzene", class: "3", pg: "II", erg: "130", placardThresholdLb: 1001, commonName: "Benzene" },
  { un: "1267", name: "Petroleum crude oil", class: "3", pg: "I", erg: "128", placardThresholdLb: 1001, commonName: "Crude oil" },
  { un: "1268", name: "Petroleum distillates, n.o.s.", class: "3", pg: "II", erg: "128", placardThresholdLb: 1001, commonName: "Petroleum distillates" },
  { un: "1863", name: "Fuel, aviation, turbine engine", class: "3", pg: "II", erg: "128", placardThresholdLb: 1001, commonName: "Jet fuel" },
  { un: "1993", name: "Flammable liquid, n.o.s.", class: "3", pg: "II", erg: "128", placardThresholdLb: 1001 },
  { un: "1133", name: "Adhesives (flammable)", class: "3", pg: "II", erg: "128", placardThresholdLb: 1001 },
  { un: "1263", name: "Paint or Paint-related material", class: "3", pg: "II", erg: "128", placardThresholdLb: 1001 },
  { un: "1300", name: "Turpentine substitute", class: "3", pg: "II", erg: "128", placardThresholdLb: 1001 },
  { un: "1866", name: "Resin solution", class: "3", pg: "II", erg: "127", placardThresholdLb: 1001 },

  // Class 2 · Gases
  { un: "1075", name: "Petroleum gases, liquefied", class: "2", subclass: "2.1", erg: "115", placardThresholdLb: null, commonName: "LPG / Propane" },
  { un: "1978", name: "Propane", class: "2", subclass: "2.1", erg: "115", placardThresholdLb: null, commonName: "Propane" },
  { un: "1971", name: "Methane / Natural gas, compressed", class: "2", subclass: "2.1", erg: "115", placardThresholdLb: null, commonName: "Natural gas / Methane" },
  { un: "1972", name: "Natural gas, refrigerated liquid (LNG)", class: "2", subclass: "2.1", erg: "115", placardThresholdLb: null, commonName: "LNG" },
  { un: "1011", name: "Butane", class: "2", subclass: "2.1", erg: "115", placardThresholdLb: null, commonName: "Butane" },
  { un: "1049", name: "Hydrogen, compressed", class: "2", subclass: "2.1", erg: "115", placardThresholdLb: null, commonName: "Hydrogen" },
  { un: "1066", name: "Nitrogen, compressed", class: "2", subclass: "2.2", erg: "121", placardThresholdLb: 1001, commonName: "Nitrogen" },
  { un: "1072", name: "Oxygen, compressed", class: "2", subclass: "2.2", erg: "122", placardThresholdLb: null, commonName: "Oxygen (oxidizing)" },
  { un: "1073", name: "Oxygen, refrigerated liquid", class: "2", subclass: "2.2", erg: "122", placardThresholdLb: null, commonName: "Liquid oxygen (LOX)" },
  { un: "1006", name: "Argon, compressed", class: "2", subclass: "2.2", erg: "121", placardThresholdLb: 1001, commonName: "Argon" },
  { un: "1013", name: "Carbon dioxide", class: "2", subclass: "2.2", erg: "120", placardThresholdLb: 1001, commonName: "Carbon dioxide" },
  { un: "1005", name: "Ammonia, anhydrous", class: "2", subclass: "2.3", erg: "125", placardThresholdLb: null, commonName: "Anhydrous ammonia" },
  { un: "1017", name: "Chlorine", class: "2", subclass: "2.3", erg: "124", placardThresholdLb: null, commonName: "Chlorine gas" },

  // Class 1 · Explosives (Table 1; any quantity)
  { un: "0027", name: "Black powder", class: "1", subclass: "1.1", erg: "112", placardThresholdLb: null },
  { un: "0048", name: "Charges, demolition", class: "1", subclass: "1.1", erg: "112", placardThresholdLb: null },
  { un: "0084", name: "Detonator assemblies, non-electric", class: "1", subclass: "1.4", erg: "114", placardThresholdLb: null },
  { un: "0081", name: "Explosive, blasting, type A", class: "1", subclass: "1.1", erg: "112", placardThresholdLb: null },
  { un: "0331", name: "Explosive, blasting, type B", class: "1", subclass: "1.5", erg: "112", placardThresholdLb: null },
  { un: "0124", name: "Jet perforating guns, charged (oil well)", class: "1", subclass: "1.1", erg: "112", placardThresholdLb: null, commonName: "Oil-well jet perforators" },

  // Class 4 · Flammable solids / spontaneously combustible / dangerous when wet
  { un: "1325", name: "Flammable solid, organic, n.o.s.", class: "4", subclass: "4.1", pg: "II", erg: "133", placardThresholdLb: 1001 },
  { un: "1350", name: "Sulfur (solid)", class: "4", subclass: "4.1", pg: "III", erg: "133", placardThresholdLb: 1001 },
  { un: "1369", name: "p-Nitrosodimethylaniline", class: "4", subclass: "4.2", pg: "II", erg: "135", placardThresholdLb: 1001 },
  { un: "1428", name: "Sodium metal", class: "4", subclass: "4.3", pg: "I", erg: "138", placardThresholdLb: null, commonName: "Sodium" },
  { un: "1438", name: "Aluminum nitrate", class: "5", subclass: "5.1", pg: "III", erg: "140", placardThresholdLb: 1001 },

  // Class 5 · Oxidizers / organic peroxides
  { un: "1942", name: "Ammonium nitrate", class: "5", subclass: "5.1", pg: "III", erg: "140", placardThresholdLb: 1001, commonName: "Ammonium nitrate" },
  { un: "2014", name: "Hydrogen peroxide, aqueous, 20-60%", class: "5", subclass: "5.1", pg: "II", erg: "140", placardThresholdLb: 1001, commonName: "Hydrogen peroxide" },
  { un: "1791", name: "Hypochlorite solution", class: "8", pg: "III", erg: "154", placardThresholdLb: 1001, commonName: "Bleach (industrial)" },
  { un: "1872", name: "Lead dioxide", class: "5", subclass: "5.1", pg: "III", erg: "141", placardThresholdLb: 1001 },
  { un: "2067", name: "Ammonium nitrate fertilizers", class: "5", subclass: "5.1", pg: "III", erg: "140", placardThresholdLb: 1001 },
  { un: "3105", name: "Organic peroxide type D, liquid", class: "5", subclass: "5.2", erg: "146", placardThresholdLb: 1001, commonName: "Organic peroxide" },

  // Class 6 · Toxic / infectious
  { un: "1654", name: "Nicotine", class: "6", subclass: "6.1", pg: "II", erg: "151", placardThresholdLb: 1001 },
  { un: "1664", name: "Nitrotoluenes, liquid", class: "6", subclass: "6.1", pg: "II", erg: "152", placardThresholdLb: 1001 },
  { un: "1593", name: "Dichloromethane (Methylene chloride)", class: "6", subclass: "6.1", pg: "III", erg: "160", placardThresholdLb: 1001 },
  { un: "1888", name: "Chloroform", class: "6", subclass: "6.1", pg: "III", erg: "151", placardThresholdLb: 1001 },
  { un: "2783", name: "Organophosphorus pesticide, solid, toxic", class: "6", subclass: "6.1", pg: "II", erg: "152", placardThresholdLb: 1001 },
  { un: "3082", name: "Environmentally hazardous substance, liquid, n.o.s.", class: "9", pg: "III", erg: "171", placardThresholdLb: 1001 },
  { un: "2814", name: "Infectious substance, affecting humans", class: "6", subclass: "6.2", erg: "158", placardThresholdLb: null, commonName: "Category A infectious" },

  // Class 7 · Radioactive (Table 1 · any quantity placarded)
  { un: "2912", name: "Radioactive material, low specific activity (LSA-I)", class: "7", erg: "162", placardThresholdLb: null },
  { un: "2915", name: "Radioactive material, Type A package", class: "7", erg: "163", placardThresholdLb: null },
  { un: "2916", name: "Radioactive material, Type B(U) package", class: "7", erg: "163", placardThresholdLb: null },
  { un: "3332", name: "Radioactive material, Type A package, special form", class: "7", erg: "164", placardThresholdLb: null },

  // Class 8 · Corrosives (very common)
  { un: "1789", name: "Hydrochloric acid", class: "8", pg: "II", erg: "157", placardThresholdLb: 1001, commonName: "Hydrochloric acid (HCl)" },
  { un: "1830", name: "Sulfuric acid (>51% acid)", class: "8", pg: "II", erg: "137", placardThresholdLb: 1001, commonName: "Sulfuric acid" },
  { un: "1832", name: "Sulfuric acid, spent", class: "8", pg: "II", erg: "137", placardThresholdLb: 1001, commonName: "Spent sulfuric acid" },
  { un: "2031", name: "Nitric acid (other than red fuming)", class: "8", pg: "II", erg: "157", placardThresholdLb: 1001, commonName: "Nitric acid" },
  { un: "1824", name: "Sodium hydroxide solution", class: "8", pg: "II", erg: "154", placardThresholdLb: 1001, commonName: "Caustic soda / NaOH" },
  { un: "1814", name: "Potassium hydroxide solution", class: "8", pg: "II", erg: "154", placardThresholdLb: 1001, commonName: "Potassium hydroxide / KOH" },
  { un: "2796", name: "Battery fluid, acid", class: "8", pg: "II", erg: "154", placardThresholdLb: 1001, commonName: "Battery acid" },
  { un: "2797", name: "Battery fluid, alkali", class: "8", pg: "II", erg: "154", placardThresholdLb: 1001 },
  { un: "2922", name: "Corrosive liquid, toxic, n.o.s.", class: "8", pg: "II", erg: "154", placardThresholdLb: 1001 },
  { un: "1764", name: "Dichloroacetic acid", class: "8", pg: "II", erg: "153", placardThresholdLb: 1001 },
  { un: "1791", name: "Hypochlorite solution (>5% available chlorine)", class: "8", pg: "III", erg: "154", placardThresholdLb: 1001 },

  // Class 9 · Misc dangerous
  { un: "3077", name: "Environmentally hazardous substance, solid, n.o.s.", class: "9", pg: "III", erg: "171", placardThresholdLb: 1001 },
  { un: "3091", name: "Lithium metal batteries in equipment", class: "9", erg: "138", placardThresholdLb: 1001, commonName: "Lithium metal batteries" },
  { un: "3480", name: "Lithium ion batteries", class: "9", erg: "147", placardThresholdLb: 1001, commonName: "Lithium-ion batteries" },
  { un: "3481", name: "Lithium ion batteries in equipment", class: "9", erg: "147", placardThresholdLb: 1001, commonName: "Lithium-ion batteries in equipment" },
  { un: "2807", name: "Magnetized material", class: "9", erg: "171", placardThresholdLb: 1001 },
  { un: "3257", name: "Elevated temperature liquid, n.o.s.", class: "9", erg: "128", placardThresholdLb: 1001 },
  { un: "3258", name: "Elevated temperature solid, n.o.s.", class: "9", erg: "171", placardThresholdLb: 1001 },
  { un: "3334", name: "Aviation regulated liquid, n.o.s.", class: "9", erg: "171", placardThresholdLb: 1001 },
  { un: "3334", name: "Aviation regulated solid, n.o.s.", class: "9", erg: "171", placardThresholdLb: 1001 },
];

// Segregation rules per § 177.848 · common conflict pairs
// X = prohibited; O = allowed with separation; A = away from
export type SegregationCode = "X" | "O" | "A" | "-";
type SegMap = Record<string, Record<string, SegregationCode>>;
export const SEGREGATION: SegMap = {
  "1":    { "2.1": "X", "2.3": "X", "3":   "X", "4":   "X", "4.1": "X", "4.2": "X", "4.3": "X", "5.1": "X", "5.2": "X", "6.1": "X", "7":   "X", "8":   "X" },
  "1.4":  { "2.1": "O", "2.3": "O", "3":   "O", "4.1": "O", "4.2": "O", "4.3": "O", "5.1": "O", "5.2": "O", "6.1": "O", "8":   "O" },
  "2.1":  { "1":   "X", "1.4": "O", "5.1": "O", "5.2": "X", "8":   "O" },
  "2.3":  { "1":   "X", "3":   "O", "4.1": "O", "4.2": "O", "5.1": "O", "5.2": "X", "8":   "O" },
  "3":    { "1":   "X", "2.3": "O", "5.1": "O", "5.2": "X", "8":   "O", "4.2": "A" },
  "4.1":  { "1":   "X", "5.1": "O", "5.2": "X", "8":   "O" },
  "4.2":  { "1":   "X", "3":   "A", "5.1": "O", "5.2": "X", "8":   "O" },
  "4.3":  { "1":   "X", "5.1": "O", "5.2": "O", "8":   "X" },
  "5.1":  { "1":   "X", "2.1": "O", "2.3": "O", "3":   "O", "4.1": "O", "4.2": "O", "4.3": "O", "5.2": "X", "8":   "O" },
  "5.2":  { "1":   "X", "2.1": "X", "2.3": "X", "3":   "X", "4.1": "X", "4.2": "X", "4.3": "O", "5.1": "X", "8":   "X" },
  "6.1":  { "1":   "X", "3":   "O", "5.1": "O", "5.2": "X", "8":   "O" },
  "7":    { "1":   "X", "4.2": "O", "5.1": "O" },
  "8":    { "1":   "X", "2.1": "O", "2.3": "O", "3":   "O", "4.1": "O", "4.2": "O", "4.3": "X", "5.1": "O", "5.2": "X", "6.1": "O", "7":   "O" },
};

export function lookupSubstance(query: string): Substance | undefined {
  const q = query.replace(/^un/i, "").trim();
  return UN_SUBSTANCES.find(
    (s) => s.un === q || s.name.toLowerCase() === q.toLowerCase() || (s.commonName && s.commonName.toLowerCase() === q.toLowerCase())
  );
}

export function searchSubstances(query: string, limit = 8): Substance[] {
  const q = query.toLowerCase().trim();
  if (!q) return [];
  const matches: Substance[] = [];
  for (const s of UN_SUBSTANCES) {
    if (
      s.un.startsWith(q.replace(/^un/i, "")) ||
      s.name.toLowerCase().includes(q) ||
      (s.commonName && s.commonName.toLowerCase().includes(q))
    ) {
      matches.push(s);
      if (matches.length >= limit) break;
    }
  }
  return matches;
}

export function getSegregationCode(classA: string, classB: string): SegregationCode {
  const a = classA;
  const b = classB;
  if (a === b) return "-";
  const direct = SEGREGATION[a]?.[b];
  const reverse = SEGREGATION[b]?.[a];
  return direct ?? reverse ?? "-";
}

export function placardingThresholdSummary(s: Substance): string {
  if (s.placardThresholdLb === null) {
    return "Any quantity · Table 1 substance (placard from first lb)";
  }
  return `Aggregate gross weight ≥ ${s.placardThresholdLb.toLocaleString()} lbs in transport`;
}
