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
  padding: 18px 0.6in 20px;
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
  <div style="display: flex; align-items: center; gap: 14px;">
    <img src="${X3_LOGO_DATA_URI}" alt="X3 Compass" style="height: 64px; width: auto;" />
    <span style="font-weight: 800; letter-spacing: 0.6px; color: #FFFFFF; font-size: 19pt; line-height: 1;">X3 Compass</span>
  </div>
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
  @page { size: Letter; margin: 1.55in 0.6in 0.85in 0.6in; }
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
      <strong>You can refuse to drive</strong> if the carrier's load assignment would force a violation · <span class="cfr">§392.3</span>. Drivers cannot be retaliated against for refusing on safety grounds · STAA 49 U.S.C. § 31105.
    </div>

    <p class="meta" style="margin-top: 0.4in;">Need more? Ask the X3 Compass AI brain at <strong>${escapeHtml(data.carrierName || "your carrier")}'s portal</strong> for personalized HOS coaching. Or call your safety director.</p>
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
      <li><strong>T+0</strong> · Driver notifies you (text, email, dispatch radio · whatever your policy says)</li>
      <li><strong>T+0 to T+24 hr</strong> · Driver switches to paper RODS, reconstructs the past 7 days · you confirm receipt of notice in writing</li>
      <li><strong>By T+8 days</strong> · Repair or replace the ELD · update the device · document everything</li>
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
   REGISTRY
   ============================================================ */

export const TEMPLATES: Record<string, TemplateFn> = {
  "letterhead-test": letterheadTest as TemplateFn,
  "hazmat-audit-checklist": hazmatAuditChecklist as TemplateFn,
  "training-certificate": trainingCertificate as TemplateFn,
  "hos-driver-quickguide": hosDriverQuickGuide as TemplateFn,
  "hos-supervisor-playbook": hosSupervisorPlaybook as TemplateFn,
  "hos-auditor-export-guide": hosAuditorExportGuide as TemplateFn,
};

export type TemplateSlug = keyof typeof TEMPLATES;
