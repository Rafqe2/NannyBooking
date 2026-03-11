import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Support – NannyBooking.org",
  description: "Get help with NannyBooking.org. Find answers to common questions or contact our support team.",
  alternates: { canonical: "/support" },
};

export default function SupportLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
