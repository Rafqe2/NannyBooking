import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Auklite - Your Perfect Travel Companion | Baltic Region Travel",
  description:
    "Discover amazing destinations across the Baltic region and beyond with Auklite. Find the best accommodations, experiences, and travel deals in Latvia, Lithuania, Estonia, and Sweden.",
  keywords:
    "travel, Baltic region, Latvia, Lithuania, Estonia, Sweden, accommodation, experiences, booking, Auklite",
  authors: [{ name: "Auklite Team" }],
  creator: "Auklite",
  publisher: "Auklite",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL("https://auklite.lv"),
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "Auklite - Your Perfect Travel Companion",
    description:
      "Discover amazing destinations across the Baltic region and beyond with Auklite.",
    url: "https://auklite.lv",
    siteName: "Auklite",
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Auklite - Your Perfect Travel Companion",
    description:
      "Discover amazing destinations across the Baltic region and beyond with Auklite.",
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
      <body className={inter.className}>{children}</body>
    </html>
  );
}
