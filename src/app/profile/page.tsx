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
  const avatarUrl =
    (user?.user_metadata as any)?.avatar_url ||
    (user?.user_metadata as any)?.picture ||
    null;
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [advertisements, setAdvertisements] = useState<Advertisement[]>([]);
  const [adSlotsMap, setAdSlotsMap] = useState<Record<string, { available_date: string }[]>>({});
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
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
  const [messageInput, setMessageInput] = useState("");
  const [sendingMessage, setSendingMessage] = useState(false);
  const [unreadMessageCount, setUnreadMessageCount] = useState(0);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

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
            console.log("Pending count:", pcount, "Error:", perror); // Debug log
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

  // Messaging: auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [conversationMessages]);

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

  const handleSendMessage = useCallback(async () => {
    if (!activeConversation || !messageInput.trim() || sendingMessage) return;
    setSendingMessage(true);
    const msg = await MessageService.sendMessage(activeConversation, messageInput.trim());
    if (msg) {
      setConversationMessages((prev) => [...prev, msg]);
      setMessageInput("");
    }
    setSendingMessage(false);
  }, [activeConversation, messageInput, sendingMessage]);

  const handleSendTemplate = useCallback(async (text: string) => {
    if (!activeConversation || sendingMessage) return;
    setSendingMessage(true);
    const msg = await MessageService.sendMessage(activeConversation, text, true);
    if (msg) {
      setConversationMessages((prev) => [...prev, msg]);
    }
    setSendingMessage(false);
  }, [activeConversation, sendingMessage]);

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
      label: t("profile.bookings"),
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
                  className={`border rounded-xl p-6 transition-shadow duration-200 cursor-pointer ${
                    ad.is_active
                      ? "bg-white border-gray-200 hover:shadow-md"
                      : "bg-gray-50 border-gray-200"
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
                    return (allExpired || noSlots) ? (
                      <div className="text-xs text-amber-600 mt-1 text-right">
                        {t("ad.expiredDates")}
                      </div>
                    ) : null;
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
                                  {b.booking_date
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
                                  userProfile?.user_type === "nanny" && (
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
                                                await MessageService.getOrCreateConversation(b.id);
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
                                  userProfile?.user_type === "parent" && (
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
                    <div className="flex-1 overflow-y-auto p-4 space-y-3">
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

                    {/* Quick reply templates - show when no messages */}
                    {conversationMessages.length === 0 && !loadingMessages && (
                      <div className="px-4 py-3 border-t border-gray-100">
                        <p className="text-xs text-gray-500 mb-2">{t("messages.quickReplies")}</p>
                        <div className="flex flex-wrap gap-2">
                          {templates.map((tmpl, i) => (
                            <button
                              key={i}
                              onClick={() => handleSendTemplate(tmpl)}
                              disabled={sendingMessage}
                              className="text-xs px-3 py-1.5 bg-purple-50 text-purple-700 rounded-full hover:bg-purple-100 transition-colors disabled:opacity-50"
                            >
                              {tmpl}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Input area */}
                    <div className="p-3 border-t border-gray-200 flex gap-2">
                      <input
                        type="text"
                        value={messageInput}
                        onChange={(e) => setMessageInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && !e.shiftKey) {
                            e.preventDefault();
                            handleSendMessage();
                          }
                        }}
                        placeholder={t("messages.typeMessage")}
                        maxLength={1000}
                        className="flex-1 px-4 py-2 border border-gray-300 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      />
                      <button
                        onClick={handleSendMessage}
                        disabled={!messageInput.trim() || sendingMessage}
                        className="px-5 py-2 bg-purple-600 text-white rounded-full text-sm font-medium hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {t("messages.send")}
                      </button>
                    </div>
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
              <h2 className="text-3xl font-bold mb-2">
                {displayNameFromProfile}
              </h2>
              <p className="text-purple-100 text-lg mb-3">{user?.email}</p>
              <div className="flex flex-wrap items-center gap-3">
                <span
                  className={`px-3 py-1.5 rounded-full text-sm font-medium border border-white/30 ${
                    userProfile?.user_type === "parent"
                      ? "bg-blue-500/20 text-blue-100"
                      : userProfile?.user_type === "nanny"
                      ? "bg-green-500/20 text-green-100"
                      : "bg-yellow-500/20 text-yellow-100"
                  }`}
                >
                  {userProfile?.user_type === "parent"
                    ? `👨‍👩‍👧‍👦 ${t("common.parent")}`
                    : userProfile?.user_type === "nanny"
                    ? `👶 ${t("common.nanny")}`
                    : `⏳ ${t("userType.pending")}`}
                </span>
                <span className="text-purple-100 text-sm flex items-center gap-1">
                  <span>📅</span>
                  <span>
                    {t("profile.memberSince")}{" "}
                    {userProfile?.created_at
                      ? formatDate(userProfile.created_at)
                      : t("profile.recently")}
                  </span>
                </span>
                <span className="text-purple-100 text-sm flex items-center gap-1">
                  <span>⭐</span>
                  <span>
                    {t("profile.rating")}:{" "}
                    {(userProfile as any)?.average_rating && Number((userProfile as any).average_rating) > 0
                      ? `${Number((userProfile as any).average_rating).toFixed(1)} (${(userProfile as any).total_reviews || 0})`
                      : t("profile.noReviewsYet")}
                  </span>
                </span>
              </div>
            </div>
            <button
              onClick={() => setIsEditing(!isEditing)}
              className="bg-white/20 hover:bg-white/30 px-6 py-3 rounded-lg font-medium transition-colors duration-200 border border-white/30 hover:border-white/50"
            >
              {isEditing ? t("common.cancel") : t("profile.editProfile")}
            </button>
          </div>
        </div>

        {/* Profile Form */}
        {isEditing ? (
          <div className="p-6 sm:p-8">
            <h3 className="text-2xl font-semibold mb-6 text-gray-900">
              {t("profile.editProfile")}
            </h3>
            <form onSubmit={handleEditSubmit} className="space-y-6">
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
            <h3 className="text-2xl font-semibold mb-6 text-gray-900">
              {t("profile.profileInformation")}
            </h3>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">
                  {t("profile.phoneNumber")}
                </label>
                <p className="text-gray-900 font-medium">
                  {userProfile?.phone || t("profile.notSet")}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">
                  {t("profile.location")}
                </label>
                <p className="text-gray-900 font-medium">
                  {userProfile?.location || t("profile.notSet")}
                </p>
              </div>
              <div className="lg:col-span-2">
                <label className="block text-sm font-medium text-gray-500 mb-1">
                  {t("profile.bio")}
                </label>
                <p className="text-gray-900 leading-relaxed">
                  {editForm.additional_info || t("profile.noBioAdded")}
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

      <main className="flex-1 px-4 sm:px-6 py-8 sm:py-12">
        <div className="max-w-7xl mx-auto">
          {/* Tab Navigation */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-2 mb-8">
            <div className="grid grid-cols-2 sm:flex sm:space-x-2 gap-2">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => {
                    setActiveTab(tab.id);
                    // Update URL without page reload
                    const url = new URL(window.location.href);
                    url.searchParams.set("tab", tab.id);
                    window.history.pushState({}, "", url.toString());
                  }}
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
