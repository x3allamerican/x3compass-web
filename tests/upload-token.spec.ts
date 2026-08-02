import { expect, test } from "@playwright/test";
import { issueUploadToken, verifyUploadToken } from "../functions/_shared/upload-token";

const secret = "test-secret-with-sufficient-entropy";
const payload = {
  k: "carriers/00000000-0000-4000-8000-000000000001/dq/file.pdf",
  ct: "application/pdf",
  exp: 4_102_444_800,
  uid: "user-1",
  cid: "00000000-0000-4000-8000-000000000001",
};

test("accepts an authentic unexpired upload token", async () => {
  const token = await issueUploadToken(payload, secret);
  await expect(verifyUploadToken(token, secret, 1_700_000_000)).resolves.toEqual(payload);
});

test("rejects a token whose tenant object path was altered", async () => {
  const token = await issueUploadToken(payload, secret);
  const [encoded, signature] = token.split(".");
  const decoded = JSON.parse(atob(encoded));
  decoded.k = "carriers/00000000-0000-4000-8000-000000000002/dq/file.pdf";
  const tampered = `${btoa(JSON.stringify(decoded))}.${signature}`;
  await expect(verifyUploadToken(tampered, secret, 1_700_000_000)).resolves.toBeNull();
});

test("rejects expired and malformed upload tokens", async () => {
  const token = await issueUploadToken({ ...payload, exp: 100 }, secret);
  await expect(verifyUploadToken(token, secret, 101)).resolves.toBeNull();
  await expect(verifyUploadToken("not-a-token", secret, 1)).resolves.toBeNull();
});
