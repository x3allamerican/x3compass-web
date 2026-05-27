/**
 * POST /api/pdf/render-legal
 *
 * Stack 3 of the PDF strategy. Routes to the external WeasyPrint service
 * (deployed on Render.com) for legally-formatted documents that need
 * CSS Paged Media features Chromium's headerTemplate can't provide:
 *   - Running heads that vary by page (@page :first vs :left vs :right)
 *   - Footnotes that flow to the bottom of the right page
 *   - Page-aware widow/orphan + page-break-after avoid
 *   - PDF bookmarks/outline for navigable long-form docs
 *
 * Same template registry as /api/pdf/render (Stack 1) · we reuse the
 * pdfTemplates module + wrapBody helper, just send the HTML to WeasyPrint
 * instead of Cloudflare Browser Rendering. Means one source of truth for
 * brand styling; the choice of engine is purely about page-aware features.
 *
 * Request body (application/json):
 *   {
 *     template: "letterhead-test" | "hazmat-audit-checklist" | "training-certificate",
 *     data: Record<string, unknown>,
 *     pdf_metadata?: {
 *       title?: string,
 *       author?: string,
 *       subject?: string,
 *       keywords?: string[]
 *     }
 *   }
 *
 * Env vars required:
 *   WEASYPRINT_SERVICE_URL  · https://x3-weasyprint.onrender.com (no trailing slash)
 *   WEASYPRINT_TOKEN        · shared bearer token, matches the service env var
 *
 * If env vars not set, returns 503 with /services/weasyprint/README.md
 * deploy steps · so this endpoint can sit in production unused until the
 * WeasyPrint service is deployed.
 */

import {
  TEMPLATES,
  wrapBody,
  type TemplateOutput,
} from "../../_shared/pdfTemplates";
import { logPdfGenerated } from "../../_shared/pdfAudit";
import { bearerFromRequest, verifySupabaseJwt, type SupaEnv } from "../../_shared/supabase-admin";

interface Env extends SupaEnv {
  WEASYPRINT_SERVICE_URL?: string;
  WEASYPRINT_TOKEN?: string;
}

const json = (b: unknown, s = 200) =>
  new Response(JSON.stringify(b), {
    status: s,
    headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
  });

export async function onRequestOptions(): Promise<Response> {
  return new Response(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Authorization, Content-Type",
    },
  });
}

export async function onRequestPost({ request, env }: { request: Request; env: Env }): Promise<Response> {
  // 1. Parse + validate
  let body: { template?: string; data?: Record<string, unknown>; pdf_metadata?: { title?: string; author?: string; subject?: string; keywords?: string[] } };
  try { body = await request.json() as typeof body; }
  catch { return json({ ok: false, error: "Invalid JSON body" }, 400); }

  const templateSlug = body.template || "letterhead-test";
  const templateFn = TEMPLATES[templateSlug];
  if (!templateFn) {
    return json({
      ok: false,
      error: `Unknown template '${templateSlug}'`,
      available: Object.keys(TEMPLATES),
    }, 400);
  }

  // 2. Fail fast if WeasyPrint service not configured · point at deploy doc
  if (!env.WEASYPRINT_SERVICE_URL || !env.WEASYPRINT_TOKEN) {
    return json({
      ok: false,
      error: "WeasyPrint service not configured",
      detail: "Missing WEASYPRINT_SERVICE_URL or WEASYPRINT_TOKEN environment variables. The service code is in /services/weasyprint/ · deploy to Render.com via render.yaml + set both env vars on Cloudflare Pages. See /services/weasyprint/README.md for the 5-minute setup.",
      missing: {
        WEASYPRINT_SERVICE_URL: !env.WEASYPRINT_SERVICE_URL,
        WEASYPRINT_TOKEN: !env.WEASYPRINT_TOKEN,
      },
    }, 503);
  }

  // 3. Build the HTML using the shared template registry · same source of
  //    truth as Stack 1, just rendered through WeasyPrint instead of Chrome
  let output: TemplateOutput;
  try {
    output = templateFn(body.data || {});
  } catch (e) {
    return json({ ok: false, error: `Template render failed: ${e instanceof Error ? e.message : String(e)}` }, 500);
  }
  const html = wrapBody(output.title, output.bodyHTML);

  // 4. POST to the WeasyPrint service
  let svcRes: Response;
  try {
    svcRes = await fetch(`${env.WEASYPRINT_SERVICE_URL.replace(/\/$/, "")}/render`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${env.WEASYPRINT_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        html,
        base_url: "https://x3compass.com/",
        pdf_metadata: body.pdf_metadata || {
          title: output.title,
          author: "X3 Compass",
        },
      }),
    });
  } catch (e) {
    return json({
      ok: false,
      error: `WeasyPrint fetch failed: ${e instanceof Error ? e.message : String(e)}`,
      hint: "Render service may be cold-starting (30s on free plan) or unreachable. Check the Render dashboard.",
    }, 502);
  }

  if (!svcRes.ok) {
    const txt = await svcRes.text();
    return json({
      ok: false,
      error: `WeasyPrint service returned ${svcRes.status}`,
      detail: txt.slice(0, 400),
    }, svcRes.status >= 500 ? 502 : svcRes.status);
  }

  // 5. Stream the PDF back
  const pdfBuf = await svcRes.arrayBuffer();
  const filename = `${templateSlug}-legal-${Date.now()}.pdf`;

  // 6. Audit log (best-effort · never blocks the response)
  try {
    const token = bearerFromRequest(request);
    const user = token ? await verifySupabaseJwt(env, token) : null;
    if (user) {
      await logPdfGenerated(env, {
        user_id: user.sub,
        source: "render", // share the bucket · template_slug carries the stack hint
        template_slug: `legal:${templateSlug}`,
        byte_size: pdfBuf.byteLength,
      });
    }
  } catch { /* swallow */ }

  return new Response(pdfBuf, {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Length": String(pdfBuf.byteLength),
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "private, no-store",
      "Access-Control-Allow-Origin": "*",
      "X-Render-Engine": "weasyprint",
    },
  });
}
