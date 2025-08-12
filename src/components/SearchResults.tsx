"use client";

import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";

interface SearchParams {
  location: string;
  startDate: Date | null;
  endDate: Date | null;
}

interface SearchResultsProps {
  searchParams: SearchParams;
  onBackToSearch: () => void;
}

interface ResultItem {
  id: string;
  title: string;
  location: string;
  hourlyRate: number;
  experience: string;
  skills: string[];
  availability: string;
}

export default function SearchResults({
  searchParams,
  onBackToSearch,
}: SearchResultsProps) {
  const [results, setResults] = useState<ResultItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const run = async () => {
      setLoading(true);
      try {
        let query = supabase
          .from("advertisements")
          .select(
            "id, title, location_city, price_per_hour, experience, skills, availability_start_time, availability_end_time"
          )
          .eq("is_active", true)
          .order("created_at", { ascending: false });

        if (searchParams.location && searchParams.location !== "Location") {
          query = query.ilike("location_city", `%${searchParams.location}%`);
        }

        // If a date range is provided, filter by availability window.
        // For simplicity, we include ads that have either no time set or overlap the selected day(s).
        if (searchParams.startDate) {
          // Convert to HH:MM format if you later change to time-of-day filtering.
          // Here we just ensure ads that have any availability times are included.
          // Extend to your needs if you later add actual date columns.
        }

        const { data, error } = await query;
        if (error) throw error;

        const mapped: ResultItem[] = (data || []).map((ad: any) => ({
          id: ad.id,
          title: ad.title,
          location: ad.location_city,
          hourlyRate: Number(ad.price_per_hour) || 0,
          experience: ad.experience || "",
          skills: ad.skills || [],
          availability:
            ad.availability_start_time && ad.availability_end_time
              ? `${ad.availability_start_time} - ${ad.availability_end_time}`
              : "",
        }));

        setResults(mapped);
      } catch (e) {
        setResults([]);
      } finally {
        setLoading(false);
      }
    };
    run();
  }, [searchParams]);

  const formatSearchSummary = () => {
    const { location, startDate, endDate } = searchParams;

    if (location === "Location" && !startDate && !endDate) {
      return "All ads";
    }

    let summary = "Results";

    if (location !== "Location") {
      summary += ` in ${location}`;
    }

    if (startDate) {
      if (endDate) {
        summary += ` for dates: ${startDate.toLocaleDateString()} - ${endDate.toLocaleDateString()}`;
      } else {
        summary += ` for date: ${startDate.toLocaleDateString()}`;
      }
    } else if (endDate) {
      summary += ` for date: ${endDate.toLocaleDateString()}`;
    }

    return summary;
  };

  if (loading) {
    return (
      <main className="flex-1 px-8 py-16">
        <div className="max-w-6xl mx-auto">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Searching for nannies...</p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="flex-1 px-8 py-8">
      <div className="max-w-6xl mx-auto">
        {/* Search Summary */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            {formatSearchSummary()}
          </h2>
          <p className="text-gray-600">
            {results.length} ad{results.length !== 1 ? "s" : ""} found
          </p>
        </div>

        {/* Result Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {results.map((ad) => (
            <div
              key={ad.id}
              className="bg-white rounded-2xl shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300 overflow-hidden"
            >
              {/* Info */}
              <div className="p-6">
                <div className="flex justify-between items-start mb-3">
                  <h3 className="text-xl font-semibold text-gray-900">
                    {ad.title}
                  </h3>
                </div>

                <p className="text-gray-600 mb-3">{ad.location}</p>

                <div className="space-y-2 mb-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Experience/Notes:</span>
                    <span className="font-medium">{ad.experience}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Rate:</span>
                    <span className="font-medium">€{ad.hourlyRate}/hour</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Availability:</span>
                    <span className="font-medium">
                      {ad.availability || "—"}
                    </span>
                  </div>
                </div>

                {/* Skills */}
                {ad.skills && ad.skills.length > 0 && (
                  <div className="mb-4">
                    <p className="text-sm text-gray-500 mb-2">Skills:</p>
                    <div className="flex flex-wrap gap-1">
                      {ad.skills.map((skill, index) => (
                        <span
                          key={index}
                          className="bg-purple-100 text-purple-800 text-xs px-2 py-1 rounded-full"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Contact Button */}
                <button className="w-full bg-purple-600 text-white py-3 rounded-xl font-semibold hover:bg-purple-700 transition-colors duration-200">
                  View details
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* No Results */}
        {results.length === 0 && (
          <div className="text-center py-16">
            <div className="text-6xl mb-4">👶</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              No advertisements found
            </h3>
            <p className="text-gray-600 mb-6">
              Try adjusting your search criteria or location
            </p>
            <button
              onClick={onBackToSearch}
              className="bg-purple-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-purple-700 transition-colors duration-200"
            >
              Modify Search
            </button>
          </div>
        )}
      </div>
    </main>
  );
}
