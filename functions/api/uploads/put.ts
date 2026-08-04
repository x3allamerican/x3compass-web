/**
 * PUT /api/uploads/put — relay file body to R2 via S3 SigV4.
 * The short-lived upload token is carried in `Authorization: Upload <token>` so
 * credentials do not enter URLs, access logs, referrers, or browser history.
 */
import { correlationId, securityError } from "../../_shared/request-security";
import { uploadTokenFromRequest, verifyUploadToken } from "../../_shared/upload-token";
interface Env { R2_ACCESS_KEY_ID?: string; R2_SECRET_ACCESS_KEY?: string; R2_BUCKET?: string; R2_ACCOUNT_ID?: string; UPLOAD_TOKEN_SECRET?: string; }
const json = (d: unknown, s = 200) => new Response(JSON.stringify(d), { status: s, headers: { "Content-Type": "application/json" } });

const enc = new TextEncoder();
async function hmac(k: ArrayBuffer | string, d: string): Promise<ArrayBuffer> {
  const key = typeof k === "string" ? enc.encode(k) : k;
  const ck = await crypto.subtle.importKey("raw", key, { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  return crypto.subtle.sign("HMAC", ck, enc.encode(d));
}
async function sha256Hex(d: ArrayBuffer | string): Promise<string> {
  const buf = typeof d === "string" ? enc.encode(d) : d;
  const h = await crypto.subtle.digest("SHA-256", buf);
  return Array.from(new Uint8Array(h)).map((b) => b.toString(16).padStart(2, "0")).join("");
}
function hex(b: ArrayBuffer): string {
  return Array.from(new Uint8Array(b)).map((x) => x.toString(16).padStart(2, "0")).join("");
}

export const onRequestPut: PagesFunction<Env> = async (ctx) => {
  try {
    if (!ctx.env.R2_ACCESS_KEY_ID || !ctx.env.R2_SECRET_ACCESS_KEY || !ctx.env.R2_BUCKET || !ctx.env.R2_ACCOUNT_ID) {
      return json({ ok: false, error: "R2 not configured (R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET, R2_ACCOUNT_ID)" }, 500);
    }
    const tokenStr = uploadTokenFromRequest(ctx.request);
    if (!tokenStr) return json({ ok: false, error: "Missing token" }, 401);
    const token = await verifyUploadToken(tokenStr, ctx.env.UPLOAD_TOKEN_SECRET || "");
    if (!token) return securityError(401, "invalid_upload_token", correlationId(ctx.request));

    const body = await ctx.request.arrayBuffer();
    if (body.byteLength === 0) return json({ ok: false, error: "Empty body" }, 400);
    if (body.byteLength > 25 * 1024 * 1024) return json({ ok: false, error: "File too large (25MB max)" }, 413);

    const host = `${ctx.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`;
    const r2url = `https://${host}/${ctx.env.R2_BUCKET}/${token.k.split("/").map(encodeURIComponent).join("/")}`;
    const amzDate = new Date().toISOString().replace(/[:-]|\.\d{3}/g, "");
    const dateStamp = amzDate.slice(0, 8);
    const payloadHash = await sha256Hex(body);
    const region = "auto", service = "s3";
    const canonicalUri = `/${ctx.env.R2_BUCKET}/${token.k.split("/").map(encodeURIComponent).join("/")}`;
    const canonicalHeaders = `content-type:${token.ct}\nhost:${host}\nx-amz-content-sha256:${payloadHash}\nx-amz-date:${amzDate}\n`;
    const signedHeaders = "content-type;host;x-amz-content-sha256;x-amz-date";
    const canonicalRequest = `PUT\n${canonicalUri}\n\n${canonicalHeaders}\n${signedHeaders}\n${payloadHash}`;
    const stringToSign = `AWS4-HMAC-SHA256\n${amzDate}\n${dateStamp}/${region}/${service}/aws4_request\n${await sha256Hex(canonicalRequest)}`;
    const kDate = await hmac(`AWS4${ctx.env.R2_SECRET_ACCESS_KEY}`, dateStamp);
    const kSigning = await hmac(await hmac(await hmac(kDate, region), service), "aws4_request");
    const sig = hex(await hmac(kSigning, stringToSign));
    const auth = `AWS4-HMAC-SHA256 Credential=${ctx.env.R2_ACCESS_KEY_ID}/${dateStamp}/${region}/${service}/aws4_request, SignedHeaders=${signedHeaders}, Signature=${sig}`;

    const r = await fetch(r2url, { method: "PUT", headers: { "Content-Type": token.ct, Host: host, "X-Amz-Content-SHA256": payloadHash, "X-Amz-Date": amzDate, Authorization: auth }, body: body as unknown as BodyInit });
    if (!r.ok) return securityError(502, "upstream_failed", correlationId(ctx.request));
    return json({ ok: true, key: token.k, size: body.byteLength });
  } catch {
    console.error("upload relay failed");
    return securityError(500, "request_failed", correlationId(ctx.request));
  }
};
