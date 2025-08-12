"use client";

import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { SEARCH_LOCATIONS } from "../lib/constants/cities";
import { formatDateRange } from "../lib/date";
import Calendar from "./Calendar";

interface SearchBarProps {
  onSearch: (
    location: string,
    startDate: Date | null,
    endDate: Date | null
  ) => void;
}

export default function SearchBar({ onSearch }: SearchBarProps) {
  const [showLocationPicker, setShowLocationPicker] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState("Location");
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [locationSearch, setLocationSearch] = useState("");
  const [filteredLocations, setFilteredLocations] = useState<string[]>([]);

  const locationRef = useRef<HTMLDivElement>(null);
  const dateRef = useRef<HTMLDivElement>(null);

  const locations = useMemo(() => SEARCH_LOCATIONS, []);

  // Filter locations based on search input
  useEffect(() => {
    if (locationSearch.trim() === "") {
      setFilteredLocations(locations);
    } else {
      const filtered = locations.filter((location) =>
        location.toLowerCase().includes(locationSearch.toLowerCase())
      );
      setFilteredLocations(filtered);
    }
  }, [locationSearch, locations]);

  const handleClickOutside = useCallback((event: MouseEvent) => {
    const target = event.target as Node;

    if (locationRef.current && !locationRef.current.contains(target)) {
      setShowLocationPicker(false);
    }
    if (dateRef.current && !dateRef.current.contains(target)) {
      setShowDatePicker(false);
    }
  }, []);

  useEffect(() => {
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [handleClickOutside]);

  const dateRangeLabel = useMemo(
    () => formatDateRange(startDate, endDate),
    [startDate, endDate]
  );

  const handleDateSelect = useCallback(
    (date: Date) => {
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
    onSearch(selectedLocation, startDate, endDate);
  };

  // Get today's date for minDate (allows today but not past dates)
  const today = useMemo(() => {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    return now;
  }, []);

  return (
    <div className="bg-white py-8 px-8">
      <div className="max-w-7xl mx-auto relative">
        {/* Single Responsive Search Bar */}
        <div className="flex justify-center px-16">
          <div className="w-full max-w-4xl bg-white shadow-2xl border border-gray-100 p-6 hover:shadow-3xl transition-shadow duration-300 rounded-3xl lg:rounded-full lg:flex lg:items-center lg:space-x-4 lg:space-y-0 space-y-4">
            {/* Where */}
            <div className="relative flex-1" ref={locationRef}>
              <label className="block text-sm font-medium text-gray-700 mb-2 lg:hidden">
                Where
              </label>
              <button
                onClick={() => setShowLocationPicker((prev) => !prev)}
                className="w-full text-left px-4 lg:px-6 py-3 lg:py-4 border lg:border-0 border-gray-200 lg:border-transparent rounded-xl lg:rounded-2xl hover:bg-gray-50 transition-colors text-base lg:text-lg font-medium"
              >
                {selectedLocation}
              </button>
              {showLocationPicker && (
                <div className="absolute top-full left-0 mt-2 lg:mt-3 bg-white rounded-xl lg:rounded-2xl shadow-2xl border border-gray-200 w-full lg:w-80 z-50 overflow-hidden">
                  <div className="p-4 bg-gray-50 border-b border-gray-200">
                    <h3 className="font-semibold text-gray-700 mb-3">
                      Search locations
                    </h3>
                    <input
                      type="text"
                      placeholder="Type to search..."
                      value={locationSearch}
                      onChange={(e) => setLocationSearch(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      autoFocus
                    />
                  </div>
                  <div className="max-h-64 overflow-y-auto">
                    {filteredLocations.length > 0 ? (
                      filteredLocations.map((location) => (
                        <button
                          key={location}
                          onClick={() => {
                            setSelectedLocation(location);
                            setShowLocationPicker(false);
                            setLocationSearch("");
                          }}
                          className="w-full text-left px-4 lg:px-6 py-3 lg:py-4 hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-b-0 text-base lg:text-lg bg-white"
                        >
                          {location}
                        </button>
                      ))
                    ) : (
                      <div className="px-4 lg:px-6 py-3 lg:py-4 text-gray-500 text-base lg:text-lg">
                        No locations found
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Divider - Only visible on desktop */}
            <div className="hidden lg:block w-px h-12 bg-gray-200"></div>

            {/* When */}
            <div className="relative flex-1" ref={dateRef}>
              <label className="block text-sm font-medium text-gray-700 mb-2 lg:hidden">
                When
              </label>
              <button
                onClick={() => setShowDatePicker((prev) => !prev)}
                className="w-full text-left px-4 lg:px-6 py-3 lg:py-4 border lg:border-0 border-gray-200 lg:border-transparent rounded-xl lg:rounded-2xl hover:bg-gray-50 transition-colors text-base lg:text-lg font-medium"
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
              className="w-full lg:w-auto bg-purple-600 text-white px-6 lg:px-8 py-4 rounded-xl lg:rounded-full text-lg font-semibold hover:bg-purple-700 transition-colors duration-200 shadow-lg hover:shadow-xl"
            >
              Find Match
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
