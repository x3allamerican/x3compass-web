/* Build-time renderer for the X3 Compass homepage.
 * Emits static HTML fragments — nothing here runs in the browser.
 * Card pattern and accent palette follow the X3 CSA family reference:
 *   .card + border-top:3px solid <accent>, accents rotating through
 *   cyan / teal / violet / pink / amber. */

const CYAN = "#00B2FD", TEAL = "#2DD4BF", VIOLET = "#C084FC", PINK = "#F472B6", AMBER = "#FBBF24";
const ROT = [CYAN, TEAL, VIOLET, PINK, AMBER];

/* ---------- 01 · THE SUITE — the actual X3 products ---------- */
const PRODUCTS = [
  ["X3 CSA", "https://x3csa.com", "Live SMS percentile by BASIC, root-cause decomposition and forecasting before enforcement finds you."],
  ["X3 DataQ", "https://x3dataq.com", "Challenge contestable violations. Evidence checklist, drafted dispute, win-pattern templates."],
  ["X3 Preventability", "https://x3preventability.com", "CPDP crash review across all 16+1 categories with RDR drafting and PAR evidence."],
  ["X3 MVR", "https://x3mvr.com", "Annual review log per driver per state, with continuous monitoring and auto pull cadence."],
  ["X3 Drug &amp; Alcohol", "https://x3drugalcohol.com", "Random pools, rate tracking, Clearinghouse queries, pre-employment and post-accident."],
  ["X3 HOS", "https://x3hos.com", "ELD edits, exemptions, split-sleeper, 14- and 70-hour tracking with falsification flags."],
  ["X3 HazMat", "https://x3hazmat.com", "Placarding, segregation tables, shipping papers, ERG lookups and TSA endorsements."],
  ["X3 Legal", "https://x3legal.com", "Subpoena response, litigation hold, retention mapping, FCRA-timed adverse action."],
  ["X3 Verify", "https://x3verify.com", "Background screening and identity verification wired straight into the driver file."],
  ["X3 CarrierCheck", "https://x3carriercheck.com", "Vet carriers and brokers before you sign — authority, insurance, safety posture."],
  ["X3 Insurability", "https://x3insurability.com", "See your fleet the way an underwriter does, before renewal season does it for you."],
  ["X3 New Entrant", "https://x3newentrant.com", "Pass the New Entrant Safety Audit. Every required artifact, tracked to the deadline."],
  ["X3 DOT Audit", "https://x3dotaudit.com", "Compliance-review readiness: gaps, priorities and an indexed export you hand over."],
  ["X3 Permits", "https://x3permits.com", "UCR, IFTA, IRP and state permits with renewal windows watched for you."],
  ["X3 Clean Truck", "https://x3cleantruck.com", "CARB and EPA Clean Truck Check compliance for the jurisdictions that require it."],
  ["X3 Workforce", "https://x3workforce.com", "Hiring, onboarding and qualification workflow from application to first dispatch."],
  ["X3 DOT Skills", "https://x3dotskills.com", "The published, version-controlled CFR skill library the whole platform answers from."],
  ["X3 Fleet Safety", "https://x3fleetsafety.com", "The human side — a real safety advisor on your account when you want one."],
];

/* ---------- THE COMPASS CREW ---------- */
const CREW = [
  ["CMP-1", "Driver Qualification", "Audits all 12 DQ documents per driver against § 391.51 and surfaces missing slots before an auditor does.", CYAN],
  ["CMP-2", "Medical &amp; Certification", "Watches med cards, CDL expirations and ELDT status, and escalates before a driver goes non-compliant.", CYAN],
  ["CMP-3", "Random Pool", "Runs the D&amp;A selection calendar, tracks rate against § 382.305 and flags overdue draws.", TEAL],
  ["CMP-4", "Clearinghouse", "Tracks every pre-employment and annual query you owe and files the result to the driver packet.", TEAL],
  ["CMP-5", "MVR Cadence", "Schedules and pulls annual MVRs per state, then reads them for new violations.", VIOLET],
  ["CMP-6", "Inspection Intelligence", "Reads every roadside inspection, scores severity and OOS impact, routes contestable ones to DataQ.", VIOLET],
  ["CMP-7", "BASIC Decomposition", "Breaks each BASIC into the violations, drivers and terminals actually driving the percentile.", PINK],
  ["CMP-8", "Crash Review", "Applies the CPDP categories, assembles PAR evidence and drafts the RDR.", PINK],
  ["CMP-9", "Maintenance &amp; PM", "Builds § 396 PM schedules, tracks annual inspections and predicts the next vehicle OOS.", AMBER],
  ["CMP-10", "HazMat", "Validates placarding, segregation and shipping papers before the load rolls.", AMBER],
  ["CMP-11", "Training", "Assigns ELDT, supervisor D&amp;A and remedial coaching, then measures whether it worked.", CYAN],
  ["CMP-12", "Audit Readiness", "Asks continuously: if FMCSA knocked tomorrow, are you ready? Score, gaps, priorities.", TEAL],
  ["CMP-13", "Citation Verifier", "Checks every CFR citation against the live eCFR registry. Anything unverified never ships.", VIOLET],
  ["CMP-14", "Concierge", "The front door. Answers any compliance question from the corpus, cited to the section.", PINK],
];

/* ---------- 04 · THE REAL COST — 4 boxes, 2 x 2 ---------- */
const COST = [
  ["$14,000+", "New Entrant audit — failed", "A 3-truck Ohio carrier arrived with 4 of 12 required DQ elements missing. FMCSA placed them out-of-service and revoked authority. Six months and $14,000 in legal fees to get back on the road.", "DRIVER QUALIFICATION &middot; 49 CFR 391", PINK],
  ["$6,000", "Missed Clearinghouse query", "A Texas carrier hired a CDL driver without the pre-employment query required by § 382.701. That driver had a prior positive with an incomplete SAP follow-up. One civil penalty, more than the driver earned that month.", "DRUG &amp; ALCOHOL &middot; 49 CFR 382", VIOLET],
  ["$78,500", "HOS pattern — rating downgraded", "A 12-truck Michigan carrier walked into a compliance review with 847 unresolved ELD edits and 31 falsified entries. Rating cut to Conditional. Insurance non-renewed 90 days later; the primary contract went with it.", "HOURS OF SERVICE &middot; 49 CFR 395", AMBER],
  ["$58,000", "Randoms never pulled", "A 5-truck Florida carrier went 14 months with no random selection completed. Discovered during a post-accident audit: eight drivers overdue — and exposure in the wrongful-death suit that followed.", "CONTROLLED SUBSTANCES &middot; § 382.305", CYAN],
];

/* ---------- pricing canon — mirrors src/lib/pricing.ts ---------- */
const BANDS = [
  { from: 1, to: 50, rate: 50, label: "Drivers 1–50", accent: CYAN },
  { from: 51, to: 75, rate: 40, label: "Drivers 51–75", accent: TEAL },
  { from: 76, to: 100, rate: 30, label: "Drivers 76–100", accent: VIOLET },
  { from: 101, to: null, rate: 25, label: "Drivers 101+", accent: PINK },
];
const MIN = 100;
function monthlyFor(n) {
  n = Math.max(0, Math.floor(n)); if (!n) return 0;
  let t = 0;
  for (const b of BANDS) { if (n < b.from) break; const up = b.to === null ? n : Math.min(n, b.to); t += (up - b.from + 1) * b.rate; }
  return Math.max(t, MIN);
}
const usd = (n) => "$" + n.toLocaleString("en-US", { maximumFractionDigits: 0 });

const FAQ = [
  ["What is X3 Compass?", "One subscription that turns on every product in the X3 family for your fleet — CSA, DataQ, MVR, Drug &amp; Alcohol, HOS, HazMat, Legal and the rest. Answers are grounded in a 67,000-document CFR corpus and cited to the section they came from."],
  ["How much does it cost?", "One graduated plan: $50/driver/mo for drivers 1–50, $40 for 51–75, $30 for 76–100, and $25 for 101+. Each rate applies only to the drivers in that band, so a 100-driver fleet pays $4,250/mo — not 100 × $30. $100/mo minimum."],
  ["Do I lose products at the lower rates?", "No. Every X3 product is included at every fleet size. The rate per driver falls as you grow; what you get never changes."],
  ["Is there a free trial?", "Seven days, no credit card. Everything is on during the trial. After that you pick a plan or walk away with your data."],
  ["How does my fleet data get in?", "Upload our CSV templates, enter it through CFR-labeled forms, or send it via API. We help you set up your vendor integrations either way."],
  ["Are answers really CFR-cited?", "Yes. Every response names the regulation it&rsquo;s grounded in, and each citation is checked against the live eCFR registry. Anything that doesn&rsquo;t verify never leaves the system."],
  ["What happens if I get audited?", "Click Audit Export. One indexed PDF bundle — every DQ file, accident, inspection, D&amp;A test and training certificate, three-year retention complete."],
  ["Can I export everything and leave?", "Any time. Every CSV, every PDF, every audit bundle. We charge for the product, not for holding your files hostage."],
];

const FAMILY = [
  ["X3 Fleet Safety", "https://x3fleetsafety.com"], ["X3 Compass", "https://x3compass.com"],
  ["X3 CSA", "https://x3csa.com"], ["X3 DataQ", "https://x3dataq.com"],
  ["X3 MVR", "https://x3mvr.com"], ["X3 Preventability", "https://x3preventability.com"],
  ["X3 HOS", "https://x3hos.com"], ["X3 Clean Truck", "https://x3cleantruck.com"],
  ["X3 HazMat", "https://x3hazmat.com"], ["X3 Drug &amp; Alcohol", "https://x3drugalcohol.com"],
  ["X3 Legal", "https://x3legal.com"],
];
const MORE = [
  ["X3 Verify", "https://x3verify.com"], ["X3 Insurability", "https://x3insurability.com"],
  ["X3 CarrierCheck", "https://x3carriercheck.com"], ["X3 New Entrant", "https://x3newentrant.com"],
  ["X3 DOT Audit", "https://x3dotaudit.com"], ["X3 Permits", "https://x3permits.com"],
  ["X3 Workforce", "https://x3workforce.com"], ["X3 DOT Skills", "https://x3dotskills.com"],
];

export function render() {
  const O = {};

  O.prodgrid = PRODUCTS.map((p, i) => {
    const a = ROT[i % ROT.length];
    return `<a href="${p[1]}" target="_blank" rel="noopener" class="card block p-6 transition-transform hover:-translate-y-1" style="border:1px solid rgba(255,255,255,.10);border-top:3px solid ${a}">
      <div class="text-[16px] font-extrabold text-white">${p[0]}</div>
      <p class="mt-2.5 text-[13.5px] leading-relaxed text-[#AEB9C7]">${p[2]}</p>
      <div class="mt-4 font-mono text-[11px] font-bold uppercase tracking-widest" style="color:${a}">Included &rarr;</div>
    </a>`;
  }).join("");

  O.crewgrid = CREW.map((c) =>
    `<div class="card p-7" style="border:1px solid rgba(255,255,255,.10);border-top:3px solid ${c[3]}">
      <div class="font-mono text-[13px] font-extrabold" style="color:${c[3]}">${c[0]}</div>
      <h3 class="mt-2 text-[18px] font-extrabold leading-snug tracking-tight">${c[1]}</h3>
      <p class="mt-3 text-[14px] leading-relaxed text-[#AEB9C7]">${c[2]}</p>
    </div>`).join("");

  O.costgrid = COST.map((c) =>
    `<div class="card p-8" style="border:1px solid rgba(255,255,255,.10);border-top:3px solid ${c[4]}">
      <div class="text-[36px] font-black leading-none" style="color:${c[4]}">${c[0]}</div>
      <h3 class="mt-3 text-[19px] font-extrabold tracking-tight text-white">${c[1]}</h3>
      <p class="mt-3 text-[14px] leading-relaxed text-[#AEB9C7]">${c[2]}</p>
      <div class="mt-5 font-mono text-[11px] tracking-widest text-[#5B6B7E]">${c[3]}</div>
    </div>`).join("");

  O.ticker = PRODUCTS.concat(PRODUCTS).map((p, i) =>
    `<span class="inline-flex items-center gap-3 rounded-full border border-[#1C2533] bg-[#0B0F16] px-5 py-3">
      <span class="h-2 w-2 rounded-full" style="background:${ROT[i % ROT.length]}"></span>
      <span class="text-[14px] font-semibold whitespace-nowrap text-white">${p[0]}</span>
    </span>`).join("");

  O.planlist = [
    "Every X3 product — no tier gates, no upsell",
    "The full CFR corpus, every answer cited",
    "We help set up your vendor integrations",
    "Unlimited team seats",
    "One-click audit export — your data, always",
  ].map((f) => `<li class="flex gap-3"><span style="color:${CYAN};flex:none;line-height:1.5">&bull;</span><span>${f}</span></li>`).join("");

  /* ladder as cards, not a bare table */
  O.ladder = BANDS.map((b) =>
    `<div class="flex items-center justify-between rounded-xl border border-[#1C2533] bg-[#0B0F16] px-5 py-4" style="border-left:3px solid ${b.accent}">
      <div><div class="text-[15px] font-bold text-white">${b.label}</div>
      <div class="mt-0.5 font-mono text-[11px] uppercase tracking-widest text-[#5B6B7E]">${b.to === null ? "and beyond" : "in this band"}</div></div>
      <div class="text-right"><span class="text-[28px] font-black tabular-nums" style="color:${b.accent}">$${b.rate}</span>
      <span class="ml-1 text-[12px] text-[#8595A8]">/drv/mo</span></div>
    </div>`).join("");

  /* worked example — show the arithmetic */
  const rows = [];
  let run = 0;
  for (const b of BANDS) {
    if (100 < b.from) break;
    const up = b.to === null ? 100 : Math.min(100, b.to);
    const cnt = up - b.from + 1; const sub = cnt * b.rate; run += sub;
    rows.push(`<div class="flex items-center justify-between py-2 text-[13.5px]">
      <span class="text-[#AEB9C7]"><span class="font-mono" style="color:${b.accent}">${cnt}</span> drivers &times; $${b.rate}</span>
      <span class="font-bold tabular-nums text-white">${usd(sub)}</span></div>`);
  }
  O.worked = rows.join("") +
    `<div class="mt-2 flex items-center justify-between border-t border-[#1C2533] pt-3">
      <span class="text-[14px] font-extrabold text-white">100 drivers</span>
      <span class="text-[22px] font-black tabular-nums gradtext">${usd(run)}/mo</span></div>`;

  O.fleetrows = [10, 25, 50, 75, 100, 150].map((n) => {
    const m = monthlyFor(n);
    return `<div class="rounded-xl border border-[#1C2533] bg-[#0B0F16] p-4 text-center">
      <div class="font-mono text-[11px] uppercase tracking-widest text-[#5B6B7E]">${n} drivers</div>
      <div class="mt-1.5 text-[22px] font-black tabular-nums text-white">${usd(m)}</div>
      <div class="mt-0.5 text-[12px] tabular-nums text-[#8595A8]">$${(m / n).toFixed(2)}/drv</div>
    </div>`;
  }).join("");

  O.faqlist = FAQ.map((f) =>
    `<details class="faqd"><summary>${f[0]}</summary><div class="ans">${f[1]}</div></details>`).join("");

  const col = (list) => list.map((p) => {
    const cur = p[1] === "https://x3compass.com";
    return `<li><a href="${p[1]}"${cur ? "" : ' target="_blank" rel="noopener"'} class="${cur ? "font-semibold text-[#00B2FD] hover:text-white" : "text-[#E6EEF7] hover:text-white"}">${p[0]}</a></li>`;
  }).join("");
  O.famcol = col(FAMILY);
  O.morecol = col(MORE);

  return O;
}
