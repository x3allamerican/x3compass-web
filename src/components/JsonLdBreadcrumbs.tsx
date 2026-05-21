/**
 * Per-page breadcrumb structured data for Google rich snippets.
 *
 * Usage:
 *   <JsonLdBreadcrumbs items={[
 *     { name: "Home", url: "https://x3compass.com/" },
 *     { name: "Pricing", url: "https://x3compass.com/pricing/" },
 *   ]} />
 */
export type Crumb = { name: string; url: string };

export default function JsonLdBreadcrumbs({ items }: { items: Crumb[] }) {
  const data = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((c, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: c.name,
      item: c.url,
    })),
  };
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }} />;
}
