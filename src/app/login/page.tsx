"use client";

import { supabase } from "../../lib/supabase";
import { useSupabaseUser } from "../../lib/useSupabaseUser";
import { useState } from "react";

const providers = [
  { id: "google", label: "Continue with Google", icon: "🔵" },
  { id: "facebook", label: "Continue with Facebook", icon: "📘" },
] as const;

export default function LoginPage() {
  const { user } = useSupabaseUser();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleOAuth = async (provider: string) => {
    setError(null);
    setIsLoading(true);
    try {
      const siteUrl =
        process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
      const { error } = await supabase.auth.signInWithOAuth({
        provider: provider as any,
        options: {
          redirectTo: `${siteUrl}/`,
        },
      });
      if (error) throw error;
    } catch (e: any) {
      setError(e.message || "Failed to sign in");
    } finally {
      setIsLoading(false);
    }
  };


  if (user) {
    if (typeof window !== "undefined") window.location.href = "/";
    return null;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-indigo-50 px-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
        <div className="px-8 py-10">
          <div className="text-center mb-8">
            <div className="mx-auto w-14 h-14 rounded-2xl bg-purple-600 text-white flex items-center justify-center text-2xl font-bold shadow-lg">
              A
            </div>
            <h1 className="mt-4 text-2xl font-semibold text-gray-900">
              Welcome to NannyBooking
            </h1>
            <p className="mt-1 text-gray-500 text-sm">Sign in to continue</p>
          </div>

          <div className="space-y-3">
            {providers.map((p) => (
              <button
                key={p.id}
                onClick={() => handleOAuth(p.id)}
                disabled={isLoading}
                className="w-full flex items-center justify-center gap-3 px-4 py-3 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 transition disabled:opacity-50"
              >
                <span className="text-lg">{p.icon}</span>
                <span className="text-sm font-medium text-gray-800">
                  {p.label}
                </span>
              </button>
            ))}
          </div>
          {error && <div className="mt-4 text-sm text-red-600 text-center">{error}</div>}

          <p className="mt-6 text-center text-xs text-gray-500">
            By continuing, you agree to our Terms and Privacy Policy.
          </p>
        </div>
      </div>
    </div>
  );
}
