import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service – NannyBooking.org",
  description: "Read the NannyBooking.org terms of service. Understand the rules for using the platform as a parent or nanny.",
  alternates: { canonical: "/terms" },
};

export default function TermsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
