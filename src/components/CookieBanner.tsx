"use client";
import { useEffect, useState } from "react";
import Link from "next/link";

const STORAGE_KEY = "x3-cookie-consent";

export default function CookieBanner() {
  const [show, setShow] = useState(false);
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!localStorage.getItem(STORAGE_KEY)) setShow(true);
  }, []);
  function accept() { localStorage.setItem(STORAGE_KEY, JSON.stringify({ ts: Date.now(), choice: "accept" })); setShow(false); }
  function reject() { localStorage.setItem(STORAGE_KEY, JSON.stringify({ ts: Date.now(), choice: "reject" })); setShow(false); }
  if (!show) return null;
  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-auto md:max-w-md z-50 rounded-2xl border border-[#1E3556] p-5 shadow-2xl" style={{ background: "linear-gradient(180deg, #000000 0%, #0F1C32 100%)" }}>
      <h3 className="text-white font-extrabold text-[14px] mb-2">Cookie notice</h3>
      <p className="text-white/65 text-[12px] leading-relaxed mb-4">
        We use cookies essential to running the site (auth session, your carrier ID). Optional cookies · analytics · help us understand how the site is used. Read our <Link href="/faq" className="text-[#16C7FF] underline">privacy policy</Link>.
      </p>
      <div className="flex gap-2">
        <button onClick={reject} className="flex-1 py-2 rounded-lg text-[12px] font-bold text-white/75 hover:text-white border border-[#1E3556]">Essential only</button>
        <button onClick={accept} className="flex-1 py-2 rounded-lg text-[12px] font-extrabold text-[#000000]" style={{ background: "linear-gradient(135deg, #16C7FF, #16C7FF)" }}>Accept all</button>
      </div>
    </div>
  );
}
