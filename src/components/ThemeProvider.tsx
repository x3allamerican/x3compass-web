"use client";

/**
 * Theme provider for X3 Compass dual-mode UI.
 *
 * Adds/removes `.light` class on <html>. Defaults:
 *   1. localStorage key `x3-theme` if set ("dark" | "light")
 *   2. Otherwise system preference (prefers-color-scheme: dark)
 *   3. Otherwise dark
 *
 * The actual flicker-prevention is done by an inline script in layout.tsx
 * that runs BEFORE React hydration. This provider only manages later
 * toggles + persistence.
 */

import { createContext, useContext, useEffect, useState, ReactNode } from "react";

type Theme = "dark" | "light";

const Ctx = createContext<{ theme: Theme; setTheme: (t: Theme) => void }>({
  theme: "dark",
  setTheme: () => {},
});

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>("dark");

  useEffect(() => {
    // Read whatever the inline script already set
    const current = document.documentElement.classList.contains("light") ? "light" : "dark";
    setThemeState(current);
  }, []);

  const setTheme = (t: Theme) => {
    setThemeState(t);
    if (typeof document !== "undefined") {
      document.documentElement.classList.toggle("light", t === "light");
      document.documentElement.classList.toggle("dark", t === "dark");
    }
    if (typeof localStorage !== "undefined") {
      try { localStorage.setItem("x3-theme", t); } catch {}
    }
  };

  return <Ctx.Provider value={{ theme, setTheme }}>{children}</Ctx.Provider>;
}

export const useTheme = () => useContext(Ctx);
