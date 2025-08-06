"use client";

import { useUser } from "@auth0/nextjs-auth0/client";
import { useEffect, useState } from "react";
import { UserService } from "../lib/userService";
import Header from "../components/Header";
import HomeClient from "../components/HomeClient";

export default function Home() {
  const { user, isLoading, error } = useUser();
  const [isCheckingProfile, setIsCheckingProfile] = useState(false);
  const [hasCheckedProfile, setHasCheckedProfile] = useState(false);
  const [debugInfo, setDebugInfo] = useState<string[]>([]);

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

        if (!isComplete) {
          addDebugInfo(`Redirecting to complete-profile page`);
          window.location.href = "/complete-profile";
        } else {
          addDebugInfo(`Profile is complete, staying on home page`);
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

  // Show error if Auth0 has an error
  if (error) {
    return (
      <div className="min-h-screen flex flex-col bg-white">
        <Header user={null} />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="text-red-600 text-xl font-semibold mb-4">
              Authentication Error
            </div>
            <p className="text-gray-600 mb-4">{error.message}</p>
            <a
              href="/api/auth/login"
              className="bg-purple-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-purple-700 transition-colors"
            >
              Try Signing In Again
            </a>
          </div>
        </main>
      </div>
    );
  }

  // Show loading while checking profile completion
  if (isLoading || isCheckingProfile) {
    return (
      <div className="min-h-screen flex flex-col bg-white">
        <Header user={user} />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">
              {isLoading ? "Loading authentication..." : "Checking profile..."}
            </p>
            {debugInfo.length > 0 && (
              <details className="mt-4 text-left max-w-md mx-auto">
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
      <Header user={user} />
      <HomeClient />
    </div>
  );
}
