"use client";

import { useEffect, useMemo, useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { UserService, UserProfile } from "../../lib/userService";
import { AdvertisementService } from "../../lib/advertisementService";
import LocationAutocomplete from "../../components/LocationAutocomplete";
import MultiDatePicker from "../../components/MultiDatePicker";
import { toLocalYYYYMMDD, formatDateDDMMYYYY } from "../../lib/date";
import { NANNY_SKILLS } from "../../lib/constants/skills";
import Header from "../../components/Header";
import { supabase } from "../../lib/supabase";
import Footer from "../../components/Footer";
import { Database } from "../../types/database";
import { useSupabaseUser } from "../../lib/useSupabaseUser";
import AdvertisementPreview from "../../components/AdvertisementPreview";
import BookingCalendar from "../../components/BookingCalendar";
import { BookingService } from "../../lib/bookingService";
import CancelBookingModal from "../../components/CancelBookingModal";
import ReviewModal from "../../components/ReviewModal";
import { useTranslation } from "../../components/LanguageProvider";
import { getTranslatedSkill } from "../../lib/constants/skills";
import { MessageService, Conversation, Message as ChatMessage } from "../../lib/messageService";
import ErrorBoundary from "../../components/ErrorBoundary";

type Advertisement = Database["public"]["Tables"]["advertisements"]["Row"];

interface BookingItem {
  id: string;
  booking_date: string | null;
  start_time: string | null;
  end_time: string | null;
  status: "pending" | "confirmed" | "completed" | "cancelled";
  message: string | null;
  has_review: boolean;
  counterparty_full_name: string | null;
  counterparty_id: string | null;
  advertisement_id: string | null;
  ad_type: string | null;
  cancellation_reason: string | null;
  cancellation_note: string | null;
  cancelled_at: string | null;
  parent_id: string;
  nanny_id: string;
}

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
  const [isUpdating, setIsUpdating] = useState(false);
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
  const [adBeingEdited, setAdBeingEdited] = useState<Advertisement | null>(
    null
  );
  const [isSavingAd, setIsSavingAd] = useState(false);
  const [previewAdId, setPreviewAdId] = useState<string | null>(null);
  const [bookings, setBookings] = useState<BookingItem[]>([]);
  const [pendingBookings, setPendingBookings] = useState<number>(0);
  const [selectedCalendarDate, setSelectedCalendarDate] = useState<
    string | null
  >(null);
  const selectedDateBookings = bookings.filter(
    (b) => b.booking_date && b.booking_date === selectedCalendarDate
  );
  const [bookingView, setBookingView] = useState<"upcoming" | "past">(
    "upcoming"
  );
  const [selectedBooking, setSelectedBooking] = useState<BookingItem | null>(null);
  const [cancellingBooking, setCancellingBooking] = useState<BookingItem | null>(null);
  const [reviewingBooking, setReviewingBooking] = useState<BookingItem | null>(null);
  const [respondingBookingId, setRespondingBookingId] = useState<string | null>(null);
  const [currentBookingPage, setCurrentBookingPage] = useState(1);
  const bookingsPerPage = 4;

  // Messaging state
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversation, setActiveConversation] = useState<string | null>(null);
  const [conversationMessages, setConversationMessages] = useState<ChatMessage[]>([]);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [contactEmail, setContactEmail] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [contactError, setContactError] = useState<string | null>(null);

  // Reset contact fields when switching conversations
  useEffect(() => {
    setContactEmail("");
    setContactPhone("");
    setContactError(null);
  }, [activeConversation]);
  const [unreadMessageCount, setUnreadMessageCount] = useState(0);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  // Auto-dismiss toast after 4 seconds
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 4000);
    return () => clearTimeout(t);
  }, [toast]);

  const filteredBookings = useMemo(() => {
    const todayKey = new Date();
    todayKey.setHours(0, 0, 0, 0);
    const toKey = (s?: string | null) =>
      s ? new Date(s + "T00:00:00") : null;
    const base = selectedCalendarDate ? selectedDateBookings : bookings;
    return base.filter((b) => {
      const d = toKey(b.booking_date);
      if (!d) return bookingView === "upcoming";
      const isPast = d < todayKey;
      const isUpcoming = d >= todayKey;
      if (bookingView === "past") {
        if (b.status === "cancelled") return isPast;
        return isPast;
      } else {
        if (b.status === "cancelled") return false;
        return isUpcoming;
      }
    });
  }, [bookings, selectedCalendarDate, selectedDateBookings, bookingView]);

  const totalBookingPages = Math.ceil(filteredBookings.length / bookingsPerPage);
  const paginatedBookings = filteredBookings.slice(
    (currentBookingPage - 1) * bookingsPerPage,
    currentBookingPage * bookingsPerPage
  );

  const [isDeleting, setIsDeleting] = useState(false);
  const [adEditForm, setAdEditForm] = useState({
    title: "",
    price_per_hour: 0 as number,
    description: "",
    location_city: "",
    availability_start_time: "",
    availability_end_time: "",
    skills: [] as string[],
  });
  const [editExtraLocations, setEditExtraLocations] = useState<string[]>([]);
  const [editSelectedDates, setEditSelectedDates] = useState<Date[]>([]);
  const [editPerDateTimes, setEditPerDateTimes] = useState<
    Record<string, { start: string; end: string }>
  >({});

  const isParent = userProfile?.user_type === "parent";
  const isNanny = userProfile?.user_type === "nanny";

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

  // Messaging: load conversations when messages tab is active
  useEffect(() => {
    if (activeTab !== "messages" || !userProfile?.id) return;
    let active = true;
    const loadConversations = async () => {
      const convs = await MessageService.getConversations(userProfile.id);
      if (active) setConversations(convs);
    };
    loadConversations();
    const interval = setInterval(loadConversations, 15000);
    return () => { active = false; clearInterval(interval); };
  }, [activeTab, userProfile?.id]);

  // Messaging: load messages for active conversation
  useEffect(() => {
    if (!activeConversation) return;
    let active = true;
    const loadMessages = async () => {
      setLoadingMessages(true);
      const msgs = await MessageService.getMessages(activeConversation);
      if (active) {
        setConversationMessages(msgs);
        setLoadingMessages(false);
        await MessageService.markAsRead(activeConversation);
      }
    };
    loadMessages();
    const interval = setInterval(loadMessages, 10000);
    return () => { active = false; clearInterval(interval); };
  }, [activeConversation]);

  // Messaging: auto-scroll to bottom of messages container (not the page)
  useEffect(() => {
    if (activeTab !== "messages") return;
    const container = messagesContainerRef.current;
    if (container) container.scrollTop = container.scrollHeight;
  }, [conversationMessages, activeTab]);

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

  const handleSendTemplate = useCallback(async (text: string) => {
    if (!activeConversation || sendingMessage) return;
    setSendingMessage(true);
    const msg = await MessageService.sendMessage(activeConversation, text, true);
    if (msg) {
      setConversationMessages((prev) => [...prev, msg]);
    }
    setSendingMessage(false);
  }, [activeConversation, sendingMessage]);

  const handleSendContact = useCallback(async () => {
    if (!activeConversation || sendingMessage) return;
    const email = contactEmail.trim();
    const phone = contactPhone.trim();
    if (!email && !phone) {
      setContactError(t("messages.fillAtLeastOne"));
      return;
    }
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
      setContactError(t("messages.invalidEmail"));
      return;
    }
    if (phone && !/^[+]?[\d\s\-()\u200B]{7,20}$/.test(phone.replace(/\s/g, "").replace(/[\-()]/g, ""))) {
      setContactError(t("messages.invalidPhone"));
      return;
    }
    if (phone && phone.replace(/\D/g, "").length < 7) {
      setContactError(t("messages.invalidPhone"));
      return;
    }
    setContactError(null);
    setSendingMessage(true);
    const parts: string[] = [];
    if (email) parts.push(`📧 ${email}`);
    if (phone) parts.push(`📱 ${phone}`);
    const msg = await MessageService.sendMessage(activeConversation, parts.join("\n"), false);
    if (msg) {
      setConversationMessages((prev) => [...prev, msg]);
      setContactEmail("");
      setContactPhone("");
    }
    setSendingMessage(false);
  }, [activeConversation, sendingMessage, contactEmail, contactPhone, t]);

  const formatMessageTime = useCallback((dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today.getTime() - 86400000);
    const msgDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());

    const time = date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    if (msgDate.getTime() === today.getTime()) return time;
    if (msgDate.getTime() === yesterday.getTime()) return `${t("messages.yesterday")} ${time}`;
    return `${formatDateDDMMYYYY(date)} ${time}`;
  }, [t, language]);

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

    setIsUpdating(true);

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
    } finally {
      setIsUpdating(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const monthNames =
      language === "lv"
        ? [
            "Janvāris",
            "Februāris",
            "Marts",
            "Aprīlis",
            "Maijs",
            "Jūnijs",
            "Jūlijs",
            "Augusts",
            "Septembris",
            "Oktobris",
            "Novembris",
            "Decembris",
          ]
        : language === "ru"
        ? [
            "Январь",
            "Февраль",
            "Март",
            "Апрель",
            "Май",
            "Июнь",
            "Июль",
            "Август",
            "Сентябрь",
            "Октябрь",
            "Ноябрь",
            "Декабрь",
          ]
        : [
            "January",
            "February",
            "March",
            "April",
            "May",
            "June",
            "July",
            "August",
            "September",
            "October",
            "November",
            "December",
          ];
    return `${monthNames[date.getMonth()]} ${date.getFullYear()}`;
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

  const renderJobAdsTab = () => (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
        {/* Header */}
        <div className="px-8 py-6 border-b border-gray-100 bg-gray-50">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-semibold text-gray-900">
                {t("profile.yourAdvertisement")}
              </h2>
              <p className="text-gray-600 mt-1">
                {userProfile?.user_type === "parent"
                  ? t("profile.manageChildcareJob")
                  : userProfile?.user_type === "nanny"
                  ? t("profile.manageChildcareServices")
                  : t("profile.completeProfileToStart")}
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
                    ? t("profile.createNewAd")
                    : userProfile?.user_type === "nanny"
                    ? t("profile.addService")
                    : t("profile.getStarted")}
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
                  className={`border rounded-2xl p-6 transition-all duration-200 cursor-pointer ${
                    ad.is_active
                      ? "bg-white border-purple-100 shadow-sm hover:shadow-md hover:border-purple-200"
                      : "bg-gray-50/70 border-gray-200 hover:bg-gray-50"
                  }`}
                  onClick={(e) => {
                    const target = e.target as HTMLElement;
                    // Prevent opening preview when clicking action controls inside the card
                    if (target.closest("a,button,input,select,textarea"))
                      return;
                    setPreviewAdId(ad.id);
                  }}
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
                            ? t("profile.shortTerm")
                            : t("profile.longTerm")}
                        </span>
                        <span className="flex items-center">
                          <span className="mr-1">💰</span>${ad.price_per_hour}
                          {t("ad.perHour")}
                        </span>
                        <span className="flex items-center">
                          <span className="mr-1">📍</span>
                          {ad.location_city}
                        </span>
                      </div>
                      {ad.type === "long-term" && ad.is_active && ad.updated_at && (() => {
                        const daysLeft = Math.max(0, 7 - (Date.now() - new Date(ad.updated_at).getTime()) / (1000 * 60 * 60 * 24));
                        return (
                          <div className="mt-1 text-xs text-amber-600">
                            ⏳ {Math.ceil(daysLeft)}d {t("common.remaining")}
                          </div>
                        );
                      })()}
                    </div>
                    <div className="flex items-center space-x-2">
                      {ad.is_active ? (
                        <span
                          className="inline-flex items-center px-3 py-1.5 rounded-lg border border-gray-300 bg-gray-100 text-gray-400 text-sm font-medium cursor-not-allowed"
                          title={t("ad.deactivateToEdit")}
                        >
                          {t("ad.edit")}
                        </span>
                      ) : (
                        <a
                          className="inline-flex items-center px-3 py-1.5 rounded-lg border border-purple-600 text-purple-600 text-sm font-medium hover:bg-purple-50"
                          href={`/edit-advertisement/${ad.id}`}
                          title={t("ad.edit")}
                        >
                          {t("ad.edit")}
                        </a>
                      )}
                      {ad.is_active ? (
                        <button
                          onClick={async () => {
                            const { error } = await supabase.rpc("ad_toggle", {
                              p_ad_id: ad.id,
                              p_active: false,
                            });
                            if (error) {
                              setToast({ message: t("common.error"), type: "error" });
                              return;
                            }
                            const userAds =
                              await AdvertisementService.getUserAdvertisements(
                                userProfile!.id
                              );
                            setAdvertisements(userAds);
                          }}
                          className="inline-flex items-center px-3 py-1.5 rounded-lg border border-gray-300 text-gray-700 text-sm font-medium hover:bg-gray-100"
                        >
                          {t("ad.deactivate")}
                        </button>
                      ) : (() => {
                        const anotherActive = advertisements.some((a) => a.is_active);
                        const slots = adSlotsMap[ad.id] || [];
                        const today = new Date();
                        today.setHours(0, 0, 0, 0);
                        const allExpired = ad.type === "short-term" && slots.length > 0 && slots.every(
                          (s) => new Date(s.available_date + "T00:00:00") < today
                        );
                        const noSlots = ad.type === "short-term" && slots.length === 0;
                        const blocked = anotherActive || allExpired || noSlots;
                        return (
                            <button
                              onClick={async () => {
                                if (blocked) return;
                                const { error } = await supabase.rpc("ad_toggle", {
                                  p_ad_id: ad.id,
                                  p_active: true,
                                });
                                if (error) {
                                  setToast({ message: t("common.error"), type: "error" });
                                  return;
                                }
                                const userAds =
                                  await AdvertisementService.getUserAdvertisements(
                                    userProfile!.id
                                  );
                                setAdvertisements(userAds);
                              }}
                              disabled={blocked}
                              title={
                                anotherActive
                                  ? t("ad.anotherActive")
                                  : allExpired || noSlots
                                  ? t("ad.expiredDates")
                                  : ""
                              }
                              className={
                                `inline-flex items-center px-3 py-1.5 rounded-lg border text-sm font-medium ` +
                                (blocked
                                  ? "text-gray-400 border-gray-300 cursor-not-allowed"
                                  : "text-green-700 border-green-600 hover:bg-green-50")
                              }
                            >
                              {t("ad.activate")}
                            </button>
                        );
                      })()}
                      {!ad.is_active && (
                        <button
                          onClick={async () => {
                            if (!confirm(t("ad.deleteConfirm"))) {
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
                          className="inline-flex items-center px-3 py-1.5 rounded-lg border border-red-600 text-red-700 text-sm font-medium hover:bg-red-50"
                        >
                          {t("ad.delete")}
                        </button>
                      )}
                    </div>
                  </div>
                  {!ad.is_active && (() => {
                    const slots = adSlotsMap[ad.id] || [];
                    const today = new Date();
                    today.setHours(0, 0, 0, 0);
                    const allExpired = ad.type === "short-term" && slots.length > 0 && slots.every(
                      (s) => new Date(s.available_date + "T00:00:00") < today
                    );
                    const noSlots = ad.type === "short-term" && slots.length === 0;
                    if (allExpired || noSlots) {
                      return (
                        <div className="text-xs text-amber-600 mt-1 text-right">
                          {t("ad.expiredDates")}
                        </div>
                      );
                    }
                    if (ad.type === "long-term" && ad.updated_at) {
                      const daysSince = (Date.now() - new Date(ad.updated_at).getTime()) / (1000 * 60 * 60 * 24);
                      if (daysSince >= 7) {
                        return (
                          <div className="text-xs text-blue-600 mt-1 text-right">
                            {t("ad.longTermReactivate")}
                          </div>
                        );
                      }
                    }
                    return null;
                  })()}

                  <p
                    className={`mb-4 line-clamp-3 ${
                      ad.is_active ? "text-gray-700" : "text-gray-500"
                    }`}
                  >
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
                            {getTranslatedSkill(skill, language)}
                          </span>
                        ))}
                        {ad.skills.length > 5 && (
                          <span className="px-3 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                            {t("ad.moreSkills", {
                              count: ad.skills.length - 5,
                            })}
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                  <div
                    className={`flex items-center justify-between text-sm ${
                      ad.is_active ? "text-gray-500" : "text-gray-500"
                    }`}
                  >
                    <span>
                      {t("ad.created", { date: formatDate(ad.created_at) })}
                    </span>
                    <span
                      className={
                        ad.is_active
                          ? "text-green-600 font-medium"
                          : "text-gray-500"
                      }
                    >
                      {ad.is_active ? t("ad.active") : t("ad.inactive")}
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

      {/* Edit Ad Modal disabled in favor of full edit page */}
      {false && adBeingEdited && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white w-full max-w-3xl rounded-2xl shadow-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold">Edit Advertisement</h3>
              <button
                onClick={() => setAdBeingEdited(null)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>
            {/* Reuse Create form UX for edit: type, title, desc, skills, city via autocomplete, locations, availability dates + per-date overrides */}
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Type
                  </label>
                  <select
                    value={(adBeingEdited as any)?.type || "short-term"}
                    onChange={(e) => {
                      setAdBeingEdited({
                        ...(adBeingEdited as any),
                        type: e.target.value,
                      } as any);
                    }}
                    className="w-full px-3 py-2 border rounded-lg"
                  >
                    <option value="short-term">Short-term</option>
                    <option value="long-term">Long-term</option>
                  </select>
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
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    City
                  </label>
                  <LocationAutocomplete
                    value={adEditForm.location_city || ""}
                    onChange={(v) =>
                      setAdEditForm({ ...adEditForm, location_city: v.label })
                    }
                    placeholder="Search city, country or street"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Availability (default)
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

              {/* Note: For a complete parity with create, we’d embed MultiDatePicker with per-date overrides and a small locations manager here. */}
              <p className="text-sm text-gray-500">
                Advanced date overrides and multiple locations editing can be
                added here similarly to the create flow.
              </p>
            </div>
            <div className="flex justify-end mt-6 space-x-3">
              <button
                onClick={() => setAdBeingEdited(null)}
                className="px-4 py-2 border rounded-lg"
              >
                Cancel
              </button>
              <button
                disabled={isSavingAd || adBeingEdited?.is_active}
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
      {previewAdId && (
        <AdvertisementPreview
          advertisementId={previewAdId}
          onClose={() => setPreviewAdId(null)}
        />
      )}
    </div>
  );

  // duplicate removed, see top-level definition

  const renderBookingsTab = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <BookingCalendar
            bookings={bookings}
            selectedDate={selectedCalendarDate}
            onSelectDate={(date) => setSelectedCalendarDate(date || null)}
          />
        </div>
        <div className="lg:col-span-2">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="px-8 py-5 border-b border-gray-100 bg-gray-50">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-semibold text-gray-900">
                    {t("profile.yourBookings")}
                  </h2>
                </div>
                {selectedCalendarDate && (
                  <div className="text-sm text-gray-700">
                    {t("profile.selectedDate", {
                      date: formatDateDDMMYYYY(
                        new Date(selectedCalendarDate + "T00:00:00")
                      ),
                    })}
                  </div>
                )}
              </div>
              <div className="mt-2 flex items-center justify-between">
                <div className="inline-flex rounded-xl border border-gray-200 overflow-hidden">
                  <button
                    className={`px-4 py-2 text-sm font-medium ${
                      bookingView === "upcoming"
                        ? "bg-purple-600 text-white"
                        : "bg-white text-gray-700"
                    }`}
                    onClick={() => {
                      setBookingView("upcoming");
                      setCurrentBookingPage(1);
                    }}
                  >
                    {t("bookings.upcoming")}
                  </button>
                  <button
                    className={`px-4 py-2 text-sm font-medium border-l border-gray-200 ${
                      bookingView === "past"
                        ? "bg-purple-600 text-white"
                        : "bg-white text-gray-700"
                    }`}
                    onClick={() => {
                      setBookingView("past");
                      setCurrentBookingPage(1);
                    }}
                  >
                    {t("profile.pastBookings")}
                  </button>
                </div>
                <div className="text-sm text-gray-600">
                  {pendingBookings > 0
                    ? `${pendingBookings} ${t("bookings.pending")}`
                    : t("profile.noPendingRequests")}
                </div>
              </div>
            </div>
            <div className="p-6 sm:p-8">
              {bookings.length === 0 ? (
                <div className="text-gray-600">
                  {t("profile.noBookingsYet")}
                </div>
              ) : (
                <div className="h-[304px] flex flex-col justify-between">
                  <div className={totalBookingPages > 1 ? "space-y-2" : "space-y-3"}>
                          {paginatedBookings.map((b: any) => (
                            <div
                              key={b.id}
                              onClick={() => setSelectedBooking(b)}
                              className={`w-full text-left flex items-center justify-between border border-gray-200 rounded-2xl bg-white hover:shadow-sm transition-shadow cursor-pointer ${
                                totalBookingPages > 1 ? "p-3" : "p-5"
                              }`}
                            >
                              <div className="flex items-center gap-5">
                                <div className="text-gray-900 font-medium text-base">
                                  {b.ad_type === "long-term"
                                    ? t("booking.contactRequest")
                                    : b.booking_date
                                    ? formatDateDDMMYYYY(
                                        new Date(b.booking_date + "T00:00:00")
                                      )
                                    : "No date"}
                                </div>
                                <div className="text-sm text-gray-600">
                                  {t("booking.bookingWith")} {b.counterparty_full_name || t("common.user")}
                                </div>
                              </div>
                              <div className="flex items-center gap-3">
                                {b.status === "confirmed" && (
                                  <span className="text-xs px-2.5 py-1 rounded-full bg-green-50 text-green-700 border border-green-200">
                                    {t("booking.confirmed")}
                                  </span>
                                )}
                                {b.status === "cancelled" && (
                                  <span className="text-xs px-2.5 py-1 rounded-full bg-gray-50 text-gray-700 border border-gray-200">
                                    {t("booking.cancelled")}
                                  </span>
                                )}
                                {b.status === "completed" && !b.has_review && (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setReviewingBooking(b);
                                    }}
                                    className="text-xs px-2.5 py-1 rounded-full bg-purple-50 text-purple-700 border border-purple-200 hover:bg-purple-100"
                                  >
                                    {t("review.writeReview")}
                                  </button>
                                )}
                                {b.status === "completed" && b.has_review && (
                                  <span className="text-xs px-2.5 py-1 rounded-full bg-gray-50 text-gray-600 border border-gray-200">
                                    {t("review.reviewed")}
                                  </span>
                                )}
                                {b.status === "pending" &&
                                  b.booking_date &&
                                  b.booking_date < new Date().toISOString().slice(0, 10) && (
                                    <span className="text-xs px-2.5 py-1 rounded-full bg-gray-100 text-gray-500 border border-gray-200">
                                      {t("booking.expired")}
                                    </span>
                                  )}
                                {b.status === "pending" &&
                                  userProfile?.user_type === "nanny" &&
                                  (!b.booking_date || b.booking_date >= new Date().toISOString().slice(0, 10)) && (
                                    <div
                                      className="flex gap-2"
                                      onClick={(e) => e.stopPropagation()}
                                    >
                                      <button
                                        disabled={respondingBookingId === b.id}
                                        onClick={async () => {
                                          setRespondingBookingId(b.id);
                                          try {
                                            const success =
                                              await BookingService.respond(
                                                b.id,
                                                "confirm"
                                              );
                                            if (success) {
                                              try {
                                                const convId = await MessageService.getOrCreateConversation(b.id);
                                                // Auto-send acceptance message so parent sees notification
                                                if (convId) {
                                                  const acceptMsg = b.ad_type === "long-term"
                                                    ? t("messages.contactAccepted")
                                                    : t("messages.bookingAccepted");
                                                  await MessageService.sendMessage(convId, acceptMsg, true);
                                                }
                                                if (userProfile?.id) {
                                                  const convs = await MessageService.getConversations(userProfile.id);
                                                  setConversations(convs);
                                                }
                                              } catch (err) {
                                                console.error("Error creating conversation:", err);
                                              }
                                              const { data: bdata } =
                                                await supabase.rpc(
                                                  "get_my_bookings"
                                                );
                                              setBookings((bdata as BookingItem[]) || []);
                                            }
                                          } finally {
                                            setRespondingBookingId(null);
                                          }
                                        }}
                                        className="text-xs px-2.5 py-1 rounded-full bg-green-50 text-green-700 border border-green-200 hover:bg-green-100 disabled:opacity-50"
                                      >
                                        {respondingBookingId === b.id ? "..." : t("booking.accept")}
                                      </button>
                                      <button
                                        disabled={respondingBookingId === b.id}
                                        onClick={async () => {
                                          setRespondingBookingId(b.id);
                                          try {
                                            const success =
                                              await BookingService.respond(
                                                b.id,
                                                "cancel"
                                              );
                                            if (success) {
                                              const { data: bdata } =
                                                await supabase.rpc(
                                                  "get_my_bookings"
                                                );
                                              setBookings((bdata as BookingItem[]) || []);
                                            }
                                          } finally {
                                            setRespondingBookingId(null);
                                          }
                                        }}
                                        className="text-xs px-2.5 py-1 rounded-full bg-red-50 text-red-700 border border-red-200 hover:bg-red-100 disabled:opacity-50"
                                      >
                                        {t("booking.decline")}
                                      </button>
                                    </div>
                                  )}
                                {b.status === "pending" &&
                                  userProfile?.user_type === "parent" &&
                                  (!b.booking_date || b.booking_date >= new Date().toISOString().slice(0, 10)) && (
                                    <div
                                      className="flex gap-2"
                                      onClick={(e) => e.stopPropagation()}
                                    >
                                      <span className="text-xs px-2.5 py-1 rounded-full bg-yellow-50 text-yellow-700 border border-yellow-200">
                                        {t("booking.pending")}
                                      </span>
                                      <button
                                        disabled={respondingBookingId === b.id}
                                        onClick={async () => {
                                          setRespondingBookingId(b.id);
                                          try {
                                            const success =
                                              await BookingService.respond(
                                                b.id,
                                                "cancel"
                                              );
                                            if (success) {
                                              const { data: bdata } =
                                                await supabase.rpc(
                                                  "get_my_bookings"
                                                );
                                              setBookings((bdata as BookingItem[]) || []);
                                            }
                                          } finally {
                                            setRespondingBookingId(null);
                                          }
                                        }}
                                        className="text-xs px-2.5 py-1 rounded-full bg-red-50 text-red-700 border border-red-200 hover:bg-red-100 disabled:opacity-50"
                                      >
                                        {respondingBookingId === b.id ? "..." : t("booking.cancel")}
                                      </button>
                                    </div>
                                  )}
                              </div>
                            </div>
                          ))}
                  </div>

                  {/* Pagination always at bottom */}
                  {totalBookingPages > 1 ? (
                    <div className="flex items-center justify-center gap-1 mt-2">
                      <button
                        onClick={() =>
                          setCurrentBookingPage((prev) =>
                            Math.max(prev - 1, 1)
                          )
                        }
                        disabled={currentBookingPage === 1}
                        className="px-2 py-1 text-xs border rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {t("common.back")}
                      </button>

                      <div className="flex gap-1">
                        {Array.from(
                          { length: totalBookingPages },
                          (_, i) => i + 1
                        ).map((page) => (
                          <button
                            key={page}
                            onClick={() => setCurrentBookingPage(page)}
                            className={`px-2 py-1 text-xs rounded-md ${
                              currentBookingPage === page
                                ? "bg-purple-600 text-white"
                                : "border hover:bg-gray-50"
                            }`}
                          >
                            {page}
                          </button>
                        ))}
                      </div>

                      <button
                        onClick={() =>
                          setCurrentBookingPage((prev) =>
                            Math.min(prev + 1, totalBookingPages)
                          )
                        }
                        disabled={currentBookingPage === totalBookingPages}
                        className="px-2 py-1 text-xs border rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                          {t("common.next")}
                        </button>
                      </div>
                    ) : null}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      {selectedBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setSelectedBooking(null)}
          />
          <div className="relative bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-purple-50 to-blue-50">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-semibold text-gray-900">
                    {t("booking.bookingDetails")}
                  </h3>
                  <p className="text-sm text-gray-600 mt-1">
                    {t("booking.bookingWith")}{" "}
                    {selectedBooking.counterparty_full_name || t("common.user")}
                  </p>
                </div>
                <button
                  onClick={() => setSelectedBooking(null)}
                  className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100"
                >
                  <svg
                    className="w-5 h-5"
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
            </div>
            <div className="p-6 space-y-4">
              {/* Status Badge */}
              <div className="flex items-center justify-center">
                <span
                  className={`px-4 py-2 rounded-full text-sm font-medium ${
                    selectedBooking.status === "confirmed"
                      ? "bg-green-100 text-green-800 border border-green-200"
                      : selectedBooking.status === "pending"
                      ? "bg-yellow-100 text-yellow-800 border border-yellow-200"
                      : selectedBooking.status === "cancelled"
                      ? "bg-red-100 text-red-800 border border-red-200"
                      : "bg-gray-100 text-gray-800 border border-gray-200"
                  }`}
                >
                  {selectedBooking.status === "confirmed"
                    ? t("booking.confirmed")
                    : selectedBooking.status === "pending"
                    ? t("booking.pending")
                    : selectedBooking.status === "cancelled"
                    ? t("booking.cancelled")
                    : selectedBooking.status}
                </span>
              </div>

              {/* Booking Details Grid */}
              <div className="grid grid-cols-1 gap-4">
                {selectedBooking.ad_type === "long-term" ? (
                  <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-purple-900">
                        {t("booking.contactRequest")}
                      </span>
                    </div>
                    <span className="text-sm text-purple-700">
                      {t("booking.longTermDescription")}
                    </span>
                  </div>
                ) : (
                  <>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <svg
                          className="w-5 h-5 text-purple-600"
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
                        <span className="font-medium text-gray-900">
                          {t("booking.date")}
                        </span>
                      </div>
                      <span className="text-gray-700">
                        {selectedBooking.booking_date
                          ? formatDateDDMMYYYY(
                              new Date(selectedBooking.booking_date + "T00:00:00")
                            )
                          : "—"}
                      </span>
                    </div>

                    {selectedBooking.start_time && selectedBooking.end_time && (
                      <div className="bg-gray-50 rounded-lg p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <svg
                            className="w-5 h-5 text-purple-600"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                            />
                          </svg>
                          <span className="font-medium text-gray-900">
                            {t("booking.time")}
                          </span>
                        </div>
                        <span className="text-gray-700">
                          {selectedBooking.start_time} - {selectedBooking.end_time}
                        </span>
                      </div>
                    )}
                  </>
                )}
              </div>
              {/* Message from parent */}
              <div>
                <div className="text-gray-600 mb-1">{t("booking.message")}</div>
                <div className="p-2 rounded-lg bg-gray-50 border border-gray-200 min-h-[60px]">
                  {selectedBooking.message ? (
                    <p className="text-gray-700 whitespace-pre-wrap">
                      {selectedBooking.message}
                    </p>
                  ) : (
                    <p className="text-gray-400 italic">
                      {t("booking.noMessage")}
                    </p>
                  )}
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">
                  {t("booking.counterparty")}
                </span>
                <div className="flex items-center gap-2">
                  <span className="font-medium">
                    {selectedBooking.counterparty_full_name || "User"}
                  </span>
                  {/* Show "View Profile" button for nannies viewing pending bookings from parents */}
                  {isNanny &&
                    selectedBooking.status === "pending" &&
                    selectedBooking.counterparty_id && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          router.push(
                            `/user/${selectedBooking.counterparty_id}`
                          );
                        }}
                        className="px-3 py-1 text-xs bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition-colors border border-purple-200"
                      >
                        {t("ad.viewProfile")}
                      </button>
                    )}
                </div>
              </div>
              {selectedBooking.status === "cancelled" &&
                selectedBooking.cancellation_reason && (
                  <div className="border-t border-gray-100 pt-3 mt-3">
                    <div className="space-y-3">
                      <div>
                        <div className="text-gray-600 mb-1">
                          {t("booking.cancellationReason")}
                        </div>
                        <div className="text-sm font-medium text-red-700 bg-red-50 px-2 py-1 rounded border border-red-200">
                          {selectedBooking.cancellation_reason}
                        </div>
                      </div>
                      {selectedBooking.cancellation_note && (
                        <div>
                          <div className="text-gray-600 mb-1">
                            {t("booking.cancellationNote")}
                          </div>
                          <div className="p-2 rounded-lg bg-red-50 border border-red-200 text-sm text-red-900">
                            {selectedBooking.cancellation_note}
                          </div>
                        </div>
                      )}
                      {selectedBooking.cancelled_at && (
                        <div className="flex items-center justify-between">
                          <span className="text-gray-600">
                            {t("booking.cancelledAt")}
                          </span>
                          <span className="text-sm text-gray-700">
                            {new Date(
                              selectedBooking.cancelled_at
                            ).toLocaleString()}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
            </div>
            <div className="px-5 py-3 border-t border-gray-100 flex justify-between gap-2">
              {selectedBooking?.status === "completed" &&
                !selectedBooking.has_review && (
                  <button
                    className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                    onClick={() => {
                      setReviewingBooking(selectedBooking);
                      setSelectedBooking(null);
                    }}
                  >
                    {t("review.writeReview")}
                  </button>
                )}
              {selectedBooking?.status === "confirmed" &&
                (() => {
                  const bookingDate = selectedBooking.booking_date;
                  if (!bookingDate) return false;
                  const today = new Date();
                  today.setHours(0, 0, 0, 0);
                  const bookingDay = new Date(bookingDate + "T00:00:00");
                  return bookingDay >= today; // Only show cancel for today or future bookings
                })() && (
                  <button
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                    onClick={() => {
                      setCancellingBooking(selectedBooking);
                      setSelectedBooking(null);
                    }}
                  >
                    {t("booking.cancelBooking")}
                  </button>
                )}

              <div
                className={(() => {
                  if (
                    selectedBooking?.status === "completed" &&
                    !selectedBooking.has_review
                  ) {
                    return ""; // Review button takes space
                  }
                  if (selectedBooking?.status === "confirmed") {
                    const bookingDate = selectedBooking.booking_date;
                    if (!bookingDate) return "w-full flex justify-end";
                    const today = new Date();
                    today.setHours(0, 0, 0, 0);
                    const bookingDay = new Date(bookingDate + "T00:00:00");
                    // If confirmed and future booking, cancel button will show, so don't take full width
                    if (bookingDay >= today) return "";
                  }
                  // For all other cases (past confirmed, pending, cancelled), take full width
                  return "w-full flex justify-end";
                })()}
              >
                <button
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                  onClick={() => setSelectedBooking(null)}
                >
                  {t("common.close")}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {cancellingBooking && (
        <CancelBookingModal
          booking={cancellingBooking}
          userType={userProfile?.user_type as any}
          onClose={() => setCancellingBooking(null)}
          onSuccess={async () => {
            // Reload bookings after successful cancellation
            try {
              const { data: bdata } = await supabase.rpc("get_my_bookings");
              setBookings((bdata as BookingItem[]) || []);
            } catch (error) {
              console.error("Error reloading bookings:", error);
            }
          }}
        />
      )}
      {reviewingBooking &&
        reviewingBooking.counterparty_id && (
          <ReviewModal
            bookingId={reviewingBooking.id}
            advertisementId={reviewingBooking.advertisement_id}
            revieweeId={reviewingBooking.counterparty_id}
            revieweeName={reviewingBooking.counterparty_full_name || "User"}
            onClose={() => setReviewingBooking(null)}
            onSuccess={async () => {
              // Reload bookings after successful review
              try {
                const { data: bdata } = await supabase.rpc("get_my_bookings");
                setBookings((bdata as BookingItem[]) || []);
              } catch (error) {
                console.error("Error reloading bookings:", error);
              }
              setReviewingBooking(null);
            }}
          />
        )}
    </div>
  );

  const renderMessagesTab = () => {
    const activeConvData = conversations.find((c) => c.id === activeConversation);
    const templates = [
      t("messages.template1"),
      t("messages.template2"),
      t("messages.template3"),
    ];

    return (
      <div className="space-y-6">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
          {conversations.length === 0 ? (
            /* Empty State */
            <div className="text-center py-16 px-8">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                {t("messages.noConversations")}
              </h3>
              <p className="text-gray-600 max-w-md mx-auto">
                {t("messages.noConversationsDesc")}
              </p>
            </div>
          ) : (
            /* Conversation Layout */
            <div className="flex flex-col md:flex-row h-auto md:h-[600px]">
              {/* Left sidebar - conversation list */}
              <div className="w-full md:w-80 border-b md:border-b-0 md:border-r border-gray-200 overflow-y-auto flex-shrink-0 max-h-60 md:max-h-none">
                {conversations.map((conv) => (
                  <button
                    key={conv.id}
                    onClick={() => setActiveConversation(conv.id)}
                    className={`w-full text-left px-4 py-3 border-b border-gray-100 hover:bg-gray-50 transition-colors ${
                      activeConversation === conv.id ? "bg-purple-50 border-l-4 border-l-purple-600" : ""
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      {/* Avatar */}
                      {conv.counterparty_picture ? (
                        <img
                          src={conv.counterparty_picture}
                          alt=""
                          className="w-10 h-10 rounded-full object-cover flex-shrink-0"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0">
                          <span className="text-purple-600 font-semibold text-sm">
                            {(conv.counterparty_name || "?")[0].toUpperCase()}
                          </span>
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-gray-900 text-sm truncate">
                            {conv.counterparty_name}
                          </span>
                          {conv.unread_count > 0 && (
                            <span className="bg-purple-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center flex-shrink-0">
                              {conv.unread_count}
                            </span>
                          )}
                        </div>
                        {conv.last_message && (
                          <p className="text-xs text-gray-500 truncate mt-0.5">
                            {conv.last_message}
                          </p>
                        )}
                        {conv.booking_date && (
                          <p className="text-xs text-gray-400 mt-0.5">
                            {t("messages.bookingOn")} {formatDateDDMMYYYY(new Date(conv.booking_date + "T00:00:00"))}
                          </p>
                        )}
                        {conv.booking_status === "cancelled" && (
                          <span className="text-xs text-red-500 font-medium">{t("booking.cancelled")}</span>
                        )}
                      </div>
                    </div>
                  </button>
                ))}
              </div>

              {/* Right panel - messages */}
              <div className="flex-1 flex flex-col min-w-0">
                {!activeConversation ? (
                  <div className="flex-1 flex items-center justify-center text-gray-400 text-sm">
                    {t("messages.selectConversation")}
                  </div>
                ) : (
                  <>
                    {/* Conversation header */}
                    {activeConvData && (
                      <div className="px-4 py-3 border-b border-gray-200 bg-gray-50 flex items-center gap-3">
                        {activeConvData.counterparty_picture ? (
                          <img
                            src={activeConvData.counterparty_picture}
                            alt=""
                            className="w-8 h-8 rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center">
                            <span className="text-purple-600 font-semibold text-xs">
                              {(activeConvData.counterparty_name || "?")[0].toUpperCase()}
                            </span>
                          </div>
                        )}
                        <span className="font-medium text-gray-900 text-sm">
                          {activeConvData.counterparty_name}
                        </span>
                      </div>
                    )}

                    {/* Message history */}
                    <div ref={messagesContainerRef} className="flex-1 overflow-y-auto p-4 space-y-3">
                      {loadingMessages && conversationMessages.length === 0 && (
                        <div className="text-center text-gray-400 text-sm py-8">
                          Loading...
                        </div>
                      )}
                      {conversationMessages.map((msg) => {
                        const isOwn = msg.sender_id === user?.id;
                        return (
                          <div
                            key={msg.id}
                            className={`flex ${isOwn ? "justify-end" : "justify-start"}`}
                          >
                            <div
                              className={`max-w-[70%] px-4 py-2 rounded-2xl ${
                                isOwn
                                  ? "bg-purple-600 text-white rounded-br-md"
                                  : "bg-gray-100 text-gray-900 rounded-bl-md"
                              }`}
                            >
                              <p className="text-sm whitespace-pre-wrap break-words">{msg.content}</p>
                              <p className={`text-xs mt-1 ${isOwn ? "text-purple-200" : "text-gray-400"}`}>
                                {formatMessageTime(msg.created_at)}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                      <div ref={messagesEndRef} />
                    </div>

                    {/* Bottom action panel - 3 states */}
                    {(() => {
                      if (activeConvData?.booking_status === "cancelled") {
                        return (
                          <div className="p-4 border-t border-gray-200 text-center text-sm text-gray-500 bg-gray-50">
                            {t("messages.conversationClosed")}
                          </div>
                        );
                      }
                      const myMsgs = conversationMessages.filter(m => m.sender_id === user?.id);
                      const sentTemplate = myMsgs.some(m => m.is_template);
                      const sentContact = myMsgs.some(m => !m.is_template);

                      if (sentContact) {
                        // State 3: done
                        return (
                          <div className="p-4 border-t border-gray-100 bg-green-50 flex items-start gap-3">
                            <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                              <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                            </div>
                            <div>
                              <p className="text-sm font-semibold text-green-800">{t("messages.contactShared")}</p>
                              <p className="text-xs text-green-600 mt-0.5">{t("messages.contactSharedDesc")}</p>
                            </div>
                          </div>
                        );
                      }

                      if (sentTemplate) {
                        // State 2: share contact info
                        return (
                          <div className="p-4 border-t border-gray-100 bg-purple-50/50">
                            <p className="text-sm font-semibold text-gray-800 mb-0.5">{t("messages.shareContact")}</p>
                            <p className="text-xs text-gray-500 mb-3">{t("messages.shareContactDesc")}</p>
                            <div className="space-y-2">
                              <input
                                type="email"
                                value={contactEmail}
                                onChange={(e) => { setContactEmail(e.target.value); setContactError(null); }}
                                placeholder={t("messages.emailPlaceholder")}
                                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-400 bg-white"
                              />
                              <input
                                type="tel"
                                value={contactPhone}
                                onChange={(e) => { setContactPhone(e.target.value); setContactError(null); }}
                                placeholder={t("messages.phonePlaceholder")}
                                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-400 bg-white"
                              />
                              {contactError && (
                                <p className="text-xs text-red-500">{contactError}</p>
                              )}
                              <button
                                onClick={handleSendContact}
                                disabled={sendingMessage}
                                className="w-full py-2 bg-purple-600 text-white text-sm font-medium rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                {sendingMessage ? "..." : t("messages.shareContactBtn")}
                              </button>
                            </div>
                          </div>
                        );
                      }

                      // State 1: choose a connect template
                      return (
                        <div className="p-4 border-t border-gray-100 bg-gray-50">
                          <p className="text-xs text-gray-400 mb-3">{t("messages.templatesOnly")}</p>
                          <div className="flex flex-col gap-2">
                            {templates.map((tmpl, i) => (
                              <button
                                key={i}
                                onClick={() => handleSendTemplate(tmpl)}
                                disabled={sendingMessage}
                                className="w-full text-left text-sm px-4 py-2.5 bg-white border border-purple-200 text-purple-700 rounded-xl hover:bg-purple-50 hover:border-purple-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium shadow-sm"
                              >
                                {tmpl}
                              </button>
                            ))}
                          </div>
                        </div>
                      );
                    })()}
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  const displayNameFromProfile =
    [userProfile?.name, (userProfile as any)?.surname]
      .filter(Boolean)
      .join(" ") ||
    user?.email ||
    "User";

  const renderProfileTab = () => (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
        {/* Profile Form */}
        {isEditing ? (
          <div className="p-6 sm:p-8">
            <h3 className="text-2xl font-semibold mb-6 text-gray-900">
              {t("profile.editProfile")}
            </h3>
            <form onSubmit={handleEditSubmit} className="space-y-6">
              {/* Account type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  {t("profile.accountType")}
                </label>
                <div className="flex gap-3">
                  {(["nanny", "parent"] as const).map((role) => (
                    <button
                      key={role}
                      type="button"
                      onClick={() => setEditForm({ ...editForm, user_type: role })}
                      className={`flex-1 py-3 rounded-xl border-2 font-medium text-sm transition-all ${
                        editForm.user_type === role
                          ? "border-purple-500 bg-purple-50 text-purple-700"
                          : "border-gray-200 bg-white text-gray-500 hover:border-gray-300"
                      }`}
                    >
                      {role === "nanny" ? t("profile.nanny") : t("profile.parent")}
                    </button>
                  ))}
                </div>
                {editForm.user_type !== userProfile?.user_type && (
                  <p className="text-xs text-amber-600 mt-2 flex items-center gap-1">
                    <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/></svg>
                    {t("profile.roleChangeWarning")}
                  </p>
                )}
              </div>
              {/* Photo upload hint */}
              <div className="flex items-center gap-3 text-sm text-gray-500">
                <svg className="w-4 h-4 text-purple-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
                <span>
                  <button type="button" onClick={() => photoInputRef.current?.click()} disabled={uploadingPhoto} className="text-purple-600 hover:underline font-medium">
                    {userProfile?.picture ? "Change photo" : t("profile.uploadPhoto")}
                  </button>
                  {userProfile?.picture && (
                    <>
                      {" · "}
                      <button type="button" onClick={handleRemovePhoto} disabled={uploadingPhoto} className="text-red-500 hover:underline">
                        {t("profile.removePhoto")}
                      </button>
                    </>
                  )}
                  {uploadingPhoto && <span className="ml-2 text-gray-400">uploading…</span>}
                </span>
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t("profile.phoneNumber")}
                  </label>
                  <input
                    type="tel"
                    value={editForm.phone}
                    onChange={(e) => {
                      const value = e.target.value;
                      // Only allow numbers, spaces, +, -, and parentheses
                      if (
                        /^[\d\s\+\-\(\)]*$/.test(value) &&
                        value.length <= 20
                      ) {
                        setEditForm({ ...editForm, phone: value });
                      }
                    }}
                    maxLength={20}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder="+371 2000 0000"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    {editForm.phone.length}/20 characters
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t("profile.location")}
                  </label>
                  <LocationAutocomplete
                    value={editForm.location}
                    onChange={(next) =>
                      setEditForm({ ...editForm, location: next.label })
                    }
                    placeholder="Rīga"
                  />
                </div>
                <div className="lg:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t("profile.bio")}
                  </label>
                  <textarea
                    value={editForm.additional_info}
                    onChange={(e) => {
                      const value = e.target.value;
                      if (value.length <= 1000) {
                        setEditForm({
                          ...editForm,
                          additional_info: value,
                        });
                      }
                    }}
                    rows={4}
                    maxLength={1000}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                    placeholder={
                      userProfile?.user_type === "parent"
                        ? t("profile.parentBioPlaceholder")
                        : userProfile?.user_type === "nanny"
                        ? t("profile.nannyBioPlaceholder")
                        : t("profile.addBio")
                    }
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    {editForm.additional_info.length}/1000 characters
                  </p>
                </div>
              </div>
              {/* Removed duplicate Bio section */}
              <div className="flex justify-end space-x-4 pt-4">
                <button
                  type="button"
                  onClick={async () => {
                    if (!user?.id || isDeleting) return;
                    const sure = confirm(t("profile.deleteAccountConfirm"));
                    if (!sure) return;
                    setIsDeleting(true);
                    try {
                      // Call API to delete profile + auth user (service role)
                      const token = (await supabase.auth.getSession()).data
                        .session?.access_token;
                      const resp = await fetch("/api/account/delete", {
                        method: "POST",
                        headers: {
                          "content-type": "application/json",
                          authorization: token ? `Bearer ${token}` : "",
                        },
                        body: JSON.stringify({ userId: user.id }),
                      });
                      if (!resp.ok) {
                        const body = await resp.json().catch(() => ({} as any));
                        alert(body?.error || t("profile.deleteAccountFailed"));
                        return;
                      }
                      await supabase.auth.signOut();
                      window.location.replace("/");
                    } finally {
                      setIsDeleting(false);
                    }
                  }}
                  disabled={isUpdating || isDeleting}
                  className="px-6 py-3 border border-red-300 text-red-700 rounded-lg font-medium hover:bg-red-50 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isDeleting
                    ? t("profile.deleting")
                    : t("profile.deleteAccount")}
                </button>
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  disabled={isUpdating}
                  className="px-6 py-3 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {t("profile.cancel")}
                </button>
                <button
                  type="submit"
                  disabled={isUpdating}
                  className="px-6 py-3 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 transition-colors duration-200 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                >
                  {isUpdating ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>{t("profile.saving")}</span>
                    </>
                  ) : (
                    t("profile.saveChanges")
                  )}
                </button>
              </div>
            </form>
          </div>
        ) : (
          <div className="p-8">
            <h3 className="text-xl font-semibold mb-6 text-gray-900">
              {t("profile.profileInformation")}
            </h3>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div className="flex items-start gap-3 p-4 rounded-xl bg-gray-50 border border-gray-100">
                <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/></svg>
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-500 mb-0.5">{t("profile.phoneNumber")}</p>
                  <p className="text-gray-900 font-medium text-sm">{userProfile?.phone || t("profile.notSet")}</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-4 rounded-xl bg-gray-50 border border-gray-100">
                <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-500 mb-0.5">{t("profile.location")}</p>
                  <p className="text-gray-900 font-medium text-sm">{userProfile?.location || t("profile.notSet")}</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-4 rounded-xl bg-gray-50 border border-gray-100">
                <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/></svg>
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-500 mb-0.5">{t("profile.email")}</p>
                  <p className="text-gray-900 font-medium text-sm">{user?.email}</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-4 rounded-xl bg-gray-50 border border-gray-100">
                <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-500 mb-0.5">{t("profile.memberSince")}</p>
                  <p className="text-gray-900 font-medium text-sm">
                    {userProfile?.created_at ? formatDate(userProfile.created_at) : t("profile.recently")}
                  </p>
                </div>
              </div>
              <div className="lg:col-span-2 flex items-start gap-3 p-4 rounded-xl bg-gray-50 border border-gray-100">
                <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
                </div>
                <div className="flex-1">
                  <p className="text-xs font-medium text-gray-500 mb-0.5">{t("profile.bio")}</p>
                  <p className="text-gray-900 leading-relaxed text-sm">
                    {editForm.additional_info || t("profile.noBioAdded")}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Account Settings */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-8 py-6 border-b border-gray-100 bg-gray-50">
          <h3 className="text-2xl font-semibold text-gray-900">
            {t("profile.accountSettings")}
          </h3>
        </div>
        <div className="p-8">
          <div className="space-y-6">
            <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors duration-200">
              <div>
                <h4 className="font-medium text-gray-900">
                  {t("profile.emailNotifications")}
                </h4>
                <p className="text-sm text-gray-600 mt-1">
                  {t("profile.emailNotificationsDesc")}
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
                <h4 className="font-medium text-gray-900">
                  {t("profile.smsNotifications")}
                </h4>
                <p className="text-sm text-gray-600 mt-1">
                  {t("profile.smsNotificationsDesc")}
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
                      {t("profile.memberSince")} {formatDate(userProfile.created_at)}
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
