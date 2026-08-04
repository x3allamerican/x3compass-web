const BASIC_RULES = [
  [/^(392\.(2|4|5|6|7|8|9|10|11|12|14|16|22)|383\.51)/, "Unsafe Driving"],
  [/^(395\.|392\.3)/, "Hours-of-Service Compliance"],
  [/^(393\.|396\.)/, "Vehicle Maintenance"],
  [/^(382\.|392\.4|392\.5)/, "Controlled Substances/Alcohol"],
  [/^(383\.|391\.)/, "Driver Fitness"],
  [/^(171\.|172\.|173\.|177\.|178\.|180\.)/, "Hazardous Materials Compliance"],
];

const cleanText = (value, max = 500) => typeof value === "string" && value.trim() ? value.trim().slice(0, max) : null;

export function mapViolationToBasic(code) {
  const normalized = cleanText(code, 40)?.replace(/^49\s*CFR\s*(?:§\s*)?/i, "") || "";
  const match = BASIC_RULES.find(([pattern]) => pattern.test(normalized));
  return match
    ? { basic_category: match[1], mapping_basis: `cfr_family:${normalized.split(".")[0]}`, review_status: "needs_human_review" }
    : { basic_category: null, mapping_basis: "unmapped", review_status: "needs_human_review" };
}

export function normalizeInspectionExtraction(input) {
  const source = input && typeof input === "object" ? input : {};
  const warnings = [];
  const date = /^\d{4}-\d{2}-\d{2}$/.test(source.inspection_date || "") ? source.inspection_date : null;
  if (source.inspection_date && !date) warnings.push("inspection_date_invalid");
  const level = Number.isInteger(source.level) && source.level >= 1 && source.level <= 6 ? source.level : null;
  if (source.level != null && !level) warnings.push("level_invalid");
  const state = /^[A-Za-z]{2}$/.test(source.state || "") ? source.state.toUpperCase() : null;
  if (source.state && !state) warnings.push("state_invalid");
  const rawViolations = Array.isArray(source.violations) ? source.violations : [];
  if (source.violations != null && !Array.isArray(source.violations)) warnings.push("violations_invalid");
  const violations = rawViolations.slice(0, 100).map((item) => {
    const row = item && typeof item === "object" ? item : {};
    const code = cleanText(row.code, 40);
    return {
      code,
      description: cleanText(row.description),
      oos: row.oos === true,
      ...mapViolationToBasic(code),
    };
  });
  if (violations.some((v) => !v.basic_category)) warnings.push("one_or_more_basic_categories_unmapped");
  return {
    inspection_date: date,
    level,
    state,
    inspector: cleanText(source.inspector, 160),
    report_number: cleanText(source.report_number, 120),
    oos_driver: source.oos_driver === true,
    oos_vehicle: source.oos_vehicle === true,
    violation_count: violations.length,
    violations,
    review_status: "needs_human_review",
    parser_warnings: warnings,
  };
}
