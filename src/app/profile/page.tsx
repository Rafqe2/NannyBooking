"use client";

import { useEffect, useState } from "react";
import { UserService, UserProfile } from "../../lib/userService";
import { AdvertisementService } from "../../lib/advertisementService";
import Header from "../../components/Header";
import { supabase } from "../../lib/supabase";
import Footer from "../../components/Footer";
import { Database } from "../../types/database";
import { useSupabaseUser } from "../../lib/useSupabaseUser";

type Advertisement = Database["public"]["Tables"]["advertisements"]["Row"];

export default function ProfilePage() {
  const { user, isLoading } = useSupabaseUser();
  const displayName =
    (user?.user_metadata as any)?.name ||
    (user?.user_metadata as any)?.full_name ||
    (user?.user_metadata as any)?.given_name ||
    user?.email ||
    "User";
  const avatarUrl =
    (user?.user_metadata as any)?.avatar_url ||
    (user?.user_metadata as any)?.picture ||
    null;
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [advertisements, setAdvertisements] = useState<Advertisement[]>([]);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [activeTab, setActiveTab] = useState<
    "job-ads" | "bookings" | "messages" | "profile"
  >("job-ads");
  const [editForm, setEditForm] = useState({
    name: "",
    user_type: "pending" as "parent" | "nanny" | "pending" | "admin",
    additional_info: "",
    phone: "",
    location: "",
  });
  const [adBeingEdited, setAdBeingEdited] = useState<Advertisement | null>(
    null
  );
  const [isSavingAd, setIsSavingAd] = useState(false);
  const [adEditForm, setAdEditForm] = useState({
    title: "",
    price_per_hour: 0 as number,
    description: "",
    location_city: "",
    availability_start_time: "",
    availability_end_time: "",
    skills: [] as string[],
  });

  const isParent = userProfile?.user_type === "parent";
  const isNanny = userProfile?.user_type === "nanny";

  useEffect(() => {
    const loadProfile = async () => {
      if (!user?.email) return;

      try {
        const profile = await UserService.getUserByEmail(user.email);
        if (profile) {
          setUserProfile(profile);
          setEditForm({
            name: profile.name || "",
            user_type: profile.user_type || "pending",
            additional_info: profile.additional_info || "",
            phone: profile.phone || "",
            location: profile.location || "",
          });

          // Load user advertisements
          const userAds = await AdvertisementService.getUserAdvertisements(
            profile.id
          );
          setAdvertisements(userAds);
        }
      } catch (error) {
        console.error("Error loading profile:", error);
      } finally {
        setIsLoadingProfile(false);
      }
    };

    if (!isLoading && user) {
      loadProfile();
    }
  }, [user, isLoading]);

  // Redirect to login if not authenticated
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    window.location.href = "/login";
    return null;
  }

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user?.id) {
      console.error("No user id found");
      return;
    }

    setIsUpdating(true);

    try {
      const updatedProfile = await UserService.updateProfileById(user.id, {
        name: editForm.name,
        user_type: editForm.user_type,
        additional_info: editForm.additional_info,
        phone: editForm.phone,
        location: editForm.location,
      });

      if (updatedProfile) {
        setUserProfile(updatedProfile);
        setIsEditing(false);

        // Refresh the user profile to ensure UI reflects changes
        const refreshedProfile = await UserService.getUserByEmail(user.email!);
        if (refreshedProfile) {
          setUserProfile(refreshedProfile);
        }

        // Show success message (you could add a toast notification here)
        console.log("Profile updated successfully");
      }
    } catch (error) {
      console.error("Error updating profile:", error);
    } finally {
      setIsUpdating(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
    });
  };

  const tabs = [
    {
      id: "job-ads",
      label: isParent ? "Your Advertisement" : "Your Advertisement",
      icon: isParent ? "📋" : "💼",
    },
    { id: "bookings", label: "Bookings", icon: "📅" },
    { id: "messages", label: "Messages", icon: "💬" },
    { id: "profile", label: "Profile", icon: "👤" },
  ] as const;

  const renderJobAdsTab = () => (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
        {/* Header */}
        <div className="px-8 py-6 border-b border-gray-100 bg-gray-50">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-semibold text-gray-900">
                Your Advertisement
              </h2>
              <p className="text-gray-600 mt-1">
                {userProfile?.user_type === "parent"
                  ? "Manage your childcare job postings"
                  : userProfile?.user_type === "nanny"
                  ? "Manage your childcare services and availability"
                  : "Complete your profile to get started"}
              </p>
            </div>
            {(() => {
              const hasActive = advertisements.some((a) => a.is_active);
              const inactiveCount = advertisements.filter(
                (a) => !a.is_active
              ).length;
              return (
                <button
                  onClick={() => {
                    if (hasActive || inactiveCount >= 3) return;
                    window.location.href = "/create-advertisement";
                  }}
                  disabled={hasActive || inactiveCount >= 3}
                  className={`px-6 py-3 rounded-lg font-medium transition-colors duration-200 shadow-sm ${
                    hasActive || inactiveCount >= 3
                      ? "bg-gray-300 text-gray-600 cursor-not-allowed"
                      : "bg-purple-600 text-white hover:bg-purple-700"
                  }`}
                  title={
                    hasActive
                      ? "You already have an active ad"
                      : inactiveCount >= 3
                      ? "You already have 3 inactive ads"
                      : ""
                  }
                >
                  {userProfile?.user_type === "parent"
                    ? "Create New Ad"
                    : userProfile?.user_type === "nanny"
                    ? "Add Service"
                    : "Get Started"}
                </button>
              );
            })()}
          </div>
        </div>

        {/* Content */}
        <div className="p-6 sm:p-8">
          {advertisements.length > 0 ? (
            <div className="space-y-6">
              {advertisements.map((ad) => (
                <div
                  key={ad.id}
                  className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-md transition-shadow duration-200"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-xl font-semibold text-gray-900 mb-2">
                        {ad.title}
                      </h3>
                      <div className="flex items-center space-x-4 text-sm text-gray-600">
                        <span className="flex items-center">
                          <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                          {ad.type === "short-term"
                            ? "Short-term"
                            : "Long-term"}
                        </span>
                        <span className="flex items-center">
                          <span className="mr-1">💰</span>${ad.price_per_hour}
                          /hour
                        </span>
                        <span className="flex items-center">
                          <span className="mr-1">📍</span>
                          {ad.location_city}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => {
                          setAdBeingEdited(ad);
                          setAdEditForm({
                            title: ad.title,
                            price_per_hour: Number(ad.price_per_hour) || 0,
                            description: ad.description || "",
                            location_city: ad.location_city || "",
                            availability_start_time:
                              ad.availability_start_time || "",
                            availability_end_time:
                              ad.availability_end_time || "",
                            skills: (ad.skills as any) || [],
                          });
                        }}
                        className="text-purple-600 hover:text-purple-700 text-sm font-medium"
                      >
                        Edit
                      </button>
                      {ad.is_active ? (
                        <button
                          onClick={async () => {
                            console.log("Deactivating ad", {
                              adId: ad.id,
                              adUserId: ad.user_id,
                              currentUid: user?.id,
                            });
                            const { error } = await supabase.rpc("ad_toggle", {
                              p_ad_id: ad.id,
                              p_active: false,
                            });
                            if (error) {
                              console.error("RPC deactivate error:", error);
                              return;
                            }
                            const userAds =
                              await AdvertisementService.getUserAdvertisements(
                                userProfile!.id
                              );
                            setAdvertisements(userAds);
                          }}
                          className="text-red-600 hover:text-red-700 text-sm font-medium"
                        >
                          Deactivate
                        </button>
                      ) : (
                        <button
                          onClick={async () => {
                            const anotherActive = advertisements.some(
                              (a) => a.is_active
                            );
                            if (anotherActive) return;
                            console.log("Activating ad", {
                              adId: ad.id,
                              adUserId: ad.user_id,
                              currentUid: user?.id,
                            });
                            const { error } = await supabase.rpc("ad_toggle", {
                              p_ad_id: ad.id,
                              p_active: true,
                            });
                            if (error) {
                              console.error("RPC activate error:", error);
                              return;
                            }
                            const userAds =
                              await AdvertisementService.getUserAdvertisements(
                                userProfile!.id
                              );
                            setAdvertisements(userAds);
                          }}
                          disabled={advertisements.some((a) => a.is_active)}
                          title={
                            advertisements.some((a) => a.is_active)
                              ? "Another advertisement is already active"
                              : ""
                          }
                          className={
                            `text-sm font-medium ` +
                            (advertisements.some((a) => a.is_active)
                              ? "text-gray-400 cursor-not-allowed"
                              : "text-green-600 hover:text-green-700")
                          }
                        >
                          Activate
                        </button>
                      )}
                      {!ad.is_active && (
                        <button
                          onClick={async () => {
                            if (
                              !confirm(
                                "Delete this advertisement? This cannot be undone."
                              )
                            ) {
                              return;
                            }
                            const ok =
                              await AdvertisementService.deleteAdvertisement(
                                ad.id
                              );
                            if (!ok) {
                              console.error(
                                "Failed to delete advertisement",
                                ad.id
                              );
                              return;
                            }
                            const userAds =
                              await AdvertisementService.getUserAdvertisements(
                                userProfile!.id
                              );
                            setAdvertisements(userAds);
                          }}
                          className="text-red-700 hover:text-red-800 text-sm font-medium"
                        >
                          Delete
                        </button>
                      )}
                    </div>
                  </div>

                  <p className="text-gray-700 mb-4 line-clamp-3">
                    {ad.description}
                  </p>

                  {ad.skills && ad.skills.length > 0 && (
                    <div className="mb-4">
                      <div className="flex flex-wrap gap-2">
                        {ad.skills.slice(0, 5).map((skill) => (
                          <span
                            key={skill}
                            className="px-3 py-1 bg-purple-100 text-purple-700 text-xs rounded-full"
                          >
                            {skill}
                          </span>
                        ))}
                        {ad.skills.length > 5 && (
                          <span className="px-3 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                            +{ad.skills.length - 5} more
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="flex items-center justify-between text-sm text-gray-500">
                    <span>Created {formatDate(ad.created_at)}</span>
                    <span
                      className={
                        ad.is_active
                          ? "text-green-600 font-medium"
                          : "text-gray-500"
                      }
                    >
                      {ad.is_active ? "Active" : "Inactive"}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            /* Empty State */
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg
                  className="w-8 h-8 text-purple-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                {userProfile?.user_type === "parent"
                  ? "No Job Ads Yet"
                  : userProfile?.user_type === "nanny"
                  ? "No Services Listed Yet"
                  : "Complete your profile to get started"}
              </h3>
              <p className="text-gray-600 mb-6 max-w-md mx-auto">
                {userProfile?.user_type === "parent"
                  ? "Create your first job ad to find the perfect childcare provider for your family."
                  : userProfile?.user_type === "nanny"
                  ? "List your childcare services to start receiving booking requests from families."
                  : "Complete your profile to get started"}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Edit Ad Modal */}
      {adBeingEdited && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white w-full max-w-2xl rounded-2xl shadow-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold">Edit Advertisement</h3>
              <button
                onClick={() => setAdBeingEdited(null)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Title
                </label>
                <input
                  type="text"
                  value={adEditForm.title}
                  onChange={(e) =>
                    setAdEditForm({ ...adEditForm, title: e.target.value })
                  }
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Price per Hour (€)
                </label>
                <input
                  type="number"
                  value={adEditForm.price_per_hour}
                  onChange={(e) =>
                    setAdEditForm({
                      ...adEditForm,
                      price_per_hour: Number(e.target.value),
                    })
                  }
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  rows={3}
                  value={adEditForm.description}
                  onChange={(e) =>
                    setAdEditForm({
                      ...adEditForm,
                      description: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  City
                </label>
                <input
                  type="text"
                  value={adEditForm.location_city}
                  onChange={(e) =>
                    setAdEditForm({
                      ...adEditForm,
                      location_city: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Availability
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="time"
                    value={adEditForm.availability_start_time}
                    onChange={(e) =>
                      setAdEditForm({
                        ...adEditForm,
                        availability_start_time: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                  <input
                    type="time"
                    value={adEditForm.availability_end_time}
                    onChange={(e) =>
                      setAdEditForm({
                        ...adEditForm,
                        availability_end_time: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
              </div>
            </div>
            <div className="flex justify-end mt-6 space-x-3">
              <button
                onClick={() => setAdBeingEdited(null)}
                className="px-4 py-2 border rounded-lg"
              >
                Cancel
              </button>
              <button
                disabled={isSavingAd}
                onClick={async () => {
                  if (!adBeingEdited) return;
                  setIsSavingAd(true);
                  const updated =
                    await AdvertisementService.updateAdvertisement(
                      adBeingEdited.id,
                      {
                        title: adEditForm.title,
                        price_per_hour: adEditForm.price_per_hour as any,
                        description: adEditForm.description as any,
                        location_city: adEditForm.location_city as any,
                        availability_start_time:
                          adEditForm.availability_start_time as any,
                        availability_end_time:
                          adEditForm.availability_end_time as any,
                      } as any
                    );
                  setIsSavingAd(false);
                  if (updated) {
                    setAdBeingEdited(null);
                    const userAds =
                      await AdvertisementService.getUserAdvertisements(
                        userProfile!.id
                      );
                    setAdvertisements(userAds);
                  }
                }}
                className="px-5 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50"
              >
                {isSavingAd ? "Saving..." : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  const renderBookingsTab = () => (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
        {/* Header */}
        <div className="px-8 py-6 border-b border-gray-100 bg-gray-50">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-semibold text-gray-900">Bookings</h2>
              <p className="text-gray-600 mt-1">
                {userProfile?.user_type === "parent"
                  ? "Manage your childcare appointments"
                  : userProfile?.user_type === "nanny"
                  ? "Manage your childcare bookings and schedule"
                  : "Complete your profile to get started"}
              </p>
            </div>
            <div className="flex space-x-3">
              <button className="px-4 py-2 text-purple-600 border border-purple-600 rounded-lg font-medium hover:bg-purple-50 transition-colors duration-200">
                Upcoming
              </button>
              <button className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg font-medium hover:bg-gray-50 transition-colors duration-200">
                Past
              </button>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 sm:p-8">
          {/* Empty State */}
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg
                className="w-8 h-8 text-green-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              No Bookings Yet
            </h3>
            <p className="text-gray-600 mb-6 max-w-md mx-auto">
              {userProfile?.user_type === "parent"
                ? "Your upcoming childcare appointments will appear here once you make bookings."
                : userProfile?.user_type === "nanny"
                ? "Your upcoming childcare bookings will appear here once families book your services."
                : "Complete your profile to get started"}
            </p>
            <button className="bg-green-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-green-700 transition-colors duration-200 shadow-sm">
              {userProfile?.user_type === "parent"
                ? "Browse Nannies"
                : "View Available Jobs"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  const renderMessagesTab = () => (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
        {/* Header */}
        <div className="px-8 py-6 border-b border-gray-100 bg-gray-50">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-semibold text-gray-900">Messages</h2>
              <p className="text-gray-600 mt-1">
                {userProfile?.user_type === "parent"
                  ? "Communicate with your childcare providers"
                  : userProfile?.user_type === "nanny"
                  ? "Communicate with families and clients"
                  : "Complete your profile to get started"}
              </p>
            </div>
            <button className="bg-purple-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-purple-700 transition-colors duration-200 shadow-sm">
              New Message
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 sm:p-8">
          {/* Empty State */}
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg
                className="w-8 h-8 text-blue-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              No Messages Yet
            </h3>
            <p className="text-gray-600 mb-6 max-w-md mx-auto">
              {userProfile?.user_type === "parent"
                ? "Your conversations with childcare providers will appear here once you start messaging."
                : userProfile?.user_type === "nanny"
                ? "Your conversations with families will appear here once you start messaging."
                : "Complete your profile to get started"}
            </p>
            <button className="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors duration-200 shadow-sm">
              Start Messaging
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  const renderProfileTab = () => (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Welcome back, {String(displayName).split(" ")[0]}!
        </h1>
        <p className="text-gray-600">
          Manage your profile and account settings here.
        </p>
      </div>

      {/* Profile Header */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="bg-gradient-to-r from-purple-600 to-purple-700 px-8 py-8 text-white">
          <div className="flex items-center space-x-6">
            <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center border-2 border-white/30">
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt="Profile"
                  className="w-16 h-16 rounded-full"
                />
              ) : (
                <svg
                  className="w-10 h-10 text-white"
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
            <div className="flex-1">
              <h2 className="text-3xl font-bold mb-2">{displayName}</h2>
              <p className="text-purple-100 text-lg mb-3">{user?.email}</p>
              <div className="flex items-center space-x-4">
                <span
                  className={`px-4 py-2 rounded-full text-sm font-medium border border-white/30 ${
                    userProfile?.user_type === "parent"
                      ? "bg-blue-500/20 text-blue-100"
                      : userProfile?.user_type === "nanny"
                      ? "bg-green-500/20 text-green-100"
                      : "bg-yellow-500/20 text-yellow-100"
                  }`}
                >
                  {userProfile?.user_type === "parent"
                    ? "👨‍👩‍👧‍👦 Parent"
                    : userProfile?.user_type === "nanny"
                    ? "👶 Nanny"
                    : "⏳ Pending"}
                </span>
                <span className="text-purple-100 text-sm">
                  Member since{" "}
                  {userProfile?.created_at
                    ? formatDate(userProfile.created_at)
                    : "Recently"}
                </span>
              </div>
            </div>
            <button
              onClick={() => setIsEditing(!isEditing)}
              className="bg-white/20 hover:bg-white/30 px-6 py-3 rounded-lg font-medium transition-colors duration-200 border border-white/30 hover:border-white/50"
            >
              {isEditing ? "Cancel" : "Edit Profile"}
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="px-6 sm:px-8 py-6 border-b border-gray-100">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            <div className="flex items-center space-x-4">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center ${
                  userProfile?.user_type === "parent"
                    ? "bg-blue-100"
                    : userProfile?.user_type === "nanny"
                    ? "bg-green-100"
                    : "bg-gray-100"
                }`}
              >
                <span className="text-lg">
                  {userProfile?.user_type === "parent" ? "📋" : "💼"}
                </span>
              </div>
              <div>
                <p className="text-sm text-gray-500">Active</p>
                <p className="text-xl font-semibold text-gray-900">
                  {userProfile?.user_type === "parent"
                    ? "Job Ads"
                    : userProfile?.user_type === "nanny"
                    ? "Services"
                    : "Profile"}
                </p>
                <p className="text-sm text-gray-500">0 listings</p>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                <span className="text-lg">📅</span>
              </div>
              <div>
                <p className="text-sm text-gray-500">This month</p>
                <p className="text-xl font-semibold text-gray-900">Bookings</p>
                <p className="text-sm text-gray-500">0 appointments</p>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                <span className="text-lg">⭐</span>
              </div>
              <div>
                <p className="text-sm text-gray-500">Average</p>
                <p className="text-xl font-semibold text-gray-900">Rating</p>
                <p className="text-sm text-gray-500">No reviews yet</p>
              </div>
            </div>
          </div>
        </div>

        {/* Profile Form */}
        {isEditing ? (
          <div className="p-6 sm:p-8">
            <h3 className="text-2xl font-semibold mb-6 text-gray-900">
              Edit Profile
            </h3>
            <form onSubmit={handleEditSubmit} className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    value={editForm.phone}
                    onChange={(e) =>
                      setEditForm({ ...editForm, phone: e.target.value })
                    }
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="+371 2000 0000"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Location
                  </label>
                  <input
                    type="text"
                    value={editForm.location}
                    onChange={(e) =>
                      setEditForm({ ...editForm, location: e.target.value })
                    }
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="Rīga"
                  />
                </div>
                {/* Removed surname field per request */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    User Type
                  </label>
                  <select
                    value={editForm.user_type}
                    onChange={(e) => {
                      setEditForm({
                        ...editForm,
                        user_type: e.target.value as "parent" | "nanny",
                      });
                    }}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  >
                    <option value="parent">👨‍👩‍👧‍👦 Parent</option>
                    <option value="nanny">👶 Nanny</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Bio
                  </label>
                  <textarea
                    value={editForm.additional_info}
                    onChange={(e) =>
                      setEditForm({
                        ...editForm,
                        additional_info: e.target.value,
                      })
                    }
                    rows={4}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                    placeholder={
                      userProfile?.user_type === "parent"
                        ? "Tell us about your family and what you're looking for..."
                        : userProfile?.user_type === "nanny"
                        ? "Tell us about your experience and what makes you a great provider..."
                        : "Add a short bio"
                    }
                  />
                </div>
              </div>
              {/* Removed duplicate Bio section */}
              <div className="flex justify-end space-x-4 pt-4">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  disabled={isUpdating}
                  className="px-6 py-3 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isUpdating}
                  className="px-6 py-3 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 transition-colors duration-200 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                >
                  {isUpdating ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Saving...</span>
                    </>
                  ) : (
                    "Save Changes"
                  )}
                </button>
              </div>
            </form>
          </div>
        ) : (
          <div className="p-8">
            <h3 className="text-2xl font-semibold mb-6 text-gray-900">
              Profile Information
            </h3>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">
                  Full Name
                </label>
                <p className="text-gray-900 font-medium">
                  {displayName || "Not set"}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">
                  Email
                </label>
                <p className="text-gray-900 font-medium">{user?.email}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">
                  Phone Number
                </label>
                <p className="text-gray-900 font-medium">
                  {userProfile?.phone || "Not set"}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">
                  Location
                </label>
                <p className="text-gray-900 font-medium">
                  {userProfile?.location || "Not set"}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">
                  User Type
                </label>
                <p className="text-gray-900 font-medium">
                  {userProfile?.user_type === "parent"
                    ? "👨‍👩‍👧‍👦 Parent"
                    : userProfile?.user_type === "nanny"
                    ? "👶 Nanny"
                    : "⏳ Pending"}
                </p>
              </div>
              <div className="lg:col-span-2">
                <label className="block text-sm font-medium text-gray-500 mb-1">
                  Bio
                </label>
                <p className="text-gray-900 leading-relaxed">
                  {editForm.additional_info || "No bio added yet."}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Account Settings */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-8 py-6 border-b border-gray-100 bg-gray-50">
          <h3 className="text-2xl font-semibold text-gray-900">
            Account Settings
          </h3>
        </div>
        <div className="p-8">
          <div className="space-y-6">
            <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors duration-200">
              <div>
                <h4 className="font-medium text-gray-900">
                  Email Notifications
                </h4>
                <p className="text-sm text-gray-600 mt-1">
                  Receive updates about bookings and messages
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  className="sr-only peer"
                  defaultChecked
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
              </label>
            </div>
            <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors duration-200">
              <div>
                <h4 className="font-medium text-gray-900">SMS Notifications</h4>
                <p className="text-sm text-gray-600 mt-1">
                  Get text messages for urgent updates
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
              </label>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderTabContent = () => {
    switch (activeTab) {
      case "job-ads":
        return renderJobAdsTab();
      case "bookings":
        return renderBookingsTab();
      case "messages":
        return renderMessagesTab();
      case "profile":
        return renderProfileTab();
      default:
        return renderJobAdsTab();
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-gray-50 to-gray-100">
      <Header />

      <main className="flex-1 px-4 sm:px-6 py-8 sm:py-12">
        <div className="max-w-7xl mx-auto">
          {/* Tab Navigation */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-2 mb-8">
            <div className="grid grid-cols-2 sm:flex sm:space-x-2 gap-2">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex-1 flex items-center justify-center space-x-3 px-4 sm:px-6 py-3 sm:py-4 rounded-xl font-medium transition-all duration-200 text-sm sm:text-base ${
                    activeTab === tab.id
                      ? "bg-purple-600 text-white shadow-md"
                      : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                  }`}
                >
                  <span className="text-lg">{tab.icon}</span>
                  <span>{tab.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Tab Content */}
          <div className="space-y-8">{renderTabContent()}</div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
