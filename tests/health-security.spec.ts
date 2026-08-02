import { expect, test } from "@playwright/test";
import { onRequestGet } from "../functions/api/health";

test("public health responses do not expose dependency details", async () => {
  const response = await onRequestGet({ env: {} } as never);
  expect(response.status).toBe(503);

  const body = await response.json() as Record<string, unknown>;
  expect(body.ok).toBe(false);
  expect(body.status).toBe("degraded");
  expect(body).not.toHaveProperty("services");
  expect(body).not.toHaveProperty("total_ms");
  expect(JSON.stringify(body)).not.toContain("SUPABASE");
  expect(JSON.stringify(body)).not.toContain("STRIPE");
  expect(response.headers.get("cache-control")).toBe("no-store");
});
