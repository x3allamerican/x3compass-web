"use client";
import { useEffect, useState } from "react";
export default function ThemeToggle() {
  const [dark, setDark] = useState(false);
  useEffect(() => { setDark(document.documentElement.classList.contains("dark")); }, []);
  const flip = () => {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle("dark", next);
    try { localStorage.setItem("x3-theme", next ? "dark" : "light"); } catch {}
  };
  return <button onClick={flip} aria-label="Toggle theme" className="px-2 py-1 rounded text-[13px] border border-[var(--border)] hover:bg-[var(--surface-2)]">{dark ? "☀" : "🌙"}</button>;
}
