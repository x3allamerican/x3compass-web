import type { Metadata } from "next";
import { Inter, Playfair_Display } from "next/font/google";
import Script from "next/script";
import "./globals.css";

const inter = Inter({ variable: "--font-inter", subsets: ["latin"], weight: ["400","500","600","700","800","900"] });
const playfair = Playfair_Display({ variable: "--font-playfair", subsets: ["latin"], style: ["italic","normal"], weight: ["400","500","600","700"] });

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
  icons: { icon: "/favicon.ico", apple: "/apple-touch-icon.png" },
  robots: { index: true, follow: true, googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1 } },
};

const ORG_JSONLD = {
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

const CF_BEACON_TOKEN = process.env.NEXT_PUBLIC_CF_BEACON_TOKEN;

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${inter.variable} ${playfair.variable}`}>
      <head>
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ORG_JSONLD) }} />
      </head>
      <body>
        {children}
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
      </body>
    </html>
  );
}
