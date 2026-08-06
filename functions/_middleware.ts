/** Domain split: x3compass.com (+www) = marketing only; app.x3compass.com = the dashboard.
 *  There is exactly ONE way into the app — the app/auth surface always lives on app.x3compass.com. */
const APP_SURFACE = ["/app", "/signin", "/signup", "/forgot-password", "/reset-password", "/onboarding"];
const onAppSurface = (p: string) => APP_SURFACE.some((s) => p === s || p.startsWith(s + "/"));

export const onRequest: PagesFunction = async (ctx) => {
  const url = new URL(ctx.request.url);
  const host = url.hostname.toLowerCase();
  const isApp = host === "app.x3compass.com" || host.startsWith("app.");
  const isMarketing = host === "x3compass.com" || host === "www.x3compass.com";

  // Dashboard subdomain: root goes straight to the app.
  if (isApp && (url.pathname === "/" || url.pathname === "/index.html")) {
    return Response.redirect(`${url.origin}/app/`, 302);
  }
  // Marketing apex/www: the app + auth surface always redirects to the dashboard subdomain (single entry).
  if (isMarketing && onAppSurface(url.pathname)) {
    return Response.redirect(`https://app.x3compass.com${url.pathname}${url.search}`, 302);
  }
  return ctx.next();
};
