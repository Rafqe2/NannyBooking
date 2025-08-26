"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { supabase } from "../lib/supabase";
import { toLocalYYYYMMDD } from "../lib/date";
import { useSupabaseUser } from "../lib/useSupabaseUser";

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
  ownerId?: string;
  ownerFullName?: string;
  ownerMemberSince?: string;
  ownerPicture?: string | null;
  ownerRating?: number;
  ownerReviewsCount?: number;
  locations?: string[];
}

export default function SearchResults({
  searchParams,
  onBackToSearch,
}: SearchResultsProps) {
  const [results, setResults] = useState<ResultItem[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useSupabaseUser();
  const [viewerType, setViewerType] = useState<null | "parent" | "nanny">(null);
  const runIdRef = useRef(0);

  useEffect(() => {
    const fetchViewerType = async () => {
      // Default to null until we know; avoid showing any results until resolved
      try {
        if (!user?.id) {
          setViewerType(null);
          return;
        }
        const { data } = await supabase
          .from("users")
          .select("user_type")
          .eq("id", user.id)
          .maybeSingle();
        if (data?.user_type === "parent" || data?.user_type === "nanny") {
          setViewerType(data.user_type as any);
        } else {
          setViewerType(null);
        }
      } catch {
        setViewerType(null);
      }
    };
    fetchViewerType();
  }, [user?.id]);

  useEffect(() => {
    const run = async () => {
      const runId = ++runIdRef.current;
      // Wait for viewerType to resolve before first render to avoid role flicker
      if (user?.id && viewerType === null) {
        setLoading(true);
        return;
      }
      setLoading(true);
      // Clear previous results immediately to avoid showing stale/wrong-role items
      setResults([]);
      try {
        // Do not persist here; we only persist when navigating to details

        const locationParam =
          searchParams.location && searchParams.location !== "Location"
            ? searchParams.location
            : null;
        const startDateParam = searchParams.startDate
          ? new Date(searchParams.startDate)
          : null;
        const endDateParam = searchParams.endDate
          ? new Date(searchParams.endDate)
          : startDateParam;

        let mapped: ResultItem[] = [];
        try {
          const rpcParams: Record<string, any> = {
            p_location: locationParam,
            p_start_date: startDateParam
              ? toLocalYYYYMMDD(startDateParam)
              : null,
            p_end_date: endDateParam ? toLocalYYYYMMDD(endDateParam) : null,
          };
          if (viewerType) {
            rpcParams.p_viewer_type = viewerType;
          }
          const { data, error } = await supabase.rpc("search_ads", rpcParams);
          if (error) {
            console.error("RPC search_ads error", error);
            throw error;
          }
          const mappedLocal = ((data as any[] | null) || []).map((ad: any) => ({
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
            ownerId: ad.owner_id,
            ownerFullName: ad.owner_full_name,
            ownerMemberSince: ad.owner_member_since,
            ownerPicture: ad.owner_picture,
            ownerRating:
              typeof ad.owner_rating === "number"
                ? ad.owner_rating
                : Number(ad.owner_rating || 0),
            ownerReviewsCount: Number(ad.owner_reviews_count || 0),
            locations: ad.locations || [],
          }));
          if (runId !== runIdRef.current) return;
          mapped = mappedLocal;
        } catch (_rpcErr) {
          // Fallback only for unauthenticated viewers; avoid wrong-role results for signed-in users
          if (!user?.id) {
            let query = supabase
              .from("advertisements")
              .select(
                "id, title, location_city, price_per_hour, experience, skills, availability_start_time, availability_end_time"
              )
              .eq("is_active", true)
              .order("created_at", { ascending: false });

            if (locationParam) {
              query = query.ilike("location_city", `%${locationParam}%`);
            }

            const { data, error } = await query;
            if (error) {
              console.error("Fallback advertisements query error", error);
              throw error;
            }
            const mappedLocal = (data || []).map((ad: any) => ({
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
            if (runId !== runIdRef.current) return;
            mapped = mappedLocal;
          } else {
            // Signed-in and RPC failed: keep empty until next retry to avoid cross-role flicker
            mapped = [];
          }
        }

        if (runId === runIdRef.current) {
          setResults(mapped);
        }
      } catch (e) {
        if (runId === runIdRef.current) {
          setResults([]);
        }
      } finally {
        if (runId === runIdRef.current) {
          setLoading(false);
        }
      }
    };
    run();
  }, [searchParams, viewerType]);

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
            <p className="text-gray-600">Searching…</p>
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

                {/* Owner card */}
                {(ad.ownerFullName || ad.ownerRating !== undefined) && (
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-full overflow-hidden bg-purple-100 flex items-center justify-center text-purple-700 font-semibold">
                      {ad.ownerPicture ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={ad.ownerPicture}
                          alt={ad.ownerFullName || "Owner"}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        (ad.ownerFullName || "?").charAt(0).toUpperCase()
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="text-sm font-medium text-gray-900">
                        {ad.ownerFullName || "—"}
                      </div>
                      <div className="text-xs text-gray-500 flex items-center gap-2">
                        <span>
                          📍 {ad.location}
                          {ad.locations && ad.locations.length > 0 && (
                            <>
                              {" "}
                              · Also: {ad.locations.slice(0, 2).join(", ")}
                              {ad.locations.length > 2
                                ? ` +${ad.locations.length - 2}`
                                : ""}
                            </>
                          )}
                        </span>
                        {ad.ownerMemberSince && (
                          <span>
                            · Joined{" "}
                            {new Date(ad.ownerMemberSince).toLocaleDateString(
                              undefined,
                              { year: "numeric", month: "short" }
                            )}
                          </span>
                        )}
                      </div>
                    </div>
                    {ad.ownerRating !== undefined && (
                      <div className="text-xs text-gray-700">
                        ⭐ {Number(ad.ownerRating).toFixed(1)} (
                        {ad.ownerReviewsCount || 0})
                      </div>
                    )}
                  </div>
                )}

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

                {/* CTA */}
                <Link
                  href={`/advertisement/${ad.id}`}
                  className="block text-center w-full bg-purple-600 text-white py-3 rounded-xl font-semibold hover:bg-purple-700 transition-colors duration-200"
                  onClick={() => {
                    try {
                      if (typeof window !== "undefined") {
                        const toStore = {
                          location: searchParams.location,
                          startDate: searchParams.startDate
                            ? searchParams.startDate.toISOString()
                            : null,
                          endDate: searchParams.endDate
                            ? searchParams.endDate.toISOString()
                            : null,
                          openResults: true,
                        };
                        sessionStorage.setItem(
                          "auklite:lastSearch",
                          JSON.stringify(toStore)
                        );
                        sessionStorage.setItem("auklite:restoreNext", "1");
                      }
                    } catch {}
                  }}
                >
                  View details
                </Link>
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
