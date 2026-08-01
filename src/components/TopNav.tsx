"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import ThemeToggle from "@/components/ThemeToggle";
import BrandMark from "@/components/BrandMark";

export default function TopNav() {
  const pathname = usePathname() ?? "/";
  const [loggedIn, setLoggedIn] = useState(false);

  // INSIDE THE APP, the marketing nav (Home/Services/Skills/Pricing/Hazmat/FAQ/Trust/Blog/...)
  // is wrong · those are public marketing links. Inside /app/* and /admin/* the topbar
  // should only show the brand mark, theme toggle, and account controls. The sidebar
  // owns navigation inside the app shell.
  const isAppShell = pathname.startsWith("/app") || pathname.startsWith("/admin");

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
    <header className="fixed top-0 left-0 right-0 z-50 backdrop-blur-md bg-[var(--bg)]/95 border-b border-[var(--border)]">
      <div className="max-w-7xl mx-auto px-6 h-24 flex items-center justify-between gap-4">
        <BrandMark variant="compass" href="/" size="lg" />


        {/* Marketing nav hidden inside the app shell · sidebar handles navigation there.
            On /app/* and /admin/* the topbar only shows the brand + theme + account controls. */}
        {!isAppShell && (
          <nav className="hidden md:flex items-center gap-8 text-[17px] font-semibold">
            <Link href="/" className={linkClass("/")}>Home</Link>
            <Link href="/#services" className={linkClass("/#services")}>Services</Link>
            {loggedIn && (
              <Link href="/app" className={linkClass("/app")}>App</Link>
            )}
            <Link href="/#skills" className={linkClass("/#skills")}>Skills</Link>
            <Link href="/#pricing" className={linkClass("/#pricing")}>Pricing</Link>
            <Link href="/#hazmat" className={linkClass("/#hazmat")}>Hazmat</Link>
            <Link href="/#faqs" className={linkClass("/#faqs")}>FAQ</Link>
          </nav>
        )}

        <div className="flex items-center gap-3 flex-shrink-0">
          {/* Theme toggle only inside the app shell · the public marketing
              site is locked to pure-black Bugatti dark and the toggle was
              causing visitors with light-mode system pref to land on a white
              homepage that murdered the CRO design. */}
          {isAppShell && <ThemeToggle />}
          {/* Inside the app shell: account controls only · sign in / signup CTAs would be confusing for someone already signed in. The sidebar handles sign-out. */}
          {isAppShell ? null : loggedIn ? (
            <>
              <Link
                href="/app"
                className="hidden sm:inline-flex items-center gap-2 px-4 py-2 rounded-full text-[13px] font-bold text-[var(--bg)]"
                style={{ background: "linear-gradient(135deg, var(--accent), var(--accent-2))", boxShadow: "0 4px 12px rgba(2, 6, 12, 0.45)" }}
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
                className="text-[15px] sm:text-[17px] font-semibold text-[var(--fg-muted)] hover:text-[var(--fg)]"
              >
                Sign in
              </Link>
              <Link
                href="/signup"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-full text-[15px] font-bold text-[var(--bg)]"
                style={{
                  background: "linear-gradient(135deg, var(--accent), var(--accent-2))",
                  boxShadow: "0 4px 12px rgba(2, 6, 12, 0.45)",
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
