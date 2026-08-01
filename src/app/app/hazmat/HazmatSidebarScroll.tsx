"use client";

/* Client island for sidebar scroll persistence — invisible (renders null).
 * Drop this anywhere inside HazmatAppShell; on mount it finds the .sidebar
 * element via document.querySelector and wires up the same sessionStorage
 * scroll-restore behavior the global AppShell uses (shared key
 * "x3-sidebar-scroll" so position carries across BOTH shells).
 */

import { useEffect } from "react";

export default function HazmatSidebarScroll() {
  useEffect(() => {
    const aside = document.querySelector<HTMLElement>(".sidebar");
    if (!aside) return;
    const saved = sessionStorage.getItem("x3-sidebar-scroll");
    if (saved) aside.scrollTop = parseInt(saved, 10) || 0;
    let raf = 0;
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        try {
          sessionStorage.setItem("x3-sidebar-scroll", String(aside.scrollTop));
        } catch {}
      });
    };
    aside.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      aside.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(raf);
    };
  }, []);
  return null;
}
