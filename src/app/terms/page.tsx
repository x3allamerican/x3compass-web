import Link from "next/link";
import SiteShell from "@/components/SiteShell";

export const metadata = {
  title: "Terms of Service — X3 Compass",
  description: "X3 Compass SaaS Terms of Service. Software-as-a-service subscription terms, limitation of liability, customer-as-filer-of-record acknowledgment, data protection.",
};

const TOC = [
  ["agreement", "1. The Agreement"],
  ["service", "2. The Service"],
  ["filer", "3. Customer is the Filer of Record"],
  ["account", "4. Account, Access & Acceptable Use"],
  ["fees", "5. Subscription Fees & Payment"],
  ["data", "6. Customer Data & Confidentiality"],
  ["protection", "7. Data Protection & Security"],
  ["ip", "8. Intellectual Property"],
  ["warranties", "9. Warranties & Disclaimers"],
  ["liability", "10. Limitation of Liability"],
  ["indemnification", "11. Mutual Indemnification"],
  ["term", "12. Term, Suspension & Termination"],
  ["general", "13. General Terms"],
  ["contact", "14. Contact"],
];

export default function Terms() {
  return (
    <SiteShell>
      <div className="bg-[#000000] text-white">
        {/* HERO */}
        <section className="max-w-4xl mx-auto px-6 pt-16 pb-10 text-center">
          <div className="text-[11px] tracking-[.18em] uppercase font-bold text-[#16C7FF] mb-4">
            LEGAL · TERMS OF SERVICE
          </div>
          <h1 className="text-[40px] sm:text-[54px] font-extrabold text-white tracking-tight leading-[1.05] mb-4">
            Terms of <span className="serif-italic" style={{ color: "#16C7FF" }}>Service</span>
          </h1>
          <p className="text-[14px] text-white/55">
            Effective date: <strong className="text-white/85">To be set on counsel sign-off</strong> · Last updated: June 3, 2026 · Version 0.9 (counsel review draft)
          </p>
        </section>

        {/* COUNSEL BANNER */}
        <section className="max-w-4xl mx-auto px-6 pb-10">
          <div className="bg-[#000000] border border-[#16C7FF]/30 rounded-xl p-5">
            <p className="text-[14px] text-white/75 leading-relaxed">
              <strong className="text-[#16C7FF]">Phase 1 / Counsel review draft.</strong> This document is being finalized by X3 legal counsel. The terms below reflect the agreement we intend to operate under once counsel-reviewed and signed by each customer at subscription. Carriers signing up before the effective date are bound by these terms as posted, with any subsequent counsel-driven changes taking effect on 30 days&apos; notice.
            </p>
          </div>
        </section>

        {/* TOC */}
        <section className="max-w-4xl mx-auto px-6 pb-10">
          <div className="bg-[#000000] border border-[#1E3556] rounded-xl p-5">
            <div className="text-[11px] tracking-[.18em] uppercase font-bold text-[#16C7FF] mb-3">
              CONTENTS
            </div>
            <ol className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[14px]">
              {TOC.map(([id, label]) => (
                <li key={id}>
                  <a href={`#${id}`} className="text-white/75 hover:text-[#16C7FF] transition-colors">{label}</a>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* BODY */}
        <article className="max-w-4xl mx-auto px-6 pb-24 text-[15px] text-white/75 leading-relaxed">
          <Section id="agreement" title="1. The Agreement">
            <p>
              These Terms of Service (the &quot;<strong>Agreement</strong>&quot;) form a binding contract between <strong className="text-white">X3 Fleet Safety, LLC</strong> (or successor entity, operator of X3 Compass — &quot;X3 Compass,&quot; &quot;X3,&quot; &quot;we,&quot; &quot;us&quot;) and the legal entity that subscribes to the X3 Compass platform (&quot;<strong>Customer</strong>,&quot; &quot;you&quot;). By creating an account, accepting an invitation, or using the Service, you represent that you have authority to bind your organization and you accept this Agreement on its behalf.
            </p>
            <p>If you do not agree, do not use the Service.</p>
          </Section>

          <Section id="service" title="2. The Service">
            <p>
              <strong className="text-white">&quot;Service&quot;</strong> means the X3 Compass cloud-based software platform — including the web application at{" "}
              <Link href="/app" className="text-[#16C7FF] hover:underline">app.x3compass.com</Link>, related APIs, dashboards, and any X3 Compass-branded mobile or driver applications — that helps motor carriers organize, track, and report on FMCSA-related compliance records. The Service includes modules for driver qualification files, motor vehicle records, drug and alcohol testing, hours-of-service, inspections, accidents, CSA snapshots, IFTA fuel-tax preparation, hazmat operations, and audit-readiness.
            </p>
            <p>
              The Service is software. X3 does not provide legal, regulatory, or compliance advice; does not act as Customer&apos;s agent before any agency; and does not file documents with FMCSA, any state agency, or any third party on Customer&apos;s behalf except where Customer has explicitly enabled a &quot;Concierge&quot; filing add-on and a partner integration is live for that service.
            </p>
          </Section>

          <Section id="filer" title="3. Customer is the Filer of Record">
            <p>
              <strong className="text-[#16C7FF]">This is the most important provision in this Agreement.</strong> Customer remains the sole filer of record, the regulated party, and the responsible party for all FMCSA, state DOT, IRS, IFTA, drug-testing-clearinghouse, and other compliance filings. The Service helps Customer prepare and organize records, but the obligation to file accurately, timely, and in good faith rests with Customer.
            </p>
            <p>Specifically, Customer acknowledges and agrees that:</p>
            <ul className="list-disc pl-6 space-y-2 my-3">
              <li>Reports, summaries, and documents produced by the Service are <strong>preparation aids</strong>, not authoritative regulatory filings.</li>
              <li>Customer is responsible for reviewing every output for accuracy before relying on it or submitting it to any agency.</li>
              <li>X3 is not liable for any penalty, fine, interest, audit finding, or adverse regulatory action resulting from Customer&apos;s filings, late filings, or non-filings.</li>
              <li>Customer&apos;s data inputs (driver records, MVRs, fuel statements, mileage exports, hours-of-service logs) are Customer&apos;s responsibility to provide accurately. The Service can only produce outputs as accurate as Customer&apos;s inputs.</li>
            </ul>
            <p>
              Where the Service includes a &quot;Concierge&quot; add-on (e.g., IFTA Concierge, MVR Concierge, Drug &amp; Alcohol Concierge, Background Checks Concierge), X3 acts as Customer&apos;s preparer or facilitator only. Customer remains the regulated party and filer of record.
            </p>
          </Section>

          <Section id="account" title="4. Account, Access & Acceptable Use">
            <p>
              Customer is responsible for: maintaining the confidentiality of account credentials; all activity that occurs under its account; ensuring users are authorized to access Customer&apos;s data; and promptly notifying X3 of any suspected unauthorized access.
            </p>
            <p>
              Customer will not, and will not permit any user or third party to: (a) reverse engineer, decompile, or attempt to derive the source code of the Service; (b) access the Service to build a competing product; (c) use the Service to violate any applicable law (including FMCSA regulations, FCRA, or state privacy laws); (d) introduce malicious code or attempt to disrupt the Service; (e) exceed reasonable rate limits; or (f) use the Service to process records for any party other than Customer&apos;s own carrier operations.
            </p>
          </Section>

          <Section id="fees" title="5. Subscription Fees & Payment">
            <p>
              Customer agrees to pay the subscription fees and any add-on fees per the pricing plan selected at signup or as updated by mutual agreement. Fees are billed monthly or annually in advance, in U.S. dollars, by the third-party payment processor designated by X3 (currently Stripe). Late payment may result in suspension of the Service after a 10-day cure period. Fees are non-refundable except as required by law or expressly stated in this Agreement.
            </p>
            <p>
              X3 may change fees on 30 days&apos; written notice. Continued use after the notice period constitutes acceptance of the new fees.
            </p>
          </Section>

          <Section id="data" title="6. Customer Data & Confidentiality">
            <p>
              <strong className="text-white">&quot;Customer Data&quot;</strong> means all data, files, and information Customer or its users upload to, generate within, or transmit through the Service — including driver records, vehicle records, MVRs, drug and alcohol test results, fuel data, mileage data, contracts, and any personal information of Customer&apos;s drivers and personnel.
            </p>
            <p>
              As between the parties, <strong className="text-white">Customer owns Customer Data.</strong> X3 holds Customer Data in a secure manner and uses it only to (a) operate and improve the Service for Customer&apos;s benefit, (b) produce outputs at Customer&apos;s request, (c) generate aggregated, anonymized statistics that cannot be traced back to Customer or individuals, and (d) comply with applicable law.
            </p>
            <p>
              Each party will treat the other&apos;s confidential information with at least the degree of care it uses for its own confidential information, and will not disclose it except to its employees, contractors, and advisors with a need to know who are bound by similar confidentiality obligations.
            </p>
          </Section>

          <Section id="protection" title="7. Data Protection & Security">
            <p>
              X3 maintains administrative, physical, and technical safeguards designed to protect Customer Data from unauthorized access, use, alteration, and disclosure. These include encryption at rest and in transit, role-based access controls, row-level security for tenant isolation, audit logging, and regular security reviews. Specific operational details are described in our Data Retention &amp; Destruction Policy and our{" "}
              <Link href="/privacy" className="text-[#16C7FF] hover:underline">Privacy Policy</Link>.
            </p>
            <p>
              X3 will notify Customer without undue delay, and in any event within seventy-two (72) hours of confirmation, of any unauthorized access to Customer Data of which X3 becomes aware. The notification will describe the nature of the access, the data potentially affected, and remediation steps.
            </p>
            <p>
              X3 retains Customer Data per the retention windows in the Data Retention &amp; Destruction Policy. Some retention periods are governed by federal regulation (49 CFR § 391.51, § 382.401, § 395.8, IFTA Articles of Agreement, etc.) and override Customer instructions to delete records earlier.
            </p>
          </Section>

          <Section id="ip" title="8. Intellectual Property">
            <p>
              X3 retains all right, title, and interest in and to the Service, including software, designs, documentation, trademarks, and any improvements, modifications, or derivative works. Customer is granted only a limited, non-exclusive, non-transferable, revocable license to use the Service during the term of this Agreement. Nothing in this Agreement transfers ownership of any X3 intellectual property to Customer.
            </p>
            <p>If Customer provides feedback, suggestions, or feature requests, X3 may use them without restriction or attribution.</p>
          </Section>

          <Section id="warranties" title="9. Warranties & Disclaimers">
            <p>
              X3 warrants that during the subscription term the Service will perform substantially in accordance with its then-current published documentation. Customer&apos;s exclusive remedy for breach of this warranty is, at X3&apos;s option, to (a) repair or correct the issue, or (b) terminate the affected portion of the subscription and receive a pro-rata refund for the unused portion.
            </p>
            <p>
              <strong className="text-white">EXCEPT FOR THE EXPRESS WARRANTY ABOVE, THE SERVICE IS PROVIDED &quot;AS IS&quot; AND X3 DISCLAIMS ALL OTHER WARRANTIES, EXPRESS OR IMPLIED, INCLUDING IMPLIED WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND NON-INFRINGEMENT.</strong> X3 does not warrant that the Service will be error-free, uninterrupted, or that all defects will be corrected. The Service is not a substitute for legal counsel, regulatory advice, or accurate record-keeping by Customer.
            </p>
          </Section>

          <Section id="liability" title="10. Limitation of Liability">
            <p><strong className="text-white">TO THE MAXIMUM EXTENT PERMITTED BY LAW:</strong></p>
            <ul className="list-disc pl-6 space-y-2 my-3">
              <li>NEITHER PARTY WILL BE LIABLE FOR ANY INDIRECT, INCIDENTAL, CONSEQUENTIAL, SPECIAL, EXEMPLARY, OR PUNITIVE DAMAGES — INCLUDING LOST PROFITS, LOST DATA, LOST GOODWILL, REGULATORY PENALTIES IMPOSED ON CUSTOMER, OR LITIGATION COSTS BORNE BY CUSTOMER — REGARDLESS OF THE THEORY OF LIABILITY, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGES.</li>
              <li>EACH PARTY&apos;S TOTAL AGGREGATE LIABILITY UNDER THIS AGREEMENT, FROM ALL CAUSES OF ACTION, WILL NOT EXCEED THE FEES PAID BY CUSTOMER TO X3 IN THE TWELVE (12) MONTHS PRECEDING THE EVENT GIVING RISE TO THE CLAIM.</li>
            </ul>
            <p>
              The limitations in this Section apply notwithstanding any failure of essential purpose of any limited remedy. Some jurisdictions do not allow the exclusion or limitation of certain damages, so portions of this Section may not apply to Customer.
            </p>
          </Section>

          <Section id="indemnification" title="11. Mutual Indemnification">
            <p>
              <strong className="text-white">By X3.</strong> X3 will defend Customer against any third-party claim alleging that the Service, when used as authorized by this Agreement, infringes a U.S. patent, copyright, or trademark of the claimant, and will pay damages and costs finally awarded against Customer in such claim or agreed to in settlement by X3, provided that Customer (a) promptly notifies X3 in writing, (b) gives X3 sole control of the defense and settlement, and (c) provides reasonable cooperation. If a portion of the Service becomes the subject of an infringement claim, X3 may at its option modify the Service, obtain a license, or terminate the affected subscription with a pro-rata refund.
            </p>
            <p>
              <strong className="text-white">By Customer.</strong> Customer will defend, indemnify, and hold X3 harmless from any third-party claim arising from (a) Customer Data, (b) Customer&apos;s misuse of the Service, (c) Customer&apos;s violation of any law or regulation (including FMCSA, FCRA, or state privacy laws), (d) Customer&apos;s filings or non-filings with any agency, or (e) any breach by Customer of this Agreement.
            </p>
            <p>The indemnification rights in this Section are each party&apos;s exclusive remedy for the claims described.</p>
          </Section>

          <Section id="term" title="12. Term, Suspension & Termination">
            <p>
              This Agreement begins on Customer&apos;s account creation and continues until terminated. Either party may terminate for material breach not cured within 30 days of written notice. X3 may suspend the Service immediately if Customer fails to pay fees, violates Section 4, or poses a security or legal risk to other customers or to X3.
            </p>
            <p>
              On termination, Customer&apos;s access to the Service ceases. Customer may export Customer Data during the 30-day period following termination. After 30 days, X3 may delete Customer Data subject to the retention obligations in our Data Retention &amp; Destruction Policy and applicable law.
            </p>
            <p>Sections that by their nature should survive (Filer of Record, IP, Warranties, Liability, Indemnification, General Terms) survive termination.</p>
          </Section>

          <Section id="general" title="13. General Terms">
            <p>
              <strong className="text-white">Governing Law.</strong> This Agreement is governed by the laws of the State of Michigan, without regard to its conflict-of-laws principles. Exclusive jurisdiction and venue lie in the state and federal courts located in Wayne County, Michigan. Each party waives the right to a jury trial.
            </p>
            <p>
              <strong className="text-white">Entire Agreement.</strong> This Agreement (together with any signed Order Form, the{" "}
              <Link href="/privacy" className="text-[#16C7FF] hover:underline">Privacy Policy</Link>, and the Data Retention Policy) is the entire agreement between the parties on its subject matter and supersedes all prior agreements.
            </p>
            <p>
              <strong className="text-white">Modification.</strong> X3 may update this Agreement on 30 days&apos; notice via email and an in-app banner. Continued use after the notice period constitutes acceptance.
            </p>
            <p>
              <strong className="text-white">Assignment.</strong> Neither party may assign this Agreement without the other&apos;s written consent, except to a successor in interest in connection with a merger, acquisition, or sale of substantially all assets, in which case the assigning party will provide notice.
            </p>
            <p>
              <strong className="text-white">Force Majeure.</strong> Neither party is liable for delay or failure to perform due to events beyond reasonable control (acts of God, war, civil unrest, internet outages, government action, pandemic, supplier failures), provided the affected party uses commercially reasonable efforts to mitigate.
            </p>
            <p>
              <strong className="text-white">Severability.</strong> If any provision is found unenforceable, the remainder remains in effect, and the unenforceable provision is reformed to the minimum extent necessary to make it enforceable.
            </p>
            <p>
              <strong className="text-white">Notices.</strong> Notices must be in writing and delivered to the email address on file (Customer) or to <a href="mailto:joshua@x3compass.com" className="text-[#16C7FF] hover:underline">joshua@x3compass.com</a> (X3). Notices are effective on receipt.
            </p>
            <p>
              <strong className="text-white">No Waiver.</strong> A party&apos;s failure to enforce any provision is not a waiver of its right to enforce it later.
            </p>
            <p>
              <strong className="text-white">Independent Contractors.</strong> The parties are independent contractors; nothing in this Agreement creates a partnership, agency, joint venture, or employment relationship.
            </p>
          </Section>

          <Section id="contact" title="14. Contact">
            <p>
              Questions about this Agreement should go to{" "}
              <a href="mailto:joshua@x3compass.com" className="text-[#16C7FF] hover:underline">joshua@x3compass.com</a>. Legal notices should be marked &quot;Attn: Legal&quot; and copied to the same address.
            </p>
          </Section>

          <div className="border-t border-[#1E3556] mt-12 pt-6 text-[12px] text-white/45 flex flex-wrap justify-between gap-3">
            <span>© 2026 X3 Fleet Safety, LLC · operating X3 Compass</span>
            <span>
              <Link href="/privacy" className="hover:text-white">Privacy Policy</Link> ·{" "}
              <Link href="/legal" className="hover:text-white">Legal Index</Link> ·{" "}
              <Link href="/app" className="hover:text-white">Back to app</Link>
            </span>
          </div>
        </article>
      </div>
    </SiteShell>
  );
}

function Section({ id, title, children }: { id: string; title: string; children: React.ReactNode }) {
  return (
    <section id={id} className="scroll-mt-24 mb-10">
      <h2 className="text-[22px] sm:text-[26px] font-extrabold text-white mb-3">{title}</h2>
      <div className="space-y-3">{children}</div>
    </section>
  );
}
