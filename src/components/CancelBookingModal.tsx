"use client";

import { useState } from "react";
import { BookingService } from "../lib/bookingService";
import { useTranslation } from "./LanguageProvider";
import { getTranslatedCancellationReason } from "../lib/constants/skills";
import { formatDateDDMMYYYY } from "../lib/date";

interface CancelBookingModalProps {
  booking: any;
  onClose: () => void;
  onSuccess: () => void;
  userType?: "parent" | "nanny" | "pending" | null;
}

const PARENT_CANCELLATION_REASONS = [
  "Emergency came up",
  "Schedule conflict",
  "Found alternative arrangement",
  "Child is sick",
  "Travel plans changed",
  "Financial reasons",
  "Other",
];

const NANNY_CANCELLATION_REASONS = [
  "Emergency came up",
  "Schedule conflict",
  "Health issue",
  "Personal reasons",
  "Transportation problems",
  "Other commitment",
  "Other",
];

export default function CancelBookingModal({
  booking,
  onClose,
  onSuccess,
  userType,
}: CancelBookingModalProps) {
  const { t, language } = useTranslation();
  const [selectedReason, setSelectedReason] = useState<string>("");
  const [note, setNote] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!selectedReason) {
      setError(t("cancelBooking.selectReason"));
      return;
    }
    if (note.trim().length < 10) {
      setError(t("cancelBooking.detailedExplanation"));
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const success = await BookingService.cancelWithReason(
        booking.id,
        selectedReason,
        note.trim()
      );

      if (success) {
        onSuccess();
        onClose();
      } else {
        setError(t("cancelBooking.failed"));
      }
    } catch (err: any) {
      setError(err.message || t("cancelBooking.failed"));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white w-full max-w-md rounded-2xl shadow-2xl border border-gray-200 overflow-hidden">
        <div className="px-5 py-3 border-b border-gray-100 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">
            {t("cancelBooking.title")}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            ✕
          </button>
        </div>

        <div className="p-5 space-y-4">
          {error && (
            <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg p-2">
              {error}
            </div>
          )}

          <div className="bg-gray-50 rounded-lg p-3">
            <div className="text-sm font-medium text-gray-900 mb-1">
              {t("cancelBooking.bookingDetails")}:
            </div>
            <div className="text-sm text-gray-700">
              {booking.booking_date
                ? formatDateDDMMYYYY(
                    new Date(booking.booking_date + "T00:00:00")
                  )
                : "No date"}
              {booking.start_time && booking.end_time && (
                <span>
                  {" "}
                  · {booking.start_time} - {booking.end_time}
                </span>
              )}
            </div>
            <div className="text-sm text-gray-600 mt-1">
              {t("cancelBooking.with")}{" "}
              {booking.counterparty_full_name || t("common.user")}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t("cancelBooking.reasonLabel")}
            </label>
            <select
              value={selectedReason}
              onChange={(e) => setSelectedReason(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            >
              <option value="">
                {t("cancelBooking.selectReasonPlaceholder")}
              </option>
              {(userType === "nanny" ? NANNY_CANCELLATION_REASONS : PARENT_CANCELLATION_REASONS).map((reason) => (
                <option key={reason} value={reason}>
                  {getTranslatedCancellationReason(reason, language)}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t("cancelBooking.explanationLabel")}
            </label>
            <textarea
              rows={4}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
              placeholder={t("cancelBooking.explanationPlaceholder")}
            />
            <div className="text-xs text-gray-500 mt-1">
              {note.length}/10 {t("cancelBooking.charactersMinimum")}
            </div>
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
            <div className="text-sm text-yellow-800">
              <strong>{t("cancelBooking.importantLabel")}:</strong>{" "}
              {t("cancelBooking.importantMessage")}
            </div>
          </div>
        </div>

        <div className="px-5 py-3 border-t border-gray-100 flex justify-end gap-2">
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
          >
            {t("cancelBooking.keepBooking")}
          </button>
          <button
            onClick={handleSubmit}
            disabled={
              isSubmitting || !selectedReason || note.trim().length < 10
            }
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
          >
            {isSubmitting
              ? t("cancelBooking.cancelling")
              : t("cancelBooking.confirmCancel")}
          </button>
        </div>
      </div>
    </div>
  );
}
