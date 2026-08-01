"use client";
import { useEffect, ReactNode } from "react";

/**
 * Theme bootstrap for the X3 Compass site (marketing + /app).
 *
 * History — why this exists in its current form:
 *   The original implementation read the OS color-scheme preference whenever
 *   localStorage was empty (`stored || (prefersDark ? "dark" : "light")`) and
 *   then ONLY toggled the `dark` class. That created a race condition with
 *   the no-flash inline script in `app/layout.tsx`:
 *
 *     1. Inline head script runs:  empty localStorage → adds `dark` class.
 *        Page renders dark. ✅
 *     2. React hydrates. ThemeProvider runs.
 *     3. Empty localStorage + OS in light mode → theme = "light".
 *        `classList.toggle("dark", false)` REMOVES the dark class.
 *        Tailwind `dark:` utilities turn off → background flips white. ❌
 *
 *   Result: the marketing site randomly rendered light for any visitor
 *   whose Mac/iPhone was set to light mode — including any incognito
 *   session on Joshua's own laptop. We "fixed" the symptom three times
 *   by toggling Joshua's own localStorage, which masked the bug until
 *   the next clean session.
 *
 * Fix (single source of truth):
 *   • Empty localStorage → DEFAULT TO DARK. No OS-preference sniffing.
 *   • Manage BOTH classes (`dark` + `light`) so the two scripts can never
 *     leave the DOM in a half-applied "neither" state.
 *   • The user can still toggle to light via any UI control that writes
 *     `x3-theme` to localStorage — that path is preserved.
 *
 * Net effect: marketing site is permanently dark by default on every
 * device, every visitor, every cache state. The /app shell still respects
 * a user's saved preference (it writes localStorage on toggle).
 */
export function ThemeProvider({ children }: { children: ReactNode }) {
  useEffect(() => {
    if (typeof window === "undefined") return;
    const stored = localStorage.getItem("x3-theme");
    // Only honor an explicit saved choice. Anything else → dark.
    const theme = stored === "light" ? "light" : "dark";
    const html = document.documentElement;
    html.classList.toggle("dark", theme === "dark");
    html.classList.toggle("light", theme === "light");
  }, []);
  return <>{children}</>;
}
