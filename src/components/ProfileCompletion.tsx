"use client";

import { useState, useEffect } from "react";
import { UserService } from "../lib/userService";
import Header from "./Header";
import Footer from "./Footer";
import { useSupabaseUser } from "../lib/useSupabaseUser";
import { supabase } from "../lib/supabase";

export default function ProfileCompletion() {
  const { user: auth0User, isLoading } = useSupabaseUser();
  const [userType, setUserType] = useState<"parent" | "nanny">("parent");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [bio, setBio] = useState("");

  // Pre-fill name and surname from user metadata when available
  useEffect(() => {
    if (auth0User) {
      const meta: any = auth0User.user_metadata || {};
      // Split full name if only name is provided
      const fullName = meta.name || "";
      if (fullName && !meta.given_name && !meta.family_name) {
        // Try to split name into first and last
        const parts = fullName.trim().split(/\s+/);
        if (parts.length >= 2) {
          setFirstName(parts[0]);
          setLastName(parts.slice(1).join(" "));
        } else {
          setFirstName(parts[0] || "");
          setLastName("");
        }
      } else {
        setFirstName(meta.given_name || "");
        setLastName(meta.family_name || "");
      }
    }
  }, [auth0User]);

  const handleCompleteProfile = async () => {
    if (!auth0User?.email) {
      setSubmitError("User not found");
      return;
    }

    if (!firstName.trim() || !lastName.trim()) {
      setSubmitError("Please enter both your name and surname");
      return;
    }

    if (!bio.trim()) {
      setSubmitError(
        userType === "parent"
          ? "Please write a bio about yourself"
          : "Please write about your experience and yourself"
      );
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      // First, save user data to Supabase with name and surname
      const userData = {
        email: auth0User.email,
        name: firstName.trim(),
        surname: lastName.trim(),
        picture:
          (auth0User.user_metadata as any)?.avatar_url ||
          (auth0User.user_metadata as any)?.picture ||
          null,
        user_type: "pending", // Temporary value, will be updated in the next step
        updated_at: new Date().toISOString(),
      };

      const { data: savedUser, error: saveError } = await supabase
        .from("users")
        .upsert({ id: auth0User.id, ...userData }, { onConflict: "id" })
        .select()
        .single();

      if (saveError) {
        console.error("Error saving user:", saveError);
        setSubmitError("Failed to save user data");
        return;
      }

      // Then complete the profile with user type
      const completedUser = await UserService.completeProfile(
        auth0User.email,
        userType,
        firstName.trim(),
        lastName.trim()
      );

      if (!completedUser) {
        setSubmitError("Failed to complete profile");
        return;
      }

      // Update bio separately (save to both bio and additional_info for compatibility)
      const { error: bioError } = await supabase
        .from("users")
        .update({ 
          bio: bio.trim(),
          additional_info: bio.trim() // Also save to additional_info for profile page compatibility
        })
        .eq("id", auth0User.id);

      if (bioError) {
        console.error("Error saving bio:", bioError);
        // Don't fail the whole process if bio fails
      }

      // Redirect to main app
      window.location.href = "/";
    } catch (err: any) {
      setSubmitError(err.message || "Failed to complete profile");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col bg-gray-50">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading...</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!auth0User) {
    return (
      <div className="min-h-screen flex flex-col bg-gray-50">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <p className="text-red-600">User not found</p>
            <a
              href="/login"
              className="mt-4 inline-block bg-purple-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-purple-700 transition-colors duration-200"
            >
              Sign In Again
            </a>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header />

      <main className="flex-1 px-8 py-16">
        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8">
            <div className="text-center mb-8">
              <div className="w-20 h-20 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                {(auth0User.user_metadata as any)?.avatar_url ||
                (auth0User.user_metadata as any)?.picture ? (
                  <img
                    src={
                      (auth0User.user_metadata as any)?.avatar_url ||
                      (auth0User.user_metadata as any)?.picture
                    }
                    alt="Profile"
                    className="w-16 h-16 rounded-full"
                  />
                ) : (
                  <svg
                    className="w-10 h-10 text-purple-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                    />
                  </svg>
                )}
              </div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Complete Your Profile
              </h1>
              <p className="text-gray-600">
                Welcome! Please complete your profile to get started.
              </p>
            </div>

            <div className="space-y-6">
              {/* Editable user information */}
              <div className="bg-gray-50 rounded-xl p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">
                  Your Information
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Name
                    </label>
                    <input
                      type="text"
                      value={firstName}
                      onChange={(e) => {
                        const value = e.target.value;
                        if (value.length <= 50) {
                          setFirstName(value);
                        }
                      }}
                      maxLength={50}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      placeholder="Enter your name"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      {firstName.length}/50 characters
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Surname
                    </label>
                    <input
                      type="text"
                      value={lastName}
                      onChange={(e) => {
                        const value = e.target.value;
                        if (value.length <= 50) {
                          setLastName(value);
                        }
                      }}
                      maxLength={50}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      placeholder="Enter your surname"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      {lastName.length}/50 characters
                    </p>
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Email
                    </label>
                    <input
                      type="email"
                      value={auth0User.email || ""}
                      disabled
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-500 cursor-not-allowed"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Email cannot be changed
                    </p>
                  </div>
                </div>
              </div>

              {/* User type selection */}
              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-4">
                  I am a...
                </h2>
                <div className="flex gap-4 mb-6">
                  <button
                    onClick={() => setUserType("parent")}
                    className={`flex-1 p-4 rounded-xl border-2 transition-all duration-200 ${
                      userType === "parent"
                        ? "border-purple-600 bg-purple-50 text-purple-900"
                        : "border-gray-200 bg-white text-gray-700 hover:border-gray-300"
                    }`}
                  >
                    <div className="text-center">
                      <svg
                        className="w-8 h-8 mx-auto mb-2 text-purple-600"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                        />
                      </svg>
                      <h3 className="font-semibold">Parent</h3>
                    </div>
                  </button>

                  <button
                    onClick={() => setUserType("nanny")}
                    className={`flex-1 p-4 rounded-xl border-2 transition-all duration-200 ${
                      userType === "nanny"
                        ? "border-purple-600 bg-purple-50 text-purple-900"
                        : "border-gray-200 bg-white text-gray-700 hover:border-gray-300"
                    }`}
                  >
                    <div className="text-center">
                      <svg
                        className="w-8 h-8 mx-auto mb-2 text-purple-600"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                        />
                      </svg>
                      <h3 className="font-semibold">Nanny</h3>
                    </div>
                  </button>
                </div>
              </div>

              {/* Bio textarea */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {userType === "parent"
                    ? "Bio about yourself"
                    : "Short text about your experience and yourself"}
                </label>
                <textarea
                  value={bio}
                  onChange={(e) => {
                    const value = e.target.value;
                    if (value.length <= 1000) {
                      setBio(value);
                    }
                  }}
                  rows={5}
                  maxLength={1000}
                  minLength={10}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                  placeholder={
                    userType === "parent"
                      ? "Tell us about yourself..."
                      : "Tell us about your experience and yourself..."
                  }
                />
                <p className="text-xs text-gray-500 mt-1">
                  {bio.length}/1000 characters {bio.length > 0 && bio.length < 10 && (
                    <span className="text-red-500">(min. 10 characters)</span>
                  )}
                </p>
              </div>

              {/* Error message */}
              {submitError && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                  <p className="text-red-600">{submitError}</p>
                </div>
              )}

              {/* Submit button */}
              <div className="flex justify-center">
                <button
                  onClick={handleCompleteProfile}
                  disabled={
                    isSubmitting || !firstName.trim() || !lastName.trim() || !bio.trim()
                  }
                  className="bg-purple-600 text-white px-8 py-3 rounded-xl font-semibold hover:bg-purple-700 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? "Completing..." : "Complete Profile"}
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
