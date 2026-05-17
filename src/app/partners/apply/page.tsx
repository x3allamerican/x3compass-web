"use client";

import { useState, FormEvent } from "react";
import Link from "next/link";
import SiteShell from "@/components/SiteShell";

const ctaCyan = { background: "linear-gradient(135deg, var(--accent), var(--accent-2))", boxShadow: "0 6px 18px rgba(34, 211, 238, 0.32)" };

export default function PartnerApplyPage() {
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    const form = e.currentTarget;
    const fd = new FormData(form);
    const payload: Record<string, string> = {};
    fd.forEach((v, k) => {
      if (typeof v === "string") payload[k] = v;
    });

    try {
      const res = await fetch("/api/partners/apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const j = (await res.json()) as { ok?: boolean; error?: string };
      if (!res.ok || !j.ok) {
        throw new Error(j.error || `Server error (HTTP ${res.status})`);
      }
      setSubmitted(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Submission failed");
    } finally {
      setSubmitting(false);
    }
  }

  if (submitted) {
    return (
      <SiteShell>
        <div className="bg-[var(--bg)] text-[var(--fg)] min-h-screen grid place-items-center px-6 py-20">
          <div className="max-w-xl text-center">
            <div
              className="w-20 h-20 rounded-full grid place-items-center text-[var(--bg)] font-black text-[36px] mx-auto mb-6"
              style={{ background: "linear-gradient(135deg, var(--accent), var(--accent-2))", boxShadow: "0 0 0 6px rgba(34, 211, 238, 0.12)" }}
            >
              ✓
            </div>
            <h1 className="text-[34px] font-extrabold text-[var(--fg)] mb-3">Application received.</h1>
            <p className="text-[16px] text-[var(--fg-muted)] mb-6 leading-relaxed">
              We&apos;ll review your application within 3 business days and reach out at the email you provided to schedule a 30-minute interview.
            </p>
            <div className="text-[12px] text-[var(--fg-muted)] mb-8">
              Questions in the meantime?{" "}
              <a href="mailto:partners@x3compass.com" className="text-[var(--accent)] hover:underline">partners@x3compass.com</a>
            </div>
            <Link href="/partners" className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full font-bold text-[13px] text-[var(--fg)] border border-white/20 hover:bg-white/5">
              ← Back to Compass Partner
            </Link>
          </div>
        </div>
      </SiteShell>
    );
  }

  return (
    <SiteShell>
      <div className="bg-[var(--bg)] text-[var(--fg)] min-h-screen">
        <div className="max-w-2xl mx-auto px-6 py-16">
          <Link href="/partners" className="text-[12px] text-[var(--fg-muted)] hover:text-[var(--fg)] inline-flex items-center gap-2 mb-6">
            ← Back to Compass Partner
          </Link>
          <div className="text-[11px] tracking-[.18em] uppercase font-bold text-[var(--accent)] mb-3">
            PARTNER APPLICATION
          </div>
          <h1 className="text-[36px] sm:text-[42px] font-extrabold tracking-tight text-[var(--fg)] mb-3 leading-tight">
            Tell us about your business.
          </h1>
          <p className="text-[15px] text-[var(--fg-muted)] mb-10 leading-relaxed">
            ~7 minutes to complete. We review within 3 business days and schedule a 30-min interview if there&apos;s fit.
          </p>

          <form onSubmit={handleSubmit} className="space-y-7">
            {/* Section 1 — About you */}
            <div className="rounded-2xl border border-[var(--border)] p-6" style={{ background: "linear-gradient(180deg, var(--surface) 0%, var(--surface-3) 100%)" }}>
              <div className="text-[10px] tracking-[.14em] uppercase font-extrabold text-[var(--accent)] mb-3">SECTION 1 · ABOUT YOU</div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="Your full name" required name="name" placeholder="Sam Carter" />
                <Field label="Email" required name="email" type="email" placeholder="sam@your-consultancy.com" />
                <Field label="Phone (optional)" name="phone" type="tel" placeholder="555-867-5309" />
                <Field label="LinkedIn URL (optional)" name="linkedin" placeholder="linkedin.com/in/sam-carter" />
              </div>
            </div>

            {/* Section 2 — Business */}
            <div className="rounded-2xl border border-[var(--border)] p-6" style={{ background: "linear-gradient(180deg, var(--surface) 0%, var(--surface-3) 100%)" }}>
              <div className="text-[10px] tracking-[.14em] uppercase font-extrabold text-[var(--accent)] mb-3">SECTION 2 · YOUR CONSULTING BUSINESS</div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field label="Business name" required name="company" placeholder="Carter Safety Solutions LLC" />
                <Field label="Business state" required name="state" placeholder="TX" />
                <Field label="How long in business" name="years" placeholder="e.g., 3 years" />
                <Field label="Current carrier client count" name="clients" placeholder="e.g., 7" />
              </div>
              <div className="mt-4">
                <SelectField
                  label="Services you currently offer"
                  required
                  name="services"
                  options={[
                    "DQ file management",
                    "Audit prep (FMCSA / state)",
                    "DOT new entrant safety audits",
                    "Drug & Alcohol program management",
                    "Hours of Service / ELD coaching",
                    "Hazmat compliance",
                    "Insurance loss control",
                    "Fractional safety director",
                    "Other (will explain in interview)",
                  ]}
                />
              </div>
              <div className="mt-4">
                <SelectField
                  label="Typical monthly fee per carrier client"
                  name="fee"
                  options={[
                    "Under $500/month",
                    "$500-1,000/month",
                    "$1,000-2,000/month",
                    "$2,000-3,000/month",
                    "Over $3,000/month",
                    "One-time engagements only",
                  ]}
                />
              </div>
            </div>

            {/* Section 3 — Fit */}
            <div className="rounded-2xl border border-[var(--border)] p-6" style={{ background: "linear-gradient(180deg, var(--surface) 0%, var(--surface-3) 100%)" }}>
              <div className="text-[10px] tracking-[.14em] uppercase font-extrabold text-[var(--accent)] mb-3">SECTION 3 · WHY COMPASS PARTNER</div>
              <TextAreaField
                label="What's the #1 reason you're considering Compass Partner?"
                required
                name="why"
                placeholder="e.g., 'I currently use spreadsheets for 8 clients and it's killing me' or 'I want to add AI-powered CFR research without paying $99/seat to JJ Keller'..."
                rows={4}
              />
              <div className="mt-4">
                <TextAreaField
                  label="What tools do you use today? (Foley, JJ Keller, Motive, spreadsheets, custom, etc.)"
                  name="tools"
                  placeholder="List what's in your current stack"
                  rows={2}
                />
              </div>
              <div className="mt-4">
                <SelectField
                  label="When could you onboard your first carrier to Compass?"
                  name="timeline"
                  options={[
                    "Within 30 days of approval",
                    "30-60 days",
                    "60-90 days",
                    "Exploring — no firm timeline",
                  ]}
                />
              </div>
            </div>

            {/* Section 4 — References */}
            <div className="rounded-2xl border border-[var(--border)] p-6" style={{ background: "linear-gradient(180deg, var(--surface) 0%, var(--surface-3) 100%)" }}>
              <div className="text-[10px] tracking-[.14em] uppercase font-extrabold text-[var(--accent)] mb-3">SECTION 4 · CREDIBILITY (OPTIONAL BUT HELPS)</div>
              <TextAreaField
                label="Notable credentials (former FMCSA / state DOT inspector, CSP, OSHA 30, etc.)"
                name="credentials"
                placeholder="Anything you'd put on a consulting bio"
                rows={2}
              />
              <div className="mt-4">
                <TextAreaField
                  label="A carrier client we could reference-check (optional, with their permission)"
                  name="reference"
                  placeholder="Company name + a contact (or 'will provide after interview')"
                  rows={2}
                />
              </div>
            </div>

            {/* Acknowledge */}
            <div className="rounded-xl p-4 border border-[var(--accent)]/30 bg-[var(--accent)]/5 text-[12.5px] text-[var(--fg)] leading-relaxed">
              <strong className="text-[var(--fg)]">Before submitting:</strong> Compass Partner is a paid B2B program (X3 takes 30% of whatever you charge your carriers, with a $10/driver/month floor — no base subscription). The application + interview is free. By submitting, you agree to be contacted at the email/phone provided about partnership opportunities.
            </div>

            {error && (
              <div className="rounded-xl p-4 border border-rose-500/40 bg-rose-500/10 text-[13px] text-rose-200">
                <strong className="text-[var(--fg)]">Submission failed:</strong> {error}<br />
                Try again, or email <a href="mailto:partners@x3compass.com" className="underline">partners@x3compass.com</a> directly.
              </div>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="w-full px-6 py-4 rounded-full font-bold text-[16px] text-[var(--bg)] disabled:opacity-60 disabled:cursor-not-allowed"
              style={ctaCyan}
            >
              {submitting ? "Submitting…" : "★ Submit Partner application →"}
            </button>

            <div className="text-center text-[12px] text-[var(--fg-faint)]">
              Questions before submitting?{" "}
              <a href="mailto:partners@x3compass.com" className="text-[var(--accent)] hover:underline">partners@x3compass.com</a>
            </div>
          </form>
        </div>
      </div>
    </SiteShell>
  );
}

function Field({ label, name, type = "text", required, placeholder }: { label: string; name: string; type?: string; required?: boolean; placeholder?: string }) {
  return (
    <div>
      <label className="text-[10px] tracking-[.14em] uppercase font-bold text-[var(--fg-muted)] block mb-1.5">
        {label} {required && <span className="text-rose-300">*</span>}
      </label>
      <input
        type={type}
        name={name}
        required={required}
        placeholder={placeholder}
        className="w-full bg-[var(--bg)] border border-[var(--border)] rounded-lg px-4 py-2.5 text-[var(--fg)] text-[14px] placeholder:text-[var(--fg-faint)] focus:outline-none focus:border-[var(--accent)]"
      />
    </div>
  );
}

function TextAreaField({ label, name, required, placeholder, rows = 3 }: { label: string; name: string; required?: boolean; placeholder?: string; rows?: number }) {
  return (
    <div>
      <label className="text-[10px] tracking-[.14em] uppercase font-bold text-[var(--fg-muted)] block mb-1.5">
        {label} {required && <span className="text-rose-300">*</span>}
      </label>
      <textarea
        name={name}
        required={required}
        placeholder={placeholder}
        rows={rows}
        className="w-full bg-[var(--bg)] border border-[var(--border)] rounded-lg px-4 py-2.5 text-[var(--fg)] text-[14px] placeholder:text-[var(--fg-faint)] focus:outline-none focus:border-[var(--accent)] resize-none"
      />
    </div>
  );
}

function SelectField({ label, name, required, options }: { label: string; name: string; required?: boolean; options: string[] }) {
  return (
    <div>
      <label className="text-[10px] tracking-[.14em] uppercase font-bold text-[var(--fg-muted)] block mb-1.5">
        {label} {required && <span className="text-rose-300">*</span>}
      </label>
      <select
        name={name}
        required={required}
        className="w-full bg-[var(--bg)] border border-[var(--border)] rounded-lg px-4 py-2.5 text-[var(--fg)] text-[14px] focus:outline-none focus:border-[var(--accent)]"
        defaultValue=""
      >
        <option value="" disabled>Select…</option>
        {options.map((o) => <option key={o} value={o}>{o}</option>)}
      </select>
    </div>
  );
}
