"use client";

import { useMemo, useState } from "react";
import { toLocalYYYYMMDD, formatDateDDMMYYYY } from "../lib/date";
import { BookingService } from "../lib/bookingService";
import MultiDatePicker from "./MultiDatePicker";
import { useTranslation } from "./LanguageProvider";

type Slot = { available_date: string; start_time: string; end_time: string };

export default function BookingModal({
  adId,
  onClose,
  ownerType,
  availableSlots,
}: {
  adId: string;
  onClose: () => void;
  ownerType?: "nanny" | "parent";
  availableSlots?: Slot[];
}) {
  const { t } = useTranslation();
  const [selectedDates, setSelectedDates] = useState<Date[]>([]);
  const [perDateTimes, setPerDateTimes] = useState<
    Record<string, { start: string; end: string }>
  >({});
  const [message, setMessage] = useState<string>("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const todayKey = useMemo(() => toLocalYYYYMMDD(new Date()), []);
  const futureSlots: Slot[] = useMemo(
    () => (availableSlots || []).filter((s) => s.available_date >= todayKey),
    [availableSlots, todayKey]
  );

  // Available date keys for MultiDatePicker (only allow selecting available dates)
  const availableDateKeys = useMemo(
    () => new Set(futureSlots.map((s) => s.available_date)),
    [futureSlots]
  );

  // Default times based on first available slot for each date
  const defaultTimesPerDate = useMemo(() => {
    const map: Record<string, { start: string; end: string }> = {};
    for (const slot of futureSlots) {
      if (!map[slot.available_date]) {
        map[slot.available_date] = {
          start: slot.start_time,
          end: slot.end_time,
        };
      }
    }
    return map;
  }, [futureSlots]);

  const hasAvailability = availableDateKeys.size > 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white w-full max-w-4xl max-h-[90vh] rounded-2xl shadow-2xl border border-gray-200 overflow-hidden">
        <div className="px-5 py-3 border-b border-gray-100 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">
            {t("booking.bookThis", {
              type:
                ownerType === "nanny"
                  ? t("userType.nanny")
                  : ownerType === "parent"
                  ? t("userType.parent")
                  : "ad",
            })}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            ✕
          </button>
        </div>
        <div className="overflow-y-auto max-h-[calc(90vh-140px)]">
          {error && (
            <div className="mx-5 mt-4 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg p-2">
              {error}
            </div>
          )}
          {success && (
            <div className="mx-5 mt-4 text-sm text-green-700 bg-green-50 border border-green-200 rounded-lg p-2">
              {success}
            </div>
          )}

          {hasAvailability ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 p-5">
              {/* Left Column - Calendar */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-gray-700 mb-2">
                    {t("booking.selectDates")}
                  </label>
                  <MultiDatePicker
                    selectedDates={selectedDates}
                    onChange={setSelectedDates}
                    minDate={new Date()}
                    allowedDateKeys={availableDateKeys}
                    perDateTimes={perDateTimes}
                    defaultStartTime="09:00"
                    defaultEndTime="17:00"
                    autoOpenTimeEditor={true}
                    onUpdateDateTime={(date, start, end) => {
                      const key = toLocalYYYYMMDD(date);
                      setPerDateTimes((prev) => ({
                        ...prev,
                        [key]: { start, end },
                      }));
                    }}
                    onSelectedDateClick={(date) => {
                      const key = toLocalYYYYMMDD(date);
                      if (!perDateTimes[key] && defaultTimesPerDate[key]) {
                        setPerDateTimes((prev) => ({
                          ...prev,
                          [key]: defaultTimesPerDate[key],
                        }));
                      }
                    }}
                  />
                </div>
              </div>

              {/* Right Column - Selected Dates and Message */}
              <div className="space-y-4">
                {selectedDates.length > 0 && (
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="text-sm font-medium text-gray-900 mb-3">
                      {t("booking.selectedDates")}:
                    </div>
                    <div className="space-y-2">
                      {selectedDates.map((date) => {
                        const key = toLocalYYYYMMDD(date);
                        const times = perDateTimes[key] ||
                          defaultTimesPerDate[key] || {
                            start: "09:00",
                            end: "17:00",
                          };
                        return (
                          <div
                            key={key}
                            className="text-sm text-gray-700 bg-white rounded-md p-2 border"
                          >
                            <div className="font-medium">
                              {formatDateDDMMYYYY(date)}
                            </div>
                            <div className="text-gray-600">
                              {times.start} - {times.end}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-sm text-gray-700 mb-2">
                    {t("booking.message")}
                  </label>
                  <textarea
                    rows={4}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg resize-none"
                    placeholder={t("booking.messagePlaceholder")}
                  />
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500 p-5">
              <div className="text-lg mb-2">{t("booking.noAvailability")}</div>
              <div className="text-sm">{t("booking.noAvailabilityDesc")}</div>
            </div>
          )}
        </div>
        <div className="px-5 py-3 border-t border-gray-100 flex justify-end gap-2">
          <button
            className="px-4 py-2 border rounded-lg"
            onClick={onClose}
            disabled={saving}
          >
            {t("common.cancel")}
          </button>
          <button
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50"
            disabled={saving || selectedDates.length === 0}
            onClick={async () => {
              setError(null);
              setSuccess(null);

              if (selectedDates.length === 0) {
                setError(t("booking.errorSelectDate"));
                return;
              }

              // Build the slots to submit from selected dates and times
              const toSubmit: Slot[] = selectedDates.map((date) => {
                const key = toLocalYYYYMMDD(date);
                const times = perDateTimes[key] ||
                  defaultTimesPerDate[key] || { start: "09:00", end: "17:00" };
                return {
                  available_date: key,
                  start_time: times.start,
                  end_time: times.end,
                };
              });

              // Validate all slots
              for (const s of toSubmit) {
                if (!s.available_date || !s.start_time || !s.end_time) {
                  setError(t("booking.selectDateAndTime"));
                  return;
                }
                if (s.end_time <= s.start_time) {
                  setError(t("booking.endTimeAfterStart"));
                  return;
                }
              }

              setSaving(true);
              let successCount = 0;
              let conflictError = false;

              for (const s of toSubmit) {
                const result = await BookingService.createBooking({
                  adId,
                  date: s.available_date,
                  start: s.start_time,
                  end: s.end_time,
                  message: message.trim() || undefined,
                });

                if (result.success) {
                  successCount++;
                } else {
                  // Check if it's a booking conflict error
                  if (result.error.includes("BOOKING_CONFLICT")) {
                    conflictError = true;
                    break; // Stop trying other bookings
                  }
                }
              }

              setSaving(false);

              if (conflictError) {
                setError(t("booking.conflictError"));
              } else if (successCount === 0) {
                setError(t("booking.createFailed"));
              } else if (successCount < toSubmit.length) {
                setError(
                  t("booking.partialSuccess", {
                    successCount,
                    totalCount: toSubmit.length,
                  })
                );
              } else {
                setSuccess(
                  toSubmit.length > 1
                    ? t("booking.requestsSentMultiple")
                    : t("booking.requestSent")
                );
              }
            }}
          >
            {saving
              ? t("booking.submitting")
              : selectedDates.length > 1
              ? t("booking.sendMultipleRequests", {
                  count: selectedDates.length,
                })
              : t("booking.submitRequest")}
          </button>
        </div>
      </div>
    </div>
  );
}
