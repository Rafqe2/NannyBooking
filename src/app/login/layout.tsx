import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sign In – NannyBooking.org",
  description: "Sign in to NannyBooking.org to manage your childcare listings, bookings and messages.",
  alternates: { canonical: "/login" },
  robots: { index: false, follow: false },
};

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
