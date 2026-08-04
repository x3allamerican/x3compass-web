import { expect, test } from "@playwright/test";
import {
  authorizeTenant,
  corsHeaders,
  isUuid,
  securityError,
} from "../functions/_shared/request-security";

const CARRIER_A = "00000000-0000-4000-8000-000000000001";
const CARRIER_B = "00000000-0000-4000-8000-000000000002";

test("rejects malformed tenant ids before identity or membership queries", async () => {
  let identityCalls = 0;
  let membershipCalls = 0;
  const result = await authorizeTenant({
    token: "token",
    requestedCarrierId: "not-a-uuid",
    verifyIdentity: async () => { identityCalls++; return { id: "user-1" }; },
    loadMemberships: async () => { membershipCalls++; return [CARRIER_A]; },
  });

  expect(result).toEqual({ ok: false, status: 400, code: "invalid_tenant_id" });
  expect(identityCalls).toBe(0);
  expect(membershipCalls).toBe(0);
});

test("rejects unauthenticated tenant access without loading memberships", async () => {
  let membershipCalls = 0;
  const result = await authorizeTenant({
    token: "bad-token",
    requestedCarrierId: CARRIER_A,
    verifyIdentity: async () => null,
    loadMemberships: async () => { membershipCalls++; return [CARRIER_A]; },
  });

  expect(result).toEqual({ ok: false, status: 401, code: "unauthorized" });
  expect(membershipCalls).toBe(0);
});

test("rejects a cross-tenant assertion", async () => {
  const result = await authorizeTenant({
    token: "token",
    requestedCarrierId: CARRIER_B,
    verifyIdentity: async () => ({ id: "user-1" }),
    loadMemberships: async () => [CARRIER_A],
  });

  expect(result).toEqual({ ok: false, status: 403, code: "tenant_forbidden" });
});

test("derives tenant authority from membership", async () => {
  const result = await authorizeTenant({
    token: "token",
    requestedCarrierId: CARRIER_A,
    verifyIdentity: async () => ({ id: "user-1" }),
    loadMemberships: async () => [CARRIER_A],
  });

  expect(result).toEqual({ ok: true, userId: "user-1", carrierId: CARRIER_A });
});

test("CORS reflects only an exact allowlisted app origin", () => {
  const env = { APP_ALLOWED_ORIGINS: "https://x3compass.com,https://app.x3compass.com" };
  const allowed = corsHeaders(new Request("https://api.example.test", { headers: { Origin: "https://app.x3compass.com" } }), env);
  const denied = corsHeaders(new Request("https://api.example.test", { headers: { Origin: "https://evil.example" } }), env);

  expect(allowed.get("Access-Control-Allow-Origin")).toBe("https://app.x3compass.com");
  expect(allowed.get("Vary")).toBe("Origin");
  expect(denied.get("Access-Control-Allow-Origin")).toBeNull();
  expect(denied.get("Vary")).toBe("Origin");
});

test("security errors are opaque and carry a correlation id", async () => {
  const response = securityError(403, "tenant_forbidden", "correlation-123");
  expect(response.status).toBe(403);
  expect(await response.json()).toEqual({
    ok: false,
    error: "request denied",
    code: "tenant_forbidden",
    correlation_id: "correlation-123",
  });
});

test("UUID validation accepts canonical UUIDs only", () => {
  expect(isUuid(CARRIER_A)).toBe(true);
  expect(isUuid("00000000-0000-0000-0000-000000000001")).toBe(false);
  expect(isUuid(`${CARRIER_A}&or=(id.neq.null)`)).toBe(false);
});
