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
  // is wrong — those are public marketing links. Inside /app/* and /admin/* the topbar
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
    <header className="sticky top-0 z-50 backdrop-blur-md bg-[var(--bg)]/85 border-b border-[var(--border)]">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between gap-4">
        <BrandMark variant="compass" href="/" size="md" showTagline />


        {/* Marketing nav hidden inside the app shell — sidebar handles navigation there.
            On /app/* and /admin/* the topbar only shows the brand + theme + account controls. */}
        {!isAppShell && (
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
            <Link href="/blog" className={linkClass("/blog")}>Blog</Link>
            <Link href="/changelog" className={linkClass("/changelog")}>Changelog</Link>
            <Link href="/help" className={linkClass("/help")}>Help</Link>
          </nav>
        )}

        <div className="flex items-center gap-3 flex-shrink-0">
          <ThemeToggle />
          {/* Inside the app shell: account controls only — sign in / signup CTAs would be confusing for someone already signed in. The sidebar handles sign-out. */}
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
                className="text-[14px] sm:text-[15px] font-semibold text-[var(--fg-muted)] hover:text-[var(--fg)]"
              >
                Sign in
              </Link>
              <Link
                href="/signup"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-[13px] font-bold text-[var(--bg)]"
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
