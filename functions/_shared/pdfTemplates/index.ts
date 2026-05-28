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
 * Build the shared footerTemplate string · brand line + version/hash + page X of Y.
 *
 * The version + content-hash give every generated PDF a tamper-evident
 * fingerprint that matches the compass_pdf_generated audit row. Auditors can
 * cross-reference the printed footer against the audit ledger to prove
 * exactly which template version was in the cab on day X.
 */
export function buildFooterTemplate(version?: string, contentHash?: string): string {
  const versionTag = version && contentHash
    ? `<span style="font-family: 'SF Mono', Menlo, Consolas, monospace; color: #94A3B8;">v${escapeHtml(version)} · ${escapeHtml(contentHash)}</span>`
    : "";
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
  ${versionTag}
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
  /**
   * Semver-ish template version · drives the filename, the footer fingerprint,
   * and the audit-log row. Bump when content materially changes. Default "1.0".
   */
  version?: string;
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
  version: "1.0",
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
    version: "1.0",
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
  version: "1.0",
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
  version: "1.0",
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
  version: "1.0",
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
  version: "1.0",
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
  version: "1.0",
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
  version: "1.0",
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
  version: "1.0",
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
  version: "1.0",
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
  version: "1.0",
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
  version: "1.0",
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
   BATCH 4 · D&A · DQF · FCRA · MVR · IFTA · Inspections
   ============================================================ */

/* ---- 13. da-driver-guide · 49 CFR Part 382 ---- */

export const daDriverGuide: TemplateFn<{ carrierName?: string; driverName?: string }> = (data) => ({
  version: "1.0",
  title: `Drug & Alcohol Testing · Driver Guide · ${data.driverName || "Sample Driver"}`,
  headerSubtitle: "D&A · driver reference · 49 CFR Part 382",
  bodyHTML: `
    <h1>Drug & Alcohol testing · driver guide</h1>
    <p class="meta">For <strong>${escapeHtml(data.driverName || "Sample Driver")}</strong>${data.carrierName ? ` · ${escapeHtml(data.carrierName)}` : ""} · keep with your CDL paperwork</p>

    <div class="callout">
      As a CDL driver, you're subject to DOT drug + alcohol testing under 49 CFR Part 382 and 49 CFR Part 40. This guide explains when you'll be tested, what's tested for, and what counts as a refusal.
    </div>

    <h2>I · The five situations you can be tested</h2>
    <table>
      <thead><tr><th style="width:28%">Type</th><th>When</th><th>CFR</th></tr></thead>
      <tbody>
        <tr><td>Pre-employment</td><td>Before you perform a safety-sensitive function for a new employer · drug test only</td><td><span class="cfr">§382.301</span></td></tr>
        <tr><td>Random</td><td>Unannounced · selected by computer from the random pool · 50% drug / 10% alcohol annual rate (FMCSA-set)</td><td><span class="cfr">§382.305</span></td></tr>
        <tr><td>Post-accident</td><td>If accident meets §382.303 thresholds (fatality · injury treated away from scene with citation · disabling damage with citation)</td><td><span class="cfr">§382.303</span></td></tr>
        <tr><td>Reasonable suspicion</td><td>A trained supervisor observes signs · documents them · sends you for a test</td><td><span class="cfr">§382.307</span></td></tr>
        <tr><td>Return-to-duty + follow-up</td><td>After a SAP-cleared violation · negative RTD test required · then 6+ unannounced tests in 12 months</td><td><span class="cfr">§382.309, §40.305</span></td></tr>
      </tbody>
    </table>

    <h2>II · What's tested for</h2>
    <ul>
      <li><strong>Drug panel · 5 substances:</strong> marijuana (THC) · cocaine · opiates (incl. heroin, codeine, morphine, hydrocodone, oxycodone) · amphetamines (incl. methamphetamine, MDMA) · PCP</li>
      <li><strong>Alcohol:</strong> any concentration ≥ 0.02 BAC pulls you off safety-sensitive duty for 24 hr · ≥ 0.04 BAC is a violation reported to the Clearinghouse</li>
      <li><strong>Specimen:</strong> oral fluid was added as an option in 2023 · most carriers still use urine</li>
    </ul>

    <h2>III · What counts as a refusal</h2>
    <ol>
      <li><strong>Failing to appear</strong> at the collection site within a reasonable time after notification</li>
      <li><strong>Leaving the collection site</strong> before the testing process is complete</li>
      <li><strong>Failing to provide</strong> a urine specimen, oral fluid, or breath sample without a documented medical reason</li>
      <li><strong>Adulterated or substituted specimen</strong> · MRO determines from lab results</li>
      <li><strong>Refusing to take a second test</strong> the employer or collector directs</li>
      <li><strong>Failing to cooperate</strong> with any part of the testing process (e.g., refusing to empty pockets, refusing observed collection when required)</li>
    </ol>

    <div class="callout">
      <strong>A refusal is treated the same as a positive test.</strong> The violation goes into the Clearinghouse, you're removed from safety-sensitive duty, and you can't drive a CMV anywhere in the US until you complete the SAP return-to-duty process.
    </div>

    <h2>IV · Your rights at the collection site</h2>
    <ul>
      <li><strong>Privacy</strong> · the collector observes your behavior, not the act of voiding (except in directly-observed cases per §40.67)</li>
      <li><strong>Split specimen</strong> · for drug tests, the sample is split. If your primary is positive, you have 72 hours to request the split tested at a different lab</li>
      <li><strong>MRO contact</strong> · if you have a legitimate medical explanation (prescription), you'll be contacted by the Medical Review Officer · don't volunteer that info at the collection site</li>
      <li><strong>Owe nothing in cash</strong> · the employer pays for the test; you should never be asked to pay at the collection site</li>
    </ul>
  `,
});

/* ---- 14. da-employer-playbook · 49 CFR Part 382 + Part 40 ---- */

export const daEmployerPlaybook: TemplateFn<{ carrierName?: string; safetyDirectorName?: string }> = (data) => ({
  version: "1.0",
  title: `D&A Testing Employer Playbook · ${data.carrierName || "Sample Carrier"}`,
  headerSubtitle: "D&A · employer playbook · 49 CFR Part 382",
  bodyHTML: `
    <h1>D&A testing · employer playbook</h1>
    <p class="meta">For ${escapeHtml(data.safetyDirectorName ? `${data.safetyDirectorName} · ` : "")}<strong>${escapeHtml(data.carrierName || "Sample Carrier")}</strong> · operating duties under Part 382 + Part 40</p>

    <div class="callout">
      Every employer of CDL drivers must run a DOT-compliant D&A program: written policy, supervisor training, random pool, post-accident triggers, MRO + SAP relationships, and Clearinghouse reporting. Miss any pillar and the whole program is at risk in an audit.
    </div>

    <h2>I · The program pillars</h2>
    <table>
      <thead><tr><th style="width:30%">Pillar</th><th>What it looks like</th><th>CFR</th></tr></thead>
      <tbody>
        <tr><td>Written D&A policy</td><td>Given to every driver at hire · driver signs receipt</td><td><span class="cfr">§382.601</span></td></tr>
        <tr><td>Supervisor training</td><td>60 min drug + 60 min alcohol · before they can make reasonable-suspicion calls</td><td><span class="cfr">§382.603</span></td></tr>
        <tr><td>Random pool</td><td>50% drug / 10% alcohol minimum annual rates · evenly distributed across the year · selection process documented</td><td><span class="cfr">§382.305</span></td></tr>
        <tr><td>Post-accident testing</td><td>Decision tree applied at every qualifying accident · alcohol within 8 hr · drug within 32 hr</td><td><span class="cfr">§382.303</span></td></tr>
        <tr><td>MRO relationship</td><td>Medical Review Officer reviews every drug test result · contacts driver re: prescriptions</td><td><span class="cfr">§40 Subpart G</span></td></tr>
        <tr><td>SAP relationship</td><td>Substance Abuse Professional for any RTD process · you don't need one on retainer, but know where to refer</td><td><span class="cfr">§40 Subpart O</span></td></tr>
        <tr><td>Clearinghouse reporting</td><td>Violations reported within 3 business days · pre-employment + annual queries</td><td><span class="cfr">§382.701, §382.705</span></td></tr>
      </tbody>
    </table>

    <h2>II · Post-accident decision tree</h2>
    <ol>
      <li><strong>Fatality?</strong> → Test both drug + alcohol regardless of who is at fault</li>
      <li><strong>Injury treated away from scene + driver issued citation?</strong> → Test both</li>
      <li><strong>Disabling damage to any vehicle + driver issued citation?</strong> → Test both</li>
      <li><strong>None of the above?</strong> → No DOT test required (you may still test under company policy)</li>
    </ol>
    <p class="meta">Alcohol test must be administered within <strong>8 hours</strong>; drug test within <strong>32 hours</strong>. Document any delay + reason · §382.303(d).</p>

    <h2>III · Random testing math</h2>
    <ul>
      <li><strong>Pool roster</strong> · everyone subject to Part 382 (CDL holders in safety-sensitive functions)</li>
      <li><strong>Selection</strong> · scientifically valid random method · most carriers use the C-TPA's selection engine or a vetted tool</li>
      <li><strong>Annual rate</strong> · 50% of average driver count tested for drugs each year, 10% for alcohol (FMCSA can change these annually)</li>
      <li><strong>Distribution</strong> · selections must be evenly spread across the year · don't dump 50% in December</li>
      <li><strong>Notification</strong> · driver tested immediately after notification · no delay, no "tomorrow"</li>
    </ul>

    <h2>IV · Recordkeeping</h2>
    <table>
      <thead><tr><th>Record</th><th>Keep for</th><th>CFR</th></tr></thead>
      <tbody>
        <tr><td>Negative test results</td><td>1 year</td><td><span class="cfr">§382.401(b)(2)</span></td></tr>
        <tr><td>Positive results + refusals + violations</td><td>5 years</td><td><span class="cfr">§382.401(b)(1)</span></td></tr>
        <tr><td>Random selection records</td><td>2 years</td><td><span class="cfr">§382.401(b)(3)</span></td></tr>
        <tr><td>Supervisor training records</td><td>While supervisor performs the role + 2 years after</td><td><span class="cfr">§382.603</span></td></tr>
        <tr><td>Policy receipt signatures</td><td>While driver employed + 3 years</td><td><span class="cfr">§382.601(d)</span></td></tr>
        <tr><td>MIS data (annual MIS report)</td><td>5 years · submit by Mar 15 if requested</td><td><span class="cfr">§382.403</span></td></tr>
      </tbody>
    </table>

    <div class="callout">
      <strong>The most common audit finding:</strong> the carrier's random pool wasn't actually random · selections favored the same drivers or skipped a quarter. Document your selection method end-to-end · the C-TPA's report is your defense.
    </div>
  `,
});

/* ---- 15. dqf-driver-index · 49 CFR §391.51 ---- */

export const dqfDriverIndex: TemplateFn<{ carrierName?: string; driverName?: string }> = (data) => ({
  version: "1.0",
  title: `DQ File Index · ${data.driverName || "Sample Driver"}`,
  headerSubtitle: "Driver Qualification File · 49 CFR §391.51",
  bodyHTML: `
    <h1>Driver Qualification File · index</h1>
    <p class="meta">For <strong>${escapeHtml(data.driverName || "Sample Driver")}</strong>${data.carrierName ? ` · ${escapeHtml(data.carrierName)}` : ""} · the 12 documents §391.51 requires</p>

    <div class="callout">
      §391.51 says every motor carrier "shall maintain a driver qualification file for each driver it employs." Below is the master index. Missing any single item is a citation. Missing patterns across multiple drivers is an unsatisfactory safety rating.
    </div>

    <h2>I · The 12 required documents</h2>
    <table>
      <thead><tr><th style="width:5%">#</th><th>Document</th><th>CFR</th><th>Retention</th></tr></thead>
      <tbody>
        <tr><td>1</td><td>Driver's application for employment (full §391.21 long-form)</td><td><span class="cfr">§391.21</span></td><td>Duration of employment + 3 yr</td></tr>
        <tr><td>2</td><td>Initial state MVR (within 30 days of hire)</td><td><span class="cfr">§391.23(a)(1)</span></td><td>Duration + 3 yr</td></tr>
        <tr><td>3</td><td>Previous employer safety performance history inquiries (DOT employment + D&A · 3 years back)</td><td><span class="cfr">§391.23(d)</span></td><td>Duration + 3 yr</td></tr>
        <tr><td>4</td><td>Road test certificate OR equivalent (CDL on file with proper class/endorsements)</td><td><span class="cfr">§391.31 / §391.33</span></td><td>Duration + 3 yr</td></tr>
        <tr><td>5</td><td>Medical examiner's certificate (current · max 24 mo)</td><td><span class="cfr">§391.43</span></td><td>Current + 3 yr after replacement</td></tr>
        <tr><td>6</td><td>National Registry verification (NRCME ID + date verified)</td><td><span class="cfr">§391.23(m)</span></td><td>Duration + 3 yr</td></tr>
        <tr><td>7</td><td>Annual driver's review of driving record (§391.25 review note)</td><td><span class="cfr">§391.25(c)</span></td><td>Duration + 3 yr</td></tr>
        <tr><td>8</td><td>Annual list of violations (driver self-cert per §391.27) OR annual MVR substitute</td><td><span class="cfr">§391.27</span></td><td>Duration + 3 yr</td></tr>
        <tr><td>9</td><td>Annual MVR (one per year for every state where licensed in last 12 mo)</td><td><span class="cfr">§391.25(a)</span></td><td>Duration + 3 yr</td></tr>
        <tr><td>10</td><td>Clearinghouse pre-employment full query + driver consent</td><td><span class="cfr">§382.701(a)</span></td><td>3 yr</td></tr>
        <tr><td>11</td><td>Clearinghouse annual limited query consent (general written) + each query result</td><td><span class="cfr">§382.701(b)</span></td><td>3 yr</td></tr>
        <tr><td>12</td><td>Entry-level driver training certificate (for new CDL holders post 02/07/2022)</td><td><span class="cfr">§380.609</span></td><td>Duration + 3 yr</td></tr>
      </tbody>
    </table>

    <h2>II · When each annual task fires</h2>
    <ul>
      <li><strong>Annual MVR</strong> · pull one full state MVR every 12 months for every state where the driver was licensed in the past year</li>
      <li><strong>Annual driver's review</strong> · supervisor sits with the driver, reviews the MVR + safety performance, signs a §391.25(c) note</li>
      <li><strong>Annual list of violations</strong> · driver self-certifies all moving violations from the past 12 months on a §391.27 form</li>
      <li><strong>Annual limited Clearinghouse query</strong> · one per driver per year (already has driver's general consent on file)</li>
    </ul>

    <h2>III · Common audit findings (the gotchas)</h2>
    <ol>
      <li><strong>Medical card expired</strong> · driver is still driving · this is an immediate out-of-service for the driver and a citation for you</li>
      <li><strong>No National Registry verification</strong> · the medical card alone isn't enough · §391.23(m) requires you verify the examiner is registered + record the date you did so</li>
      <li><strong>Missing previous-employer inquiries</strong> · you must contact each DOT employer from the past 3 years for safety performance + D&A history · keep the actual responses, not just an attempt log</li>
      <li><strong>Annual review skipped</strong> · easy to fall behind on · most fleets get cited here</li>
      <li><strong>No ELDT certificate</strong> · for drivers who got their CDL after 02/07/2022 · this lives in the public registry, but you still need a copy in the DQ file</li>
    </ol>

    <div class="callout">
      The X3 Compass DQ tracker pulls every status into one view with traffic-light statuses. If a row is yellow or red, click into it to see what's missing + the regulatory cite. Audit-export bundles all 12 documents into a single PDF per driver.
    </div>
  `,
});

/* ---- 16. fcra-background-check-disclosure ---- */

export const fcraBackgroundCheckDisclosure: TemplateFn<{ carrierName?: string; driverName?: string }> = (data) => ({
  version: "1.0",
  title: `FCRA Disclosure & Authorization · ${data.driverName || "Applicant"}`,
  headerSubtitle: "FCRA · pre-screening disclosure · 15 U.S.C. §1681b(b)(2)(A)",
  bodyHTML: `
    <h1>Disclosure regarding background investigation</h1>
    <p class="meta">${escapeHtml(data.carrierName || "Sample Carrier")} · for <strong>${escapeHtml(data.driverName || "Applicant")}</strong></p>

    <div class="callout">
      This is the federally-required stand-alone disclosure under the Fair Credit Reporting Act (FCRA), 15 U.S.C. §1681b(b)(2)(A). It must be presented as its own document · not part of an application packet or employment agreement.
    </div>

    <h2>Disclosure</h2>
    <p><strong>${escapeHtml(data.carrierName || "The Company")}</strong> ("the Company") may obtain information about you from a consumer reporting agency for employment purposes. Thus, you may be the subject of a "consumer report" and/or an "investigative consumer report" which may include information about your character, general reputation, personal characteristics, and/or mode of living, and which can involve personal interviews with sources such as your neighbors, friends, or associates. These reports may contain information regarding your criminal history, social security verification, motor vehicle records ("driving records"), verification of your education or employment history, or other background checks.</p>

    <p>You have the right, upon written request made within a reasonable time, to request whether a consumer report has been run about you, and disclosure of the nature and scope of any investigative consumer report. The Company will provide you with the name and contact information of any consumer reporting agency that has prepared a report about you, along with a copy of the FCRA's "Summary of Your Rights Under the Fair Credit Reporting Act."</p>

    <h2>Authorization</h2>
    <p>I acknowledge receipt of the above disclosure regarding background investigation and the FCRA Summary of Rights and certify that I have read and understand both documents.</p>

    <p>I hereby authorize <strong>${escapeHtml(data.carrierName || "the Company")}</strong> and its designated agents and representatives to conduct a comprehensive review of my background through a consumer report and/or an investigative consumer report. I understand that the scope of the consumer report/investigative consumer report may include, but is not limited to, the following areas: verification of social security number; current and previous residences; employment history including all reasons for termination; education; references; credit history and reports as permissible; criminal history records from any criminal justice agency in any or all federal, state, county jurisdictions; driving records, birth records, and any other public records.</p>

    <p>I further authorize any individual, company, firm, corporation, or public agency (including the Social Security Administration and law enforcement agencies) to divulge any and all information, verbal or written, pertaining to me, to <strong>${escapeHtml(data.carrierName || "the Company")}</strong> or its agents.</p>

    <p>This authorization shall remain valid for the duration of my employment with <strong>${escapeHtml(data.carrierName || "the Company")}</strong> unless revoked by me in writing.</p>

    <table style="margin-top: 0.4in;">
      <tbody>
        <tr><td style="width:60%; padding: 16px 8px;"><div class="signature-line"></div><div class="signature-label">Applicant signature</div></td><td style="width:40%; padding: 16px 8px;"><div class="signature-line"></div><div class="signature-label">Date</div></td></tr>
        <tr><td style="padding: 16px 8px;"><div class="signature-line"></div><div class="signature-label">Printed name</div></td><td style="padding: 16px 8px;"><div class="signature-line"></div><div class="signature-label">Social Security Number (last 4)</div></td></tr>
      </tbody>
    </table>

    <p class="meta" style="margin-top: 0.3in;">This document is provided for compliance with 15 U.S.C. §1681b(b)(2)(A). The full Summary of Rights under the Fair Credit Reporting Act is provided separately.</p>
  `,
});

/* ---- 17. mvr-explainer · 49 CFR §391.25 + §383.51 ---- */

export const mvrExplainer: TemplateFn<{ carrierName?: string; driverName?: string }> = (data) => ({
  version: "1.0",
  title: `MVR Explainer · ${data.driverName || "Sample Driver"}`,
  headerSubtitle: "Motor Vehicle Record · driver + carrier reference",
  bodyHTML: `
    <h1>Motor Vehicle Record · what's on it, what matters</h1>
    <p class="meta">For <strong>${escapeHtml(data.driverName || "Sample Driver")}</strong>${data.carrierName ? ` · ${escapeHtml(data.carrierName)}` : ""}</p>

    <div class="callout">
      Your MVR is the state DMV's record of every traffic violation, accident, license action, and CDL endorsement attached to your driving history. Carriers pull it before they hire you and at least annually after that. Some pull it monthly via continuous monitoring · this guide explains both modes.
    </div>

    <h2>I · What an MVR contains</h2>
    <ul>
      <li><strong>License status</strong> · valid / suspended / revoked / disqualified · current as of the pull date</li>
      <li><strong>License class + endorsements</strong> · CDL-A / CDL-B / CDL-C · H (hazmat), N (tanker), T (doubles/triples), P (passenger), S (school bus)</li>
      <li><strong>Restrictions</strong> · automatic-only, no air-brakes, intrastate-only, corrective lenses, etc.</li>
      <li><strong>Convictions</strong> · moving violations from the past 3-5 years depending on state · speeding, reckless, DUI, etc.</li>
      <li><strong>Accidents</strong> · reportable accidents · which state reports varies</li>
      <li><strong>License actions</strong> · any prior suspension, revocation, or disqualification (state and federal)</li>
    </ul>

    <h2>II · How often a carrier pulls it</h2>
    <table>
      <thead><tr><th style="width:30%">Mode</th><th>Cadence</th><th>CFR</th></tr></thead>
      <tbody>
        <tr><td>Pre-employment MVR</td><td>Within 30 days of hire from every state the driver was licensed in over the past 3 years</td><td><span class="cfr">§391.23(a)(1)</span></td></tr>
        <tr><td>Annual MVR (minimum)</td><td>Once per year · every state where the driver was licensed in the past 12 months</td><td><span class="cfr">§391.25(a)</span></td></tr>
        <tr><td>Continuous monitoring (optional but recommended)</td><td>Real-time alerts whenever a new violation or status change posts · vendor-managed</td><td>Industry best practice</td></tr>
      </tbody>
    </table>

    <h2>III · The disqualifying offenses (§383.51 Table 1)</h2>
    <p><strong>Major offenses</strong> (1st conviction = 1-year disqualification · 2nd = lifetime):</p>
    <ul>
      <li>BAC ≥ 0.04 in a CMV</li>
      <li>BAC ≥ 0.08 in a non-CMV (when CMV operator)</li>
      <li>Refusing alcohol test</li>
      <li>Leaving the scene of an accident</li>
      <li>Using a CMV in commission of a felony</li>
      <li>Driving CMV with revoked / suspended / canceled CDL</li>
      <li>Causing a fatality through negligent operation</li>
    </ul>

    <p><strong>Serious traffic violations</strong> (3 in 3 years = 120-day disqualification · 2 = 60-day):</p>
    <ul>
      <li>Excessive speeding (15+ mph over)</li>
      <li>Reckless driving</li>
      <li>Improper / erratic lane change</li>
      <li>Following too closely</li>
      <li>Texting while driving in a CMV</li>
      <li>Using a hand-held mobile in a CMV</li>
      <li>Driving CMV without CDL / without proper class / without endorsement</li>
    </ul>

    <h2>IV · What the carrier does with what they find</h2>
    <ol>
      <li><strong>Initial MVR</strong> · evaluated against the carrier's hiring standard · disqualifying offenses bar employment</li>
      <li><strong>Annual review</strong> · supervisor sits with the driver, reviews the MVR, signs a §391.25(c) note · placed in DQ file</li>
      <li><strong>New violation appears</strong> · carrier evaluates against their progressive discipline matrix · counseling, retraining, suspension, or termination depending on severity</li>
      <li><strong>License action</strong> · suspension or revocation is immediate removal from safety-sensitive duty · carrier must verify reinstatement before driver returns</li>
    </ol>

    <div class="callout">
      <strong>Notify your carrier within 30 days of any conviction</strong> in any state, even if the violation happened in your personal vehicle · §383.31. Failure to notify is itself a disqualifying offense.
    </div>
  `,
});

/* ---- 18. ifta-quarterly-walkthrough · IFTA Articles of Agreement ---- */

export const iftaQuarterlyWalkthrough: TemplateFn<{ carrierName?: string; safetyDirectorName?: string }> = (data) => ({
  version: "1.0",
  title: `IFTA Quarterly Filing · ${data.carrierName || "Sample Carrier"}`,
  headerSubtitle: "IFTA · quarterly fuel tax walkthrough",
  bodyHTML: `
    <h1>IFTA quarterly filing · walkthrough</h1>
    <p class="meta">For ${escapeHtml(data.safetyDirectorName ? `${data.safetyDirectorName} · ` : "")}<strong>${escapeHtml(data.carrierName || "Sample Carrier")}</strong> · IFTA fuel-tax reporting</p>

    <div class="callout">
      IFTA (International Fuel Tax Agreement) lets you file one fuel-tax return covering all 48 contiguous US states + 10 Canadian provinces. You file in your base jurisdiction; that jurisdiction redistributes the tax to the others based on the miles you drove and fuel you bought in each. Miss a filing and you pay penalties + interest in every jurisdiction.
    </div>

    <h2>I · The four deadlines</h2>
    <table>
      <thead><tr><th style="width:25%">Quarter</th><th>Covers</th><th>Due by</th></tr></thead>
      <tbody>
        <tr><td>Q1</td><td>Jan 1 – Mar 31</td><td>April 30</td></tr>
        <tr><td>Q2</td><td>Apr 1 – Jun 30</td><td>July 31</td></tr>
        <tr><td>Q3</td><td>Jul 1 – Sep 30</td><td>October 31</td></tr>
        <tr><td>Q4</td><td>Oct 1 – Dec 31</td><td>January 31 (following year)</td></tr>
      </tbody>
    </table>
    <p class="meta">If a due date falls on a weekend or holiday, the deadline moves to the next business day. File even if you had zero IFTA miles in a quarter ("zero return") to avoid penalty.</p>

    <h2>II · What you need to file</h2>
    <ol>
      <li><strong>Total miles driven</strong> · all jurisdictions combined, every IFTA-qualifying vehicle</li>
      <li><strong>Miles per jurisdiction</strong> · for every state / province you operated in</li>
      <li><strong>Total gallons of fuel purchased</strong> · all jurisdictions combined, by fuel type (diesel, gasoline, etc.)</li>
      <li><strong>Gallons per jurisdiction</strong> · proof of purchase via fuel receipt or fuel-card report</li>
      <li><strong>Fleet MPG for the quarter</strong> · total miles ÷ total gallons (calculated automatically by your IFTA software)</li>
    </ol>

    <h2>III · How the math works (simplified)</h2>
    <ol>
      <li><strong>Compute fleet MPG</strong> for the quarter (total miles ÷ total gallons)</li>
      <li><strong>For each jurisdiction:</strong> miles driven ÷ fleet MPG = gallons "consumed" in that jurisdiction</li>
      <li><strong>Tax owed</strong> in each jurisdiction = consumed gallons × that jurisdiction's tax rate</li>
      <li><strong>Tax already paid</strong> at the pump in that jurisdiction = gallons purchased there × that rate</li>
      <li><strong>Net owed / refunded</strong> = tax owed - tax already paid (per jurisdiction)</li>
      <li><strong>Sum across all jurisdictions</strong> = your IFTA net for the quarter</li>
    </ol>

    <h2>IV · What records to keep</h2>
    <table>
      <thead><tr><th>Record</th><th>Keep for</th><th>Why</th></tr></thead>
      <tbody>
        <tr><td>Individual Vehicle Mileage Records (IVMRs)</td><td>4 years</td><td>Per-jurisdiction mileage backup · audits go back this far</td></tr>
        <tr><td>Fuel receipts (every purchase)</td><td>4 years</td><td>Tax-paid credit proof · without it you owe the full tax with no credit</td></tr>
        <tr><td>Fuel card / GPS reports</td><td>4 years</td><td>Cross-check against receipts + IVMRs</td></tr>
        <tr><td>Quarterly returns + worksheets</td><td>4 years</td><td>Filed-and-paid evidence</td></tr>
        <tr><td>License + decals (current + 4 prior years)</td><td>4 years</td><td>Required at roadside inspection</td></tr>
      </tbody>
    </table>

    <div class="callout">
      <strong>The most expensive IFTA mistake:</strong> missing a fuel receipt. Without proof of purchase in jurisdiction X, the auditor disallows your tax-paid credit there · you owe the full tax on the gallons "consumed" in X with zero offset. Scan receipts the day you buy fuel.
    </div>
  `,
});

/* ---- 19. inspections-post-stop-response · 49 CFR §396.9 + §396.11 ---- */

export const inspectionsPostStopResponse: TemplateFn<{ carrierName?: string; safetyDirectorName?: string }> = (data) => ({
  version: "1.0",
  title: `Post-Inspection Response · ${data.carrierName || "Sample Carrier"}`,
  headerSubtitle: "Inspections · post-stop response · 49 CFR §396",
  bodyHTML: `
    <h1>Roadside inspection · post-stop response</h1>
    <p class="meta">For ${escapeHtml(data.safetyDirectorName ? `${data.safetyDirectorName} · ` : "")}<strong>${escapeHtml(data.carrierName || "Sample Carrier")}</strong> · what to do in the 30 days after a roadside</p>

    <div class="callout">
      A roadside inspection is also a regulatory deadline clock starting. Within 24 hours you owe the driver's report to the carrier; within 15 days you owe certified corrections to FMCSA; within 30 days the violations have hit your CSA score and you should have a documented response. Miss any of these and a "minor" stop becomes an audit trigger.
    </div>

    <h2>I · The timeline · what's due when</h2>
    <table>
      <thead><tr><th style="width:18%">When</th><th>Action</th><th>CFR</th></tr></thead>
      <tbody>
        <tr><td><strong>Roadside</strong></td><td>Driver receives inspection report (Form MCS-63 or state equivalent) · keeps a copy in the cab</td><td><span class="cfr">§396.9(c)</span></td></tr>
        <tr><td><strong>Within 24 hours</strong></td><td>Driver delivers a copy of the inspection report to the motor carrier</td><td><span class="cfr">§396.9(d)(1)</span></td></tr>
        <tr><td><strong>Within 15 days</strong></td><td>Carrier signs the certification on the inspection report, documents all corrections, returns the original to the issuing state · violations corrected before the truck moves again</td><td><span class="cfr">§396.9(d)(3)</span></td></tr>
        <tr><td><strong>Within 30 days</strong></td><td>CSA score updates · review impact, document follow-up training for the driver, file the response in the carrier safety folder</td><td>SMS · industry practice</td></tr>
      </tbody>
    </table>

    <h2>II · The 5 things to do the day you get the report</h2>
    <ol>
      <li><strong>Verify the violations</strong> · read each citation against the actual vehicle / driver / paperwork · sometimes the inspector got it wrong (DataQ candidates)</li>
      <li><strong>Take the truck out of service</strong> for any OOS violation until corrected · inspector marked it OOS for a reason · §396.9(c)(2) makes it federal violation to move it</li>
      <li><strong>Document the corrective action</strong> for every violation · who fixed it, when, with what part / repair / retraining record</li>
      <li><strong>Sit with the driver</strong> · review what happened · log the conversation in the driver's file (this is your trail for progressive discipline if a pattern develops)</li>
      <li><strong>File the certified copy</strong> · sign §396.9(d)(3) certification on the report, mail/upload to the issuing state · keep a copy in your inspection log</li>
      <li><strong>Open a DataQ request</strong> if you genuinely believe a violation is wrong · file within 30 days while evidence is fresh</li>
    </ol>

    <h2>III · The 5 highest-CSA-impact violation patterns</h2>
    <ul>
      <li><strong>Driver Out-of-Service</strong> (any reason · HOS, no medical card, suspended CDL) · 7× severity, the worst single hit</li>
      <li><strong>Vehicle OOS</strong> · brakes out of adjustment, tire defects, lighting · 7× severity</li>
      <li><strong>Speeding 15+ mph over</strong> · 10× severity (yes, double an OOS)</li>
      <li><strong>Texting / hand-held mobile in CMV</strong> · 10× severity</li>
      <li><strong>HOS violation</strong> (drive past 11/14 hr, missing break, no logs) · 7× severity</li>
    </ul>

    <h2>IV · The DataQ defense · when + how to dispute</h2>
    <p>If a violation is factually wrong (the inspector cited the wrong cargo class, the brakes were actually in adjustment, the driver wasn't actually over hours), file a DataQ challenge at <em>dataqs.fmcsa.dot.gov</em>:</p>
    <ol>
      <li><strong>File within 30 days</strong> of the stop · earlier is much better</li>
      <li><strong>Upload evidence</strong> · photos, repair invoices, ELD logs, ECM data, the inspection report itself</li>
      <li><strong>Cite the specific CFR provision</strong> the inspector misapplied</li>
      <li><strong>Track the response</strong> in your DataQ dashboard · state has 30 days to rule</li>
      <li><strong>If denied, appeal</strong> to the state-level supervisor · then to FMCSA HQ if needed</li>
    </ol>

    <div class="callout">
      <strong>The 15-day certified-correction deadline is not a suggestion.</strong> Missing it converts a violation from "fixable on the score" to "uncertified · violation stays on your CSA permanently." A 30-second signature + a stamped envelope is the most expensive piece of paper in trucking.
    </div>
  `,
});

/* ============================================================
   BATCH 5 · Accidents · Medical card · CSA · DVIR · Onboarding
   ============================================================ */

/* ---- 20. accidents-driver-response · 49 CFR §390.5 + §392.4 ---- */

export const accidentsDriverResponse: TemplateFn<{ carrierName?: string; driverName?: string }> = (data) => ({
  version: "1.0",
  title: `Accident Response · Driver Guide · ${data.driverName || "Sample Driver"}`,
  headerSubtitle: "Accidents · driver reference · 49 CFR §390.5",
  bodyHTML: `
    <h1>If you're in an accident · driver response</h1>
    <p class="meta">For <strong>${escapeHtml(data.driverName || "Sample Driver")}</strong>${data.carrierName ? ` · ${escapeHtml(data.carrierName)}` : ""} · keep with your accident kit</p>

    <div class="callout">
      A reportable DOT accident (§390.5: fatality, injury treated away from scene, or vehicle towed for disabling damage) triggers federal reporting clocks, possible post-accident D&A testing, and CSA point exposure. Your first 60 minutes determine how the rest plays out.
    </div>

    <h2>I · On scene · first 15 minutes</h2>
    <ol>
      <li><strong>Stop and stay</strong> · leaving the scene of an accident is a disqualifying offense · <span class="cfr">§383.51 Table 1</span></li>
      <li><strong>Call 911</strong> if anyone is injured or there's any property damage · let dispatch know you've called</li>
      <li><strong>Set out warning devices</strong> · 3 reflective triangles or LED flares · §392.22 distances (10/100/100 ft for most, 100/100/100 for divided highway)</li>
      <li><strong>Render aid</strong> within your training · don't move injured parties unless they're in immediate further danger</li>
      <li><strong>Call your dispatcher</strong> immediately after 911 · do NOT post anything on social media</li>
    </ol>

    <h2>II · Documentation · first 60 minutes</h2>
    <ul>
      <li><strong>Photos</strong> · vehicle damage from 4 angles, license plates of all vehicles, the scene wide, skid marks, road conditions, weather visible</li>
      <li><strong>Other party info</strong> · name, DL number, phone, insurance carrier + policy #, vehicle plate + VIN</li>
      <li><strong>Witnesses</strong> · names + phone numbers · ask politely · don't argue with them about what happened</li>
      <li><strong>Officer info</strong> · responding officer name, badge #, agency, report case number</li>
      <li><strong>Your own log</strong> · timeline of what you were doing, where you were going, weather, road condition · write it within 60 minutes before memory fades</li>
    </ul>

    <h2>III · What NOT to say</h2>
    <ul>
      <li><strong>Never say "I'm sorry"</strong> at the scene · even if you feel it · it's quoted as an admission of fault</li>
      <li><strong>Never speculate</strong> on speed, distance, or cause to the other driver, witnesses, or the officer · "I'd rather not estimate; the report will show it" is fine</li>
      <li><strong>Never sign anything</strong> handed to you by the other driver or their insurer at the scene</li>
      <li><strong>Don't admit to mechanical issues</strong> with the truck unless they're documented · "the brakes were soft" said on scene becomes the carrier's CSA citation later</li>
      <li><strong>No social media</strong> · photos, posts, comments · nothing · for at least 30 days</li>
    </ul>

    <h2>IV · Post-accident D&A test triggers</h2>
    <p>You'll be sent for a DOT alcohol + drug test if ANY of these are true · <span class="cfr">§382.303</span>:</p>
    <ul>
      <li><strong>Anyone was killed</strong> · regardless of who's at fault</li>
      <li><strong>Anyone was injured + treated away from the scene</strong> AND you received a moving-violation citation</li>
      <li><strong>Any vehicle was towed due to disabling damage</strong> AND you received a moving-violation citation</li>
    </ul>
    <p class="meta">Alcohol within 8 hours, drug within 32 hours. Test even if you have to take a cab to the clinic.</p>

    <div class="callout">
      <strong>Refusing the post-accident test is a Clearinghouse violation</strong> · same penalty as a positive · SAP-cleared return-to-duty required before you drive again.
    </div>
  `,
});

/* ---- 21. accidents-employer-response ---- */

export const accidentsEmployerResponse: TemplateFn<{ carrierName?: string; safetyDirectorName?: string }> = (data) => ({
  version: "1.0",
  title: `Accident Response · Employer Playbook · ${data.carrierName || "Sample Carrier"}`,
  headerSubtitle: "Accidents · employer playbook · 49 CFR §390 + §392",
  bodyHTML: `
    <h1>Accident response · employer playbook</h1>
    <p class="meta">For ${escapeHtml(data.safetyDirectorName ? `${data.safetyDirectorName} · ` : "")}<strong>${escapeHtml(data.carrierName || "Sample Carrier")}</strong> · what the carrier does in the 30 days after a crash</p>

    <div class="callout">
      An accident is a regulatory event, not just an insurance event. The FMCSA Accident Register has to capture it, post-accident testing must be coordinated, and the CSA score will be hit within 30 days. Run the playbook even when it "wasn't your driver's fault."
    </div>

    <h2>I · The first 60 minutes</h2>
    <ol>
      <li><strong>Driver welfare first</strong> · confirm they're physically OK · transport to medical evaluation if any doubt</li>
      <li><strong>Dispatch the post-accident test</strong> if §382.303 triggers are met · alcohol within 8 hr, drug within 32 hr</li>
      <li><strong>Notify insurance</strong> · the policy almost always requires immediate notice; delay can void coverage</li>
      <li><strong>Recover the truck + ELD data</strong> · download last 24 hr of ELD output before the device is unplugged or unit is scrapped</li>
      <li><strong>Open an internal incident file</strong> · driver name, date/time, location, severity, photos, citations issued</li>
    </ol>

    <h2>II · The FMCSA Accident Register · §390.15</h2>
    <table>
      <thead><tr><th style="width:40%">Element</th><th>What goes in</th><th>CFR</th></tr></thead>
      <tbody>
        <tr><td>Date</td><td>Date of the accident</td><td><span class="cfr">§390.15(b)(1)</span></td></tr>
        <tr><td>City + state</td><td>Where it happened</td><td><span class="cfr">§390.15(b)(2)</span></td></tr>
        <tr><td>Driver name</td><td>Driver of record</td><td><span class="cfr">§390.15(b)(3)</span></td></tr>
        <tr><td>Number of injuries</td><td>Treated away from scene</td><td><span class="cfr">§390.15(b)(4)</span></td></tr>
        <tr><td>Number of fatalities</td><td>Within 30 days of crash counts</td><td><span class="cfr">§390.15(b)(5)</span></td></tr>
        <tr><td>Whether hazmat released</td><td>Hazardous materials spilled / vented</td><td><span class="cfr">§390.15(b)(6)</span></td></tr>
        <tr><td>Police report copy</td><td>Attach to register entry</td><td><span class="cfr">§390.15(b)(7)</span></td></tr>
      </tbody>
    </table>
    <p class="meta">Retention: <strong>3 years</strong> from the date of each entry. Investigators will pull this in any safety audit.</p>

    <h2>III · Coordinating the post-accident D&A test</h2>
    <ol>
      <li><strong>Apply the §382.303 decision tree</strong> · fatality / citation-with-injury / citation-with-tow</li>
      <li><strong>Tell the driver to go to your designated collection site</strong> · provide cab fare / ride if needed · don't let them drive themselves to alcohol test if any suspicion of impairment</li>
      <li><strong>If test was missed</strong> (driver hospitalized, etc.) · document the reason in writing · <span class="cfr">§382.303(d)</span> permits this but you must prove it</li>
      <li><strong>Track the result</strong> · MRO contacts driver for positive · employer reports refusal or positive to Clearinghouse within 3 business days</li>
    </ol>

    <h2>IV · CSA exposure + DataQ defense</h2>
    <p>The crash itself enters your Crash Indicator BASIC after the SDR (State Data Report) posts. You can challenge crash <em>recordability</em> via the Crash Preventability Determination Program (CPDP):</p>
    <ul>
      <li><strong>Eligible scenarios</strong> · struck in rear, struck while legally parked, struck while waiting at red light, animal strike, struck by suicide attempt, and ~15 other patterns</li>
      <li><strong>File within 24 months</strong> via dataqs.fmcsa.dot.gov · earlier is much better</li>
      <li><strong>Evidence required</strong> · police report, dash cam, ECM data, witness statements · stronger evidence = higher success rate</li>
      <li><strong>If determined "not preventable"</strong> · the crash is flagged on your SMS profile but doesn't count against your Crash Indicator</li>
    </ul>

    <div class="callout">
      <strong>The crash file you build in the first 60 minutes determines whether you win or lose a CPDP challenge 18 months later.</strong> Standardize the kit: dash cam pull, ELD pull, ECM pull, photos from the responding driver, scene diagram. X3 Compass's accident workflow generates this packet automatically when a crash is logged.
    </div>
  `,
});

/* ---- 22. medical-card-driver-guide · 49 CFR §391.41-§391.49 ---- */

export const medicalCardDriverGuide: TemplateFn<{ carrierName?: string; driverName?: string }> = (data) => ({
  version: "1.0",
  title: `Medical Card · Driver Guide · ${data.driverName || "Sample Driver"}`,
  headerSubtitle: "Medical card · driver reference · 49 CFR §391.41",
  bodyHTML: `
    <h1>DOT medical card · driver guide</h1>
    <p class="meta">For <strong>${escapeHtml(data.driverName || "Sample Driver")}</strong>${data.carrierName ? ` · ${escapeHtml(data.carrierName)}` : ""}</p>

    <div class="callout">
      To operate a CMV in interstate commerce you must hold a current Medical Examiner's Certificate · physically dated by a DOT-certified examiner. Without it, you're out of service at the next inspection. This is the most common single OOS violation for drivers.
    </div>

    <h2>I · The exam basics</h2>
    <ul>
      <li><strong>Who can sign your card</strong> · only a medical professional on the FMCSA National Registry of Certified Medical Examiners (NRCME). Verify them at <em>nationalregistry.fmcsa.dot.gov</em> before you spend money on the exam</li>
      <li><strong>Maximum certificate length</strong> · 24 months · most drivers · <span class="cfr">§391.43(h)</span></li>
      <li><strong>Shorter certificates</strong> · 1 year (controlled hypertension, sleep apnea on CPAP), 3 months (uncontrolled diabetes work-up), single-trip · the examiner decides</li>
      <li><strong>Cost</strong> · typically $80-150 · pay out of pocket unless employer covers</li>
    </ul>

    <h2>II · What the examiner is looking at</h2>
    <table>
      <thead><tr><th style="width:30%">Area</th><th>What they check</th><th>CFR</th></tr></thead>
      <tbody>
        <tr><td>Vision</td><td>20/40 each eye + binocular · 70° peripheral · color vision (red, green, amber)</td><td><span class="cfr">§391.41(b)(10)</span></td></tr>
        <tr><td>Hearing</td><td>Forced whisper at 5 ft or 40 dB audiometric average at 500/1000/2000 Hz</td><td><span class="cfr">§391.41(b)(11)</span></td></tr>
        <tr><td>Blood pressure</td><td>< 140/90 ideal · 140-159/90-99 = 1 yr cert · 160-179/100-109 = 3 mo + recert</td><td>FMCSA guidance</td></tr>
        <tr><td>Diabetes</td><td>Insulin-treated requires separate ITDM exemption · oral meds can be approved if A1c controlled</td><td><span class="cfr">§391.46</span></td></tr>
        <tr><td>Sleep apnea</td><td>BMI screening · CPAP compliance proof if treated · ≥4 hr/night ≥70% of nights</td><td>MRB guidance</td></tr>
        <tr><td>Cardiac history</td><td>Recent MI, bypass, defibrillator implant · wait periods + cardiologist clearance</td><td><span class="cfr">§391.41(b)(4)</span></td></tr>
        <tr><td>Mental health</td><td>Medication-controlled conditions usually OK · severe untreated conditions disqualify</td><td><span class="cfr">§391.41(b)(8-9)</span></td></tr>
        <tr><td>Substance use</td><td>Current alcoholism / drug use is disqualifying · SAP-cleared past use is OK</td><td><span class="cfr">§391.41(b)(12-13)</span></td></tr>
      </tbody>
    </table>

    <h2>III · The exam day · what to bring</h2>
    <ol>
      <li><strong>Driver license</strong> · CDL or regular</li>
      <li><strong>List of all medications</strong> · prescription + OTC · including dosage</li>
      <li><strong>Eyeglasses + contacts</strong> · whichever you wear</li>
      <li><strong>Hearing aids</strong> · if you use them</li>
      <li><strong>Specialist letters</strong> · for any cardiac, diabetes, sleep apnea, mental health condition · the examiner needs the treating doctor's note saying you're stable</li>
      <li><strong>CPAP compliance report</strong> · download from your machine for the past 90 days · without it, sleep apnea drivers may not pass</li>
    </ol>

    <h2>IV · What to do with the card after the exam</h2>
    <ol>
      <li><strong>Take a photo of both sides</strong> · keep on your phone</li>
      <li><strong>Submit to your state CDL agency</strong> · most states accept upload through the DMV portal · this updates your CDL with the new expiration · without this, your CDL goes to "not certified" status and you're OOS</li>
      <li><strong>Give a copy to your safety director</strong> · paper or scan · they need it for your DQ file within 24 hr of the exam</li>
      <li><strong>Carry the original in your wallet or cab</strong> · you can be asked for it at any roadside</li>
      <li><strong>Calendar the next exam</strong> · 60 days before expiration · don't wait until the last week</li>
    </ol>

    <div class="callout">
      <strong>The single most common driver OOS:</strong> medical card expired and not noticed. Set the recert calendar reminder the day you walk out of the exam. X3 Compass tracks this automatically and pings you + your carrier 60, 30, and 7 days out.
    </div>
  `,
});

/* ---- 23. medical-card-employer-tracker ---- */

export const medicalCardEmployerTracker: TemplateFn<{ carrierName?: string; safetyDirectorName?: string }> = (data) => ({
  version: "1.0",
  title: `Medical Card · Employer Tracker Guide · ${data.carrierName || "Sample Carrier"}`,
  headerSubtitle: "Medical card · employer tracker · 49 CFR §391.41-§391.45",
  bodyHTML: `
    <h1>Medical card · employer tracker guide</h1>
    <p class="meta">For ${escapeHtml(data.safetyDirectorName ? `${data.safetyDirectorName} · ` : "")}<strong>${escapeHtml(data.carrierName || "Sample Carrier")}</strong> · operating duties under §391.41-§391.45</p>

    <div class="callout">
      A driver with an expired medical card is an instant federal violation for both the driver and you. Tracking the expiration date is on you · the driver doesn't always remember, doesn't always update the state, and roadside inspectors don't care whose fault it is.
    </div>

    <h2>I · The four employer obligations</h2>
    <ol>
      <li><strong>Verify the examiner</strong> on the National Registry (NRCME) and document the verification date · <span class="cfr">§391.23(m)</span></li>
      <li><strong>Obtain a copy of the medical certificate</strong> · in the driver's DQ file within a reasonable time after the exam · <span class="cfr">§391.43(g)</span></li>
      <li><strong>Track expiration</strong> and remove the driver from CMV operation the day it expires · <span class="cfr">§391.45</span></li>
      <li><strong>Confirm state CDLIS upload</strong> · the certificate must be on file with the state CDL agency · if it's not, the CDL status goes to "not certified" and the driver is OOS regardless of the paper card</li>
    </ol>

    <h2>II · The tracking cadence X3 Compass uses</h2>
    <table>
      <thead><tr><th style="width:25%">Days before expiration</th><th>What X3 Compass does</th><th>Who gets notified</th></tr></thead>
      <tbody>
        <tr><td><strong>60 days</strong></td><td>First reminder · book the exam</td><td>Driver + safety director</td></tr>
        <tr><td><strong>30 days</strong></td><td>Escalation reminder · exam must be on calendar</td><td>Driver + safety director + dispatcher</td></tr>
        <tr><td><strong>7 days</strong></td><td>Urgent reminder · OOS imminent</td><td>Driver + safety director + dispatcher · daily until resolved</td></tr>
        <tr><td><strong>Day of expiration</strong></td><td>Driver placed on hold in tracker · audit-log entry</td><td>Safety director · escalate to operations</td></tr>
        <tr><td><strong>After exam</strong></td><td>Card uploaded · CDLIS verification check · examiner re-verified on NRCME</td><td>Driver + safety director · cleared to drive</td></tr>
      </tbody>
    </table>

    <h2>III · Short-cert drivers · why they need closer attention</h2>
    <ul>
      <li><strong>1-year card</strong> · controlled hypertension, diabetes on oral meds, sleep apnea on CPAP · monitor compliance proof annually</li>
      <li><strong>3-month card</strong> · uncontrolled hypertension under treatment, recent cardiac event, diabetes work-up · driver is on probationary medical clearance · ride along with operations + insurance to make sure ongoing exposure is acceptable</li>
      <li><strong>Insulin-treated diabetes</strong> · separate ITDM exemption required · <span class="cfr">§391.46</span> · annual reverification of A1c + treating-provider letter</li>
      <li><strong>Vision / hearing exemption</strong> · separate FMCSA exemption letter required · keep with the DQ file</li>
    </ul>

    <h2>IV · The most common DOT audit findings</h2>
    <ol>
      <li><strong>Card expired · driver still on the road</strong> · OOS for driver + violation for carrier</li>
      <li><strong>No NRCME verification</strong> · the examiner is on the registry but you didn't document checking · §391.23(m) violation</li>
      <li><strong>State CDLIS shows "not certified"</strong> · driver had a current paper card but never submitted it to the state · OOS for driver regardless</li>
      <li><strong>Short-cert driver not on recert calendar</strong> · 1-year card became 18-month gap before the next exam</li>
      <li><strong>Insulin-treated driver without ITDM exemption</strong> on file · disqualifying</li>
    </ol>

    <div class="callout">
      <strong>The fix is automation, not vigilance.</strong> No safety director can mentally track 50 drivers' medical card expirations. X3 Compass's medical-card tracker is one of the highest-leverage features for any fleet · it eliminates the single most common OOS violation.
    </div>
  `,
});

/* ---- 24. csa-scorecard-explainer · CSA SMS / BASICs ---- */

export const csaScorecardExplainer: TemplateFn<{ carrierName?: string }> = (data) => ({
  version: "1.0",
  title: `CSA Scorecard · How It Works · ${data.carrierName || "Sample Carrier"}`,
  headerSubtitle: "CSA · scorecard explainer · FMCSA SMS",
  bodyHTML: `
    <h1>CSA Scorecard · how it actually works</h1>
    <p class="meta">For <strong>${escapeHtml(data.carrierName || "Sample Carrier")}</strong> · plain-English explainer of the FMCSA Safety Measurement System</p>

    <div class="callout">
      Your CSA score is the single most important number in trucking sales. Insurance pricing, shipper qualification, broker tendering, and FMCSA enforcement targeting all start with it. Understand how it's calculated and the levers move themselves.
    </div>

    <h2>I · The 7 BASICs (categories the FMCSA scores you on)</h2>
    <table>
      <thead><tr><th style="width:30%">BASIC</th><th>What's measured</th><th>Intervention threshold</th></tr></thead>
      <tbody>
        <tr><td><strong>Unsafe Driving</strong></td><td>Speeding, reckless, improper lane change, hand-held mobile, texting · roadside violations</td><td>65th percentile (passenger), 60th (HM)</td></tr>
        <tr><td><strong>Hours of Service</strong></td><td>Drive past 11 hr / 14 hr window, missing break, log violations</td><td>65th percentile</td></tr>
        <tr><td><strong>Driver Fitness</strong></td><td>License + medical card violations, missing CDL endorsements</td><td>80th percentile</td></tr>
        <tr><td><strong>Controlled Substances / Alcohol</strong></td><td>Possession + use violations at roadside (not Clearinghouse hits)</td><td>80th percentile</td></tr>
        <tr><td><strong>Vehicle Maintenance</strong></td><td>Brake adjustment, tires, lights, defective parts · highest violation count by frequency</td><td>80th percentile</td></tr>
        <tr><td><strong>Hazmat Compliance</strong></td><td>Shipping papers, placards, packaging, training</td><td>80th percentile (HM carriers only)</td></tr>
        <tr><td><strong>Crash Indicator</strong></td><td>State-Data-Reported crashes · weighted by severity · 65th percentile threshold</td><td>Internal-only for now</td></tr>
      </tbody>
    </table>

    <h2>II · How violations turn into points</h2>
    <ol>
      <li><strong>Violation severity weight</strong> · FMCSA assigns each violation a 1-10 weight · texting in CMV = 10, headlight out = 1</li>
      <li><strong>Time weight</strong> · violations from the past 6 months count fully · 6-12 months ago count 2× · 12-24 months ago count 1×</li>
      <li><strong>OOS multiplier</strong> · OOS violations get +2 added to severity</li>
      <li><strong>Sum weighted violations</strong> · per BASIC · per carrier</li>
      <li><strong>Normalize</strong> · weighted violations ÷ inspections (or VMT for Unsafe Driving) · adjusts for fleet size</li>
      <li><strong>Percentile rank</strong> · against carriers in your safety event group · this is what gets published</li>
    </ol>

    <h2>III · The thresholds that matter</h2>
    <ul>
      <li><strong>Below threshold</strong> · BASIC shows on your profile but no alert · normal operating zone</li>
      <li><strong>At or above threshold</strong> · BASIC is alerted · FMCSA flags you for possible intervention · insurance rates go up · brokers + shippers see the alert</li>
      <li><strong>Investigation</strong> · two or more alerted BASICs typically triggers a compliance review · CR can end with conditional / unsatisfactory rating</li>
      <li><strong>Unsatisfactory</strong> · you cannot operate interstate · 45 days to fix or shut down</li>
    </ul>

    <h2>IV · The three highest-leverage moves</h2>
    <ol>
      <li><strong>Pre-trip inspections done right</strong> · most Vehicle Maintenance violations come from things the driver could've seen and reported · DVIR culture is everything</li>
      <li><strong>HOS hygiene via ELD coaching</strong> · the violations that bite are the ones you didn't know about until the roadside printout · proactive HOS audit queries pull them out monthly</li>
      <li><strong>DataQ challenges on every bad citation</strong> · 30% of contested violations get removed · if you don't file, the score eats them forever</li>
    </ol>

    <div class="callout">
      <strong>The score is a lagging indicator.</strong> What lives in your DVIRs, HOS audit logs, and DataQ workflow today shows up in your CSA score 30-90 days from now. Coach the leading indicators, not the score.
    </div>
  `,
});

/* ---- 25. dvir-driver-quickguide · 49 CFR §396.11 + §396.13 ---- */

export const dvirDriverQuickGuide: TemplateFn<{ carrierName?: string; driverName?: string }> = (data) => ({
  version: "1.0",
  title: `DVIR · Driver Quick Guide · ${data.driverName || "Sample Driver"}`,
  headerSubtitle: "DVIR · driver reference · 49 CFR §396.11",
  bodyHTML: `
    <h1>Driver Vehicle Inspection Report · quick guide</h1>
    <p class="meta">For <strong>${escapeHtml(data.driverName || "Sample Driver")}</strong>${data.carrierName ? ` · ${escapeHtml(data.carrierName)}` : ""} · keep in the cab</p>

    <div class="callout">
      The pre-trip + post-trip inspection isn't paperwork · it's the single biggest CSA Vehicle Maintenance lever you control. The same defects that earn 10× severity points at a roadside inspection are the ones a 5-minute walk-around would have caught.
    </div>

    <h2>I · Pre-trip · what you actually look at</h2>
    <ol>
      <li><strong>Walk-around · driver side</strong> · tires + tread + inflation, lug nuts, mud flaps, lights (clearance, marker, turn, brake), reflectors, fuel cap, leaks</li>
      <li><strong>Front</strong> · headlights (low + high), turn signals, wipers, hood latch, condition of bumper</li>
      <li><strong>Passenger side</strong> · same as driver side · check cargo securement if applicable</li>
      <li><strong>Rear</strong> · brake lights (have a buddy or use a wall + reverse light reflection), turn signals, license plate light, mud flaps, ICC bumper</li>
      <li><strong>Trailer</strong> · kingpin, fifth wheel coupling locked, glad-hand seals, brake hoses, ABS connector, trailer lights, doors locked + seal intact</li>
      <li><strong>Under the hood</strong> · oil + coolant + power-steering + windshield washer levels, belts (no fraying), battery secure</li>
      <li><strong>Inside cab</strong> · gauge readings normal at start, parking brake holds, service brake firm, steering free-play < 10° of slack, mirrors clean + adjusted, seat belt + horn + wipers work</li>
      <li><strong>Brake test</strong> · low-air warning at 60 psi, emergency activates at 20-45 psi (tractor), service brake doesn't bleed off (1 psi/min static)</li>
    </ol>

    <h2>II · Post-trip · what changes</h2>
    <p>End-of-day inspection focuses on defects you found or developed during the trip:</p>
    <ul>
      <li><strong>Service brakes</strong> · pulling, soft pedal, grinding, fade</li>
      <li><strong>Parking brake</strong> · holds the truck</li>
      <li><strong>Steering</strong> · play, hard turning</li>
      <li><strong>Lighting + reflectors</strong> · anything burned out</li>
      <li><strong>Tires</strong> · any cuts, separations, low pressure that developed</li>
      <li><strong>Horn · wipers · mirrors</strong> · still work</li>
      <li><strong>Coupling devices</strong> · fifth wheel still secure</li>
      <li><strong>Wheels + rims</strong> · cracks, loose lugs</li>
      <li><strong>Emergency equipment</strong> · triangles, fire extinguisher in working order</li>
    </ul>

    <h2>III · When you find a defect</h2>
    <ol>
      <li><strong>Don't drive it</strong> if the defect would cause a breakdown or accident · §396.11(c) says you must report any defect that affects safe operation</li>
      <li><strong>Report it on the DVIR</strong> · paper or electronic · specific (not "rear lights bad" but "right rear turn signal inoperative")</li>
      <li><strong>Tag the unit OOS</strong> for any OOS-level defect (brake adjustment >X, tire tread <2/32 steer or <4/32 drive, etc.)</li>
      <li><strong>Get the carrier's mechanic to certify the repair</strong> on the same DVIR · driver review-signs after</li>
      <li><strong>Keep a copy</strong> · driver retains one, carrier retains the original</li>
    </ol>

    <h2>IV · What good DVIR culture looks like</h2>
    <ul>
      <li><strong>Pre-trip takes 15-30 minutes</strong> · not 5 · if you can't see the inside of every tire, you're not really looking</li>
      <li><strong>You write defects daily</strong> · "no defects" every single trip is a red flag for carrier safety + insurance</li>
      <li><strong>You learn the truck</strong> · the same trailer, the same tractor, day after day · you notice when something changed</li>
      <li><strong>You trust the safety director</strong> not to retaliate · DVIR-flagging culture only works if findings get fixed, not punished</li>
    </ul>

    <div class="callout">
      <strong>The defects you don't report end up on a CSA inspection 30 days later.</strong> Brakes out of adjustment is the #1 cited violation in trucking by frequency · and it's 100% preventable by a real pre-trip.
    </div>
  `,
});

/* ---- 26. dvir-employer-playbook · §396.11 + §396.13 + §396.17 ---- */

export const dvirEmployerPlaybook: TemplateFn<{ carrierName?: string; safetyDirectorName?: string }> = (data) => ({
  version: "1.0",
  title: `DVIR · Employer Playbook · ${data.carrierName || "Sample Carrier"}`,
  headerSubtitle: "DVIR · employer playbook · 49 CFR §396",
  bodyHTML: `
    <h1>DVIR · employer playbook</h1>
    <p class="meta">For ${escapeHtml(data.safetyDirectorName ? `${data.safetyDirectorName} · ` : "")}<strong>${escapeHtml(data.carrierName || "Sample Carrier")}</strong> · operating duties under §396</p>

    <div class="callout">
      The carrier owns the maintenance program. The DVIR is the line of evidence connecting a driver's report to a mechanic's certified repair · without that closed loop you can't defend your Vehicle Maintenance BASIC. This is also the most-cited area in any DOT audit.
    </div>

    <h2>I · The four required maintenance pillars · §396.3 + §396.11 + §396.17</h2>
    <table>
      <thead><tr><th style="width:30%">Pillar</th><th>What it is</th><th>CFR</th></tr></thead>
      <tbody>
        <tr><td>Daily DVIR (driver side)</td><td>Every driver, every day, every CMV they operated · pre-trip + post-trip · written report for any defect</td><td><span class="cfr">§396.11</span></td></tr>
        <tr><td>Repair certification</td><td>Mechanic-certified statement on the DVIR that defects were repaired (or that no repair was needed)</td><td><span class="cfr">§396.11(c)(3)</span></td></tr>
        <tr><td>Periodic (annual) inspection</td><td>Every CMV gets a §396.17 inspection at least every 12 months by a qualified inspector · documentation on the unit + at the carrier</td><td><span class="cfr">§396.17, §396.21</span></td></tr>
        <tr><td>Roadside / post-event records</td><td>Every roadside inspection, every CSA event, every accident-related maintenance fact</td><td><span class="cfr">§396.9</span></td></tr>
      </tbody>
    </table>

    <h2>II · The DVIR closed-loop workflow</h2>
    <ol>
      <li><strong>Driver submits DVIR</strong> · pre-trip + post-trip · any defect logged</li>
      <li><strong>Safety / dispatch sees the report</strong> · any defect tagged as OOS holds the unit until repaired</li>
      <li><strong>Mechanic repairs the defect</strong> · documents the parts + labor</li>
      <li><strong>Mechanic certifies the DVIR</strong> · signature confirming repair was made (or that no repair was needed)</li>
      <li><strong>Next driver review-signs</strong> · before operating the unit, the next driver acknowledges the repair was made and the unit is safe</li>
      <li><strong>DVIR retained 3 months</strong> · for paper · electronic systems typically retain longer for analytics</li>
    </ol>

    <h2>III · The annual §396.17 inspection · what investigators look for</h2>
    <ul>
      <li><strong>Date</strong> within the past 12 months</li>
      <li><strong>Inspector signature + qualification documentation</strong> · they must meet §396.19 qualifications</li>
      <li><strong>Identification of the vehicle</strong> · VIN, fleet number</li>
      <li><strong>Items inspected</strong> · the §396 Appendix G list (51 items across brakes, fuel system, lighting, etc.)</li>
      <li><strong>Result for each item</strong> · pass / fail / repair</li>
      <li><strong>Periodic-inspection sticker on the vehicle</strong> · driver can show it at roadside</li>
    </ul>

    <h2>IV · What gets cited in audits</h2>
    <ol>
      <li><strong>DVIRs missing for some days</strong> · gap days where the unit drove without a daily inspection report on file</li>
      <li><strong>"No defects" every single day</strong> · investigator pattern-recognizes this as not really inspecting · they'll cross-reference against the roadside inspections that found defects on those same days</li>
      <li><strong>Mechanic certification missing</strong> · driver reported a defect, no mechanic sign-off, but the unit kept driving</li>
      <li><strong>No annual periodic inspection on file</strong> · or expired by more than 12 months</li>
      <li><strong>Inspector not qualified</strong> · §396.19 requires specific training + experience · a "shop guy" doesn't necessarily count</li>
      <li><strong>OOS defect found at roadside</strong> that was either on a prior DVIR (proves you ignored it) or that obviously existed for weeks (proves DVIRs are fictional)</li>
    </ol>

    <div class="callout">
      <strong>The audit-proof DVIR program isn't about volume · it's about closure.</strong> Every defect logged, every defect either repaired or documented as not requiring repair, every driver review-signing the next morning. X3 Compass's DVIR module forces the closed loop and surfaces gaps before the auditor does.
    </div>
  `,
});

/* ---- 27. driver-onboarding-packet-index · §391 full hire workflow ---- */

export const driverOnboardingPacketIndex: TemplateFn<{ carrierName?: string; driverName?: string }> = (data) => ({
  version: "1.0",
  title: `Driver Onboarding Packet · ${data.driverName || "Sample Driver"}`,
  headerSubtitle: "Onboarding · packet index · 49 CFR §391",
  bodyHTML: `
    <h1>New driver onboarding · packet index</h1>
    <p class="meta">For <strong>${escapeHtml(data.driverName || "Sample Driver")}</strong>${data.carrierName ? ` · ${escapeHtml(data.carrierName)}` : ""}</p>

    <div class="callout">
      Every new CDL driver hire generates ~20 documents across §391 (Driver Qualification), §382 (D&A), FCRA (consumer reports), §172.704 (Hazmat if applicable), and company policy. This packet index lists what must exist before the driver's first safety-sensitive trip.
    </div>

    <h2>I · Day 1 · pre-screening (driver hasn't been hired yet)</h2>
    <ol>
      <li><strong>Driver's application</strong> · long-form per §391.21 · 3 years of address + 10 years of employment history</li>
      <li><strong>FCRA disclosure + authorization</strong> · standalone form · 15 U.S.C. §1681b(b)(2)(A)</li>
      <li><strong>D&A consent</strong> · for pre-employment drug test + previous-employer D&A inquiries</li>
      <li><strong>Clearinghouse full-query consent</strong> · electronic consent in clearinghouse.fmcsa.dot.gov</li>
      <li><strong>State MVR consent</strong> · for every state the driver has been licensed in (past 3 years)</li>
    </ol>

    <h2>II · Day 1-3 · verification (running in parallel)</h2>
    <ol>
      <li><strong>Initial MVRs</strong> · pulled from every relevant state · §391.23(a)(1)</li>
      <li><strong>Clearinghouse pre-employment full query</strong> · run with driver's electronic consent · §382.701(a)</li>
      <li><strong>Pre-employment DOT drug test</strong> · drug only, no alcohol · negative result required before safety-sensitive duty</li>
      <li><strong>Previous-employer DOT employment + D&A inquiries</strong> · for every DOT-regulated employer in the past 3 years · §391.23(d) + §40.25</li>
      <li><strong>Background check</strong> · if your hiring standard includes it · ordered through Checkr or similar with FCRA-compliant disclosure</li>
      <li><strong>Medical certificate verification</strong> · examiner verified on NRCME · certificate copy in file · CDLIS shows current</li>
    </ol>

    <h2>III · Day 3-7 · once cleared (driver is now hireable)</h2>
    <ol>
      <li><strong>Road test or CDL-on-file equivalent</strong> · §391.31 / §391.33 · usually a road test for first hire</li>
      <li><strong>Entry-level driver training (ELDT) certificate</strong> · for CDL holders licensed after 02/07/2022 · §380.609 · from the FMCSA Training Provider Registry</li>
      <li><strong>D&A policy receipt</strong> · driver acknowledges receipt of the written policy · §382.601</li>
      <li><strong>Hazmat training documentation</strong> · only if the role requires HM endorsement work · §172.704 · within 90 days of employment</li>
      <li><strong>Annual general written consent for limited Clearinghouse queries</strong> · §382.701(b)</li>
      <li><strong>I-9 + W-4</strong> · standard employment forms (not DOT, but day-1 standard)</li>
      <li><strong>Direct deposit + benefits enrollment</strong> · company-specific</li>
    </ol>

    <h2>IV · Within 30 days · audit-ready DQ file complete</h2>
    <p>By day 30, the driver's file should contain all 12 §391.51 documents (see the DQF Driver Index). The most-missed items at this stage:</p>
    <ul>
      <li><strong>NRCME verification date recorded</strong> · not just the medical card</li>
      <li><strong>Previous-employer responses received</strong> · not just "we tried" attempt logs · the actual responses or non-response documentation</li>
      <li><strong>Hazmat function-specific training</strong> · within 90 days · don't drift past it</li>
      <li><strong>ELDT certificate</strong> · for any post-Feb-2022 CDL · easy to forget for in-house transfers</li>
      <li><strong>Annual driver review</strong> calendared 12 months from hire</li>
    </ul>

    <div class="callout">
      <strong>X3 Compass's onboarding workflow generates this packet</strong> from the moment a driver enters the system · every required document has a status pill (Open / In progress / Complete) and the safety director can't mark the hire complete until every document is green.
    </div>
  `,
});

/* ============================================================
   BATCH 6 · New Entrant · Forms · DataQ · Securement · ELD Policy
   ============================================================ */

/* ---- 28. new-entrant-audit-prep · 49 CFR §385 Subpart D ---- */

export const newEntrantAuditPrep: TemplateFn<{ carrierName?: string; usdotNumber?: string }> = (data) => ({
  version: "1.0",
  title: `New Entrant Audit Prep · ${data.carrierName || "Sample Carrier"}`,
  headerSubtitle: "New Entrant · audit prep · 49 CFR §385 Subpart D",
  bodyHTML: `
    <h1>New Entrant Safety Audit · prep guide</h1>
    <p class="meta">For <strong>${escapeHtml(data.carrierName || "Sample Carrier")}</strong>${data.usdotNumber ? ` · USDOT ${escapeHtml(data.usdotNumber)}` : ""}</p>

    <div class="callout">
      Within 12 months of getting a USDOT number, every new motor carrier gets a safety audit. Fail it and you're shut down. The audit is a checklist, not a mystery · this guide is exactly what FMCSA looks at.
    </div>

    <h2>I · The 16 automatic-failure findings · §385 Appendix A</h2>
    <ul>
      <li><strong>Using a driver</strong> not holding a valid CDL when required · §383.23</li>
      <li><strong>Using a driver</strong> with a suspended / revoked / cancelled CDL · §383.51</li>
      <li><strong>Using a driver disqualified</strong> under §391.15</li>
      <li><strong>Operating a CMV</strong> without proper liability insurance · §387</li>
      <li><strong>Operating a CMV</strong> without periodic inspection · §396.17</li>
      <li><strong>Operating a CMV</strong> placed out of service before correction · §396.9</li>
      <li><strong>Using a driver</strong> without a current medical card · §391.45</li>
      <li><strong>Failure to require</strong> a pre-employment drug test · §382.301</li>
      <li><strong>Failure to implement</strong> a random drug + alcohol testing program · §382.305</li>
      <li><strong>Failure to test</strong> after an accident meeting §382.303 criteria</li>
      <li><strong>Using a driver</strong> the carrier knows has tested positive or refused · §382.501</li>
      <li><strong>Failure to maintain</strong> driver qualification files · §391.51</li>
      <li><strong>Failure to maintain</strong> accident register · §390.15</li>
      <li><strong>Knowingly using a driver</strong> over hours · §395.3</li>
      <li><strong>Knowingly false statements</strong> on RODS · §395.8</li>
      <li><strong>Operating</strong> in violation of an OOS order · §396.9</li>
    </ul>

    <h2>II · What the auditor will ask you to produce</h2>
    <table>
      <thead><tr><th style="width:40%">Document</th><th>Who has it</th><th>CFR</th></tr></thead>
      <tbody>
        <tr><td>Operating authority + USDOT number</td><td>FMCSA portal</td><td><span class="cfr">§387</span></td></tr>
        <tr><td>Insurance filings (BMC-91 / 34 / etc.)</td><td>Insurance broker</td><td><span class="cfr">§387.7</span></td></tr>
        <tr><td>DQ file for every driver</td><td>You · 12 documents each</td><td><span class="cfr">§391.51</span></td></tr>
        <tr><td>D&A testing program records (random pool, results, training)</td><td>You + C-TPA</td><td><span class="cfr">§382.401</span></td></tr>
        <tr><td>Clearinghouse pre-employment + annual queries</td><td>You · printed query confirmations</td><td><span class="cfr">§382.701</span></td></tr>
        <tr><td>Accident Register (3 years)</td><td>You</td><td><span class="cfr">§390.15</span></td></tr>
        <tr><td>HOS records (RODS / ELD output 6 months back)</td><td>You · ELD vendor + paper</td><td><span class="cfr">§395.8</span></td></tr>
        <tr><td>Vehicle list + maintenance + §396.17 annual inspections</td><td>You</td><td><span class="cfr">§396.3, §396.17</span></td></tr>
        <tr><td>DVIRs (3 months)</td><td>You · paper or electronic</td><td><span class="cfr">§396.11</span></td></tr>
        <tr><td>Hazmat training + security plan if applicable</td><td>You</td><td><span class="cfr">§172.704, §172.800</span></td></tr>
        <tr><td>Written safety + D&A policies</td><td>You · driver receipts on file</td><td><span class="cfr">§382.601</span></td></tr>
      </tbody>
    </table>

    <h2>III · The audit timeline</h2>
    <ol>
      <li><strong>FMCSA notifies you</strong> 30+ days out · in-person or virtual, your choice</li>
      <li><strong>You confirm</strong> the date and provide initial documents (insurance, vehicle list, driver list) within their requested window</li>
      <li><strong>The audit happens</strong> · 1-2 days · auditor pulls documents, interviews you, may interview drivers</li>
      <li><strong>You get a result letter</strong> within 90 days · Pass · Pass with corrective action · or Fail</li>
      <li><strong>If failed</strong> · 60 days to correct · re-audit · second fail = revoked operating authority</li>
    </ol>

    <h2>IV · The 5 highest-leverage prep moves</h2>
    <ol>
      <li><strong>Generate an audit-export bundle</strong> the week before · X3 Compass packages every DQ file, every Accident Register entry, 6 months of HOS, every DVIR into one organized PDF set</li>
      <li><strong>Pre-audit your own random testing pool</strong> · confirm the 50% / 10% rates have been met for the past 12 months · if not, ramp now and document the catch-up plan</li>
      <li><strong>Verify every driver's NRCME entry</strong> · most-cited finding · the examiner registry check date is the thing carriers forget</li>
      <li><strong>Re-run pre-employment Clearinghouse queries</strong> · confirm you have a printed result for every driver · not just an "I think we did it"</li>
      <li><strong>Stage a mock interview</strong> · sit a driver down and ask them the 5 questions the auditor will ask · gaps in their understanding are gaps in your policy</li>
    </ol>

    <div class="callout">
      <strong>You don't need to be perfect to pass.</strong> You need to demonstrate a functioning safety program with documented evidence. The 16 acute-violation findings above are the ones that auto-fail. Everything else is correctable.
    </div>
  `,
});

/* ---- 29. annual-driver-review-form · §391.25 ---- */

export const annualDriverReviewForm: TemplateFn<{ carrierName?: string; driverName?: string; reviewDate?: string }> = (data) => ({
  version: "1.0",
  title: `Annual Driver Review · ${data.driverName || "Sample Driver"}`,
  headerSubtitle: "Annual driver review · 49 CFR §391.25",
  bodyHTML: `
    <h1>Annual driver review</h1>
    <p class="meta">${escapeHtml(data.carrierName || "Sample Carrier")} · for <strong>${escapeHtml(data.driverName || "Sample Driver")}</strong> · review date <strong>${escapeHtml(data.reviewDate || "____________")}</strong></p>

    <div class="callout">
      §391.25 requires the carrier to evaluate each driver's driving record at least once every 12 months. The review must consider any evidence the driver has violated FMCSRs, driven negligently, or been disqualified under §391.15. This form documents that review.
    </div>

    <h2>I · Documents reviewed</h2>
    <table>
      <thead><tr><th style="width:65%">Document</th><th>Reviewed</th></tr></thead>
      <tbody>
        <tr><td>Annual MVR (from every state where licensed in the past 12 months)</td><td>☐</td></tr>
        <tr><td>Driver's annual list of violations (§391.27 self-certification)</td><td>☐</td></tr>
        <tr><td>Roadside inspection reports from the past 12 months</td><td>☐</td></tr>
        <tr><td>D&A test results (positives, refusals, return-to-duty status)</td><td>☐</td></tr>
        <tr><td>Clearinghouse annual limited query result</td><td>☐</td></tr>
        <tr><td>Accident reports involving this driver in the past 12 months</td><td>☐</td></tr>
        <tr><td>Customer complaints / safety reports about this driver</td><td>☐</td></tr>
      </tbody>
    </table>

    <h2>II · Findings</h2>
    <p>List each violation, accident, complaint, or other concern · "None" if applicable:</p>
    <table>
      <thead><tr><th style="width:18%">Date</th><th style="width:50%">Description</th><th>Action taken</th></tr></thead>
      <tbody>
        <tr><td>____________</td><td>____________________________________________</td><td>__________________</td></tr>
        <tr><td>____________</td><td>____________________________________________</td><td>__________________</td></tr>
        <tr><td>____________</td><td>____________________________________________</td><td>__________________</td></tr>
        <tr><td>____________</td><td>____________________________________________</td><td>__________________</td></tr>
      </tbody>
    </table>

    <h2>III · Assessment</h2>
    <p>Based on the review of the documents listed above, the supervisor's evaluation of this driver's continued qualification under 49 CFR §391:</p>
    <ul>
      <li>☐ <strong>Qualified · no corrective action needed</strong></li>
      <li>☐ <strong>Qualified · with corrective action</strong> (counseling, retraining, written warning)</li>
      <li>☐ <strong>Disqualified under §391.15</strong> · driver removed from CMV operation</li>
      <li>☐ <strong>Probationary status</strong> · 90-day re-review required</li>
    </ul>

    <h2>IV · Corrective action / next steps</h2>
    <p style="border-bottom: 1px solid #94A3B8; min-height: 0.6in;">&nbsp;</p>
    <p style="border-bottom: 1px solid #94A3B8; min-height: 0.6in;">&nbsp;</p>
    <p style="border-bottom: 1px solid #94A3B8; min-height: 0.6in;">&nbsp;</p>

    <table style="margin-top: 0.3in;">
      <tbody>
        <tr><td style="width:60%; padding: 16px 8px;"><div class="signature-line"></div><div class="signature-label">Supervisor signature</div></td><td style="width:40%; padding: 16px 8px;"><div class="signature-line"></div><div class="signature-label">Date</div></td></tr>
        <tr><td style="padding: 16px 8px;"><div class="signature-line"></div><div class="signature-label">Supervisor printed name + title</div></td><td style="padding: 16px 8px;"><div class="signature-line"></div><div class="signature-label">Next review due</div></td></tr>
      </tbody>
    </table>

    <p class="meta" style="margin-top: 0.2in;">This form satisfies the documentation requirement of 49 CFR §391.25(c)(2). File in the driver's DQ file. Retain for the duration of employment plus 3 years.</p>
  `,
});

/* ---- 30. previous-employer-inquiry · §391.23(d) + §40.25 ---- */

export const previousEmployerInquiry: TemplateFn<{ carrierName?: string; driverName?: string; priorEmployerName?: string }> = (data) => ({
  version: "1.0",
  title: `Previous Employer Inquiry · ${data.driverName || "Sample Driver"}`,
  headerSubtitle: "Previous employer inquiry · §391.23(d) + §40.25",
  bodyHTML: `
    <h1>Previous employer safety performance + D&A inquiry</h1>
    <p class="meta">${escapeHtml(data.carrierName || "Sample Carrier")} · for <strong>${escapeHtml(data.driverName || "Sample Driver")}</strong></p>

    <div class="callout">
      §391.23(d) requires us to investigate a driver's safety performance history with each DOT-regulated employer from the past 3 years. §40.25 requires the same for DOT D&A testing history. This form combines both inquiries.
    </div>

    <h2>I · To the previous employer</h2>
    <p>Dear ${escapeHtml(data.priorEmployerName || "Prior Employer")},</p>
    <p>The above-named driver has applied for employment with <strong>${escapeHtml(data.carrierName || "our company")}</strong>. The driver has signed a written authorization (attached) consenting to the release of their safety performance and DOT drug + alcohol testing history. We are requesting this information pursuant to 49 CFR §391.23(d) and §40.25.</p>
    <p>You are required by federal law to respond to this inquiry within 30 days. Please complete Sections II and III below and return to the address on file. Indicate "N/A" or "None" where applicable.</p>

    <h2>II · DOT safety performance history (§391.23(d))</h2>
    <table>
      <thead><tr><th style="width:65%">Question</th><th>Response</th></tr></thead>
      <tbody>
        <tr><td>Was the driver employed by your company in a DOT safety-sensitive function?</td><td>☐ Yes ☐ No</td></tr>
        <tr><td>Dates of employment (from / to)</td><td>____________</td></tr>
        <tr><td>Reason for leaving (voluntary / discharge / layoff / other)</td><td>____________</td></tr>
        <tr><td>Did the driver have any accidents recorded in our §390.15 Accident Register?</td><td>☐ Yes ☐ No</td></tr>
        <tr><td>If yes, please list date, location, severity</td><td>____________</td></tr>
        <tr><td>Did the driver have any FMCSA-recordable accidents in the 3 years prior to leaving?</td><td>☐ Yes ☐ No</td></tr>
      </tbody>
    </table>

    <h2>III · DOT drug + alcohol testing history (§40.25)</h2>
    <table>
      <thead><tr><th style="width:65%">Question</th><th>Response</th></tr></thead>
      <tbody>
        <tr><td>Was the driver subject to your DOT drug + alcohol testing program?</td><td>☐ Yes ☐ No</td></tr>
        <tr><td>Did the driver have a verified positive DOT drug test in the past 3 years?</td><td>☐ Yes ☐ No</td></tr>
        <tr><td>Did the driver have an alcohol confirmation test ≥ 0.04 BAC in the past 3 years?</td><td>☐ Yes ☐ No</td></tr>
        <tr><td>Did the driver refuse to be tested in the past 3 years?</td><td>☐ Yes ☐ No</td></tr>
        <tr><td>Did the driver have an "actual knowledge" violation (per §382.107) in the past 3 years?</td><td>☐ Yes ☐ No</td></tr>
        <tr><td>If any of the above is "Yes", did the driver complete the return-to-duty process with a qualified SAP?</td><td>☐ Yes ☐ No</td></tr>
        <tr><td>If RTD was completed · was the driver compliant with the follow-up testing plan as of separation?</td><td>☐ Yes ☐ No</td></tr>
      </tbody>
    </table>

    <h2>IV · Certification</h2>
    <p>I certify that the information provided above is, to the best of my knowledge, accurate and complete. I am authorized to release this information on behalf of the named employer.</p>

    <table style="margin-top: 0.2in;">
      <tbody>
        <tr><td style="width:55%; padding: 12px 8px;"><div class="signature-line"></div><div class="signature-label">Authorized signature</div></td><td style="width:45%; padding: 12px 8px;"><div class="signature-line"></div><div class="signature-label">Date</div></td></tr>
        <tr><td style="padding: 12px 8px;"><div class="signature-line"></div><div class="signature-label">Printed name + title</div></td><td style="padding: 12px 8px;"><div class="signature-line"></div><div class="signature-label">Phone</div></td></tr>
      </tbody>
    </table>

    <p class="meta" style="margin-top: 0.15in;">Federal law (§40.25 + §391.23) requires response within 30 days of receipt. Failure to respond is itself a federal violation for the prior employer.</p>
  `,
});

/* ---- 31. da-policy-receipt · §382.601 ---- */

export const daPolicyReceipt: TemplateFn<{ carrierName?: string; driverName?: string; policyVersion?: string }> = (data) => ({
  version: "1.0",
  title: `D&A Policy Receipt · ${data.driverName || "Sample Driver"}`,
  headerSubtitle: "D&A policy receipt · 49 CFR §382.601",
  bodyHTML: `
    <h1>Drug & alcohol policy · receipt acknowledgment</h1>
    <p class="meta">${escapeHtml(data.carrierName || "Sample Carrier")} · for <strong>${escapeHtml(data.driverName || "Sample Driver")}</strong> · policy version ${escapeHtml(data.policyVersion || "1.0")}</p>

    <div class="callout">
      §382.601 requires every CDL driver to receive a written copy of the carrier's drug + alcohol policy and acknowledge receipt. This signed acknowledgment is one of the required §391.51 DQ-file documents.
    </div>

    <h2>I · What the policy covered</h2>
    <p>I confirm I received and read the ${escapeHtml(data.carrierName || "carrier's")} written Drug & Alcohol Policy, which included:</p>
    <ul>
      <li>The identity of the person designated to answer driver questions about the program</li>
      <li>The categories of drivers subject to the policy</li>
      <li>Sufficient information about the safety-sensitive functions performed by drivers</li>
      <li>Specific information about conduct that is prohibited (§382.201 through §382.215)</li>
      <li>The circumstances under which a driver will be tested</li>
      <li>The procedures used to test for drugs (urine) and alcohol (breath / oral fluid)</li>
      <li>The requirement that the driver submit to drug and alcohol testing</li>
      <li>An explanation of what constitutes a refusal and the consequences</li>
      <li>The consequences of a verified positive test or refusal · including referral to a SAP and the return-to-duty process</li>
      <li>The consequences of having an alcohol concentration of 0.02 to less than 0.04 (24-hour removal)</li>
      <li>Information concerning the effects of alcohol and controlled substances on health, work, and personal life · signs and symptoms · available methods of intervention</li>
    </ul>

    <h2>II · My acknowledgments</h2>
    <ol>
      <li>I understand that I am subject to pre-employment, random, post-accident, reasonable-suspicion, and return-to-duty / follow-up drug and alcohol testing as a condition of operating any commercial motor vehicle for ${escapeHtml(data.carrierName || "the carrier")}</li>
      <li>I understand that a verified positive drug test result, an alcohol concentration ≥ 0.04, or a refusal to test is a violation and will result in immediate removal from safety-sensitive duty</li>
      <li>I understand that a violation will be reported to the FMCSA Drug & Alcohol Clearinghouse</li>
      <li>I understand that I must complete the return-to-duty process with a qualified Substance Abuse Professional before returning to safety-sensitive duty</li>
      <li>I understand that any cost not covered by insurance is my personal responsibility</li>
      <li>I have had the opportunity to ask questions about the policy and any unanswered questions have been resolved to my satisfaction</li>
    </ol>

    <table style="margin-top: 0.3in;">
      <tbody>
        <tr><td style="width:60%; padding: 16px 8px;"><div class="signature-line"></div><div class="signature-label">Driver signature</div></td><td style="width:40%; padding: 16px 8px;"><div class="signature-line"></div><div class="signature-label">Date</div></td></tr>
        <tr><td style="padding: 16px 8px;"><div class="signature-line"></div><div class="signature-label">Driver printed name</div></td><td style="padding: 16px 8px;"><div class="signature-line"></div><div class="signature-label">CDL number</div></td></tr>
      </tbody>
    </table>

    <p class="meta" style="margin-top: 0.2in;">This receipt satisfies 49 CFR §382.601(d). Retain in the driver's DQ file for the duration of employment plus 3 years.</p>
  `,
});

/* ---- 32. dataq-challenge-template · DataQs / CSA SMS ---- */

export const dataqChallengeTemplate: TemplateFn<{ carrierName?: string; usdotNumber?: string; inspectionReportNumber?: string }> = (data) => ({
  version: "1.0",
  title: `DataQ Challenge Template · ${data.carrierName || "Sample Carrier"}`,
  headerSubtitle: "DataQ · challenge template · dataqs.fmcsa.dot.gov",
  bodyHTML: `
    <h1>DataQ Challenge · template</h1>
    <p class="meta">For <strong>${escapeHtml(data.carrierName || "Sample Carrier")}</strong>${data.usdotNumber ? ` · USDOT ${escapeHtml(data.usdotNumber)}` : ""}${data.inspectionReportNumber ? ` · Inspection Report ${escapeHtml(data.inspectionReportNumber)}` : ""}</p>

    <div class="callout">
      DataQs is the FMCSA's formal mechanism to challenge an inaccurate inspection violation, crash report, or other safety-data point. Roughly 30% of challenges succeed. The challenges that win are specific, evidence-backed, and filed quickly.
    </div>

    <h2>I · Before you file · the 4 questions to answer</h2>
    <ol>
      <li><strong>What's actually wrong?</strong> · "I disagree" doesn't win · "the inspector cited §393.75(a) but the tire tread measured 8/32 in inches, exceeding the §393.75(c)(1) minimum" wins</li>
      <li><strong>What evidence do I have?</strong> · photos · maintenance records · ELD logs · ECM data · the inspection report itself · a third-party measurement</li>
      <li><strong>What's the regulatory basis?</strong> · cite the exact CFR provision the inspector misapplied · don't argue policy, argue the regulation</li>
      <li><strong>Did I file within 30 days?</strong> · DataQs allows challenges up to 24 months, but the state has stronger memory closer to the event</li>
    </ol>

    <h2>II · The 5 highest-success challenge patterns</h2>
    <ul>
      <li><strong>Wrong CFR cited</strong> · inspector tagged §392.5 (alcohol) but the situation was §392.4 (drugs) · or vice versa · clean technical fix</li>
      <li><strong>Wrong driver / wrong vehicle</strong> · inspector recorded a unit number or CDL # that wasn't yours that day</li>
      <li><strong>OOS that wasn't actually OOS</strong> · brake adjustment measured within tolerance · tire tread within tolerance · provide your own measurement from the repair</li>
      <li><strong>Falsified citation</strong> · the violation didn't happen · ECM / ELD / dash cam show the truth</li>
      <li><strong>Inspector procedural error</strong> · the inspection wasn't completed per the FMCSA Inspection Procedures Manual · narrow but legitimate</li>
    </ul>

    <h2>III · Sample challenge narrative</h2>
    <p class="meta" style="background: #FEF3C7; padding: 12px 16px; border-left: 3px solid #D97706; border-radius: 4px;">"On [DATE], at the [LOCATION] inspection (Report #[NUMBER]), the inspector cited the vehicle for [VIOLATION] under [CFR]. We respectfully challenge this citation on the following basis:</p>
    <p class="meta" style="background: #FEF3C7; padding: 12px 16px; border-left: 3px solid #D97706; border-radius: 4px;">1. The actual condition: [WHAT WAS TRUE] · evidenced by [PHOTO / MAINTENANCE RECORD / MEASUREMENT].</p>
    <p class="meta" style="background: #FEF3C7; padding: 12px 16px; border-left: 3px solid #D97706; border-radius: 4px;">2. The applicable regulation [CFR.x.y.z] permits [SPECIFIC CONDITION]. The vehicle / driver / paperwork met that standard at the time of inspection.</p>
    <p class="meta" style="background: #FEF3C7; padding: 12px 16px; border-left: 3px solid #D97706; border-radius: 4px;">3. Attached evidence: [PHOTOS / RECORDS / ELD PRINTOUT].</p>
    <p class="meta" style="background: #FEF3C7; padding: 12px 16px; border-left: 3px solid #D97706; border-radius: 4px;">Requested resolution: Remove the cited violation from the inspection record and corresponding SMS BASIC score."</p>

    <h2>IV · The DataQ process · how it actually moves</h2>
    <ol>
      <li><strong>You file</strong> at dataqs.fmcsa.dot.gov · upload evidence · ticket number assigned</li>
      <li><strong>State DOT reviews</strong> · 30-90 days · they may contact the inspector for response</li>
      <li><strong>Decision posted</strong> · in your DataQs dashboard · supporting reasoning included</li>
      <li><strong>If denied</strong> · request supervisor review at the same state agency · then FMCSA HQ review if needed</li>
      <li><strong>SMS update</strong> · if granted, the violation is removed within 60-90 days of decision · score recalculates</li>
    </ol>

    <div class="callout">
      <strong>Don't waste challenges on judgment calls you'll lose.</strong> "The inspector should have given me a warning instead" is not a basis. "The inspector cited the wrong CFR" is.
    </div>
  `,
});

/* ---- 33. cargo-securement-driver-quickguide · §393 Subpart I ---- */

export const cargoSecurementDriverQuickGuide: TemplateFn<{ carrierName?: string; driverName?: string }> = (data) => ({
  version: "1.0",
  title: `Cargo Securement · Driver Quick Guide · ${data.driverName || "Sample Driver"}`,
  headerSubtitle: "Cargo securement · driver reference · 49 CFR §393 Subpart I",
  bodyHTML: `
    <h1>Cargo securement · quick guide</h1>
    <p class="meta">For <strong>${escapeHtml(data.driverName || "Sample Driver")}</strong>${data.carrierName ? ` · ${escapeHtml(data.carrierName)}` : ""} · keep in the cab</p>

    <div class="callout">
      Cargo that comes loose at highway speed kills people. §393 Subpart I sets the federal standards for tiedowns, working load limits (WLL), and securement systems. Roadside inspectors check this at every Level 1 inspection.
    </div>

    <h2>I · The general rule (every load, every time)</h2>
    <p>Cargo must be secured to prevent it from:</p>
    <ul>
      <li><strong>Forward</strong> · 0.8 g deceleration · roughly a hard stop from highway speed</li>
      <li><strong>Rearward</strong> · 0.5 g · roughly hard acceleration</li>
      <li><strong>Sideways</strong> · 0.5 g · sharp lane change or curve</li>
      <li><strong>Vertical</strong> · 0.2 g · bumps, dips, hills</li>
    </ul>
    <p class="meta">A tiedown's working load limit must be calculated for these forces. Multiple tiedowns combine their WLLs.</p>

    <h2>II · Minimum number of tiedowns · §393.110</h2>
    <table>
      <thead><tr><th style="width:50%">Cargo length</th><th>Minimum tiedowns</th></tr></thead>
      <tbody>
        <tr><td>5 ft or less · weighing more than 1,100 lb</td><td>2</td></tr>
        <tr><td>Greater than 5 ft and 10 ft or less</td><td>2</td></tr>
        <tr><td>Greater than 10 ft</td><td>2 for first 10 ft + 1 for each additional 10 ft or fraction</td></tr>
        <tr><td>Articles secured against a fixed structure (bulkhead, headboard)</td><td>1 fewer tiedown if structure can withstand the §393 forces</td></tr>
      </tbody>
    </table>

    <p>The aggregate Working Load Limit of all tiedowns combined must be ≥ 50% of the cargo weight.</p>

    <h2>III · Special commodity rules · §393.116-§393.136</h2>
    <ul>
      <li><strong>Logs · §393.116</strong> · centered + bunked · ends extending forward of bunks prohibited · chains or wire rope</li>
      <li><strong>Dressed lumber · §393.118</strong> · 2 tiedowns per bundle + cross-tied to vehicle</li>
      <li><strong>Metal coils · §393.120</strong> · eyes vertical · eyes lengthwise · or eyes crosswise · each has specific tiedown patterns</li>
      <li><strong>Paper rolls · §393.122</strong> · upright · banded + chocked / supported · tiedowns over each roll</li>
      <li><strong>Concrete pipe · §393.124</strong> · cradled + tiedowns sized to pipe weight</li>
      <li><strong>Intermodal containers · §393.126</strong> · all 4 corners locked to chassis or trailer</li>
      <li><strong>Automobiles · §393.128</strong> · 4 tiedowns minimum per vehicle</li>
      <li><strong>Heavy equipment · §393.130</strong> · 4 tiedowns + brake set + transmission in low gear · attach to designated tiedown points</li>
      <li><strong>Roll-on/roll-off containers · §393.132</strong> · twist locks + tiedowns</li>
      <li><strong>Boulders · §393.136</strong> · larger boulders require special handling</li>
    </ul>

    <h2>IV · Tiedown condition · what disqualifies a strap or chain</h2>
    <ul>
      <li><strong>Cuts, tears, or holes</strong> in webbing · any visible damage</li>
      <li><strong>Knots</strong> in the tiedown (they reduce WLL by up to 50%)</li>
      <li><strong>Frayed or worn webbing</strong> showing more than 25% loss of material</li>
      <li><strong>Burns, melting, or weld spatter</strong> on the strap</li>
      <li><strong>Cracked or deformed hardware</strong> · ratchets, hooks, J-hooks</li>
      <li><strong>Missing or unreadable WLL labels</strong> · a strap without a visible WLL stamp is no-go</li>
      <li><strong>Chains with cracked / gouged / nicked / stretched links</strong></li>
    </ul>

    <div class="callout">
      <strong>Inspect cargo and tiedowns within the first 50 miles of every trip · and every 150 miles thereafter</strong> · <span class="cfr">§392.9(b)</span>. Document the recheck. If a tiedown loosens mid-trip, stop and re-tension before continuing.
    </div>
  `,
});

/* ---- 34. annual-vehicle-inspection-report · §396.17 + Appendix G ---- */

export const annualVehicleInspectionReport: TemplateFn<{ carrierName?: string; vehicleId?: string; inspectorName?: string; inspectionDate?: string }> = (data) => ({
  version: "1.0",
  title: `Annual Vehicle Inspection · ${data.vehicleId || "Unit"}`,
  headerSubtitle: "Annual inspection · 49 CFR §396.17 + Appendix G",
  bodyHTML: `
    <h1>Annual vehicle inspection report</h1>
    <p class="meta">${escapeHtml(data.carrierName || "Sample Carrier")} · Unit <strong>${escapeHtml(data.vehicleId || "____________")}</strong> · inspected <strong>${escapeHtml(data.inspectionDate || "____________")}</strong> by <strong>${escapeHtml(data.inspectorName || "____________")}</strong></p>

    <div class="callout">
      §396.17 requires every CMV to be inspected at least every 12 months. The inspector must be qualified per §396.19. This form covers the §396 Appendix G inspection items.
    </div>

    <h2>I · Brake system</h2>
    <table>
      <thead><tr><th style="width:65%">Item</th><th>Pass / Fail / Repaired</th></tr></thead>
      <tbody>
        <tr><td>Service brakes · adjustment, condition</td><td>____________</td></tr>
        <tr><td>Parking brake · holds vehicle</td><td>____________</td></tr>
        <tr><td>Brake drums or rotors · no cracks or excessive wear</td><td>____________</td></tr>
        <tr><td>Brake hoses + tubing · no leaks, no chafing, secure</td><td>____________</td></tr>
        <tr><td>Air system · low-air warning, governor, dryer, tanks</td><td>____________</td></tr>
        <tr><td>ABS system · functional, warning lights off after start</td><td>____________</td></tr>
      </tbody>
    </table>

    <h2>II · Coupling devices, lighting, fuel, steering, tires, wheels</h2>
    <table>
      <thead><tr><th style="width:65%">Item</th><th>P / F / R</th></tr></thead>
      <tbody>
        <tr><td>Fifth wheel · mount, lock, condition</td><td>____________</td></tr>
        <tr><td>Pintle hook / trailer hitch · condition + safety chains</td><td>____________</td></tr>
        <tr><td>All exterior lighting · headlights, turn, brake, tail, marker, ID</td><td>____________</td></tr>
        <tr><td>Reflectors + reflective tape · condition + placement</td><td>____________</td></tr>
        <tr><td>Fuel system · no leaks, cap secure, mounted properly</td><td>____________</td></tr>
        <tr><td>Steering · no excessive free play, no looseness in linkage</td><td>____________</td></tr>
        <tr><td>Tires · tread depth (4/32 drive, 2/32 trailer), inflation, no cuts</td><td>____________</td></tr>
        <tr><td>Wheels + rims · no cracks, all lug nuts present + tight</td><td>____________</td></tr>
      </tbody>
    </table>

    <h2>III · Frame, suspension, exhaust, windshield + glazing</h2>
    <table>
      <thead><tr><th style="width:65%">Item</th><th>P / F / R</th></tr></thead>
      <tbody>
        <tr><td>Frame · no cracks, deformations, or excessive corrosion</td><td>____________</td></tr>
        <tr><td>Suspension · springs, U-bolts, shackles, axles · no defects</td><td>____________</td></tr>
        <tr><td>Exhaust system · leaks, mounting, no exhaust into cab</td><td>____________</td></tr>
        <tr><td>Windshield · no cracks in driver's view, no obstructions</td><td>____________</td></tr>
        <tr><td>Side + rear glass · no breakage in driver's view</td><td>____________</td></tr>
        <tr><td>Windshield wipers + washers · functional</td><td>____________</td></tr>
      </tbody>
    </table>

    <h2>IV · Emergency equipment + interior</h2>
    <table>
      <thead><tr><th style="width:65%">Item</th><th>P / F / R</th></tr></thead>
      <tbody>
        <tr><td>3 reflective triangles · in vehicle, accessible</td><td>____________</td></tr>
        <tr><td>Fire extinguisher · charged, mounted, inspection date current</td><td>____________</td></tr>
        <tr><td>Spare fuses (if not circuit breakers)</td><td>____________</td></tr>
        <tr><td>Horn · functional</td><td>____________</td></tr>
        <tr><td>Mirrors · both rear-view, condition + adjustment</td><td>____________</td></tr>
        <tr><td>Seat belts · functional, mounting secure</td><td>____________</td></tr>
        <tr><td>Heater + defroster · functional</td><td>____________</td></tr>
      </tbody>
    </table>

    <h2>Inspector certification</h2>
    <p>I, the undersigned qualified inspector per §396.19, certify that the items above were inspected and that the vehicle complies with the standards of 49 CFR §396, Appendix G as of the inspection date.</p>

    <table style="margin-top: 0.2in;">
      <tbody>
        <tr><td style="width:55%; padding: 12px 8px;"><div class="signature-line"></div><div class="signature-label">Inspector signature</div></td><td style="width:45%; padding: 12px 8px;"><div class="signature-line"></div><div class="signature-label">Date</div></td></tr>
        <tr><td style="padding: 12px 8px;"><div class="signature-line"></div><div class="signature-label">Printed name + qualification</div></td><td style="padding: 12px 8px;"><div class="signature-line"></div><div class="signature-label">Next inspection due</div></td></tr>
      </tbody>
    </table>

    <p class="meta" style="margin-top: 0.15in;">A copy of this report (or §396.21 sticker on the unit) must be retained for 14 months after the inspection date. <span class="cfr">§396.21(b)(2)</span></p>
  `,
});

/* ---- 35. eld-malfunction-policy · §395.34 + §395.22 ---- */

export const eldMalfunctionPolicy: TemplateFn<{ carrierName?: string }> = (data) => ({
  version: "1.0",
  title: `ELD Malfunction Policy · ${data.carrierName || "Sample Carrier"}`,
  headerSubtitle: "ELD malfunction policy · 49 CFR §395.34",
  bodyHTML: `
    <h1>ELD malfunction policy</h1>
    <p class="meta">For <strong>${escapeHtml(data.carrierName || "Sample Carrier")}</strong> · written policy per 49 CFR §395.34</p>

    <div class="callout">
      §395.34 requires every motor carrier using ELDs to have a written policy covering how drivers respond to ELD malfunctions and how the carrier repairs them. This template is suitable for use as the carrier's standing policy.
    </div>

    <h2>I · Scope</h2>
    <p>This policy applies to every driver and every commercial motor vehicle operated by ${escapeHtml(data.carrierName || "the Company")} that is subject to 49 CFR Part 395 (Hours of Service) and is required to use an Electronic Logging Device.</p>

    <h2>II · Driver responsibilities when an ELD malfunction occurs</h2>
    <ol>
      <li><strong>Notice the malfunction</strong> · the ELD will display a visible alert · note the date, time, and malfunction code</li>
      <li><strong>Note the malfunction</strong> on the driver's record of duty status (RODS) within 24 hours · §395.34(a)(2)</li>
      <li><strong>Provide written notice</strong> to ${escapeHtml(data.carrierName || "the carrier")} within 24 hours · accepted via text, email, or in-app notification to dispatch · §395.34(a)(2)</li>
      <li><strong>Switch to paper RODS</strong> for the rest of the day and continuing days until the malfunction is repaired · reconstruct the past 7 consecutive days of RODS using paper forms if not already on ELD · §395.34(a)(3)</li>
      <li><strong>Continue paper RODS</strong> for up to 8 days after the malfunction was first noticed, unless the ELD is repaired or replaced sooner · §395.34(d)</li>
      <li><strong>Carry a supply of blank paper RODS forms</strong> sufficient for at least 8 days at all times · §395.8(a)(1)(iii)</li>
    </ol>

    <h2>III · Carrier responsibilities</h2>
    <ol>
      <li><strong>Confirm receipt</strong> of the driver's malfunction notice in writing (email reply, dispatch log entry, ticket assignment)</li>
      <li><strong>Begin repair or replacement</strong> within a reasonable time · within 8 days of receiving notice the ELD must be repaired, replaced, or serviced · §395.34(d)</li>
      <li><strong>If repair won't fit in 8 days</strong> · file a written extension request with the FMCSA Field Office prior to expiration of the 8-day period · §395.34(b)(2)</li>
      <li><strong>Document every malfunction</strong> in the malfunction log · driver, unit, date noticed, repair date, repair description · retain for 6 months · §395.34(d)</li>
      <li><strong>Verify replacement / repair</strong> · check that the ELD vendor is still on the FMCSA Registered ELDs list, that data transfer + display functions work, and that the device is configured for the correct driver and vehicle</li>
    </ol>

    <h2>IV · The malfunction codes (display + meaning)</h2>
    <table>
      <thead><tr><th style="width:25%">Code</th><th>What it means</th><th>CFR</th></tr></thead>
      <tbody>
        <tr><td>P (Power)</td><td>ELD failed to power up</td><td><span class="cfr">§395.22(g)(1)</span></td></tr>
        <tr><td>E (Engine sync)</td><td>ELD can't talk to the engine ECM</td><td><span class="cfr">§395.22(g)(2)</span></td></tr>
        <tr><td>T (Timing)</td><td>Time drift > 10 minutes from UTC</td><td><span class="cfr">§395.22(g)(3)</span></td></tr>
        <tr><td>L (Positioning)</td><td>GPS signal lost > 60 min cumulative in 24 hr</td><td><span class="cfr">§395.22(g)(4)</span></td></tr>
        <tr><td>R (Data recording)</td><td>ELD can't record the required data</td><td><span class="cfr">§395.22(g)(5)</span></td></tr>
        <tr><td>S (Data transfer)</td><td>ELD can't transfer data to the FMCSA in the required format</td><td><span class="cfr">§395.22(g)(6)</span></td></tr>
        <tr><td>O (Other)</td><td>Anything else flagged by the device</td><td>§395.22(g)(7)</td></tr>
      </tbody>
    </table>

    <p class="meta" style="margin-top: 0.2in;">Adopted by ${escapeHtml(data.carrierName || "the carrier")} pursuant to 49 CFR §395.34. Effective from date of last revision. All drivers receive a copy as part of the §382.601 written policy packet.</p>
  `,
});

/* ============================================================
   BATCH 7 · Hub matrix completion · 8 more templates
   ============================================================ */

/* ---- 36. da-auditor-export-guide ---- */

export const daAuditorExportGuide: TemplateFn<{ carrierName?: string; auditWindow?: string }> = (data) => ({
  version: "1.0",
  title: `D&A Auditor Export Guide · ${data.carrierName || "Sample Carrier"}`,
  headerSubtitle: "D&A · auditor reference · 49 CFR §382.401",
  bodyHTML: `
    <h1>D&A program · auditor export guide</h1>
    <p class="meta">For <strong>${escapeHtml(data.carrierName || "Sample Carrier")}</strong> · audit window <strong>${escapeHtml(data.auditWindow || "last 2 years")}</strong></p>

    <div class="callout">
      In a compliance review, FMCSA investigators want to see your D&A program as a documented system: policy on file, supervisor training current, random pool defensible, post-accident procedure followed, MRO + SAP relationships intact, Clearinghouse reports filed. This guide lists what to hand over and in what order.
    </div>

    <h2>I · The standard D&A pull</h2>
    <ol>
      <li><strong>Written D&A policy</strong> · current version + revision history · <span class="cfr">§382.601</span></li>
      <li><strong>Policy receipts</strong> · signed acknowledgments from every driver · current + departed in past 3 years</li>
      <li><strong>Random testing pool</strong> · roster of who is in the pool + selection method documentation · <span class="cfr">§382.305</span></li>
      <li><strong>Random selection records</strong> · every selection list for the past 2 years + dates tested + result</li>
      <li><strong>Supervisor training records</strong> · 60 min drug + 60 min alcohol · for every supervisor authorized to call reasonable suspicion · <span class="cfr">§382.603</span></li>
      <li><strong>Post-accident testing log</strong> · every qualifying accident + decision (test / no test) + reason if not tested · <span class="cfr">§382.303</span></li>
      <li><strong>All test results</strong> · pre-employment, random, reasonable-suspicion, post-accident, RTD, follow-up · for the audit window</li>
      <li><strong>MRO contract</strong> + most-recent verification letters · <span class="cfr">§40 Subpart G</span></li>
      <li><strong>SAP referrals + RTD records</strong> · for any driver with a violation in the window</li>
      <li><strong>Clearinghouse query + report logs</strong> · pre-employment full · annual limited · violation reports filed within 3 business days · <span class="cfr">§382.701, §382.705</span></li>
      <li><strong>Annual MIS report</strong> · if requested for any year in the audit window · <span class="cfr">§382.403</span></li>
    </ol>

    <h2>II · What investigators look for in each pillar</h2>
    <table>
      <thead><tr><th style="width:35%">Pillar</th><th>Common findings</th></tr></thead>
      <tbody>
        <tr><td><strong>Policy</strong></td><td>Policy is generic + not specific to your operation · driver receipts missing for some drivers · old version with outdated CFR citations</td></tr>
        <tr><td><strong>Random pool</strong></td><td>Selections cluster in one quarter · same drivers picked repeatedly · selection method undocumented · pool roster doesn't match safety-sensitive driver list</td></tr>
        <tr><td><strong>Post-accident</strong></td><td>Qualifying accident with no test on file + no documented reason · alcohol test outside the 8-hour window with no explanation</td></tr>
        <tr><td><strong>Supervisor training</strong></td><td>Supervisor making reasonable-suspicion calls without training records · expired training (drift past 3 years if applicable)</td></tr>
        <tr><td><strong>Reporting</strong></td><td>Positive test on file but no Clearinghouse report within 3 business days · or report filed but driver still in safety-sensitive duty</td></tr>
      </tbody>
    </table>

    <h2>III · The X3 Compass audit packet</h2>
    <ol>
      <li>Navigate to <strong>Audit Export</strong> · select scope <strong>D&A</strong></li>
      <li>Select the audit window</li>
      <li>Click <strong>Generate audit packet</strong> · X3 builds a single PDF with policy + receipts + selection records + supervisor training + test results + Clearinghouse activity · indexed</li>
      <li>The packet has version + content hash · cross-referenceable with the compass_pdf_generated ledger</li>
    </ol>

    <h2>IV · The 5 questions D&A investigators always ask</h2>
    <ol>
      <li>Show me your random selection method · who runs it, what tool</li>
      <li>Pick a random month · show me the selection list + the tests that resulted</li>
      <li>Walk me through what happens when a driver tests positive · MRO → SAP → RTD → follow-up</li>
      <li>Show me a supervisor's reasonable-suspicion training record + a real reasonable-suspicion incident</li>
      <li>Pick a driver hired in the past 12 months · show me the pre-employment query + drug test result + policy receipt</li>
    </ol>

    <div class="callout">
      <strong>Don't try to look perfect.</strong> Demonstrate a functioning system with gaps that you found + closed yourself. Auditors trust carriers that catch their own misses more than carriers who claim to have none.
    </div>
  `,
});

/* ---- 37. dqf-employer-playbook ---- */

export const dqfEmployerPlaybook: TemplateFn<{ carrierName?: string; safetyDirectorName?: string }> = (data) => ({
  version: "1.0",
  title: `DQF · Employer Playbook · ${data.carrierName || "Sample Carrier"}`,
  headerSubtitle: "DQF · employer playbook · 49 CFR §391.51",
  bodyHTML: `
    <h1>Driver Qualification Files · employer playbook</h1>
    <p class="meta">For ${escapeHtml(data.safetyDirectorName ? `${data.safetyDirectorName} · ` : "")}<strong>${escapeHtml(data.carrierName || "Sample Carrier")}</strong></p>

    <div class="callout">
      The carrier maintains a complete DQ file for every CDL driver per §391.51. Every missing document is a citation; missing patterns across multiple drivers is an unsatisfactory safety rating. This playbook tells you what to check, when, and who owns each piece.
    </div>

    <h2>I · The carrier's standing duties</h2>
    <ol>
      <li><strong>Build the DQ file at hire</strong> · 12 documents per §391.51 within 30 days of safety-sensitive duty start</li>
      <li><strong>Maintain the file</strong> · annual MVR, annual review, annual violation cert, medical card recerts, Clearinghouse limited query each year</li>
      <li><strong>Verify the NRCME entry</strong> for the medical examiner + document the verification date · <span class="cfr">§391.23(m)</span></li>
      <li><strong>Confirm CDLIS shows "certified"</strong> · the medical card on file isn't enough · state must show certified status · driver is OOS if not</li>
      <li><strong>Retain the file</strong> · duration of employment + 3 years for most items · 5 years for D&A · <span class="cfr">§391.51 + §382.401</span></li>
    </ol>

    <h2>II · The annual maintenance calendar</h2>
    <table>
      <thead><tr><th style="width:25%">When</th><th>Task</th><th>CFR</th></tr></thead>
      <tbody>
        <tr><td>Each driver's hire-anniversary month</td><td>Pull annual MVR (every state where licensed in past 12 mo) · run annual limited Clearinghouse query · conduct + sign §391.25(c) annual review</td><td><span class="cfr">§391.25, §382.701(b)</span></td></tr>
        <tr><td>Each driver's hire-anniversary month</td><td>Driver completes annual violation self-certification form</td><td><span class="cfr">§391.27</span></td></tr>
        <tr><td>60 / 30 / 7 days before med-card expiration</td><td>Reminders to driver + safety director · book the exam · receive new card + verify CDLIS</td><td><span class="cfr">§391.45</span></td></tr>
        <tr><td>Roadside inspection received</td><td>Add to driver file · review violations against progressive discipline matrix · DataQ challenges if appropriate</td><td><span class="cfr">§396.9</span></td></tr>
        <tr><td>Any new accident</td><td>Update §390.15 Accident Register · post-accident D&A decision applied · file accident report in driver file</td><td><span class="cfr">§390.15, §382.303</span></td></tr>
        <tr><td>Driver termination</td><td>Retention clock starts · 3 years for most §391 items · 5 years for D&A · file move to "terminated" with retention metadata</td><td><span class="cfr">§391.51(d)</span></td></tr>
      </tbody>
    </table>

    <h2>III · Common findings across audits</h2>
    <ul>
      <li><strong>No NRCME verification date</strong> · medical card is there but you never documented checking the registry · this is the single most-cited DQF finding</li>
      <li><strong>Annual review skipped</strong> · driver's been there 2+ years with no §391.25(c) reviews on file</li>
      <li><strong>Previous-employer responses missing</strong> · §391.23(d) inquiry attempt logs exist but the actual responses don't · investigators want the responses, not "we tried"</li>
      <li><strong>MVR pulled only from one state</strong> · driver was licensed in 2 states in past 12 months, only one was pulled</li>
      <li><strong>ELDT certificate missing</strong> · for any driver who got CDL after 02/07/2022 · easy to miss for in-house upgrades</li>
      <li><strong>Annual limited Clearinghouse query absent</strong> · pre-employment full was done but the recurring annual was forgotten · §382.701(b) violation</li>
    </ul>

    <h2>IV · The 5 audit-defense moves</h2>
    <ol>
      <li><strong>Single source of truth</strong> · all 12 documents per driver in one system (X3 Compass DQF tracker) · status pills make gaps visible</li>
      <li><strong>Pre-flight check at 60 / 30 / 7 days</strong> for everything that expires · medical, MVR, Clearinghouse, annual review</li>
      <li><strong>Audit-export bundle</strong> · one button generates a per-driver PDF with all 12 documents · investigator-ready</li>
      <li><strong>Document patterns of corrective action</strong> · not just the violation, but what you did about it · this is what auditors weigh</li>
      <li><strong>Quarterly self-audit</strong> · don't wait for FMCSA to find your gaps · run the audit yourself, fix what you find, document the fix</li>
    </ol>

    <div class="callout">
      <strong>A clean DQF program isn't about more paperwork.</strong> It's about a system where every required document has a single owner, a single status, a single expiration date, and an automated reminder. The X3 Compass DQF tracker does all four.
    </div>
  `,
});

/* ---- 38. dqf-auditor-export-guide ---- */

export const dqfAuditorExportGuide: TemplateFn<{ carrierName?: string; auditWindow?: string }> = (data) => ({
  version: "1.0",
  title: `DQF · Auditor Export Guide · ${data.carrierName || "Sample Carrier"}`,
  headerSubtitle: "DQF · auditor reference · 49 CFR §391.51",
  bodyHTML: `
    <h1>DQF · auditor export guide</h1>
    <p class="meta">For <strong>${escapeHtml(data.carrierName || "Sample Carrier")}</strong> · audit window <strong>${escapeHtml(data.auditWindow || "current + 3 prior years")}</strong></p>

    <div class="callout">
      In a safety audit or compliance review, FMCSA investigators pull a sample of driver files and check them against the §391.51 12-document standard. This guide lists what to hand over per driver and the order investigators look at things.
    </div>

    <h2>I · Per-driver pull (for each sampled driver)</h2>
    <ol>
      <li>Driver's application for employment (§391.21 long-form)</li>
      <li>Initial MVR (within 30 days of hire) for every state licensed in past 3 years</li>
      <li>Previous-employer safety performance + D&A inquiries + responses</li>
      <li>Road test certificate or CDL-on-file equivalent</li>
      <li>Current medical examiner's certificate</li>
      <li>NRCME verification date (registry-check documentation)</li>
      <li>Most recent annual driver review (§391.25(c) signed note)</li>
      <li>Driver's most recent annual self-certification of violations (§391.27)</li>
      <li>Annual MVRs for every year of employment</li>
      <li>Clearinghouse pre-employment full query + driver consent</li>
      <li>Clearinghouse annual limited query results + general written consent</li>
      <li>Entry-level driver training (ELDT) certificate (if CDL post-02/07/2022)</li>
    </ol>

    <h2>II · The investigator's typical review order</h2>
    <ol>
      <li><strong>Skim the application</strong> · 3 years of address + 10 years of employment · gaps trigger follow-up questions</li>
      <li><strong>Check the medical card</strong> · current? on the NRCME-verified examiner's letterhead? CDLIS status?</li>
      <li><strong>Check the MVRs</strong> · annual cadence intact? from every state where licensed?</li>
      <li><strong>Check the Clearinghouse trail</strong> · pre-employment + annual limited every year · driver consent documented</li>
      <li><strong>Check the annual review</strong> · §391.25(c) note · who reviewed, when, what they found</li>
      <li><strong>Cross-reference with roadside inspections</strong> · any violations on roadside not addressed in the file = corrective-action gap</li>
      <li><strong>Cross-reference with the Accident Register</strong> · any accidents in §390.15 not reflected in the driver's file = consistency gap</li>
    </ol>

    <h2>III · Auto-fail findings (16 in §385 Appendix A)</h2>
    <p>These come up first in any audit · most are DQF-anchored:</p>
    <ul>
      <li>Driver without a valid CDL (no copy in file)</li>
      <li>Driver with suspended / revoked CDL on the road</li>
      <li>Disqualified driver (§391.15) on the road</li>
      <li>Driver without a current medical card (or expired)</li>
      <li>No pre-employment D&A test</li>
      <li>No random testing program</li>
      <li>No DQ file maintained</li>
      <li>Knowingly using a positive / refused driver</li>
    </ul>
    <p class="meta">Any single one of these in your driver sample is an automatic conditional rating.</p>

    <h2>IV · The X3 Compass per-driver audit packet</h2>
    <ol>
      <li>Navigate to <strong>Audit Export</strong> · select scope <strong>DQF</strong></li>
      <li>Select drivers (all, sample, or specific list)</li>
      <li>Click <strong>Generate audit packet</strong> · X3 builds one PDF per driver with all 12 documents in regulatory order</li>
      <li>Each packet has a version + content hash in the footer · audit-traceable</li>
    </ol>

    <div class="callout">
      <strong>You don't need every file to be perfect.</strong> You need a documented system where issues are caught + corrected. An audit-export bundle that shows "this gap was found Aug 12 + closed Aug 18" beats a clean file with no provenance.
    </div>
  `,
});

/* ---- 39. background-checks-driver-guide ---- */

export const backgroundChecksDriverGuide: TemplateFn<{ carrierName?: string; driverName?: string }> = (data) => ({
  version: "1.0",
  title: `Background Checks · Driver Guide · ${data.driverName || "Sample Driver"}`,
  headerSubtitle: "Background checks · driver reference · FCRA + DOT",
  bodyHTML: `
    <h1>Background checks · driver guide</h1>
    <p class="meta">For <strong>${escapeHtml(data.driverName || "Sample Driver")}</strong>${data.carrierName ? ` · ${escapeHtml(data.carrierName)}` : ""}</p>

    <div class="callout">
      As part of CDL hiring, you'll be subject to multiple background checks: state MVR, Clearinghouse, prior-employer safety inquiries, criminal history, drug + alcohol test history, and sometimes credit. The FCRA gives you specific rights at every step.
    </div>

    <h2>I · What gets checked</h2>
    <table>
      <thead><tr><th style="width:30%">Check</th><th>Source</th><th>Your rights</th></tr></thead>
      <tbody>
        <tr><td>State MVR</td><td>State DMV records</td><td>You'll be given a copy if any adverse action results</td></tr>
        <tr><td>Clearinghouse</td><td>FMCSA D&A database</td><td>Full-query consent is electronic + driver-specific</td></tr>
        <tr><td>Previous-employer safety</td><td>Past 3 years of DOT employers</td><td>You sign a separate consent · responses go to current carrier</td></tr>
        <tr><td>Criminal history</td><td>County / state / federal · via CRA (Consumer Reporting Agency)</td><td>Standalone FCRA disclosure + authorization · you must sign before pull</td></tr>
        <tr><td>D&A testing history</td><td>Past 3 years of DOT employers (via §40.25)</td><td>Separate written consent · sent to past employers directly</td></tr>
        <tr><td>Credit report (rare for CDL)</td><td>Credit bureau · only if role involves financial trust</td><td>FCRA disclosure + signed consent · standalone</td></tr>
      </tbody>
    </table>

    <h2>II · Your FCRA rights · 15 U.S.C. §1681 et seq.</h2>
    <ol>
      <li><strong>You get a stand-alone disclosure</strong> · the form notifying you that a consumer report will be ordered · NOT buried inside the application</li>
      <li><strong>You give written authorization</strong> · you can decline, but the carrier may withdraw the offer</li>
      <li><strong>You receive a copy of the report</strong> on request</li>
      <li><strong>You get a "Summary of Your Rights"</strong> · federally-mandated document explaining your protections</li>
      <li><strong>Pre-adverse action notice</strong> · if the carrier intends to deny based on the report, they must tell you, give you a copy of the report, and wait ~5 business days for you to dispute</li>
      <li><strong>Adverse action notice</strong> · after the decision · names the CRA, says you can dispute, repeats your rights</li>
    </ol>

    <h2>III · If the report has something wrong</h2>
    <ol>
      <li><strong>Get a copy</strong> · the carrier or the CRA will provide it on request</li>
      <li><strong>Identify the specific item</strong> · "this conviction is from a person with my name but different SSN" or "this is older than 7 years and should not be reported under FCRA §605"</li>
      <li><strong>Dispute with the CRA</strong> · they have 30 days to investigate + respond</li>
      <li><strong>Dispute directly with the source</strong> · the court, the employer, the agency that supplied the data</li>
      <li><strong>Notify the carrier</strong> in writing that you're disputing · this stops the adverse-action clock until resolution</li>
      <li><strong>If the dispute is upheld</strong> · the corrected report is provided to the carrier · they reconsider</li>
    </ol>

    <h2>IV · What you'll be asked to sign during hire</h2>
    <ol>
      <li><strong>FCRA disclosure + authorization</strong> (stand-alone) · for the consumer report</li>
      <li><strong>Clearinghouse full-query consent</strong> (electronic, in clearinghouse.fmcsa.dot.gov)</li>
      <li><strong>Clearinghouse annual limited-query consent</strong> (general written · one signature covers all future annual queries)</li>
      <li><strong>State MVR consent</strong> · per state, for every state where you've been licensed</li>
      <li><strong>D&A testing history consent</strong> (§40.25) · for previous-employer inquiries</li>
      <li><strong>DOT safety-performance consent</strong> (§391.23(d)) · combined with §40.25 in most carriers' packets</li>
    </ol>

    <div class="callout">
      <strong>Read every form before you sign.</strong> If a form bundles consent with employment terms or buries the disclosure inside the application, it's not FCRA-compliant. You can ask for a stand-alone version.
    </div>
  `,
});

/* ---- 40. background-checks-employer-playbook ---- */

export const backgroundChecksEmployerPlaybook: TemplateFn<{ carrierName?: string; safetyDirectorName?: string }> = (data) => ({
  version: "1.0",
  title: `Background Checks · Employer Playbook · ${data.carrierName || "Sample Carrier"}`,
  headerSubtitle: "Background checks · employer playbook · FCRA + DOT",
  bodyHTML: `
    <h1>Background checks · employer playbook</h1>
    <p class="meta">For ${escapeHtml(data.safetyDirectorName ? `${data.safetyDirectorName} · ` : "")}<strong>${escapeHtml(data.carrierName || "Sample Carrier")}</strong></p>

    <div class="callout">
      Hiring a CDL driver involves stacking checks across the DOT regulations (§391.23, §382.701, §40.25) AND the FCRA. Each check has its own consent form, its own pull timing, and its own adverse-action procedure. Get the sequencing wrong and you're exposed to FCRA class-action litigation.
    </div>

    <h2>I · The pre-hire check stack</h2>
    <table>
      <thead><tr><th style="width:35%">Check</th><th>Vendor / Source</th><th>CFR / Statute</th></tr></thead>
      <tbody>
        <tr><td>State MVR (all states past 3 yr)</td><td>State DMV or aggregator</td><td><span class="cfr">§391.23(a)(1)</span></td></tr>
        <tr><td>Clearinghouse pre-employment full</td><td>clearinghouse.fmcsa.dot.gov</td><td><span class="cfr">§382.701(a)</span></td></tr>
        <tr><td>Pre-employment DOT drug test</td><td>DOT-certified collection site + lab + MRO</td><td><span class="cfr">§382.301</span></td></tr>
        <tr><td>Previous-employer DOT safety history</td><td>Direct inquiry letters or via Checkr</td><td><span class="cfr">§391.23(d)</span></td></tr>
        <tr><td>Previous-employer D&A testing history</td><td>Direct inquiry letters · separate from §391.23(d) but usually combined</td><td><span class="cfr">§40.25</span></td></tr>
        <tr><td>Criminal background check (optional)</td><td>Checkr or equivalent CRA</td><td>FCRA 15 U.S.C. §1681</td></tr>
        <tr><td>Medical card verification</td><td>NRCME + CDLIS check</td><td><span class="cfr">§391.23(m), §391.45</span></td></tr>
      </tbody>
    </table>

    <h2>II · The FCRA-compliant sequencing</h2>
    <ol>
      <li><strong>Standalone FCRA disclosure</strong> presented · its own document · driver signs the authorization separately</li>
      <li><strong>Run the consumer report</strong> via Checkr or your CRA · you receive the report</li>
      <li><strong>If the report supports an offer</strong> · proceed to normal hiring · keep the report on file</li>
      <li><strong>If the report could trigger denial</strong> · DO NOT decline yet · send the <strong>pre-adverse action notice</strong> per FCRA §1681b(b)(3) · include a copy of the report + Summary of Your Rights</li>
      <li><strong>Wait 5 business days</strong> for the driver to dispute</li>
      <li><strong>If no dispute or dispute resolved against driver</strong> · proceed with <strong>adverse action notice</strong> · names the CRA, repeats dispute rights</li>
      <li><strong>Document everything</strong> · the timeline is the lawsuit-defense, not the substance of the decision</li>
    </ol>

    <h2>III · The most common FCRA mistakes</h2>
    <ul>
      <li><strong>Disclosure not stand-alone</strong> · embedded in the employment application · class-action target</li>
      <li><strong>Authorization missing</strong> · disclosure signed but no separate authorization line · violates §1681b(b)(2)(A)</li>
      <li><strong>Pre-adverse action skipped</strong> · denial letter sent without giving driver a chance to dispute · single biggest litigation risk</li>
      <li><strong>5-day waiting period not honored</strong> · sent pre-adverse on Monday, denied on Tuesday</li>
      <li><strong>Adverse action notice missing</strong> · driver was told verbally but never got the FCRA-mandated written notice with CRA contact info</li>
    </ul>

    <h2>IV · The recordkeeping requirements</h2>
    <table>
      <thead><tr><th>Record</th><th>Retain for</th><th>Source</th></tr></thead>
      <tbody>
        <tr><td>FCRA disclosure + signed authorization</td><td>5 years after end of employment</td><td>FCRA + EEOC</td></tr>
        <tr><td>Consumer reports + adverse action correspondence</td><td>5 years after action</td><td>FCRA</td></tr>
        <tr><td>DOT employment + D&A inquiry responses</td><td>Duration of employment + 3 years</td><td><span class="cfr">§391.51(d)</span></td></tr>
        <tr><td>Clearinghouse query results + consents</td><td>3 years</td><td><span class="cfr">§382.401(b)(1)(vii)</span></td></tr>
      </tbody>
    </table>

    <div class="callout">
      <strong>Don't DIY background checks for CDL drivers.</strong> Use a vendor (Checkr, HireRight, etc.) that handles the FCRA sequencing automatically and that integrates with your DQF tracker. X3 Compass + Checkr integration handles every step from disclosure through adverse action.
    </div>
  `,
});

/* ---- 41. mvr-employer-playbook ---- */

export const mvrEmployerPlaybook: TemplateFn<{ carrierName?: string; safetyDirectorName?: string }> = (data) => ({
  version: "1.0",
  title: `MVR · Employer Playbook · ${data.carrierName || "Sample Carrier"}`,
  headerSubtitle: "MVR · employer playbook · 49 CFR §391.25 + §383.51",
  bodyHTML: `
    <h1>MVR · employer playbook</h1>
    <p class="meta">For ${escapeHtml(data.safetyDirectorName ? `${data.safetyDirectorName} · ` : "")}<strong>${escapeHtml(data.carrierName || "Sample Carrier")}</strong></p>

    <div class="callout">
      The MVR is your most-frequently-pulled piece of driver evidence. Done right, it catches problems before they show up on a roadside inspection. Done wrong (annual-only, single state, no continuous monitoring) it's a paper trail to a CSA Driver Fitness alert.
    </div>

    <h2>I · The pull cadence + decision matrix</h2>
    <table>
      <thead><tr><th style="width:25%">Mode</th><th>When</th><th>What you do with it</th></tr></thead>
      <tbody>
        <tr><td>Pre-employment</td><td>Within 30 days of hire · every state licensed past 3 yr</td><td>Evaluate against hiring standard · disqualifying offenses bar employment · file in DQ</td></tr>
        <tr><td>Annual</td><td>Once per year · every state licensed in past 12 mo</td><td>Add to DQ file · feed annual §391.25(c) review · update the §383.51 disqualifying-offense scoreboard</td></tr>
        <tr><td>Continuous monitoring</td><td>Real-time vendor alerts (Samba Safety, etc.)</td><td>Same-day notice of any new violation, license status change, or accident</td></tr>
        <tr><td>Post-incident</td><td>After any accident, roadside violation, or driver self-cert disclosure</td><td>Re-evaluate driver fitness · document corrective action</td></tr>
      </tbody>
    </table>

    <h2>II · The §383.51 disqualifying offense scoreboard</h2>
    <p>Auto-disqualification, regardless of company policy:</p>
    <ul>
      <li><strong>1st major offense</strong> (Table 1) · 1-year disqualification · 3-year if hazmat</li>
      <li><strong>2nd major offense</strong> · lifetime disqualification (10-year possible reinstatement)</li>
      <li><strong>2 serious offenses</strong> in 3 years · 60-day disqualification</li>
      <li><strong>3 serious offenses</strong> in 3 years · 120-day disqualification</li>
      <li><strong>2 railroad-crossing offenses</strong> · 120-day</li>
      <li><strong>3 RR-crossing offenses</strong> · 1-year</li>
      <li><strong>1 OOS order violation</strong> · 180-day</li>
    </ul>
    <p>You must track these per driver against this scoreboard · the state will eventually catch a third serious, but your CSA score takes the hit in the meantime.</p>

    <h2>III · Company policy on top of §383.51</h2>
    <p>Most carriers add stricter internal standards · examples:</p>
    <ul>
      <li>No DUI within 7 years (federal is lifetime for 2nd · most carriers tighten to "never")</li>
      <li>No more than 2 moving violations in 3 years</li>
      <li>No at-fault accident within 3 years</li>
      <li>No preventable accident with injury within 5 years</li>
      <li>Lock out any state where the license is suspended</li>
    </ul>
    <p class="meta">Document your standard + apply it uniformly · disparate-impact / discrimination claims start when "policy" varies by candidate.</p>

    <h2>IV · The annual review pattern</h2>
    <ol>
      <li><strong>Pull annual MVR</strong> 30 days before driver's hire anniversary</li>
      <li><strong>Compare to last year's MVR</strong> · any new violations? new accidents? license action?</li>
      <li><strong>Have the driver complete §391.27 violation self-cert</strong> · driver lists all moving violations from past 12 mo · cross-check against the MVR</li>
      <li><strong>Sit with the driver</strong> · review findings · §391.25(c) signed note</li>
      <li><strong>Determine action</strong> · qualified / corrective action / disqualified · document in driver file</li>
      <li><strong>File the annual review</strong> · with next-review-due date calendared</li>
    </ol>

    <div class="callout">
      <strong>Continuous MVR monitoring catches problems annual pulls miss.</strong> A driver picks up a DUI in their personal vehicle on Saturday · with continuous monitoring you see it Monday morning · with annual pulls you might not see it until 11 months later. The cost is ~$1-3/driver/month and prevents single biggest preventable insurance hit.
    </div>
  `,
});

/* ---- 42. mvr-auditor-export-guide ---- */

export const mvrAuditorExportGuide: TemplateFn<{ carrierName?: string; auditWindow?: string }> = (data) => ({
  version: "1.0",
  title: `MVR · Auditor Export Guide · ${data.carrierName || "Sample Carrier"}`,
  headerSubtitle: "MVR · auditor reference · 49 CFR §391.25 + §391.27",
  bodyHTML: `
    <h1>MVR · auditor export guide</h1>
    <p class="meta">For <strong>${escapeHtml(data.carrierName || "Sample Carrier")}</strong> · audit window <strong>${escapeHtml(data.auditWindow || "last 3 years")}</strong></p>

    <div class="callout">
      Investigators check MVR records to verify the annual cadence (§391.25), the driver self-certifications (§391.27), and that the carrier acted on what the MVRs showed. Findings here roll up into Driver Fitness BASIC + the §391.51 DQF citation count.
    </div>

    <h2>I · The standard MVR pull (per driver)</h2>
    <ol>
      <li><strong>Initial MVRs at hire</strong> · every state licensed in the 3 years before hire · within 30 days of hire</li>
      <li><strong>Annual MVRs</strong> · every state licensed in the 12 months prior to each annual review · one per year of employment</li>
      <li><strong>Driver's §391.27 annual self-certification of violations</strong> · for each year</li>
      <li><strong>§391.25(c) signed annual review note</strong> · for each year</li>
      <li><strong>Continuous monitoring alerts</strong> · if you use a vendor · receipt + carrier action for each alert</li>
      <li><strong>Roadside inspection reports</strong> involving this driver · for cross-reference</li>
    </ol>

    <h2>II · What investigators cross-reference</h2>
    <table>
      <thead><tr><th style="width:40%">Source A</th><th style="width:40%">Source B</th><th>What gets flagged</th></tr></thead>
      <tbody>
        <tr><td>MVR conviction</td><td>Driver's §391.27 self-cert</td><td>Driver omitted a conviction · falsification</td></tr>
        <tr><td>MVR conviction</td><td>§391.25(c) annual review note</td><td>Carrier saw it but did nothing · failure to act</td></tr>
        <tr><td>Roadside inspection violation</td><td>MVR conviction record</td><td>Conviction missing from MVR · DMV reporting lag · update needed</td></tr>
        <tr><td>License status "suspended" on MVR</td><td>Driver's HOS or trip records</td><td>Driver operated CMV during suspension · acute violation</td></tr>
        <tr><td>License "not certified" on CDLIS</td><td>Driver's medical card on file</td><td>Card on file but state not updated · driver is OOS</td></tr>
      </tbody>
    </table>

    <h2>III · Most common findings</h2>
    <ul>
      <li><strong>Missing annual MVR</strong> for a year of employment · classic §391.25 violation</li>
      <li><strong>MVR pulled from only one state</strong> · driver had licenses in 2+ states during the period</li>
      <li><strong>Driver self-cert missing</strong> · annual MVR was pulled but the driver's §391.27 form isn't in file</li>
      <li><strong>Annual review note missing</strong> · MVR + self-cert there, but no §391.25(c) note documenting the review</li>
      <li><strong>Disqualifying offense ignored</strong> · MVR shows a §383.51 disqualifying offense, but no record of removal from CMV operation</li>
    </ul>

    <h2>IV · The X3 Compass MVR audit packet</h2>
    <ol>
      <li>Navigate to <strong>Audit Export</strong> · select scope <strong>MVR</strong></li>
      <li>Select drivers (all or sampled)</li>
      <li>Click <strong>Generate audit packet</strong> · X3 builds a per-driver PDF: initial MVR(s), annual MVRs, §391.27 self-certs, §391.25(c) review notes, continuous-monitoring alerts</li>
      <li>The packet has a version + content hash · matches the audit ledger row</li>
    </ol>

    <div class="callout">
      <strong>The cleanest MVR audit defense is the boring one</strong>: same cadence, same documents, same review form, every driver, every year. The fanciest continuous-monitoring stack means nothing if you can't show the regulatory baseline.
    </div>
  `,
});

/* ---- 43. inspections-driver-quickguide ---- */

export const inspectionsDriverQuickGuide: TemplateFn<{ carrierName?: string; driverName?: string }> = (data) => ({
  version: "1.0",
  title: `Roadside Inspection · Driver Quick Guide · ${data.driverName || "Sample Driver"}`,
  headerSubtitle: "Inspections · driver reference · 49 CFR §396",
  bodyHTML: `
    <h1>Roadside inspection · driver quick guide</h1>
    <p class="meta">For <strong>${escapeHtml(data.driverName || "Sample Driver")}</strong>${data.carrierName ? ` · ${escapeHtml(data.carrierName)}` : ""} · keep in the cab</p>

    <div class="callout">
      A clean roadside inspection takes 15-30 minutes. A messy one can take 90 and end with the truck OOS. The difference is mostly what's prepared in the cab, what you hand over fast, and how you talk to the inspector.
    </div>

    <h2>I · What to have ready in the cab</h2>
    <ul>
      <li><strong>CDL + medical card</strong> · both within reach of the driver's seat</li>
      <li><strong>Vehicle registration + IRP cab card</strong> · in the document holder</li>
      <li><strong>Current periodic inspection sticker</strong> visible on the unit · or the §396.17 form in the cab</li>
      <li><strong>Current annual federal inspection record</strong> · paper or accessible electronic</li>
      <li><strong>Insurance card</strong> · FMCSA financial responsibility certificate</li>
      <li><strong>Permit book</strong> · IFTA license + decals, IRP, fuel-tax permits, oversize permits if applicable</li>
      <li><strong>Shipping papers</strong> · for hazmat or any specific cargo · driver's-side door pocket</li>
      <li><strong>ELD + user manual</strong> · paper or PDF on phone · know how to do data transfer</li>
      <li><strong>8 blank paper RODS forms</strong> · for malfunction backup</li>
      <li><strong>3 reflective triangles + fire extinguisher (current)</strong> · accessible</li>
    </ul>

    <h2>II · The 6 inspection levels</h2>
    <table>
      <thead><tr><th style="width:18%">Level</th><th>What's inspected</th></tr></thead>
      <tbody>
        <tr><td>Level I</td><td>Full driver + vehicle inspection · most common · 37 items</td></tr>
        <tr><td>Level II</td><td>Walk-around · driver + vehicle but no under-vehicle</td></tr>
        <tr><td>Level III</td><td>Driver-only · CDL, medical, logs, paperwork · no vehicle</td></tr>
        <tr><td>Level IV</td><td>Special · single feature focus (specific defect, specific commodity)</td></tr>
        <tr><td>Level V</td><td>Vehicle-only · driver not present (post-crash etc.)</td></tr>
        <tr><td>Level VI</td><td>Enhanced NAS · radioactive material shipments only</td></tr>
      </tbody>
    </table>

    <h2>III · How to behave during the inspection</h2>
    <ol>
      <li><strong>Pull over safely + completely</strong> · use turn signals, four-ways, full stop</li>
      <li><strong>Roll down the window + stay in the truck</strong> until the inspector tells you to exit</li>
      <li><strong>Greet the inspector politely</strong> · "Officer · what do you need?"</li>
      <li><strong>Hand over documents one at a time as requested</strong> · don't dump the whole permit book on them</li>
      <li><strong>Answer questions directly + briefly</strong> · "where are you headed" "Chicago" · not a life story</li>
      <li><strong>Don't argue with anything cited at the scene</strong> · "OK officer" · save the fight for DataQs</li>
      <li><strong>Read the inspection report before signing</strong> · confirm your name, CDL #, unit #, citations match what you saw</li>
      <li><strong>Get your copy</strong> · don't leave the scene without it · §396.9(c)</li>
    </ol>

    <h2>IV · If you get OOS</h2>
    <ul>
      <li><strong>Driver OOS</strong> · medical card expired, CDL suspended, HOS violated, alcohol/drug evidence · you can't drive until the issue is corrected</li>
      <li><strong>Vehicle OOS</strong> · brake adjustment, tire tread, lighting · the unit doesn't move until repaired + re-inspected</li>
      <li><strong>Call dispatch immediately</strong> · they coordinate roadside repair, alternate driver, or tow</li>
      <li><strong>Don't drive the unit</strong> even if the violation seems minor · moving an OOS vehicle is a federal violation + automatic 180-day disqualification</li>
      <li><strong>Document the timeline</strong> · when you noticed the issue, what the inspector said, when dispatch was called, who arrived to fix it</li>
    </ul>

    <div class="callout">
      <strong>Most violations are won or lost in the cab before the inspector arrives.</strong> A 10-minute pre-trip + a complete document binder catches 80% of what gets cited. The other 20% is on the carrier's maintenance program · which doesn't fall on you at the scene.
    </div>
  `,
});

/* ============================================================
   BATCH 8 · IFTA driver · accidents/medical card auditor · forms
   ============================================================ */

/* ---- 44. ifta-driver-guide ---- */

export const iftaDriverGuide: TemplateFn<{ carrierName?: string; driverName?: string }> = (data) => ({
  version: "1.0",
  title: `IFTA · Driver Guide · ${data.driverName || "Sample Driver"}`,
  headerSubtitle: "IFTA · driver reference · fuel tax records",
  bodyHTML: `
    <h1>IFTA · driver guide</h1>
    <p class="meta">For <strong>${escapeHtml(data.driverName || "Sample Driver")}</strong>${data.carrierName ? ` · ${escapeHtml(data.carrierName)}` : ""}</p>

    <div class="callout">
      You don't file IFTA · the carrier does. But the carrier's filing depends 100% on what you record: miles per state, gallons purchased + where, and fuel receipts that survive 4 years of audit. This is your part.
    </div>

    <h2>I · What you must capture on every trip</h2>
    <ol>
      <li><strong>Beginning + ending odometer</strong> for the trip</li>
      <li><strong>Beginning + ending odometer at each state line</strong> · or GPS-equivalent breadcrumbs if your ELD does it</li>
      <li><strong>Every fuel purchase</strong> · gallons + state of purchase + price + vendor</li>
      <li><strong>Every fuel receipt</strong> · scanned or paper · with date, vendor name + address, gallons, fuel type</li>
      <li><strong>Route reasonable</strong> · the trip log should match where the truck actually drove · no "ghost" trips</li>
    </ol>

    <h2>II · What makes a fuel receipt audit-proof</h2>
    <ul>
      <li><strong>Vendor name + address</strong> · printed, not handwritten</li>
      <li><strong>Date of purchase</strong> · within the quarter you're claiming</li>
      <li><strong>Vehicle ID or truck number</strong> · written on the receipt if not auto-printed</li>
      <li><strong>Fuel type</strong> (diesel · gasoline · DEF separately)</li>
      <li><strong>Number of gallons</strong> · legible</li>
      <li><strong>Price per gallon</strong></li>
      <li><strong>Total dollar amount</strong></li>
      <li><strong>Pump number</strong> · if printed</li>
    </ul>
    <p class="meta">If anything is missing or unreadable, the audit will treat the fuel as if it was purchased outside of IFTA jurisdictions · you lose the tax credit.</p>

    <h2>III · The state-line procedure</h2>
    <ol>
      <li><strong>Note the odometer</strong> at each state line crossing · before + after</li>
      <li><strong>If using an ELD with state-line capture</strong> · confirm it's tracking · scroll to mileage-by-state view + verify</li>
      <li><strong>If hand-tracking</strong> · use the trip envelope or app the carrier provides · take the photo before you cross</li>
      <li><strong>Match fuel purchases to the state</strong> they were bought in · not the state you happened to be near</li>
      <li><strong>End-of-day</strong> · review the day's state-line mileage vs your total odometer change · they should add up</li>
    </ol>

    <h2>IV · What gets you in trouble</h2>
    <ul>
      <li><strong>Missing fuel receipts</strong> · #1 driver-caused IFTA cost</li>
      <li><strong>Forgotten state-line miles</strong> · entire state gets allocated zero · audit math gets ugly</li>
      <li><strong>Fuel + miles inconsistent</strong> · 500 gallons bought, 800 miles driven · MPG that defies physics</li>
      <li><strong>Personal use mixed in</strong> · taking the truck home + back doesn't count as carrier miles unless documented</li>
      <li><strong>Dead-head miles</strong> not recorded · empty miles still count for IFTA · all miles count</li>
    </ul>

    <div class="callout">
      <strong>Scan every fuel receipt before you walk away from the pump.</strong> X3 Compass's driver app lets you snap a photo · it auto-extracts the date, gallons, state, vendor, total · and ties it to your trip + truck. One missing receipt costs the carrier the full state tax on those gallons.
    </div>
  `,
});

/* ---- 45. ifta-employer-playbook ---- */

export const iftaEmployerPlaybook: TemplateFn<{ carrierName?: string; safetyDirectorName?: string }> = (data) => ({
  version: "1.0",
  title: `IFTA · Employer Playbook · ${data.carrierName || "Sample Carrier"}`,
  headerSubtitle: "IFTA · employer playbook · base-jurisdiction filing",
  bodyHTML: `
    <h1>IFTA · employer playbook</h1>
    <p class="meta">For ${escapeHtml(data.safetyDirectorName ? `${data.safetyDirectorName} · ` : "")}<strong>${escapeHtml(data.carrierName || "Sample Carrier")}</strong></p>

    <div class="callout">
      IFTA is the highest-blast-radius compliance area that isn't FMCSA-regulated. Penalties compound across jurisdictions, audits go back 4 years, and a single missing receipt can disallow an entire fuel purchase. Treat the IFTA program with the same seriousness as DOT.
    </div>

    <h2>I · The standing carrier duties</h2>
    <ol>
      <li><strong>Register</strong> with your base jurisdiction · obtain IFTA license + decals · place decals on each side of every qualified vehicle</li>
      <li><strong>Track miles by jurisdiction</strong> for every qualifying vehicle · monthly + roll-up quarterly</li>
      <li><strong>Track fuel purchases by jurisdiction</strong> · gallons + tax-paid amount</li>
      <li><strong>File the quarterly return</strong> · April 30 / July 31 / October 31 / January 31</li>
      <li><strong>Pay the net</strong> due to the base jurisdiction · they redistribute</li>
      <li><strong>Retain records</strong> for 4 years from due date of the return (or actual filing if later)</li>
    </ol>

    <h2>II · The data flow</h2>
    <table>
      <thead><tr><th style="width:35%">Source</th><th>What you collect</th></tr></thead>
      <tbody>
        <tr><td>ELD or GPS</td><td>Miles per jurisdiction per vehicle · timestamped</td></tr>
        <tr><td>Fuel-card system (Comdata, EFS, etc.)</td><td>Gallons + jurisdiction + price + vehicle</td></tr>
        <tr><td>Cash / card receipts</td><td>Same fields manually entered + receipt image</td></tr>
        <tr><td>Trip envelopes</td><td>Driver-recorded miles + fuel for hand-filed routes</td></tr>
        <tr><td>Bulk fuel deliveries (if you operate a fuel island)</td><td>Gallons dispensed + state where dispensed + tax-paid invoices</td></tr>
      </tbody>
    </table>

    <h2>III · The quarterly close ritual</h2>
    <ol>
      <li><strong>Reconcile ELD miles vs odometer reports</strong> · catch GPS dropouts</li>
      <li><strong>Reconcile fuel-card data vs receipts</strong> · catch missing transactions</li>
      <li><strong>Calculate fleet MPG</strong> · total miles ÷ total gallons</li>
      <li><strong>Allocate gallons consumed per state</strong> · miles in state ÷ fleet MPG</li>
      <li><strong>Apply state tax rates</strong> · current rate × consumed gallons = tax owed per state</li>
      <li><strong>Subtract tax-paid credits</strong> · gallons purchased per state × rate = credit per state</li>
      <li><strong>Net per state · sum across states</strong> · this is the return total</li>
      <li><strong>File + pay</strong> via your base jurisdiction's IFTA portal</li>
    </ol>

    <h2>IV · Audit findings + how to avoid them</h2>
    <ul>
      <li><strong>Missing receipts</strong> · most common · disallow the tax-paid credit + bill the full tax on consumed gallons · 4 years' worth · brutal · fix by scanning every receipt the day it's purchased</li>
      <li><strong>Mileage by jurisdiction unsupported</strong> · the ELD output doesn't break out by state, hand records aren't in file · fix by using an ELD with state-line tracking or a dedicated IFTA app</li>
      <li><strong>MPG outside reasonable range</strong> · 4-12 MPG for diesel CMVs · outside is audit-bait</li>
      <li><strong>Personal use mileage in business miles</strong> · driver taking truck home counted as business · separate personal use from IFTA</li>
      <li><strong>No proof of decals on vehicles</strong> · photo each cab's decal annually · file in unit's maintenance record</li>
      <li><strong>Zero-return not filed</strong> · forgot to file a quarter because there was no activity · still owes the filing · $50-200 penalty + interest</li>
    </ul>

    <div class="callout">
      <strong>Run the IFTA reconciliation mid-quarter</strong> · not in the final week. The patterns auditors flag (MPG anomalies, missing receipts, mileage gaps) are easy to fix when caught early + nightmare when found 18 months later in an audit.
    </div>
  `,
});

/* ---- 46. accidents-auditor-export-guide ---- */

export const accidentsAuditorExportGuide: TemplateFn<{ carrierName?: string; auditWindow?: string }> = (data) => ({
  version: "1.0",
  title: `Accidents · Auditor Export Guide · ${data.carrierName || "Sample Carrier"}`,
  headerSubtitle: "Accidents · auditor reference · 49 CFR §390.15",
  bodyHTML: `
    <h1>Accidents · auditor export guide</h1>
    <p class="meta">For <strong>${escapeHtml(data.carrierName || "Sample Carrier")}</strong> · audit window <strong>${escapeHtml(data.auditWindow || "last 3 years")}</strong></p>

    <div class="callout">
      §390.15 requires every motor carrier to maintain an Accident Register for 3 years. Every DOT-reportable accident must be in it. Investigators cross-reference the register against state SDR data, your insurance claims, and roadside inspection reports involving the same units · gaps trigger deeper review.
    </div>

    <h2>I · The Accident Register elements (§390.15(b))</h2>
    <ol>
      <li>Date of accident</li>
      <li>City or town + state where accident occurred</li>
      <li>Driver name</li>
      <li>Number of injuries</li>
      <li>Number of fatalities</li>
      <li>Whether hazardous materials (other than fuel from the tractor tank) were released</li>
      <li>Copy of any accident report required by State / local authority</li>
    </ol>

    <h2>II · Per-accident audit pull</h2>
    <ol>
      <li><strong>Accident Register entry</strong> · with all 7 elements</li>
      <li><strong>Police accident report</strong> · attached</li>
      <li><strong>Post-accident D&A test result + decision documentation</strong> · §382.303 applied · if not tested, the documented reason</li>
      <li><strong>ELD output</strong> for 24 hours surrounding the accident</li>
      <li><strong>DVIRs</strong> for the unit covering the 7 days before the accident</li>
      <li><strong>Maintenance + repair records</strong> for the unit, last 6 months</li>
      <li><strong>Driver's HOS records</strong> for the 8 days surrounding the accident</li>
      <li><strong>Driver file</strong> · all §391.51 documents · current at time of accident</li>
      <li><strong>Insurance claim file</strong> · if any</li>
      <li><strong>CPDP filing</strong> · if you challenged the crash's preventability · with FMCSA decision letter</li>
    </ol>

    <h2>III · What investigators cross-reference</h2>
    <table>
      <thead><tr><th style="width:40%">Source A</th><th style="width:40%">Source B</th><th>What gets flagged</th></tr></thead>
      <tbody>
        <tr><td>State SDR for the same crash</td><td>Your Accident Register</td><td>SDR exists but no register entry · failure to record</td></tr>
        <tr><td>Driver's HOS records</td><td>Time of crash</td><td>Driver was over 11 hr drive or 14 hr window · acute HOS violation contributing to crash</td></tr>
        <tr><td>Maintenance records</td><td>Cause of crash</td><td>Mechanical issue caused crash + appears as known defect in prior DVIR · negligent maintenance</td></tr>
        <tr><td>Post-accident D&A test result</td><td>Crash severity criteria</td><td>Test required by §382.303 but not done + no documented reason</td></tr>
        <tr><td>Roadside inspection violations</td><td>Crashes following the violation</td><td>Pattern of OOS defects on the unit · CSA + audit risk</td></tr>
      </tbody>
    </table>

    <h2>IV · The X3 Compass accident audit packet</h2>
    <ol>
      <li>Navigate to <strong>Audit Export</strong> · select scope <strong>Accidents</strong></li>
      <li>Select date range</li>
      <li>Click <strong>Generate audit packet</strong> · X3 builds: Accident Register table + per-accident PDF bundle (register entry, police report, D&A test result, ELD pull, DVIR window, maintenance records, driver file snapshot, CPDP filing)</li>
      <li>The packet is timestamped + lineage-traced via the audit ledger</li>
    </ol>

    <div class="callout">
      <strong>The audit defense is the per-accident packet</strong> · not the register table. Investigators want to see that, for every entry, you can produce the surrounding evidence in seconds. If you can't, the register entry itself becomes suspect.
    </div>
  `,
});

/* ---- 47. medical-card-auditor-export-guide ---- */

export const medicalCardAuditorExportGuide: TemplateFn<{ carrierName?: string; auditWindow?: string }> = (data) => ({
  version: "1.0",
  title: `Medical Card · Auditor Export Guide · ${data.carrierName || "Sample Carrier"}`,
  headerSubtitle: "Medical card · auditor reference · 49 CFR §391.41-§391.45",
  bodyHTML: `
    <h1>Medical card · auditor export guide</h1>
    <p class="meta">For <strong>${escapeHtml(data.carrierName || "Sample Carrier")}</strong> · audit window <strong>${escapeHtml(data.auditWindow || "current + 3 prior years")}</strong></p>

    <div class="callout">
      Medical-card violations are the #1 driver-related citation in CSA. An auditor will sample drivers + check whether (a) the cert was current at every moment of operation, (b) the examiner was on the NRCME at the time of exam, (c) CDLIS showed certified status.
    </div>

    <h2>I · Per-driver pull</h2>
    <ol>
      <li><strong>Current medical examiner's certificate</strong> · paper copy + scan in driver file</li>
      <li><strong>Prior medical certificates</strong> · for the audit window · in chronological order</li>
      <li><strong>NRCME verification log entries</strong> · examiner name + registry ID + date verified · for each exam</li>
      <li><strong>CDLIS status confirmation</strong> · screenshot or printout showing "certified" with the corresponding effective date</li>
      <li><strong>Short-cert documentation</strong> · for any 1-year or 3-month card · the underlying condition + treating-provider letter + compliance evidence (CPAP report, A1c result, BP log)</li>
      <li><strong>FMCSA exemption letters</strong> · for ITDM, vision, hearing, or seizure exemptions if applicable</li>
    </ol>

    <h2>II · What the auditor looks for</h2>
    <ul>
      <li><strong>Gap in coverage</strong> · any day where the driver was on the road without a valid card</li>
      <li><strong>Examiner not on NRCME at time of exam</strong> · the registry is real-time · check at the time of exam, not the time of audit</li>
      <li><strong>CDLIS "not certified"</strong> · paper card was current but state wasn't updated · acute OOS</li>
      <li><strong>Short-cert ignored</strong> · 3-month card became 18 months · no renewal record</li>
      <li><strong>ITDM driver without exemption</strong> · insulin-treated driver still operating without §391.46 exemption</li>
      <li><strong>Vision / hearing exemption expired</strong> · annual reverification skipped</li>
    </ul>

    <h2>III · The verification log format</h2>
    <table>
      <thead><tr><th>Driver</th><th>Exam date</th><th>Examiner name</th><th>NRCME #</th><th>Verified by + date</th><th>Cert expires</th></tr></thead>
      <tbody>
        <tr><td>____________</td><td>____________</td><td>____________</td><td>____________</td><td>____________</td><td>____________</td></tr>
        <tr><td>____________</td><td>____________</td><td>____________</td><td>____________</td><td>____________</td><td>____________</td></tr>
      </tbody>
    </table>
    <p class="meta">Maintain a per-carrier log AND a per-driver file entry. The cross-reference is what defends the program in an audit.</p>

    <h2>IV · The X3 Compass medical-card audit packet</h2>
    <ol>
      <li>Navigate to <strong>Audit Export</strong> · select scope <strong>Medical Cards</strong></li>
      <li>Select drivers + window</li>
      <li>Click <strong>Generate audit packet</strong> · X3 builds: per-driver cert history, NRCME verification log entries, CDLIS status snapshots, exemption letters, short-cert compliance evidence</li>
      <li>The packet has version + content hash · audit-traceable</li>
    </ol>

    <div class="callout">
      <strong>The verification date matters as much as the cert itself.</strong> A driver presents a card from an unregistered examiner · if you didn't verify NRCME at the time, you don't have a valid medical certification. The §391.23(m) finding is one of the most-cited in any DQF audit.
    </div>
  `,
});

/* ---- 48. inspections-employer-playbook ---- */

export const inspectionsEmployerPlaybook: TemplateFn<{ carrierName?: string; safetyDirectorName?: string }> = (data) => ({
  version: "1.0",
  title: `Inspections · Employer Playbook · ${data.carrierName || "Sample Carrier"}`,
  headerSubtitle: "Inspections · employer playbook · 49 CFR §396",
  bodyHTML: `
    <h1>Roadside inspections · employer playbook</h1>
    <p class="meta">For ${escapeHtml(data.safetyDirectorName ? `${data.safetyDirectorName} · ` : "")}<strong>${escapeHtml(data.carrierName || "Sample Carrier")}</strong></p>

    <div class="callout">
      Each roadside inspection generates one CSA event. The cumulative score from your inspections drives 4 of the 7 BASICs. Treat the post-inspection workflow as the single highest-leverage operational ritual you run.
    </div>

    <h2>I · The 24-hour / 15-day / 30-day clock</h2>
    <table>
      <thead><tr><th style="width:18%">When</th><th>Carrier action</th><th>CFR</th></tr></thead>
      <tbody>
        <tr><td><strong>Driver delivers report</strong></td><td>Driver hands carrier a copy within 24 hr</td><td><span class="cfr">§396.9(d)(1)</span></td></tr>
        <tr><td><strong>Within 15 days</strong></td><td>Carrier signs the §396.9(d)(3) certification, documents every correction, returns the original to issuing state</td><td><span class="cfr">§396.9(d)(3)</span></td></tr>
        <tr><td><strong>Within 30 days</strong></td><td>CSA score updates · review impact · open DataQ challenges for any incorrect violations</td><td>SMS</td></tr>
        <tr><td><strong>Within 60 days</strong></td><td>Document corrective training, retraining, or progressive discipline for the driver</td><td>Industry practice</td></tr>
      </tbody>
    </table>

    <h2>II · The post-inspection workflow</h2>
    <ol>
      <li><strong>Driver uploads report</strong> · ideally via X3 Compass mobile · scan or photo · within 24 hr</li>
      <li><strong>Safety reviews</strong> · check every violation against actual vehicle / driver / paperwork · note OOS items</li>
      <li><strong>Truck stays OOS until corrected</strong> · for any OOS-marked defect · §396.9(c)(2)</li>
      <li><strong>Mechanic certifies repairs</strong> · on the same report or carrier's internal form</li>
      <li><strong>Driver review-signs</strong> · before driving the unit again · acknowledges repair</li>
      <li><strong>Carrier signs §396.9(d)(3) certification</strong> · "this report has been received, the violations listed have been corrected, and a copy of this report is being kept on file"</li>
      <li><strong>Return original to issuing state</strong> · via mail or upload (state-specific)</li>
      <li><strong>File a copy</strong> in the unit's maintenance record + the driver's file · 12 months minimum</li>
      <li><strong>If a violation is wrong</strong> · open DataQ challenge within 30 days · upload evidence</li>
    </ol>

    <h2>III · The DataQ filter</h2>
    <p>For every violation, decide:</p>
    <ul>
      <li><strong>Accurate + uncontested</strong> · accept · document corrective action · pay any fine · close</li>
      <li><strong>Accurate but wrong CFR cited</strong> · DataQ challenge to reclassify · reduces severity weight if successful</li>
      <li><strong>Inaccurate · OOS that wasn't OOS</strong> · DataQ challenge with measurement evidence · high success rate</li>
      <li><strong>Inaccurate · wrong driver / wrong unit</strong> · DataQ challenge with photo / log evidence · clear-cut</li>
      <li><strong>Inaccurate · inspector procedural error</strong> · DataQ challenge citing FMCSA Inspection Procedures Manual · narrow but legitimate</li>
    </ul>

    <h2>IV · Pattern monitoring + driver coaching</h2>
    <ol>
      <li><strong>Per-driver inspection rate</strong> · track violations per inspection per driver · spot patterns</li>
      <li><strong>Per-unit defect history</strong> · same defect twice on the same unit = maintenance program failure</li>
      <li><strong>Per-state inspection rate</strong> · some states inspect at 3-5× the national rate · expect more events in those lanes</li>
      <li><strong>Monthly inspection review meeting</strong> · safety + operations + maintenance · review every event from the past 30 days · what went wrong, what changed</li>
      <li><strong>Driver coaching</strong> · for any driver with 2+ inspections in 30 days with violations · sit-down + retraining + documented in driver file</li>
    </ol>

    <div class="callout">
      <strong>The 15-day certified-correction window is the single most-missed compliance deadline in trucking.</strong> A signed certification, mailed in an envelope, takes 5 minutes · missing it locks the violations into your CSA score permanently. X3 Compass auto-generates the §396.9(d)(3) cover letter on inspection upload.
    </div>
  `,
});

/* ---- 49. annual-violation-self-cert · §391.27 driver-completes form ---- */

export const annualViolationSelfCert: TemplateFn<{ carrierName?: string; driverName?: string; certYear?: string }> = (data) => ({
  version: "1.0",
  title: `Annual Violation Self-Cert · ${data.driverName || "Sample Driver"}`,
  headerSubtitle: "Annual violation self-certification · 49 CFR §391.27",
  bodyHTML: `
    <h1>Annual driver's certification of violations</h1>
    <p class="meta">${escapeHtml(data.carrierName || "Sample Carrier")} · for <strong>${escapeHtml(data.driverName || "Sample Driver")}</strong> · certification for year <strong>${escapeHtml(data.certYear || "____________")}</strong></p>

    <div class="callout">
      §391.27 requires each commercial motor vehicle driver to furnish their employer, by the anniversary date each year, a list of all motor-vehicle violations of which the driver has been convicted (or forfeited bond / collateral) during the preceding 12 months.
    </div>

    <h2>I · Driver's certification</h2>
    <p>I, the undersigned, am required by 49 CFR §391.27 to list, on the form below, all violations of motor vehicle traffic laws and ordinances (other than violations involving only parking) for which I have been convicted, or forfeited bond or collateral, during the past 12 months.</p>

    <h2>II · Violation list (past 12 months)</h2>
    <table>
      <thead><tr><th style="width:15%">Date of conviction</th><th style="width:30%">Violation / charge</th><th style="width:18%">Location (city / state)</th><th style="width:22%">Type of CMV / personal vehicle</th><th style="width:15%">Penalty</th></tr></thead>
      <tbody>
        <tr><td>____________</td><td>____________</td><td>____________</td><td>____________</td><td>____________</td></tr>
        <tr><td>____________</td><td>____________</td><td>____________</td><td>____________</td><td>____________</td></tr>
        <tr><td>____________</td><td>____________</td><td>____________</td><td>____________</td><td>____________</td></tr>
        <tr><td>____________</td><td>____________</td><td>____________</td><td>____________</td><td>____________</td></tr>
        <tr><td>____________</td><td>____________</td><td>____________</td><td>____________</td><td>____________</td></tr>
      </tbody>
    </table>

    <p>☐ <strong>None</strong> · I have not been convicted of, nor forfeited bond or collateral for, any motor-vehicle violation (other than parking) during the past 12 months.</p>

    <h2>III · Certification</h2>
    <p>I certify that the above information is true and complete to the best of my knowledge. I understand that:</p>
    <ul>
      <li>Furnishing false information is grounds for disqualification</li>
      <li>Omitting a conviction known to me is itself a violation of §391.27</li>
      <li>My carrier will cross-reference this list against my MVR · any discrepancy will be investigated</li>
      <li>Any state-issued conviction must be reported to my CDL-issuing state within 30 days · §383.31 · regardless of vehicle (CMV or personal)</li>
    </ul>

    <table style="margin-top: 0.3in;">
      <tbody>
        <tr><td style="width:60%; padding: 16px 8px;"><div class="signature-line"></div><div class="signature-label">Driver signature</div></td><td style="width:40%; padding: 16px 8px;"><div class="signature-line"></div><div class="signature-label">Date</div></td></tr>
        <tr><td style="padding: 16px 8px;"><div class="signature-line"></div><div class="signature-label">Driver printed name</div></td><td style="padding: 16px 8px;"><div class="signature-line"></div><div class="signature-label">CDL number + state</div></td></tr>
      </tbody>
    </table>

    <p class="meta" style="margin-top: 0.2in;">This certification satisfies 49 CFR §391.27. File in the driver's DQ file. Retain for the duration of employment plus 3 years.</p>
  `,
});

/* ---- 50. road-test-certificate · §391.31 + §391.33 ---- */

export const roadTestCertificate: TemplateFn<{ carrierName?: string; driverName?: string; examinerName?: string; testDate?: string; vehicleType?: string }> = (data) => ({
  version: "1.0",
  title: `Road Test Certificate · ${data.driverName || "Sample Driver"}`,
  headerSubtitle: "Road test certificate · 49 CFR §391.31",
  bodyHTML: `
    <h1>Road test certificate</h1>
    <p class="meta">${escapeHtml(data.carrierName || "Sample Carrier")} · for <strong>${escapeHtml(data.driverName || "Sample Driver")}</strong> · tested <strong>${escapeHtml(data.testDate || "____________")}</strong></p>

    <div class="callout">
      §391.31 requires every motor carrier to road-test a driver (or accept §391.33 equivalent CDL on file) before placing them in safety-sensitive duty. This certificate documents the road test and goes in the driver's §391.51 DQ file.
    </div>

    <h2>I · Vehicle used for the road test</h2>
    <p><strong>Type of vehicle / configuration:</strong> ${escapeHtml(data.vehicleType || "____________________________________")} (e.g., Class A combination tractor-semitrailer · Class B straight truck · Class C with hazmat / passenger endorsement)</p>
    <p class="meta">§391.31(d): The road test must be given in the type of motor vehicle that the driver will operate.</p>

    <h2>II · Test items inspected + driver demonstrated · §391.31(c)</h2>
    <table>
      <thead><tr><th style="width:65%">Item</th><th style="width:35%">Satisfactory? (✓ / ✗)</th></tr></thead>
      <tbody>
        <tr><td>Pre-trip inspection of the vehicle · driver demonstrates DVIR walk-around</td><td>____________</td></tr>
        <tr><td>Coupling + uncoupling of trailer (if applicable)</td><td>____________</td></tr>
        <tr><td>Placement of vehicle in operation · proper position, mirrors, controls</td><td>____________</td></tr>
        <tr><td>Use of vehicle's controls · steering, gearshift, brakes</td><td>____________</td></tr>
        <tr><td>Operating vehicle in traffic + passing other vehicles</td><td>____________</td></tr>
        <tr><td>Turning the vehicle · left + right · various street widths</td><td>____________</td></tr>
        <tr><td>Braking + slowing vehicle by means other than brakes (engine, retarder)</td><td>____________</td></tr>
        <tr><td>Backing + parking the vehicle · straight, alley dock, parallel</td><td>____________</td></tr>
      </tbody>
    </table>

    <h2>III · Examiner's evaluation</h2>
    <p>Based on the road test, the driver named above:</p>
    <ul>
      <li>☐ <strong>Passed</strong> · demonstrates sufficient skill to operate the type of vehicle indicated</li>
      <li>☐ <strong>Failed</strong> · does not demonstrate sufficient skill · re-test required</li>
      <li>☐ <strong>Partial pass with corrective training</strong> · skill demonstrated but specific items need remediation before independent operation</li>
    </ul>

    <p>Corrective training items (if applicable):</p>
    <p style="border-bottom: 1px solid #94A3B8; min-height: 0.5in;">&nbsp;</p>
    <p style="border-bottom: 1px solid #94A3B8; min-height: 0.5in;">&nbsp;</p>

    <h2>IV · Certification</h2>
    <p>I certify that the above-named driver was given a road test under my supervision on the date shown, consisting of the operations and maneuvers described above, in a motor vehicle of the type the driver is to operate. The road test was sufficient to enable me to evaluate the driver's skill to handle the motor vehicle.</p>

    <table style="margin-top: 0.2in;">
      <tbody>
        <tr><td style="width:55%; padding: 12px 8px;"><div class="signature-line"></div><div class="signature-label">Examiner signature</div></td><td style="width:45%; padding: 12px 8px;"><div class="signature-line"></div><div class="signature-label">Date</div></td></tr>
        <tr><td style="padding: 12px 8px;"><div class="signature-line"></div><div class="signature-label">Examiner: ${escapeHtml(data.examinerName || "____________________")}</div></td><td style="padding: 12px 8px;"><div class="signature-line"></div><div class="signature-label">Examiner title + qualifications</div></td></tr>
      </tbody>
    </table>

    <p class="meta" style="margin-top: 0.2in;">Pursuant to §391.33, a CDL of the proper class held by the driver from a state that requires a road test for that class is an acceptable equivalent. In that case, the CDL copy serves in place of this certificate. Otherwise, file this certificate in the driver's DQ file. Retain for duration of employment + 3 years.</p>
  `,
});

/* ---- 51. driver-application-form · §391.21 long-form ---- */

export const driverApplicationForm: TemplateFn<{ carrierName?: string; applicantName?: string }> = (data) => ({
  version: "1.0",
  title: `Driver Application for Employment · ${data.applicantName || "Applicant"}`,
  headerSubtitle: "Driver application · 49 CFR §391.21",
  bodyHTML: `
    <h1>Application for employment · CDL driver</h1>
    <p class="meta">${escapeHtml(data.carrierName || "Sample Carrier")} · applicant <strong>${escapeHtml(data.applicantName || "____________")}</strong></p>

    <div class="callout">
      §391.21 requires the driver application to capture specific information before a motor carrier may employ a driver. This form satisfies §391.21(b)(1)-(11). All sections must be completed; "N/A" if a section does not apply.
    </div>

    <h2>I · Applicant identification</h2>
    <table>
      <tbody>
        <tr><td style="width:35%">Full legal name</td><td>____________________________________________</td></tr>
        <tr><td>Date of birth</td><td>____________________________________________</td></tr>
        <tr><td>Social Security number (last 4)</td><td>____________________________________________</td></tr>
        <tr><td>Current address</td><td>____________________________________________</td></tr>
        <tr><td>Phone</td><td>____________________________________________</td></tr>
        <tr><td>Email</td><td>____________________________________________</td></tr>
      </tbody>
    </table>

    <h2>II · 3-year residence history · §391.21(b)(2)</h2>
    <table>
      <thead><tr><th>From / to</th><th>City + state</th></tr></thead>
      <tbody>
        <tr><td>____________</td><td>____________________________________________</td></tr>
        <tr><td>____________</td><td>____________________________________________</td></tr>
        <tr><td>____________</td><td>____________________________________________</td></tr>
      </tbody>
    </table>

    <h2>III · License + certifications · §391.21(b)(3)-(5)</h2>
    <table>
      <thead><tr><th>State</th><th>License #</th><th>Class + endorsements</th><th>Expires</th><th>Issued</th></tr></thead>
      <tbody>
        <tr><td>____________</td><td>____________</td><td>____________</td><td>____________</td><td>____________</td></tr>
        <tr><td>____________</td><td>____________</td><td>____________</td><td>____________</td><td>____________</td></tr>
      </tbody>
    </table>
    <p>Have you ever held a CDL in any other state? ☐ Yes ☐ No · If yes, list above.</p>
    <p>Has your CDL ever been suspended, revoked, or canceled? ☐ Yes ☐ No · If yes, explain: ______________________________</p>

    <h2>IV · 10-year employment history · §391.21(b)(10)</h2>
    <p>List ALL employment, including unemployment + military service, in chronological order from most recent. Specifically identify each employer where you operated a CMV. Use additional sheets if needed.</p>
    <table>
      <thead><tr><th style="width:18%">From / to</th><th>Employer + address</th><th>Position</th><th>Reason for leaving</th><th>CMV?</th></tr></thead>
      <tbody>
        <tr><td>____________</td><td>____________</td><td>____________</td><td>____________</td><td>Y / N</td></tr>
        <tr><td>____________</td><td>____________</td><td>____________</td><td>____________</td><td>Y / N</td></tr>
        <tr><td>____________</td><td>____________</td><td>____________</td><td>____________</td><td>Y / N</td></tr>
        <tr><td>____________</td><td>____________</td><td>____________</td><td>____________</td><td>Y / N</td></tr>
        <tr><td>____________</td><td>____________</td><td>____________</td><td>____________</td><td>Y / N</td></tr>
      </tbody>
    </table>

    <h2>V · Accidents + violations · §391.21(b)(7)-(9)</h2>
    <p>List all motor-vehicle accidents in which you were involved during the past 3 years:</p>
    <table>
      <thead><tr><th style="width:18%">Date</th><th>Location</th><th>Nature (fatality / injury / property)</th><th>Hazmat released?</th></tr></thead>
      <tbody>
        <tr><td>____________</td><td>____________</td><td>____________</td><td>____________</td></tr>
        <tr><td>____________</td><td>____________</td><td>____________</td><td>____________</td></tr>
      </tbody>
    </table>
    <p>List all motor-vehicle traffic-law violation convictions during the past 3 years (other than parking):</p>
    <table>
      <thead><tr><th style="width:18%">Date</th><th>Charge</th><th>Location</th><th>Penalty</th></tr></thead>
      <tbody>
        <tr><td>____________</td><td>____________</td><td>____________</td><td>____________</td></tr>
        <tr><td>____________</td><td>____________</td><td>____________</td><td>____________</td></tr>
      </tbody>
    </table>

    <h2>VI · Driver certification · §391.21(b)(11)</h2>
    <p>I certify that I am physically qualified to drive a motor vehicle under §391.41 and that my answers above are true and complete to the best of my knowledge. I understand that any false statement may result in disqualification under §391.15.</p>

    <table style="margin-top: 0.2in;">
      <tbody>
        <tr><td style="width:60%; padding: 12px 8px;"><div class="signature-line"></div><div class="signature-label">Applicant signature</div></td><td style="width:40%; padding: 12px 8px;"><div class="signature-line"></div><div class="signature-label">Date</div></td></tr>
      </tbody>
    </table>

    <p class="meta" style="margin-top: 0.15in;">This form satisfies 49 CFR §391.21. File in the driver's DQ file. Retain for the duration of employment + 3 years (§391.51(d)).</p>
  `,
});

/* ============================================================
   BATCH 9 · FINAL · operational + form templates · 52→60
   ============================================================ */

/* ---- 52. spill-response-procedure · §171.15 + §172.602 ---- */

export const spillResponseProcedure: TemplateFn<{ carrierName?: string; driverName?: string }> = (data) => ({
  version: "1.0",
  title: `Hazmat Spill Response · ${data.driverName || "Sample Driver"}`,
  headerSubtitle: "Hazmat spill response · 49 CFR §171.15 + §172.602",
  bodyHTML: `
    <h1>Hazmat spill / incident response · driver procedure</h1>
    <p class="meta">For <strong>${escapeHtml(data.driverName || "Sample Driver")}</strong>${data.carrierName ? ` · ${escapeHtml(data.carrierName)}` : ""} · keep in the cab with shipping papers</p>

    <div class="callout">
      A hazmat incident is anything from a small drip to a catastrophic release. Federal law (§171.15) sets the reporting timeline; the Emergency Response Guidebook (ERG) tells you the immediate response. This card walks you through both.
    </div>

    <h2>I · First 5 minutes</h2>
    <ol>
      <li><strong>Safety first</strong> · move yourself + bystanders upwind, uphill, away from the leak · don't be a hero</li>
      <li><strong>Call 911</strong> · "I have a hazmat release from a commercial vehicle" · give exact location · stay on the line</li>
      <li><strong>Call the 24-hour emergency response number</strong> on the shipping paper (CHEMTREC: 1-800-424-9300 if no number on paper) · they coordinate with responders</li>
      <li><strong>Set out warning devices</strong> upwind of the release · keep traffic away from the cloud or pool</li>
      <li><strong>Stay with the truck</strong> if safe · keep shipping papers + ERG accessible · responders will need them</li>
    </ol>

    <h2>II · What to tell the dispatcher / responder</h2>
    <ul>
      <li><strong>Your exact location</strong> · mile marker, intersection, GPS</li>
      <li><strong>UN/NA number + proper shipping name</strong> from the shipping paper</li>
      <li><strong>Hazard class</strong> from the placard + shipping paper</li>
      <li><strong>Total quantity onboard</strong> · approximate amount released vs still contained</li>
      <li><strong>Whether anyone is injured</strong> · how many · what condition</li>
      <li><strong>Weather + wind direction</strong> · drives the response perimeter</li>
      <li><strong>Whether the leak is contained</strong> · puddle, vapor, ongoing, or stopped</li>
    </ul>

    <h2>III · Federal reporting · §171.15 immediate notice + §171.16 written report</h2>
    <p>Carrier must call the National Response Center at <strong>1-800-424-8802</strong> within 12 hours when any of these occur:</p>
    <ul>
      <li>A person is killed</li>
      <li>A person receives injuries requiring hospitalization</li>
      <li>Estimated property damage exceeds $50,000</li>
      <li>An evacuation of the general public occurs lasting one or more hours</li>
      <li>One or more major transportation arteries / facilities are closed for one or more hours</li>
      <li>The operational flight pattern or routine of an aircraft is altered</li>
      <li>Fire, breakage, spillage, or suspected contamination occurs involving radioactive material</li>
      <li>Fire, breakage, spillage, or suspected contamination occurs involving infectious substance</li>
      <li>A release of marine pollutant in a quantity ≥119 gallons (450 L) or ≥882 lb (400 kg)</li>
      <li>A situation exists where a continuing danger to life exists at the scene</li>
    </ul>
    <p>Written follow-up report (DOT Form F 5800.1) due within 30 days · §171.16.</p>

    <h2>IV · What NOT to do</h2>
    <ul>
      <li><strong>Don't smoke or strike a flame</strong> within 100 ft · flammables, oxidizers, even some non-flammables emit explosive vapors</li>
      <li><strong>Don't touch or breathe</strong> the released material · even if you think it's safe · PPE is required for any direct contact</li>
      <li><strong>Don't attempt cleanup</strong> beyond stopping the leak (if safe) · spill cleanup is regulated · responders + contractors handle it</li>
      <li><strong>Don't move the truck</strong> if it would worsen the release · don't drive away · §171.15 + §177.854</li>
      <li><strong>Don't talk to media or post on social</strong> · refer them to dispatcher / corporate</li>
    </ul>

    <div class="callout">
      <strong>The shipping paper + ERG are the two most valuable tools at the scene.</strong> The shipping paper tells responders what's in the truck. The ERG (orange book in the cab) tells them how to handle it. Hand both to the incident commander.
    </div>
  `,
});

/* ---- 53. personal-conveyance-rules · §395.1(g)(2) + FMCSA guidance ---- */

export const personalConveyanceRules: TemplateFn<{ carrierName?: string; driverName?: string }> = (data) => ({
  version: "1.0",
  title: `Personal Conveyance Rules · ${data.driverName || "Sample Driver"}`,
  headerSubtitle: "Personal conveyance · 49 CFR §395.1(b)(1) · FMCSA guidance",
  bodyHTML: `
    <h1>Personal conveyance · what counts and what doesn't</h1>
    <p class="meta">For <strong>${escapeHtml(data.driverName || "Sample Driver")}</strong>${data.carrierName ? ` · ${escapeHtml(data.carrierName)}` : ""}</p>

    <div class="callout">
      Personal conveyance (PC) lets you move a CMV off-duty for personal reasons without those miles counting against your HOS clock. Misused, it's a falsification finding (§395.8(e)) · a 10× CSA severity violation. This guide is what FMCSA actually allows.
    </div>

    <h2>I · What FMCSA defines as PC (§395.1(b)(1) + 2018 guidance)</h2>
    <p>PC is the movement of a CMV "for personal reasons unrelated to the work of the motor carrier." Specifically allowed (when carrier policy permits):</p>
    <ul>
      <li><strong>Time spent at lodging</strong> · driving from your tractor to a restaurant or to a motel · while still on a rest break</li>
      <li><strong>Commuting to/from your home</strong> from the carrier's terminal</li>
      <li><strong>Moving the truck to a safer location</strong> after being told by a safety official to relocate</li>
      <li><strong>Travel to a nearby reasonable resting place</strong> to obtain required rest after loading or unloading · trip is for the driver's benefit, not the load's</li>
      <li><strong>Authorized personal entertainment</strong> · trips to a movie, gym, etc. while off-duty + the truck is empty or under no load</li>
    </ul>

    <h2>II · What does NOT count as PC</h2>
    <ul>
      <li><strong>Moving the load closer to its destination</strong> · even by a few miles · this is on-duty driving</li>
      <li><strong>Repositioning between shippers</strong> · part of the dispatch · on-duty</li>
      <li><strong>Bobtailing to/from a maintenance shop</strong> · on-duty maintenance time</li>
      <li><strong>Moving from a loading dock to a nearby parking lot</strong> after delivery if it's required to free the dock · this is on-duty</li>
      <li><strong>Driving from one drop to the next</strong> while still on the trip · on-duty</li>
      <li><strong>Any drive that "advances the load" or "advances the commercial purpose"</strong> · the FMCSA test</li>
    </ul>

    <h2>III · The driver's responsibilities when using PC</h2>
    <ol>
      <li><strong>Confirm your carrier's policy permits PC</strong> · §395.1(b)(1) says PC is at the carrier's discretion · some carriers prohibit it entirely</li>
      <li><strong>Properly annotate the ELD</strong> · select "Off-Duty Personal Use" or PC duty-status modifier · most ELDs require an annotation comment</li>
      <li><strong>Add a written annotation</strong> describing the purpose · e.g., "PC: drive from rest area to motel for sleep"</li>
      <li><strong>Be ready to defend it</strong> at roadside · inspector may ask what the trip was for</li>
      <li><strong>Don't combine PC with on-duty drive in a way that looks evasive</strong> · short PC segments wedged between drive segments will be probed</li>
    </ol>

    <h2>IV · The FMCSA tests inspectors apply</h2>
    <table>
      <thead><tr><th style="width:35%">Test</th><th>If "yes" → PC is OK</th><th>If "no" → on-duty driving</th></tr></thead>
      <tbody>
        <tr><td>Is the trip for personal benefit only?</td><td>Yes</td><td>No · on-duty</td></tr>
        <tr><td>Was the driver off-duty before the trip started?</td><td>Yes</td><td>No · on-duty</td></tr>
        <tr><td>Is the trip routed to advance the load or the carrier's commercial purpose?</td><td>No</td><td>Yes · on-duty</td></tr>
        <tr><td>Is the trip "reasonable" in distance + time for the personal reason given?</td><td>Yes</td><td>No · suspicion · on-duty</td></tr>
      </tbody>
    </table>

    <div class="callout">
      <strong>The PC clock isn't unlimited.</strong> If you drove 5 hours of PC to get home for the weekend, an inspector will scrutinize it · 5 hours of PC + commute home isn't "personal," it's an extended trip masquerading as off-duty. Use PC for genuine, reasonable, off-duty trips · not as an HOS workaround.
    </div>
  `,
});

/* ---- 54. eldt-certificate · §380.609 ---- */

export const eldtCertificate: TemplateFn<{ carrierName?: string; driverName?: string; trainingProviderName?: string; courseType?: string; completionDate?: string }> = (data) => ({
  version: "1.0",
  title: `ELDT Completion Certificate · ${data.driverName || "Sample Driver"}`,
  headerSubtitle: "Entry-Level Driver Training · 49 CFR §380.609",
  bodyHTML: `
    <h1>Entry-Level Driver Training · completion certificate</h1>
    <p class="meta">Pursuant to 49 CFR Part 380 Subpart F</p>

    <div class="callout">
      §380.609 requires entry-level CDL applicants (post 02/07/2022) to complete theory + behind-the-wheel training from an FMCSA-registered Training Provider before applying for a CDL or upgrade. This certificate documents that training.
    </div>

    <h2>I · Driver information</h2>
    <table>
      <tbody>
        <tr><td style="width:30%">Driver name</td><td>${escapeHtml(data.driverName || "____________________________________")}</td></tr>
        <tr><td>Date of birth</td><td>____________</td></tr>
        <tr><td>Driver's license number + state</td><td>____________________________________</td></tr>
        <tr><td>CDL applicant number (if available)</td><td>____________________________________</td></tr>
      </tbody>
    </table>

    <h2>II · Training type completed</h2>
    <ul>
      <li>☐ <strong>Class A CDL · initial issuance</strong> (theory + BTW)</li>
      <li>☐ <strong>Class B CDL · initial issuance</strong> (theory + BTW)</li>
      <li>☐ <strong>Class A or B upgrade</strong> (from Class B to A) (theory + BTW)</li>
      <li>☐ <strong>Passenger (P) endorsement</strong> (theory only)</li>
      <li>☐ <strong>School Bus (S) endorsement</strong> (theory only)</li>
      <li>☐ <strong>Hazardous Materials (H) endorsement</strong> (theory only)</li>
    </ul>
    <p>Course type completed: <strong>${escapeHtml(data.courseType || "____________________________________")}</strong></p>

    <h2>III · Training provider information</h2>
    <table>
      <tbody>
        <tr><td style="width:30%">Training Provider name</td><td>${escapeHtml(data.trainingProviderName || "____________________________________")}</td></tr>
        <tr><td>FMCSA Training Provider Registry ID</td><td>____________________________________</td></tr>
        <tr><td>Address</td><td>____________________________________</td></tr>
        <tr><td>Theory training completion date</td><td>${escapeHtml(data.completionDate || "____________")}</td></tr>
        <tr><td>Behind-the-wheel completion date</td><td>____________</td></tr>
        <tr><td>Instructor of record</td><td>____________________________________</td></tr>
      </tbody>
    </table>

    <h2>IV · Certification</h2>
    <p>I certify, on behalf of the Training Provider, that the driver listed above has successfully completed the FMCSA-required entry-level driver training curriculum in accordance with 49 CFR Part 380 Subpart F. The completion record has been or will be submitted to the FMCSA Training Provider Registry within 2 business days of completion as required by §380.725.</p>

    <table style="margin-top: 0.3in;">
      <tbody>
        <tr><td style="width:60%; padding: 12px 8px;"><div class="signature-line"></div><div class="signature-label">Training Provider authorized signature</div></td><td style="width:40%; padding: 12px 8px;"><div class="signature-line"></div><div class="signature-label">Date</div></td></tr>
        <tr><td style="padding: 12px 8px;"><div class="signature-line"></div><div class="signature-label">Printed name + title</div></td><td style="padding: 12px 8px;"><div class="signature-line"></div><div class="signature-label">Phone</div></td></tr>
      </tbody>
    </table>

    <p class="meta" style="margin-top: 0.2in;">Driver acknowledges receipt: __________________________________ Date: ____________</p>
    <p class="meta">This certificate satisfies 49 CFR §380.609. The TPR completion record is the authoritative submission; this paper certificate is a courtesy copy. Carrier must verify the TPR record before placing the driver in safety-sensitive duty (§380.611). Retain in the driver's DQ file for duration of employment + 3 years.</p>
  `,
});

/* ---- 55. progressive-discipline-matrix · internal carrier policy ---- */

export const progressiveDisciplineMatrix: TemplateFn<{ carrierName?: string }> = (data) => ({
  version: "1.0",
  title: `Progressive Discipline Matrix · ${data.carrierName || "Sample Carrier"}`,
  headerSubtitle: "Progressive discipline · carrier policy",
  bodyHTML: `
    <h1>Progressive discipline matrix · driver safety</h1>
    <p class="meta">For <strong>${escapeHtml(data.carrierName || "Sample Carrier")}</strong> · internal HR + safety policy</p>

    <div class="callout">
      Progressive discipline is the documented sequence of consequences for repeated safety violations. Without it, your terminations look arbitrary and your CSA-driver-fitness defense collapses. This matrix is a starting template · adapt to your collective-bargaining + state-law context.
    </div>

    <h2>I · Tier definitions</h2>
    <table>
      <thead><tr><th style="width:18%">Tier</th><th>Examples</th><th>First-offense action</th></tr></thead>
      <tbody>
        <tr><td><strong>Tier 1 · Minor</strong></td><td>Late paperwork · single missed pre-trip item · light DVIR omission</td><td>Coaching note in driver file</td></tr>
        <tr><td><strong>Tier 2 · Moderate</strong></td><td>HOS warning · repeated minor · single CSA roadside violation</td><td>Written warning + retraining</td></tr>
        <tr><td><strong>Tier 3 · Serious</strong></td><td>OOS roadside · preventable accident · DVIR falsification</td><td>Suspension pending review + retraining + final written</td></tr>
        <tr><td><strong>Tier 4 · Severe</strong></td><td>HOS falsification (§395.8(e)) · OOS order violation · §383.51 disqualifying offense</td><td>Termination · D&A re-test if applicable</td></tr>
      </tbody>
    </table>

    <h2>II · Escalation by repeat occurrences (rolling 12-month window)</h2>
    <table>
      <thead><tr><th style="width:30%">Behavior pattern</th><th>1st</th><th>2nd</th><th>3rd</th><th>4th</th></tr></thead>
      <tbody>
        <tr><td>Tier 1 violation</td><td>Coaching</td><td>Written warning</td><td>Final warning</td><td>Suspension</td></tr>
        <tr><td>Tier 2 violation</td><td>Written warning</td><td>Final warning</td><td>Suspension</td><td>Termination</td></tr>
        <tr><td>Tier 3 violation</td><td>Suspension + final</td><td>Termination</td><td>-</td><td>-</td></tr>
        <tr><td>Tier 4 violation</td><td>Termination</td><td>-</td><td>-</td><td>-</td></tr>
      </tbody>
    </table>

    <h2>III · Mandatory training triggers</h2>
    <ul>
      <li><strong>Any HOS violation</strong> · 1-hour refresher training + driver signs off · retain in DQ file</li>
      <li><strong>Any OOS roadside</strong> · pre-trip refresher (driver-vehicle inspection) + sit with the mechanic on the corrected defect</li>
      <li><strong>Any preventable accident</strong> · accident-analysis training + dash-cam review with safety</li>
      <li><strong>Any reasonable-suspicion D&A test</strong> · referral to EAP regardless of result · driver education on §382 program</li>
      <li><strong>3+ CSA points in any BASIC in 6 months</strong> · structured one-on-one with safety director · documented corrective plan</li>
    </ul>

    <h2>IV · Documentation requirements (every step)</h2>
    <ol>
      <li><strong>Date + time</strong> of the incident</li>
      <li><strong>Specific behavior</strong> with CFR citation if applicable</li>
      <li><strong>Action taken</strong> · coaching / warning / suspension / termination</li>
      <li><strong>Corrective training assigned + completed</strong> · with date + trainer</li>
      <li><strong>Driver signature</strong> acknowledging the discipline (or witnessed refusal)</li>
      <li><strong>Supervisor signature</strong> applying the discipline</li>
      <li><strong>HR sign-off</strong> for any termination · review for ADA, FMLA, state-law protections</li>
      <li><strong>File retention</strong> · driver file · duration of employment + 3 years · longer in litigation hold</li>
    </ol>

    <div class="callout">
      <strong>The matrix protects you legally; the documentation is the lawsuit defense.</strong> "We always do progressive discipline" is meaningless without per-incident records. Build the file for every driver from Day 1.
    </div>
  `,
});

/* ---- 56. safety-fitness-determination-explainer · §385.5 ---- */

export const safetyFitnessDeterminationExplainer: TemplateFn<{ carrierName?: string }> = (data) => ({
  version: "1.0",
  title: `Safety Fitness Determination · ${data.carrierName || "Sample Carrier"}`,
  headerSubtitle: "SFD · 49 CFR §385.5 + §385.13",
  bodyHTML: `
    <h1>Safety Fitness Determination · how it works</h1>
    <p class="meta">For <strong>${escapeHtml(data.carrierName || "Sample Carrier")}</strong></p>

    <div class="callout">
      The Safety Fitness Determination (SFD) is the FMCSA's formal rating of your carrier's overall safety. There are three: Satisfactory, Conditional, Unsatisfactory. The rating drives insurance, freight tendering, and (at Unsatisfactory) shutdown.
    </div>

    <h2>I · The three ratings · §385.5</h2>
    <table>
      <thead><tr><th style="width:25%">Rating</th><th>What it means</th><th>Operational impact</th></tr></thead>
      <tbody>
        <tr><td><strong>Satisfactory</strong></td><td>Sufficient safety management controls in place</td><td>Full operating authority · normal insurance · normal freight</td></tr>
        <tr><td><strong>Conditional</strong></td><td>Some controls missing or deficient · safety violations identified</td><td>Operating authority continues · insurance rates jump · shippers + brokers see the rating · freight may dry up</td></tr>
        <tr><td><strong>Unsatisfactory</strong></td><td>Multiple severe deficiencies · public safety risk</td><td>Operating authority revoked within 45-60 days (HM in 45) unless corrected · most carriers shut down</td></tr>
        <tr><td><strong>Unrated</strong></td><td>New entrants (first 18 months) + no review yet</td><td>Normal authority · pending the New Entrant audit</td></tr>
      </tbody>
    </table>

    <h2>II · How a rating gets issued · §385.13</h2>
    <p>FMCSA issues a safety rating after a Compliance Review (CR), which is a deeper audit than a New Entrant audit. CRs are triggered by:</p>
    <ul>
      <li>Two or more alerted BASICs on your SMS profile</li>
      <li>A fatal accident or pattern of serious crashes</li>
      <li>A complaint or whistleblower report</li>
      <li>Random selection</li>
      <li>Failed New Entrant audit</li>
    </ul>

    <h2>III · The 6 factors investigators evaluate · §385.7</h2>
    <ol>
      <li><strong>Adequacy of safety management controls</strong> · do you have written policies, supervisor training, audit procedures</li>
      <li><strong>Frequency + severity of regulatory violations</strong> · roadside, audit, accident-related</li>
      <li><strong>Frequency + severity of CMV accidents</strong> · the Crash Indicator BASIC + the accidents themselves</li>
      <li><strong>Acute + critical violations found during the review</strong> · 16 acute = auto-conditional / unsatisfactory</li>
      <li><strong>Past patterns of violations</strong> · whether issues have been corrected</li>
      <li><strong>Operating practices in the BASICs</strong> · Driver Fitness, HOS, Vehicle Maintenance, etc.</li>
    </ol>

    <h2>IV · If you get a Conditional or Unsatisfactory · what to do</h2>
    <ol>
      <li><strong>Read the rating letter</strong> · it lists specific deficiencies + the regulatory cites</li>
      <li><strong>Request a Safety Audit (SA)</strong> or Corrective Action Plan (CAP) acceptance within 60 days · §385.17</li>
      <li><strong>Build the CAP</strong> · for each cited deficiency · what changed, who owns it, when it was implemented, what evidence proves it</li>
      <li><strong>Submit the CAP to FMCSA</strong> · they accept or reject · accepted means you get a follow-up review chance</li>
      <li><strong>For Unsatisfactory</strong> · file a petition for administrative review or §385.15 · while doing so, fix everything that's fixable · 45 days for HM, 60 for general freight · then operating authority is revoked</li>
      <li><strong>If revoked</strong> · you can re-apply for operating authority after demonstrating you've fixed the issues · but it takes 6-18 months</li>
    </ol>

    <div class="callout">
      <strong>The SFD is the single most important number in your carrier's life.</strong> Insurance underwriters look at it before they price. Brokers look at it before they tender. Shippers look at it before they list you. A Conditional rating cuts revenue access by 20-50%; Unsatisfactory ends the business.
    </div>
  `,
});

/* ---- 57. shipping-paper-template · §172.201 ---- */

export const shippingPaperTemplate: TemplateFn<{ carrierName?: string; shipperName?: string }> = (data) => ({
  version: "1.0",
  title: `Hazmat Shipping Paper · template · ${data.shipperName || "Shipper"}`,
  headerSubtitle: "Hazmat shipping paper · 49 CFR §172.201",
  bodyHTML: `
    <h1>Hazmat shipping paper · template</h1>
    <p class="meta">${escapeHtml(data.shipperName || "Shipper")} · carrier ${escapeHtml(data.carrierName || "Sample Carrier")}</p>

    <div class="callout">
      §172.201 + §172.202 require specific information on the shipping paper for any hazmat shipment. This template includes every mandatory field. Missing any field is a violation; misordered fields can also be a violation.
    </div>

    <h2>I · Header</h2>
    <table>
      <tbody>
        <tr><td style="width:25%">Date prepared</td><td>____________</td><td>Shipment number</td><td>____________</td></tr>
        <tr><td>Shipper name</td><td>____________________________________</td><td>Shipper address</td><td>____________</td></tr>
        <tr><td>Consignee name</td><td>____________________________________</td><td>Consignee address</td><td>____________</td></tr>
        <tr><td>Carrier name + USDOT #</td><td>${escapeHtml(data.carrierName || "____________")} · USDOT ____________</td><td>Driver name + CDL</td><td>____________</td></tr>
      </tbody>
    </table>

    <h2>II · Hazmat description (in this required order · §172.202(b))</h2>
    <p>Each line item must follow this exact sequence:</p>
    <ol>
      <li><strong>UN/NA identification number</strong> (e.g., UN1203)</li>
      <li><strong>Proper shipping name</strong> (e.g., Gasoline)</li>
      <li><strong>Hazard class or division</strong> (e.g., 3)</li>
      <li><strong>Packing group (if applicable)</strong> in Roman numerals (e.g., II)</li>
      <li><strong>Total quantity by mass or volume</strong> (e.g., 250 gallons)</li>
      <li><strong>Number + type of packages</strong> (e.g., 1 cargo tank)</li>
    </ol>

    <table>
      <thead><tr><th style="width:12%">UN/NA #</th><th style="width:30%">Proper shipping name</th><th style="width:10%">Class</th><th style="width:10%">PG</th><th style="width:18%">Quantity</th><th style="width:20%">Packages</th></tr></thead>
      <tbody>
        <tr><td>____________</td><td>____________</td><td>____________</td><td>____________</td><td>____________</td><td>____________</td></tr>
        <tr><td>____________</td><td>____________</td><td>____________</td><td>____________</td><td>____________</td><td>____________</td></tr>
        <tr><td>____________</td><td>____________</td><td>____________</td><td>____________</td><td>____________</td><td>____________</td></tr>
      </tbody>
    </table>

    <h2>III · Emergency response phone number · §172.604</h2>
    <p>Emergency response phone number (24-hour, monitored, with subject-matter knowledge):</p>
    <p style="border-bottom: 1px solid #94A3B8; font-size: 14pt; padding-bottom: 8px;">_______________________________________________________</p>
    <p class="meta">Person or organization providing 24-hour service (CHEMTREC, INFOTRAC, or shipper-direct):</p>
    <p style="border-bottom: 1px solid #94A3B8; padding-bottom: 4px;">_______________________________________________________</p>

    <h2>IV · Shipper's certification · §172.204</h2>
    <p>"This is to certify that the above-named materials are properly classified, described, packaged, marked, and labeled, and are in proper condition for transportation according to the applicable regulations of the Department of Transportation."</p>

    <table style="margin-top: 0.2in;">
      <tbody>
        <tr><td style="width:55%; padding: 12px 8px;"><div class="signature-line"></div><div class="signature-label">Shipper signature</div></td><td style="width:45%; padding: 12px 8px;"><div class="signature-line"></div><div class="signature-label">Date</div></td></tr>
        <tr><td style="padding: 12px 8px;"><div class="signature-line"></div><div class="signature-label">Printed name + title</div></td><td style="padding: 12px 8px;"><div class="signature-line"></div><div class="signature-label">Hazmat employee ID</div></td></tr>
      </tbody>
    </table>

    <p class="meta" style="margin-top: 0.15in;">Carrier retains 2 years (§172.201(e)). Driver carries within reach in the cab while in transit (§177.817).</p>
  `,
});

/* ---- 58. emergency-response-info-card · §172.602 ---- */

export const emergencyResponseInfoCard: TemplateFn<{ carrierName?: string }> = (data) => ({
  version: "1.0",
  title: `Hazmat Emergency Response Info Card · ${data.carrierName || "Sample Carrier"}`,
  headerSubtitle: "Hazmat ERG quick card · 49 CFR §172.602",
  bodyHTML: `
    <h1>Hazmat emergency response · cab quick card</h1>
    <p class="meta">For drivers of <strong>${escapeHtml(data.carrierName || "Sample Carrier")}</strong> · keep on the driver-side sun visor</p>

    <div class="callout">
      §172.602 requires drivers transporting hazmat to have emergency-response information within immediate reach. The shipping paper + ERG together satisfy this. This card is the at-a-glance backup · use until ERG can be referenced.
    </div>

    <h2>I · The 4 phone numbers that matter</h2>
    <table>
      <thead><tr><th style="width:35%">Number</th><th>When to call</th></tr></thead>
      <tbody>
        <tr><td><strong>911</strong></td><td>Any incident with injury · fire · release · public exposure</td></tr>
        <tr><td><strong>CHEMTREC: 1-800-424-9300</strong></td><td>24-hour hazmat response advice · if shipping paper doesn't have a number</td></tr>
        <tr><td><strong>National Response Center: 1-800-424-8802</strong></td><td>For §171.15 reportable incidents · injury, evacuation, road closure, fire, radioactive, marine pollutant</td></tr>
        <tr><td><strong>Carrier dispatch + safety</strong></td><td>Anytime you call 911 or CHEMTREC · they need to know + coordinate</td></tr>
      </tbody>
    </table>

    <h2>II · ERG color sections (orange book)</h2>
    <ul>
      <li><strong>White section</strong> · instructions on using the ERG · table of contents</li>
      <li><strong>Yellow section</strong> · lookup by UN/NA number → guide number</li>
      <li><strong>Blue section</strong> · lookup by chemical name → guide number</li>
      <li><strong>Orange section</strong> · the actual response guides (3-digit guide numbers · 111-174 + special)</li>
      <li><strong>Green section</strong> · table of initial isolation + protective action distances for toxic-inhalation-hazard materials</li>
    </ul>

    <h2>III · The 4 minutes after a release</h2>
    <ol>
      <li><strong>Minute 1</strong> · move yourself + bystanders upwind, uphill, 100+ ft away</li>
      <li><strong>Minute 2</strong> · call 911 · location, UN number, hazard class, total quantity, weather, injuries</li>
      <li><strong>Minute 3</strong> · call CHEMTREC or shipping-paper emergency number · they coordinate with responders</li>
      <li><strong>Minute 4</strong> · call carrier dispatch · they trigger insurance, legal, follow-up reporting</li>
    </ol>

    <h2>IV · What to hand the incident commander</h2>
    <ul>
      <li><strong>Shipping paper</strong> · the complete document from the cab</li>
      <li><strong>ERG</strong> · the orange book · they'll use it on scene</li>
      <li><strong>Your CDL + hazmat endorsement</strong></li>
      <li><strong>The carrier's 24-hour emergency contact</strong> · phone + name of dispatcher</li>
      <li><strong>Approximate quantity released</strong> · vs total onboard</li>
      <li><strong>Anything you saw</strong> · cause, leak point, color of vapor, smell · without speculating</li>
    </ul>

    <div class="callout">
      <strong>Stay with the truck if it's safe</strong> · responders need you to identify cargo + answer technical questions. If you must evacuate, leave the shipping paper + ERG on the dash where it's visible from outside.
    </div>
  `,
});

/* ---- 59. random-pool-quarterly-report · §382.305 + §382.403 ---- */

export const randomPoolQuarterlyReport: TemplateFn<{ carrierName?: string; quarter?: string; year?: string }> = (data) => ({
  version: "1.0",
  title: `Random Pool Quarterly Report · ${data.carrierName || "Sample Carrier"}`,
  headerSubtitle: "Random pool quarterly · 49 CFR §382.305 + §382.403",
  bodyHTML: `
    <h1>Random testing pool · quarterly report</h1>
    <p class="meta">${escapeHtml(data.carrierName || "Sample Carrier")} · quarter <strong>${escapeHtml(data.quarter || "____________")} ${escapeHtml(data.year || "____________")}</strong></p>

    <div class="callout">
      §382.305 requires evenly-distributed random selections meeting the annual rate (50% drug · 10% alcohol of the average driver count). This quarterly report demonstrates the program is operating to plan. Generated once per quarter · filed with the C-TPA contract + audit-export bundle.
    </div>

    <h2>I · Pool composition</h2>
    <table>
      <tbody>
        <tr><td style="width:40%">Average driver count this quarter</td><td>____________</td></tr>
        <tr><td>Drivers added to pool this quarter</td><td>____________</td></tr>
        <tr><td>Drivers removed (term, role change)</td><td>____________</td></tr>
        <tr><td>Drivers in pool at quarter-end</td><td>____________</td></tr>
        <tr><td>C-TPA managing the pool (if applicable)</td><td>____________</td></tr>
      </tbody>
    </table>

    <h2>II · Quarterly selection + completion</h2>
    <table>
      <thead><tr><th>Month</th><th>Drug selections</th><th>Drug tested</th><th>Alcohol selections</th><th>Alcohol tested</th></tr></thead>
      <tbody>
        <tr><td>Month 1</td><td>____________</td><td>____________</td><td>____________</td><td>____________</td></tr>
        <tr><td>Month 2</td><td>____________</td><td>____________</td><td>____________</td><td>____________</td></tr>
        <tr><td>Month 3</td><td>____________</td><td>____________</td><td>____________</td><td>____________</td></tr>
        <tr><td><strong>Quarter total</strong></td><td>____________</td><td>____________</td><td>____________</td><td>____________</td></tr>
      </tbody>
    </table>

    <h2>III · Rate-to-plan</h2>
    <p>FMCSA rates (current period):</p>
    <ul>
      <li><strong>Drug:</strong> 50% of average driver count tested per year · target this quarter = 12.5% of pool</li>
      <li><strong>Alcohol:</strong> 10% of average driver count tested per year · target this quarter = 2.5% of pool</li>
    </ul>
    <table>
      <tbody>
        <tr><td style="width:40%">Drug tests this quarter</td><td>____________</td><td>% of pool</td><td>____________ %</td></tr>
        <tr><td>Alcohol tests this quarter</td><td>____________</td><td>% of pool</td><td>____________ %</td></tr>
        <tr><td>YTD drug %</td><td>____________ %</td><td>YTD alcohol %</td><td>____________ %</td></tr>
      </tbody>
    </table>

    <h2>IV · Results summary</h2>
    <table>
      <thead><tr><th>Result type</th><th>Drug</th><th>Alcohol</th></tr></thead>
      <tbody>
        <tr><td>Negative</td><td>____________</td><td>____________</td></tr>
        <tr><td>Positive (verified by MRO)</td><td>____________</td><td>____________</td></tr>
        <tr><td>Refusal</td><td>____________</td><td>____________</td></tr>
        <tr><td>Cancelled / invalid</td><td>____________</td><td>____________</td></tr>
        <tr><td>Reported to Clearinghouse within 3 business days</td><td>____________</td><td>____________</td></tr>
      </tbody>
    </table>

    <h2>V · Selection method certification</h2>
    <p>Random selections were made using a scientifically valid random number generator. Selection lists are retained per §382.401(b)(3) for 2 years. The pool roster reflects all CDL drivers performing safety-sensitive functions for the carrier this quarter.</p>

    <table style="margin-top: 0.2in;">
      <tbody>
        <tr><td style="width:55%; padding: 12px 8px;"><div class="signature-line"></div><div class="signature-label">DER (Designated Employer Rep) signature</div></td><td style="width:45%; padding: 12px 8px;"><div class="signature-line"></div><div class="signature-label">Date</div></td></tr>
      </tbody>
    </table>

    <p class="meta" style="margin-top: 0.15in;">Retain 2 years per §382.401(b)(3). Roll up into annual MIS report (§382.403) when requested.</p>
  `,
});

/* ---- 60. supervisor-reasonable-suspicion-training · §382.603 ---- */

export const supervisorReasonableSuspicionTraining: TemplateFn<{ carrierName?: string; supervisorName?: string; trainingDate?: string }> = (data) => ({
  version: "1.0",
  title: `Supervisor Reasonable-Suspicion Training · ${data.supervisorName || "Sample Supervisor"}`,
  headerSubtitle: "Reasonable-suspicion training · 49 CFR §382.603",
  bodyHTML: `
    <h1>Supervisor reasonable-suspicion training · completion record</h1>
    <p class="meta">${escapeHtml(data.carrierName || "Sample Carrier")} · for <strong>${escapeHtml(data.supervisorName || "Sample Supervisor")}</strong> · training completed <strong>${escapeHtml(data.trainingDate || "____________")}</strong></p>

    <div class="callout">
      §382.603 requires every supervisor of CDL drivers to receive at least 60 minutes of training on the physical, behavioral, and performance indicators of probable drug use, plus 60 minutes on the indicators of probable alcohol misuse · before they can make a reasonable-suspicion test call.
    </div>

    <h2>I · Drug indicators (60 min content)</h2>
    <ul>
      <li><strong>Physical indicators</strong> · pupils dilated or constricted · eyes red or glassy · slurred speech · unsteady gait · pale or flushed complexion · sweating or chills · runny nose · pinpoint pupils · needle marks</li>
      <li><strong>Behavioral indicators</strong> · paranoia · agitation · euphoria · withdrawn · talkative or hyperactive · suspicious behavior · violent outbursts · mood swings · inappropriate laughter · hallucinations</li>
      <li><strong>Performance indicators</strong> · missed deadlines · errors of judgment · forgetting instructions · poor concentration · unexplained accidents · pattern of tardiness or absence · falling asleep on duty</li>
      <li><strong>By drug class</strong> · CNS depressants · CNS stimulants · hallucinogens · narcotics · cannabis · inhalants · designer drugs</li>
    </ul>

    <h2>II · Alcohol indicators (60 min content)</h2>
    <ul>
      <li><strong>Physical</strong> · smell of alcohol on breath · slurred or thick speech · bloodshot eyes · unsteady walk · hand tremors · flushed face</li>
      <li><strong>Behavioral</strong> · belligerence · over-friendliness · emotional outbursts · sleepiness · poor coordination</li>
      <li><strong>Performance</strong> · poor decisions · slow reaction time · forgetting routine tasks · vehicle damage · sudden change in performance</li>
    </ul>

    <h2>III · The supervisor's decision process</h2>
    <ol>
      <li><strong>Observe</strong> · the indicators must be observable in the moment, not relayed second-hand</li>
      <li><strong>Document immediately</strong> · note specific behaviors with timestamps · not "he seemed off"</li>
      <li><strong>Have a second witness if possible</strong> · increases defensibility</li>
      <li><strong>Direct the driver to the test</strong> · "You're being directed to a reasonable-suspicion drug + alcohol test · do you have any questions?"</li>
      <li><strong>Transport the driver</strong> · do NOT allow them to drive themselves · DOT-certified collection site</li>
      <li><strong>Complete the Reasonable-Suspicion Determination Form</strong> · before transport · for the driver's file</li>
      <li><strong>If driver refuses</strong> · document the refusal · report to Clearinghouse within 3 business days · same consequence as a positive</li>
    </ol>

    <h2>IV · Certification</h2>
    <p>I, the undersigned, certify that I have completed at least 60 minutes of training on the indicators of probable drug use AND 60 minutes of training on the indicators of probable alcohol misuse, as required by 49 CFR §382.603, on the date shown. The training covered the physical, behavioral, speech, and performance indicators required by §382.603(b).</p>

    <table style="margin-top: 0.2in;">
      <tbody>
        <tr><td style="width:55%; padding: 12px 8px;"><div class="signature-line"></div><div class="signature-label">Supervisor signature</div></td><td style="width:45%; padding: 12px 8px;"><div class="signature-line"></div><div class="signature-label">Date</div></td></tr>
        <tr><td style="padding: 12px 8px;"><div class="signature-line"></div><div class="signature-label">Trainer signature + name</div></td><td style="padding: 12px 8px;"><div class="signature-line"></div><div class="signature-label">Training method (in-person · LMS · blended)</div></td></tr>
      </tbody>
    </table>

    <p class="meta" style="margin-top: 0.15in;">Retain for as long as supervisor performs the role + 2 years after (§382.603(c)). One-time training under §382.603 is sufficient unless the supervisor changes roles or the regulations are amended.</p>
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
  "da-driver-guide": daDriverGuide as TemplateFn,
  "da-employer-playbook": daEmployerPlaybook as TemplateFn,
  "dqf-driver-index": dqfDriverIndex as TemplateFn,
  "fcra-background-check-disclosure": fcraBackgroundCheckDisclosure as TemplateFn,
  "mvr-explainer": mvrExplainer as TemplateFn,
  "ifta-quarterly-walkthrough": iftaQuarterlyWalkthrough as TemplateFn,
  "inspections-post-stop-response": inspectionsPostStopResponse as TemplateFn,
  "accidents-driver-response": accidentsDriverResponse as TemplateFn,
  "accidents-employer-response": accidentsEmployerResponse as TemplateFn,
  "medical-card-driver-guide": medicalCardDriverGuide as TemplateFn,
  "medical-card-employer-tracker": medicalCardEmployerTracker as TemplateFn,
  "csa-scorecard-explainer": csaScorecardExplainer as TemplateFn,
  "dvir-driver-quickguide": dvirDriverQuickGuide as TemplateFn,
  "dvir-employer-playbook": dvirEmployerPlaybook as TemplateFn,
  "driver-onboarding-packet-index": driverOnboardingPacketIndex as TemplateFn,
  "new-entrant-audit-prep": newEntrantAuditPrep as TemplateFn,
  "annual-driver-review-form": annualDriverReviewForm as TemplateFn,
  "previous-employer-inquiry": previousEmployerInquiry as TemplateFn,
  "da-policy-receipt": daPolicyReceipt as TemplateFn,
  "dataq-challenge-template": dataqChallengeTemplate as TemplateFn,
  "cargo-securement-driver-quickguide": cargoSecurementDriverQuickGuide as TemplateFn,
  "annual-vehicle-inspection-report": annualVehicleInspectionReport as TemplateFn,
  "eld-malfunction-policy": eldMalfunctionPolicy as TemplateFn,
  "da-auditor-export-guide": daAuditorExportGuide as TemplateFn,
  "dqf-employer-playbook": dqfEmployerPlaybook as TemplateFn,
  "dqf-auditor-export-guide": dqfAuditorExportGuide as TemplateFn,
  "background-checks-driver-guide": backgroundChecksDriverGuide as TemplateFn,
  "background-checks-employer-playbook": backgroundChecksEmployerPlaybook as TemplateFn,
  "mvr-employer-playbook": mvrEmployerPlaybook as TemplateFn,
  "mvr-auditor-export-guide": mvrAuditorExportGuide as TemplateFn,
  "inspections-driver-quickguide": inspectionsDriverQuickGuide as TemplateFn,
  "ifta-driver-guide": iftaDriverGuide as TemplateFn,
  "ifta-employer-playbook": iftaEmployerPlaybook as TemplateFn,
  "accidents-auditor-export-guide": accidentsAuditorExportGuide as TemplateFn,
  "medical-card-auditor-export-guide": medicalCardAuditorExportGuide as TemplateFn,
  "inspections-employer-playbook": inspectionsEmployerPlaybook as TemplateFn,
  "annual-violation-self-cert": annualViolationSelfCert as TemplateFn,
  "road-test-certificate": roadTestCertificate as TemplateFn,
  "driver-application-form": driverApplicationForm as TemplateFn,
  "spill-response-procedure": spillResponseProcedure as TemplateFn,
  "personal-conveyance-rules": personalConveyanceRules as TemplateFn,
  "eldt-certificate": eldtCertificate as TemplateFn,
  "progressive-discipline-matrix": progressiveDisciplineMatrix as TemplateFn,
  "safety-fitness-determination-explainer": safetyFitnessDeterminationExplainer as TemplateFn,
  "shipping-paper-template": shippingPaperTemplate as TemplateFn,
  "emergency-response-info-card": emergencyResponseInfoCard as TemplateFn,
  "random-pool-quarterly-report": randomPoolQuarterlyReport as TemplateFn,
  "supervisor-reasonable-suspicion-training": supervisorReasonableSuspicionTraining as TemplateFn,
};

export type TemplateSlug = keyof typeof TEMPLATES;
