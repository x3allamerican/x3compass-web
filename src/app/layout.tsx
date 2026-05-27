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
  title: { default: "X3 Compass — AI Safety Director for fleets", template: "%s · X3 Compass" },
  description: "An AI Safety Director — or a real one. Both work. 12 specialized brains, 300+ FMCSA skills, CFR-cited answers. DIY at $25/driver, DFY at $50/driver. 7-day free trial, no card.",
  keywords: ["FMCSA compliance","DOT compliance software","fleet safety","AI safety director","DataQ disputes","hazmat compliance","DQ files","CDL compliance","hours of service","driver qualification file","X3 Compass"],
  authors: [{ name: "X3 Fleet Safety LLC" }],
  alternates: { canonical: SITE },
  openGraph: {
    type: "website", locale: "en_US", url: SITE, siteName: "X3 Compass",
    title: "X3 Compass — AI Safety Director for fleets",
    description: "12 specialized brains. 300+ CFR-cited skills. The AI Safety Director for FMCSA-regulated fleets 1-100. Free 7-day trial.",
    images: [{ url: "/og-image.png", width: 1200, height: 630, alt: "X3 Compass — AI Safety Director" }],
  },
  twitter: { card: "summary_large_image", title: "X3 Compass — AI Safety Director", description: "12 brains. 300+ FMCSA skills. CFR-cited. $25/driver. Free trial.", images: ["/og-image.png"] },
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
    { "@type": "Offer", name: "DIY", price: "25", priceCurrency: "USD" },
    { "@type": "Offer", name: "DFY", price: "50", priceCurrency: "USD" },
    { "@type": "Offer", name: "Hazmat add-on", price: "99", priceCurrency: "USD" },
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
      acceptedAnswer: { "@type": "Answer", text: "X3 Compass is FMCSA-compliance software, not accounting. It tracks Driver Qualification Files, MVRs, drug & alcohol testing, IFTA filings, CSA scores, hours-of-service, and roadside inspections — with CFR citations on every answer. QuickBooks does books; X3 Compass keeps you legal." },
    },
    {
      "@type": "Question",
      name: "What does 'DIY $25/driver/month' include?",
      acceptedAnswer: { "@type": "Answer", text: "The AI Safety Director brain, 300+ CFR-cited skills, DataQ dispute drafter, Driver Qualification File generator, auto MVR pull cadence, and email support. You operate Compass yourself." },
    },
    {
      "@type": "Question",
      name: "What does DFY add beyond DIY?",
      acceptedAnswer: { "@type": "Answer", text: "Everything in DIY, plus a dedicated safety advisor, monthly compliance review call, FMCSA audit prep, we file your MVRs / drug tests / Clearinghouse queries, priority Slack + phone support, and same-day DataQ disputes. $50/driver/mo." },
    },
    {
      "@type": "Question",
      name: "Is there a free trial?",
      acceptedAnswer: { "@type": "Answer", text: "Yes — 7-day free trial, no credit card required. Cancel any time from /app/settings/billing." },
    },
    {
      "@type": "Question",
      name: "Do you support hazmat carriers?",
      acceptedAnswer: { "@type": "Answer", text: "Yes. The Hazmat add-on is $99/mo and adds 100+ Parts 100-180 skills, an interactive placard wizard, shipping paper templates, emergency response info (ERG) lookups, hazardous waste manifests, and PHMSA registration cross-reference." },
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
        {/* No-flash theme bootstrap — runs before React hydration */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('x3-theme');if(!t){t=window.matchMedia('(prefers-color-scheme: light)').matches?'light':'dark';}document.documentElement.classList.add(t);}catch(e){document.documentElement.classList.add('dark');}})();`,
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
