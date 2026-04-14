import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "For Parents – Find Trusted Nannies Near You | NannyBooking",
  description:
    "Search verified nanny listings by city and dates. Read reviews, check availability and book trusted childcare for your family in Latvia.",
  alternates: { canonical: "/for-parents" },
  openGraph: {
    title: "For Parents – Find Trusted Nannies Near You | NannyBooking",
    description:
      "Browse nanny listings by city and dates. Read reviews and book trusted childcare for your family — free on NannyBooking.",
    url: "https://nannybooking.org/for-parents",
    siteName: "NannyBooking",
    images: [{ url: "/images/og-image.png", width: 1200, height: 630, alt: "NannyBooking – For Parents" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "For Parents – NannyBooking",
    description: "Find and book trusted nannies near you. Browse listings, read reviews, manage bookings.",
    images: ["/images/og-image.png"],
  },
};

const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    {
      "@type": "Question",
      name: "Is it free to use NannyBooking as a parent?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Browsing and booking are free for parents. You pay the nanny directly at the agreed rate — NannyBooking charges no commission.",
      },
    },
    {
      "@type": "Question",
      name: "How do I know a nanny is trustworthy?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Read reviews left by other families, check their skills and experience section, and always arrange a brief introductory call or meeting before the first booking.",
      },
    },
    {
      "@type": "Question",
      name: "What if the nanny cancels last minute?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "You can cancel a booking and rebook with another nanny. We recommend confirming the arrangement at least 24 hours in advance.",
      },
    },
    {
      "@type": "Question",
      name: "Can I post a listing as a parent looking for a nanny?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Yes. Post a 'seeking nanny' listing describing your needs — experienced nannies in your area can then contact you directly.",
      },
    },
    {
      "@type": "Question",
      name: "What types of childcare are available on NannyBooking?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Short-term (specific dates, e.g. a weekend) and long-term (ongoing, e.g. weekday evenings). You can filter by type when searching.",
      },
    },
  ],
};

export default function ForParentsLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
      {children}
    </>
  );
}
