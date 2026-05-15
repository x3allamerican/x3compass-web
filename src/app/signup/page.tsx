"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent } from "react";

export default function SignUp() {
  const router = useRouter();

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (typeof window !== "undefined") {
      localStorage.setItem("x3-session", "true");
    }
    router.push("/app");
  }

  return (
    <div className="min-h-screen bg-[#0A1929] text-white grid place-items-center px-6 py-12 relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(900px 600px at 20% 0%, rgba(34, 211, 238, 0.18), transparent 60%), radial-gradient(800px 500px at 90% 100%, rgba(139, 92, 246, 0.20), transparent 60%)",
        }}
      />
      <div className="w-full max-w-md relative">
        <Link href="/" className="text-[12px] text-white/55 hover:text-white inline-flex items-center gap-2 mb-6">
          ← Back to home
        </Link>
        <div
          className="rounded-2xl p-9 border border-[#1E3556]"
          style={{
            background: "linear-gradient(180deg, #15233D 0%, #0F1C32 100%)",
            boxShadow: "0 24px 60px rgba(0, 0, 0, 0.45)",
          }}
        >
          <div className="flex items-center gap-3 mb-7">
            <div
              className="w-11 h-11 grid place-items-center text-[#0A1929] font-black text-base rounded-lg"
              style={{
                background: "linear-gradient(135deg, #22D3EE, #06B6D4)",
                boxShadow: "0 4px 12px rgba(34, 211, 238, 0.32)",
              }}
            >
              X3
            </div>
            <div>
              <div className="text-white font-extrabold text-[16px] tracking-tight">X3 COMPASS</div>
              <div className="text-[10px] tracking-[.18em] text-[#22D3EE] font-bold uppercase">AI Safety Director</div>
            </div>
          </div>

          <div className="flex gap-1 mb-6 p-1 rounded-lg bg-[#0A1929] border border-[#1E3556]">
            <Link href="/signin" className="flex-1 py-2.5 rounded-md font-bold text-[13px] text-white/65 hover:text-white text-center">
              Sign In
            </Link>
            <button className="flex-1 py-2.5 rounded-md font-bold text-[13px] text-[#0A1929]"
              style={{ background: "linear-gradient(135deg, #22D3EE, #06B6D4)" }}
            >
              Sign Up
            </button>
            <Link href="#" className="flex-1 py-2.5 rounded-md font-bold text-[13px] text-white/65 hover:text-white text-center">
              Reset
            </Link>
          </div>

          <h1 className="text-[22px] font-extrabold text-white mb-1">Start your 7-day trial.</h1>
          <p className="text-[14px] text-white/65 mb-6">No card. All 12 brains, all 300 skills, plus Hazmat.</p>

          <form onSubmit={handleSubmit} className="space-y-3.5">
            <div>
              <label htmlFor="company" className="block text-[13px] font-bold text-white mb-1.5">Company name</label>
              <input id="company" type="text" name="company" placeholder="Acme Trucking LLC"
                className="w-full bg-[#0A1929] border border-[#1E3556] rounded-lg px-4 py-3 text-[15px] text-white placeholder:text-white/40 focus:border-[#22D3EE] focus:outline-none focus:ring-2 focus:ring-[#22D3EE]/20"
                required
              />
            </div>
            <div>
              <label htmlFor="email" className="block text-[13px] font-bold text-white mb-1.5">Work email</label>
              <input id="email" type="email" name="email" placeholder="you@yourfleet.com"
                className="w-full bg-[#0A1929] border border-[#1E3556] rounded-lg px-4 py-3 text-[15px] text-white placeholder:text-white/40 focus:border-[#22D3EE] focus:outline-none focus:ring-2 focus:ring-[#22D3EE]/20"
                required
              />
            </div>
            <div>
              <label htmlFor="password" className="block text-[13px] font-bold text-white mb-1.5">Password</label>
              <input id="password" type="password" name="password" placeholder="Choose a strong password"
                className="w-full bg-[#0A1929] border border-[#1E3556] rounded-lg px-4 py-3 text-[15px] text-white focus:border-[#22D3EE] focus:outline-none focus:ring-2 focus:ring-[#22D3EE]/20"
                required
              />
            </div>
            <div>
              <label htmlFor="plan" className="block text-[13px] font-bold text-white mb-1.5">Plan</label>
              <select id="plan" name="plan"
                className="w-full bg-[#0A1929] border border-[#1E3556] rounded-lg px-4 py-3 text-[15px] text-white focus:border-[#22D3EE] focus:outline-none focus:ring-2 focus:ring-[#22D3EE]/20"
                defaultValue="diy"
              >
                <option value="diy">DIY · Compass AI · $25/driver/mo</option>
                <option value="dfy">DFY · Compass Concierge · $50/driver/mo</option>
                <option value="enterprise">Enterprise · Call us</option>
              </select>
            </div>
            <div className="rounded-lg p-3 bg-[#22D3EE]/8 border border-[#22D3EE]/30 text-[12px] text-white/85 leading-relaxed">
              ★ 7-day trial includes <strong className="text-[#22D3EE]">Hazmat add-on</strong> at no charge. No credit card required.
            </div>
            <button
              type="submit"
              className="w-full py-3 rounded-lg font-bold text-[15px] text-[#0A1929]"
              style={{ background: "linear-gradient(135deg, #22D3EE, #06B6D4)", boxShadow: "0 6px 18px rgba(34, 211, 238, 0.32)" }}
            >
              Start Free Trial →
            </button>
          </form>
        </div>

        <div className="text-center mt-6 text-[13px] text-white/55">
          Already have an account?{" "}
          <Link href="/signin" className="text-[#22D3EE] font-bold hover:text-[#67E8F9]">Sign in →</Link>
        </div>
      </div>
    </div>
  );
}
