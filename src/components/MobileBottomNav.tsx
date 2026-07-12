"use client";

import { usePathname, useRouter } from "next/navigation";
import { Search, Calendar, MessageCircle, User } from "lucide-react";
import { useSupabaseUser } from "../lib/useSupabaseUser";
import { useNotificationCounts } from "./NotificationCountsProvider";
import { useTranslation } from "./LanguageProvider";

// Fixed bottom tab bar, shown only on small screens (<md). Desktop keeps the
// existing Header. Tabs mirror the Header's profile-tab navigation so that
// switching tabs while already on /profile updates in place (custom event)
// rather than triggering a full route change.
export default function MobileBottomNav() {
  const pathname = usePathname();
  const router = useRouter();
  const { user } = useSupabaseUser();
  const { pendingBookings, unreadMessages } = useNotificationCounts();
  const { t } = useTranslation();

  // Hide on auth / onboarding / admin screens where a tab bar would be noise.
  const hiddenPrefixes = ["/login", "/complete-profile", "/admin"];
  if (hiddenPrefixes.some((p) => pathname?.startsWith(p))) return null;

  const isOnProfilePage = pathname?.startsWith("/profile");

  const goToTab = (tab: string) => {
    if (isOnProfilePage && typeof window !== "undefined") {
      const url = new URL(window.location.href);
      url.searchParams.set("tab", tab);
      window.history.pushState({}, "", url.toString());
      window.dispatchEvent(new CustomEvent("profileTabChange", { detail: { tab } }));
    } else {
      router.push(`/profile?tab=${tab}`);
    }
  };

  const items: {
    key: string;
    label: string;
    icon: React.ReactNode;
    onClick: () => void;
    active: boolean;
    badge?: number;
    authOnly?: boolean;
  }[] = [
    {
      key: "search",
      label: t("nav.search"),
      icon: <Search className="w-5 h-5" />,
      onClick: () => router.push("/"),
      active: pathname === "/",
    },
    {
      key: "bookings",
      label: t("nav.bookings"),
      icon: <Calendar className="w-5 h-5" />,
      onClick: () => goToTab("bookings"),
      active: false,
      badge: pendingBookings,
      authOnly: true,
    },
    {
      key: "messages",
      label: t("nav.messages"),
      icon: <MessageCircle className="w-5 h-5" />,
      onClick: () => goToTab("messages"),
      active: false,
      badge: unreadMessages,
      authOnly: true,
    },
    {
      key: "profile",
      label: t("nav.profile"),
      icon: <User className="w-5 h-5" />,
      onClick: () => (user ? goToTab("profile") : router.push("/login")),
      active: false,
    },
  ];

  const visible = items.filter((i) => !i.authOnly || user);

  return (
    <nav
      className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-white/95 backdrop-blur border-t border-gray-200 pb-[env(safe-area-inset-bottom)]"
      aria-label="Primary"
    >
      <div className="flex items-stretch justify-around">
        {visible.map((item) => (
          <button
            key={item.key}
            onClick={item.onClick}
            className={`relative flex-1 flex flex-col items-center justify-center gap-0.5 py-2 text-[11px] font-medium transition-colors ${
              item.active
                ? "text-brand-600"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            <span className="relative">
              {item.icon}
              {item.badge && item.badge > 0 ? (
                <span className="absolute -top-1.5 -right-2 min-w-[16px] h-4 px-1 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center">
                  {item.badge > 9 ? "9+" : item.badge}
                </span>
              ) : null}
            </span>
            {item.label}
          </button>
        ))}
      </div>
    </nav>
  );
}
