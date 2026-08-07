/** Dashboard-only build: served at the root of app.x3compass.com.
 *  Marketing lives on a separate site, so this middleware is a pass-through. */
export const onRequest: PagesFunction = async (ctx) => {
  return ctx.next();
};
