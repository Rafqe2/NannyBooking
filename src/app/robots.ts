import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/profile", "/complete-profile", "/create-advertisement", "/edit-advertisement/", "/api/", "/admin/"],
    },
    sitemap: "https://nannybooking.org/sitemap.xml",
  };
}
