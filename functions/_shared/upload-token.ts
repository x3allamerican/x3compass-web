import { isUuid } from "./request-security";

export interface UploadTokenPayload {
  k: string;
  ct: string;
  exp: number;
  uid: string;
  cid: string;
}

const encoder = new TextEncoder();

async function signature(value: string, secret: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const bytes = await crypto.subtle.sign("HMAC", key, encoder.encode(value));
  return Array.from(new Uint8Array(bytes), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

function sameSignature(left: string, right: string): boolean {
  if (left.length !== right.length) return false;
  let difference = 0;
  for (let index = 0; index < left.length; index++) difference |= left.charCodeAt(index) ^ right.charCodeAt(index);
  return difference === 0;
}

function validPayload(value: unknown, now: number): value is UploadTokenPayload {
  if (!value || typeof value !== "object") return false;
  const item = value as Partial<UploadTokenPayload>;
  return typeof item.k === "string"
    && typeof item.ct === "string"
    && typeof item.exp === "number"
    && item.exp >= now
    && typeof item.uid === "string"
    && item.uid.length > 0
    && isUuid(item.cid)
    && item.k.startsWith(`carriers/${item.cid}/`)
    && !item.k.includes("..")
    && item.k.length <= 512;
}

export async function issueUploadToken(payload: UploadTokenPayload, secret: string): Promise<string> {
  if (!secret || !validPayload(payload, 0)) throw new Error("Invalid upload token input");
  const encoded = btoa(JSON.stringify(payload));
  return `${encoded}.${await signature(encoded, secret)}`;
}

export async function verifyUploadToken(token: string, secret: string, now = Math.floor(Date.now() / 1000)): Promise<UploadTokenPayload | null> {
  if (!secret) return null;
  const [encoded, supplied, extra] = token.split(".");
  if (!encoded || !supplied || extra) return null;
  const expected = await signature(encoded, secret);
  if (!sameSignature(supplied, expected)) return null;
  try {
    const payload: unknown = JSON.parse(atob(encoded));
    return validPayload(payload, now) ? payload : null;
  } catch {
    return null;
  }
}
