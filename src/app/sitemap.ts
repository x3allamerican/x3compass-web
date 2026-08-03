import type { MetadataRoute } from "next";

const SITE = "https://x3compass.com";

// Public, indexable marketing routes. /app, /admin, /auth and API are disallowed
// in robots.txt and intentionally excluded here.
const ROUTES = [
  "", "/pricing", "/faq", "/partners", "/hazmat", "/skills", "/trust",
  "/privacy", "/terms", "/accessibility", "/cookies", "/legal", "/changelog",
  "/your-privacy-choices",
];

export const dynamic = "force-static";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  return ROUTES.map((path) => ({
    url: `${SITE}${path}/`,
    lastModified: now,
    changeFrequency: path === "" ? "weekly" : "monthly",
    priority: path === "" ? 1 : path === "/pricing" ? 0.9 : 0.6,
  }));
}
