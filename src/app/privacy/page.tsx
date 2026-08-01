import Link from "next/link";
import SiteShell from "@/components/SiteShell";

export const metadata = {
  title: "Privacy Policy — X3 Compass",
  description: "X3 Compass Privacy Policy. How we handle DOT compliance data, driver records, FCRA-covered records, and personal information.",
};

const TOC = [
  ["scope", "1. Scope & Roles"],
  ["what", "2. What We Collect"],
  ["how", "3. How We Use It"],
  ["share", "4. Who We Share With"],
  ["fcra", "5. FCRA-Covered Records"],
  ["dot", "6. DOT Compliance Records"],
  ["retention", "7. Retention & Destruction"],
  ["security", "8. Security"],
  ["rights", "9. Your Rights"],
  ["kids", "10. Children"],
  ["changes", "11. Changes to this Policy"],
  ["sms", "12. SMS Communications"],
  ["contact", "13. Contact"],
];

export default function Privacy() {
  return (
    <SiteShell>
      <div className="bg-[#000000] text-white">
        {/* HERO */}
        <section className="max-w-4xl mx-auto px-6 pt-16 pb-10 text-center">
          <div className="text-[11px] tracking-[.18em] uppercase font-bold text-[#16C7FF] mb-4">
            LEGAL · PRIVACY POLICY
          </div>
          <h1 className="text-[40px] sm:text-[54px] font-extrabold text-white tracking-tight leading-[1.05] mb-4">
            Privacy <span className="serif-italic" style={{ color: "#16C7FF" }}>Policy</span>
          </h1>
          <p className="text-[14px] text-white/55">
            Effective date: <strong className="text-white/85">To be set on counsel sign-off</strong> · Last updated: June 3, 2026 · Version 0.9 (counsel review draft)
          </p>
        </section>

        {/* COUNSEL BANNER */}
        <section className="max-w-4xl mx-auto px-6 pb-10">
          <div className="bg-[#000000] border border-[#16C7FF]/30 rounded-xl p-5">
            <p className="text-[14px] text-white/75 leading-relaxed">
              <strong className="text-[#16C7FF]">Phase 1 / Counsel review draft.</strong> This Privacy Policy describes the data practices X3 intends to operate under once counsel-reviewed and live. Carriers using the platform before the effective date are protected by these practices as described below; any subsequent counsel-driven changes take effect on 30 days&apos; notice.
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
          <Section id="scope" title="1. Scope & Roles">
            <p>
              This Privacy Policy explains how <strong className="text-white">X3 Fleet Safety, LLC</strong> (operator of X3 Compass — &quot;X3 Compass,&quot; &quot;X3,&quot; &quot;we&quot;) handles personal information when motor carriers and their personnel use the X3 Compass platform (the &quot;Service&quot;). It applies to information we collect at{" "}
              <Link href="/" className="text-[#16C7FF] hover:underline">x3compass.com</Link>,{" "}
              <Link href="/app" className="text-[#16C7FF] hover:underline">app.x3compass.com</Link>, and any X3 Compass mobile or driver applications.
            </p>
            <p>
              <strong className="text-white">Roles.</strong> When a motor carrier subscribes to X3 Compass and uploads records about its drivers, vehicles, or operations:
            </p>
            <ul className="list-disc pl-6 space-y-2 my-3">
              <li>The motor carrier (&quot;<strong>Customer</strong>&quot;) is the <strong>data controller</strong> (or, in California, the &quot;business&quot;). The carrier decides what records to collect, what to do with them, and how long to keep them within applicable legal retention rules.</li>
              <li>X3 is the <strong>data processor</strong> (or, in California, the &quot;service provider&quot;). We process records only on the carrier&apos;s behalf, per our <Link href="/terms" className="text-[#16C7FF] hover:underline">Terms of Service</Link>.</li>
            </ul>
            <p>
              Drivers and other carrier personnel whose records appear in the Service should direct privacy questions and access/deletion requests to their carrier-employer first. X3 will support whatever response the carrier instructs us to make.
            </p>
          </Section>

          <Section id="what" title="2. What We Collect">
            <p>We collect three categories of information:</p>

            <h3 className="text-[16px] font-bold text-white mt-5 mb-2">2.1 Information Customer (the carrier) provides directly</h3>
            <ul className="list-disc pl-6 space-y-2">
              <li>Carrier identity: legal name, DBA, USDOT number, MC number, EIN, business address, principals.</li>
              <li>Personnel records: driver names, dates of birth, contact information, CDL numbers, license states, hire/termination dates, employment history, references.</li>
              <li>Compliance records: driver qualification files (medical certs, applications, road tests, MVRs), drug and alcohol test results, hours-of-service logs, DVIRs, accident reports, inspection reports, training records.</li>
              <li>Vehicle records: VIN, license plate, registration, inspection history, maintenance records.</li>
              <li>Operational data: trip-mileage exports, fuel-card statements, IFTA filing data, CSA snapshots.</li>
            </ul>

            <h3 className="text-[16px] font-bold text-white mt-5 mb-2">2.2 Information we collect automatically</h3>
            <ul className="list-disc pl-6 space-y-2">
              <li>Account &amp; usage data: login timestamps, IP addresses, browser type, pages visited, features used, error events.</li>
              <li>Device data: operating system, device type for mobile applications.</li>
              <li>Cookies and similar technologies: session cookies and a small number of authentication cookies. We do not use third-party advertising cookies.</li>
            </ul>

            <h3 className="text-[16px] font-bold text-white mt-5 mb-2">2.3 Information from third-party services (only when Customer authorizes)</h3>
            <ul className="list-disc pl-6 space-y-2">
              <li>FMCSA SAFER snapshots (public).</li>
              <li>Background check, MVR, and drug-test results from partner networks (Checkr, Health Street, future MVR partners).</li>
              <li>ELD telematics data (Samsara, Motive, Geotab) when Customer connects an account.</li>
              <li>Fuel-card transaction data (WEX, Comdata, EFS) when Customer connects an account.</li>
              <li>Payment and billing data via our payment processor (Stripe). We never store full card numbers.</li>
            </ul>
          </Section>

          <Section id="how" title="3. How We Use It">
            <p>We use information to:</p>
            <ul className="list-disc pl-6 space-y-2 my-3">
              <li>Operate and maintain the Service for Customer&apos;s benefit.</li>
              <li>Authenticate users and authorize access at the carrier and role level.</li>
              <li>Generate reports, summaries, and outputs at Customer&apos;s request.</li>
              <li>Send compliance reminders (driver document expirations, MVR refreshes, IFTA deadlines, CSA snapshot reminders) on Customer&apos;s behalf.</li>
              <li>Diagnose and fix bugs, monitor for fraud and security incidents, prevent abuse.</li>
              <li>Improve the Service in aggregated, anonymized ways that cannot be traced to a specific carrier or person.</li>
              <li>Comply with legal obligations and respond to legitimate legal process.</li>
            </ul>
            <p>
              We do not sell personal information. We do not share personal information with advertisers. We do not use Customer Data to train any artificial intelligence model except where the Customer has explicitly opted in to features that require it (and even then, only on Customer&apos;s own data, not pooled across customers).
            </p>
          </Section>

          <Section id="share" title="4. Who We Share With">
            <p>We share personal information only with:</p>
            <ul className="list-disc pl-6 space-y-2 my-3">
              <li><strong className="text-white">Service providers</strong> who power the platform: Supabase (database, authentication, file storage), Cloudflare (content delivery, hosting), Stripe (payments), Resend (transactional email), Twilio (text messaging when enabled), Sentry (error tracking), Anthropic (AI fallback parsing for unstructured uploads). Each has a published Data Processing Addendum and is bound to use data only for the purposes we specify.</li>
              <li><strong className="text-white">Partner networks</strong> when Customer enables an add-on: Checkr (background checks), Health Street (drug &amp; alcohol testing), and future MVR / IFTA partners. Data flows are limited to what&apos;s needed for the requested service.</li>
              <li><strong className="text-white">Carrier-authorized recipients</strong>: when Customer asks us to send a record to a third party (e.g., an insurer doing a fleet review, an auditor, an attorney), we follow Customer&apos;s instructions.</li>
              <li><strong className="text-white">Successors</strong> in interest in the event of a merger, acquisition, or sale of substantially all assets — with notice to Customer and continued protection equivalent to this Policy.</li>
              <li><strong className="text-white">Government and law enforcement</strong> when legally required (subpoena, court order, valid warrant). We notify Customer where legally permitted.</li>
            </ul>
          </Section>

          <Section id="fcra" title="5. FCRA-Covered Records">
            <p>
              Background checks, MVRs, and certain investigative reports may be governed by the federal Fair Credit Reporting Act (FCRA). When the Service handles FCRA-covered records on Customer&apos;s behalf:
            </p>
            <ul className="list-disc pl-6 space-y-2 my-3">
              <li>Customer is the &quot;user&quot; of the consumer report under FCRA. Customer is responsible for permissible-purpose certification, applicant disclosure, written authorization, pre-adverse-action notice, and adverse-action notice when applicable.</li>
              <li>X3 is a conduit and recordkeeping aid; X3 is not a consumer reporting agency, does not furnish reports to third parties, and does not assemble investigative consumer reports.</li>
              <li>Partner networks (Checkr, future MVR providers) are the consumer reporting agencies under FCRA; their CRA-level obligations remain with them.</li>
            </ul>
            <p>If a driver disputes the accuracy of a record, the dispute should be made to the originating CRA (e.g., Checkr) per FCRA&apos;s dispute process. X3 will assist by surfacing the record and the originating CRA contact.</p>
          </Section>

          <Section id="dot" title="6. DOT Compliance Records">
            <p>
              DOT compliance records have layered obligations beyond ordinary privacy law. Some records (DQF contents, drug-test records, hours-of-service) have <em>regulatory minimum retention windows</em> that override ordinary deletion requests. Our Data Retention &amp; Destruction Policy details the windows. In summary:
            </p>
            <div className="my-4 overflow-x-auto">
              <table className="w-full text-[13px] border border-[#1E3556] rounded-lg overflow-hidden">
                <thead className="bg-[#000000]">
                  <tr>
                    <th className="text-left p-3 text-white border-b border-[#1E3556]">Record class</th>
                    <th className="text-left p-3 text-white border-b border-[#1E3556]">Regulation</th>
                    <th className="text-left p-3 text-white border-b border-[#1E3556]">Minimum retention</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    ["DQF contents", "49 CFR § 391.51", "3 years post-termination"],
                    ["MVR pulls", "§ 391.51", "3 years"],
                    ["D&A test (negative)", "§ 382.401", "1 year"],
                    ["D&A test (positive/refusal)", "§ 382.401", "5 years"],
                    ["Hours-of-service / RODS", "§ 395.8", "6 months"],
                    ["DVIR", "§ 396.11", "90 days"],
                    ["IFTA mileage + fuel", "IFTA Articles § P560", "4 years"],
                  ].map(([cls, reg, ret]) => (
                    <tr key={cls} className="border-b border-[#1E3556] last:border-0">
                      <td className="p-3 text-white/75">{cls}</td>
                      <td className="p-3 text-white/75">{reg}</td>
                      <td className="p-3 text-white/75">{ret}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p>X3 retains records for the regulatory minimum plus a 1-year safety buffer.</p>
          </Section>

          <Section id="retention" title="7. Retention & Destruction">
            <p>
              We retain Customer Data for as long as Customer&apos;s account is active, plus the regulatory retention windows above for DOT-covered records, plus up to 90 days for backups to age out. Audit logs are retained for 7 years to support our own compliance and audit defense.
            </p>
          </Section>

          <Section id="security" title="8. Security">
            <p>
              We protect personal information using administrative, physical, and technical safeguards including encryption at rest and in transit, role-based access controls, row-level security for tenant isolation, audit logging, and regular security reviews. Despite these measures, no system is impervious; if we discover unauthorized access to your data, we will notify Customer (the data controller) within 72 hours of confirmation, per our Incident Response Policy.
            </p>
          </Section>

          <Section id="rights" title="9. Your Rights">
            <p>
              Depending on where you live, you may have rights to access, correct, delete, port, or restrict the processing of personal information about you. Under California&apos;s CCPA / CPRA, residents have the right to know what data we hold, request deletion, request correction, and opt out of &quot;sale&quot; or &quot;sharing&quot; (we do neither).
            </p>
            <p>
              Because X3 is a data processor for carrier customers, individual rights requests should typically be directed to the carrier-controller first. If a carrier instructs us to access, export, correct, or delete a record, we will do so unless prevented by regulatory retention obligations. If you are unable to reach the carrier or believe the carrier is not responding, contact{" "}
              <a href="mailto:joshua@x3compass.com" className="text-[#16C7FF] hover:underline">joshua@x3compass.com</a>{" "}
              and we will route your request appropriately.
            </p>
          </Section>

          <Section id="kids" title="10. Children">
            <p>
              The Service is not directed at children under 16, and we do not knowingly collect personal information from children. Commercial driver licensure requires drivers to be 18+ (interstate) or 21+ for many operations, so the Service inherently does not contemplate child users.
            </p>
          </Section>

          <Section id="changes" title="11. Changes to this Policy">
            <p>
              We may update this Privacy Policy. Material changes will be communicated to Customer by email and an in-app banner with at least 30 days&apos; notice before they take effect. The &quot;Last updated&quot; date at the top reflects the most recent revision.
            </p>
          </Section>

          <Section id="sms" title="12. SMS Communications">
            <p>
              If a user provides a mobile phone number and checks the SMS consent checkbox during account signup, X3 Compass may send operational SMS messages to that number. SMS messages are transactional and operational only — we never use SMS for marketing, promotions, or solicitation.
            </p>
            <p><strong className="text-white">Message types include:</strong></p>
            <ul className="list-disc pl-6 space-y-2 my-3">
              <li>Subscription renewal and billing notifications</li>
              <li>Driver qualification file (DQF) expiry alerts</li>
              <li>Motor Vehicle Report (MVR) renewal notices</li>
              <li>Drug and alcohol random-selection notifications</li>
              <li>Drug &amp; Alcohol Clearinghouse query results</li>
              <li>Background check completion notices</li>
              <li>Account security alerts (new sign-in, password reset)</li>
              <li>Other DOT compliance and account notifications</li>
            </ul>
            <p>
              <strong className="text-white">Frequency.</strong> Approximately 2–5 messages per user per month, depending on the number of drivers managed and pending compliance events.
            </p>
            <p>
              <strong className="text-white">Consent.</strong> Explicit, opt-in only. Users must check an unchecked-by-default consent checkbox on the signup page at{" "}
              <Link href="/signup" className="text-[#16C7FF] hover:underline">app.x3compass.com/signup</Link>. Consent is logged in our database with timestamp, IP address, user agent, and a hash of the exact text the user agreed to. Consent records are retained for 4 years per FCC TCPA requirements.
            </p>
            <p>
              <strong className="text-white">Opt-out.</strong> Users can opt out at any time by replying STOP, STOPALL, UNSUBSCRIBE, CANCEL, END, or QUIT to any message. The system processes opt-outs within 30 seconds and sends a single confirmation message. To resubscribe, reply START. Users may also opt out by emailing{" "}
              <a href="mailto:joshua@x3compass.com" className="text-[#16C7FF] hover:underline">joshua@x3compass.com</a>.
            </p>
            <p>
              <strong className="text-white">Help.</strong> Reply HELP for support, or email{" "}
              <a href="mailto:joshua@x3compass.com" className="text-[#16C7FF] hover:underline">joshua@x3compass.com</a>.
            </p>
            <p>
              <strong className="text-white">Costs.</strong> Message and data rates may apply depending on your mobile carrier and plan. X3 Compass does not charge for SMS messages.
            </p>
            <p>
              <strong className="text-white">Mobile information sharing.</strong> Mobile information (including phone numbers and SMS consent data) will not be shared with third parties or affiliates for marketing or promotional purposes. We share SMS delivery data only with our SMS service provider (Twilio) as a sub-processor strictly to deliver messages on our behalf.
            </p>
            <p>
              <strong className="text-white">Carrier disclaimer.</strong> Mobile carriers are not liable for delayed or undelivered messages. Service availability depends on your carrier and signal coverage.
            </p>
          </Section>

          <Section id="contact" title="13. Contact">
            <p>
              Privacy questions:{" "}
              <a href="mailto:joshua@x3compass.com" className="text-[#16C7FF] hover:underline">joshua@x3compass.com</a>{" "}
              (subject line: &quot;Privacy&quot;). Postal address available on request to that email.
            </p>
          </Section>

          <div className="border-t border-[#1E3556] mt-12 pt-6 text-[12px] text-white/45 flex flex-wrap justify-between gap-3">
            <span>© 2026 X3 Fleet Safety, LLC · operating X3 Compass</span>
            <span>
              <Link href="/terms" className="hover:text-white">Terms of Service</Link> ·{" "}
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
