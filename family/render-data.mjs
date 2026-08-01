/* Build-time renderer for the X3 Compass homepage.
 * Emits static HTML fragments — nothing here runs in the browser.
 * Card pattern and accent palette follow the X3 CSA family reference:
 *   .card + border-top:3px solid <accent>, accents rotating through
 *   cyan / teal / violet / pink / amber. */

const CYAN = "#00B2FD", TEAL = "#2DD4BF", VIOLET = "#C084FC", PINK = "#F472B6", AMBER = "#FBBF24";
const ROT = [CYAN, TEAL, VIOLET, PINK, AMBER];

/* ---------- 01 · THE SUITE ----------
   Source of truth: the live footer + services grid on x3fleetsafety.com.
   NOT X3_FOOTER_STANDARD.md, which is stale (it still lists DOT Skills, omits
   Background / SOP / Environmental, and wrongly counts Fleet Safety as a
   product — Fleet Safety is the umbrella, not a tool).
   Card imagery is the same photography the parent site uses per product. */
const PRODUCTS = [
  ["X3 CSA", "https://x3csa.com", "csa", "See your SMS percentiles and exactly what&rsquo;s pulling them up."],
  ["X3 DataQ", "https://x3dataq.com", "dataq", "Challenge and remove unfair violations and crashes from your record."],
  ["X3 Preventability", "https://x3preventability.com", "preventability", "CPDP crash review, PAR evidence and the RDR drafted for you."],
  ["X3 MVR", "https://x3mvr.com", "mvr", "Annual review per driver per state, with continuous monitoring."],
  ["X3 Background", "https://x3background.com", "background", "Pre-employment screening wired straight into the driver file."],
  ["X3 Drug &amp; Alcohol", "https://x3drugalcohol.com", "drugalcohol", "Random pools, rate tracking and Clearinghouse queries under Part 382."],
  ["X3 HOS", "https://x3hos.com", "hos", "ELD edits, exemptions, split-sleeper and the 14- and 70-hour clocks."],
  ["X3 HazMat", "https://x3hazmat.com", "hazmat", "Placarding, segregation, shipping papers and TSA endorsements."],
  ["X3 DOT Audit", "https://x3dotaudit.com", "dotaudit", "Compliance-review readiness: gaps, priorities and the export you hand over."],
  ["X3 New Entrant", "https://x3newentrant.com", "newentrant", "Pass the New Entrant Safety Audit with every artifact tracked to deadline."],
  ["X3 CarrierCheck", "https://x3carriercheck.com", "carriercheck", "Vet any carrier or broker before you sign — authority, insurance, safety."],
  ["X3 Insurability", "https://x3insurability.com", "insurability", "See your fleet the way an underwriter does, before renewal does it for you."],
  ["X3 Legal", "https://x3legal.com", "legal", "Subpoena response, litigation hold, retention and FCRA-timed adverse action."],
  ["X3 Permits", "https://x3permits.com", "permits", "UCR, IFTA, IRP and state permits with every renewal window watched."],
  ["X3 Clean Truck", "https://x3cleantruck.com", "cleantruck", "CARB and EPA Clean Truck Check for the jurisdictions that require it."],
  ["X3 Environmental", "https://x3enviro.com", "enviro", "Environmental compliance across the EPA rules that touch your operation."],
  ["X3 Verify", "https://x3verify.com", "verify", "Identity and credential verification at the point you need it."],
  ["X3 Workforce", "https://x3workforce.com", "workforce", "Hiring, onboarding and qualification from application to first dispatch."],
  ["X3 SOP", "https://x3sop.com", "sop", "Written procedures your people actually follow, mapped to the reg."],
  ["X3 API", "https://x3api.com", "api", "The published CFR skill library and API the whole platform answers from."],
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
  ["CMP-14", "IFTA &amp; Permits", "Watches IFTA quarters, UCR windows and state permit renewals so none of them lapse.", AMBER],
  ["CMP-15", "Audit Export", "Assembles the indexed three-year packet on demand — every file an auditor asks for.", CYAN],
  ["CMP-16", "Concierge", "The front door. Answers any compliance question from the corpus, cited to the section.", PINK],
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

/* Footer columns mirror x3fleetsafety.com exactly. */
const FAMILY = [
  ["X3 Compass", "https://x3compass.com"], ["X3 CSA", "https://x3csa.com"],
  ["X3 DataQ", "https://x3dataq.com"], ["X3 DOT Audit", "https://x3dotaudit.com"],
  ["X3 CarrierCheck", "https://x3carriercheck.com"], ["X3 New Entrant", "https://x3newentrant.com"],
  ["X3 Insurability", "https://x3insurability.com"], ["X3 MVR", "https://x3mvr.com"],
  ["X3 Background", "https://x3background.com"], ["X3 Clean Truck", "https://x3cleantruck.com"],
  ["X3 Permits", "https://x3permits.com"],
];
const MORE = [
  ["X3 HazMat", "https://x3hazmat.com"], ["X3 Drug &amp; Alcohol", "https://x3drugalcohol.com"],
  ["X3 Preventability", "https://x3preventability.com"], ["X3 HOS", "https://x3hos.com"],
  ["X3 Legal", "https://x3legal.com"], ["X3 SOP", "https://x3sop.com"],
  ["X3 Verify", "https://x3verify.com"], ["X3 Workforce", "https://x3workforce.com"],
  ["X3 API", "https://x3api.com"], ["X3 Environmental", "https://x3enviro.com"],
];

export function render() {
  const O = {};

  O.prodgrid = PRODUCTS.map((p, i) => {
    const a = ROT[i % ROT.length];
    return `<a href="${p[1]}" target="_blank" rel="noopener" class="card group block overflow-hidden transition-transform hover:-translate-y-1" style="border:1px solid rgba(255,255,255,.10);border-top:3px solid ${a}">
      <div class="relative aspect-[16/10] overflow-hidden">
        <img src="/img/products/${p[2]}.jpg" alt="${p[0].replace(/&[a-z]+;/g, "and")}" loading="lazy" class="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.06]"/>
        <div class="absolute inset-0" style="background:linear-gradient(180deg,rgba(11,15,22,.10) 40%,rgba(11,15,22,.92))"></div>
      </div>
      <div class="p-6">
        <div class="text-[16px] font-extrabold text-white">${p[0]}</div>
        <p class="mt-2 text-[13.5px] leading-relaxed text-[#AEB9C7]">${p[3]}</p>
        <div class="mt-4 font-mono text-[11px] font-bold uppercase tracking-widest" style="color:${a}">Included &rarr;</div>
      </div>
    </a>`;
  }).join("");

  O.crewgrid = CREW.map((c) =>
    `<div class="card p-7" style="border:1px solid rgba(255,255,255,.10);border-top:3px solid ${c[3]}">
      <div class="font-mono text-[13px] font-extrabold" style="color:${c[3]}">${c[0]}</div>
      <h3 class="mt-2 text-[18px] font-extrabold leading-snug tracking-tight">${c[1]}</h3>
      <p class="mt-3 text-[14px] leading-relaxed text-[#AEB9C7]">${c[2]}</p>
    </div>`).join("");

  const costCard = (c) =>
    `<div class="card p-8" style="border:1px solid rgba(255,255,255,.10);border-top:3px solid ${c[4]}">
      <div class="text-[36px] font-black leading-none" style="color:${c[4]}">${c[0]}</div>
      <h3 class="mt-3 text-[19px] font-extrabold tracking-tight text-white">${c[1]}</h3>
      <p class="mt-3 text-[14px] leading-relaxed text-[#AEB9C7]">${c[2]}</p>
      <div class="mt-5 font-mono text-[11px] tracking-widest text-[#5B6B7E]">${c[3]}</div>
    </div>`;
  /* two columns, two boxes stacked in each */
  O.costgrid =
    `<div class="flex flex-col gap-6">${costCard(COST[0])}${costCard(COST[1])}</div>` +
    `<div class="flex flex-col gap-6">${costCard(COST[2])}${costCard(COST[3])}</div>`;

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
