/**
 * axe-core accessibility probes — runs against production on every push
 * + on the 15-min journey-probes cron. Asserts every critical/serious
 * a11y violation is zero on the high-traffic public pages.
 */
import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

const PROD = process.env.PW_BASE_URL || "https://x3compass-web.pages.dev";

const PAGES = ["/", "/pricing/", "/hazmat/", "/trust/", "/security/", "/blog/", "/faq/", "/case-studies/sample/", "/help/", "/docs/"];

for (const path of PAGES) {
  test(`accessibility — ${path} has zero critical+serious violations`, async ({ page }) => {
    await page.goto(`${PROD}${path}`);
    const results = await new AxeBuilder({ page })
      .include("main, header, footer")
      .options({ runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"] } })
      .analyze();

    const blocker = results.violations.filter((v) =>
      v.impact === "critical" || v.impact === "serious"
    );

    if (blocker.length > 0) {
      console.log(`${path} violations:`);
      for (const v of blocker) {
        console.log(`  [${v.impact}] ${v.id}: ${v.help}`);
        for (const n of v.nodes.slice(0, 3)) {
          console.log(`    - ${n.target.join(" ")}`);
        }
      }
    }
    expect(blocker, `${path} has ${blocker.length} critical/serious a11y violations`).toEqual([]);
  });
}
