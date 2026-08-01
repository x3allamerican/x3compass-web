/**
 * POST /api/pdf/stamp
 *
 * Stack 2 · Stamp the X3 Compass letterhead onto an existing PDF.
 *
 * Use cases:
 *   - Carrier uploads a PHMSA template they downloaded from phmsa.dot.gov
 *     and wants to put their X3 Compass-branded letterhead on top before
 *     printing for the driver's vehicle
 *   - Add X3 branding to a Checkr report PDF before forwarding to a client
 *   - Brand a 3rd-party hazardous waste manifest before customer hand-off
 *
 * Input modes (one of):
 *   - multipart/form-data with 'file' field · the typical browser upload
 *   - application/json with 'pdf_url' field · we fetch + stamp
 *   - application/json with 'pdf_base64' field · raw bytes inline
 *
 * Optional JSON fields:
 *   subtitle           · band right-side label, e.g. 'Hazmat audit · §172'
 *   footer_brand       · override the default footer brand line
 *   skip_footer        · true to keep the source PDF's existing footer untouched
 *
 * Response: PDF binary as application/pdf (Content-Disposition: attachment)
 *           OR { ok: false, error } on failure
 *
 * Auth: optional Bearer JWT · if present, carrier membership verified and
 * audit row written to compass_pdf_generated. If absent, demo mode (no
 * audit logging).
 *
 * Constraints:
 *   - 10 MB max input file (Cloudflare Pages Function body limit is generous
 *     but we cap for sanity)
 *   - PDFs only · we don't sniff content-type, we let pdf-lib reject non-PDF
 *   - Custom-font embedding via fontkit is broken on CF Workers · we stick to
 *     Standard Fonts (Helvetica family) for the stamp text
 *
 * See: /functions/_shared/pdfStamp.ts · /PDF_SETUP.md
 */

import { stampPdf } from "../../_shared/pdfStamp";
import { logPdfGenerated } from "../../_shared/pdfAudit";
import { bearerFromRequest, verifySupabaseJwt, type SupaEnv } from "../../_shared/supabase-admin";

interface Env extends SupaEnv {}

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

const MAX_SIZE = 10 * 1024 * 1024; // 10 MB

export async function onRequestPost({ request, env }: { request: Request; env: Env }): Promise<Response> {
  const contentType = request.headers.get("Content-Type") || "";

  let pdfBuffer: ArrayBuffer | null = null;
  let subtitle: string | undefined;
  let footerBrand: string | undefined;
  let skipFooter = false;
  let sourceLabel = "uploaded";

  try {
    if (contentType.includes("multipart/form-data")) {
      const form = await request.formData();
      const file = form.get("file");
      if (!(file instanceof File)) return json({ ok: false, error: "file field required" }, 400);
      if (file.size > MAX_SIZE) return json({ ok: false, error: `File too large (max ${MAX_SIZE / 1024 / 1024} MB)` }, 413);
      pdfBuffer = await file.arrayBuffer();
      subtitle = (form.get("subtitle") || "").toString() || undefined;
      footerBrand = (form.get("footer_brand") || "").toString() || undefined;
      skipFooter = (form.get("skip_footer") || "").toString() === "true";
      sourceLabel = file.name || "uploaded";
    } else if (contentType.includes("application/json")) {
      const body = await request.json() as { pdf_url?: string; pdf_base64?: string; subtitle?: string; footer_brand?: string; skip_footer?: boolean };
      subtitle = body.subtitle;
      footerBrand = body.footer_brand;
      skipFooter = body.skip_footer === true;

      if (body.pdf_url) {
        const r = await fetch(body.pdf_url);
        if (!r.ok) return json({ ok: false, error: `Could not fetch pdf_url (HTTP ${r.status})` }, 400);
        pdfBuffer = await r.arrayBuffer();
        if (pdfBuffer.byteLength > MAX_SIZE) return json({ ok: false, error: "Fetched PDF exceeds 10 MB" }, 413);
        sourceLabel = body.pdf_url;
      } else if (body.pdf_base64) {
        // strip optional data URI prefix
        const b64 = body.pdf_base64.replace(/^data:application\/pdf;base64,/, "");
        const binary = atob(b64);
        if (binary.length > MAX_SIZE) return json({ ok: false, error: "Decoded PDF exceeds 10 MB" }, 413);
        const bytes = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
        pdfBuffer = bytes.buffer;
        sourceLabel = "base64-inline";
      } else {
        return json({ ok: false, error: "Provide pdf_url or pdf_base64 in JSON body, or multipart file field" }, 400);
      }
    } else {
      return json({ ok: false, error: "Content-Type must be multipart/form-data or application/json" }, 400);
    }
  } catch (e) {
    return json({ ok: false, error: `Failed to read input: ${e instanceof Error ? e.message : String(e)}` }, 400);
  }

  if (!pdfBuffer) return json({ ok: false, error: "No PDF input parsed" }, 400);

  // Apply the X3 stamp
  let stamped: Uint8Array;
  try {
    stamped = await stampPdf(pdfBuffer, { subtitle, footerBrand, skipFooter });
  } catch (e) {
    return json({ ok: false, error: `Stamp failed · is the input a valid PDF? ${e instanceof Error ? e.message : String(e)}` }, 422);
  }

  // Audit log (best-effort · failure doesn't block delivery)
  try {
    const token = bearerFromRequest(request);
    const user = token ? await verifySupabaseJwt(env, token) : null;
    if (user) {
      await logPdfGenerated(env, {
        user_id: user.sub,
        source: "stamp",
        template_slug: sourceLabel.slice(0, 120),
        byte_size: stamped.byteLength,
      });
    }
  } catch { /* swallow · audit must never break the response */ }

  return new Response(stamped, {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Length": String(stamped.byteLength),
      "Content-Disposition": `attachment; filename="x3-stamped-${Date.now()}.pdf"`,
      "Cache-Control": "private, no-store",
      "Access-Control-Allow-Origin": "*",
    },
  });
}
