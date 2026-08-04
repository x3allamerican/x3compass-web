/**
 * Scheduled Worker: every 15 minutes, POST the Pages agent dispatcher.
 * The dispatcher itself selects+fires only the agents whose next_run_at is due,
 * so 15-min granularity is plenty (no agent runs more often than that).
 */
export default {
  async scheduled(event, env, ctx) {
    const secret = env.X3_INTERNAL_SECRET;
    if (!secret) {
      console.error("X3_INTERNAL_SECRET not set — skipping dispatch");
      return;
    }
    const url = env.DISPATCH_URL || "https://x3compass.com/api/admin/dispatch";
    try {
      const r = await fetch(url, {
        method: "POST",
        headers: {
          "X-X3-Internal-Secret": secret,
          "Content-Type": "application/json",
        },
      });
      console.log(`dispatch ${url} -> HTTP ${r.status}`);
    } catch (e) {
      console.error("dispatch failed:", e && e.message ? e.message : String(e));
    }
  },
};
