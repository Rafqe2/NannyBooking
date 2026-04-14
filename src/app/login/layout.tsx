import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sign In – NannyBooking",
  description: "Sign in to NannyBooking to manage your childcare listings, bookings and messages.",
  alternates: { canonical: "/login" },
  robots: { index: false, follow: false },
};

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
