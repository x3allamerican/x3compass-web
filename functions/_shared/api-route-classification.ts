export type ApiRouteClass = "public-or-signed" | "authenticated-user" | "admin" | "unclassified";

const PUBLIC_OR_SIGNED = new Set([
  "/api/agents/heartbeat",
  "/api/ask-demo",
  "/api/errors",
  "/api/health",
  "/api/partners/apply",
  "/api/screenings/webhook",
  "/api/stripe/webhook",
  "/api/uploads/put",
]);

const ADMIN = new Set([
  "/api/marketing",
  "/api/prospects",
  "/api/prospects/outreach",
]);

const AUTHENTICATED = new Set([
  "/api/training-records/create",
  "/api/da-tests/create",
  "/api/sso-issue",
  "/api/hos/import",
  "/api/accident-register",
  "/api/accidents/import",
  "/api/ask",
  "/api/audit/build",
  "/api/audit/pdf",
  "/api/billing/usage-reconciliation",
  "/api/clearinghouse/status",
  "/api/auth/invite",
  "/api/auth/post-signup",
  "/api/checkr/session-token",
  "/api/carrier/set-ctpa",
  "/api/compliance-calendar",
  "/api/csa/snapshots",
  "/api/dashboard",
  "/api/dataq/challenges",
  "/api/drivers/import",
  "/api/inspections/import",
  "/api/inspections/parse",
  "/api/notifications",
  "/api/scorecards",
  "/api/screenings/continuous-mvr/enroll",
  "/api/screenings/continuous-mvr/unenroll",
  "/api/screenings/continuous-mvr/list",
  "/api/screenings/mvr/parse",
  "/api/screenings/order",
  "/api/stripe/create-checkout-session",
  "/api/stripe/portal-session",
  "/api/uploads/get",
  "/api/uploads/sign",
  "/api/vehicles/import",
  "/api/vendors/list",
  "/api/vendors/motive/sync",
  "/api/vendors/samsara/sync",
  "/api/vendors/driverreach/sync",
  "/api/vendors/sambasafety/sync",
  "/api/vendors/geotab/sync",
  "/api/vendors/trimble/sync",
  "/api/vendors/omnitracs/sync",
  "/api/vendors/verizon/sync",
  "/api/vendors/tenstreet/sync",
  "/api/vendors/disa/sync",
  "/api/vendors/hireright/sync",
]);

export function classifyApiRoute(pathname: string): ApiRouteClass {
  const path = pathname.length > 1 ? pathname.replace(/\/$/, "") : pathname;
  if (path === "/api/admin" || path.startsWith("/api/admin/")) return "admin";
  if (PUBLIC_OR_SIGNED.has(path)) return "public-or-signed";
  if (ADMIN.has(path)) return "admin";
  if (AUTHENTICATED.has(path)) return "authenticated-user";
  return "unclassified";
}
