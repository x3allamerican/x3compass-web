"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import ThemeToggle from "@/components/ThemeToggle";

export default function TopNav() {
  const pathname = usePathname() ?? "/";
  const [loggedIn, setLoggedIn] = useState(false);

  useEffect(() => {
    // Check localStorage on mount (client only)
    if (typeof window !== "undefined") {
      setLoggedIn(localStorage.getItem("x3-session") === "true");
    }
  }, [pathname]);

  function signOut() {
    if (typeof window !== "undefined") {
      localStorage.removeItem("x3-session");
      setLoggedIn(false);
      window.location.href = "/";
    }
  }

  const activeLink = (href: string) => {
    if (href === "/") return pathname === "/";
    if (href.startsWith("/#")) return false;
    return pathname.startsWith(href);
  };

  const linkClass = (href: string) =>
    `hover:text-[var(--fg)] transition-colors ${
      activeLink(href) ? "text-[var(--fg)]" : "text-[var(--fg-muted)]"
    }`;

  return (
    <header className="sticky top-0 z-50 backdrop-blur-md bg-[var(--bg)]/85 border-b border-[var(--border)]">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between gap-4">
        <Link href="/" className="flex items-center gap-3 group flex-shrink-0">
          <div
            className="w-9 h-9 grid place-items-center font-black text-base rounded-md text-[var(--bg)]"
            style={{
              background: "linear-gradient(135deg, #22D3EE, #06B6D4)",
              boxShadow: "0 4px 12px rgba(34, 211, 238, 0.32)",
            }}
          >
            X3
          </div>
          <div className="leading-tight">
            <div className="text-[var(--fg)] font-extrabold text-[15px] tracking-tight">X3 COMPASS</div>
            <div className="text-[10px] tracking-[.18em] text-[#22D3EE] font-bold uppercase">
              AI Safety Director
            </div>
          </div>
        </Link>

        <nav className="hidden md:flex items-center gap-7 text-[15px] font-semibold">
          <Link href="/" className={linkClass("/")}>Home</Link>
          <Link href="/#services" className={linkClass("/#services")}>Services</Link>
          {loggedIn && (
            <Link href="/app" className={linkClass("/app")}>App</Link>
          )}
          <Link href="/#skills" className={linkClass("/#skills")}>Skills</Link>
          <Link href="/#pricing" className={linkClass("/#pricing")}>Pricing</Link>
          <Link href="/hazmat" className={linkClass("/hazmat")}>Hazmat</Link>
          <Link href="/faq" className={linkClass("/faq")}>FAQ</Link>
          <Link href="/trust" className={linkClass("/trust")}>Trust</Link>
        </nav>

        <div className="flex items-center gap-3 flex-shrink-0">
          <ThemeToggle />
          {loggedIn ? (
            <>
              <Link
                href="/app"
                className="hidden sm:inline-flex items-center gap-2 px-4 py-2 rounded-full text-[13px] font-bold text-[var(--bg)]"
                style={{ background: "linear-gradient(135deg, #22D3EE, #06B6D4)", boxShadow: "0 4px 12px rgba(34, 211, 238, 0.32)" }}
              >
                Open app →
              </Link>
              <button
                onClick={signOut}
                className="text-[15px] font-semibold text-[var(--fg-muted)] hover:text-[var(--fg)]"
              >
                Sign out
              </button>
            </>
          ) : (
            <>
              <Link
                href="/signin"
                className="text-[15px] font-semibold text-[var(--fg-muted)] hover:text-[var(--fg)] hidden sm:block"
              >
                Sign in
              </Link>
              <Link
                href="/signup"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-[13px] font-bold text-[var(--bg)]"
                style={{
                  background: "linear-gradient(135deg, #22D3EE, #06B6D4)",
                  boxShadow: "0 4px 12px rgba(34, 211, 238, 0.32)",
                }}
              >
                ★ Start free →
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
