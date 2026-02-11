"use client";

import { useMemo, useState } from "react";
import { useTranslation } from "./LanguageProvider";
import { stripLatvianGada } from "../lib/date";

interface MultiDatePickerProps {
  selectedDates: Date[];
  onChange: (dates: Date[]) => void;
  minDate?: Date;
  onSelectedDateClick?: (date: Date) => void;
  perDateTimes?: Record<string, { start: string; end: string }>;
  defaultStartTime?: string;
  defaultEndTime?: string;
  onUpdateDateTime?: (date: Date, start: string, end: string) => void;
  onRemoveDate?: (date: Date) => void;
  initialMonthDate?: Date;
  showRemoveBadges?: boolean;
  allowedDateKeys?: Set<string> | string[];
  hideTip?: boolean;
}

function toDateKey(d: Date): string {
  const c = new Date(d);
  c.setHours(0, 0, 0, 0);
  const y = c.getFullYear();
  const m = String(c.getMonth() + 1).padStart(2, "0");
  const day = String(c.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export default function MultiDatePicker({
  selectedDates,
  onChange,
  minDate,
  onSelectedDateClick,
  perDateTimes,
  defaultStartTime,
  defaultEndTime,
  onUpdateDateTime,
  onRemoveDate,
  initialMonthDate,
  showRemoveBadges = false,
  allowedDateKeys,
  hideTip = false,
}: MultiDatePickerProps) {
  const { t, language } = useTranslation();
  const [currentMonth, setCurrentMonth] = useState<Date>(() => {
    const base = initialMonthDate || new Date();
    return new Date(base.getFullYear(), base.getMonth(), 1);
  });

  const selectedKeys = useMemo(() => {
    const s = new Set<string>();
    for (const d of selectedDates) s.add(toDateKey(d));
    return s;
  }, [selectedDates]);

  const { daysInMonth, startingDayOfWeek } = useMemo(() => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const first = new Date(year, month, 1);
    const last = new Date(year, month + 1, 0);
    const dayOfWeek = first.getDay();
    const startingDayOfWeek = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    return { daysInMonth: last.getDate(), startingDayOfWeek };
  }, [currentMonth]);

  const locale = language === "lv" ? "lv-LV" : language === "ru" ? "ru-RU" : "en-US";
  const monthLabel = useMemo(
    () =>
      stripLatvianGada(currentMonth.toLocaleDateString(locale, {
        month: "long",
        year: "numeric",
      })),
    [currentMonth, locale]
  );

  const allowedSet = useMemo<Set<string> | null>(() => {
    if (!allowedDateKeys) return null;
    if (allowedDateKeys instanceof Set) return allowedDateKeys;
    return new Set<string>(allowedDateKeys);
  }, [allowedDateKeys]);

  const isPast = (day: number) => {
    if (!minDate) return false;
    const d = new Date(
      currentMonth.getFullYear(),
      currentMonth.getMonth(),
      day
    );
    d.setHours(0, 0, 0, 0);
    return d < minDate;
  };

  const toggleDay = (day: number) => {
    const d = new Date(
      currentMonth.getFullYear(),
      currentMonth.getMonth(),
      day
    );
    d.setHours(0, 0, 0, 0);
    if (minDate && d < minDate) return;
    const key = toDateKey(d);
    if (allowedSet && !allowedSet.has(key)) return;
    const next = new Map<string, Date>();
    for (const sd of selectedDates) next.set(toDateKey(sd), new Date(sd));
    if (next.has(key)) {
      next.delete(key);
      if (onRemoveDate) onRemoveDate(d);
    } else {
      next.set(key, d);
      if (onSelectedDateClick) onSelectedDateClick(d);
    }
    const out = Array.from(next.values()).sort(
      (a, b) => a.getTime() - b.getTime()
    );
    onChange(out);
  };

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-4">
        <button
          type="button"
          onClick={() =>
            setCurrentMonth(
              new Date(
                currentMonth.getFullYear(),
                currentMonth.getMonth() - 1,
                1
              )
            )
          }
          className="p-2 hover:bg-gray-100 rounded-lg"
        >
          ‹
        </button>
        <div className="font-semibold">{monthLabel}</div>
        <button
          type="button"
          onClick={() =>
            setCurrentMonth(
              new Date(
                currentMonth.getFullYear(),
                currentMonth.getMonth() + 1,
                1
              )
            )
          }
          className="p-2 hover:bg-gray-100 rounded-lg"
        >
          ›
        </button>
      </div>

      <div className="grid grid-cols-7 gap-2 text-center text-xs text-gray-500 mb-2">
        {["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"].map((d) => (
          <div key={d} className="py-1">
            {d}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-2">
        {Array.from({ length: startingDayOfWeek }).map((_, i) => (
          <div key={`e-${i}`} className="h-10" />
        ))}
        {Array.from({ length: daysInMonth }).map((_, i) => {
          const day = i + 1;
          const date = new Date(
            currentMonth.getFullYear(),
            currentMonth.getMonth(),
            day
          );
          const dateKey = toDateKey(date);
          const selected = selectedKeys.has(dateKey);
          const past = isPast(day);
          const isAvailable = allowedSet && allowedSet.has(dateKey);
          const ov = perDateTimes && perDateTimes[dateKey];
          return (
            <div key={day} className="relative">
              <button
                type="button"
                disabled={past || (allowedSet !== null && !isAvailable)}
                onClick={() => toggleDay(day)}
                className={
                  "h-10 w-full rounded-lg text-sm transition " +
                  (past
                    ? "text-gray-300 cursor-not-allowed"
                    : allowedSet && !isAvailable
                    ? "text-gray-400 cursor-not-allowed"
                    : selected
                    ? "bg-purple-600 text-white hover:bg-purple-700"
                    : isAvailable
                    ? "border-2 border-green-400 text-green-700 hover:bg-green-50"
                    : "hover:bg-gray-100")
                }
                title={ov ? `${ov.start} - ${ov.end}` : undefined}
              >
                {day}
              </button>
              {showRemoveBadges && selected && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    const keyToRemove = toDateKey(date);
                    const out = selectedDates.filter(
                      (sd) => toDateKey(sd) !== keyToRemove
                    );
                    onChange(out);
                    if (onRemoveDate) onRemoveDate(date);
                  }}
                  className="absolute -top-1 -right-1 h-5 w-5 rounded-full border border-red-300 bg-white text-red-600 text-xs leading-5 flex items-center justify-center hover:bg-red-50"
                  aria-label={`Remove ${date.toLocaleDateString()}`}
                  title="Remove date"
                >
                  ×
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
