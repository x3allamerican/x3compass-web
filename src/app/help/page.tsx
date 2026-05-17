import Link from "next/link";
import SiteShell from "@/components/SiteShell";

export const metadata = {
  title: "Help & Support — X3 Compass",
  description: "Quick answers, real contact info, no chatbot maze. The 12 questions carriers ask before they sign up — answered here.",
};

const QUESTIONS = [
  { q: "How do I start? Do I need a credit card?",
    a: "Click ‘Start free trial’ on the home page. Email + password (or magic link). No credit card. You get 7 days of full access including the Hazmat add-on. After 7 days you pick a plan or your account pauses with all data exportable." },
  { q: "What if I get stuck during trial?",
    a: "Email joshua@x3compass.com or use the inline ‘Ask Compass’ widget on the home page. The founder reads every support email personally until we hire a customer success role." },
  { q: "Can I import my existing data?",
    a: "Yes. CSV templates for drivers, vehicles, DQ documents, MVRs, D&A tests, accidents, inspections, and training records. /app/audit-export is the same shape backwards — full one-click export anytime." },
  { q: "How does pricing work if my driver count changes mid-month?",
    a: "We pro-rate. Add a driver day 15 of a 30-day month, you pay 50% of that driver’s rate for that month. Remove a driver, credit applied to next invoice." },
  { q: "What integrations are real today?",
    a: "Live: Stripe (billing), Checkr (background checks), Anthropic (the AI brain), Supabase (data), Cloudflare (hosting + WAF), Resend (email), Twilio (SMS). On the roadmap: Motive/Samsara/Geotab ELDs, SambaSafety MVR continuous monitoring, Quest D&A." },
  { q: "What happens to my data if I cancel?",
    a: "30-day grace window where you can re-export everything as CSV. After 30 days the data is purged from our active tier; encrypted backups age out per Supabase’s retention policy. We will never sell or share your carrier data — see /trust." },
  { q: "Do you replace my Safety Director?",
    a: "DIY: no, you’re still the safety director, Compass just makes the work 3x faster. DFY: yes, we run the dashboard for you with a dedicated X3 advisor. Enterprise (100+ trucks): you can have your own team plus an X3 advisor on retainer." },
  { q: "What if I need a feature that doesn’t exist yet?",
    a: "Email it to joshua@x3compass.com. We ship roadmap items every week — see /changelog. The 6 most-requested customer features each month get worked into the next sprint." },
  { q: "Is Compass FCRA-compliant for background checks?",
    a: "Yes. The background-check flow uses Checkr Embeds with the FCRA-compliant disclosure + consent surface they audit. Adverse-action timing built into our workflow. See /security for the full FCRA stance." },
  { q: "What CFR parts does Compass cover today?",
    a: "49 CFR Parts 40, 380, 382, 383, 385, 387, 390, 391, 392, 393, 395, 396, 397 plus the entire Hazmat regime (Parts 100-180). 300 published skills, 100 of them open-source on github.com/x3fleetsafety/skills." },
  { q: "Can I see the product before I trial?",
    a: "Three ways without signing up: (1) Live demo on the home page — type any FMCSA question and see a CFR-cited answer. (2) /case-studies/sample — a synthetic carrier walks through an audit. (3) /skills — browse all 300 published skill prompts." },
  { q: "Do you have enterprise contracts? SOC 2? DPA?",
    a: "Yes to MSA + DPA (available on request). SOC 2 Type II in preparation, target Q4 2026. Security questionnaires: send to joshua@x3compass.com — most CAIQ/SIG-Lite answered within 48 hours. See /security for the full posture." },
];

export default function HelpPage() {
  return (
    <SiteShell>
      <div className="bg-[var(--bg)] text-[var(--fg)]">
        <section className="border-b border-[var(--border)]">
          <div className="max-w-5xl mx-auto px-6 py-16">
            <div className="text-[11px] tracking-[.18em] uppercase font-bold text-[var(--accent)] mb-3">Help &amp; Support</div>
            <h1 className="text-[40px] sm:text-[48px] md:text-[56px] font-extrabold tracking-tight leading-[1.05] mb-4">
              Stuck? <span className="serif-italic" style={{ color: "var(--accent)" }}>Real answers.</span> No chatbot maze.
            </h1>
            <p className="text-[17px] text-[var(--fg-muted)] max-w-3xl mb-5">
              These are the 12 questions carriers ask before signing up. If yours isn&apos;t below, email{" "}
              <a href="mailto:joshua@x3compass.com" className="text-[var(--accent)] font-bold hover:underline">joshua@x3compass.com</a>{" "}
              — Joshua reads every one personally until we hire a customer success role.
            </p>
            <div className="flex flex-wrap gap-3">
              <a href="mailto:joshua@x3compass.com" className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full font-bold text-[13px] text-[var(--accent-fg)] bg-[var(--accent)] hover:bg-[var(--accent-2)]">Email Joshua →</a>
              <Link href="/" className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full font-bold text-[13px] text-[var(--fg)] border border-[var(--border)] hover:border-[var(--accent)]">Try the live demo</Link>
              <Link href="/faq" className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full font-bold text-[13px] text-[var(--fg)] border border-[var(--border)] hover:border-[var(--accent)]">Full FAQ →</Link>
            </div>
          </div>
        </section>

        <section className="max-w-5xl mx-auto px-6 py-12 grid md:grid-cols-2 gap-5">
          {QUESTIONS.map((q, i) => (
            <details key={i} className="x3-card p-6 group" {...(i < 2 ? { open: true } : {})}>
              <summary className="cursor-pointer list-none flex items-start gap-3">
                <span className="w-7 h-7 grid place-items-center rounded-full bg-[var(--accent)]/10 border border-[var(--accent)]/30 text-[12px] font-black text-[var(--accent)] flex-shrink-0">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <h2 className="text-[15px] font-bold text-[var(--fg)] flex-1 leading-snug">{q.q}</h2>
                <span className="text-[var(--fg-muted)] group-open:rotate-45 transition-transform text-[20px] leading-none">+</span>
              </summary>
              <p className="text-[13px] text-[var(--fg-muted)] leading-relaxed mt-3 ml-10">{q.a}</p>
            </details>
          ))}
        </section>

        <section className="border-t border-[var(--border)] bg-[var(--bg-3)] py-14">
          <div className="max-w-3xl mx-auto px-6 text-center">
            <h2 className="text-[24px] sm:text-[30px] font-extrabold text-[var(--fg)] mb-3">Still need help?</h2>
            <p className="text-[14px] text-[var(--fg-muted)] mb-6">
              For pre-sales: <a href="mailto:joshua@x3compass.com" className="text-[var(--accent)] font-bold hover:underline">joshua@x3compass.com</a>{" "}
              · For partnerships: <a href="mailto:partners@x3compass.com" className="text-[var(--accent)] font-bold hover:underline">partners@x3compass.com</a>{" "}
              · For security: <a href="mailto:security@x3compass.com" className="text-[var(--accent)] font-bold hover:underline">security@x3compass.com</a>
            </p>
            <Link href="/signup" className="inline-flex items-center gap-2 px-6 py-3 rounded-full font-bold text-[15px] text-[var(--accent-fg)] bg-[var(--accent)] hover:bg-[var(--accent-2)]">★ Start free trial →</Link>
          </div>
        </section>
      </div>
    </SiteShell>
  );
}
