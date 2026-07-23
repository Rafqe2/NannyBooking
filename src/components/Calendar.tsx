"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useTranslation } from "./LanguageProvider";
import { formatDateDDMMYYYY, stripLatvianGada } from "../lib/date";

interface CalendarProps {
  startDate: Date | null;
  endDate: Date | null;
  onDateSelect: (date: Date) => void;
  minDate?: Date;
  onClear?: () => void;
}

// Range calendar for the search bar: two months side by side on desktop
// (one on mobile), fluid cell sizes so it fills its container's width, and a
// continuous highlight band between the selected start and end dates.
export default function Calendar({
  startDate,
  endDate,
  onDateSelect,
  minDate,
  onClear,
}: CalendarProps) {
  const { t, language } = useTranslation();
  const [baseMonth, setBaseMonth] = useState(() => {
    const d = startDate || new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });

  const locale =
    language === "lv" ? "lv-LV" : language === "ru" ? "ru-RU" : "en-US";
  const dayNames = t("calendar.dayNames").split(",");

  const sameDay = (a: Date | null, b: Date) =>
    !!a &&
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate();

  const renderMonth = (offset: number) => {
    const monthStart = new Date(
      baseMonth.getFullYear(),
      baseMonth.getMonth() + offset,
      1
    );
    const year = monthStart.getFullYear();
    const month = monthStart.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    // Week starts on Monday
    const leadingBlanks = (monthStart.getDay() + 6) % 7;
    const monthName = stripLatvianGada(
      monthStart.toLocaleDateString(locale, { month: "long", year: "numeric" })
    );

    const cells: React.ReactNode[] = [];
    for (let i = 0; i < leadingBlanks; i++) {
      cells.push(<div key={`b-${i}`} />);
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      const isPast = !!minDate && date < minDate;
      const isToday = sameDay(new Date(), date);
      const isStart = sameDay(startDate, date);
      const isEnd = sameDay(endDate, date);
      const hasRange = !!startDate && !!endDate;
      const inRange =
        hasRange && date > (startDate as Date) && date < (endDate as Date);

      // Continuous band: the cell wrapper carries the soft background so the
      // highlight flows between cells; endpoints round off the band's edges.
      let bandClass = "";
      if (hasRange && (inRange || isStart || isEnd) && !sameDay(startDate, endDate as Date)) {
        bandClass = "bg-brand-50";
        if (isStart) bandClass += " rounded-l-full";
        if (isEnd) bandClass += " rounded-r-full";
      }

      let btnClass =
        "w-full aspect-square flex items-center justify-center rounded-full text-sm md:text-[15px] font-medium transition-colors duration-150 select-none";
      if (isPast) {
        btnClass += " text-gray-300 cursor-not-allowed line-through";
      } else if (isStart || isEnd) {
        btnClass += " bg-brand-600 text-white font-semibold shadow-md";
      } else if (inRange) {
        btnClass += " text-brand-800 hover:bg-brand-100";
      } else if (isToday) {
        btnClass += " text-brand-700 font-semibold ring-1 ring-inset ring-brand-400 hover:bg-brand-50";
      } else {
        btnClass += " text-gray-700 hover:bg-gray-100";
      }

      cells.push(
        <div key={day} className={bandClass}>
          <button
            type="button"
            onClick={() => !isPast && onDateSelect(date)}
            disabled={isPast}
            className={btnClass}
          >
            {day}
          </button>
        </div>
      );
    }

    return (
      <div key={offset} className={offset === 1 ? "hidden md:block" : ""}>
        <div className="text-center font-semibold text-gray-900 capitalize mb-3">
          {monthName}
        </div>
        <div className="grid grid-cols-7 mb-1">
          {dayNames.map((d, i) => (
            <div
              key={i}
              className="h-8 flex items-center justify-center text-xs font-semibold text-gray-400 uppercase tracking-wide"
            >
              {d}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-y-1">{cells}</div>
      </div>
    );
  };

  const hint = !startDate
    ? t("calendar.selectArrival")
    : !endDate
    ? t("calendar.selectDeparture")
    : t("calendar.selected", {
        startDate: formatDateDDMMYYYY(startDate),
        endDate: formatDateDDMMYYYY(endDate),
      });

  return (
    <div className="w-full">
      {/* Month navigation floats over the month headers */}
      <div className="relative">
        <button
          type="button"
          onClick={() =>
            setBaseMonth(
              new Date(baseMonth.getFullYear(), baseMonth.getMonth() - 1, 1)
            )
          }
          aria-label={t("common.prevMonth")}
          className="absolute left-0 -top-1 p-2 rounded-full border border-gray-200 text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-colors z-10"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() =>
            setBaseMonth(
              new Date(baseMonth.getFullYear(), baseMonth.getMonth() + 1, 1)
            )
          }
          aria-label={t("common.nextMonth")}
          className="absolute right-0 -top-1 p-2 rounded-full border border-gray-200 text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-colors z-10"
        >
          <ChevronRight className="w-4 h-4" />
        </button>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-6 px-1">
          {renderMonth(0)}
          {renderMonth(1)}
        </div>
      </div>

      {/* Footer: hint + clear */}
      <div className="mt-5 pt-4 border-t border-gray-100 flex items-center justify-between gap-4">
        <p className="text-sm text-gray-500">{hint}</p>
        {onClear && (startDate || endDate) && (
          <button
            type="button"
            onClick={onClear}
            className="text-sm font-semibold text-gray-700 underline underline-offset-2 hover:text-gray-900 whitespace-nowrap"
          >
            {t("calendar.clearDates")}
          </button>
        )}
      </div>
    </div>
  );
}
