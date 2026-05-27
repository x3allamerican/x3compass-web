/**
 * "Backed by" vendor trust strip · for a pre-revenue B2B SaaS, the next-best
 * trust signal after real customer logos is showing which audited vendors
 * actually power the product. Real names, no logos invented.
 *
 * Drops into any marketing page hero or section.
 */
const VENDORS = [
  { name: "Anthropic", role: "Claude (AI brain)" },
  { name: "Stripe",    role: "Billing + payments" },
  { name: "Checkr",    role: "FCRA background checks" },
  { name: "Supabase",  role: "Database + auth" },
  { name: "Twilio",    role: "SMS + STOP" },
  { name: "Resend",    role: "Transactional email" },
  { name: "Cloudflare",role: "Edge + WAF + R2" },
];

export default function BackedByStrip() {
  return (
    <section aria-label="Vendors X3 Compass is built on" className="border-y border-[var(--border)] bg-[var(--surface-2)] py-6 px-6">
      <div className="max-w-6xl mx-auto">
        <div className="text-[10px] tracking-[.20em] uppercase font-extrabold text-[var(--fg-muted)] text-center mb-4">
          Built on audited vendors trusted by Fortune-500 fleets
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-4">
          {VENDORS.map(v => (
            <div key={v.name} className="text-center">
              <div className="text-[14px] font-extrabold text-[var(--fg)] tracking-tight">{v.name}</div>
              <div className="text-[10px] text-[var(--fg-muted)] mt-0.5">{v.role}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
