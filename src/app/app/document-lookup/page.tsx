"use client";

/* ============================================================
   X3 COMPASS · DOCUMENT LOOKUP
   ------------------------------------------------------------
   Search FMCSA forms, 49 CFR sections, state DMV docs,
   carrier-internal forms, and uploaded driver docs from one
   bar. Designed stub for now — wires into the 300-skill
   corpus + Supabase storage when the native port ships.
   ============================================================ */

import StubPage from "@/components/StubPage";

export default function DocumentLookupPage() {
  return (
    <StubPage
      title="Document Lookup"
      crumbs="X3 COMPASS · COMPLIANCE LIBRARY"
      cfr="49 CFR + state DMV forms + carrier uploads"
      icon="🔎"
      desc="One search bar across every regulatory document a fleet ever needs. FMCSA forms (MCS-150, MCS-150B, MCS-150C, BMC-91), 49 CFR §§ 350–399 sections, every state's DMV forms (DL-44 for CA, DL-1 for TX, etc.), and your own carrier-internal forms and signed PDFs. Type a UN number, a CFR section, a form code, or a plain-English question and the right document opens with the answer already highlighted."
      features={[
        { name: "FMCSA forms",            detail: "MCS-150 (USDOT registration), MCS-150B (hazmat add), MCS-150C (intermodal), BMC-91 (insurance), all current revisions. Pulled live from the FMCSA forms library." },
        { name: "49 CFR section search",  detail: "All Parts 350–399 plus Subchapter C hazmat (Parts 100–185) full-text. Citation-aware — type '391.51' and the document opens at that section." },
        { name: "State DMV forms",        detail: "50-state DL renewal, CDL upgrade, medical-card-only DL, and accident report forms. Auto-detects the driver's state from the CDL state column." },
        { name: "Carrier-internal forms", detail: "Signed road tests, in-house safety policies, signed-off training rosters — all uploaded PDFs OCR'd and full-text indexed." },
        { name: "Plain-English query",    detail: "Type 'what form proves a driver passed pre-employment drug test' and the system returns the FCRA chain-of-custody and the negative test certificate." },
        { name: "Citation copy-paste",    detail: "Every result has a 'Copy citation' button that emits the right CFR/state cite ready to drop into an audit response." },
      ]}
    />
  );
}
