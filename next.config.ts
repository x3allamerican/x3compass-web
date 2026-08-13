import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",
  images: { unoptimized: true },
  trailingSlash: true,
  // `src/lib/supabase.ts` is shared by client components but is intentionally
  // kept server-safe.  Explicitly expose only Supabase's public browser
  // values during the static export; otherwise the Cloudflare Pages artifact
  // retains `process.env.*` and the browser receives undefined values.
  env: {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  },
};

export default nextConfig;
