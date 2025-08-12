"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "../lib/supabase";
import { useSupabaseUser } from "../lib/useSupabaseUser";

export default function Header() {
  const { user, isLoading } = useSupabaseUser();
  const router = useRouter();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showLanguageMenu, setShowLanguageMenu] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState("EN");
  const userRef = useRef<HTMLDivElement>(null);
  const languageRef = useRef<HTMLDivElement>(null);
  const languages = [
    { code: "EN", name: "English" },
    { code: "LV", name: "Latviešu" },
    { code: "RU", name: "Русский" },
  ];

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

  const handleSignIn = (e: React.MouseEvent) => {
    e.preventDefault();
    setShowUserMenu(false);
    router.push("/login");
  };

  return (
    <>
      <header className="h-16 bg-white flex items-center justify-between px-8 shadow-sm border-b border-gray-100">
        <div className="flex-1"></div>
        {/* Center Title */}
        <div className="flex-1 flex justify-center">
          <button
            onClick={() => {
              try {
                if (typeof window !== "undefined") {
                  window.dispatchEvent(new CustomEvent("resetSearch"));
                }
              } catch {}
              router.push("/");
            }}
            className="text-2xl font-bold text-purple-600 tracking-wide hover:text-purple-700 transition-colors"
          >
            Caring Hands
          </button>
        </div>
        {/* Language and Menu Controls - Positioned to the right and lower */}
        <div className="flex-1 flex justify-end items-end pt-2 space-x-4">
          {/* Language Selector - Above Menu */}
          <div className="relative" ref={languageRef}>
            <button
              onClick={() => setShowLanguageMenu(!showLanguageMenu)}
              className="bg-white w-12 h-12 rounded-xl border border-gray-200 hover:bg-gray-50 transition-colors duration-200 shadow-lg hover:shadow-xl text-sm font-medium flex items-center justify-center"
            >
              {selectedLanguage}
            </button>
            {showLanguageMenu && (
              <div className="absolute top-full right-0 mt-2 bg-white rounded-xl shadow-2xl border border-gray-200 w-32 z-50 overflow-hidden">
                <div className="p-2 bg-gray-50 border-b border-gray-200">
                  <h3 className="font-semibold text-gray-700 text-xs">
                    Language
                  </h3>
                </div>
                {languages.map((lang, index) => (
                  <button
                    key={lang.code}
                    onClick={() => {
                      setSelectedLanguage(lang.code);
                      setShowLanguageMenu(false);
                    }}
                    className={`w-full text-center px-3 py-2 hover:bg-gray-50 transition-colors duration-200 border-b border-gray-100 last:border-b-0 text-sm bg-white ${
                      index === 0
                        ? "translate-y-1"
                        : index === 2
                        ? "-translate-y-1"
                        : ""
                    }`}
                  >
                    {lang.name}
                  </button>
                ))}
              </div>
            )}
          </div>
          {/* User Menu */}
          <div className="relative" ref={userRef}>
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="bg-white w-12 h-12 rounded-xl border border-gray-200 hover:bg-gray-50 transition-colors duration-200 shadow-lg hover:shadow-xl flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {user ? (
                <div className="w-6 h-6 bg-purple-600 rounded-full flex items-center justify-center text-white text-xs font-semibold">
                  {(
                    ((user.user_metadata as any)?.name ||
                      (user.user_metadata as any)?.full_name ||
                      "") as string
                  )
                    .charAt(0)
                    .toUpperCase() || user.email?.charAt(0).toUpperCase()}
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
                <div className="p-3 bg-gray-50 border-b border-gray-200">
                  <h3 className="font-semibold text-gray-700 text-sm">
                    Account
                  </h3>
                </div>
                {user ? (
                  <>
                    <button
                      onClick={() => handleNavigation("/profile")}
                      className="w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors duration-200 border-b border-gray-100 text-sm font-medium bg-white disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Profile
                    </button>
                    <button
                      onClick={async () => {
                        setShowUserMenu(false);
                        await supabase.auth.signOut();
                        window.location.href = "/";
                      }}
                      className="w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors duration-200 text-sm font-medium bg-white block"
                    >
                      Sign out
                    </button>
                  </>
                ) : isLoading ? (
                  <div className="px-4 py-3 text-sm text-gray-500">
                    Loading...
                  </div>
                ) : (
                  <>
                    <button
                      onClick={handleSignIn}
                      className="w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors duration-200 border-b border-gray-100 text-sm font-medium bg-white"
                    >
                      Sign in
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </header>
    </>
  );
}
