"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useTranslation } from "../LanguageProvider";
import { supabase } from "../../lib/supabase";
import { BookingService } from "../../lib/bookingService";
import { MessageService } from "../../lib/messageService";
import { notifyBooking } from "../../lib/notifyService";
import { useNotificationCounts } from "../NotificationCountsProvider";
import BookingCalendar from "../BookingCalendar";
import BookingStatusTimeline from "../BookingStatusTimeline";
import CancelBookingModal from "../CancelBookingModal";
import ReviewModal from "../ReviewModal";
import { formatDateDDMMYYYY } from "../../lib/date";
import { BookingItem } from "../../types/booking";
import { UserProfile } from "../../lib/userService";
import { User } from "@supabase/supabase-js";

interface BookingsTabProps {
  userProfile: UserProfile | null;
  user: User | null;
  bookings: BookingItem[];
  pendingBookings: number;
  setBookings: React.Dispatch<React.SetStateAction<BookingItem[]>>;
  setToast?: (toast: { message: string; type: "error" | "success" } | null) => void;
}

// Deep-link key read by MessagesTab on mount to auto-open a conversation.
const OPEN_CONVERSATION_KEY = "nannybooking:openConversation";

export default function BookingsTab({
  userProfile,
  user,
  bookings,
  pendingBookings,
  setBookings,
  setToast,
}: BookingsTabProps) {
  const { t } = useTranslation();
  const router = useRouter();
  const { refresh: refreshCounts } = useNotificationCounts();
  const isNanny = userProfile?.user_type === "nanny";
  const bookingsPerPage = 4;

  // Reload bookings and refresh the global pending/unread badges. Called after
  // every accept/decline/withdraw/cancel so counts never go stale in place.
  const reloadBookings = async () => {
    try {
      const { data } = await supabase.rpc("get_my_bookings");
      setBookings((data as BookingItem[]) || []);
    } catch (error) {
      console.error("Error reloading bookings:", error);
    }
    refreshCounts();
  };

  // Open (or create) the conversation for a booking and jump to the Messages tab.
  const goToConversation = async (bookingId: string) => {
    try {
      const convId = await MessageService.getOrCreateConversation(bookingId);
      if (convId) {
        try {
          sessionStorage.setItem(OPEN_CONVERSATION_KEY, convId);
        } catch {}
      }
    } catch (err) {
      console.error("Error opening conversation:", err);
    }
    if (typeof window !== "undefined") {
      const url = new URL(window.location.href);
      url.searchParams.set("tab", "messages");
      window.history.pushState({}, "", url.toString());
      window.dispatchEvent(
        new CustomEvent("profileTabChange", { detail: { tab: "messages" } })
      );
    }
  };

  const [selectedCalendarDate, setSelectedCalendarDate] = useState<string | null>(null);
  const [bookingView, setBookingView] = useState<"upcoming" | "past">("upcoming");
  const [selectedBooking, setSelectedBooking] = useState<BookingItem | null>(null);
  const [cancellingBooking, setCancellingBooking] = useState<BookingItem | null>(null);
  const [reviewingBooking, setReviewingBooking] = useState<BookingItem | null>(null);
  const [respondingBookingId, setRespondingBookingId] = useState<string | null>(null);
  const [currentBookingPage, setCurrentBookingPage] = useState(1);

  const selectedDateBookings = bookings.filter(
    (b) => b.booking_date && b.booking_date === selectedCalendarDate
  );

  const filteredBookings = useMemo(() => {
    const todayKey = new Date();
    todayKey.setHours(0, 0, 0, 0);
    const toKey = (s?: string | null) =>
      s ? new Date(s + "T00:00:00") : null;
    const base = selectedCalendarDate ? selectedDateBookings : bookings;
    return base.filter((b) => {
      // Expired bookings always go to past tab
      if (b.status === "expired") return bookingView === "past";
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

  return (
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
                        ? "bg-brand-600 text-white"
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
                        ? "bg-brand-600 text-white"
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
                <div className={`text-sm ${pendingBookings > 0 ? "font-medium text-accent-dark" : "text-gray-600"}`}>
                  {pendingBookings > 0
                    ? `${pendingBookings} ${t("bookings.pending")}`
                    : t("profile.noPendingRequests")}
                </div>
              </div>
            </div>
            <div className="p-6 sm:p-8">
              {filteredBookings.length === 0 ? (
                <div className="flex flex-col items-center justify-center text-center py-10 px-4">
                  <div className="w-14 h-14 rounded-2xl bg-brand-50 flex items-center justify-center mb-4">
                    <svg className="w-7 h-7 text-brand-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <h3 className="text-base font-semibold text-gray-900 mb-1">
                    {bookingView === "past"
                      ? t("empty.bookings.past.title")
                      : t("empty.bookings.upcoming.title")}
                  </h3>
                  <p className="text-sm text-gray-500 max-w-xs mb-5">
                    {bookingView === "past"
                      ? t("empty.bookings.past.desc")
                      : t("empty.bookings.upcoming.desc")}
                  </p>
                  {bookingView !== "past" && (
                    <button
                      onClick={() => router.push("/")}
                      className="inline-flex items-center gap-2 bg-brand-600 text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-brand-700 transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                      {t("empty.bookings.cta")}
                    </button>
                  )}
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
                                    className="text-xs px-2.5 py-1 rounded-full bg-brand-50 text-brand-700 border border-brand-200 hover:bg-brand-100"
                                  >
                                    {t("review.writeReview")}
                                  </button>
                                )}
                                {b.status === "completed" && b.has_review && (
                                  <span className="text-xs px-2.5 py-1 rounded-full bg-gray-50 text-gray-600 border border-gray-200">
                                    {t("review.reviewed")}
                                  </span>
                                )}
                                {b.status === "expired" && (
                                  <span className="text-xs px-2.5 py-1 rounded-full bg-gray-100 text-gray-500 border border-gray-200">
                                    {t("booking.expired")}
                                  </span>
                                )}
                                {b.status === "pending" &&
                                  // Ad owner (who created the ad) gets Accept/Decline
                                  user?.id === b.ad_owner_id && (
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
                                              notifyBooking("booking_confirmed", b.id);
                                              try {
                                                const convId = await MessageService.getOrCreateConversation(b.id);
                                                if (convId) {
                                                  const acceptMsg = b.ad_type === "long-term"
                                                    ? t("messages.contactAccepted")
                                                    : t("messages.bookingAccepted");
                                                  await MessageService.sendMessage(convId, acceptMsg, true);
                                                }
                                              } catch (err) {
                                                console.error("Error creating conversation:", err);
                                              }
                                              await reloadBookings();
                                              setToast?.({ message: t("booking.acceptedCheckMessages"), type: "success" });
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
                                              notifyBooking("booking_cancelled", b.id);
                                              await reloadBookings();
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
                                  // Requester (who booked) gets pending status + cancel/withdraw
                                  user?.id !== b.ad_owner_id && (
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
                                              notifyBooking("booking_cancelled", b.id);
                                              await reloadBookings();
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
                                ? "bg-brand-600 text-white"
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
            <div className="px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-brand-50 to-brand-50">
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
              {/* Status Timeline */}
              <div className="rounded-xl border border-gray-100 bg-gray-50/60 px-3">
                <BookingStatusTimeline status={selectedBooking.status} />
              </div>

              {/* Booking Details Grid */}
              <div className="grid grid-cols-1 gap-4">
                {selectedBooking.ad_type === "long-term" ? (
                  <div className="bg-brand-50 rounded-lg p-4 border border-brand-200">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-brand-900">
                        {t("booking.contactRequest")}
                      </span>
                    </div>
                    <span className="text-sm text-brand-700">
                      {t("booking.longTermDescription")}
                    </span>
                  </div>
                ) : (
                  <>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <svg
                          className="w-5 h-5 text-brand-600"
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
                            className="w-5 h-5 text-brand-600"
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
                  {selectedBooking.counterparty_id ? (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        router.push(`/user/${selectedBooking.counterparty_id}`);
                      }}
                      className="font-medium text-brand-700 hover:text-brand-900 hover:underline transition-colors"
                    >
                      {selectedBooking.counterparty_full_name || "User"}
                    </button>
                  ) : (
                    <span className="font-medium">
                      {selectedBooking.counterparty_full_name || "User"}
                    </span>
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
            <div className="px-5 py-3 border-t border-gray-100 flex justify-between items-center gap-2">
              {(selectedBooking?.status === "confirmed" ||
                selectedBooking?.status === "completed") && (
                <button
                  className="inline-flex items-center gap-1.5 px-4 py-2 border border-brand-600 text-brand-600 rounded-lg hover:bg-brand-50 transition-colors"
                  onClick={() => {
                    const id = selectedBooking.id;
                    setSelectedBooking(null);
                    goToConversation(id);
                  }}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.86 9.86 0 01-4-.8L3 20l1.3-3.9A7.96 7.96 0 013 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                  {t("booking.goToMessages")}
                </button>
              )}
              {selectedBooking?.status === "completed" &&
                !selectedBooking.has_review && (
                  <button
                    className="px-4 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700"
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
            if (cancellingBooking) notifyBooking("booking_cancelled", cancellingBooking.id);
            await reloadBookings();
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
              await reloadBookings();
              setReviewingBooking(null);
            }}
          />
        )}
    </div>
  );
}
