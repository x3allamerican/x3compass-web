const encoder = new TextEncoder();
const HEX_SIGNATURE = /^[0-9a-f]{64}$/i;

function constantTimeHexEqual(left, right) {
  const a = String(left).toLowerCase();
  const b = String(right).toLowerCase();
  let difference = a.length ^ b.length;
  const length = Math.max(a.length, b.length);
  for (let index = 0; index < length; index += 1) {
    difference |= (a.charCodeAt(index) || 0) ^ (b.charCodeAt(index) || 0);
  }
  return difference === 0;
}

/** Verify Stripe's HMAC over the exact raw request body. */
export async function verifyStripeSignature(
  payload,
  signatureHeader,
  secret,
  nowSeconds = Math.floor(Date.now() / 1000),
) {
  if (!payload || !signatureHeader || !secret) return false;
  const components = String(signatureHeader).split(",").map((part) => part.trim());
  const timestampText = components.find((part) => part.startsWith("t="))?.slice(2);
  const signatures = components
    .filter((part) => part.startsWith("v1="))
    .map((part) => part.slice(3))
    .filter((value) => HEX_SIGNATURE.test(value));
  const timestamp = Number(timestampText);
  if (!Number.isSafeInteger(timestamp) || signatures.length === 0) return false;
  if (Math.abs(nowSeconds - timestamp) > 300) return false;

  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const digest = await crypto.subtle.sign(
    "HMAC",
    key,
    encoder.encode(`${timestamp}.${payload}`),
  );
  const expected = Array.from(new Uint8Array(digest), (byte) =>
    byte.toString(16).padStart(2, "0"),
  ).join("");
  return signatures.some((candidate) => constantTimeHexEqual(expected, candidate));
}
