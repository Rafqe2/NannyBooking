import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import ErrorBoundary from "../components/ErrorBoundary";
import { LanguageProvider } from "../components/LanguageProvider";
import CookieConsent from "../components/CookieConsent";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "NannyBooking.lv – Parents meet trusted nannies",
  description:
    "NannyBooking.lv connects parents with trusted, verified nannies. Create or discover childcare ads, manage availability, and book care with confidence.",
  keywords:
    "childcare, nanny, babysitting, parents, bookings, availability, Latvia, Lithuania, Estonia, Sweden",
  authors: [{ name: "NannyBooking.lv Team" }],
  creator: "NannyBooking.lv",
  publisher: "NannyBooking.lv",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL("https://NannyBooking.lv"),
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "NannyBooking.lv – Parents meet trusted nannies",
    description:
      "Find trusted nannies or families. Manage childcare ads, availability and bookings in one place.",
    url: "https://NannyBooking.lv",
    siteName: "NannyBooking.lv",
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "NannyBooking.lv – Parents meet trusted nannies",
    description: "Find trusted childcare, list services, and manage bookings.",
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

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="theme-color" content="#fffEE0" />
      </head>
      <body className={inter.className}>
        <LanguageProvider>
          <ErrorBoundary>{children}</ErrorBoundary>
          <CookieConsent />
        </LanguageProvider>
      </body>
    </html>
  );
}
