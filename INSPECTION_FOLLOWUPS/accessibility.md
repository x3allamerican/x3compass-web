# Accessibility Follow-ups — path from 9.0 → 9.5+

**Date:** 2026-05-19
**Baseline:** 7.4 (current) → 9.0 (queued commit e8f4890 + landmarks)
**Target:** 9.5+

Audited at `src/components/SiteShell.tsx`, `src/components/AppShell.tsx`, `src/components/TopNav.tsx`, `src/app/layout.tsx`, all `src/app/app/*/page.tsx` pills, `src/app/signin/page.tsx`, `src/components/app/{VendorConnect,DriverImport}Modal.tsx`, `src/components/SkillsExplorer.tsx`.

---

## Finding 1 — Skip-link is MISSING entirely (not in SiteShell either)
**Severity:** serious · **Effort:** 5 min · **Impact:** +0.15

`grep -rn "skip-link\|Skip to" src/` returns zero hits. The brief was wrong — SiteShell does NOT have one. Good news: `src/app/layout.tsx:92` already wraps children in `<main id="main">`, so the anchor target exists.

**Fix — add to `src/app/layout.tsx` immediately after `<body>` (line 91), so it covers BOTH SiteShell and AppShell trees in one shot:**

```tsx
<body>
  <a
    href="#main"
    className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-[100] focus:px-4 focus:py-2 focus:rounded-md focus:bg-[var(--accent)] focus:text-[var(--bg)] focus:font-bold focus:shadow-lg"
  >
    Skip to main content
  </a>
  <ThemeProvider>
    <main id="main">{children}</main>
```

Tailwind's `sr-only` + `focus:not-sr-only` handles the show-on-tab pattern. No new CSS needed — `.sr-only-focus` in globals.css line 154 confirms the utility exists.

---

## Finding 2 — Pill components have NO aria-label
**Severity:** serious · **Effort:** 20 min · **Impact:** +0.35

A screen-reader user hearing "REPLIED" or "CONDITIONAL" has no context. Each pill in 8 files needs `role="status"` + a descriptive `aria-label`.

Files + pill components (all share the same `<span className={...}>{LABEL}</span>` shape):
- `src/app/app/prospects/page.tsx` — `RatingPill` (line 68), `OutreachPill` (line 84), `RunPill`
- `src/app/app/audit-log/page.tsx` — `ActionPill` (line 51)
- `src/app/app/audit-export/page.tsx` — `StatusPill` (line 29)
- `src/app/app/marketing/page.tsx` — `StatusPill` (line 49)
- `src/app/app/finance/page.tsx` — `StatusPill` (line 52), `TypePill`
- `src/app/app/notifications/page.tsx` — `StatusPill` (line 60), `ChannelPill` (line 67)
- `src/app/app/accidents/page.tsx`, `src/app/app/inspections/page.tsx`, `src/app/app/scorecards/page.tsx` — same pattern

**Fix template** (apply to every pill — e.g. `OutreachPill`):
```tsx
return (
  <span
    role="status"
    aria-label={`Outreach status: ${label}`}
    className={`inline-block min-w-[90px] px-2 py-0.5 rounded-full text-[10px] font-extrabold border whitespace-nowrap text-center tracking-wider uppercase ${cls}`}
  >
    {label}
  </span>
);
```

For `RatingPill` → `aria-label={`Safety rating: ${r}`}`. For `ActionPill` → `aria-label={`Audit action: ${action}`}`. For `ChannelPill` → `aria-label={`Channel: ${CHANNEL_LABEL[channel] || channel}`}`. ~14 pill functions × 1 line each.

---

## Finding 3 — Modal Escape handler missing in 2 of 3 modals
**Severity:** serious · **Effort:** 10 min · **Impact:** +0.15

`SkillsExplorer.tsx:145-150` correctly wires `window.addEventListener("keydown", e => e.key === "Escape" && setOpenSkill(null))`. The other two modals (clicked-anywhere-outside works, Escape does NOT):
- `src/components/app/VendorConnectModal.tsx` (line 71 has a `useEffect` but no keydown handler)
- `src/components/app/DriverImportModal.tsx`

**Fix — add inside the existing `useEffect` (or new one) in both modals:**
```tsx
useEffect(() => {
  const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
  window.addEventListener("keydown", onKey);
  return () => window.removeEventListener("keydown", onKey);
}, [onClose]);
```

Also add `role="dialog" aria-modal="true" aria-labelledby="modal-title"` to the wrapper at line 111 (Vendor) / 83 (Driver), and give the existing title `<h2>` an `id="modal-title"`. The backdrop `<div onClick={onClose}>` should add `tabIndex={-1}`. Same fix on `src/app/app/audit-export/page.tsx` and `src/app/app/inspections/page.tsx` modals.

---

## Finding 4 — Forms have ZERO aria-describedby / aria-invalid / role="alert"
**Severity:** moderate · **Effort:** 30 min · **Impact:** +0.20

`grep -rn "aria-describedby\|aria-invalid\|role=\"alert\"" src/` returns nothing across the entire codebase. `src/app/signin/page.tsx:73-103` is a representative form — labels are correct (`htmlFor`/`id` paired), but error display is missing entirely. Same for `/signup`, partner application, finance Add Entry tab, marketing Tracking Link Builder, settings tabs.

**Fix template (signin):**
```tsx
const [errors, setErrors] = useState<{ email?: string; password?: string; form?: string }>({});
// ...
<form onSubmit={handleSubmit} className="space-y-4" noValidate>
  {errors.form && (
    <div role="alert" className="px-3 py-2 rounded-md bg-rose-500/15 border border-rose-500/40 text-rose-200 text-[13px]">
      {errors.form}
    </div>
  )}
  <div>
    <label htmlFor="email" className="block text-[13px] font-bold text-white mb-1.5">Email</label>
    <input
      id="email" type="email" name="email" required
      aria-invalid={!!errors.email}
      aria-describedby={errors.email ? "email-error" : "email-hint"}
      className="..."
    />
    <p id="email-hint" className="text-[11px] text-white/45 mt-1">We&apos;ll never share your email.</p>
    {errors.email && <p id="email-error" role="alert" className="text-[12px] text-rose-300 mt-1">{errors.email}</p>}
  </div>
```

Repeat for password + apply same shape to `/signup` and any `useState` flash messages (Finance has `flash` state at finance/page.tsx — wrap its render in `role="status"`/`role="alert"`).

---

## Finding 5 — Heading hierarchy skip on signin
**Severity:** moderate · **Effort:** 2 min · **Impact:** +0.05

`src/app/signin/page.tsx`: tab-button group (line 57) renders before `<h1>` (line 70). Visually fine but DOM order means screen readers hit interactive controls before the page name. Move the `<h1 className="text-[22px] font-extrabold text-white mb-1">Welcome back.</h1>` block (lines 70-71) ABOVE the tab buttons div. Same audit pass on `/signup` and `/admin/partners`.

Homepage `src/app/page.tsx` heading flow is clean (h1 → h2 → h3, no skips). AppShell uses `<h1>` at line 172 for page title — fine since marketing TopNav doesn't render its own h1 on app routes.

---

## Finding 6 — Icon-only buttons missing aria-label
**Severity:** moderate · **Effort:** 5 min · **Impact:** +0.10

`AppShell.tsx:176` — bell button `<button>🔔</button>` has no label. Modal close `×` buttons (`VendorConnectModal.tsx:118`, `DriverImportModal.tsx:93`) are unlabeled. The floating Compass `∞` button at line 188 correctly has `aria-label="Ask Compass"` — copy that pattern.

```tsx
<button aria-label="Notifications" className="...">🔔</button>
<button aria-label="Close" onClick={onClose} className="...">×</button>
```

---

## Summary impact

| Fix | Score delta |
|---|---|
| 1. Skip-link in layout.tsx | +0.15 |
| 2. aria-label on ~14 pills | +0.35 |
| 3. Escape + role=dialog on 4 modals | +0.15 |
| 4. aria-invalid / describedby / role=alert on forms | +0.20 |
| 5. h1 ordering on signin/signup | +0.05 |
| 6. aria-label on icon buttons | +0.10 |
| **Total** | **+1.00** |

Effort: ~75 min total. All edits are mechanical, no design changes.

Estimated path 7.4 → 9.6
