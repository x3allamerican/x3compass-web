import type { MetadataRoute } from "next";

export const dynamic = "force-static";
export const revalidate = false;

const SITE = process.env.NEXT_PUBLIC_SITE_URL || "https://x3compass.com";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  return [
    { url: `${SITE}/`, lastModified: now, changeFrequency: "weekly", priority: 1.0 },
    { url: `${SITE}/pricing`, lastModified: now, changeFrequency: "weekly", priority: 0.9 },
    { url: `${SITE}/faq`, lastModified: now, changeFrequency: "monthly", priority: 0.6 },
    { url: `${SITE}/hazmat`, lastModified: now, changeFrequency: "monthly", priority: 0.8 },
    { url: `${SITE}/partners`, lastModified: now, changeFrequency: "monthly", priority: 0.7 },
    { url: `${SITE}/skills`, lastModified: now, changeFrequency: "weekly", priority: 0.8 },
    { url: `${SITE}/signup`, lastModified: now, changeFrequency: "monthly", priority: 0.7 },
    { url: `${SITE}/signin`, lastModified: now, changeFrequency: "monthly", priority: 0.5 },
  ];
}
