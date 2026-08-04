import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

function luminance(hex) {
  const channels = hex.match(/[0-9a-f]{2}/gi).map((value) => Number.parseInt(value, 16) / 255);
  const linear = channels.map((value) => value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4);
  return 0.2126 * linear[0] + 0.7152 * linear[1] + 0.0722 * linear[2];
}

function contrast(a, b) {
  const [lighter, darker] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (lighter + 0.05) / (darker + 0.05);
}

test("shared shell provides one skip target and one main landmark", async () => {
  const [layout, siteShell] = await Promise.all([read("src/app/layout.tsx"), read("src/components/SiteShell.tsx")]);
  assert.match(layout, /href="#main"/);
  assert.match(layout, /<main id="main">/);
  assert.doesNotMatch(siteShell, /<main\b|<\/main>/);
  assert.doesNotMatch(siteShell, /Skip to main content/);
});

test("light and dark semantic text tokens meet WCAG AA in the X3 palette", async () => {
  const css = await read("src/app/globals.css");
  for (const token of ["#007C9F", "#475569", "#070D18", "#FFFFFF"]) assert.match(css.toUpperCase(), new RegExp(token.toUpperCase()));
  assert.ok(contrast("#007C9F", "#FFFFFF") >= 4.5, "light-theme cyan and white");
  assert.ok(contrast("#475569", "#F4F7FA") >= 4.5, "light faint text and background");
  assert.ok(contrast("#FFFFFF", "#070D18") >= 4.5, "dark primary text and background");
  assert.ok(contrast("#16C7FF", "#070D18") >= 4.5, "dark cyan and background");
});

test("indexable pages have canonical, social, robots, and sitemap sources", async () => {
  const [layout, sitemap, robots] = await Promise.all([read("src/app/layout.tsx"), read("src/app/sitemap.ts"), read("public/robots.txt")]);
  assert.match(layout, /alternates:\s*\{ canonical:/);
  assert.match(layout, /openGraph:/);
  assert.match(layout, /twitter:/);
  assert.match(layout, /robots:/);
  assert.match(sitemap, /https:\/\/x3compass\.com/);
  for (const path of ["/app/", "/admin/", "/api/"]) assert.match(robots, new RegExp(`Disallow: ${path.replaceAll("/", "\\/")}`));
});
