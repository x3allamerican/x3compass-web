/* ============================================================
   X3 Compass · PDF template registry
   ------------------------------------------------------------
   Templates are pure functions: (data) → { title, body, pdfOptions }
   The Pages Function (/api/pdf/render) wraps them with the shared
   X3 Compass letterhead headerTemplate + footerTemplate and POSTs
   to Cloudflare Browser Rendering's /pdf endpoint.

   Adding a new template:
     1. Build it as a function that returns { title, bodyHTML }
     2. Register it in TEMPLATES below
     3. Reference it in /app/pdf-test or wherever via { template: "your-slug" }

   Phase 1 templates · the spike set:
     - letterhead-test            · minimal "does the letterhead look right" doc
     - hazmat-audit-checklist     · the high-value Hazmat Center deliverable
     - training-certificate       · the high-fidelity branded-cert case

   ============================================================ */

import { X3_LOGO_DATA_URI } from "./logo";

/* ---------------- shared shell ---------------- */

const FOOTER_BRAND_LINE = "X3 Compass · DOT compliance brain · x3compass.com";

/**
 * Build the X3-branded headerTemplate string.
 * IMPORTANT: Chromium's headerTemplate runs in a SANDBOXED CSS context. The
 * app's stylesheet does NOT cascade in. Everything must be inlined.
 *
 * Also: default font size in Chromium's print header is microscopic. We force
 * `font-size: 9pt` and explicit margins. Width must be 100%.
 */
export function buildHeaderTemplate(subtitle?: string): string {
  // Dark-navy header band · matches the X3 Compass app chrome (dark navy
  // sidebars + cyan accents). The white logo PNG was designed for dark
  // backgrounds, so we give it one. Body content below stays on clean white.
  //
  // -webkit-print-color-adjust: exact forces Chromium to honor the
  // background color in print/PDF mode · without it, the band disappears.
  return `
<div style="
  width: 100%;
  padding: 14px 0.6in 16px;
  background: linear-gradient(135deg, #0A1929 0%, #0E2438 100%);
  -webkit-print-color-adjust: exact;
  print-color-adjust: exact;
  font-family: -apple-system, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
  font-size: 10pt;
  color: #E2E8F0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 3px solid #16C7FF;
  box-sizing: border-box;
">
  <img src="${X3_LOGO_DATA_URI}" alt="X3 Compass" style="height: 92px; width: auto; display: block;" />
  ${subtitle ? `<div style="font-size: 10pt; color: #16C7FF; font-weight: 700; letter-spacing: 0.6px; text-transform: uppercase;">${subtitle}</div>` : ""}
  <div style="font-size: 10pt; color: #94A3B8; font-weight: 600;"><span class="date"></span></div>
</div>`.trim();
}

/**
 * Build the shared footerTemplate string · brand line + page X of Y.
 */
export function buildFooterTemplate(): string {
  return `
<div style="
  width: 100%;
  padding: 6px 0.5in 0;
  font-family: -apple-system, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
  font-size: 8pt;
  color: #64748B;
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-top: 1px solid #CBD5E1;
">
  <span>${FOOTER_BRAND_LINE}</span>
  <span>Page <span class="pageNumber"></span> of <span class="totalPages"></span></span>
</div>`.trim();
}

/**
 * Wrap a template's body HTML with the <html><head><style> shell that
 * Chromium will render. Page-level CSS lives HERE (not in headerTemplate).
 */
export function wrapBody(title: string, bodyHTML: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8" />
<title>${escapeHtml(title)}</title>
<style>
  @page { size: Letter; margin: 1.7in 0.6in 0.85in 0.6in; }
  html, body { font-family: -apple-system, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #0F172A; }
  body { font-size: 11pt; line-height: 1.55; margin: 0; }
  h1 { font-size: 22pt; font-weight: 800; margin: 0 0 0.25in; letter-spacing: -0.3px; }
  h2 { font-size: 14pt; font-weight: 800; margin: 0.35in 0 0.12in; color: #0E7490; text-transform: uppercase; letter-spacing: 0.4px; }
  h3 { font-size: 12pt; font-weight: 700; margin: 0.22in 0 0.08in; color: #0F172A; }
  p  { margin: 0 0 0.12in; }
  ul, ol { margin: 0 0 0.18in 0.22in; padding: 0; }
  li { margin-bottom: 0.04in; }
  table { width: 100%; border-collapse: collapse; margin: 0.15in 0 0.25in; font-size: 10pt; }
  th, td { padding: 6px 8px; border-bottom: 1px solid #E2E8F0; text-align: left; vertical-align: top; }
  th { background: #F1F5F9; font-weight: 800; text-transform: uppercase; font-size: 9pt; letter-spacing: 0.4px; color: #334155; border-bottom: 2px solid #CBD5E1; }
  .pill   { display: inline-block; padding: 2px 8px; border-radius: 999px; font-size: 9pt; font-weight: 700; }
  .ok     { background: #D1FAE5; color: #047857; border: 1px solid #4ADE80; }
  .warn   { background: #FEF3C7; color: #92400E; border: 1px solid #FBBF24; }
  .fail   { background: #FEE2E2; color: #991B1B; border: 1px solid #F87171; }
  .meta   { font-size: 9pt; color: #475569; }
  .cfr    { font-family: 'SF Mono', Menlo, Consolas, monospace; font-size: 9.5pt; color: #0E7490; }
  .accent { color: #0E7490; font-weight: 700; }
  .callout { background: #F1F5F9; border-left: 3px solid #0E7490; padding: 10px 14px; margin: 0.15in 0; border-radius: 4px; font-size: 10.5pt; }
  .signature-line { border-bottom: 1px solid #0F172A; width: 280px; margin-top: 0.4in; padding-bottom: 4px; }
  .signature-label { font-size: 9pt; color: #475569; text-transform: uppercase; letter-spacing: 0.6px; }
</style>
</head>
<body>
${bodyHTML}
</body>
</html>`;
}

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c] || c);
}

/* ============================================================
   TEMPLATE DEFINITIONS
   ============================================================ */

export type TemplateOutput = {
  title: string;
  bodyHTML: string;
  /** Optional override for the headerTemplate's subtitle slot */
  headerSubtitle?: string;
  /** Passed straight to Browser Rendering pdfOptions */
  pdfOptions?: Partial<{
    format: string;
    landscape: boolean;
    printBackground: boolean;
    margin: { top?: string; right?: string; bottom?: string; left?: string };
  }>;
};

export type TemplateFn<T = Record<string, unknown>> = (data: T) => TemplateOutput;

/* ---- 1. letterhead-test · minimal does-it-render proof ---- */

export const letterheadTest: TemplateFn<{ carrierName?: string; userName?: string }> = (data) => ({
  title: "X3 Compass · Letterhead Test",
  headerSubtitle: "Letterhead test · sample document",
  bodyHTML: `
    <h1>Letterhead test</h1>
    <p class="meta">Generated ${new Date().toLocaleDateString("en-US", { dateStyle: "long" })} · for <strong>${escapeHtml(data.carrierName || "Sample Carrier")}</strong> ${data.userName ? `· by ${escapeHtml(data.userName)}` : ""}</p>

    <h2>What you should see</h2>
    <ul>
      <li>X3 Compass logo top-left on every page</li>
      <li>Cyan accent line under the header</li>
      <li>Date right-aligned in the header</li>
      <li>Brand footer + page X of Y at the bottom</li>
      <li>Letter-size page (8.5 × 11 in) · 1.1 in top margin · 0.85 in bottom · 0.6 in sides</li>
    </ul>

    <h2>Brand check</h2>
    <p>Body text uses the X3 Compass type stack (SF / Segoe UI / Roboto). Cyan accents (<span class="accent">#0E7490</span>) match the app. Pills should look like:</p>
    <p>
      <span class="pill ok">✓ Complete</span>
      <span class="pill warn">⚠ Expiring</span>
      <span class="pill fail">✕ Missing</span>
    </p>

    <h2>Code + CFR styling</h2>
    <p>CFR citations render in mono cyan: <span class="cfr">49 CFR § 382.701(a)</span> · <span class="cfr">§ 395.3(a)(1)</span> · <span class="cfr">49 CFR Part 172</span></p>

    <div class="callout">
      <strong>Callout block</strong> · this is what an inline highlight looks like. Use for "audit-relevant note" sidebars in real documents.
    </div>

    <h2>Page break test</h2>
    <p>Below is filler to push past page 1 so we can confirm the letterhead repeats on page 2.</p>
    ${"<p>" + "Lorem ipsum dolor sit amet, consectetur adipiscing elit. ".repeat(60) + "</p>"}
    <p class="meta">If you see this paragraph on page 2 with the same letterhead at top, the spike is working.</p>
  `,
});

/* ---- 2. hazmat-audit-checklist · the real-world Hazmat doc ---- */

export const hazmatAuditChecklist: TemplateFn<{
  carrierName?: string;
  usdotNumber?: string;
  inspectionDate?: string;
  preparedBy?: string;
}> = (data) => {
  const today = new Date().toLocaleDateString("en-US", { dateStyle: "long" });
  return {
    title: `Hazmat Audit Checklist · ${data.carrierName || "Sample Carrier"}`,
    headerSubtitle: "Hazmat Center · §172 audit packet",
    bodyHTML: `
      <h1>Hazmat audit checklist</h1>
      <p class="meta">
        <strong>${escapeHtml(data.carrierName || "Sample Carrier")}</strong>
        ${data.usdotNumber ? `· USDOT ${escapeHtml(data.usdotNumber)}` : ""}
        · prepared ${escapeHtml(data.inspectionDate || today)}
        ${data.preparedBy ? `· by ${escapeHtml(data.preparedBy)}` : ""}
      </p>

      <div class="callout">
        This checklist covers the 12 high-frequency hazmat findings cited by PHMSA + FMCSA inspectors. Each row maps to the controlling CFR provision and your last-verified status in X3 Compass.
      </div>

      <h2>I · Shipping papers & emergency response (§ 172 Subpart C + G)</h2>
      <table>
        <thead><tr><th style="width:48%">Requirement</th><th>CFR</th><th>Last verified</th><th>Status</th></tr></thead>
        <tbody>
          <tr><td>Proper shipping name + hazard class on every shipping paper</td><td><span class="cfr">§ 172.202</span></td><td>2026-04-12</td><td><span class="pill ok">✓ Complete</span></td></tr>
          <tr><td>Emergency response phone number visible 24/7</td><td><span class="cfr">§ 172.604</span></td><td>2026-04-12</td><td><span class="pill ok">✓ Complete</span></td></tr>
          <tr><td>Emergency response info accessible (ERG or equivalent)</td><td><span class="cfr">§ 172.602</span></td><td>2026-03-28</td><td><span class="pill ok">✓ Complete</span></td></tr>
          <tr><td>Shipper certification signed where required</td><td><span class="cfr">§ 172.204</span></td><td>2026-04-12</td><td><span class="pill warn">⚠ Spot-check</span></td></tr>
        </tbody>
      </table>

      <h2>II · Placarding (§ 172 Subpart F)</h2>
      <table>
        <thead><tr><th style="width:48%">Requirement</th><th>CFR</th><th>Last verified</th><th>Status</th></tr></thead>
        <tbody>
          <tr><td>Correct placard per Table 1 / Table 2 thresholds</td><td><span class="cfr">§ 172.504</span></td><td>2026-04-05</td><td><span class="pill ok">✓ Complete</span></td></tr>
          <tr><td>Placards on all 4 sides, legible from 50 ft</td><td><span class="cfr">§ 172.516</span></td><td>2026-04-05</td><td><span class="pill ok">✓ Complete</span></td></tr>
          <tr><td>UN/NA number marked where required (1,000 lb+)</td><td><span class="cfr">§ 172.332</span></td><td>2026-04-05</td><td><span class="pill warn">⚠ Spot-check</span></td></tr>
        </tbody>
      </table>

      <h2>III · Driver training (§ 172 Subpart H)</h2>
      <table>
        <thead><tr><th style="width:48%">Requirement</th><th>CFR</th><th>Last verified</th><th>Status</th></tr></thead>
        <tbody>
          <tr><td>General awareness training (3-year recurring)</td><td><span class="cfr">§ 172.704(a)(1)</span></td><td>2025-08-14</td><td><span class="pill ok">✓ Complete</span></td></tr>
          <tr><td>Function-specific training documented per driver</td><td><span class="cfr">§ 172.704(a)(2)</span></td><td>2025-08-14</td><td><span class="pill ok">✓ Complete</span></td></tr>
          <tr><td>Safety + security training records on file</td><td><span class="cfr">§ 172.704(a)(3,4)</span></td><td>2025-08-14</td><td><span class="pill ok">✓ Complete</span></td></tr>
          <tr><td>Training records retained 3 years past employment</td><td><span class="cfr">§ 172.704(d)</span></td><td>2026-01-30</td><td><span class="pill ok">✓ Complete</span></td></tr>
        </tbody>
      </table>

      <h2>IV · Inspector signature</h2>
      <p>I attest that the items above were verified against current X3 Compass records and physical observation as of the date listed. Findings flagged ⚠ require follow-up within 14 days.</p>
      <div class="signature-line"></div>
      <div class="signature-label">Inspector signature · date</div>
    `,
    pdfOptions: { format: "letter", printBackground: true },
  };
};

/* ---- 3. training-certificate · the high-fidelity branded cert ---- */

export const trainingCertificate: TemplateFn<{
  driverName?: string;
  courseTitle?: string;
  completedOn?: string;
  certNumber?: string;
  expiresOn?: string;
}> = (data) => ({
  title: `Training Certificate · ${data.driverName || "Sample Driver"}`,
  headerSubtitle: "Training · § 172.704(d) record",
  bodyHTML: `
    <div style="text-align: center; padding: 0.6in 0;">
      <h1 style="font-size: 28pt; letter-spacing: 0.5px;">Certificate of Training</h1>
      <p style="font-size: 13pt; color: #475569; margin-top: 0.2in;">This certifies that</p>
      <p style="font-size: 26pt; font-weight: 800; color: #0E7490; margin: 0.18in 0;">${escapeHtml(data.driverName || "Sample Driver")}</p>
      <p style="font-size: 13pt; color: #475569;">has successfully completed</p>
      <p style="font-size: 18pt; font-weight: 700; margin: 0.18in 0 0.3in;">${escapeHtml(data.courseTitle || "Hazardous Materials General Awareness")}</p>

      <table style="width: 65%; margin: 0.3in auto;">
        <tr><th style="text-align:right;width:50%;border:none;background:none;">Completed</th><td style="text-align:left;font-weight:700;border:none;">${escapeHtml(data.completedOn || new Date().toLocaleDateString("en-US", { dateStyle: "long" }))}</td></tr>
        <tr><th style="text-align:right;border:none;background:none;">Certificate #</th><td style="text-align:left;font-weight:700;border:none;">${escapeHtml(data.certNumber || "X3-2026-DEMO-0001")}</td></tr>
        <tr><th style="text-align:right;border:none;background:none;">Expires</th><td style="text-align:left;font-weight:700;border:none;">${escapeHtml(data.expiresOn || new Date(Date.now() + 3 * 365 * 86400000).toLocaleDateString("en-US", { dateStyle: "long" }))}</td></tr>
      </table>

      <div style="margin-top: 0.6in;">
        <div style="display: inline-block; width: 280px;">
          <div class="signature-line" style="margin: 0 auto;"></div>
          <div class="signature-label" style="text-align: center;">X3 Compass · authorized signatory</div>
        </div>
      </div>

      <p class="meta" style="margin-top: 0.5in;">Issued under <span class="cfr">49 CFR § 172.704</span> · retained for the duration of the employee's tenure plus 3 years per § 172.704(d).</p>
    </div>
  `,
  pdfOptions: { format: "letter", printBackground: true, margin: { top: "0.6in", bottom: "0.6in", left: "0.6in", right: "0.6in" } },
});

/* ============================================================
   HOS · 3 AUDIENCE GUIDES · the Education Hub PDF batch
   Each maps to one column of the HOS EducationHubCard:
   - hos-driver-quickguide      · For Drivers card · cab-tear-out
   - hos-supervisor-playbook    · For Carrier Safety card · daily ops
   - hos-auditor-export-guide   · For Auditor card · what gets requested
   Anchored to 49 CFR Part 395.
   ============================================================ */

/* ---- 4. hos-driver-quickguide · driver cab reference ---- */

export const hosDriverQuickGuide: TemplateFn<{ carrierName?: string; driverName?: string }> = (data) => ({
  title: `HOS Quick Guide for Drivers · ${data.driverName || "Sample Driver"}`,
  headerSubtitle: "HOS · driver reference · 49 CFR Part 395",
  bodyHTML: `
    <h1>Hours of Service · driver quick guide</h1>
    <p class="meta">For <strong>${escapeHtml(data.driverName || "Sample Driver")}</strong>${data.carrierName ? ` · ${escapeHtml(data.carrierName)}` : ""} · keep in the cab</p>

    <div class="callout">
      Your ELD records every duty-status change automatically. You're responsible for certifying logs daily, claiming any unassigned drive time, and knowing when you'll hit a limit before the alert fires.
    </div>

    <h2>I · The limits at a glance</h2>
    <table>
      <thead><tr><th style="width:30%">Rule</th><th>Limit</th><th>CFR</th></tr></thead>
      <tbody>
        <tr><td><strong>Drive time</strong></td><td>11 hours max after 10 consecutive off-duty</td><td><span class="cfr">§395.3(a)(1)</span></td></tr>
        <tr><td><strong>Duty window</strong></td><td>14 hours from start of shift · no driving after even if not driving</td><td><span class="cfr">§395.3(a)(2)</span></td></tr>
        <tr><td><strong>30-min break</strong></td><td>Required after 8 cumulative drive hours · can be on-duty not-driving</td><td><span class="cfr">§395.3(a)(3)(ii)</span></td></tr>
        <tr><td><strong>Cycle</strong></td><td>70 hours / 8 days OR 60 hours / 7 days</td><td><span class="cfr">§395.3(c)</span></td></tr>
        <tr><td><strong>Restart</strong></td><td>34 consecutive hours off-duty resets your cycle</td><td><span class="cfr">§395.3(c)(2)</span></td></tr>
        <tr><td><strong>Adverse driving</strong></td><td>+2 hours drive + 2 hours window for storms / detours · unforeseen only</td><td><span class="cfr">§395.1(b)(1)</span></td></tr>
        <tr><td><strong>Sleeper berth split</strong></td><td>8/2 or 7/3 · neither portion counts against 14-hr window</td><td><span class="cfr">§395.1(g)</span></td></tr>
      </tbody>
    </table>

    <h2>II · What your ELD does · what you must do</h2>
    <h3>The ELD does automatically</h3>
    <ul>
      <li>Records every drive event, on-duty, off-duty, sleeper-berth change</li>
      <li>Calculates remaining drive + duty time</li>
      <li>Pre-warns at 30 minutes before each limit</li>
      <li>Generates the standardized output file an inspector can pull (USB or via FMCSA Web Service)</li>
    </ul>
    <h3>You do</h3>
    <ol>
      <li><strong>Certify your logs daily</strong> · review yesterday's day before driving today · <span class="cfr">§395.20</span></li>
      <li><strong>Claim unassigned drive time</strong> · if the truck moved without a driver logged in, the ELD will prompt you next login. Don't just dismiss it · review and claim or reject with reason</li>
      <li><strong>Note required annotations</strong> · personal use of CMV, yard moves, adverse driving conditions, sleeper-berth splits</li>
      <li><strong>Request edits, never edit certified logs yourself</strong> · the supervisor/back-office must approve · <span class="cfr">§395.30(c)(2)</span></li>
      <li><strong>Carry supporting documents</strong> · BOLs, fuel receipts, toll receipts back to the dispatcher within 13 days · <span class="cfr">§395.11</span></li>
    </ol>

    <h2>III · ELD malfunction · the 24-hour clock</h2>
    <p>If your ELD shows a malfunction code (data recording, positioning, data transfer, timing, or compliance):</p>
    <ol>
      <li><strong>Note the date + time</strong> the malfunction started</li>
      <li><strong>Switch to paper RODS</strong> for the remainder of the day · reconstruct the past 7 consecutive days if not already on ELD</li>
      <li><strong>Notify your carrier within 24 hours in writing</strong> (text, email · keep a copy)</li>
      <li><strong>Continue paper logs</strong> until the ELD is serviced or replaced · maximum 8 days <span class="cfr">§395.34(d)</span></li>
    </ol>

    <h2>IV · Roadside inspection · what to show</h2>
    <ol>
      <li>Your CDL + medical card</li>
      <li>The ELD device + a copy of the user manual (paper or PDF)</li>
      <li>Hand the ELD to the inspector for the standardized output (USB or telematic transfer)</li>
      <li>If on paper RODS due to malfunction: the current day + previous 7 days of paper logs</li>
      <li>An 8-day supply of blank paper RODS forms · <span class="cfr">§395.8(a)(1)(iii)</span></li>
    </ol>

    <div class="callout">
      <strong>You can refuse to drive</strong> if the load would force a violation · <span class="cfr">§392.3</span>. Drivers can't be retaliated against for refusing on safety grounds · STAA 49 U.S.C. §31105.
    </div>
  `,
});

/* ---- 5. hos-supervisor-playbook · daily-ops cheat sheet ---- */

export const hosSupervisorPlaybook: TemplateFn<{ carrierName?: string; safetyDirectorName?: string }> = (data) => ({
  title: `HOS Supervisor Playbook · ${data.carrierName || "Sample Carrier"}`,
  headerSubtitle: "HOS · carrier safety · supervisor playbook",
  bodyHTML: `
    <h1>HOS Supervisor Playbook</h1>
    <p class="meta">For ${escapeHtml(data.safetyDirectorName ? `${data.safetyDirectorName} · ` : "")}<strong>${escapeHtml(data.carrierName || "Sample Carrier")}</strong> · daily-ops reference</p>

    <div class="callout">
      Hours-Compliance is the second-highest BASIC severity weight after Unsafe Driving. FMCSA expects you to monitor HOS in real time, supervise edits, retain 6 months of original RODS, and have a written ELD malfunction policy.
    </div>

    <h2>I · Daily ritual · 10 minutes</h2>
    <ol>
      <li><strong>Open the X3 Compass HOS watchlist</strong> · review every driver with a violation flag or warning from yesterday</li>
      <li><strong>Document corrective action</strong> in the driver's file for every violation · counseling note, retraining record, or written warning per your progressive discipline matrix</li>
      <li><strong>Review pending edit requests</strong> · approve or reject within 8 days of receipt · <span class="cfr">§395.30(c)(2)</span></li>
      <li><strong>Check ELD malfunction reports</strong> · 8-day repair window starts the moment the driver notifies you · <span class="cfr">§395.34(d)</span></li>
      <li><strong>Reconcile supporting documents</strong> · BOL, fuel, toll receipts against logs · <span class="cfr">§395.11</span></li>
    </ol>

    <h2>II · The retention requirements</h2>
    <table>
      <thead><tr><th>Record</th><th>Keep for</th><th>CFR</th></tr></thead>
      <tbody>
        <tr><td>Original RODS (paper or ELD output)</td><td>6 months</td><td><span class="cfr">§395.8(k)</span></td></tr>
        <tr><td>Supporting documents</td><td>6 months</td><td><span class="cfr">§395.11(f)</span></td></tr>
        <tr><td>ELD malfunction + repair records</td><td>6 months</td><td><span class="cfr">§395.34(d)</span></td></tr>
        <tr><td>Driver edit request log + decision</td><td>6 months</td><td><span class="cfr">§395.30(c)</span></td></tr>
        <tr><td>Annual driver review</td><td>3 years (driver's file)</td><td><span class="cfr">§391.25(c)(2)</span></td></tr>
      </tbody>
    </table>

    <h2>III · ELD malfunction workflow</h2>
    <ol>
      <li><strong>Immediately</strong> · Driver notifies you the moment the malfunction is detected (text, email, dispatch radio · whatever your policy says)</li>
      <li><strong>Within 24 hours</strong> · Driver switches to paper RODS and reconstructs the past 7 days · you confirm receipt of notice in writing</li>
      <li><strong>Within 8 days</strong> · Repair or replace the ELD · update the device · document everything</li>
      <li><strong>If repair won't fit in 8 days</strong> · file an extension with FMCSA (Field Office) at <span class="cfr">§395.34(b)(2)</span> · keep a copy</li>
    </ol>

    <h2>IV · The CSA scoring weight (why this matters financially)</h2>
    <p>HOS-Compliance basic carries a <strong>7×</strong> severity multiplier on the most-cited HOS violations. A single 11-hr drive violation on a roadside inspection adds 7 points to your CSA score. Three of these = an Inspection Selection System (ISS) downgrade → more frequent inspections → more violations → more CSA points · the spiral is real.</p>
    <p>Treat HOS violations as the leading indicator they are. Pull the driver in, document corrective action, and re-train BEFORE the inspector sees the pattern.</p>

    <h2>V · Pre-employment + ongoing supervisor obligations</h2>
    <ol>
      <li><strong>Pre-hire</strong> · Verify the driver's previous 7 days of duty status from prior employers · <span class="cfr">§395.8(j)(2)</span></li>
      <li><strong>Annual</strong> · MVR + driver review · check for HOS violations cited on roadside reports · <span class="cfr">§391.25</span></li>
      <li><strong>Quarterly</strong> · Run an HOS audit query for each driver · review trending patterns (Monday surges, week-end pushes)</li>
      <li><strong>Ad hoc</strong> · Any 14+ hour shift, any 65+ hour week, any sleeper-berth split that looks off · flag, review, document</li>
    </ol>

    <div class="callout">
      <strong>Falsification (§395.8(e)) is an acute violation · automatic out-of-service rating for the driver and a major hit to your safety rating.</strong> If you suspect a driver is editing logs to hide drive time: revoke edit privileges immediately, pull all logs from the last 90 days, and consult counsel before terminating.
    </div>

    <p class="meta" style="margin-top: 0.4in;">Generated by X3 Compass for ${escapeHtml(data.carrierName || "your fleet")}. Reach out to support@x3compass.com for tailored HOS coaching.</p>
  `,
});

/* ---- 6. hos-auditor-export-guide · what gets requested in an audit ---- */

export const hosAuditorExportGuide: TemplateFn<{ carrierName?: string; auditWindow?: string }> = (data) => ({
  title: `HOS · Auditor Export Guide · ${data.carrierName || "Sample Carrier"}`,
  headerSubtitle: "HOS · auditor reference · §395 records",
  bodyHTML: `
    <h1>HOS · auditor export guide</h1>
    <p class="meta">For <strong>${escapeHtml(data.carrierName || "Sample Carrier")}</strong> · audit window: <strong>${escapeHtml(data.auditWindow || "last 6 months")}</strong></p>

    <div class="callout">
      In a new-entrant safety audit or compliance review, FMCSA investigators will request 6 months of RODS, the supporting documents that anchor them, and your ELD malfunction log. This guide lists exactly what to hand over and the order they'll be requested.
    </div>

    <h2>I · The standard 6-month HOS pull</h2>
    <ol>
      <li><strong>Driver roster</strong> for the audit window · names, hire dates, CDL numbers, termination dates if applicable</li>
      <li><strong>ELD-output RODS</strong> for every driver, every day, every duty status</li>
      <li><strong>Paper RODS</strong> for any day where the ELD was malfunctioning or the driver was on a short-haul exception</li>
      <li><strong>Supporting documents</strong> matched to each shipping movement · BOLs, fuel receipts, toll receipts, dispatch records · <span class="cfr">§395.11</span></li>
      <li><strong>ELD malfunction log</strong> · every reported malfunction, repair record, and extension if any · <span class="cfr">§395.34(d)</span></li>
      <li><strong>Driver edit-request log</strong> · every requested log change, approved or rejected, with timestamps · <span class="cfr">§395.30(c)(2)</span></li>
      <li><strong>Pre-employment HOS verification</strong> · previous 7-day duty status from each hire's prior employers · <span class="cfr">§395.8(j)(2)</span></li>
    </ol>

    <h2>II · What investigators look for</h2>
    <table>
      <thead><tr><th>Finding type</th><th>How they detect it</th><th>Citation</th></tr></thead>
      <tbody>
        <tr><td>Form + manner violations</td><td>Missing fields on paper RODS · incorrect annotations on ELD logs</td><td><span class="cfr">§395.8(d)</span></td></tr>
        <tr><td>Driving over 11-hour limit</td><td>ELD output flags driving events past hour 11</td><td><span class="cfr">§395.3(a)(1)</span></td></tr>
        <tr><td>Driving past 14-hour window</td><td>Drive events occurring after the 14th hour from start of shift</td><td><span class="cfr">§395.3(a)(2)</span></td></tr>
        <tr><td>30-min break omission</td><td>8+ cumulative drive hours without a 30-min off-duty / on-duty-not-driving block</td><td><span class="cfr">§395.3(a)(3)(ii)</span></td></tr>
        <tr><td>70/8 or 60/7 cycle violation</td><td>Aggregate on-duty time in the rolling window exceeds the limit</td><td><span class="cfr">§395.3(c)</span></td></tr>
        <tr><td>Falsification</td><td>Supporting documents (toll, fuel, BOL) place the truck in a different location than logs show · GPS mismatch · edit-request audit trail showing pre-edit values</td><td><span class="cfr">§395.8(e)</span></td></tr>
        <tr><td>Driver not certifying daily</td><td>Logs left un-certified beyond the next-business-day window</td><td><span class="cfr">§395.20(b)</span></td></tr>
        <tr><td>Carrier altering certified logs</td><td>Any edit to a log that has already been driver-certified</td><td><span class="cfr">§395.30(c)(2)</span></td></tr>
      </tbody>
    </table>

    <h2>III · The X3 Compass audit packet</h2>
    <p>X3 Compass generates a complete audit packet directly from your portal:</p>
    <ol>
      <li>Navigate to <strong>Audit Export</strong> · select scope <strong>HOS</strong></li>
      <li>Select the audit window (the investigator will tell you · usually 6 months)</li>
      <li>Click <strong>Generate audit packet</strong> · X3 builds a single branded PDF containing: driver roster, every RODS day for every driver, supporting-document index, ELD malfunction log, edit-request log</li>
      <li>The packet is timestamped + lineage-traced · the same audit log row proves <em>when</em> we generated <em>what</em> for <em>whom</em></li>
    </ol>

    <div class="callout">
      <strong>If the investigator wants the raw ELD output file:</strong> the standardized FMCSA output file format is also exportable per driver per day. Tell them which format they prefer (Web Service vs USB) · X3 supports both via the underlying ELD vendor.
    </div>

    <h2>IV · The 7 questions investigators always ask</h2>
    <ol>
      <li>Show me how a driver certifies a daily log on your ELD</li>
      <li>Walk me through how an edit request gets approved or denied · who signs off?</li>
      <li>What happens when an ELD malfunctions in the cab · what's the driver's responsibility, what's yours?</li>
      <li>Pick a driver · show me their last 6 months of RODS with supporting docs</li>
      <li>How do you reconcile a driver's GPS location against the duty status on their log?</li>
      <li>How often do you run an HOS audit query proactively · what does it look like when you do?</li>
      <li>If I called this driver right now, would they tell me the same story your logs do?</li>
    </ol>

    <p class="meta" style="margin-top: 0.4in;">If any of these questions don't have a confident answer, escalate to support@x3compass.com before the audit · we can stand up the missing process in 24-48 hours.</p>
  `,
});

/* ============================================================
   BATCH 2 · CLEARINGHOUSE audience guides (driver / employer / C-TPA)
   49 CFR Part 382 Subpart G + §40 SAP rules
   ============================================================ */

/* ---- 7. clearinghouse-driver-guide ---- */

export const clearinghouseDriverGuide: TemplateFn<{ carrierName?: string; driverName?: string }> = (data) => ({
  title: `FMCSA Clearinghouse · Driver Guide · ${data.driverName || "Sample Driver"}`,
  headerSubtitle: "Clearinghouse · driver reference · 49 CFR §382 Subpart G",
  bodyHTML: `
    <h1>FMCSA Clearinghouse · driver guide</h1>
    <p class="meta">For <strong>${escapeHtml(data.driverName || "Sample Driver")}</strong>${data.carrierName ? ` · ${escapeHtml(data.carrierName)}` : ""} · keep with your CDL paperwork</p>

    <div class="callout">
      The Drug & Alcohol Clearinghouse is the federal database of CDL driver D&A violations. Employers must query it before they hire you and once a year while you drive for them. You have rights · this guide explains them.
    </div>

    <h2>I · What's in your record</h2>
    <table>
      <thead><tr><th style="width:46%">Event</th><th>How it gets there</th><th>CFR</th></tr></thead>
      <tbody>
        <tr><td>Verified positive drug test</td><td>MRO reports it to the Clearinghouse</td><td><span class="cfr">§382.705(a)</span></td></tr>
        <tr><td>Alcohol test ≥ 0.04 BAC</td><td>Employer reports the confirmation result</td><td><span class="cfr">§382.705(b)</span></td></tr>
        <tr><td>Test refusal</td><td>Employer or C-TPA reports the refusal</td><td><span class="cfr">§382.705(b)(4)</span></td></tr>
        <tr><td>Actual knowledge (admission, citation, observed use)</td><td>Employer reports the determination</td><td><span class="cfr">§382.705(b)(3)</span></td></tr>
        <tr><td>Return-to-duty completion</td><td>SAP reports it when you complete the program</td><td><span class="cfr">§382.705(d)</span></td></tr>
        <tr><td>Follow-up testing plan completion</td><td>Employer reports when your plan is finished</td><td><span class="cfr">§382.705(e)</span></td></tr>
      </tbody>
    </table>

    <h2>II · Your consent rights</h2>
    <ol>
      <li><strong>Pre-employment full query</strong> · The employer must get your <em>specific electronic consent</em> through the Clearinghouse portal before they can see your full record · <span class="cfr">§382.703(b)</span></li>
      <li><strong>Annual limited query</strong> · The employer needs your <em>general written consent</em> once (kept in your DQ file) to run limited queries each year</li>
      <li><strong>Refusing to consent</strong> · is allowed · but the employer must then remove you from safety-sensitive duty until consent is given</li>
      <li><strong>Free access to your own record</strong> · Log into <em>clearinghouse.fmcsa.dot.gov</em>, click "My Dashboard" · see everything that's been reported about you</li>
    </ol>

    <h2>III · Return-to-duty process · if a violation is reported</h2>
    <ol>
      <li><strong>Removed from driving</strong> · You can't perform any safety-sensitive function (including driving any CMV) until you complete return-to-duty</li>
      <li><strong>SAP evaluation</strong> · See a DOT-qualified Substance Abuse Professional · they assess and prescribe education/treatment · <span class="cfr">§40.281</span></li>
      <li><strong>Education or treatment</strong> · Complete what the SAP prescribed</li>
      <li><strong>SAP follow-up</strong> · Return for a second SAP visit · they confirm you completed the plan</li>
      <li><strong>Return-to-duty test</strong> · Negative result required before you can drive again · <span class="cfr">§40.305</span></li>
      <li><strong>Follow-up testing plan</strong> · At least 6 unannounced tests in 12 months · plan can extend to 5 years</li>
    </ol>

    <div class="callout">
      <strong>You pay for SAP + treatment unless your employer or insurance covers it</strong> · costs typically run $1,500-3,500. Your job at the new employer is contingent on completing the plan.
    </div>
  `,
});

/* ---- 8. clearinghouse-employer-playbook ---- */

export const clearinghouseEmployerPlaybook: TemplateFn<{ carrierName?: string; safetyDirectorName?: string }> = (data) => ({
  title: `Clearinghouse Employer Playbook · ${data.carrierName || "Sample Carrier"}`,
  headerSubtitle: "Clearinghouse · employer playbook · 49 CFR §382",
  bodyHTML: `
    <h1>Clearinghouse · employer playbook</h1>
    <p class="meta">For ${escapeHtml(data.safetyDirectorName ? `${data.safetyDirectorName} · ` : "")}<strong>${escapeHtml(data.carrierName || "Sample Carrier")}</strong> · operating duties under Part 382 Subpart G</p>

    <div class="callout">
      Every employer of CDL drivers has four standing Clearinghouse duties: query before hire, query annually, report violations within 3 business days, and pay the per-query fee. The penalties for missing any of them run up to $5,833 per violation (§386 Appendix B, 2024 adjustment).
    </div>

    <h2>I · The four standing duties</h2>
    <table>
      <thead><tr><th style="width:30%">Duty</th><th>What you do</th><th>CFR</th></tr></thead>
      <tbody>
        <tr><td><strong>Pre-employment full query</strong></td><td>Get driver's electronic consent in Clearinghouse · run full query · review any violations before allowing safety-sensitive duty</td><td><span class="cfr">§382.701(a)</span></td></tr>
        <tr><td><strong>Annual limited query</strong></td><td>Once per year on every current driver · checks "is there anything new in the record" · upgrades to full query if hit</td><td><span class="cfr">§382.701(b)</span></td></tr>
        <tr><td><strong>Report violations</strong></td><td>Within 3 business days of obtaining actual knowledge · positive test · refusal · alcohol ≥0.04</td><td><span class="cfr">§382.705(b)</span></td></tr>
        <tr><td><strong>Report follow-up completion</strong></td><td>When a driver finishes their SAP-prescribed follow-up testing plan</td><td><span class="cfr">§382.705(e)</span></td></tr>
      </tbody>
    </table>

    <h2>II · Designating a Consortium / Third-Party Administrator (C-TPA)</h2>
    <p>You may use a C-TPA to run queries and report violations on your behalf · but the regulatory obligation stays with you. Designation is electronic, in the Clearinghouse:</p>
    <ol>
      <li><strong>Log into clearinghouse.fmcsa.dot.gov</strong> as the Clearinghouse Administrator for your USDOT</li>
      <li><strong>Search and select your C-TPA</strong> from the directory · this creates the linkage</li>
      <li><strong>Set permissions</strong> · query authority · reporting authority · both · <span class="cfr">§382.711</span></li>
      <li><strong>Audit the relationship quarterly</strong> · the C-TPA can act for you · they can't carry the violation if they miss a query</li>
    </ol>

    <h2>III · Violations you must report within 3 business days</h2>
    <ul>
      <li><strong>Driver refused a required test</strong> · including failure to appear, leaving the collection site, adulterated specimen</li>
      <li><strong>Actual knowledge of D&A use on duty</strong> · admission, citation for DUI/DWI in a CMV, observation</li>
      <li><strong>Alcohol ≥ 0.04 BAC confirmation result</strong> · this is the employer's report (positives drug tests are MRO-reported)</li>
      <li><strong>Negative return-to-duty test</strong> · upon driver's return to safety-sensitive duty after a SAP-cleared violation</li>
      <li><strong>Follow-up testing plan completion</strong> · when the driver finishes the SAP-prescribed plan</li>
    </ul>

    <h2>IV · Recordkeeping</h2>
    <table>
      <thead><tr><th>Record</th><th>Keep for</th><th>CFR</th></tr></thead>
      <tbody>
        <tr><td>Pre-employment query result + driver consent</td><td>3 years</td><td><span class="cfr">§382.401(b)(1)(vii)</span></td></tr>
        <tr><td>Annual query result + driver general consent</td><td>3 years</td><td><span class="cfr">§382.401(b)(1)(viii)</span></td></tr>
        <tr><td>Violation reports filed</td><td>5 years</td><td><span class="cfr">§382.401(b)(1)(i)</span></td></tr>
        <tr><td>SAP reports + return-to-duty + follow-up testing records</td><td>5 years</td><td><span class="cfr">§382.401(b)(1)(i)</span></td></tr>
        <tr><td>C-TPA designation documents</td><td>3 years after designation ends</td><td><span class="cfr">§382.711(b)</span></td></tr>
      </tbody>
    </table>

    <div class="callout">
      <strong>Most-cited finding:</strong> employer ran the pre-employment full query but didn't actually read it before putting the driver on the road. The query result must be reviewed and documented as reviewed before safety-sensitive duty begins · <span class="cfr">§382.701(a)(2)</span>.
    </div>
  `,
});

/* ---- 9. clearinghouse-ctpa-reference ---- */

export const clearinghouseCtpaReference: TemplateFn<{ carrierName?: string; tpaName?: string }> = (data) => ({
  title: `Clearinghouse C-TPA Reference · ${data.tpaName || "Sample C-TPA"}`,
  headerSubtitle: "Clearinghouse · C-TPA scope · 49 CFR §382.711",
  bodyHTML: `
    <h1>Clearinghouse · C-TPA reference</h1>
    <p class="meta">For ${escapeHtml(data.tpaName ? `${data.tpaName} · ` : "")}operating on behalf of <strong>${escapeHtml(data.carrierName || "designated employers")}</strong></p>

    <div class="callout">
      A Consortium / Third-Party Administrator can run queries and report violations on behalf of designated employers · but the regulatory obligation stays with the employer. This reference clarifies what you can and can't do under §382.711.
    </div>

    <h2>I · What the C-TPA can do</h2>
    <ul>
      <li><strong>Run pre-employment full queries</strong> when an employer designates you with query authority</li>
      <li><strong>Run annual limited queries</strong> for every driver on each designating employer's roster</li>
      <li><strong>Report driver violations</strong> on behalf of an employer with reporting authority designation</li>
      <li><strong>Report return-to-duty completion + follow-up plan completion</strong> when the employer has assigned you that role</li>
      <li><strong>Manage the random testing pool</strong> · maintain a consortium under §382.305 and pull selections from it</li>
    </ul>

    <h2>II · What the C-TPA can NOT do</h2>
    <ul>
      <li><strong>Cannot absorb the employer's liability</strong> · if you miss a query, the employer is still cited</li>
      <li><strong>Cannot designate themselves</strong> · the employer must initiate designation in their Clearinghouse account</li>
      <li><strong>Cannot release driver records without consent</strong> · driver-specific electronic consent is required for every full query · <span class="cfr">§382.703(b)</span></li>
      <li><strong>Cannot retain query results indefinitely</strong> · must transmit to the designating employer within a reasonable window and maintain only what §382.401 requires</li>
    </ul>

    <h2>III · The C-TPA's recordkeeping responsibilities</h2>
    <table>
      <thead><tr><th>Record</th><th>Who keeps the original</th><th>C-TPA copy?</th></tr></thead>
      <tbody>
        <tr><td>Employer designation document</td><td>FMCSA (electronic in Clearinghouse)</td><td>Yes · keep 3 years after designation ends</td></tr>
        <tr><td>Query results</td><td>Designating employer</td><td>Copy retained per service agreement; transmit to employer promptly</td></tr>
        <tr><td>Violation reports filed</td><td>FMCSA Clearinghouse + designating employer</td><td>Copy retained 5 years</td></tr>
        <tr><td>Random testing pool selection lists</td><td>C-TPA</td><td>Original · 5 years</td></tr>
        <tr><td>Driver consent records (electronic)</td><td>FMCSA Clearinghouse</td><td>Service-agreement copy recommended</td></tr>
      </tbody>
    </table>

    <h2>IV · Daily ritual for the C-TPA operations team</h2>
    <ol>
      <li><strong>Sweep designating employers' rosters</strong> · flag any new hires that haven't had a pre-employment full query yet</li>
      <li><strong>Run + transmit annual limited queries</strong> per the carrier's calendar (we recommend a quarterly cohort instead of an end-of-year crunch)</li>
      <li><strong>Process incoming violation notices</strong> · MRO positives, employer-reported refusals · file within 3 business days</li>
      <li><strong>Monitor follow-up testing plans</strong> · ensure each driver on a plan is sampled per the SAP's prescription</li>
      <li><strong>Quarterly account audit</strong> · with each designating employer, reconcile: drivers on roster vs drivers queried, violations on file vs violations reported</li>
    </ol>

    <div class="callout">
      <strong>The most common C-TPA failure mode is silent drift:</strong> an employer adds a driver mid-month and forgets to notify the C-TPA, the C-TPA misses the pre-employment query, the driver runs for 90 days before the gap is found in audit. X3 Compass closes this loop by syncing the carrier's driver table to the C-TPA's roster nightly.
    </div>
  `,
});

/* ============================================================
   BATCH 3 · HAZMAT audience guides (driver / employer / training-provider)
   49 CFR §172.700 series + §172.500 series + §172.200 series
   ============================================================ */

/* ---- 10. hazmat-driver-guide ---- */

export const hazmatDriverGuide: TemplateFn<{ carrierName?: string; driverName?: string }> = (data) => ({
  title: `Hazmat Driver Guide · ${data.driverName || "Sample Driver"}`,
  headerSubtitle: "Hazmat · driver reference · 49 CFR §172",
  bodyHTML: `
    <h1>Hazmat · driver quick guide</h1>
    <p class="meta">For <strong>${escapeHtml(data.driverName || "Sample Driver")}</strong>${data.carrierName ? ` · ${escapeHtml(data.carrierName)}` : ""} · keep in the cab with your HM-endorsement docs</p>

    <div class="callout">
      Hazmat exposure isn't theoretical · a sloppy shipping paper or a missing placard can lead to a 7-figure penalty and a death investigation. This guide is the minimum every hazmat driver carries in the cab.
    </div>

    <h2>I · Shipping papers · what must be on them</h2>
    <table>
      <thead><tr><th style="width:48%">Element</th><th>Why it's there</th><th>CFR</th></tr></thead>
      <tbody>
        <tr><td>UN/NA identification number</td><td>Tells responders what's onboard</td><td><span class="cfr">§172.202(a)(3)</span></td></tr>
        <tr><td>Proper shipping name</td><td>Confirms the material's identity</td><td><span class="cfr">§172.202(a)(1)</span></td></tr>
        <tr><td>Hazard class / division</td><td>Drives placarding, segregation, response</td><td><span class="cfr">§172.202(a)(2)</span></td></tr>
        <tr><td>Packing group (if applicable)</td><td>Tells packaging + handling intensity</td><td><span class="cfr">§172.202(a)(4)</span></td></tr>
        <tr><td>Total quantity + units</td><td>Drives reportable-quantity thresholds</td><td><span class="cfr">§172.202(a)(5)</span></td></tr>
        <tr><td>Emergency response phone number</td><td>24/7, with material expertise behind it</td><td><span class="cfr">§172.604</span></td></tr>
        <tr><td>Shipper's certification + signature</td><td>Confirms HMR-compliant prep</td><td><span class="cfr">§172.204</span></td></tr>
      </tbody>
    </table>

    <h2>II · Placards · what + where</h2>
    <ol>
      <li><strong>Four placards</strong> · one on each side and each end of the vehicle · <span class="cfr">§172.504(a)</span></li>
      <li><strong>Match the hazard class</strong> on the shipping paper · use subsidiary placards if the material has more than one</li>
      <li><strong>Visible from the direction it faces</strong> · readable from at least 50 ft in normal daylight</li>
      <li><strong>Replace any placard</strong> that's faded, peeling, damaged, or wrong before you move</li>
      <li><strong>Remove or cover placards</strong> when the vehicle no longer contains hazmat · <span class="cfr">§172.502(a)</span></li>
    </ol>

    <h2>III · Emergency response info · what to carry</h2>
    <ul>
      <li><strong>The shipping paper</strong> within immediate reach in the cab · driver's-side door pocket is standard</li>
      <li><strong>Emergency response info</strong> · ERG (Emergency Response Guidebook) or shipper-supplied equivalent · <span class="cfr">§172.602</span></li>
      <li><strong>24-hour response phone number</strong> on the shipping paper · keep your phone charged so responders can reach back-office</li>
      <li><strong>Driver's hazmat endorsement + medical card</strong></li>
    </ul>

    <h2>IV · Security awareness · what you're trained on</h2>
    <p>Every hazmat-licensed driver gets §172.704(a)(4)-(5) training. What you're expected to know:</p>
    <ol>
      <li><strong>Recognize a security threat</strong> · suspicious approach to the vehicle, attempted tampering, surveillance</li>
      <li><strong>Practice route + parking discipline</strong> · don't leave the cab in high-risk areas · use lit + monitored parking</li>
      <li><strong>Report incidents promptly</strong> · call your dispatcher + 911 · stay with the vehicle if safe</li>
      <li><strong>Know the in-transit security plan</strong> if your shipment requires one (Table 1 / Table 2 materials)</li>
    </ol>

    <div class="callout">
      <strong>If you're in doubt about whether placards or papers are right, do not move.</strong> An $80,000 fine and a CSA hit are 100% preventable by stopping for 10 minutes to call dispatch.
    </div>
  `,
});

/* ---- 11. hazmat-employer-playbook ---- */

export const hazmatEmployerPlaybook: TemplateFn<{ carrierName?: string; safetyDirectorName?: string }> = (data) => ({
  title: `Hazmat Employer Playbook · ${data.carrierName || "Sample Carrier"}`,
  headerSubtitle: "Hazmat · employer playbook · 49 CFR §172 + §107",
  bodyHTML: `
    <h1>Hazmat · employer playbook</h1>
    <p class="meta">For ${escapeHtml(data.safetyDirectorName ? `${data.safetyDirectorName} · ` : "")}<strong>${escapeHtml(data.carrierName || "Sample Carrier")}</strong> · safety + compliance operating reference</p>

    <div class="callout">
      Hazmat employers have three independent compliance pillars: training (§172.704), security planning (§172.800 for the bad materials), and registration (§107.616 if you transport above threshold). Get the training matrix right · everything else cascades from it.
    </div>

    <h2>I · The training matrix · §172.704</h2>
    <table>
      <thead><tr><th style="width:25%">Training type</th><th>Who needs it</th><th>Recertify</th><th>CFR</th></tr></thead>
      <tbody>
        <tr><td>General awareness</td><td>Every hazmat employee · what is hazmat, why does it matter</td><td>Every 3 years</td><td><span class="cfr">§172.704(a)(1)</span></td></tr>
        <tr><td>Function-specific</td><td>Each hazmat employee · what they actually do (drive, load, label, prep papers)</td><td>Every 3 years</td><td><span class="cfr">§172.704(a)(2)</span></td></tr>
        <tr><td>Safety</td><td>Every hazmat employee · emergency response, exposure mitigation</td><td>Every 3 years</td><td><span class="cfr">§172.704(a)(3)</span></td></tr>
        <tr><td>Security awareness</td><td>Every hazmat employee · recognize + respond to threats</td><td>Every 3 years</td><td><span class="cfr">§172.704(a)(4)</span></td></tr>
        <tr><td>In-depth security</td><td>Only employees in §172.800 security-plan operations</td><td>Every 3 years</td><td><span class="cfr">§172.704(a)(5)</span></td></tr>
        <tr><td>Modal-specific</td><td>Drivers · §177 training. Loaders · §173 if applicable</td><td>Every 3 years</td><td><span class="cfr">§172.704(a)(2)(ii)</span></td></tr>
      </tbody>
    </table>

    <h2>II · Security plan triggers · §172.800</h2>
    <p>You must have a written security plan if you offer for transport or transport any of:</p>
    <ul>
      <li>Highway-route-controlled radioactive material</li>
      <li>More than 25 kg of Division 1.1, 1.2, or 1.3 explosives</li>
      <li>More than 1 L of a Division 6.1 PIH Zone A material</li>
      <li>A "select agent" / regulated toxin under HHS rules</li>
      <li>Shipments in a quantity meeting the <span class="cfr">§172.800(b)</span> table</li>
    </ul>
    <p>The plan must address: personnel security, unauthorized-access security, en-route security · <span class="cfr">§172.802</span>. Review it annually, after any incident, and any time operations meaningfully change.</p>

    <h2>III · Registration · §107.616</h2>
    <p>If you offer for transport or transport above-threshold quantities in any single shipment, you must register with PHMSA and pay the annual fee:</p>
    <ul>
      <li><strong>Any quantity</strong> of highway-route-controlled radioactive · Division 1.1 / 1.2 / 1.3 explosives ≥25 kg · PIH Zone A ≥1 L</li>
      <li><strong>3,500 gal of bulk liquid hazmat</strong> (Class 3, 8, 9, etc.) in a packaging</li>
      <li><strong>5,000 lb of bulk solid hazmat</strong> in a single packaging</li>
      <li><strong>A quantity that requires a placard</strong> · in interstate or foreign commerce</li>
    </ul>
    <p>Registration is annual (July 1 - June 30). Filing is online at <em>portal.phmsa.dot.gov</em>.</p>

    <h2>IV · Recordkeeping</h2>
    <table>
      <thead><tr><th>Record</th><th>Keep for</th><th>CFR</th></tr></thead>
      <tbody>
        <tr><td>Training records (per hazmat employee)</td><td>90 days after employment ends</td><td><span class="cfr">§172.704(d)</span></td></tr>
        <tr><td>Shipping papers (as offerer or carrier)</td><td>2 years (motor carrier · 1 year for water carrier)</td><td><span class="cfr">§172.201(e)</span></td></tr>
        <tr><td>Incident reports (DOT Form F 5800.1)</td><td>2 years</td><td><span class="cfr">§171.16</span></td></tr>
        <tr><td>Security plan + revisions</td><td>While in effect, plus 90 days</td><td><span class="cfr">§172.802</span></td></tr>
        <tr><td>Registration certificate</td><td>While valid + 3 years</td><td><span class="cfr">§107.620(b)</span></td></tr>
      </tbody>
    </table>

    <div class="callout">
      <strong>Most-cited PHMSA finding:</strong> employee got general awareness training but not function-specific. Each hazmat employee needs <em>both</em> · and the function-specific training has to match what they actually do. A loader's training is not the same as a driver's.
    </div>
  `,
});

/* ---- 12. hazmat-training-provider-reference ---- */

export const hazmatTrainingProviderReference: TemplateFn<{ carrierName?: string; trainerName?: string }> = (data) => ({
  title: `Hazmat Training Provider Reference · ${data.trainerName || "Sample Training Provider"}`,
  headerSubtitle: "Hazmat · training-provider reference · §172.704",
  bodyHTML: `
    <h1>Hazmat · training-provider reference</h1>
    <p class="meta">For ${escapeHtml(data.trainerName ? `${data.trainerName} · ` : "")}delivering §172.704 training to <strong>${escapeHtml(data.carrierName || "designated carriers")}</strong></p>

    <div class="callout">
      §172.704 puts the legal training obligation on the employer · but the employer can hire a qualified third party to deliver it. This reference lays out what a training-provider package must include to be defensible in an audit.
    </div>

    <h2>I · The five training pieces every hazmat employee gets</h2>
    <ol>
      <li><strong>General awareness</strong> · familiarize the employee with the regulations + general hazmat concepts · <span class="cfr">§172.704(a)(1)</span></li>
      <li><strong>Function-specific</strong> · cover the specific HMR requirements applicable to the employee's job functions · <span class="cfr">§172.704(a)(2)</span></li>
      <li><strong>Safety training</strong> · emergency response, methods + procedures for avoiding accidents, measures to protect self · <span class="cfr">§172.704(a)(3)</span></li>
      <li><strong>Security awareness</strong> · recognize + respond to security threats · <span class="cfr">§172.704(a)(4)</span></li>
      <li><strong>In-depth security training</strong> · only for employees of carriers + offerers required to have a §172.800 security plan · <span class="cfr">§172.704(a)(5)</span></li>
    </ol>

    <h2>II · What the records must show</h2>
    <table>
      <thead><tr><th style="width:35%">Required element</th><th>Why</th><th>CFR</th></tr></thead>
      <tbody>
        <tr><td>Hazmat employee's name</td><td>Per-individual training is a federal requirement</td><td><span class="cfr">§172.704(d)(1)</span></td></tr>
        <tr><td>Most recent training completion date</td><td>Drives the 3-year recertification clock</td><td><span class="cfr">§172.704(d)(2)</span></td></tr>
        <tr><td>Description, copy, or location of training materials</td><td>Lets the investigator reconstruct what was taught</td><td><span class="cfr">§172.704(d)(3)</span></td></tr>
        <tr><td>Trainer's name + contact</td><td>Investigator may interview the trainer</td><td><span class="cfr">§172.704(d)(4)</span></td></tr>
        <tr><td>Certification statement that the employee was tested + passed</td><td>Confirms competence, not just attendance</td><td><span class="cfr">§172.704(d)(5)</span></td></tr>
      </tbody>
    </table>

    <h2>III · Recertification cadence</h2>
    <ul>
      <li><strong>Every 3 years</strong> · the full training package · <span class="cfr">§172.704(c)(2)</span></li>
      <li><strong>Whenever functions change</strong> · new function-specific training before the employee performs the new function</li>
      <li><strong>New hazmat employees</strong> · must complete training within 90 days of employment · may perform functions before completing IF supervised by trained personnel · <span class="cfr">§172.704(c)(1)</span></li>
    </ul>

    <h2>IV · What a defensible training-provider package looks like</h2>
    <ol>
      <li><strong>A syllabus per audience</strong> · driver / loader / shipping-paper-prep / handler / security-plan-personnel · each mapped to §172.704(a)(1)-(5)</li>
      <li><strong>An attendance + test record per individual</strong> · with the 5 required elements above</li>
      <li><strong>A delivery method note</strong> · in-person, LMS, blended · investigators may probe whether the method was sufficient for the function</li>
      <li><strong>A passing-score record</strong> · a generic "completion" isn't enough · §172.704(d)(5) requires testing</li>
      <li><strong>A 90-days-after-termination retention policy</strong> · the training-provider hands records to the employer; the employer keeps them per §172.704(d)</li>
    </ol>

    <div class="callout">
      <strong>The trainer-of-record matters.</strong> An auditor finding a generic "completion certificate" without trainer attribution will treat it as no record at all. Always include trainer's full name + contact on the certificate.
    </div>
  `,
});

/* ============================================================
   REGISTRY
   ============================================================ */

export const TEMPLATES: Record<string, TemplateFn> = {
  "letterhead-test": letterheadTest as TemplateFn,
  "hazmat-audit-checklist": hazmatAuditChecklist as TemplateFn,
  "training-certificate": trainingCertificate as TemplateFn,
  "hos-driver-quickguide": hosDriverQuickGuide as TemplateFn,
  "hos-supervisor-playbook": hosSupervisorPlaybook as TemplateFn,
  "hos-auditor-export-guide": hosAuditorExportGuide as TemplateFn,
  "clearinghouse-driver-guide": clearinghouseDriverGuide as TemplateFn,
  "clearinghouse-employer-playbook": clearinghouseEmployerPlaybook as TemplateFn,
  "clearinghouse-ctpa-reference": clearinghouseCtpaReference as TemplateFn,
  "hazmat-driver-guide": hazmatDriverGuide as TemplateFn,
  "hazmat-employer-playbook": hazmatEmployerPlaybook as TemplateFn,
  "hazmat-training-provider-reference": hazmatTrainingProviderReference as TemplateFn,
};

export type TemplateSlug = keyof typeof TEMPLATES;
