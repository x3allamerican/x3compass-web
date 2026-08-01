/* Overlay the family-shell homepage onto the Next static export.
 *
 * x3compass.com is the only site in the X3 family that was built in Next.js;
 * every sibling (x3csa, x3legal, …) is static HTML sharing the family shell.
 * That is why Compass had no blue banners, no family footer, no concierge
 * bubble and its own colour system.
 *
 * This step replaces the exported homepage with the family-shell version and
 * copies the shared assets alongside it. Every other route (/pricing, /faq,
 * /partners, …) still comes from Next until it is ported too.
 */
import { cp, readdir, stat } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";

const root = process.cwd();
const src = path.join(root, "family");
const out = path.join(root, "out");

if (!existsSync(out)) { console.error("apply-family-shell: out/ missing — run next build first"); process.exit(1); }
if (!existsSync(src)) { console.error("apply-family-shell: family/ missing"); process.exit(1); }

await cp(src, out, { recursive: true, force: true });

const check = ["index.html", "img/logo.png", "assets/x3c.css", "assets/x3concierge.js"];
let bad = 0;
for (const f of check) {
  const p = path.join(out, f);
  if (!existsSync(p)) { console.error(`  MISSING  ${f}`); bad++; continue; }
  const { size } = await stat(p);
  console.log(`  ok  ${f.padEnd(28)} ${size} bytes`);
}
if (bad) process.exit(1);
console.log("apply-family-shell: homepage now on the X3 family shell");
