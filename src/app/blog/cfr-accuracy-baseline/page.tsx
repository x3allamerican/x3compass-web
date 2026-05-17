import Link from "next/link";
import SiteShell from "@/components/SiteShell";

export const metadata = {
  title: "How we got to 85% citation accuracy on a 60-question FMCSA eval — X3 Compass blog",
  description: "The X3 Compass CFR eval baseline. 60 questions across 15 categories. Vanilla claude-sonnet-4-6 + minimal system prompt = 85%. Here's the methodology, the failures, and what 95% looks like.",
};

export default function CfrAccuracyPost() {
  return (
    <SiteShell>
      <div className="bg-[var(--bg)] text-[var(--fg)]">

        {/* HERO */}
        <section className="border-b border-[var(--border)]">
          <div className="max-w-3xl mx-auto px-6 py-16">
            <Link href="/blog" className="text-[12px] text-[var(--fg-muted)] hover:text-[var(--fg)] inline-flex items-center gap-2 mb-6">
              ← All posts
            </Link>
            <div className="flex items-center gap-3 mb-4">
              <span className="text-[10px] font-bold tracking-wider px-2 py-0.5 rounded-full border text-[var(--accent)] bg-[var(--accent)]/10 border-[var(--accent)]/30">
                ENGINEERING
              </span>
              <span className="text-[12px] text-[var(--fg-faint)]">May 17, 2026</span>
              <span className="text-[12px] text-[var(--fg-faint)]">·</span>
              <span className="text-[12px] text-[var(--fg-faint)]">8 min read</span>
            </div>
            <h1 className="text-[36px] sm:text-[44px] md:text-[52px] font-extrabold tracking-tight leading-[1.1] mb-4">
              How we got to 85% citation accuracy on a 60-question FMCSA eval
            </h1>
            <p className="text-[18px] text-[var(--fg-muted)] leading-relaxed">
              Before an AI compliance product is honest with you, the team needs a baseline. Here&apos;s ours, in full.
            </p>
          </div>
        </section>

        {/* BODY */}
        <article className="max-w-3xl mx-auto px-6 py-12 prose-base text-[16px] text-[var(--fg-muted)] leading-relaxed space-y-6">

          <p>
            X3 Compass answers FMCSA compliance questions and cites the exact 49 CFR section behind every claim. The whole
            wedge collapses if those citations are wrong, so step zero was building an honest measurement.
          </p>

          <H2>Why 60 questions, not 6 or 600</H2>
          <p>
            Small enough to hand-curate every question with a known-good citation. Large enough to surface category-specific
            failure modes. We split the 60 across <strong>15 categories</strong> — DQF, HOS, D&A, Medical, Inspection, Hazmat,
            CSA, MVR, Financial Responsibility, General Applicability, ELD, Cargo Securement, Vehicle Standards, Driver Conduct,
            and Cross-Border. Each question is paired with the canonical CFR citation and a list of common-hallucination
            failure traps (e.g. &quot;don&apos;t confuse the 26,001 lb CDL threshold with the 10,001 lb CMV threshold&quot;).
          </p>

          <H2>The setup</H2>
          <p>
            Vanilla <code className="font-mono text-[var(--accent)]">claude-sonnet-4-6</code>. Minimal system prompt:
            <em> &quot;You are a DOT compliance reference. Answer each question concisely. When you cite a regulation, give the
            full 49 CFR citation. Do not invent citations. If unsure, say so.&quot;</em>
          </p>
          <p>
            Each model answer is scored 0 or 1 by an automatic grader. <strong>Pass</strong> if the answer contains the
            expected CFR section (base-section match, ignoring subsection chars). <strong>Fail</strong> if it omits the
            citation, or contains a numeric pattern from the question&apos;s common_hallucinations list.
          </p>

          <H2>The number</H2>
          <div className="not-prose x3-card p-8 my-6 text-center">
            <div className="text-[72px] font-black leading-none text-[var(--accent)] mb-2">85.0%</div>
            <div className="text-[14px] text-[var(--fg-muted)]">51 of 60 questions correctly cited · claude-sonnet-4-6 · vanilla, May 2026</div>
          </div>

          <H2>By category (the interesting part)</H2>
          <p>Where the model is rock-solid:</p>
          <ul className="list-disc list-inside ml-2 space-y-1">
            <li><strong>100%</strong> on CSA/SMS, Driver Qualification Files, Financial Responsibility, Hazmat, Medical, Driver Conduct, Vehicle Standards, Cross-Border</li>
          </ul>
          <p>Where it slips:</p>
          <ul className="list-disc list-inside ml-2 space-y-1">
            <li><strong>80%</strong> on HOS, D&A, Inspection, MVR, ELD — close but mistakes exist</li>
            <li><strong>50%</strong> on Cargo Securement (small sample, but real)</li>
            <li><strong>40%</strong> on <em>General Applicability</em> — the dangerous one. Includes the CMV-vs-CDL weight-threshold question (10,001 vs 26,001 lbs) carriers get wrong all the time.</li>
          </ul>

          <H2>The specific failures</H2>
          <p>Four real wrong answers, two grader artifacts. Here are the worst real-fails:</p>
          <ul className="list-disc list-inside ml-2 space-y-2">
            <li>
              <strong>GEN-003:</strong> Asked &quot;What is the difference between intrastate and interstate motor-carrier authority?&quot; — model cited <code className="font-mono">§ 350.341</code> instead of the canonical <code className="font-mono">§ 390.5</code> + <code className="font-mono">§ 392.1</code>.
              The substantive content was correct; the citation was adjacent-but-wrong. In a compliance context, &quot;adjacent-but-wrong&quot; is wrong.
            </li>
            <li>
              <strong>DA-005:</strong> Asked &quot;Who is the Designated Employer Representative (DER)?&quot; — model cited <code className="font-mono">§ 40.3</code> (which does mention DERs) instead of <code className="font-mono">§ 382.107</code> (which defines them for Part 382). Same shape: 80% right, 100% wrong by audit standards.
            </li>
            <li>
              <strong>MVR-005:</strong> CDL holder&apos;s obligation to notify employer of license suspension — model cited <code className="font-mono">§ 383.31</code> (convictions, related) instead of <code className="font-mono">§ 383.33</code> (suspensions, specific).
            </li>
          </ul>

          <H2>The architecture decision the baseline locked in</H2>
          <p>
            With 85% as the baseline, the production architecture is forced:
          </p>
          <ol className="list-decimal list-inside ml-2 space-y-2">
            <li>
              <strong>Retrieval grounding is non-negotiable.</strong> Every cited CFR section gets round-tripped against
              <code className="font-mono"> ecfr.federalregister.gov</code> in the same request that generated it. If a
              section doesn&apos;t exist or doesn&apos;t contain the claimed text, the response gets an
              <strong> unverified_citation </strong>flag and the UI shows an amber ⚠ chip instead of green ✓.
            </li>
            <li>
              <strong>Per-category eval gate.</strong> Any new skill in a failing category (GEN, HOS, D&A, MVR, INSP, ELD, CARGO)
              must score 100% on that category&apos;s eval questions before its PR can merge.
            </li>
            <li>
              <strong>Human merge on all <code className="font-mono">agent/skill-builder/*</code> branches.</strong> Skill-builder
              agents draft; humans approve. AGENT_SAFETY.md §3 forbids self-merge regardless of score.
            </li>
            <li>
              <strong>The eval grows weekly.</strong> Every new skill adds 1-3 questions to the harness. Target: 200 questions
              before we unlock parallel skill-builder agents.
            </li>
          </ol>

          <H2>The honest caveat about that 85%</H2>
          <p>
            Our grader is intentionally strict. A few of the 9 failures are the model citing an adjacent-but-related section.
            We left them as fails on purpose. Better to over-fail and force the production skill-builder to be airtight than
            to grade on a curve and ship sloppy citations to a carrier in front of a DOT inspector.
          </p>

          <H2>What the live product does today</H2>
          <p>
            Every <code className="font-mono">/api/ask</code> response (and every public <code className="font-mono">/api/ask-demo</code> response)
            extracts the cited sections, round-trips them against eCFR, returns a <code className="font-mono">citation_quality_score</code> 0.0–1.0,
            and the homepage demo shows per-section ✓ or ⚠ chips. You can see this live by typing into the Ask Compass widget on
            <Link href="/" className="text-[var(--accent)] hover:underline"> the home page</Link>.
          </p>

          <H2>The number we publish every week</H2>
          <p>
            A GitHub Action runs the same 60-question eval against the live system prompt every Monday and posts the result
            to the public <Link href="/changelog" className="text-[var(--accent)] hover:underline">/changelog</Link>. If we
            regress, you see it the same week we do. If a new model release lifts us, you see that too.
          </p>

          <H2>Try it</H2>
          <p>
            Easiest way to verify any of this: ask Compass a question yourself.
          </p>
          <p className="not-prose">
            <Link href="/" className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full font-bold text-[14px] text-[var(--accent-fg)] bg-[var(--accent)] hover:bg-[var(--accent-2)]">
              Try the live demo →
            </Link>
          </p>

          <hr className="border-[var(--border)]" />

          <p className="text-[13px] text-[var(--fg-faint)]">
            Joshua Kovarik · Founder, X3 Fleet Safety LLC · May 17, 2026.
            Got a question or a counter-claim? <a href="mailto:joshua@x3compass.com" className="text-[var(--accent)] hover:underline">joshua@x3compass.com</a>.
          </p>
        </article>

      </div>
    </SiteShell>
  );
}

function H2({ children }: { children: React.ReactNode }) {
  return <h2 className="text-[24px] sm:text-[28px] font-extrabold text-[var(--fg)] mt-10 mb-3 leading-snug">{children}</h2>;
}
