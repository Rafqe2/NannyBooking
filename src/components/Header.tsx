"use client";

import { useState, useRef, useCallback, useEffect, useMemo } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { supabase } from "../lib/supabase";
import { useSupabaseUser } from "../lib/useSupabaseUser";
import { useTranslation } from "./LanguageProvider";
import { LANGUAGES } from "../lib/i18n";
import { MessageService } from "../lib/messageService";

export default function Header() {
  const { user, isLoading } = useSupabaseUser();
  const { language, setLanguage, t } = useTranslation();
  const router = useRouter();
  const pathname = usePathname();
  const [pendingCount, setPendingCount] = useState<number>(0);
  const [unreadMessages, setUnreadMessages] = useState<number>(0);
  const isOnProfilePage = pathname === "/profile";

  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        if (!user?.id) {
          if (active) { setPendingCount(0); setUnreadMessages(0); }
          return;
        }
        const [bookingRes, msgCount] = await Promise.all([
          supabase.rpc("get_pending_booking_count_for_me"),
          MessageService.getUnreadCount(),
        ]);
        if (!active) return;
        setPendingCount(bookingRes.error ? 0 : Number(bookingRes.data || 0));
        setUnreadMessages(msgCount);
      } catch {
        if (active) { setPendingCount(0); setUnreadMessages(0); }
      }
    };
    load();
    const id = setInterval(load, 30000);
    return () => {
      active = false;
      clearInterval(id);
    };
  }, [user?.id]);

  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    if (!user?.id) { setIsAdmin(false); return; }
    supabase
      .from("users")
      .select("user_type")
      .eq("id", user.id)
      .single()
      .then(({ data }) => setIsAdmin(data?.user_type === "admin"));
  }, [user?.id]);

  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showLanguageMenu, setShowLanguageMenu] = useState(false);
  const langCloseTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const userRef = useRef<HTMLDivElement>(null);
  const languageRef = useRef<HTMLDivElement>(null);

  const handleClickOutside = useCallback((event: MouseEvent) => {
    const target = event.target as Node;

    if (userRef.current && !userRef.current.contains(target)) {
      setShowUserMenu(false);
    }
    if (languageRef.current && !languageRef.current.contains(target)) {
      setShowLanguageMenu(false);
    }
  }, []);

  useEffect(() => {
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [handleClickOutside]);

  const handleNavigation = (url: string) => {
    setShowUserMenu(false);
    router.push(url);
  };

  const handleTabSwitch = (tab: string) => {
    setShowUserMenu(false);
    if (isOnProfilePage) {
      // If on profile page, update URL without navigation
      const url = new URL(window.location.href);
      url.searchParams.set("tab", tab);
      window.history.pushState({}, "", url.toString());
      // Trigger a custom event that profile page can listen to
      window.dispatchEvent(new CustomEvent("profileTabChange", { detail: { tab } }));
    } else {
      // If not on profile page, navigate to profile with tab
      router.push(`/profile?tab=${tab}`);
    }
  };

  const handleSignIn = (e: React.MouseEvent) => {
    e.preventDefault();
    setShowUserMenu(false);
    router.push("/login");
  };

  const currentLanguage = useMemo(
    () => LANGUAGES.find((l) => l.code === language),
    [language]
  );

  return (
    <>
      <header className="h-16 sticky top-0 z-40 bg-white/90 backdrop-blur flex items-center justify-between px-8 shadow-sm border-b border-gray-100">
        {/* Language Selector (left) */}
        <div className="flex-1 flex items-center">
          <div
            className="relative"
            ref={languageRef}
            onMouseEnter={() => {
              if (langCloseTimer.current) { clearTimeout(langCloseTimer.current); langCloseTimer.current = null; }
              setShowLanguageMenu(true);
            }}
            onMouseLeave={() => {
              langCloseTimer.current = setTimeout(() => setShowLanguageMenu(false), 150);
            }}
          >
            <button
              onFocus={() => setShowLanguageMenu(true)}
              className="h-10 px-4 rounded-lg border border-gray-200 bg-white text-sm font-medium text-gray-800 shadow-sm hover:shadow transition-all flex items-center gap-2"
            >
              <span>{currentLanguage?.nativeName || language.toUpperCase()}</span>
              <span className="text-gray-500">▾</span>
            </button>
            {showLanguageMenu && (
              <div className="absolute left-0 top-full bg-white rounded-lg shadow-2xl border border-gray-200 w-44 z-50 overflow-hidden translate-y-[2px]">
                {LANGUAGES.filter((l) => l.code !== language).map((lang, idx, arr) => (
                  <button
                    key={lang.code}
                    onClick={() => {
                      setLanguage(lang.code);
                      setShowLanguageMenu(false);
                    }}
                    className={`w-full text-left px-4 py-3 text-sm hover:bg-gray-50 transition-colors ${
                      idx !== arr.length - 1 ? "border-b border-gray-100" : ""
                    }`}
                  >
                    {lang.nativeName}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Center Title */}
        <div className="flex-1 flex justify-center">
          <button
            onClick={() => {
              try {
                if (typeof window !== "undefined") {
                  // Suppress restoring last search when explicitly going Home
                  try {
                    window.sessionStorage.removeItem("nannybooking:restoreNext");
                    window.sessionStorage.removeItem("nannybooking:lastSearch");
                    window.sessionStorage.setItem("nannybooking:forceHome", "1");
                    window.sessionStorage.setItem(
                      "nannybooking:suppressRestore",
                      "1"
                    );
                    // Also clear any persisted search UI state
                    window.localStorage.removeItem("nannybooking:lastSearch");
                  } catch {}
                  window.dispatchEvent(new CustomEvent("resetSearch"));
                }
              } catch {}
              router.push("/");
            }}
            className="text-2xl font-bold text-brand-600 tracking-wide hover:text-brand-700 transition-colors"
          >
            NannyBooking.org
          </button>
        </div>
        {/* User Menu (right) */}
        <div className="flex-1 flex justify-end items-center">
          {/* User Menu */}
          <div className="relative" ref={userRef}>
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="bg-white w-12 h-12 rounded-xl border border-gray-200 hover:bg-gray-50 transition-colors duration-200 shadow-lg hover:shadow-xl flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {user ? (
                <div className="relative">
                  <div className="w-6 h-6 bg-brand-600 rounded-full flex items-center justify-center text-white text-xs font-semibold">
                    {(
                      ((user.user_metadata as any)?.name ||
                        (user.user_metadata as any)?.full_name ||
                        "") as string
                    )
                      .charAt(0)
                      .toUpperCase() || user.email?.charAt(0).toUpperCase()}
                  </div>
                  {(pendingCount > 0 || unreadMessages > 0) && (
                    <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-600 rounded-full flex items-center justify-center">
                      <span className="w-2 h-2 bg-white rounded-full" />
                    </span>
                  )}
                </div>
              ) : isLoading ? (
                <div className="w-6 h-6 bg-gray-200 rounded-full animate-pulse" />
              ) : (
                <div className="flex flex-col space-y-1">
                  <div className="w-5 h-0.5 bg-gray-600"></div>
                  <div className="w-5 h-0.5 bg-gray-600"></div>
                  <div className="w-5 h-0.5 bg-gray-600"></div>
                </div>
              )}
            </button>
            {showUserMenu && (
              <div className="absolute top-full right-0 mt-2 bg-white rounded-xl shadow-2xl border border-gray-200 w-48 z-50 overflow-hidden">
                {user ? (
                  <>
                    <button
                      onClick={() => handleTabSwitch("job-ads")}
                      className="w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors duration-200 border-b border-gray-100 text-sm font-medium bg-white"
                    >
                      {t("profile.yourAdvertisement")}
                    </button>
                    <button
                      onClick={() => handleTabSwitch("bookings")}
                      className="w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors duration-200 border-b border-gray-100 text-sm font-medium bg-white flex items-center justify-between"
                    >
                      {t("profile.bookings")}
                      {pendingCount > 0 && (
                        <span className="bg-orange-500 text-white text-[10px] font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1">
                          {pendingCount}
                        </span>
                      )}
                    </button>
                    <button
                      onClick={() => handleTabSwitch("messages")}
                      className="w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors duration-200 border-b border-gray-100 text-sm font-medium bg-white flex items-center justify-between"
                    >
                      {t("profile.messages")}
                      {unreadMessages > 0 && (
                        <span className="bg-red-600 text-white text-[10px] font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1">
                          {unreadMessages}
                        </span>
                      )}
                    </button>
                    <button
                      onClick={() => handleTabSwitch("profile")}
                      className="w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors duration-200 border-b border-gray-100 text-sm font-medium bg-white"
                    >
                      {t("profile.profile")}
                    </button>
                    {isAdmin && (
                      <button
                        onClick={() => handleNavigation("/admin")}
                        className="w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors duration-200 border-b border-gray-100 text-sm font-medium bg-white text-brand-700"
                      >
                        Admin Panel
                      </button>
                    )}
                    <button
                      onClick={async () => {
                        setShowUserMenu(false);
                        try {
                          await supabase.auth.signOut();
                          // Force a hard navigation to avoid HMR issues
                          window.location.replace("/");
                        } catch (error) {
                          console.error("Logout error:", error);
                          // Fallback: still navigate to home even if logout fails
                          window.location.replace("/");
                        }
                      }}
                      className="w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors duration-200 text-sm font-medium bg-white block"
                    >
                      {t("header.signOut")}
                    </button>
                  </>
                ) : isLoading ? (
                  <div className="px-4 py-3 text-sm text-gray-500">
                    {t("common.loading")}
                  </div>
                ) : (
                  <button
                    onClick={handleSignIn}
                    className="w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors duration-200 text-sm font-medium bg-white"
                  >
                    {t("header.signIn")}
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </header>
    </>
  );
}
