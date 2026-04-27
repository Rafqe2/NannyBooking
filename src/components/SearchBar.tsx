"use client";

import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { formatDateRange } from "../lib/date";
import Calendar from "./Calendar";
import LocationAutocomplete from "./LocationAutocomplete";
import { useTranslation } from "./LanguageProvider";

interface SearchBarProps {
  onSearch: (
    location: string,
    startDate: Date | null,
    endDate: Date | null
  ) => void;
}

export default function SearchBar({ onSearch }: SearchBarProps) {
  const { t, language } = useTranslation();
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState("Location");
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [currentLocationQuery, setCurrentLocationQuery] = useState<string>(""); // Track typed text

  const dateRef = useRef<HTMLDivElement>(null);

  const handleClickOutside = useCallback((event: MouseEvent) => {
    const target = event.target as Node;
    if (dateRef.current && !dateRef.current.contains(target)) {
      setShowDatePicker(false);
    }
  }, []);

  useEffect(() => {
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [handleClickOutside]);

  // Reset fields when global resetSearch event is dispatched (e.g., clicking site title)
  useEffect(() => {
    const handleReset = () => {
      setSelectedLocation("Location");
      setStartDate(null);
      setEndDate(null);
      setShowDatePicker(false);
    };
    if (typeof window !== "undefined") {
      window.addEventListener("resetSearch", handleReset);
    }
    return () => {
      if (typeof window !== "undefined") {
        window.removeEventListener("resetSearch", handleReset);
      }
    };
  }, []);

  const dateRangeLabel = useMemo(
    () => formatDateRange(startDate, endDate, language),
    [startDate, endDate, language]
  );

  const handleDateSelect = useCallback(
    (date: Date) => {
      // Check if clicking the same date as startDate - deselect it
      if (startDate && !endDate) {
        const clickedDateStr = date.toDateString();
        const startDateStr = startDate.toDateString();
        if (clickedDateStr === startDateStr) {
          // Deselect the date
          setStartDate(null);
          setEndDate(null);
          return;
        }
      }
      
      // Allow selecting today (no past date restriction)
      if (!startDate || (startDate && endDate)) {
        setStartDate(date);
        setEndDate(null);
      } else {
        if (date >= startDate) {
          setEndDate(date);
          // Close the popup when both dates are selected
          setTimeout(() => setShowDatePicker(false), 100);
        } else {
          setStartDate(date);
          setEndDate(null);
        }
      }
    },
    [startDate, endDate]
  );

  const handleSearch = () => {
    // Determine which location to use for search
    let locationToSearch = selectedLocation;
    
    // If user has typed something that differs from the selected location,
    // use the typed text (they're entering a new search)
    if (currentLocationQuery.trim() && currentLocationQuery.trim() !== selectedLocation) {
      // User typed something new - use the typed text
      locationToSearch = currentLocationQuery.trim();
    } else if (selectedLocation === "Location" && currentLocationQuery.trim()) {
      // User typed something but never selected a suggestion
      locationToSearch = currentLocationQuery.trim();
    }
    
    // Only pass location if it's not the default "Location" placeholder
    if (locationToSearch === "Location") {
      locationToSearch = "";
    }
    
    onSearch(locationToSearch, startDate, endDate);
  };

  // Get today's date for minDate (allows today but not past dates)
  const today = useMemo(() => {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    return now;
  }, []);

  return (
    <div className="bg-white py-6 px-4 md:px-8">
      <div className="max-w-7xl mx-auto relative">
        {/* Single Responsive Search Bar */}
        <div className="flex justify-center px-2 sm:px-4 md:px-8 lg:px-16">
          <div className="w-full max-w-4xl bg-white shadow-2xl border border-gray-100 p-4 md:p-6 hover:shadow-3xl transition-shadow duration-300 rounded-3xl lg:rounded-full lg:flex lg:items-center lg:space-x-4 lg:space-y-0 space-y-4">
            {/* Where */}
            <div className="relative flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-2 lg:hidden">
                {t("search.where")}
              </label>
              <div className="w-full">
                <LocationAutocomplete
                  value={
                    selectedLocation === "Location" ? "" : selectedLocation
                  }
                  onChange={(next) => {
                    setSelectedLocation(next.label);
                    setCurrentLocationQuery(next.label); // Update query when suggestion is selected
                  }}
                  onQueryChange={(query) => {
                    setCurrentLocationQuery(query); // Track the typed text
                    // If user is typing something different from selected location,
                    // reset selectedLocation so we use the typed text instead
                    if (query.trim() !== selectedLocation && selectedLocation !== "Location") {
                      setSelectedLocation("Location");
                    }
                  }}
                  placeholder={t("search.locationPlaceholder")}
                  variant="borderless"
                />
              </div>
            </div>

            {/* Divider - Only visible on desktop */}
            <div className="hidden lg:block w-px h-12 bg-gray-200"></div>

            {/* When */}
            <div className="relative flex-1" ref={dateRef}>
              <label className="block text-sm font-medium text-gray-700 mb-2 lg:hidden">
                {t("search.when")}
              </label>
              <button
                onClick={() => setShowDatePicker((prev) => !prev)}
                className="w-full text-left px-0 lg:px-0 py-3 lg:py-4 border-0 lg:border-0 rounded-xl lg:rounded-2xl hover:bg-gray-50 transition-colors text-base lg:text-lg font-medium"
              >
                {dateRangeLabel}
              </button>
              {showDatePicker && (
                <div className="absolute top-full left-0 mt-2 lg:mt-3 bg-white rounded-xl lg:rounded-2xl shadow-2xl border border-gray-200 p-4 lg:p-8 z-50">
                  <Calendar
                    startDate={startDate}
                    endDate={endDate}
                    onDateSelect={handleDateSelect}
                    minDate={today}
                  />
                </div>
              )}
            </div>

            {/* Divider - Only visible on desktop */}
            <div className="hidden lg:block w-px h-12 bg-gray-200"></div>

            {/* Search Button */}
            <button
              onClick={handleSearch}
              className="w-full lg:w-auto bg-brand-600 text-white px-6 lg:px-8 py-4 rounded-xl lg:rounded-full text-lg font-semibold hover:bg-brand-700 transition-colors duration-200 shadow-lg hover:shadow-xl"
            >
              {t("search.findMatch")}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
