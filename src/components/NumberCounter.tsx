"use client";
import { useEffect, useRef, useState } from "react";

/**
 * Animated number counter — counts from 0 to `to` once when the element
 * scrolls into view. Single-shot per session via sessionStorage key.
 */
export default function NumberCounter({
  to, prefix = "", suffix = "", duration = 1200, sessionKey
}: {
  to: number; prefix?: string; suffix?: string; duration?: number; sessionKey: string;
}) {
  const [value, setValue] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const fired = useRef(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    // If already animated this session, jump to final value
    try {
      if (sessionStorage.getItem(`x3-count-${sessionKey}`) === "done") {
        setValue(to); return;
      }
    } catch {}

    const el = ref.current; if (!el) return;
    const io = new IntersectionObserver((entries) => {
      const e = entries[0]; if (!e.isIntersecting || fired.current) return;
      fired.current = true;
      try { sessionStorage.setItem(`x3-count-${sessionKey}`, "done"); } catch {}
      const start = performance.now();
      const tick = (t: number) => {
        const p = Math.min(1, (t - start) / duration);
        // ease-out cubic
        const eased = 1 - Math.pow(1 - p, 3);
        setValue(Math.round(eased * to));
        if (p < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    }, { threshold: 0.4 });
    io.observe(el); return () => io.disconnect();
  }, [to, duration, sessionKey]);

  return <span ref={ref}>{prefix}{value}{suffix}</span>;
}
