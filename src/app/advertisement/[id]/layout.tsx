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
    .select("title, description, location_city, price_per_hour, type, skills")
    .eq("id", id)
    .single();

  if (!data) {
    return {
      title: "Advertisement – NannyBooking",
      description: "Find childcare services on NannyBooking",
    };
  }

  const adTypeLabel =
    data.type === "long-term" ? "Long-term childcare" : "Short-term childcare";
  const location = data.location_city ? ` in ${data.location_city}` : "";
  const price = data.price_per_hour ? ` · €${data.price_per_hour}/h` : "";
  const description =
    data.description?.slice(0, 155) ||
    `${adTypeLabel}${location}${price} – NannyBooking`;

  return {
    title: `${data.title} – NannyBooking`,
    description,
    openGraph: {
      title: `${data.title} – NannyBooking`,
      description,
      type: "website",
      siteName: "NannyBooking",
      images: [{ url: "/images/og-image.png", width: 1200, height: 630, alt: "NannyBooking" }],
    },
    twitter: {
      card: "summary_large_image",
      title: `${data.title} – NannyBooking`,
      description,
      images: ["/images/og-image.png"],
    },
    alternates: {
      canonical: `/advertisement/${id}`,
    },
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
