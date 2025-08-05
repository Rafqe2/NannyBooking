"use client";

import { useState } from "react";

interface CalendarProps {
  startDate: Date | null;
  endDate: Date | null;
  onDateSelect: (date: Date) => void;
  minDate?: Date;
}

export default function Calendar({
  startDate,
  endDate,
  onDateSelect,
  minDate,
}: CalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    return { daysInMonth, startingDayOfWeek };
  };

  const handleDateClick = (day: number) => {
    const newDate = new Date(
      currentDate.getFullYear(),
      currentDate.getMonth(),
      day
    );

    // Check if the date is in the past
    if (minDate && newDate < minDate) {
      return;
    }

    onDateSelect(newDate);
  };

  const goToPreviousMonth = () => {
    setCurrentDate(
      new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1)
    );
  };

  const goToNextMonth = () => {
    setCurrentDate(
      new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1)
    );
  };

  const isInRange = (day: number) => {
    if (!startDate || !endDate) return false;
    const date = new Date(
      currentDate.getFullYear(),
      currentDate.getMonth(),
      day
    );
    return date >= startDate && date <= endDate;
  };

  const isStartDate = (day: number) => {
    if (!startDate) return false;
    return (
      startDate.getDate() === day &&
      startDate.getMonth() === currentDate.getMonth() &&
      startDate.getFullYear() === currentDate.getFullYear()
    );
  };

  const isEndDate = (day: number) => {
    if (!endDate) return false;
    return (
      endDate.getDate() === day &&
      endDate.getMonth() === currentDate.getMonth() &&
      endDate.getFullYear() === currentDate.getFullYear()
    );
  };

  const isPastDate = (day: number) => {
    if (!minDate) return false;
    const date = new Date(
      currentDate.getFullYear(),
      currentDate.getMonth(),
      day
    );
    return date < minDate;
  };

  const { daysInMonth, startingDayOfWeek } = getDaysInMonth(currentDate);
  const monthName = currentDate.toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });

  const days = [];
  for (let i = 0; i < startingDayOfWeek; i++) {
    days.push(<div key={`empty-${i}`} className="w-12 h-12"></div>);
  }

  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(
      currentDate.getFullYear(),
      currentDate.getMonth(),
      day
    );
    const isToday = date.toDateString() === new Date().toDateString();
    const isSelected = isStartDate(day) || isEndDate(day);
    const isRange = isInRange(day);
    const isPast = isPastDate(day);

    let className =
      "w-12 h-12 rounded-full text-base font-medium transition-all duration-200 flex items-center justify-center";

    if (isPast) {
      className += " text-gray-300 cursor-not-allowed";
    } else {
      className += " cursor-pointer";
    }

    if (isSelected) {
      className += " bg-purple-600 text-white shadow-lg scale-110";
    } else if (isRange) {
      className += " bg-purple-100 text-purple-800";
    } else if (isToday) {
      className += " border-2 border-purple-600 hover:bg-gray-100";
    } else if (!isPast) {
      className += " hover:bg-gray-100 hover:scale-105";
    }

    days.push(
      <button
        key={day}
        onClick={() => handleDateClick(day)}
        className={className}
        disabled={isPast}
      >
        {day}
      </button>
    );
  }

  return (
    <div className="w-96">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <button
          onClick={goToPreviousMonth}
          className="p-3 hover:bg-gray-100 rounded-full transition-colors duration-200"
        >
          <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 19l-7-7 7-7"
            />
          </svg>
        </button>
        <h3 className="font-bold text-2xl">{monthName}</h3>
        <button
          onClick={goToNextMonth}
          className="p-3 hover:bg-gray-100 rounded-full transition-colors duration-200"
        >
          <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 5l7 7-7 7"
            />
          </svg>
        </button>
      </div>

      {/* Days of week */}
      <div className="grid grid-cols-7 gap-2 mb-6">
        {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((day) => (
          <div
            key={day}
            className="w-12 h-12 flex items-center justify-center text-sm font-bold text-gray-500"
          >
            {day}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-2">{days}</div>

      {/* Instructions */}
      <div className="mt-6 p-4 bg-gray-50 rounded-xl">
        <p className="text-sm text-gray-600">
          {!startDate
            ? "Click a date to select your arrival"
            : !endDate
            ? "Click another date to select your departure, or click the same date for a single day"
            : `Selected: ${startDate.toLocaleDateString()} - ${endDate.toLocaleDateString()}`}
        </p>
      </div>
    </div>
  );
}
