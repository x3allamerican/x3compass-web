"use client";
export default function NumberCounter({ value, suffix = "" }: { value?: number | null; suffix?: string }) {
  const n = typeof value === "number" && !isNaN(value) ? value : 0;
  return <span className="font-black text-[var(--accent)]">{n.toLocaleString()}{suffix}</span>;
}
