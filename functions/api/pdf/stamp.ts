// Stubbed in this repo. The pdf-lib endpoints live in the app project.
export const onRequest: PagesFunction = async () =>
  new Response(JSON.stringify({ ok: false, error: "Not available on the marketing site" }), {
    status: 410,
    headers: { "Content-Type": "application/json" },
  });
