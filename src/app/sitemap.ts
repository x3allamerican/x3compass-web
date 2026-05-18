import type { MetadataRoute } from "next";

export const dynamic = "force-static";
export const revalidate = false;

const SITE = process.env.NEXT_PUBLIC_SITE_URL || "https://x3compass.com";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  return [
    { url: `${SITE}/`,                          lastModified: now, changeFrequency: "weekly",  priority: 1.0 },
    { url: `${SITE}/pricing`,                   lastModified: now, changeFrequency: "weekly",  priority: 0.9 },
    { url: `${SITE}/hazmat`,                    lastModified: now, changeFrequency: "monthly", priority: 0.8 },
    { url: `${SITE}/skills`,                    lastModified: now, changeFrequency: "weekly",  priority: 0.8 },
    { url: `${SITE}/partners`,                  lastModified: now, changeFrequency: "monthly", priority: 0.7 },
    { url: `${SITE}/case-studies/sample`,       lastModified: now, changeFrequency: "monthly", priority: 0.8 },
    { url: `${SITE}/security`,                  lastModified: now, changeFrequency: "monthly", priority: 0.7 },
    { url: `${SITE}/security/soc2`,             lastModified: now, changeFrequency: "monthly", priority: 0.6 },
    { url: `${SITE}/trust`,                     lastModified: now, changeFrequency: "monthly", priority: 0.7 },
    { url: `${SITE}/changelog`,                 lastModified: now, changeFrequency: "weekly",  priority: 0.7 },
    { url: `${SITE}/blog`,                      lastModified: now, changeFrequency: "weekly",  priority: 0.7 },
    { url: `${SITE}/blog/cfr-accuracy-baseline`,lastModified: now, changeFrequency: "monthly", priority: 0.7 },
    { url: `${SITE}/help`,                      lastModified: now, changeFrequency: "monthly", priority: 0.6 },
    { url: `${SITE}/ask`,                       lastModified: now, changeFrequency: "monthly", priority: 0.8 },
    { url: `${SITE}/docs`,                      lastModified: now, changeFrequency: "monthly", priority: 0.6 },
    { url: `${SITE}/docs/getting-started`,      lastModified: now, changeFrequency: "monthly", priority: 0.6 },
    { url: `${SITE}/docs/api`,                  lastModified: now, changeFrequency: "monthly", priority: 0.6 },
    { url: `${SITE}/docs/integrations`,         lastModified: now, changeFrequency: "monthly", priority: 0.6 },
    { url: `${SITE}/faq`,                       lastModified: now, changeFrequency: "monthly", priority: 0.6 },
    { url: `${SITE}/signup`,                    lastModified: now, changeFrequency: "monthly", priority: 0.7 },
    { url: `${SITE}/signin`,                    lastModified: now, changeFrequency: "monthly", priority: 0.5 },
  ];
}
