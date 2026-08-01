/* Build-time renderer — emits static HTML fragments. No runtime JS. */
export function render() {
/* X3 Compass — page data + graduated pricing math.
   Pricing canon mirrors src/lib/pricing.ts. Keep the two in sync. */

  var BANDS = [
    { from: 1,   to: 50,   rate: 50, label: "Drivers 1–50" },
    { from: 51,  to: 75,   rate: 40, label: "Drivers 51–75" },
    { from: 76,  to: 100,  rate: 30, label: "Drivers 76–100" },
    { from: 101, to: null, rate: 25, label: "Drivers 101+" }
  ];
  var MIN = 100;

  function monthlyFor(n) {
    n = Math.max(0, Math.floor(n)); if (!n) return 0;
    var t = 0;
    for (var i = 0; i < BANDS.length; i++) {
      var b = BANDS[i]; if (n < b.from) break;
      var up = b.to === null ? n : Math.min(n, b.to);
      t += (up - b.from + 1) * b.rate;
    }
    return Math.max(t, MIN);
  }
  function usd(n) { return "$" + n.toLocaleString("en-US", { maximumFractionDigits: 0 }); }
  const OUT = {};
  function set(id, html) { OUT[id] = html; }

  /* ---- 01 · every X3 product ---- */
  var PRODUCTS = [
    ["Driver Qualification", "49 CFR § 391.51", "All 12 DQ documents per driver. Missing slots surface automatically."],
    ["Drug &amp; Alcohol", "49 CFR Part 382", "Random rates, Clearinghouse queries, pre-employment and post-accident."],
    ["MVR", "49 CFR § 391.25", "Annual review log per driver, per state. Overdue drivers surface on their own."],
    ["Training", "49 CFR Part 380", "ELDT theory + BTW, supervisor D&amp;A, defensive driving. Expiry tracked."],
    ["Vehicles &amp; PM", "49 CFR § 396.3", "Power-unit inventory, annual DOT inspection tracker, PM schedules."],
    ["Accidents", "49 CFR § 390.15", "DOT-recordable register with 3-year retention and preventability review."],
    ["Inspections", "49 CFR § 396.9", "Roadside inspections and DVIRs, Level I–VI, clean-inspection rate live."],
    ["CSA &amp; DataQ", "49 CFR Part 385", "SMS percentile by BASIC with a dispute drafter for contestable violations."],
    ["HazMat", "49 CFR Part 172", "Placarding, segregation tables, shipping-paper validation, TSA endorsement."],
    ["Legal", "FMCSR + Tort", "Subpoena response, litigation hold, retention map, FCRA-timed adverse action."],
    ["Finance &amp; IFTA", "IFTA · § 367 UCR", "Cost-per-mile, IFTA quarterly filing, UCR windows, fuel-tax reconciliation."],
    ["Hours of Service", "49 CFR Part 395", "ELD edits, exemptions, split-sleeper, 14-hour and 70-hour tracking."]
  ];
  set("prodgrid", PRODUCTS.map(function (p) {
    return '<div class="card p-6"><div class="text-[15px] font-extrabold text-white">' + p[0] +
      '</div><div class="mt-1 font-mono text-[11px] text-[#00B2FD]">' + p[1] +
      '</div><p class="mt-3 text-[13.5px] leading-relaxed text-[#AEB9C7]">' + p[2] + "</p></div>";
  }).join(""));

  /* ---- 03 · corpus ---- */
  var CORPUS = [
    ["67,000", "documents in the CFR corpus"],
    ["Live", "citation check against eCFR.gov"],
    ["49 CFR", "Parts 40, 380–399 and 100–180"],
    ["Cited", "every answer names its section"]
  ];
  set("corpusgrid", CORPUS.map(function (c) {
    return '<div class="card p-6 text-center"><div class="text-[30px] font-black leading-none gradtext">' + c[0] +
      '</div><div class="mt-2 text-[13px] leading-relaxed text-[#AEB9C7]">' + c[1] + "</div></div>";
  }).join(""));

  /* ---- 04 · the real cost ---- */
  var COST = [
    ["$14,000+", "New Entrant Safety Audit — failed", "A 3-truck Ohio carrier arrived with 4 of 12 required DQ elements missing. FMCSA placed them out-of-service and revoked authority. Reinstatement took 6 months and $14,000 in legal fees.", "DRIVER QUALIFICATION · 49 CFR 391"],
    ["$6,000", "Missed Clearinghouse pre-employment query", "A Texas carrier hired a CDL driver without the query required under § 382.701. That driver had a prior positive with an incomplete SAP follow-up. FMCSA issued a $6,000 civil penalty.", "DRUG &amp; ALCOHOL · 49 CFR 382"],
    ["$78,500", "HOS pattern — rating downgraded", "A 12-truck Michigan carrier walked into a compliance review with 847 unresolved ELD edits and 31 falsified entries. $78,500 in violations, rating cut to Conditional, insurance non-renewed 90 days later.", "HOURS OF SERVICE · 49 CFR 395"],
    ["$58,000", "Missed random drug &amp; alcohol draws", "A 5-truck Florida carrier went 14 months with no random selection completed. Found during a post-accident audit: eight drivers overdue, $58,000 in penalties, plus exposure in the wrongful-death suit that followed.", "CONTROLLED SUBSTANCES · § 382.305"]
  ];
  set("costgrid", COST.map(function (c) {
    return '<div class="card p-7"><div class="text-[30px] font-black leading-none" style="color:#fb7185">' + c[0] +
      '</div><div class="mt-3 text-[17px] font-extrabold text-white">' + c[1] +
      '</div><p class="mt-3 text-[14px] leading-relaxed text-[#AEB9C7]">' + c[2] +
      '</p><div class="mt-4 font-mono text-[11px] tracking-wide text-[#5B6B7E]">' + c[3] + "</div></div>";
  }).join(""));

  /* ---- 05 · plan inclusions ---- */
  var PLAN = [
    "Every X3 product — no tier gates, no upsell",
    "Full CFR-cited knowledge base",
    "We help set up your vendor integrations",
    "DataQ dispute drafter",
    "Driver Qualification File generator",
    "Auto MVR pull cadence",
    "Unlimited team seats",
    "One-click audit export — your data, always"
  ];
  set("planlist", PLAN.map(function (f) {
    return '<li class="flex gap-3"><span style="color:#00B2FD;flex:none;line-height:1.5">&bull;</span><span>' + f + "</span></li>";
  }).join(""));

  set("bandrows", BANDS.map(function (b) {
    return '<tr class="border-t border-[#1C2533]"><td class="px-4 py-2.5 text-[#AEB9C7]">' + b.label +
      '</td><td class="px-4 py-2.5 text-right font-extrabold tnum text-white">$' + b.rate + "</td></tr>";
  }).join(""));

  set("fleetrows", [10, 25, 50, 75, 100, 150].map(function (n) {
    return '<tr class="border-t border-[#1C2533]"><td class="px-4 py-2.5 text-[#AEB9C7]">' + n +
      ' drivers</td><td class="px-4 py-2.5 text-right font-extrabold tnum text-white">' + usd(monthlyFor(n)) +
      '</td><td class="px-4 py-2.5 text-right tnum text-[#8595A8]">$' + (monthlyFor(n) / n).toFixed(2) + "/drv</td></tr>";
  }).join(""));

  /* ---- 06 · FAQ ---- */
  var FAQ = [
    ["What is X3 Compass?", "Every X3 compliance product on one subscription, for motor carriers running 1–100 power units. Answers are grounded in a 67,000-document CFR corpus and cited to the section they came from."],
    ["How much does it cost?", "One graduated plan: $50/driver/mo for drivers 1–50, $40 for 51–75, $30 for 76–100, and $25 for 101+. Each rate applies only to the drivers in that band, so a 100-driver fleet pays $4,250/mo — not 100 × $30. $100/mo minimum."],
    ["Do I lose features at the lower rates?", "No. Every X3 product is included at every fleet size. The rate per driver falls as you grow; the product never changes."],
    ["Is there a free trial?", "Yes — 7 days, no credit card required. Everything is included in the trial. After 7 days you pick a plan or cancel."],
    ["How does my fleet data get in?", "Upload our CSV templates, enter it manually through CFR-labeled forms, or send it via API. We&rsquo;ll help you set up your vendor integrations either way."],
    ["Are answers really CFR-cited?", "Yes. Every response shows the regulation it&rsquo;s grounded in, and citations are checked against the live eCFR registry. Anything that doesn&rsquo;t verify never leaves the system."],
    ["What if I get a DOT audit?", "Click Audit Export. You get a single indexed PDF bundle — every DQ file, accident, inspection, D&amp;A test and training cert, 3-year retention complete."],
    ["Can I export my data and leave?", "Yes, any time. Every CSV, every PDF, every audit bundle. We charge for the product, not for holding your files."]
  ];
  set("faqlist", FAQ.map(function (f) {
    return '<details class="faqd"><summary>' + f[0] + '</summary><div class="ans">' + f[1] + "</div></details>";
  }).join(""));

  /* ---- family footer columns ---- */
  var FAMILY = [
    ["X3 Fleet Safety", "https://x3fleetsafety.com"], ["X3 Compass", "https://x3compass.com"],
    ["X3 CSA", "https://x3csa.com"], ["X3 DataQ", "https://x3dataq.com"],
    ["X3 MVR", "https://x3mvr.com"], ["X3 Preventability", "https://x3preventability.com"],
    ["X3 HOS", "https://x3hos.com"], ["X3 Clean Truck", "https://x3cleantruck.com"],
    ["X3 HazMat", "https://x3hazmat.com"], ["X3 Drug &amp; Alcohol", "https://x3drugalcohol.com"],
    ["X3 Legal", "https://x3legal.com"]
  ];
  var MORE = [
    ["X3 Verify", "https://x3verify.com"], ["X3 Insurability", "https://x3insurability.com"],
    ["X3 CarrierCheck", "https://x3carriercheck.com"], ["X3 New Entrant", "https://x3newentrant.com"],
    ["X3 DOT Audit", "https://x3dotaudit.com"], ["X3 Permits", "https://x3permits.com"],
    ["X3 Workforce", "https://x3workforce.com"], ["X3 DOT Skills", "https://x3dotskills.com"]
  ];
  function col(list) {
    return list.map(function (p) {
      var cur = p[1] === "https://x3compass.com";
      return '<li><a href="' + p[1] + '"' + (cur ? "" : ' target="_blank" rel="noopener"') + ' class="' +
        (cur ? 'font-semibold text-[#00B2FD] hover:text-white' : 'text-[#E6EEF7] hover:text-white') + '">' + p[0] + "</a></li>";
    }).join("");
  }
  set("famcol", col(FAMILY));
  set("morecol", col(MORE));

  
  

  return OUT;
}
