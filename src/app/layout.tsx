import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import ErrorBoundary from "../components/ErrorBoundary";
import { LanguageProvider } from "../components/LanguageProvider";
import { NotificationCountsProvider } from "../components/NotificationCountsProvider";
import CookieConsent from "../components/CookieConsent";
import ScrollToTop from "../components/ScrollToTop";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "NannyBooking – Parents meet trusted nannies",
  description:
    "NannyBooking connects parents with trusted, verified nannies. Create or discover childcare ads, manage availability, and book care with confidence.",
  keywords:
    "childcare, nanny, babysitting, parents, bookings, availability, Latvia, Lithuania, Estonia, Sweden",
  authors: [{ name: "NannyBooking Team" }],
  creator: "NannyBooking",
  publisher: "NannyBooking",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL("https://nannybooking.org"),
  alternates: { canonical: "/" },
  openGraph: {
    title: "NannyBooking – Parents meet trusted nannies",
    description:
      "Find trusted nannies or families. Manage childcare ads, availability and bookings in one place.",
    url: "https://nannybooking.org",
    siteName: "NannyBooking",
    locale: "en_US",
    type: "website",
    images: [{ url: "/images/og-image.png", width: 1200, height: 630, alt: "NannyBooking" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "NannyBooking – Parents meet trusted nannies",
    description: "Find trusted childcare, list services, and manage bookings.",
    images: ["/images/og-image.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

const GA_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" type="image/png" sizes="32x32" href="/icons/favicon-32.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/icons/favicon-16.png" />
        <link rel="apple-touch-icon" sizes="180x180" href="/icons/apple-touch-icon.png" />
        <link rel="manifest" href="/manifest.json" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="theme-color" content="#0F3D2E" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Organization",
              name: "NannyBooking",
              url: "https://nannybooking.org",
              logo: {
                "@type": "ImageObject",
                url: "https://nannybooking.org/images/og-image.png",
                width: 1200,
                height: 630,
              },
              description: "NannyBooking connects parents with trusted nannies in Latvia. Find childcare, post listings, and manage bookings.",
              areaServed: { "@type": "Country", name: "Latvia" },
              contactPoint: {
                "@type": "ContactPoint",
                contactType: "customer support",
                url: "https://nannybooking.org/support",
              },
            }),
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebSite",
              name: "NannyBooking",
              url: "https://nannybooking.org",
              description: "Find trusted nannies or post childcare listings in Latvia.",
              potentialAction: {
                "@type": "SearchAction",
                target: {
                  "@type": "EntryPoint",
                  urlTemplate: "https://nannybooking.org/?q={search_term_string}",
                },
                "query-input": "required name=search_term_string",
              },
            }),
          }}
        />
        {GA_ID && (
          <>
            {/* Consent Mode v2: set default to DENIED before GA loads. CookieConsent.tsx flips this to granted when user accepts. */}
            <script
              dangerouslySetInnerHTML={{
                __html: `
                  window.dataLayer = window.dataLayer || [];
                  function gtag(){dataLayer.push(arguments);}
                  var c = { analytics_storage: 'denied', ad_storage: 'denied', ad_user_data: 'denied', ad_personalization: 'denied' };
                  try {
                    var s = localStorage.getItem('cookie_consent');
                    if (s) {
                      var p = JSON.parse(s);
                      if (p.analytics) c.analytics_storage = 'granted';
                      if (p.marketing) { c.ad_storage = 'granted'; c.ad_user_data = 'granted'; c.ad_personalization = 'granted'; }
                    }
                  } catch(e){}
                  gtag('consent', 'default', c);
                  gtag('js', new Date());
                  gtag('config', '${GA_ID}');
                `,
              }}
            />
            <script
              async
              src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
            />
          </>
        )}
      </head>
      <body className={inter.className}>
        <LanguageProvider>
          <NotificationCountsProvider>
            <ErrorBoundary>{children}</ErrorBoundary>
            <CookieConsent />
            <ScrollToTop />
          </NotificationCountsProvider>
        </LanguageProvider>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
