import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy – NannyBooking.org",
  description: "Read the NannyBooking.org privacy policy. Learn how we handle your personal data, cookies and account information.",
  alternates: { canonical: "/privacy" },
};

export default function PrivacyLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
