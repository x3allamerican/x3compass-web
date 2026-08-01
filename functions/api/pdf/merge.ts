// Stubbed in this repo. The pdf-lib endpoints live in the app project.
// This stub exists so the marketing site (x3compass-web) builds without bundling pdf-lib.
export const onRequest: PagesFunction = async () =>
  new Response(JSON.stringify({ ok: false, error: "Not available on the marketing site" }), {
    status: 410,
    headers: { "Content-Type": "application/json" },
  });
