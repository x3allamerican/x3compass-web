import { expect, test } from "@playwright/test";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { classifyApiRoute } from "../functions/_shared/api-route-classification";

function routeFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((entry) => {
    const path = join(dir, entry);
    return statSync(path).isDirectory() ? routeFiles(path) : path.endsWith(".ts") ? [path] : [];
  });
}

test("every API handler has an explicit security classification", () => {
  const root = join(process.cwd(), "functions/api");
  const unclassified = routeFiles(root)
    .filter((path) => !path.endsWith("_middleware.ts"))
    .map((path) => "/api/" + relative(root, path).replace(/\.ts$/, "").replace(/\/index$/, ""))
    .filter((path) => classifyApiRoute(path) === "unclassified");
  expect(unclassified).toEqual([]);
});

test("tenant and privileged routes are never public", () => {
  for (const path of [
    "/api/scorecards", "/api/accident-register", "/api/audit/pdf", "/api/billing/usage-reconciliation", "/api/clearinghouse/status", "/api/compliance-calendar", "/api/csa/snapshots", "/api/dashboard", "/api/dataq/challenges", "/api/notifications", "/api/drivers/import",
    "/api/vehicles/import", "/api/accidents/import", "/api/inspections/import", "/api/inspections/parse",
    "/api/vendors/list", "/api/screenings/order", "/api/uploads/sign",
  ]) expect(classifyApiRoute(path)).toBe("authenticated-user");

  expect(classifyApiRoute("/api/admin/partners")).toBe("admin");
});

test("only documented intake, health, telemetry, and signed callbacks are public", () => {
  for (const path of [
    "/api/health", "/api/ask-demo", "/api/errors", "/api/partners/apply",
    "/api/screenings/webhook", "/api/stripe/webhook", "/api/uploads/put",
  ]) expect(classifyApiRoute(path)).toBe("public-or-signed");
});

test("every caller-selectable tenant route invokes the shared membership guard", () => {
  const routes = [
    "accident-register.ts", "accidents/import.ts", "audit/pdf.ts", "clearinghouse/status.ts", "compliance-calendar.ts", "csa/snapshots.ts", "dashboard.ts", "dataq/challenges.ts", "drivers/import.ts", "inspections/import.ts",
    "notifications.ts", "scorecards.ts", "screenings/order.ts", "vehicles/import.ts",
    "vendors/list.ts", "vendors/motive/sync.ts", "vendors/samsara/sync.ts",
    "vendors/tenstreet/sync.ts",
  ];
  const root = join(process.cwd(), "functions/api");
  for (const route of routes) {
    expect(readFileSync(join(root, route), "utf8"), route).toContain("requireTenant");
  }
});

test("protected API handlers do not use wildcard CORS", () => {
  const root = join(process.cwd(), "functions/api");
  const offenders = routeFiles(root)
    .filter((path) => !path.endsWith("_middleware.ts"))
    .filter((path) => {
      const route = "/api/" + relative(root, path).replace(/\.ts$/, "").replace(/\/index$/, "");
      return classifyApiRoute(route) !== "public-or-signed"
        && /Access-Control-Allow-Origin[^\n]*["']\*["']/.test(readFileSync(path, "utf8"));
    })
    .map((path) => relative(root, path));
  expect(offenders).toEqual([]);
});
