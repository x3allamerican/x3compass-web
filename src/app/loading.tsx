import { SkeletonShell } from "@/components/Skeleton";

/**
 * Next.js automatically renders this file while the /* segment streams.
 * Eliminates the perceived 1100ms TTFB cold-start by painting the page
 * scaffold immediately · Cloudflare edge still has to render the dynamic
 * page but the user never sees a blank screen.
 */
export default function AppLoading() {
  return (
    <div className="min-h-screen bg-[var(--bg)] p-6">
      <SkeletonShell kpis={5} rows={6} />
    </div>
  );
}
