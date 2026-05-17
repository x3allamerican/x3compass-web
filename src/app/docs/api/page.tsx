import Link from "next/link";
import DocsLayout, { H2, H3, Code, Pre } from "@/components/DocsLayout";

export const metadata = {
  title: "API reference — X3 Compass Docs",
  description: "REST endpoints for X3 Compass. Auth, rate limits, ask Compass, audit export, driver/vehicle/inspection CRUD, webhooks.",
};

const TOC = [
  { href: "#base",        label: "Base URL + versioning" },
  { href: "#auth",        label: "Authentication" },
  { href: "#rate-limits", label: "Rate limits" },
  { href: "#ask",         label: "POST /api/ask" },
  { href: "#ask-demo",    label: "POST /api/ask-demo" },
  { href: "#health",      label: "GET  /api/health" },
  { href: "#crud",        label: "Drivers + vehicles CRUD" },
  { href: "#audit",       label: "POST /api/audit/build" },
  { href: "#webhooks",    label: "Webhooks" },
  { href: "#errors",      label: "Error format" },
];

export default function ApiDocsPage() {
  return (
    <DocsLayout title="API reference" eyebrow="Documentation · Reference" toc={TOC}>
      <p className="text-[17px]">
        Compass exposes a small REST API. Authentication is Supabase JWT (same token used by the web app).
        Every endpoint is rate-limited per IP via the in-edge limiter, then per-user once authenticated.
      </p>

      <H2 id="base">Base URL + versioning</H2>
      <p>Production base: <Code>https://x3compass.com/api</Code> (Cloudflare Pages Functions). No version prefix today — breaking changes will introduce
      <Code>/api/v2/</Code> and the unversioned routes will be aliased to v1 for ≥ 6 months.</p>

      <H2 id="auth">Authentication</H2>
      <p>Every authed endpoint expects a Supabase JWT in the Authorization header:</p>
      <Pre lang="HTTP">{`Authorization: Bearer <SUPABASE_JWT>
Content-Type: application/json`}</Pre>
      <p>Get the JWT by signing in via Supabase Auth — see <Link href="/docs/integrations#supabase" className="text-[var(--accent)] hover:underline">Integrations → Supabase</Link>.
      The JWT is also stored as an HTTP-only cookie after sign-in for browser flows.</p>
      <p><strong>Service-role keys are never accepted on customer endpoints.</strong> Only internal Pages Functions (e.g. the Stripe webhook) use service-role
      credentials — and those are server-side environment vars, not handed to clients.</p>

      <H2 id="rate-limits">Rate limits</H2>
      <ul className="list-disc list-inside ml-2 space-y-1">
        <li><Code>/api/ask</Code> — 30 req / min / IP (authed)</li>
        <li><Code>/api/ask-demo</Code> — 5 req / 6 h / IP (unauth, public)</li>
        <li>Stripe + webhook endpoints — unlimited (HMAC-verified)</li>
        <li>Everything else — 60 req / min / IP</li>
      </ul>
      <p>Exceeding a limit returns HTTP 429 with <Code>Retry-After</Code> in seconds.</p>

      <H2 id="ask">POST <Code>/api/ask</Code></H2>
      <p>Ask Compass an FMCSA compliance question. Authenticated; uses your carrier&apos;s context where relevant.</p>
      <Pre lang="Request">{`POST /api/ask
Authorization: Bearer <jwt>
{
  "messages": [
    { "role": "user", "content": "Random rate for 2026 — what % must I hit?" }
  ],
  "model": "claude-sonnet-4-6"   // optional, default
}`}</Pre>
      <Pre lang="Response 200">{`{
  "ok": true,
  "content": "Per 49 CFR § 382.305(b)(2), the minimum annual random testing rate ...",
  "model": "claude-sonnet-4-6",
  "usage": { "input_tokens": 145, "output_tokens": 312 },
  "cited_sections": ["382.305(b)(2)", "382.305"],
  "unverified_citations": [],
  "citation_quality_score": 1.0
}`}</Pre>
      <p>The <Code>cited_sections</Code> array is every 49 CFR section in the response. Each is round-tripped against the live
      eCFR registry before the response returns — sections that don&apos;t resolve are listed in <Code>unverified_citations</Code> and
      drop the <Code>citation_quality_score</Code> below 1.0.</p>

      <H2 id="ask-demo">POST <Code>/api/ask-demo</Code></H2>
      <p>Unauthenticated demo endpoint, same shape as /api/ask but rate-limited 5 req / 6h / IP and capped at 800 chars per
      prompt. The homepage Ask Compass widget uses this.</p>

      <H2 id="health">GET <Code>/api/health</Code></H2>
      <p>Public health check. Pings Supabase + Stripe with 5-second timeouts. Used by the uptime + journey-probe crons.</p>
      <Pre lang="Response 200">{`{
  "ok": true,
  "status": "operational",
  "checked_at": "2026-05-17T17:47:02.165Z",
  "total_ms": 482,
  "services": {
    "supabase": { "ok": true, "ms": 482 },
    "stripe":   { "ok": true, "ms": 326 }
  }
}`}</Pre>

      <H2 id="crud">Drivers + vehicles CRUD</H2>
      <p>Standard RESTful endpoints for the carrier-data tables. All require auth + are RLS-isolated by carrier_id at the database tier — even if a
      bug skipped a check at the API layer, the DB would still return zero rows.</p>
      <Pre lang="Endpoints">{`GET    /api/drivers                 # list drivers for current carrier
POST   /api/drivers                 # create driver
GET    /api/drivers/{id}            # get one
PATCH  /api/drivers/{id}            # partial update
DELETE /api/drivers/{id}            # soft-delete (status=terminated)

GET    /api/vehicles                # list vehicles
POST   /api/vehicles                # create
GET    /api/vehicles/{id}
PATCH  /api/vehicles/{id}
DELETE /api/vehicles/{id}

GET    /api/inspections             # list inspections, paginated
POST   /api/inspections             # log an inspection
GET    /api/inspections/{id}
PATCH  /api/inspections/{id}        # mark OOS, attach photo evidence, etc.`}</Pre>
      <p>Full schemas: see Supabase auto-generated REST docs at <Code>https://lsxtcluavinibdqlooil.supabase.co/rest/v1/?apikey={"{anon_key}"}</Code> once authenticated.</p>

      <H2 id="audit">POST <Code>/api/audit/build</Code></H2>
      <p>Builds a ZIP audit packet for the current carrier. Returns a signed URL to download. ZIP includes 10 tables + manifest
      + a README mapping each file to the CFR section it satisfies.</p>
      <Pre lang="Response">{`{
  "ok": true,
  "url": "https://r2.x3compass.com/audits/{carrier_id}/{timestamp}.zip?sig=...",
  "expires_at": "2026-05-18T17:47:02Z",
  "size_bytes": 4823091
}`}</Pre>

      <H2 id="webhooks">Webhooks</H2>
      <p>Compass receives webhooks from Stripe (subscription state) and Checkr (background-check report updates). Both verify HMAC
      signatures before any state change. Customer-facing outbound webhooks are on the roadmap — eventual events:</p>
      <ul className="list-disc list-inside ml-2 space-y-1">
        <li><Code>driver.cdl_expiring</Code> — fires 60 days, 30 days, 7 days before expiry</li>
        <li><Code>inspection.oos_logged</Code> — fires when an OOS inspection is logged</li>
        <li><Code>audit.export_ready</Code> — fires when an audit ZIP completes</li>
      </ul>

      <H2 id="errors">Error format</H2>
      <p>Every error returns JSON:</p>
      <Pre lang="Error 4xx/5xx">{`{
  "ok": false,
  "error": "Human-readable message",
  "detail": "Optional longer detail",
  "code": "RATE_LIMITED"     // optional, machine-readable
}`}</Pre>
      <p>Common codes: <Code>UNAUTHORIZED</Code>, <Code>FORBIDDEN</Code>, <Code>RATE_LIMITED</Code>, <Code>NOT_FOUND</Code>,
      <Code>VALIDATION_ERROR</Code>, <Code>UPSTREAM_ERROR</Code>.</p>
    </DocsLayout>
  );
}
