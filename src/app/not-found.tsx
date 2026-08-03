import Link from "next/link";

export const metadata = { title: "Page not found · X3 Compass" };

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#000000] text-white px-6">
      <div className="max-w-md text-center">
        <div className="text-[13px] tracking-[.18em] uppercase font-bold text-[#16C7FF] mb-3">404</div>
        <h1 className="text-[26px] font-extrabold mb-2">We couldn&apos;t find that page</h1>
        <p className="text-[14px] text-white/60 mb-6">The link may be old or mistyped. Everything still works from the homepage or your dashboard.</p>
        <div className="flex items-center justify-center gap-3">
          <Link href="/" className="px-5 py-2.5 rounded-lg font-extrabold text-[13px] text-black" style={{ background: "linear-gradient(135deg, #16C7FF, #16C7FF)" }}>Home</Link>
          <Link href="/app" className="px-5 py-2.5 rounded-lg font-bold text-[13px] text-white border border-white/20 hover:bg-white/5">Dashboard</Link>
        </div>
      </div>
    </div>
  );
}
