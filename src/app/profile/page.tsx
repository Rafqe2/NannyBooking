"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { UserService, UserProfile } from "../../lib/userService";
import { AdvertisementService } from "../../lib/advertisementService";
import { toLocalYYYYMMDD, formatMonthYear } from "../../lib/date";
import Header from "../../components/Header";
import { supabase } from "../../lib/supabase";
import Footer from "../../components/Footer";
import { Database } from "../../types/database";
import { useSupabaseUser } from "../../lib/useSupabaseUser";
import { useTranslation } from "../../components/LanguageProvider";
import { MessageService } from "../../lib/messageService";
import ErrorBoundary from "../../components/ErrorBoundary";
import { BookingItem } from "../../types/booking";
import JobAdsTab from "../../components/profile/JobAdsTab";
import BookingsTab from "../../components/profile/BookingsTab";
import MessagesTab from "../../components/profile/MessagesTab";
import ProfileTab from "../../components/profile/ProfileTab";

type Advertisement = Database["public"]["Tables"]["advertisements"]["Row"];

export default function ProfilePage() {
  const { user, isLoading } = useSupabaseUser();
  const router = useRouter();
  const { t, language } = useTranslation();
  const oauthAvatarUrl =
    (user?.user_metadata as any)?.avatar_url ||
    (user?.user_metadata as any)?.picture ||
    null;
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [advertisements, setAdvertisements] = useState<Advertisement[]>([]);
  const [adSlotsMap, setAdSlotsMap] = useState<Record<string, { available_date: string }[]>>({});
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [showAvatarModal, setShowAvatarModal] = useState(false);
  const photoInputRef = useRef<HTMLInputElement>(null);
  const [toast, setToast] = useState<{ message: string; type: "error" | "success" } | null>(null);
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
  const [bookings, setBookings] = useState<BookingItem[]>([]);
  const [pendingBookings, setPendingBookings] = useState<number>(0);
  const [unreadMessageCount, setUnreadMessageCount] = useState(0);

  const isParent = userProfile?.user_type === "parent";

  // Read tab from URL query parameter - must be before any early returns
  useEffect(() => {
    // Read tab from URL query parameter
    const updateTabFromUrl = () => {
      if (typeof window !== "undefined") {
        const params = new URLSearchParams(window.location.search);
        const tab = params.get("tab");
        if (
          tab === "job-ads" ||
          tab === "bookings" ||
          tab === "messages" ||
          tab === "profile"
        ) {
          setActiveTab(tab);
        }
      }
    };

    updateTabFromUrl();

    // Listen for popstate events (back/forward navigation)
    const handlePopState = () => updateTabFromUrl();

    // Listen for custom tab change events from header dropdown
    const handleTabChange = (e: CustomEvent) => {
      const tab = e.detail?.tab;
      if (
        tab === "job-ads" ||
        tab === "bookings" ||
        tab === "messages" ||
        tab === "profile"
      ) {
        setActiveTab(tab);
      }
    };

    if (typeof window !== "undefined") {
      window.addEventListener("popstate", handlePopState);
      window.addEventListener(
        "profileTabChange",
        handleTabChange as EventListener
      );

      return () => {
        window.removeEventListener("popstate", handlePopState);
        window.removeEventListener(
          "profileTabChange",
          handleTabChange as EventListener
        );
      };
    }
  }, []);

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
            additional_info: profile.additional_info || profile.bio || "",
            phone: profile.phone || "",
            location: profile.location || "",
          });

          // Load user advertisements, auto-disable expired short-term ones
          let userAds = await AdvertisementService.getUserAdvertisements(
            profile.id
          );
          try {
            for (const ad of userAds) {
              if (ad.type === "short-term" && ad.is_active) {
                // Trigger server-side check which auto-disables if all dates are past
                await supabase.rpc("update_ad_active_status", {
                  p_ad_id: ad.id,
                });
              }
              if (ad.type === "long-term" && ad.is_active && ad.updated_at) {
                // Auto-deactivate long-term ads after 7 days of being active
                const activatedAt = new Date(ad.updated_at);
                const daysSince = (Date.now() - activatedAt.getTime()) / (1000 * 60 * 60 * 24);
                if (daysSince >= 7) {
                  await supabase.rpc("ad_toggle", { p_ad_id: ad.id, p_active: false });
                }
              }
            }
            // Reload after potential changes
            userAds = await AdvertisementService.getUserAdvertisements(
              profile.id
            );
            setAdvertisements(userAds);
            // Load availability slots for short-term ads to check expiration
            const slotsMap: Record<string, { available_date: string }[]> = {};
            for (const ad of userAds) {
              if (ad.type === "short-term") {
                const slots = await AdvertisementService.getAvailabilitySlots(ad.id);
                slotsMap[ad.id] = slots;
              }
            }
            setAdSlotsMap(slotsMap);
          } catch {
            setAdvertisements(userAds);
          }

          // Auto-complete confirmed bookings with past dates
          try {
            await supabase.rpc("auto_complete_past_bookings");
          } catch (err) {
            console.error("Error auto-completing bookings:", err);
          }

          // Auto-cancel pending bookings whose date has passed
          try {
            await supabase.rpc("auto_cancel_expired_pending_bookings");
          } catch (err) {
            console.error("Error auto-cancelling expired bookings:", err);
          }

          // Load bookings + pending count
          try {
            const { data: bdata, error: berror } = await supabase.rpc(
              "get_my_bookings"
            );
            if (berror) {
              console.error("Error loading bookings:", berror);
            }
            setBookings((bdata as BookingItem[]) || []);
          } catch (error) {
            console.error("Exception loading bookings:", error);
          }
          try {
            const { data: pcount, error: perror } = await supabase.rpc(
              "get_pending_booking_count_for_me"
            );
            if (perror) {
              console.error("Error loading pending count:", perror);
            }
            setPendingBookings(Number(pcount || 0));
          } catch (error) {
            console.error("Exception loading pending count:", error);
          }
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

  // Messaging: poll unread count
  useEffect(() => {
    if (!user?.id) return;
    let active = true;
    const loadUnread = async () => {
      const count = await MessageService.getUnreadCount();
      if (active) setUnreadMessageCount(count);
    };
    loadUnread();
    const interval = setInterval(loadUnread, 30000);
    return () => { active = false; clearInterval(interval); };
  }, [user?.id]);

  // Auto-dismiss toast after 4 seconds
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 4000);
    return () => clearTimeout(t);
  }, [toast]);

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
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="text-center">
          <p className="text-gray-700 mb-4">Redirecting to login…</p>
          <div className="w-8 h-8 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
        </div>
      </div>
    );
  }

  // Avoid flashing placeholders or empty sections until profile and ads are fully loaded
  if (isLoadingProfile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your profile…</p>
        </div>
      </div>
    );
  }

  const displayAvatar = userProfile?.picture || oauthAvatarUrl;

  const handlePhotoUpload = async (file: File) => {
    if (!user?.id) return;
    if (file.size > 2 * 1024 * 1024) {
      setToast({ message: t("profile.photoTooLarge"), type: "error" });
      return;
    }
    setUploadingPhoto(true);
    try {
      const filePath = `${user.id}/avatar`;
      const { error: uploadError } = await supabase.storage
        .from("Avatars")
        .upload(filePath, file, { upsert: true, contentType: file.type });
      if (uploadError) throw uploadError;
      const { data: { publicUrl } } = supabase.storage
        .from("Avatars")
        .getPublicUrl(filePath);
      const url = `${publicUrl}?t=${Date.now()}`;
      await UserService.updateProfileById(user.id, { picture: url });
      setUserProfile((prev) => prev ? { ...prev, picture: url } : prev);
      setToast({ message: t("profile.photoUpdated"), type: "success" });
    } catch (err: any) {
      console.error("Photo upload error:", err?.message, err);
      setToast({ message: err?.message || t("profile.photoError"), type: "error" });
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleRemovePhoto = async () => {
    if (!user?.id) return;
    setUploadingPhoto(true);
    try {
      await supabase.storage.from("Avatars").remove([`${user.id}/avatar`]);
      await supabase.from("users").update({ picture: null, updated_at: new Date().toISOString() }).eq("id", user.id);
      setUserProfile((prev) => prev ? { ...prev, picture: undefined } : prev);
    } catch {
      setToast({ message: t("profile.photoError"), type: "error" });
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user?.id) {
      console.error("No user id found");
      return;
    }

    try {
      const roleChanged = editForm.user_type !== userProfile?.user_type;

      const updatedProfile = await UserService.updateProfileById(user.id, {
        name: editForm.name,
        user_type: editForm.user_type,
        additional_info: editForm.additional_info,
        phone: editForm.phone,
        location: editForm.location,
      });

      if (updatedProfile) {
        // Deactivate all ads if the user changed their role
        if (roleChanged && advertisements.length > 0) {
          await supabase
            .from("advertisements")
            .update({ is_active: false })
            .eq("user_id", user.id);
          setAdvertisements((prev) => prev.map((ad) => ({ ...ad, is_active: false })));
        }

        setUserProfile(updatedProfile);
        setIsEditing(false);

        // Refresh the user profile to ensure UI reflects changes
        const refreshedProfile = await UserService.getUserByEmail(user.email!);
        if (refreshedProfile) {
          setUserProfile(refreshedProfile);
        }
      }
    } catch (error) {
      console.error("Error updating profile:", error);
    }
  };

  const tabs = [
    {
      id: "job-ads",
      label: t("profile.yourAdvertisement"),
      icon: isParent ? "📋" : "💼",
    },
    {
      id: "bookings",
      label: t("profile.bookings") + (pendingBookings > 0 ? ` (${pendingBookings})` : ""),
      icon: pendingBookings > 0 ? "⚠️" : "📅",
    },
    { id: "messages", label: t("profile.messages") + (unreadMessageCount > 0 ? ` (${unreadMessageCount})` : ""), icon: "💬" },
    { id: "profile", label: t("profile.profile"), icon: "👤" },
  ] as const;

  const renderTabContent = () => {
    switch (activeTab) {
      case "job-ads":
        return <JobAdsTab userProfile={userProfile} advertisements={advertisements} adSlotsMap={adSlotsMap} setAdvertisements={setAdvertisements} setToast={setToast} />;
      case "bookings":
        return <BookingsTab userProfile={userProfile} user={user} bookings={bookings} pendingBookings={pendingBookings} setBookings={setBookings} />;
      case "messages":
        return <MessagesTab userProfile={userProfile} user={user} />;
      case "profile":
        return <ProfileTab userProfile={userProfile} setUserProfile={setUserProfile} user={user} advertisements={advertisements} setAdvertisements={setAdvertisements} isEditing={isEditing} setIsEditing={setIsEditing} uploadingPhoto={uploadingPhoto} editForm={editForm} setEditForm={setEditForm} photoInputRef={photoInputRef} handlePhotoUpload={handlePhotoUpload} handleRemovePhoto={handleRemovePhoto} handleEditSubmit={handleEditSubmit} setToast={setToast} />;
      default:
        return <JobAdsTab userProfile={userProfile} advertisements={advertisements} adSlotsMap={adSlotsMap} setAdvertisements={setAdvertisements} setToast={setToast} />;
    }
  };

  const displayNameFromProfile =
    [userProfile?.name, (userProfile as any)?.surname]
      .filter(Boolean)
      .join(" ") ||
    user?.email ||
    "User";

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-gray-50 to-gray-100">
      <Header />

      {/* Toast notification */}
      {toast && (
        <div className={`fixed top-20 right-4 z-50 px-4 py-3 rounded-xl shadow-lg border text-sm font-medium animate-fade-in flex items-center gap-2 ${
          toast.type === "error" ? "bg-red-50 text-red-800 border-red-200" : "bg-green-50 text-green-800 border-green-200"
        }`}>
          {toast.message}
          <button onClick={() => setToast(null)} className="ml-2 text-gray-400 hover:text-gray-600">&times;</button>
        </div>
      )}

      <main className="flex-1 px-4 sm:px-6 py-6 sm:py-10">
        <div className="max-w-7xl mx-auto">

          {/* Persistent profile banner */}
          <div className="bg-gradient-to-r from-purple-600 via-purple-700 to-indigo-600 rounded-2xl px-6 py-5 mb-6 shadow-md">
            <div className="flex items-center gap-4">
              <div className="relative w-14 h-14 flex-shrink-0 group/avatar">
                <div className="w-14 h-14 rounded-full border-2 border-white/40 overflow-hidden bg-white/20 shadow-inner">
                  {displayAvatar ? (
                    <img src={displayAvatar} alt="avatar" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-white font-bold text-xl">
                      {displayNameFromProfile[0]?.toUpperCase() || "?"}
                    </div>
                  )}
                </div>
                {isEditing ? (
                  <button
                    type="button"
                    onClick={() => photoInputRef.current?.click()}
                    disabled={uploadingPhoto}
                    className="absolute inset-0 rounded-full bg-black/50 flex items-center justify-center opacity-0 group-hover/avatar:opacity-100 transition-opacity"
                  >
                    {uploadingPhoto ? (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
                    )}
                  </button>
                ) : displayAvatar && (
                  <button
                    type="button"
                    onClick={() => setShowAvatarModal(true)}
                    className="absolute inset-0 rounded-full bg-black/30 flex items-center justify-center opacity-0 group-hover/avatar:opacity-100 transition-opacity"
                  >
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
                  </button>
                )}
                <input
                  ref={photoInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handlePhotoUpload(file);
                    e.target.value = "";
                  }}
                />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white font-semibold text-lg leading-tight truncate">{displayNameFromProfile}</p>
                <div className="flex flex-wrap items-center gap-2 mt-1">
                  <span className={`text-xs px-2.5 py-0.5 rounded-full font-medium ${
                    userProfile?.user_type === "parent"
                      ? "bg-blue-400/30 text-blue-100"
                      : userProfile?.user_type === "nanny"
                      ? "bg-green-400/30 text-green-100"
                      : "bg-yellow-400/30 text-yellow-100"
                  }`}>
                    {userProfile?.user_type === "parent"
                      ? t("common.parent")
                      : userProfile?.user_type === "nanny"
                      ? t("common.nanny")
                      : t("userType.pending")}
                  </span>
                  {(userProfile as any)?.average_rating && Number((userProfile as any).average_rating) > 0 && (
                    <span className="text-xs text-purple-200 flex items-center gap-1">
                      <svg className="w-3.5 h-3.5 text-yellow-300 fill-current" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/></svg>
                      {Number((userProfile as any).average_rating).toFixed(1)} ({(userProfile as any).total_reviews || 0})
                    </span>
                  )}
                  {userProfile?.location && (
                    <span className="text-xs text-purple-200 flex items-center gap-1">
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
                      {userProfile.location}
                    </span>
                  )}
                  {userProfile?.created_at && (
                    <span className="text-xs text-purple-200 flex items-center gap-1">
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
                      {t("profile.memberSince")} {formatMonthYear(userProfile.created_at, language)}
                    </span>
                  )}
                </div>
              </div>
              <button
                onClick={() => { setActiveTab("profile"); setIsEditing(true); }}
                className="hidden sm:flex items-center gap-1.5 text-xs text-purple-200 hover:text-white border border-white/20 hover:border-white/40 px-3 py-1.5 rounded-lg transition-colors flex-shrink-0"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>
                {t("profile.editProfile")}
              </button>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-1.5 mb-7">
            <div className="grid grid-cols-2 sm:flex gap-1">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => {
                    setActiveTab(tab.id);
                    const url = new URL(window.location.href);
                    url.searchParams.set("tab", tab.id);
                    window.history.pushState({}, "", url.toString());
                  }}
                  className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-medium transition-all duration-150 text-sm ${
                    activeTab === tab.id
                      ? "bg-purple-600 text-white shadow-sm"
                      : "text-gray-500 hover:text-gray-800 hover:bg-gray-50"
                  }`}
                >
                  {tab.id === "job-ads" && (
                    <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
                  )}
                  {tab.id === "bookings" && (
                    <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                  )}
                  {tab.id === "messages" && (
                    <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
                  )}
                  {tab.id === "profile" && (
                    <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                  )}
                  <span className="truncate">{tab.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Tab Content */}
          <div className="space-y-8">
            <ErrorBoundary>{renderTabContent()}</ErrorBoundary>
          </div>
        </div>
      </main>

      <Footer />

      {/* Avatar lightbox */}
      {showAvatarModal && displayAvatar && (
        <div
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
          onClick={() => setShowAvatarModal(false)}
        >
          <div className="relative max-w-sm w-full" onClick={(e) => e.stopPropagation()}>
            <img
              src={displayAvatar}
              alt="Profile photo"
              className="w-full rounded-2xl object-cover shadow-2xl"
            />
            <button
              onClick={() => setShowAvatarModal(false)}
              className="absolute -top-3 -right-3 w-8 h-8 bg-white rounded-full shadow-lg flex items-center justify-center text-gray-600 hover:text-gray-900"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/></svg>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
