import { renderAuditPdf, type AuditPdfSection } from "../../_shared/audit-pdf";
import { correlationId, requireTenant, securityError, tenantPreflight, isUuid, type SecurityEnv } from "../../_shared/request-security";
import { supaFetch } from "../../_shared/supabase-admin";
import { buildAccidentRegister } from "../../../src/lib/accidentRegister.mjs";

type Env = SecurityEnv;
type ExportType = "dq-file" | "drug-alcohol" | "accident-register";
type AccidentRegisterRecord = {
  accidentDate: unknown;
  city: unknown;
  state: unknown;
  driverName: unknown;
  fatalities: unknown;
  injuries: unknown;
  hazmatReleased: unknown;
  retentionThrough: unknown;
  missingFields: string[];
};
const TYPES = new Set<ExportType>(["dq-file", "drug-alcohol", "accident-register"]);

const shown = (value: unknown) => value === null || value === undefined || value === "" ? "Not documented" : String(value);
const name = (row: Record<string, unknown>) => `${row.first_name || ""} ${row.last_name || ""}`.trim() || "Unnamed driver";

export const onRequestGet: PagesFunction<Env> = async (ctx) => {
  const requestId = correlationId(ctx.request);
  let authority;
  try { authority = await requireTenant(ctx.request, ctx.env); }
  catch { return securityError(503, "authorization_unavailable", requestId); }
  if (!authority.ok) return securityError(authority.status, authority.code, requestId);
  if (!ctx.env.SUPABASE_URL || !ctx.env.SUPABASE_SERVICE_ROLE) return securityError(503, "service_unavailable", requestId);

  const url = new URL(ctx.request.url);
  const requestedType = url.searchParams.get("type") || "";
  if (!TYPES.has(requestedType as ExportType)) return securityError(400, "invalid_export_type", requestId);
  const type = requestedType as ExportType;
  const driverId = url.searchParams.get("driver_id");
  if (type === "dq-file" && !isUuid(driverId)) return securityError(400, "invalid_resource_id", requestId);

  const carrierId = authority.carrierId;
  const supa = supaFetch(ctx.env);
  try {
    const carrierRows = await supa.select("compass_carriers", `select=id,name,usdot_number&id=eq.${carrierId}&limit=1`) as Array<Record<string, unknown>>;
    const carrier = carrierRows[0];
    if (!carrier) return securityError(404, "carrier_not_found", requestId);
    let title = "";
    let filename = "";
    let sections: AuditPdfSection[] = [];
    let recordCount = 0;

    if (type === "dq-file") {
      const drivers = await supa.select("compass_drivers", `select=id,first_name,last_name,status,hire_date,cdl_state,cdl_number,cdl_class,cdl_endorsements,cdl_expires_on,medical_card_expires_on&id=eq.${driverId}&carrier_id=eq.${carrierId}&limit=1`) as Array<Record<string, unknown>>;
      const driver = drivers[0];
      if (!driver) return securityError(404, "resource_not_found", requestId);
      const [documents, mvrs, training] = await Promise.all([
        supa.select("compass_dq_documents", `select=id,doc_type,label,expires_on,created_at&carrier_id=eq.${carrierId}&driver_id=eq.${driverId}&order=created_at.desc&limit=1000`) as Promise<Array<Record<string, unknown>>>,
        supa.select("compass_mvr_records", `select=id,pulled_on,license_status,violations_count,points,source&carrier_id=eq.${carrierId}&driver_id=eq.${driverId}&order=pulled_on.desc&limit=1000`) as Promise<Array<Record<string, unknown>>>,
        supa.select("compass_training_records", `select=id,course_name,course_category,provider,completed_on,expires_on&carrier_id=eq.${carrierId}&driver_id=eq.${driverId}&order=completed_on.desc&limit=1000`) as Promise<Array<Record<string, unknown>>>,
      ]);
      const driverName = name(driver);
      title = `Driver Qualification File - ${driverName}`;
      filename = `dq-file-${driverId}.pdf`;
      recordCount = 1 + documents.length + mvrs.length + training.length;
      sections = [
        { heading: "Driver profile", citation: "49 CFR 391.51", rows: [
          { label: "Driver", value: driverName }, { label: "Status", value: shown(driver.status) }, { label: "Hire date", value: shown(driver.hire_date) },
          { label: "CDL", value: `${shown(driver.cdl_state)} ${shown(driver.cdl_number)} | class ${shown(driver.cdl_class)}` },
          { label: "CDL endorsements", value: Array.isArray(driver.cdl_endorsements) ? driver.cdl_endorsements.join(", ") : shown(driver.cdl_endorsements) },
          { label: "CDL expires", value: shown(driver.cdl_expires_on) }, { label: "Medical certificate expires", value: shown(driver.medical_card_expires_on) },
        ]},
        { heading: "DQ document index", citation: "49 CFR 391.51", rows: documents.map((row, index) => ({ label: `${index + 1}. ${shown(row.doc_type)}`, value: `${shown(row.label)} | expires ${shown(row.expires_on)} | recorded ${shown(row.created_at)}` })), emptyMessage: "No DQ document index rows returned." },
        { heading: "Motor vehicle record history", citation: "49 CFR 391.23 and 391.25", rows: mvrs.map((row, index) => ({ label: `${index + 1}. Pull ${shown(row.pulled_on)}`, value: `license ${shown(row.license_status)} | violations ${shown(row.violations_count)} | points ${shown(row.points)} | source ${shown(row.source)}` })), emptyMessage: "No MVR history returned." },
        { heading: "Training history", citation: "Evidence index; applicability varies by duty", rows: training.map((row, index) => ({ label: `${index + 1}. ${shown(row.course_name)}`, value: `${shown(row.provider)} | completed ${shown(row.completed_on)} | expires ${shown(row.expires_on)}` })), emptyMessage: "No training history returned." },
      ];
    } else if (type === "drug-alcohol") {
      const [tests, drivers] = await Promise.all([
        supa.select("compass_da_tests", `select=id,driver_id,driver_name,test_date,test_type,panel,mro,result&carrier_id=eq.${carrierId}&order=test_date.desc&limit=5000`) as Promise<Array<Record<string, unknown>>>,
        supa.select("compass_drivers", `select=id,first_name,last_name&carrier_id=eq.${carrierId}&limit=5000`) as Promise<Array<Record<string, unknown>>>,
      ]);
      const names = new Map(drivers.map((row) => [row.id, name(row)]));
      title = "Drug and Alcohol Program Summary"; filename = "drug-alcohol-program-summary.pdf"; recordCount = tests.length;
      sections = [{ heading: "Recorded tests", citation: "49 CFR Part 382 and 49 CFR Part 40", rows: tests.map((row, index) => ({
        label: `${index + 1}. ${shown(row.test_date)} | ${shown(row.test_type)}`,
        value: `${shown(row.driver_name || names.get(row.driver_id))} | panel ${shown(row.panel)} | MRO ${shown(row.mro)} | result ${shown(row.result)}`,
      })), emptyMessage: "No D&A test records returned. This does not establish whether tests are missing or inapplicable." }];
    } else {
      const [accidents, drivers] = await Promise.all([
        supa.select("compass_accidents", `select=id,accident_date,city,state,driver_id,fatalities,injuries,hazmat_released&carrier_id=eq.${carrierId}&order=accident_date.desc&limit=5000`),
        supa.select("compass_drivers", `select=id,first_name,last_name&carrier_id=eq.${carrierId}&limit=5000`),
      ]);
      const register = buildAccidentRegister({ asOf: new Date().toISOString().slice(0, 10), accidents, drivers });
      title = "DOT Accident Register"; filename = "dot-accident-register.pdf"; recordCount = register.records.length;
      sections = [{ heading: "Accident register", citation: "49 CFR 390.15(b)(1)", rows: (register.records as AccidentRegisterRecord[]).map((row, index) => ({
        label: `${index + 1}. ${shown(row.accidentDate)} | ${shown(row.city)}, ${shown(row.state)}`,
        value: `${shown(row.driverName)} | fatalities ${shown(row.fatalities)} | injuries ${shown(row.injuries)} | hazmat released ${shown(row.hazmatReleased)} | retain through ${shown(row.retentionThrough)} | missing ${row.missingFields.join(", ") || "none"}`,
      })), emptyMessage: "No accident register records returned." }];
    }

    const generatedAt = new Date().toISOString();
    const bytes = await renderAuditPdf({ title, carrierName: shown(carrier.name), usdotNumber: carrier.usdot_number ? String(carrier.usdot_number) : null, generatedAt, sections });
    await supa.insert("audit_log", {
      carrier_id: carrierId, user_id: authority.userId, action: "audit_pdf_generated", entity_type: "audit_export",
      payload: { export_type: type, driver_id: type === "dq-file" ? driverId : null, record_count: recordCount, generated_at: generatedAt },
    }, "minimal");

    const body = bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer;
    return new Response(body, { status: 200, headers: {
      "Content-Type": "application/pdf", "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "private, no-store", "X-Content-Type-Options": "nosniff",
    } });
  } catch {
    return securityError(503, "pdf_unavailable", requestId);
  }
};

export const onRequestOptions: PagesFunction<Env> = async (ctx) => tenantPreflight(ctx.request, ctx.env, "GET, OPTIONS");
