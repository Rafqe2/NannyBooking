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
  adType,
}: {
  adId: string;
  onClose: () => void;
  ownerType?: "nanny" | "parent";
  availableSlots?: Slot[];
  adType?: "short-term" | "long-term";
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

  const isLongTerm = adType === "long-term";
  // When ownerType is "parent", the viewer is a nanny applying to the parent's job post
  const viewerIsNanny = ownerType === "parent";

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

  const handleLongTermRequest = async () => {
    setError(null);
    setSuccess(null);
    setSaving(true);

    // For long-term, create a booking with today's date as placeholder
    const result = await BookingService.createBooking({
      adId,
      date: todayKey,
      start: "09:00",
      end: "17:00",
      message: message.trim() || undefined,
    });

    setSaving(false);

    if (result.success) {
      setSuccess(viewerIsNanny ? t("booking.contactRequestSentToFamily") : t("booking.contactRequestSent"));
    } else {
      const errLower = (result.error || "").toLowerCase();
      const isLimit = errLower.includes("booking_limit") || errLower.includes("maximum") || errLower.includes("5 active") || errLower.includes("reached");
      if (isLimit) {
        setError(t("booking.limitReached"));
      } else if (errLower.includes("booking_conflict")) {
        setError(t("booking.contactAlreadySent"));
      } else {
        setError(result.error || t("booking.createFailed"));
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white w-full max-w-4xl max-h-[90vh] rounded-2xl shadow-2xl border border-gray-200 overflow-hidden">
        <div className="px-5 py-3 border-b border-gray-100 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">
            {isLongTerm
              ? t("booking.contactRequest")
              : t("booking.bookThis", {
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

          {isLongTerm ? (
            /* Long-term: contact request without dates */
            <div className="p-5 space-y-4">
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                <p className="text-sm text-purple-800">
                  {viewerIsNanny ? t("booking.longTermDescriptionForNanny") : t("booking.longTermDescription")}
                </p>
              </div>
              <div>
                <label className="block text-sm text-gray-700 mb-2">
                  {t("booking.message")}
                </label>
                <textarea
                  rows={4}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg resize-none"
                  placeholder={viewerIsNanny ? t("booking.longTermMessagePlaceholderForNanny") : t("booking.longTermMessagePlaceholder")}
                />
              </div>
            </div>
          ) : hasAvailability ? (
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
                    minDate={(() => { const d = new Date(); d.setHours(0, 0, 0, 0); return d; })()}
                    allowedDateKeys={availableDateKeys}
                    perDateTimes={perDateTimes}
                    defaultStartTime="09:00"
                    defaultEndTime="17:00"
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
                        const slotTimes = defaultTimesPerDate[key] || {
                          start: "09:00",
                          end: "17:00",
                        };
                        const times = perDateTimes[key] || slotTimes;
                        return (
                          <div
                            key={key}
                            className="text-sm text-gray-700 bg-white rounded-md p-2 border"
                          >
                            <div className="font-medium mb-1">
                              {formatDateDDMMYYYY(date)}
                              <span className="text-xs text-gray-400 ml-2">
                                ({t("booking.available")}: {slotTimes.start} - {slotTimes.end})
                              </span>
                            </div>
                            <div className="flex items-center gap-1">
                              <input
                                type="time"
                                value={times.start}
                                min={slotTimes.start}
                                max={slotTimes.end}
                                onChange={(e) =>
                                  setPerDateTimes((prev) => ({
                                    ...prev,
                                    [key]: { ...times, start: e.target.value },
                                  }))
                                }
                                className="px-1.5 py-0.5 border border-gray-300 rounded text-xs font-mono bg-white focus:ring-1 focus:ring-purple-500 focus:border-purple-500"
                              />
                              <span className="text-xs text-gray-400">-</span>
                              <input
                                type="time"
                                value={times.end}
                                min={slotTimes.start}
                                max={slotTimes.end}
                                onChange={(e) =>
                                  setPerDateTimes((prev) => ({
                                    ...prev,
                                    [key]: { ...times, end: e.target.value },
                                  }))
                                }
                                className="px-1.5 py-0.5 border border-gray-300 rounded text-xs font-mono bg-white focus:ring-1 focus:ring-purple-500 focus:border-purple-500"
                              />
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
          {isLongTerm ? (
            <button
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50"
              disabled={saving}
              onClick={handleLongTermRequest}
            >
              {saving ? t("booking.submitting") : t("booking.sendContactRequest")}
            </button>
          ) : (
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
                  // Validate times are within the available slot range
                  const slotRange = defaultTimesPerDate[s.available_date];
                  if (slotRange) {
                    if (s.start_time < slotRange.start || s.end_time > slotRange.end) {
                      setError(t("booking.timeOutOfRange"));
                      return;
                    }
                  }
                  if (s.end_time <= s.start_time) {
                    setError(t("booking.endTimeAfterStart"));
                    return;
                  }
                }

                setSaving(true);
                let successCount = 0;
                let lastError = "";

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
                    lastError = result.error || "";
                    console.error("Booking failed for slot:", s, "Error:", lastError);
                    // Stop on conflict or limit errors
                    const errCheck = lastError.toLowerCase();
                    if (errCheck.includes("booking_conflict") || errCheck.includes("booking_limit") || errCheck.includes("maximum") || errCheck.includes("5 active")) {
                      break;
                    }
                  }
                }

                setSaving(false);

                const errLower = lastError.toLowerCase();
                const isLimitError = errLower.includes("booking_limit") || errLower.includes("maximum") || errLower.includes("5 active") || errLower.includes("reached");
                const isConflictError = errLower.includes("booking_conflict");
                if (isLimitError) {
                  setError(t("booking.limitReached"));
                } else if (isConflictError) {
                  setError(t("booking.conflictError"));
                } else if (successCount === 0 && lastError) {
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
          )}
        </div>
      </div>
    </div>
  );
}
