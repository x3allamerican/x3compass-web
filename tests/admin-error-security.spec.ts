import { expect, test } from "@playwright/test";
import { serverError } from "../functions/_shared/admin-auth";

test("admin server failures do not expose upstream details", async () => {
  const response = serverError("Stripe HTTP 500: provider-secret-detail");
  expect(response.status).toBe(500);
  const body = await response.json() as Record<string, unknown>;
  expect(body.ok).toBe(false);
  expect(body.error).toBe("request failed");
  expect(body.correlation_id).toEqual(expect.any(String));
  expect(JSON.stringify(body)).not.toContain("provider-secret-detail");
});

test("admin validation responses retain actionable client errors", async () => {
  const response = serverError("Invalid month", 400);
  expect(response.status).toBe(400);
  expect(await response.json()).toEqual({ ok: false, error: "Invalid month" });
});
