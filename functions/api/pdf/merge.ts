/**
 * POST /api/pdf/merge
 *
 * Stack 2 · Merge multiple PDFs into one X3-branded audit packet.
 *
 * The flagship use case is the FMCSA audit packet: a carrier under FMCSA
 * compliance review needs to assemble a single PDF containing:
 *   - DQF files (12 docs per driver, §391.51)
 *   - MVR records (§391.25)
 *   - Drug & alcohol test results + Clearinghouse queries (§382)
 *   - Roadside inspection reports
 *   - Training certificates
 *   - Hazmat checklists (if applicable)
 * Today the carrier hand-prints each one and ships a binder. With this
 * endpoint they get a single branded PDF with a cover page.
 *
 * Request body (application/json):
 *   {
 *     sources: [
 *       { template: "letterhead-test", data: {...} },         // render via Browser Rendering
 *       { url: "https://example.com/some.pdf" },              // fetch + embed
 *       { base64: "JVBERi0xLjQ..." },                         // inline bytes
 *     ],
 *     cover?: { title, subtitle?, meta?: ["Key: Value", ...] },
 *     subtitle?: string,           // band subtitle stamped on every merged page
 *     stamp?: boolean              // default true · apply X3 stamp to every page
 *   }
 *
 * Response: merged PDF binary as application/pdf
 *           or { ok: false, error } on failure
 *
 * Auth: optional Bearer JWT · used for audit-log lineage. The endpoint
 * itself is public so it can be called from a Pages Function, n8n, etc.
 *
 * Constraints:
 *   - 10 input sources max
 *   - 10 MB per input · 25 MB total output cap
 *   - Embedded URL sources must be public (no authenticated fetch)
 */

import { mergePdfs, type MergeSource } from "../../_shared/pdfStamp";
import { logPdfGenerated } from "../../_shared/pdfAudit";
import { bearerFromRequest, verifySupabaseJwt, type SupaEnv } from "../../_shared/supabase-admin";
import {
  TEMPLATES,
  buildHeaderTemplate,
  buildFooterTemplate,
  wrapBody,
  type TemplateOutput,
} from "../../_shared/pdfTemplates";

interface Env extends SupaEnv {
  CF_ACCOUNT_ID?: string;
  CF_BROWSER_RENDERING_TOKEN?: string;
}

const json = (b: unknown, s = 200) =>
  new Response(JSON.stringify(b), {
    status: s,
    headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
  });

const MAX_INPUT_BYTES = 10 * 1024 * 1024;
const MAX_OUTPUT_BYTES = 25 * 1024 * 1024;
const MAX_SOURCES = 10;

type SourceSpec =
  | { template: string; data?: Record<string, unknown> }
  | { url: string }
  | { base64: string };

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

/** Render a template via Browser Rendering · returns the raw PDF bytes */
async function renderTemplate(env: Env, template: string, data: Record<string, unknown>): Promise<Uint8Array> {
  if (!env.CF_ACCOUNT_ID || !env.CF_BROWSER_RENDERING_TOKEN) {
    throw new Error("CF_ACCOUNT_ID / CF_BROWSER_RENDERING_TOKEN not set · /api/pdf/merge cannot render templates without Browser Rendering");
  }
  const fn = TEMPLATES[template];
  if (!fn) throw new Error(`Unknown template '${template}' · available: ${Object.keys(TEMPLATES).join(", ")}`);
  const out: TemplateOutput = fn(data);
  const html = wrapBody(out.title, out.bodyHTML);
  const r = await fetch(
    `https://api.cloudflare.com/client/v4/accounts/${env.CF_ACCOUNT_ID}/browser-rendering/pdf`,
    {
      method: "POST",
      headers: { Authorization: `Bearer ${env.CF_BROWSER_RENDERING_TOKEN}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        html,
        pdfOptions: {
          format: "letter",
          printBackground: true,
          displayHeaderFooter: true,
          headerTemplate: buildHeaderTemplate(out.headerSubtitle),
          footerTemplate: buildFooterTemplate(),
          margin: { top: "1.55in", bottom: "0.85in", left: "0.6in", right: "0.6in" },
          ...out.pdfOptions,
        },
      }),
    }
  );
  if (!r.ok) throw new Error(`Browser Rendering returned ${r.status}: ${(await r.text()).slice(0, 200)}`);
  return new Uint8Array(await r.arrayBuffer());
}

export async function onRequestPost({ request, env }: { request: Request; env: Env }): Promise<Response> {
  let body: { sources?: SourceSpec[]; cover?: { title: string; subtitle?: string; meta?: string[] }; subtitle?: string; stamp?: boolean };
  try { body = await request.json() as typeof body; }
  catch { return json({ ok: false, error: "Invalid JSON body" }, 400); }

  if (!Array.isArray(body.sources) || body.sources.length === 0) {
    return json({ ok: false, error: "sources array required" }, 400);
  }
  if (body.sources.length > MAX_SOURCES) {
    return json({ ok: false, error: `Too many sources (max ${MAX_SOURCES})` }, 400);
  }

  // Resolve each source into raw PDF bytes
  const resolved: MergeSource[] = [];
  for (let i = 0; i < body.sources.length; i++) {
    const s = body.sources[i];
    try {
      if ("template" in s) {
        const bytes = await renderTemplate(env, s.template, s.data || {});
        if (bytes.byteLength > MAX_INPUT_BYTES) return json({ ok: false, error: `Source ${i} (rendered ${s.template}) exceeds 10 MB` }, 413);
        resolved.push({ kind: "buffer", buffer: bytes.buffer, label: s.template });
      } else if ("url" in s) {
        const r = await fetch(s.url);
        if (!r.ok) return json({ ok: false, error: `Source ${i} fetch failed: ${r.status} for ${s.url}` }, 400);
        const buf = await r.arrayBuffer();
        if (buf.byteLength > MAX_INPUT_BYTES) return json({ ok: false, error: `Source ${i} (${s.url}) exceeds 10 MB` }, 413);
        resolved.push({ kind: "buffer", buffer: buf, label: s.url });
      } else if ("base64" in s) {
        const b64 = s.base64.replace(/^data:application\/pdf;base64,/, "");
        if (b64.length > MAX_INPUT_BYTES * 1.4) return json({ ok: false, error: `Source ${i} base64 exceeds limit` }, 413);
        resolved.push({ kind: "base64", base64: b64, label: `base64-${i}` });
      } else {
        return json({ ok: false, error: `Source ${i} missing template / url / base64` }, 400);
      }
    } catch (e) {
      return json({ ok: false, error: `Source ${i} failed: ${e instanceof Error ? e.message : String(e)}` }, 422);
    }
  }

  // Merge
  let merged: Uint8Array;
  try {
    merged = await mergePdfs(resolved, {
      cover: body.cover,
      subtitle: body.subtitle,
      stamp: body.stamp !== false,
    });
  } catch (e) {
    return json({ ok: false, error: `Merge failed: ${e instanceof Error ? e.message : String(e)}` }, 500);
  }

  if (merged.byteLength > MAX_OUTPUT_BYTES) {
    return json({ ok: false, error: `Merged output ${merged.byteLength} bytes exceeds ${MAX_OUTPUT_BYTES / 1024 / 1024} MB cap` }, 413);
  }

  // Audit log (best-effort)
  try {
    const token = bearerFromRequest(request);
    const user = token ? await verifySupabaseJwt(env, token) : null;
    if (user) {
      await logPdfGenerated(env, {
        user_id: user.sub,
        source: "merge",
        template_slug: `merge:${body.sources.length}-sources`,
        byte_size: merged.byteLength,
      });
    }
  } catch { /* swallow */ }

  return new Response(merged, {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Length": String(merged.byteLength),
      "Content-Disposition": `attachment; filename="x3-merged-${Date.now()}.pdf"`,
      "Cache-Control": "private, no-store",
      "Access-Control-Allow-Origin": "*",
    },
  });
}
