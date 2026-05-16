import type { Metadata } from "next";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const baseUrl = "https://nannybooking.org";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;

  const supabase = createClient(supabaseUrl, supabaseKey);
  const { data } = await supabase
    .from("advertisements")
    .select("title, description, location_city, price_per_hour, type, skills, is_active")
    .eq("id", id)
    .single();

  if (!data) {
    return {
      title: "Advertisement – NannyBooking",
      description: "Find childcare services on NannyBooking",
    };
  }

  const adTypeLabel =
    data.type === "long-term" ? "Long-term nanny" : "Short-term babysitter";
  const location = data.location_city ? ` in ${data.location_city}` : "";
  const price = data.price_per_hour ? ` · €${data.price_per_hour}/h` : "";

  // SEO-friendly title: surface adTypeLabel + location + price ahead of free-text title.
  // e.g. "Short-term babysitter in Riga · €8/h – Sarah's profile | NannyBooking"
  const titleParts = [`${adTypeLabel}${location}${price}`, data.title].filter(Boolean);
  const pageTitle = `${titleParts.join(" – ")} | NannyBooking`;

  const description =
    data.description?.slice(0, 155) ||
    `${adTypeLabel}${location}${price}. Available now on NannyBooking.`;

  return {
    title: pageTitle,
    description,
    openGraph: {
      title: pageTitle,
      description,
      type: "website",
      siteName: "NannyBooking",
      images: [{ url: "/images/og-image.png", width: 1200, height: 630, alt: "NannyBooking" }],
    },
    twitter: {
      card: "summary_large_image",
      title: pageTitle,
      description,
      images: ["/images/og-image.png"],
    },
    alternates: { canonical: `/advertisement/${id}` },
    // Don't index inactive ads — they 404-ish from the user's perspective
    robots: data.is_active ? undefined : { index: false, follow: false },
  };
}

export default async function AdLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = createClient(supabaseUrl, supabaseKey);
  const { data } = await supabase
    .from("advertisements")
    .select("title, description, location_city, price_per_hour, type")
    .eq("id", id)
    .single();

  const jsonLd = data
    ? {
        "@context": "https://schema.org",
        "@type": "Service",
        name: data.title,
        description: data.description?.slice(0, 300) || "",
        url: `${baseUrl}/advertisement/${id}`,
        provider: {
          "@type": "Organization",
          name: "NannyBooking",
          url: baseUrl,
        },
        areaServed: data.location_city
          ? { "@type": "City", name: data.location_city }
          : { "@type": "Country", name: "Latvia" },
        offers: {
          "@type": "Offer",
          price: data.price_per_hour,
          priceCurrency: "EUR",
          availability: "https://schema.org/InStock",
        },
        serviceType: data.type === "long-term" ? "Long-term childcare" : "Short-term childcare",
      }
    : null;

  return (
    <>
      {jsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      )}
      {children}
    </>
  );
}
