"use client";

import { useMemo, useState } from "react";

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
  showRemoveBadges?: boolean; // optional: show small remove x on calendar cells
  allowedDateKeys?: Set<string> | string[]; // optional: if provided, only allow selecting these YYYY-MM-DD dates
  autoOpenTimeEditor?: boolean; // optional: if true, opens time editor immediately on first click
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
  autoOpenTimeEditor = false,
}: MultiDatePickerProps) {
  const [currentMonth, setCurrentMonth] = useState<Date>(() => {
    const base = initialMonthDate || new Date();
    return new Date(base.getFullYear(), base.getMonth(), 1);
  });
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [editStart, setEditStart] = useState<string>(
    defaultStartTime || "09:00"
  );
  const [editEnd, setEditEnd] = useState<string>(defaultEndTime || "17:00");

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
    return { daysInMonth: last.getDate(), startingDayOfWeek: first.getDay() };
  }, [currentMonth]);

  const monthLabel = useMemo(
    () =>
      currentMonth.toLocaleDateString("en-US", {
        month: "long",
        year: "numeric",
      }),
    [currentMonth]
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
      // Second click removes the date
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

    // Auto-open editor for newly added dates if enabled
    if (autoOpenTimeEditor && next.has(key)) {
      const ov = perDateTimes && perDateTimes[key];
      setEditStart(ov?.start || defaultStartTime || "09:00");
      setEditEnd(ov?.end || defaultEndTime || "17:00");
      setEditingKey(key);
    }
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
        {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((d) => (
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
                disabled={past || (allowedSet && !isAvailable)}
                onClick={() => {
                  // Single click toggles selection (add or remove)
                  toggleDay(day);
                }}
                onDoubleClick={() => {
                  if (selected) {
                    // Double-click on selected date opens editor
                    const ov = perDateTimes && perDateTimes[dateKey];
                    setEditStart(ov?.start || defaultStartTime || "09:00");
                    setEditEnd(ov?.end || defaultEndTime || "17:00");
                    setEditingKey(dateKey);
                  }
                }}
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

      {!editingKey && selectedDates.length > 0 && (
        <div className="mt-3 p-3 border border-dashed border-gray-300 rounded-xl bg-white">
          <div className="text-xs text-gray-600">
            {autoOpenTimeEditor
              ? "Tip: Click to select dates and edit time, click again to deselect."
              : "Tip: Click to select/deselect dates, double-click to edit time."}
          </div>
        </div>
      )}

      {editingKey && (
        <div className="mt-3 p-3 border border-gray-200 rounded-xl bg-white shadow-sm">
          <div className="text-sm font-medium text-gray-900 mb-2">
            {editingKey}
          </div>
          <div className="grid grid-cols-2 gap-2 mb-3">
            <div>
              <label className="block text-xs text-gray-600 mb-1">Start</label>
              <input
                type="time"
                value={editStart}
                onChange={(e) => setEditStart(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1">End</label>
              <input
                type="time"
                value={editEnd}
                onChange={(e) => setEditEnd(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              />
            </div>
          </div>
          <div className="flex items-center justify-between gap-2">
            <div className="flex gap-2">
              <button
                type="button"
                className="px-4 py-2 bg-purple-600 text-white rounded-lg text-sm hover:bg-purple-700"
                onClick={() => {
                  if (onUpdateDateTime && editingKey) {
                    const d = new Date(editingKey + "T00:00:00");
                    onUpdateDateTime(d, editStart, editEnd);
                  }
                  setEditingKey(null);
                }}
              >
                OK
              </button>
              <button
                type="button"
                className="px-4 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50"
                onClick={() => setEditingKey(null)}
              >
                Cancel
              </button>
            </div>
            <button
              type="button"
              className="px-4 py-2 border border-red-300 text-red-700 rounded-lg text-sm hover:bg-red-50"
              onClick={() => {
                if (!editingKey) return;
                const d = new Date(editingKey + "T00:00:00");
                const out = selectedDates.filter(
                  (sd) => toDateKey(sd) !== editingKey
                );
                onChange(out);
                if (onRemoveDate) onRemoveDate(d);
                setEditingKey(null);
              }}
            >
              Remove
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
