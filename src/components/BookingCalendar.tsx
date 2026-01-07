"use client";

import { useMemo, useState } from "react";

type BookingItem = {
  id: string;
  booking_date: string | null;
  start_time: string | null;
  end_time: string | null;
  status: string | null;
  counterparty_full_name?: string | null;
};

interface BookingCalendarProps {
  bookings: BookingItem[];
  onSelectDate?: (dateISO: string) => void;
  selectedDate?: string | null;
}

function formatDateISO(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export default function BookingCalendar({
  bookings,
  onSelectDate,
  selectedDate,
}: BookingCalendarProps) {
  const [current, setCurrent] = useState<Date>(new Date());

  const mapByDate = useMemo(() => {
    const map = new Map<string, BookingItem[]>();
    for (const b of bookings || []) {
      if (!b.booking_date) continue;
      const arr = map.get(b.booking_date) || [];
      arr.push(b);
      map.set(b.booking_date, arr);
    }
    return map;
  }, [bookings]);

  const firstDay = new Date(current.getFullYear(), current.getMonth(), 1);
  const lastDay = new Date(current.getFullYear(), current.getMonth() + 1, 0);
  // Convert Sunday (0) to 6, Monday (1) to 0, etc. to start week on Monday
  const dayOfWeek = firstDay.getDay();
  const startWeekday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
  const numDays = lastDay.getDate();

  const days: JSX.Element[] = [];
  for (let i = 0; i < startWeekday; i++) {
    days.push(<div key={`empty-${i}`} />);
  }
  for (let day = 1; day <= numDays; day++) {
    const date = new Date(current.getFullYear(), current.getMonth(), day);
    const dateISO = formatDateISO(date);
    const items = mapByDate.get(dateISO) || [];
    const isSelected = selectedDate === dateISO;

    const pendingCount = items.filter((i) => i.status === "pending").length;
    const confirmedCount = items.filter((i) => i.status === "confirmed").length;
    const otherCount = items.filter(
      (i) => i.status && i.status !== "pending" && i.status !== "confirmed"
    ).length;

    days.push(
      <button
        key={dateISO}
        onClick={() => onSelectDate && onSelectDate(isSelected ? "" : dateISO)}
        className={`group w-full aspect-square rounded-xl border transition-all text-sm flex flex-col items-center justify-center select-none ${
          items.length > 0
            ? isSelected
              ? "border-purple-600 bg-purple-50"
              : "border-gray-200 hover:border-purple-300 hover:bg-purple-50"
            : "border-gray-100 hover:border-gray-200"
        }`}
        title={items.length > 0 ? `${items.length} booking(s)` : undefined}
      >
        <div
          className={`font-semibold ${
            isSelected ? "text-purple-700" : "text-gray-800"
          }`}
        >
          {day}
        </div>
        <div className="mt-1 flex gap-1">
          {pendingCount > 0 && (
            <span className="w-2 h-2 rounded-full bg-yellow-500" />
          )}
          {confirmedCount > 0 && (
            <span className="w-2 h-2 rounded-full bg-green-600" />
          )}
          {otherCount > 0 && (
            <span className="w-2 h-2 rounded-full bg-gray-400" />
          )}
        </div>
      </button>
    );
  }

  const monthLabel = current.toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-100 bg-gray-50 flex items-center justify-between">
        <button
          onClick={() =>
            setCurrent(
              new Date(current.getFullYear(), current.getMonth() - 1, 1)
            )
          }
          className="p-2 rounded-lg hover:bg-gray-100"
          aria-label="Previous month"
        >
          ‹
        </button>
        <div className="font-semibold text-gray-900">{monthLabel}</div>
        <button
          onClick={() =>
            setCurrent(
              new Date(current.getFullYear(), current.getMonth() + 1, 1)
            )
          }
          className="p-2 rounded-lg hover:bg-gray-100"
          aria-label="Next month"
        >
          ›
        </button>
      </div>
      <div className="p-4">
        <div className="grid grid-cols-7 gap-2 text-xs text-gray-500 mb-2">
          {["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"].map((d) => (
            <div key={d} className="text-center py-1">
              {d}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-2">{days}</div>
        <div className="mt-4 flex items-center gap-4 text-xs text-gray-600">
          <div className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-yellow-500" /> Pending
          </div>
          <div className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-green-600" /> Confirmed
          </div>
          <div className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-gray-400" /> Other
          </div>
        </div>
      </div>
    </div>
  );
}
