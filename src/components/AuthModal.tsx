"use client";

import { useState } from "react";
import { supabase } from "../lib/supabase";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode: "signin" | "signup";
  onModeChange?: (mode: "signin" | "signup") => void;
}

export default function AuthModal({
  isOpen,
  onClose,
  mode,
  onModeChange,
}: AuthModalProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setMessage("");

    // Add timeout for network issues
    const timeoutId = setTimeout(() => {
      if (loading) {
        setError(
          "Request is taking longer than expected. Please check your internet connection and try again."
        );
        setLoading(false);
      }
    }, 10000); // 10 second timeout

    try {
      if (mode === "signup") {
        // Simple signup with just email and password
        const { data, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/profile`,
          },
        });

        if (signUpError) throw signUpError;

        if (data.user) {
          setMessage(
            "Account created successfully! Please check your email to verify your account. After verification, you can complete your profile."
          );
          // Don't close modal immediately, let user see the message
        }
      } else {
        console.log("Attempting sign in for:", email);

        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) throw error;

        console.log("Sign in successful:", data);

        // Check if user is verified
        if (data.user && !data.user.email_confirmed_at) {
          throw new Error(
            "Please verify your email before signing in. Check your inbox for the verification link."
          );
        }

        // Wait a moment for session to be established
        await new Promise((resolve) => setTimeout(resolve, 500));

        // Verify session was created
        const {
          data: { session },
        } = await supabase.auth.getSession();
        if (!session) {
          throw new Error("Session creation failed. Please try again.");
        }

        console.log("Session verified, closing modal and redirecting...");

        // Close modal after successful sign in
        onClose();

        // Redirect to profile page
        window.location.href = "/profile";
      }
    } catch (error: any) {
      console.error("Auth error:", error);
      setError(
        error.message || "An unexpected error occurred. Please try again."
      );
    } finally {
      clearTimeout(timeoutId);
      setLoading(false);
    }
  };

  const switchMode = () => {
    setError("");
    setMessage("");
    setEmail("");
    setPassword("");

    // Switch to the other mode
    const newMode = mode === "signin" ? "signup" : "signin";
    onModeChange?.(newMode);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl p-8 max-w-md w-full mx-4 shadow-2xl">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900">
            {mode === "signup" ? "Create Account" : "Sign In"}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === "signup" && (
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-4">
              <p className="text-blue-800 text-sm">
                <strong>Simple Signup:</strong> Just enter your email and
                password. You'll complete your profile after email verification.
              </p>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl">
              {error}
            </div>
          )}

          {message && (
            <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-xl">
              {message}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-purple-600 text-white py-3 rounded-xl font-semibold hover:bg-purple-700 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
          >
            {loading ? (
              <>
                <svg
                  className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                {mode === "signup" ? "Creating Account..." : "Signing In..."}
              </>
            ) : mode === "signup" ? (
              "Create Account"
            ) : (
              "Sign In"
            )}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-gray-600">
            {mode === "signup"
              ? "Already have an account?"
              : "Don't have an account?"}
            <button
              onClick={switchMode}
              className="text-purple-600 hover:text-purple-700 font-medium ml-1"
            >
              {mode === "signup" ? "Sign In" : "Sign Up"}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
