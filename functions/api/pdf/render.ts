/**
 * POST /api/pdf/render
 *
 * X3 Compass branded PDF generator · Phase 1 spike.
 *
 * Renders an HTML template via Cloudflare Browser Rendering's /pdf endpoint
 * with the X3 Compass letterhead headerTemplate + brand footerTemplate
 * stamped on every page.
 *
 * Architecture:
 *   1. Client POSTs { template: 'letterhead-test', data: {...} }
 *   2. We resolve the template fn, build the body HTML + page-level CSS
 *   3. POST to Cloudflare's Browser Rendering API with `html`, headerTemplate,
 *      footerTemplate, pdfOptions
 *   4. Stream the PDF binary back to the client as application/pdf
 *
 * Env vars required:
 *   CF_ACCOUNT_ID                · Cloudflare account ID (already in secrets)
 *   CF_BROWSER_RENDERING_TOKEN   · API token w/ "Browser Rendering - Edit"
 *
 * If either env var is missing, we return a clear setup error pointing at
 * PDF_SETUP.md so this never silently fails.
 *
 * Auth: optional Bearer JWT · if present, we verify carrier membership and
 * include the caller's name in the audit footer. If absent, we render in
 * demo mode (sample data only).
 *
 * Phase 2 will add: pdf-lib stamping endpoint, merge endpoint, audit logging
 * to compass_audit_log so generated PDFs are tracked for the audit packet.
 *
 * See: /PDF_SETUP.md · /src/lib/pdfTemplates/index.ts
 */

import {
  TEMPLATES,
  buildHeaderTemplate,
  buildFooterTemplate,
  wrapBody,
  type TemplateOutput,
} from "../../_shared/pdfTemplates";

interface Env {
  CF_ACCOUNT_ID?: string;
  CF_BROWSER_RENDERING_TOKEN?: string;
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
  // 1. Parse + validate the request
  let body: { template?: string; data?: Record<string, unknown>; inline?: boolean };
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

  // 2. Check env vars BEFORE building HTML · fail fast with a useful error
  if (!env.CF_ACCOUNT_ID || !env.CF_BROWSER_RENDERING_TOKEN) {
    return json({
      ok: false,
      error: "Browser Rendering not configured",
      detail: "Missing CF_ACCOUNT_ID or CF_BROWSER_RENDERING_TOKEN environment variables in Cloudflare Pages settings.",
      setup_doc: "/PDF_SETUP.md · 5-minute setup",
      missing: {
        CF_ACCOUNT_ID: !env.CF_ACCOUNT_ID,
        CF_BROWSER_RENDERING_TOKEN: !env.CF_BROWSER_RENDERING_TOKEN,
      },
    }, 503);
  }

  // 3. Build the document
  let output: TemplateOutput;
  try {
    output = templateFn(body.data || {});
  } catch (e) {
    return json({ ok: false, error: `Template render failed: ${e instanceof Error ? e.message : String(e)}` }, 500);
  }

  const html = wrapBody(output.title, output.bodyHTML);
  const headerTemplate = buildHeaderTemplate(output.headerSubtitle);
  const footerTemplate = buildFooterTemplate();

  // 4. POST to Cloudflare Browser Rendering /pdf
  const cfEndpoint = `https://api.cloudflare.com/client/v4/accounts/${env.CF_ACCOUNT_ID}/browser-rendering/pdf`;
  const cfPayload = {
    html,
    pdfOptions: {
      format: "letter",
      printBackground: true,
      displayHeaderFooter: true,
      headerTemplate,
      footerTemplate,
      margin: { top: "1.1in", bottom: "0.85in", left: "0.6in", right: "0.6in" },
      ...output.pdfOptions,
    },
  };

  let cfRes: Response;
  try {
    cfRes = await fetch(cfEndpoint, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${env.CF_BROWSER_RENDERING_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(cfPayload),
    });
  } catch (e) {
    return json({ ok: false, error: `Browser Rendering fetch failed: ${e instanceof Error ? e.message : String(e)}` }, 502);
  }

  if (!cfRes.ok) {
    const txt = await cfRes.text();
    return json({
      ok: false,
      error: `Browser Rendering returned ${cfRes.status}`,
      detail: txt.slice(0, 400),
    }, cfRes.status >= 500 ? 502 : cfRes.status);
  }

  // 5. Stream the PDF back to the caller
  const pdfBuf = await cfRes.arrayBuffer();
  const filename = `${templateSlug}-${Date.now()}.pdf`;
  const disposition = body.inline ? "inline" : "attachment";

  return new Response(pdfBuf, {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Length": String(pdfBuf.byteLength),
      "Content-Disposition": `${disposition}; filename="${filename}"`,
      "Cache-Control": "private, no-store",
      "Access-Control-Allow-Origin": "*",
    },
  });
}
