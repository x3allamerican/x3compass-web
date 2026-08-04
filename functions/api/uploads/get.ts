/**
 * GET /api/uploads/get?k=<object-key> — relay R2 file to authenticated caller.
 * Verifies caller belongs to the carrier encoded in the object key.
 */
import { correlationId, requireTenant, securityError, type SecurityEnv } from "../../_shared/request-security";
interface Env extends SecurityEnv { R2_ACCESS_KEY_ID?: string; R2_SECRET_ACCESS_KEY?: string; R2_BUCKET?: string; R2_ACCOUNT_ID?: string; }

const enc = new TextEncoder();
async function hmac(k: ArrayBuffer|string, d: string): Promise<ArrayBuffer> {
  const key = typeof k === "string" ? enc.encode(k) : k;
  const ck = await crypto.subtle.importKey("raw", key, { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  return crypto.subtle.sign("HMAC", ck, enc.encode(d));
}
async function sha256Hex(d: string): Promise<string> {
  const h = await crypto.subtle.digest("SHA-256", enc.encode(d));
  return Array.from(new Uint8Array(h)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

export const onRequestGet: PagesFunction<Env> = async (ctx) => {
  try {
    if (!ctx.env.R2_ACCESS_KEY_ID || !ctx.env.R2_SECRET_ACCESS_KEY || !ctx.env.R2_BUCKET || !ctx.env.R2_ACCOUNT_ID) {
      return new Response(JSON.stringify({ ok: false, error: "R2 not configured" }), { status: 500, headers: { "Content-Type":"application/json" } });
    }
    const url = new URL(ctx.request.url);
    const key = url.searchParams.get("k");
    if (!key) return new Response("missing k", { status: 400 });
    const m = key.match(/^carriers\/([^/]+)\//);
    if (!m) return new Response("invalid key", { status: 400 });
    const requestId = correlationId(ctx.request);
    const authority = await requireTenant(ctx.request, ctx.env, m[1]);
    if (!authority.ok) return securityError(authority.status, authority.code, requestId);

    const host = `${ctx.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`;
    const url2 = `https://${host}/${ctx.env.R2_BUCKET}/${key.split("/").map(encodeURIComponent).join("/")}`;
    const amzDate = new Date().toISOString().replace(/[:-]|\.\d{3}/g, "");
    const dateStamp = amzDate.slice(0, 8);
    const payloadHash = "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855";
    const canonicalHeaders = `host:${host}\nx-amz-content-sha256:${payloadHash}\nx-amz-date:${amzDate}\n`;
    const signedHeaders = "host;x-amz-content-sha256;x-amz-date";
    const canonicalUri = `/${ctx.env.R2_BUCKET}/${key.split("/").map(encodeURIComponent).join("/")}`;
    const canonicalRequest = `GET\n${canonicalUri}\n\n${canonicalHeaders}\n${signedHeaders}\n${payloadHash}`;
    const stringToSign = `AWS4-HMAC-SHA256\n${amzDate}\n${dateStamp}/auto/s3/aws4_request\n${await sha256Hex(canonicalRequest)}`;
    const kDate = await hmac(`AWS4${ctx.env.R2_SECRET_ACCESS_KEY}`, dateStamp);
    const kSigning = await hmac(await hmac(await hmac(kDate, "auto"), "s3"), "aws4_request");
    const sig = Array.from(new Uint8Array(await hmac(kSigning, stringToSign))).map((b) => b.toString(16).padStart(2,"0")).join("");
    const auth = `AWS4-HMAC-SHA256 Credential=${ctx.env.R2_ACCESS_KEY_ID}/${dateStamp}/auto/s3/aws4_request, SignedHeaders=${signedHeaders}, Signature=${sig}`;

    return fetch(url2, { headers: { Host: host, "X-Amz-Content-SHA256": payloadHash, "X-Amz-Date": amzDate, Authorization: auth } });
  } catch {
    console.error("upload download failed");
    return securityError(500, "request_failed", correlationId(ctx.request));
  }
};
