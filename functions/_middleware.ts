/** Dashboard (app.x3compass.com) serves routes at the ROOT. Back-compat: any legacy /app/* link
 *  (old bookmarks, marketing CTAs, email links) now redirects to the same path at the root. */
export const onRequest: PagesFunction = async (ctx) => {
  const url = new URL(ctx.request.url);
  if (url.pathname === "/app" || url.pathname === "/app/") return Response.redirect(`${url.origin}/`, 302);
  if (url.pathname.startsWith("/app/")) return Response.redirect(`${url.origin}${url.pathname.slice(4)}${url.search}`, 302);
  return ctx.next();
};
