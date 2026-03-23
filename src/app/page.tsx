"use client";

import { useEffect, useState } from "react";
import { UserService } from "../lib/userService";
import Header from "../components/Header";
import HomeClient from "../components/HomeClient";
import { useSupabaseUser } from "../lib/useSupabaseUser";
import { useTranslation } from "../components/LanguageProvider";
import BlockingLoader from "../components/BlockingLoader";

export default function Home() {
  const { user, isLoading } = useSupabaseUser();
  const { t } = useTranslation();
  const [isCheckingProfile, setIsCheckingProfile] = useState(false);
  const [hasCheckedProfile, setHasCheckedProfile] = useState(false);
  const [initialSearch, setInitialSearch] = useState<{
    location: string;
    startDate: Date | null;
    endDate: Date | null;
    openResults: boolean;
  } | null>(null);

  useEffect(() => {
    const checkProfileCompletion = async () => {
      if (hasCheckedProfile || isLoading || !user?.email) return;

      setIsCheckingProfile(true);
      try {
        const isComplete = await UserService.isProfileComplete(user.email);
        if (!isComplete && window.location.pathname !== "/complete-profile") {
          window.location.href = "/complete-profile";
        }
      } catch (error) {
        console.error("Error checking profile completion:", error);
      } finally {
        setIsCheckingProfile(false);
        setHasCheckedProfile(true);
      }
    };

    checkProfileCompletion();
  }, [user, isLoading, hasCheckedProfile]);

  useEffect(() => {
    try {
      if (typeof window !== "undefined") {
        const restore = sessionStorage.getItem("nannybooking:restoreNext");
        const raw = restore
          ? sessionStorage.getItem("nannybooking:lastSearch")
          : null;
        if (raw && restore) {
          const parsed = JSON.parse(raw);
          setInitialSearch({
            location: parsed.location || "Location",
            startDate: parsed.startDate ? new Date(parsed.startDate) : null,
            endDate: parsed.endDate ? new Date(parsed.endDate) : null,
            openResults: !!parsed.openResults,
          });
        }
        sessionStorage.removeItem("nannybooking:restoreNext");
        sessionStorage.removeItem("nannybooking:suppressRestore");
      }
    } catch {}
  }, []);

  if (isLoading || isCheckingProfile) {
    return (
      <div className="min-h-screen flex flex-col bg-white">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <BlockingLoader
            message={isLoading ? t("common.loading") : "Checking profile…"}
          />
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Header />
      <HomeClient
        initialLocation={initialSearch?.location}
        initialStartDate={initialSearch?.startDate || null}
        initialEndDate={initialSearch?.endDate || null}
        initialShowResults={!!initialSearch?.openResults}
      />
    </div>
  );
}
