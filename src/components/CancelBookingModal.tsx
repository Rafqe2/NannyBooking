"use client";

import { useState } from "react";
import { BookingService } from "../lib/bookingService";

interface CancelBookingModalProps {
  booking: any;
  onClose: () => void;
  onSuccess: () => void;
}

const CANCELLATION_REASONS = [
  "Emergency came up",
  "Schedule conflict",
  "Found alternative arrangement",
  "Child is sick",
  "Travel plans changed",
  "Financial reasons",
  "Other",
];

export default function CancelBookingModal({
  booking,
  onClose,
  onSuccess,
}: CancelBookingModalProps) {
  const [selectedReason, setSelectedReason] = useState<string>("");
  const [note, setNote] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!selectedReason) {
      setError("Please select a reason for cancellation");
      return;
    }
    if (note.trim().length < 10) {
      setError(
        "Please provide a detailed explanation (at least 10 characters)"
      );
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
        setError("Failed to cancel booking. Please try again.");
      }
    } catch (err: any) {
      setError(err.message || "Failed to cancel booking");
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
            Cancel Booking
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
              Booking Details:
            </div>
            <div className="text-sm text-gray-700">
              {booking.booking_date
                ? new Date(
                    booking.booking_date + "T00:00:00"
                  ).toLocaleDateString()
                : "No date"}
              {booking.start_time && booking.end_time && (
                <span>
                  {" "}
                  · {booking.start_time} - {booking.end_time}
                </span>
              )}
            </div>
            <div className="text-sm text-gray-600 mt-1">
              with {booking.counterparty_full_name || "User"}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Reason for cancellation *
            </label>
            <select
              value={selectedReason}
              onChange={(e) => setSelectedReason(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            >
              <option value="">Select a reason...</option>
              {CANCELLATION_REASONS.map((reason) => (
                <option key={reason} value={reason}>
                  {reason}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Additional explanation *
            </label>
            <textarea
              rows={4}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
              placeholder="Please provide details about why you need to cancel this booking..."
            />
            <div className="text-xs text-gray-500 mt-1">
              {note.length}/10 characters minimum
            </div>
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
            <div className="text-sm text-yellow-800">
              <strong>Important:</strong> Cancelling confirmed bookings may
              affect your reputation. The other party will be notified of your
              cancellation and reason.
            </div>
          </div>
        </div>

        <div className="px-5 py-3 border-t border-gray-100 flex justify-end gap-2">
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
          >
            Keep Booking
          </button>
          <button
            onClick={handleSubmit}
            disabled={
              isSubmitting || !selectedReason || note.trim().length < 10
            }
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
          >
            {isSubmitting ? "Cancelling..." : "Cancel Booking"}
          </button>
        </div>
      </div>
    </div>
  );
}
