"use client";

import { useEffect, useState } from "react";

export default function ThemeToggle() {
  const [isDark, setIsDark] = useState(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Check localStorage or system preference
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("x3-theme");
      const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      const shouldBeDark = stored ? stored === "dark" : prefersDark;
      setIsDark(shouldBeDark);
      applyTheme(shouldBeDark);
    }
  }, []);

  const applyTheme = (dark: boolean) => {
    const html = document.documentElement;
    if (dark) {
      html.classList.remove("light");
    } else {
      html.classList.add("light");
    }
    try {
      localStorage.setItem("x3-theme", dark ? "dark" : "light");
    } catch {}
  };

  const toggleTheme = () => {
    const newIsDark = !isDark;
    setIsDark(newIsDark);
    applyTheme(newIsDark);
  };

  if (!mounted) return null;

  return (
    <button
      onClick={toggleTheme}
      className="p-2 rounded-lg transition-colors hover:bg-[var(--surface)] text-[var(--fg-muted)] hover:text-[var(--fg)]"
      title={isDark ? "Switch to light mode" : "Switch to dark mode"}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
    >
      {isDark ? (
        // Sun icon (light mode)
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l-2.12-2.12a1 1 0 00-1.414 0l-.707.707a1 1 0 000 1.414l2.12 2.12a1 1 0 001.414 0l.707-.707a1 1 0 000-1.414zM2.05 6.464a1 1 0 000-1.414l-.707-.707a1 1 0 00-1.414 1.414l.707.707a1 1 0 001.414 0zm11.313 1.414l.707-.707a1 1 0 00-1.414-1.414l-.707.707a1 1 0 001.414 1.414zM15 11a1 1 0 100-2h-1a1 1 0 100 2h1zm2.121-7.121a1 1 0 00-1.414 0l-.707.707a1 1 0 001.414 1.414l.707-.707a1 1 0 000-1.414zM20 11a1 1 0 100-2h-1a1 1 0 100 2h1z" clipRule="evenodd" />
        </svg>
      ) : (
        // Moon icon (dark mode)
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
          <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
        </svg>
      )}
    </button>
  );
}
