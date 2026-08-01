import type { Metadata } from "next";
import { Inter, Playfair_Display } from "next/font/google";
import Script from "next/script";
import CookieBanner from "@/components/CookieBanner";
import { ThemeProvider } from "@/components/ThemeProvider";
import "./globals.css";

// Font subset trim (Sprint #21 follow-up): Inter 6→3, Playfair 8→2 → ~120KB removed
const inter = Inter({ variable: "--font-inter", subsets: ["latin"], weight: ["400","600","800"], display: "swap" });
const playfair = Playfair_Display({ variable: "--font-playfair", subsets: ["latin"], style: ["italic"], weight: ["600"], display: "swap" });

const SITE = process.env.NEXT_PUBLIC_SITE_URL || "https://x3compass.com";

export const metadata: Metadata = {
  metadataBase: new URL(SITE),
  title: { default: "X3 Compass · AI Safety Director for fleets", template: "%s · X3 Compass" },
  description: "An AI Safety Director · or a real one. Both work. 12 specialized brains, 300+ FMCSA skills, CFR-cited answers. Graduated per-driver pricing from $50/driver down to $25. 7-day free trial, no card.",
  keywords: ["FMCSA compliance","DOT compliance software","fleet safety","AI safety director","DataQ disputes","hazmat compliance","DQ files","CDL compliance","hours of service","driver qualification file","X3 Compass"],
  authors: [{ name: "X3 Fleet Safety LLC" }],
  alternates: { canonical: SITE },
  openGraph: {
    type: "website", locale: "en_US", url: SITE, siteName: "X3 Compass",
    title: "X3 Compass · AI Safety Director for fleets",
    description: "12 specialized brains. 300+ CFR-cited skills. The AI Safety Director for FMCSA-regulated fleets 1-100. Free 7-day trial.",
    images: [{ url: "/og-image.png", width: 1200, height: 630, alt: "X3 Compass · AI Safety Director" }],
  },
  twitter: { card: "summary_large_image", title: "X3 Compass · AI Safety Director", description: "12 brains. 300+ FMCSA skills. CFR-cited. From $50/driver, graduated. Free trial.", images: ["/og-image.png"] },
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/favicon-16.png", type: "image/png", sizes: "16x16" },
      { url: "/favicon-32.png", type: "image/png", sizes: "32x32" },
      { url: "/icon-512.png", type: "image/png", sizes: "512x512" },
    ],
    apple: "/apple-touch-icon.png",
  },
  robots: { index: true, follow: true, googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1 } },
};

const SOFTWARE_JSONLD = {
  "@context": "https://schema.org", "@type": "SoftwareApplication",
  name: "X3 Compass", applicationCategory: "BusinessApplication", operatingSystem: "Web", url: SITE,
  description: "AI-powered DOT compliance platform for FMCSA-regulated motor carriers.",
  offers: [
    {
      "@type": "AggregateOffer",
      name: "X3 Compass · graduated per-driver",
      priceCurrency: "USD",
      lowPrice: "25",
      highPrice: "50",
      offerCount: 4,
      description: "Graduated per-driver pricing. $50/driver for drivers 1-50, $40 for 51-75, $30 for 76-100, $25 for 101+. $100/mo minimum.",
    },
  ],
  provider: { "@type": "Organization", name: "X3 Fleet Safety LLC", url: SITE, contactPoint: { "@type": "ContactPoint", contactType: "customer support", email: "support@x3compass.com" } },
};

const ORGANIZATION_JSONLD = {
  "@context": "https://schema.org", "@type": "Organization",
  name: "X3 Fleet Safety LLC",
  legalName: "X3 Fleet Safety LLC",
  url: SITE,
  logo: `${SITE}/og-image.png`,
  foundingDate: "2024-01-01",
  founder: {
    "@type": "Person",
    name: "Joshua Kovarik",
    jobTitle: "Founder & CEO",
    url: SITE,
    sameAs: ["https://github.com/joshuakovarik"],
  },
  sameAs: [
    "https://github.com/x3fleetsafety",
    "https://github.com/x3fleetsafety/skills",
  ],
  contactPoint: [{
    "@type": "ContactPoint",
    contactType: "customer support",
    email: "support@x3compass.com",
    availableLanguage: "en",
  }, {
    "@type": "ContactPoint",
    contactType: "security",
    email: "security@x3compass.com",
    availableLanguage: "en",
  }],
};

const WEBSITE_JSONLD = {
  "@context": "https://schema.org", "@type": "WebSite",
  name: "X3 Compass",
  url: SITE,
  publisher: { "@type": "Organization", name: "X3 Fleet Safety LLC" },
};

const FAQ_JSONLD = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    {
      "@type": "Question",
      name: "How is X3 Compass different from QuickBooks for fleets?",
      acceptedAnswer: { "@type": "Answer", text: "X3 Compass is FMCSA-compliance software, not accounting. It tracks Driver Qualification Files, MVRs, drug & alcohol testing, IFTA filings, CSA scores, hours-of-service, and roadside inspections · with CFR citations on every answer. QuickBooks does books; X3 Compass keeps you legal." },
    },
    {
      "@type": "Question",
      name: "How much does X3 Compass cost?",
      acceptedAnswer: { "@type": "Answer", text: "One graduated plan: $50/driver/mo for drivers 1–50, $40 for 51–75, $30 for 76–100, and $25 for 101+. Each rate applies only to the drivers in that band, so a 100-driver fleet pays $4,250/mo — not 100 × $30. $100/mo minimum. Every X3 product is included." },
    },
    {
      "@type": "Question",
      name: "Do I lose features at the lower per-driver rates?",
      acceptedAnswer: { "@type": "Answer", text: "No. Every X3 product is included at every fleet size — the AI Safety Director, CFR-cited skills, DataQ drafter, DQ file generator, MVR cadence, dedicated safety advisor and audit prep. Only the per-driver rate changes as you grow." },
    },
    {
      "@type": "Question",
      name: "Is there a free trial?",
      acceptedAnswer: { "@type": "Answer", text: "Yes · 7-day free trial, no credit card required. Cancel any time from /app/settings/billing." },
    },
    {
      "@type": "Question",
      name: "Do you support hazmat carriers?",
      acceptedAnswer: { "@type": "Answer", text: "Yes, and it is included in the plan at no extra cost. The Hazmat Center adds 100+ Parts 100-180 skills, an interactive placard wizard, shipping paper templates, emergency response info (ERG) lookups, hazardous waste manifests, and PHMSA registration cross-reference." },
    },
  ],
};

const CF_BEACON_TOKEN = process.env.NEXT_PUBLIC_CF_BEACON_TOKEN;

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${inter.variable} ${playfair.variable}`}>
      <head>
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(SOFTWARE_JSONLD) }} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ORGANIZATION_JSONLD) }} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(WEBSITE_JSONLD) }} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(FAQ_JSONLD) }} />
        {/* No-flash theme bootstrap · runs before React hydration.
            DARK BY DEFAULT — if no saved theme, use dark (not system pref).
            Keeps the Bugatti aesthetic without touching the DOM beyond a single
            class on <html>. Prior version added a data-* attribute + path
            branching which appears to have caused a Hazmat page reload loop;
            this is the minimum-touch version. */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('x3-theme');if(!t){t='dark';}document.documentElement.classList.add(t);}catch(e){document.documentElement.classList.add('dark');}})();`,
          }}
        />
      </head>
      <body>
        <ThemeProvider>
        <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[200] focus:px-4 focus:py-2 focus:rounded-lg focus:bg-[var(--accent)] focus:text-[var(--bg)] focus:font-bold focus:text-[13px] focus:shadow-lg">Skip to main content</a>
        <main id="main">{children}</main>
        <CookieBanner />
        <Script id="x3-error-capture" strategy="afterInteractive">{`
          (function(){
            var sent = 0;
            function send(payload){
              if(sent > 10) return; sent++;
              try {
                fetch('/api/errors', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify(payload),
                  keepalive: true,
                }).catch(function(){});
              } catch(e){}
            }
            window.addEventListener('error', function(ev){
              send({
                message: String(ev.message||''),
                source: String(ev.filename||''),
                line: ev.lineno||0, col: ev.colno||0,
                stack: ev.error && ev.error.stack ? String(ev.error.stack) : '',
                url: location.href,
                user_agent: navigator.userAgent,
              });
            });
            window.addEventListener('unhandledrejection', function(ev){
              var r = ev.reason || {};
              send({
                message: 'unhandledrejection: ' + (r.message || String(r)),
                stack: r.stack ? String(r.stack) : '',
                url: location.href,
                user_agent: navigator.userAgent,
              });
            });
          })();
        `}</Script>
        {CF_BEACON_TOKEN && (
          <Script src="https://static.cloudflareinsights.com/beacon.min.js"
            data-cf-beacon={`{"token": "${CF_BEACON_TOKEN}"}`}
            strategy="afterInteractive" />
        )}
      </ThemeProvider>
      </body>
    </html>
  );
}
