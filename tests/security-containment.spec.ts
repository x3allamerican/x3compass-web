import { expect, test } from "@playwright/test";
import { onRequestGet as scorecards } from "../functions/api/scorecards";
import { onRequestPost as importDrivers } from "../functions/api/drivers/import";

function context(request: Request) {
  return { request, env: {}, params: {}, data: {}, waitUntil() {}, passThroughOnException() {} } as never;
}

test("scorecards fail closed without exposing tenant data", async () => {
  const response = await scorecards(context(new Request("https://x3compass.com/api/scorecards?carrier_id=00000000-0000-4000-8000-000000000001")));
  expect(response.status).toBe(503);
  expect(response.headers.get("Access-Control-Allow-Origin")).toBeNull();
  expect(await response.json()).toEqual({ ok: false, error: "temporarily unavailable" });
});

test("driver import fails closed without accepting tenant data", async () => {
  const response = await importDrivers(context(new Request("https://x3compass.com/api/drivers/import", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ carrier_id: "00000000-0000-4000-8000-000000000001", rows: [{ first_name: "Test", last_name: "Driver" }] }),
  })));
  expect(response.status).toBe(503);
  expect(response.headers.get("Access-Control-Allow-Origin")).toBeNull();
  expect(await response.json()).toEqual({ ok: false, error: "temporarily unavailable" });
});
