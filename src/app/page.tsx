"use client";

import { useEffect, useState } from "react";
import { UserService } from "../lib/userService";
import Header from "../components/Header";
import HomeClient from "../components/HomeClient";
import { useSupabaseUser } from "../lib/useSupabaseUser";
import BlockingLoader from "../components/BlockingLoader";

export default function Home() {
  const { user, isLoading } = useSupabaseUser();
  const [isCheckingProfile, setIsCheckingProfile] = useState(false);
  const [hasCheckedProfile, setHasCheckedProfile] = useState(false);
  const [debugInfo, setDebugInfo] = useState<string[]>([]);
  const [initialSearch, setInitialSearch] = useState<{
    location: string;
    startDate: Date | null;
    endDate: Date | null;
    openResults: boolean;
  } | null>(null);

  const addDebugInfo = (info: string) => {
    setDebugInfo((prev) => [...prev, `${new Date().toISOString()}: ${info}`]);
  };

  useEffect(() => {
    const checkProfileCompletion = async () => {
      // Prevent multiple checks
      if (hasCheckedProfile || isLoading || !user?.email) {
        addDebugInfo(
          `Skipping profile check: hasChecked=${hasCheckedProfile}, isLoading=${isLoading}, hasUser=${!!user?.email}`
        );
        return;
      }

      addDebugInfo(`Starting profile completion check for: ${user.email}`);
      setIsCheckingProfile(true);

      try {
        const isComplete = await UserService.isProfileComplete(user.email);
        addDebugInfo(`Profile completion result: ${isComplete}`);

        if (!isComplete && window.location.pathname !== "/complete-profile") {
          addDebugInfo(`Redirecting to complete-profile page`);
          window.location.href = "/complete-profile";
        }
      } catch (error) {
        addDebugInfo(`Error checking profile completion: ${error}`);
        console.error("Error checking profile completion:", error);
      } finally {
        setIsCheckingProfile(false);
        setHasCheckedProfile(true);
      }
    };

    checkProfileCompletion();
  }, [user, isLoading, hasCheckedProfile]);

  useEffect(() => {
    // Restore last search only when returning from details in the same session
    try {
      if (typeof window !== "undefined") {
        const restore = sessionStorage.getItem("auklite:restoreNext");
        const raw = restore
          ? sessionStorage.getItem("auklite:lastSearch")
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
        // Always clear flags so normal home nav doesn’t restore
        sessionStorage.removeItem("auklite:restoreNext");
        sessionStorage.removeItem("auklite:suppressRestore");
      }
    } catch {}
  }, []);

  // No explicit error handling here; Supabase errors are surfaced in flows

  // Show loading while checking profile completion
  if (isLoading || isCheckingProfile) {
    return (
      <div className="min-h-screen flex flex-col bg-white">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <div className="w-full max-w-md">
            <BlockingLoader
              message={
                isLoading ? "Loading authentication…" : "Checking profile…"
              }
            />
            {debugInfo.length > 0 && (
              <details className="mt-4 text-left">
                <summary className="cursor-pointer text-sm text-gray-500">
                  Debug Info
                </summary>
                <div className="mt-2 p-2 bg-gray-100 rounded text-xs">
                  {debugInfo.map((info, index) => (
                    <div key={index} className="mb-1">
                      {info}
                    </div>
                  ))}
                </div>
              </details>
            )}
          </div>
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
