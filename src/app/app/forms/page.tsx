"use client";

/* ============================================================
   X3 COMPASS · FORMS
   ------------------------------------------------------------
   Forms management — DocuSign templates, custom carrier forms,
   driver-facing intake forms, and bulk-send. Designed stub for
   now. Wires into the DocuSign OAuth integration + the existing
   x3-compass-forms Supabase table when native port ships.
   ============================================================ */

import StubPage from "@/components/StubPage";

export default function FormsPage() {
  return (
    <StubPage
      title="Forms"
      crumbs="X3 COMPASS · DOCUSIGN + INTERNAL FORMS"
      cfr="Carrier-issued forms · DocuSign-routed signatures"
      icon="📋"
      desc="The forms layer between you and your drivers. Build DocuSign-routed driver applications (§ 391.21), road test certificates (§ 391.31), drug & alcohol policy acknowledgements (§ 382), and any carrier-internal form. Send to a driver, track signature status, auto-attach the signed PDF to the right slot in their DQ File."
      features={[
        { name: "DocuSign templates",     detail: "8 pre-built templates: driver application, road test, prior-employer inquiry, drug consent, MVR consent, hazmat security training acknowledgement, employee handbook acknowledgement, vehicle assignment." },
        { name: "Custom form builder",    detail: "Drag-and-drop form designer for company-specific forms. Drop signature blocks, dates, and field bindings (driver name, hire date, CDL number) that auto-populate from compass_drivers." },
        { name: "Bulk send",              detail: "Pick a template + a driver list, send all envelopes in one click. Tracks signature status per envelope, sends auto-reminders at day 3 / 7 / 14." },
        { name: "Auto-attach to DQF",     detail: "Signed envelopes route to the right slot in the driver's DQ File via DocuSign Connect webhook — no manual upload step." },
        { name: "Audit trail",            detail: "Every envelope shows who signed, when, from what IP, with the DocuSign certificate of completion. Click any envelope to open the signed PDF + audit log." },
        { name: "Bulk export",            detail: "Export every signed envelope for a driver as a single ZIP — useful for prior-employer requests and FMCSA Compliance Reviews." },
      ]}
    />
  );
}
