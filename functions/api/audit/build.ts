import { bearerFromRequest, supaFetch, verifySupabaseJwt } from "../../_shared/supabase-admin";
import { rateLimit } from "../../_shared/rate-limit";

interface Env {
  SUPABASE_URL?: string; SUPABASE_SERVICE_ROLE?: string;
  R2_ACCESS_KEY_ID?: string; R2_SECRET_ACCESS_KEY?: string; R2_BUCKET?: string; R2_ACCOUNT_ID?: string;
}

const json = (d: unknown, s = 200) => new Response(JSON.stringify(d), { status: s, headers: { "Content-Type": "application/json" } });

function crc32(buf: Uint8Array): number {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    c = c ^ buf[i];
    for (let j = 0; j < 8; j++) c = (c >>> 1) ^ (0xedb88320 & -(c & 1));
  }
  return (c ^ 0xffffffff) >>> 0;
}

function makeZip(entries: { name: string; content: string }[]): Uint8Array {
  const enc = new TextEncoder();
  const now = new Date();
  const date = ((now.getUTCFullYear() - 1980) << 9) | ((now.getUTCMonth() + 1) << 5) | now.getUTCDate();
  const time = (now.getUTCHours() << 11) | (now.getUTCMinutes() << 5) | Math.floor(now.getUTCSeconds() / 2);
  const items = entries.map((e) => { const data = enc.encode(e.content); return { name: e.name, data, crc: crc32(data) }; });
  const localParts: Uint8Array[] = [];
  const centralParts: Uint8Array[] = [];
  const offsets: number[] = [];
  let offset = 0;
  for (const it of items) {
    offsets.push(offset);
    const nameBuf = enc.encode(it.name);
    const local = new ArrayBuffer(30 + nameBuf.length);
    const lv = new DataView(local);
    lv.setUint32(0, 0x04034b50, true);
    lv.setUint16(4, 20, true); lv.setUint16(6, 0, true); lv.setUint16(8, 0, true);
    lv.setUint16(10, time, true); lv.setUint16(12, date, true);
    lv.setUint32(14, it.crc, true);
    lv.setUint32(18, it.data.length, true);
    lv.setUint32(22, it.data.length, true);
    lv.setUint16(26, nameBuf.length, true); lv.setUint16(28, 0, true);
    const localHdr = new Uint8Array(local); localHdr.set(nameBuf, 30);
    localParts.push(localHdr, it.data);
    offset += localHdr.length + it.data.length;

    const central = new ArrayBuffer(46 + nameBuf.length);
    const cv = new DataView(central);
    cv.setUint32(0, 0x02014b50, true);
    cv.setUint16(4, 20, true); cv.setUint16(6, 20, true);
    cv.setUint16(8, 0, true); cv.setUint16(10, 0, true);
    cv.setUint16(12, time, true); cv.setUint16(14, date, true);
    cv.setUint32(16, it.crc, true);
    cv.setUint32(20, it.data.length, true); cv.setUint32(24, it.data.length, true);
    cv.setUint16(28, nameBuf.length, true); cv.setUint16(30, 0, true); cv.setUint16(32, 0, true);
    cv.setUint16(34, 0, true); cv.setUint16(36, 0, true);
    cv.setUint32(38, 0, true);
    cv.setUint32(42, offsets[offsets.length-1], true);
    const ch = new Uint8Array(central); ch.set(nameBuf, 46);
    centralParts.push(ch);
  }
  const centralStart = offset;
  let centralSize = 0;
  for (const p of centralParts) centralSize += p.length;
  const eocd = new ArrayBuffer(22);
  const ev = new DataView(eocd);
  ev.setUint32(0, 0x06054b50, true);
  ev.setUint16(4, 0, true); ev.setUint16(6, 0, true);
  ev.setUint16(8, items.length, true); ev.setUint16(10, items.length, true);
  ev.setUint32(12, centralSize, true); ev.setUint32(16, centralStart, true);
  ev.setUint16(20, 0, true);
  const eocdBuf = new Uint8Array(eocd);
  let total = eocdBuf.length;
  for (const p of localParts) total += p.length;
  for (const p of centralParts) total += p.length;
  const out = new Uint8Array(total);
  let off = 0;
  for (const p of localParts) { out.set(p, off); off += p.length; }
  for (const p of centralParts) { out.set(p, off); off += p.length; }
  out.set(eocdBuf, off);
  return out;
}

async function r2Put(env: Env, key: string, body: Uint8Array, ct: string): Promise<{ok:boolean;detail?:string}> {
  if (!env.R2_ACCESS_KEY_ID || !env.R2_SECRET_ACCESS_KEY || !env.R2_BUCKET || !env.R2_ACCOUNT_ID) return { ok: false, detail: "R2 not configured" };
  const host = `${env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`;
  const url = `https://${host}/${env.R2_BUCKET}/${key.split("/").map(encodeURIComponent).join("/")}`;
  const enc = new TextEncoder();
  async function hmac(k: ArrayBuffer|string, d: string): Promise<ArrayBuffer> { const kk = typeof k === "string" ? enc.encode(k) : k; const ck = await crypto.subtle.importKey("raw", kk, { name: "HMAC", hash: "SHA-256" }, false, ["sign"]); return crypto.subtle.sign("HMAC", ck, enc.encode(d)); }
  async function sha256Hex(d: ArrayBuffer|Uint8Array|string): Promise<string> { const buf = typeof d === "string" ? enc.encode(d) : d; const h = await crypto.subtle.digest("SHA-256", buf as ArrayBuffer); return Array.from(new Uint8Array(h)).map((b) => b.toString(16).padStart(2,"0")).join(""); }
  const amzDate = new Date().toISOString().replace(/[:-]|\.\d{3}/g, "");
  const dateStamp = amzDate.slice(0, 8);
  const payloadHash = await sha256Hex(body);
  const canonicalUri = `/${env.R2_BUCKET}/${key.split("/").map(encodeURIComponent).join("/")}`;
  const canonicalHeaders = `content-type:${ct}\nhost:${host}\nx-amz-content-sha256:${payloadHash}\nx-amz-date:${amzDate}\n`;
  const signedHeaders = "content-type;host;x-amz-content-sha256;x-amz-date";
  const cr = `PUT\n${canonicalUri}\n\n${canonicalHeaders}\n${signedHeaders}\n${payloadHash}`;
  const sts = `AWS4-HMAC-SHA256\n${amzDate}\n${dateStamp}/auto/s3/aws4_request\n${await sha256Hex(cr)}`;
  const kDate = await hmac(`AWS4${env.R2_SECRET_ACCESS_KEY}`, dateStamp);
  const kSigning = await hmac(await hmac(await hmac(kDate, "auto"), "s3"), "aws4_request");
  const sig = Array.from(new Uint8Array(await hmac(kSigning, sts))).map((b) => b.toString(16).padStart(2,"0")).join("");
  const auth = `AWS4-HMAC-SHA256 Credential=${env.R2_ACCESS_KEY_ID}/${dateStamp}/auto/s3/aws4_request, SignedHeaders=${signedHeaders}, Signature=${sig}`;
  const r = await fetch(url, { method: "PUT", headers: { "Content-Type": ct, Host: host, "X-Amz-Content-SHA256": payloadHash, "X-Amz-Date": amzDate, Authorization: auth }, body: body as unknown as BodyInit });
  if (!r.ok) return { ok: false, detail: `R2 HTTP ${r.status}: ${(await r.text()).slice(0,200)}` };
  return { ok: true };
}

const TABLES: Array<[string,string,string]> = [
  ["carrier", "compass_carriers", "id"],
  ["drivers", "compass_drivers", "carrier_id"],
  ["vehicles", "compass_vehicles", "carrier_id"],
  ["dq_documents", "compass_dq_documents", "carrier_id"],
  ["mvr_records", "compass_mvr_records", "carrier_id"],
  ["training_records", "compass_training_records", "carrier_id"],
  ["da_tests", "compass_da_tests", "carrier_id"],
  ["accidents", "compass_accidents", "carrier_id"],
  ["inspections", "compass_inspections", "carrier_id"],
  ["ifta_filings", "compass_ifta_filings", "carrier_id"],
];

export const onRequestPost: PagesFunction<Env> = async (ctx) => {
  const _rl = rateLimit(ctx.request, { key: "audit-build", max: 10, windowSec: 300 });
  if (_rl) return _rl;

  try {
    const token = bearerFromRequest(ctx.request);
    const user = await verifySupabaseJwt(ctx.env, token);
    if (!user) return json({ ok: false, error: "Unauthorized" }, 401);

    let body: { id?: string } = {};
    try { body = await ctx.request.json(); } catch { /* ok */ }
    const exportId = body.id || new URL(ctx.request.url).searchParams.get("id") || "";
    if (!exportId) return json({ ok: false, error: "Missing export id" }, 400);

    const supa = supaFetch(ctx.env);
    const userRow = (await supa.select("compass_carrier_users", `user_id=eq.${user.id}&select=carrier_id`)) as Array<{ carrier_id: string }>;
    if (userRow.length === 0) return json({ ok: false, error: "No carrier" }, 400);
    const cid = userRow[0].carrier_id;

    const exp = (await supa.select("compass_audit_exports", `id=eq.${exportId}&select=id,carrier_id,status,date_range_start,date_range_end,scope`)) as Array<{id:string;carrier_id:string;status:string;date_range_start:string|null;date_range_end:string|null;scope:string|null}>;
    if (exp.length === 0) return json({ ok: false, error: "Export not found" }, 404);
    if (exp[0].carrier_id !== cid) return json({ ok: false, error: "Forbidden" }, 403);
    if (exp[0].status === "ready") return json({ ok: true, already: true });

    await supa.update("compass_audit_exports", `id=eq.${exportId}`, { status: "generating" });

    const entries: { name: string; content: string }[] = [];
    const counts: Record<string, number> = {};
    for (const [label, table, filterCol] of TABLES) {
      try {
        const q = filterCol === "id" ? `id=eq.${cid}&select=*` : `${filterCol}=eq.${cid}&select=*`;
        const rows = (await supa.select(table, q)) as unknown[];
        counts[label] = rows.length;
        entries.push({ name: `${label}.json`, content: JSON.stringify(rows, null, 2) });
      } catch { entries.push({ name: `${label}.json`, content: "[]" }); counts[label] = 0; }
    }
    entries.unshift({ name: "manifest.json", content: JSON.stringify({ generated_at: new Date().toISOString(), carrier_id: cid, export_id: exportId, scope: exp[0].scope || "full", date_range_start: exp[0].date_range_start, date_range_end: exp[0].date_range_end, counts, generated_by_user_id: user.id }, null, 2) });
    entries.push({ name: "README.txt", content: `X3 Compass — Audit Packet\nGenerated ${new Date().toISOString()}\nCarrier ${cid}\nExport ${exportId}\n\nEach JSON file in this ZIP is a direct dump of the corresponding compass_* table for your carrier. For DOT FMCSA Compliance Reviews, share this packet with your assigned auditor or counsel.\n` });

    const zip = makeZip(entries);
    const key = `carriers/${cid}/audit-exports/${exportId}.zip`;
    const up = await r2Put(ctx.env, key, zip, "application/zip");
    if (!up.ok) {
      await supa.update("compass_audit_exports", `id=eq.${exportId}`, { status: "failed" });
      return json({ ok: false, error: "R2 upload failed", detail: up.detail }, 502);
    }
    const packet_url = `/api/uploads/get?k=${encodeURIComponent(key)}`;
    await supa.update("compass_audit_exports", `id=eq.${exportId}`, { status: "ready", packet_url, size_bytes: zip.length, exported_on: new Date().toISOString() });
    return json({ ok: true, key, size: zip.length, packet_url, counts });
  } catch (err) {
    console.error("[audit/build] error:", err);
    return json({ ok: false, error: "Server error", detail: err instanceof Error ? err.message : String(err) }, 500);
  }
};
