/** Root middleware: route the dashboard subdomain (app.x3compass.com) straight to /app,
 *  while the apex (x3compass.com) keeps its marketing homepage at /. Everything else passes through. */
export const onRequest: PagesFunction = async (ctx) => {
  const url = new URL(ctx.request.url);
  const host = url.hostname.toLowerCase();
  const isAppHost = host === "app.x3compass.com" || host.startsWith("app.");
  if (isAppHost && (url.pathname === "/" || url.pathname === "/index.html")) {
    return Response.redirect(`${url.origin}/app/`, 302);
  }
  return ctx.next();
};
