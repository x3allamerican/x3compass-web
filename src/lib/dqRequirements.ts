/**
 * Canonical Driver Qualification File checklist — 49 CFR § 391.51.
 * The 12 documents every DQ file must contain, each mapped to its governing
 * citation. This is the regulatory backbone the /dq-files page renders and
 * the completeness score is computed against. Sourced from 49 CFR (the same
 * FMCSA text carried in the X3 corpus/genome), NOT tenant data.
 *
 * `key` is the stable slug persisted in compass_driver_documents.document_type.
 */
export type DqRequirement = {
  key: string;
  slot: string;
  cfr: string;
  /** false = required only in specific conditions (e.g. ELDT for post-2022 CDLs). */
  alwaysRequired: boolean;
  note?: string;
};

export const DQ_REQUIREMENTS: readonly DqRequirement[] = [
  { key: "driver_application",        slot: "Driver application for employment",          cfr: "49 CFR § 391.21",       alwaysRequired: true },
  { key: "prev_employer_inquiry",     slot: "Inquiry to previous employers",              cfr: "49 CFR § 391.23(a)(1)", alwaysRequired: true },
  { key: "mvr_hire",                  slot: "Motor vehicle record (at hire)",             cfr: "49 CFR § 391.23(a)(2)", alwaysRequired: true },
  { key: "mvr_annual_review",         slot: "Annual review of driving record",            cfr: "49 CFR § 391.25",       alwaysRequired: true },
  { key: "road_test_cert",            slot: "Road test certificate (or equivalent)",      cfr: "49 CFR § 391.31",       alwaysRequired: true },
  { key: "medical_examiner_cert",     slot: "Medical examiner's certificate",             cfr: "49 CFR § 391.43",       alwaysRequired: true },
  { key: "nrcme_verification",        slot: "Medical cert verification (NRCME registry)", cfr: "49 CFR § 391.23(m)",    alwaysRequired: true },
  { key: "clearinghouse_pre_query",   slot: "Clearinghouse pre-employment query",         cfr: "49 CFR § 382.701(a)",   alwaysRequired: true },
  { key: "clearinghouse_annual_query",slot: "Clearinghouse annual query",                 cfr: "49 CFR § 382.701(b)",   alwaysRequired: true },
  { key: "da_pre_employment_test",    slot: "Drug & alcohol pre-employment test",         cfr: "49 CFR § 382.301",      alwaysRequired: true },
  { key: "eldt_certificate",          slot: "Entry-Level Driver Training (ELDT)",         cfr: "49 CFR Part 380.609",   alwaysRequired: false, note: "Required for CDL/endorsement obtained on/after 2022-02-07." },
  { key: "annual_violation_cert",     slot: "Annual driver certification of violations",  cfr: "49 CFR § 391.27",       alwaysRequired: true },
] as const;

export const DQ_REQUIREMENT_COUNT = DQ_REQUIREMENTS.length;
