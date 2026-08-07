/* ============================================================
   X3 COMPASS · HAZMAT · PLACARD WIZARD (native, no iframe)
   ------------------------------------------------------------
   Server Component (Next.js 16 + Turbopack + output:"export").
   Wizard markup is injected as raw HTML via
   dangerouslySetInnerHTML so React leaves it alone — no
   reconciliation resets the wizard JS's runtime mutations.
   Education Hub stays a normal React tree.
   ============================================================ */

import HazmatSubPageShell from "../HazmatSubPageShell";

// Wizard-app loader. Runs at HTML-parse time, polls for the wizard
// DOM (which is rendered as raw HTML below), then loads renderer +
// app in order. No React involvement.
const WIZARD_BOOT = `(function(){
  function load(src, then){
    var s=document.createElement('script');
    s.src=src; s.async=false;
    if(then) s.onload=then;
    document.body.appendChild(s);
  }
  function init(){
    if(!document.getElementById('un-id')||!document.getElementById('lookup-btn')){
      return setTimeout(init, 80);
    }
    if(window.__placardWizardLoaded) return;
    window.__placardWizardLoaded = true;
    load('/hazmat/placard-render.js', function(){
      load('/hazmat/placard-wizard-app.js');
    });
  }
  if(document.readyState==='loading'){
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();`;

// Whole wizard body as raw HTML — 1:1 with app.x3compass.com/hazmat-placard-wizard.html
// (minus the static page's own page-bar; HazmatSubPageShell provides the hero).
// Tab CSS is inlined here so React never touches it.
const WIZARD_MARKUP = `
<!-- Static page-bar — title + subtitle. Ghost buttons removed (sidebar already
     has Substance Lookup + Overview, they were redundant + confusing). -->
<div class="hz-page-bar">
  <div class="hz-page-bar-l">
    <div class="hz-page-bar-icon">🪧</div>
    <div>
      <h1 class="hz-page-bar-title">Placard Wizard <span class="hz-pro-chip">PRO</span></h1>
      <div class="hz-page-bar-sub">2,863 UN IDs · 33 placards · segregation warnings · specialty markings — per 49 CFR § 172 + § 177.848</div>
    </div>
  </div>
</div>

<style>
  .hz-tab { background:transparent; border:0; padding:10px 16px; font-size:10.5pt; font-weight:600; color:var(--fg-muted); cursor:pointer; border-bottom:2.5px solid transparent; margin-bottom:-2px; font-family:inherit; }
  .hz-tab.on { color:#16C7FF; border-bottom-color:#16C7FF; }
  .hz-tab:hover { color:var(--fg); }
  .tab-pane { display:none; } .tab-pane.on { display:block; }
  .ac-row:hover { background:rgba(22, 199, 255,0.08); }
</style>

<!-- Tabs -->
<div style="display:flex;gap:6px;margin-bottom:18px;border-bottom:1.5px solid var(--border);padding-bottom:0;">
  <button class="hz-tab on" role="tab" id="tab-single" aria-selected="true" aria-controls="pane-single" tabindex="0" data-tab="single">Single shipment</button>
  <button class="hz-tab" role="tab" id="tab-mixed" aria-selected="false" aria-controls="pane-mixed" tabindex="-1" data-tab="mixed">Mixed load (DANGEROUS)</button>
  <button class="hz-tab" role="tab" id="tab-specialty" aria-selected="false" aria-controls="pane-specialty" tabindex="-1" data-tab="specialty">Specialty markings</button>
  <button class="hz-tab" role="tab" id="tab-explosives" aria-selected="false" aria-controls="pane-explosives" tabindex="-1" data-tab="explosives">Explosives compatibility</button>
  <button class="hz-tab" role="tab" id="tab-unplate" aria-selected="false" aria-controls="pane-unplate" tabindex="-1" data-tab="unplate">UN number plate</button>
</div>

<!-- ============ TAB: Single shipment ============ -->
<div class="tab-pane on" id="pane-single" role="tabpanel" aria-labelledby="tab-single" tabindex="0">
  <div class="hz-panel">
    <div class="hz-panel-head">
      <div>
        <div class="hz-panel-h-eyebrow">Step 1 · Identify the substance</div>
        <h2 class="hz-panel-h">UN ID lookup — autocomplete across 2,863 substances</h2>
      </div>
    </div>
    <div style="display:grid;grid-template-columns:1fr 2fr 1fr auto;gap:14px;align-items:end;">
      <div>
        <label class="hz-label" for="un-id">UN / NA ID</label>
        <input id="un-id" class="hz-input" type="text" placeholder="e.g. 1203" autocomplete="off" style="font-family:monospace;font-weight:700;">
      </div>
      <div style="position:relative;">
        <label class="hz-label" for="ship-name">Or proper shipping name (type to search)</label>
        <input id="ship-name" class="hz-input" type="text" placeholder="e.g. Gasoline" autocomplete="off">
        <div id="autocomplete" style="position:absolute;top:100%;left:0;right:0;background:#0F1F35;border:1px solid rgba(22, 199, 255,0.2);border-radius:8px;box-shadow:0 6px 14px rgba(15,23,42,0.4);max-height:280px;overflow:auto;z-index:50;display:none;"></div>
      </div>
      <div>
        <label class="hz-label" for="qty">Quantity</label>
        <input id="qty" class="hz-input" type="text" placeholder="5,000 lbs">
      </div>
      <div><button class="hz-btn" id="lookup-btn" type="button">🔍 Look up</button></div>
    </div>
  </div>

  <div class="hz-panel" id="result-panel" style="display:none;">
    <div class="hz-panel-head">
      <div>
        <div class="hz-panel-h-eyebrow">Step 2 · Required placard</div>
        <h2 class="hz-panel-h" id="result-title">—</h2>
      </div>
      <div style="display:flex;gap:8px;">
        <button class="hz-btn-ghost" id="print-btn" type="button">🖨 Print to spec</button>
      </div>
    </div>
    <div style="display:grid;grid-template-columns:420px 1fr;gap:32px;align-items:start;">
      <div style="display:flex;align-items:center;justify-content:center;padding:24px;background:#000000;border-radius:12px;border:1px solid rgba(22, 199, 255,0.2);">
        <div id="placard-output"></div>
      </div>
      <div>
        <table class="hz-table">
          <thead><tr><th style="width:34%;">Field</th><th>Value</th><th style="width:22%;">CFR</th></tr></thead>
          <tbody id="result-rows"></tbody>
        </table>
        <div id="bulk-warning" style="margin-top:14px;display:none;"></div>
        <div style="margin-top:14px;padding:12px 14px;background:rgba(22, 199, 255,0.08);border-left:3px solid #16C7FF;border-radius:0 6px 6px 0;font-size:10pt;color:var(--fg);">
          <strong>Print to spec (§ 172.519):</strong> Minimum 250mm × 250mm. Use color-true print. Placards displayed on all four sides of the transport vehicle.
        </div>
      </div>
    </div>
  </div>

  <div class="hz-panel" id="segregation-panel" style="display:none;">
    <div class="hz-panel-head">
      <div>
        <div class="hz-panel-h-eyebrow">Step 3 · Segregation per 49 CFR § 177.848</div>
        <h2 class="hz-panel-h">What you CANNOT load with this material</h2>
      </div>
    </div>
    <div id="segregation-output"></div>
  </div>
</div>

<!-- ============ TAB: Mixed load ============ -->
<div class="tab-pane" id="pane-mixed" role="tabpanel" aria-labelledby="tab-mixed" tabindex="0">
  <div class="hz-panel">
    <div class="hz-panel-head">
      <div>
        <div class="hz-panel-h-eyebrow">Mixed-load placarding · § 172.504(b)</div>
        <h2 class="hz-panel-h">Add the classes you're hauling — we'll tell you when to use DANGEROUS</h2>
      </div>
    </div>
    <div id="mixed-classes" style="display:flex;flex-wrap:wrap;gap:8px;margin-bottom:14px;"></div>
    <div style="display:flex;gap:10px;align-items:flex-end;flex-wrap:wrap;">
      <div><label class="hz-label" for="mixed-add">Add class</label>
        <select id="mixed-add" class="hz-select">
          <option value="">Choose a hazard class…</option>
          <optgroup label="Class 1 — Explosives"><option>1.1</option><option>1.2</option><option>1.3</option><option>1.4</option><option>1.5</option><option>1.6</option></optgroup>
          <optgroup label="Class 2 — Gases"><option>2.1</option><option>2.2</option><option>2.3</option></optgroup>
          <option>3</option>
          <optgroup label="Class 4"><option>4.1</option><option>4.2</option><option>4.3</option></optgroup>
          <optgroup label="Class 5"><option>5.1</option><option>5.2</option></optgroup>
          <optgroup label="Class 6"><option>6.1</option><option>6.2</option></optgroup>
          <option>7</option><option>8</option><option>9</option>
        </select>
      </div>
      <button class="hz-btn" id="mixed-add-btn" type="button">＋ Add to load</button>
      <button class="hz-btn-ghost" id="mixed-clear" type="button">Clear all</button>
    </div>
    <div id="mixed-result" style="margin-top:18px;"></div>
  </div>
</div>

<!-- ============ TAB: Specialty markings ============ -->
<div class="tab-pane" id="pane-specialty" role="tabpanel" aria-labelledby="tab-specialty" tabindex="0">
  <div class="hz-panel">
    <div class="hz-panel-head"><div><div class="hz-panel-h-eyebrow">Markings beyond hazard class</div><h2 class="hz-panel-h">Specialty placards + labels — pick to print</h2></div></div>
    <div id="specialty-grid" style="display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:14px;"></div>
  </div>
</div>

<!-- ============ TAB: Explosives compatibility ============ -->
<div class="tab-pane" id="pane-explosives" role="tabpanel" aria-labelledby="tab-explosives" tabindex="0">
  <div class="hz-panel">
    <div class="hz-panel-head"><div><div class="hz-panel-h-eyebrow">Class 1 compatibility groups</div><h2 class="hz-panel-h">Pick the division + compatibility letter</h2></div></div>
    <div id="explosives-grid" style="display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:14px;"></div>
  </div>
</div>

<!-- ============ TAB: UN number plate ============ -->
<div class="tab-pane" id="pane-unplate" role="tabpanel" aria-labelledby="tab-unplate" tabindex="0">
  <div class="hz-panel">
    <div class="hz-panel-head"><div><div class="hz-panel-h-eyebrow">UN number plate · § 172.332</div><h2 class="hz-panel-h">Generate an orange UN ID plate for bulk shipments</h2></div></div>
    <div style="display:grid;grid-template-columns:1fr 2fr;gap:24px;align-items:center;">
      <div>
        <label class="hz-label" for="plate-un">UN ID (4 digits)</label>
        <input id="plate-un" type="text" class="hz-input" placeholder="1203" maxlength="4" style="font-family:monospace;font-weight:700;font-size:14pt;">
        <div style="margin-top:14px;padding:12px;background:rgba(22, 199, 255,0.08);border-left:3px solid #16C7FF;border-radius:0 6px 6px 0;font-size:9.5pt;color:var(--fg);">
          Bulk packagings require both the class placard <strong>and</strong> an orange UN number plate on each side + each end of the vehicle. Plate must be 6.3" tall × 15.75" wide minimum.
        </div>
      </div>
      <div id="plate-output" style="display:flex;justify-content:center;align-items:center;padding:30px;background:#000000;border-radius:12px;border:1px solid rgba(22, 199, 255,0.2);min-height:200px;"></div>
    </div>
  </div>
</div>
`;

export default function PlacardWizardPage() {
  return (
    <HazmatSubPageShell
      activeId="hazmat-placard-wizard"
      pageTitle="PLACARD WIZARD"
      pillMode
      eduSurface="Placard Wizard"
      eduSubtitle="49 CFR § 172.504 · what every placarding decision is graded on"
      conciergeHref="/ask?context=hazmat-placards"
      eduAudiences={[
        {
          label: "For Drivers",
          subtitle: "HAZMAT-ENDORSED CDL HOLDERS",
          body:
            "Before you roll, the placards on your trailer must match the shipping papers in your cab. A wrong or missing placard under § 172.504 is the single fastest way to fail a Level I inspection and get put out of service at the scale.",
          bullets: [
            "Verify the four placards (front, back, both sides) match the shipping paper UN numbers",
            "DANGEROUS placard rules — when you can use it and when you can't (§ 172.504(b))",
            "Subsidiary hazard placards — if the table says so, both go on",
            "Residue (Table 2) thresholds — what to do when you're hauling an empty tank",
          ],
          cta: "Open driver placard guide →",
          href: "/hazmat/substances",
          tone: "cyan",
          icon: "🚛",
        },
        {
          label: "For Employers",
          subtitle: "MOTOR CARRIERS · OFFERORS",
          body:
            "You're on the hook as the offeror under § 171.8. A single mis-placarded shipment is a $96,624 per-day penalty plus an automatic Out-of-Service order under § 397.5. The Wizard makes sure every load leaves with the correct § 172.504 placard table.",
          bullets: [
            "Table 1 vs Table 2 — what gets placarded at any quantity vs only at 454 kg",
            "DANGEROUS aggregation — when mixed loads can use it and when each class is required",
            "Fumigation, marine pollutant, elevated temperature, hot — markings beyond placards",
            "Domestic vs international placard symbology (49 CFR vs IMDG, ICAO)",
          ],
          cta: "Open employer playbook →",
          href: "/hazmat/audit",
          tone: "amber",
        },
        {
          label: "For Compliance Officers",
          subtitle: "SAFETY DIRECTORS · DESIGNATED EMPLOYER REPS",
          body:
            "Placard correctness is one of the four audit areas FMCSA scores during a Compliance Review. Build a placarding SOP off the Wizard's UN → placard map, sample 20 BOLs a quarter, and you have defensible documentation for any inspector.",
          bullets: [
            "Sample 20 BOLs/quarter: do the placards on the equipment match the UN numbers on the paper?",
            "Audit driver placard pre-trip checklists — are they signing them?",
            "DOT Special Permits — placard variances and the carry-on-board requirement (§ 107.601)",
            "Inhalation hazard zones — Zone A through D placards plus the inhalation hazard label",
          ],
          cta: "Open audit checklist →",
          href: "/hazmat/audit",
          tone: "violet",
        },
      ]}
    >
      <script dangerouslySetInnerHTML={{ __html: WIZARD_BOOT }} />
      <div dangerouslySetInnerHTML={{ __html: WIZARD_MARKUP }} />
    </HazmatSubPageShell>
  );
}
