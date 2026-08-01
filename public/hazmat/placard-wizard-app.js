
// Tabs
// ARIA tabs — click + arrow-key navigation per WAI-ARIA APG
(function setupAriaTabs(){
  const tabs = Array.from(document.querySelectorAll('[role="tab"]'));
  const panels = Array.from(document.querySelectorAll('[role="tabpanel"]'));
  function activate(tab){
    tabs.forEach(t => {
      const isActive = t === tab;
      t.classList.toggle('on', isActive);
      t.setAttribute('aria-selected', isActive ? 'true' : 'false');
      t.setAttribute('tabindex', isActive ? '0' : '-1');
    });
    const targetId = 'pane-' + tab.dataset.tab;
    panels.forEach(p => p.classList.toggle('on', p.id === targetId));
  }
  tabs.forEach((t, i) => {
    t.addEventListener('click', () => { activate(t); t.focus(); });
    t.addEventListener('keydown', e => {
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
        e.preventDefault();
        const next = tabs[(i + 1) % tabs.length];
        activate(next); next.focus();
      } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        e.preventDefault();
        const prev = tabs[(i - 1 + tabs.length) % tabs.length];
        activate(prev); prev.focus();
      } else if (e.key === 'Home') {
        e.preventDefault(); activate(tabs[0]); tabs[0].focus();
      } else if (e.key === 'End') {
        e.preventDefault(); activate(tabs[tabs.length-1]); tabs[tabs.length-1].focus();
      }
    });
  });
})();


// Load UN DB + segregation rules
let UN_DB = {}, UN_LIST = [], SEG = {};
Promise.all([
  fetch('/hazmat/un-database.json').then(r=>r.json()),
  fetch('/hazmat/segregation-rules.json').then(r=>r.json())
]).then(([db, seg]) => {
  UN_DB = db;
  UN_LIST = Object.values(db).sort((a,b)=>a.un.localeCompare(b.un));
  SEG = seg.matrix;
});

// Autocomplete on shipping name
const acBox = document.getElementById('autocomplete');
document.getElementById('ship-name').addEventListener('input', e => {
  const q = e.target.value.toLowerCase().trim();
  if (q.length < 2) { acBox.style.display = 'none'; return; }
  const hits = UN_LIST.filter(r => r.name.toLowerCase().includes(q)).slice(0, 30);
  if (hits.length === 0) { acBox.style.display = 'none'; return; }
  acBox.innerHTML = hits.map(r => `<div data-un="${r.un}" class="ac-row" style="padding:8px 12px;cursor:pointer;border-bottom:1px solid #F1F5F9;font-size:10pt;display:flex;justify-content:space-between;gap:10px;"><span><strong style="font-family:monospace;">UN ${r.un}</strong> ${r.name}</span><span style="color:#0066B5;font-weight:700;">${r.class}</span></div>`).join('');
  acBox.style.display = 'block';
  acBox.querySelectorAll('.ac-row').forEach(el => el.addEventListener('click', () => {
    document.getElementById('un-id').value = el.dataset.un;
    document.getElementById('ship-name').value = UN_DB[el.dataset.un].name;
    acBox.style.display = 'none';
    runLookup(el.dataset.un);
  }));
});
document.addEventListener('click', e => { if (!acBox.contains(e.target) && e.target.id !== 'ship-name') acBox.style.display = 'none'; });

function isValidClass(c) { return /^\d+(\.\d+)?[A-Za-z]?$/.test(c||''); }
function runLookup(unIdRaw) {
  const un = (unIdRaw || document.getElementById('un-id').value.trim()).padStart(4,'0').slice(-4);
  if (!un) return;
  const data = UN_DB[un];
  const panel = document.getElementById('result-panel');
  panel.style.display = 'block';
  if (!data) {
    document.getElementById('result-title').textContent = `UN ${un} not found`;
    document.getElementById('placard-output').innerHTML = `<div style="color:#94A3B8;font-size:10pt;text-align:center;padding:24px;">Try the autocomplete or browse the full <a href="/app/hazmat/substances">Substance Lookup</a>.</div>`;
    document.getElementById('result-rows').innerHTML = '';
    document.getElementById('segregation-panel').style.display = 'none';
    document.getElementById('bulk-warning').style.display = 'none';
    return;
  }
  document.getElementById('result-title').textContent = `UN ${un} · ${data.name}`;
  if (isValidClass(data.class)) {
    document.getElementById('placard-output').innerHTML = window.renderPlacardSvg(data.class, un, 360);
  } else {
    document.getElementById('placard-output').innerHTML = `<div style="color:#94A3B8;padding:24px;text-align:center;">Class data quality issue — see <a href="/app/hazmat/substances?q=${un}">substance details</a>.</div>`;
  }
  const ergGuide = ""; // we'd map ERG separately
  document.getElementById('result-rows').innerHTML = `
    <tr><td><strong>UN ID</strong></td><td><strong style="font-family:monospace;">UN ${un}</strong></td><td><span class="hz-tile-cfr">172.101 col. 1</span></td></tr>
    <tr><td>Proper Shipping Name</td><td>${data.name}</td><td><span class="hz-tile-cfr">172.101 col. 2</span></td></tr>
    <tr><td>Hazard Class / Division</td><td><strong>${data.class}</strong> · ${window.PLACARD_NAMES[data.class] || ''}</td><td><span class="hz-tile-cfr">172.101 col. 3</span></td></tr>
    <tr><td>Placard required (bulk ≥ 1,001 lbs)</td><td><strong>YES</strong> — display on all four sides</td><td><span class="hz-tile-cfr">172.504</span></td></tr>
    <tr><td>ER phone required</td><td><strong>YES</strong> — CHEMTREC 1-800-424-9300 or carrier 24/7 number</td><td><span class="hz-tile-cfr">172.604</span></td></tr>
  `;
  // Bulk warning
  document.getElementById('bulk-warning').style.display = 'block';
  document.getElementById('bulk-warning').innerHTML = `<div style="padding:12px 14px;background:#FFFBEB;border-left:3px solid #F59E0B;border-radius:0 6px 6px 0;font-size:10pt;color:var(--fg);">
    <strong>Bulk vs non-bulk:</strong> Placard required for Table 1 hazmat (any qty) or Table 2 hazmat at <strong>1,001 lbs+ gross weight</strong> per § 172.504(c). Below threshold: labels only on packages.
  </div>`;
  // Segregation
  renderSegregation(data.class);
  /* removed: history.replaceState was triggering Next.js re-render */
}

function renderSegregation(cls) {
  const panel = document.getElementById('segregation-panel');
  const row = SEG[cls];
  if (!row) { panel.style.display = 'none'; return; }
  panel.style.display = 'block';
  const X = [], O = [];
  Object.entries(row).forEach(([k, v]) => { if (v === 'X') X.push(k); else if (v === 'O') O.push(k); });
  let html = `<div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;">
    <div style="background:#FEE2E2;padding:18px;border-radius:10px;border:1px solid #FCA5A5;">
      <div style="font-size:9pt;font-weight:800;color:#991B1B;letter-spacing:1pt;text-transform:uppercase;margin-bottom:8px;">X — Must not load together</div>
      <div style="display:flex;flex-wrap:wrap;gap:6px;">${X.map(c=>`<span style="background:#DC2626;color:#FFF;padding:4px 10px;border-radius:5px;font-weight:700;font-size:10pt;">Class ${c}</span>`).join('') || '<span style="color:#475569;">None</span>'}</div>
    </div>
    <div style="background:#FEF3C7;padding:18px;border-radius:10px;border:1px solid #FCD34D;">
      <div style="font-size:9pt;font-weight:800;color:#92400E;letter-spacing:1pt;text-transform:uppercase;margin-bottom:8px;">O — Must be separated per 177.848</div>
      <div style="display:flex;flex-wrap:wrap;gap:6px;">${O.map(c=>`<span style="background:#F59E0B;color:#0A1628;padding:4px 10px;border-radius:5px;font-weight:700;font-size:10pt;">Class ${c}</span>`).join('') || '<span style="color:#475569;">None</span>'}</div>
    </div>
  </div>
  <div style="margin-top:14px;padding:12px 14px;background:#0A1628;border-left:3px solid #00B2FD;border-radius:0 6px 6px 0;font-size:9.5pt;color:var(--fg-muted);">
    <strong>X</strong> = cannot transport together in same vehicle, container, or storage area. <strong>O</strong> = must be separated by physical distance or barrier. Always reference the full 49 CFR § 177.848 table for exact requirements.
  </div>`;
  document.getElementById('segregation-output').innerHTML = html;
}

document.getElementById('lookup-btn').addEventListener('click', () => runLookup());
document.getElementById('un-id').addEventListener('keydown', e => { if (e.key === 'Enter') runLookup(); });

// ===== Mixed-load tab =====
let MIXED = [];
function renderMixed() {
  const chips = document.getElementById('mixed-classes');
  chips.innerHTML = MIXED.map((c,i) => `<span style="background:rgba(22, 199, 255,0.08);border:1px solid #BAE6FD;color:#0066B5;padding:6px 10px;border-radius:6px;font-weight:700;display:inline-flex;gap:6px;align-items:center;">Class ${c} <button data-i="${i}" style="background:none;border:0;color:#0066B5;cursor:pointer;font-weight:900;">×</button></span>`).join('');
  chips.querySelectorAll('button').forEach(b => b.addEventListener('click', () => { MIXED.splice(parseInt(b.dataset.i,10),1); renderMixed(); }));
  const out = document.getElementById('mixed-result');
  if (MIXED.length === 0) { out.innerHTML = ''; return; }
  const uniq = new Set(MIXED);
  // Check segregation conflicts
  const conflicts = [];
  for (const a of uniq) for (const b of uniq) if (a !== b && SEG[a] && SEG[a][b] === 'X') conflicts.push([a, b]);
  if (uniq.size >= 2) {
    if (conflicts.length) {
      out.innerHTML = `<div style="padding:18px;background:#FEE2E2;border-left:4px solid #DC2626;border-radius:0 8px 8px 0;">
        <div style="font-weight:800;color:#991B1B;font-size:11pt;margin-bottom:6px;">⛔ Segregation conflict — cannot place these classes on same vehicle</div>
        <div style="color:var(--fg);font-size:10pt;line-height:1.6;">${conflicts.map(([a,b])=>`Class ${a} ↔ Class ${b}`).join(' · ')}</div>
        <div style="color:var(--fg-muted);font-size:9.5pt;margin-top:6px;">Per 49 CFR § 177.848 segregation table. Re-route or split the load.</div>
      </div>`;
    } else {
      out.innerHTML = `<div style="padding:18px;background:#D1FAE5;border-left:4px solid #059669;border-radius:0 8px 8px 0;margin-bottom:14px;">
        <div style="font-weight:800;color:#065F46;font-size:11pt;margin-bottom:6px;">✓ DANGEROUS placard authorized</div>
        <div style="color:var(--fg);font-size:10pt;">Multiple hazard classes in non-bulk packagings, no segregation conflicts. Per § 172.504(b), you may use a single DANGEROUS placard on all four sides instead of multiple class placards — provided no single class exceeds 2,205 lbs (1,000 kg) gross weight.</div>
      </div>
      <div style="display:flex;gap:18px;align-items:center;padding:14px;background:#0F1F35;border:1px solid rgba(22, 199, 255,0.2);border-radius:10px;">
        ${window.renderSpecialtyPlacard('dangerous', 200)}
        <div style="flex:1;color:var(--fg);font-size:10pt;">All four sides of the transport vehicle. If any single class exceeds 2,205 lbs in one packaging, that class still needs its own placard alongside DANGEROUS.</div>
      </div>`;
    }
  } else {
    out.innerHTML = `<div style="padding:14px;color:var(--fg-muted);">Add at least 2 hazard classes to see DANGEROUS authorization.</div>`;
  }
}
document.getElementById('mixed-add-btn').addEventListener('click', () => {
  const v = document.getElementById('mixed-add').value;
  if (v && !MIXED.includes(v)) { MIXED.push(v); renderMixed(); }
});
document.getElementById('mixed-clear').addEventListener('click', () => { MIXED = []; renderMixed(); });

// ===== Specialty markings tab =====
function renderSpecialty() {
  const grid = document.getElementById('specialty-grid');
  grid.innerHTML = Object.entries(window.SPECIALTY_PLACARDS).map(([k, cfg]) => `
    <div style="background:#0F1F35;border:1px solid rgba(22, 199, 255,0.2);border-radius:10px;padding:14px;display:flex;flex-direction:column;align-items:center;gap:10px;">
      <div style="height:180px;display:flex;align-items:center;">${window.renderSpecialtyPlacard(k, 180)}</div>
      <div style="text-align:center;width:100%;">
        <div style="font-weight:800;color:var(--fg);font-size:10.5pt;">${cfg.name}</div>
        <span class="hz-tile-cfr" style="margin:6px 0;display:inline-block;">${cfg.cfr}</span>
        <div style="color:var(--fg-muted);font-size:9.5pt;line-height:1.4;">${cfg.desc}</div>
      </div>
    </div>
  `).join('');
}
setTimeout(renderSpecialty, 200);

// ===== Explosives compatibility tab =====
const EXPL_GROUPS = ['1.1','1.1A','1.1B','1.1C','1.1D','1.1E','1.1F','1.1G','1.2','1.3','1.3G','1.4','1.4C','1.4D','1.4S','1.5','1.6','1.6N'];
const EXPL_DESC = {
  "1.1":"Mass explosion hazard","1.1A":"Primary explosive substance","1.1B":"Detonating cap or assembly","1.1C":"Propellant explosive","1.1D":"Secondary detonating substance","1.1E":"Article with secondary explosive + propelling charge","1.1F":"Article with secondary explosive + ignition device","1.1G":"Pyrotechnic substance",
  "1.2":"Projection hazard, not mass","1.3":"Fire hazard, minor blast","1.3G":"Pyrotechnic article","1.4":"Minor explosion","1.4C":"Propellant — minor explosion","1.4D":"Secondary explosive — minor","1.4S":"No significant hazard (S = safety)","1.5":"Very insensitive — blasting agent","1.6":"Extremely insensitive","1.6N":"Extremely insensitive article"
};
function renderExplosives() {
  const grid = document.getElementById('explosives-grid');
  grid.innerHTML = EXPL_GROUPS.map(c => `
    <div style="background:#0F1F35;border:1px solid rgba(22, 199, 255,0.2);border-radius:10px;padding:14px;display:flex;flex-direction:column;align-items:center;gap:8px;">
      <div style="height:180px;display:flex;align-items:center;">${window.renderPlacardSvg(c, null, 180)}</div>
      <div style="text-align:center;">
        <div style="font-weight:800;color:var(--fg);font-size:11pt;font-family:monospace;">Class ${c}</div>
        <div style="color:var(--fg-muted);font-size:9.5pt;line-height:1.3;margin-top:3px;">${EXPL_DESC[c]||""}</div>
      </div>
    </div>
  `).join('');
}
setTimeout(renderExplosives, 200);

// ===== UN plate tab =====
function refreshPlate() {
  const v = document.getElementById('plate-un').value.replace(/\D/g,'').slice(0,4);
  document.getElementById('plate-output').innerHTML = window.renderUnNumberPlate(v, 380);
}
document.getElementById('plate-un').addEventListener('input', e => {
  e.target.value = e.target.value.replace(/\D/g,'').slice(0,4);
  refreshPlate();
});
refreshPlate();

// Auto-load from query
const qs = new URLSearchParams(location.search);
if (qs.get('un')) {
  document.getElementById('un-id').value = qs.get('un');
  setTimeout(() => runLookup(qs.get('un')), 500);
}

// Print button — server components can't carry React onClick, so we wire it here
document.getElementById('print-btn')?.addEventListener('click', () => window.print());
