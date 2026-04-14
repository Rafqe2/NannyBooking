import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "For Nannies – Post Listings & Set Your Rates | NannyBooking",
  description:
    "Join NannyBooking as a nanny. Create a free listing, set your hourly rate, choose your availability, and get booked by families in Latvia.",
  alternates: { canonical: "/for-nannies" },
  openGraph: {
    title: "For Nannies – Post Listings & Set Your Rates | NannyBooking",
    description:
      "Create a free nanny listing, set your hourly rate and availability. Reach families looking for trusted childcare in Latvia.",
    url: "https://nannybooking.org/for-nannies",
    siteName: "NannyBooking",
    images: [{ url: "/images/og-image.png", width: 1200, height: 630, alt: "NannyBooking – For Nannies" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "For Nannies – NannyBooking",
    description: "Post a free childcare listing, set your rates and get booked by families.",
    images: ["/images/og-image.png"],
  },
};

const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    {
      "@type": "Question",
      name: "Is it free to join NannyBooking as a nanny?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Yes — creating a profile and posting listings is completely free. NannyBooking charges no registration or listing fees.",
      },
    },
    {
      "@type": "Question",
      name: "How do I get paid as a nanny on NannyBooking?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "You agree on payment terms directly with the family. Most arrange cash or bank transfer. NannyBooking does not process payments.",
      },
    },
    {
      "@type": "Question",
      name: "Can I set my own hours and availability?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Absolutely. For short-term listings you pick specific dates and times. For long-term you describe general availability. You are in full control.",
      },
    },
    {
      "@type": "Question",
      name: "What if a family cancels a booking?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Families can cancel bookings before they are confirmed. Always agree on a cancellation policy with the family for confirmed bookings.",
      },
    },
    {
      "@type": "Question",
      name: "How do reviews work for nannies?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "After a completed booking, the family can leave a star rating and written review on your profile. Honest reviews help you build trust and attract more families.",
      },
    },
  ],
};

export default function ForNanniesLayout({ children }: { children: React.ReactNode }) {
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
