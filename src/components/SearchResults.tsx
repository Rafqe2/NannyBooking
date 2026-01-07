"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { supabase } from "../lib/supabase";
import { toLocalYYYYMMDD, formatDateDDMMYYYY } from "../lib/date";
import { useSupabaseUser } from "../lib/useSupabaseUser";
import { useTranslation } from "./LanguageProvider";
import { getTranslatedSkill } from "../lib/constants/skills";
import { AdvertisementService } from "../lib/advertisementService";
import AdvancedSearchFilters, {
  AdvancedFilters,
  DEFAULT_FILTERS,
} from "./AdvancedSearchFilters";

interface SearchParams {
  location: string;
  startDate: Date | null;
  endDate: Date | null;
}

interface SearchResultsProps {
  searchParams: SearchParams;
  onBackToSearch: () => void;
}

interface AvailabilitySlot {
  available_date: string;
  start_time: string;
  end_time: string;
}

interface ResultItem {
  id: string;
  title: string;
  location: string;
  hourlyRate: number;
  experience: string;
  skills: string[];
  availability: string;
  availabilitySlots?: AvailabilitySlot[];
  adType?: "short-term" | "long-term";
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
  const { t, language } = useTranslation();
  const [results, setResults] = useState<ResultItem[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useSupabaseUser();
  const [viewerType, setViewerType] = useState<null | "parent" | "nanny">(null);
  const runIdRef = useRef(0);
  const [filters, setFilters] = useState<AdvancedFilters>(DEFAULT_FILTERS);

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
            p_price_min: filters.priceMin,
            p_price_max: filters.priceMax,
            p_skills: filters.skills.length > 0 ? filters.skills : null,
            p_min_rating: filters.minRating,
            p_has_reviews: filters.hasReviews,
            p_verified_only: filters.verifiedOnly,
          };
          if (viewerType) {
            rpcParams.p_viewer_type = viewerType;
          }
          const { data, error } = await supabase.rpc("search_ads", rpcParams);
          if (error) {
            console.warn(
              "RPC search_ads failed:",
              error.message,
              "- Using fallback"
            );
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
            adType: ad.type || "long-term",
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
            availabilitySlots: [], // Will be loaded separately
          }));
          
          // Fetch ad types and availability slots
          if (runId === runIdRef.current) {
            // First, fetch types for all ads
            const adIds = mappedLocal.map((ad) => ad.id);
            const { data: adTypesData } = await supabase
              .from("advertisements")
              .select("id, type")
              .in("id", adIds);
            
            const typeMap = new Map(
              (adTypesData || []).map((a: any) => [a.id, a.type])
            );
            
            // Update ad types
            mappedLocal.forEach((ad) => {
              ad.adType = typeMap.get(ad.id) || "long-term";
            });
            
            // Fetch availability slots for short-term ads
            const shortTermAds = mappedLocal.filter((ad) => ad.adType === "short-term");
            const availabilityPromises = shortTermAds.map(async (ad) => {
              try {
                const slots = await AdvertisementService.getAvailabilitySlots(ad.id);
                return { id: ad.id, slots };
              } catch (error) {
                console.error(`Error fetching slots for ad ${ad.id}:`, error);
                return { id: ad.id, slots: [] };
              }
            });
            
            const availabilityResults = await Promise.all(availabilityPromises);
            const availabilityMap = new Map(
              availabilityResults.map((r) => [r.id, r.slots])
            );
            
            mappedLocal.forEach((ad) => {
              ad.availabilitySlots = availabilityMap.get(ad.id) || [];
            });
          }
          
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
              console.warn(
                "Fallback query failed:",
                error.message,
                "- Check database permissions"
              );
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
  }, [searchParams, viewerType, filters]);

  const formatSearchSummary = () => {
    const { location, startDate, endDate } = searchParams;

    if (location === "Location" && !startDate && !endDate) {
      return t("search.allAds");
    }

    let summary = t("search.results");

    if (location !== "Location") {
      summary = t("search.resultsIn", { location });
    }

    const locale =
      language === "lv" ? "lv-LV" : language === "ru" ? "ru-RU" : "en-US";

    if (startDate) {
      if (endDate) {
        const dateRange = `${formatDateDDMMYYYY(
          startDate
        )} - ${formatDateDDMMYYYY(endDate)}`;
        summary += ` ${t("search.forDates", { dates: dateRange })}`;
      } else {
        const date = formatDateDDMMYYYY(startDate);
        summary += ` ${t("search.forDate", { date })}`;
      }
    } else if (endDate) {
      const date = formatDateDDMMYYYY(endDate);
      summary += ` ${t("search.forDate", { date })}`;
    }

    return summary;
  };

  if (loading) {
    return (
      <main className="flex-1 px-8 py-16">
        <div className="max-w-6xl mx-auto">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
            <p className="text-gray-600">{t("search.searching")}</p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="flex-1 px-8 py-8">
      <div className="max-w-6xl mx-auto">
        {/* Search Summary and Filters */}
        <div className="mb-8 flex items-start justify-between gap-4">
          <div className="flex-1">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              {formatSearchSummary()}
            </h2>
            <p className="text-gray-600">
              {t("search.resultsFound", {
                count: results.length,
                plural:
                  results.length !== 1
                    ? language === "lv"
                      ? "i"
                      : language === "ru"
                      ? "я"
                      : "s"
                    : "",
              })}
            </p>
          </div>
          <AdvancedSearchFilters
            filters={filters}
            onChange={setFilters}
            onApply={() => {
              // Trigger search by updating filters state (already in dependency array)
            }}
            onReset={() => {
              setFilters(DEFAULT_FILTERS);
            }}
          />
        </div>

        {/* Result Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {results.map((ad) => (
            <div
              key={ad.id}
              className="group bg-white rounded-2xl shadow-sm border border-gray-200 hover:shadow-xl hover:border-purple-200 transition-all duration-300 overflow-hidden cursor-pointer"
            >
              <Link
                href={`/advertisement/${ad.id}`}
                className="block h-full"
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
                        "nannybooking:lastSearch",
                        JSON.stringify(toStore)
                      );
                      sessionStorage.setItem("nannybooking:restoreNext", "1");
                    }
                  } catch {}
                }}
              >
                <div className="h-full flex flex-col">
                  {/* Header - Title, Pricing, Location, and Rating */}
                  <div className="bg-gray-50 px-6 pt-5 pb-4 border-b border-gray-200">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        {/* Title */}
                        <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2 group-hover:text-purple-600 transition-colors">
                          {ad.title}
                        </h3>
                        {/* Pricing */}
                        <div className="flex items-baseline gap-2 mb-2">
                          <span className="text-2xl font-bold text-purple-600">
                            €{ad.hourlyRate}
                          </span>
                          <span className="text-sm text-gray-500">
                            {t("ad.perHour")}
                          </span>
                        </div>
                        {/* Location */}
                        <div className="flex items-center gap-1 text-sm text-gray-600">
                          <span>📍</span>
                          <span className="truncate">
                            {ad.location}
                            {ad.locations && ad.locations.length > 0 && (
                              <span className="ml-1">+{ad.locations.length}</span>
                            )}
                          </span>
                        </div>
                      </div>
                      {/* Rating Stars - Right Side */}
                      {ad.ownerRating !== undefined && (
                        <div className="flex flex-col items-end gap-1 flex-shrink-0">
                          <div className="flex items-center gap-1">
                            {[...Array(5)].map((_, i) => (
                              <span
                                key={i}
                                className={`text-lg ${
                                  i < Math.round(Number(ad.ownerRating))
                                    ? "text-yellow-400"
                                    : "text-gray-300"
                                }`}
                              >
                                ★
                              </span>
                            ))}
                          </div>
                          <div className="flex items-center gap-1">
                            <span className="text-sm font-semibold text-gray-900">
                              {Number(ad.ownerRating).toFixed(1)}
                            </span>
                            <span className="text-xs text-gray-500">
                              ({ad.ownerReviewsCount || 0})
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* Content */}
                  <div className="p-6 flex-1 flex flex-col">

                  {/* Owner Profile */}
                  {user && (ad.ownerFullName || ad.ownerRating !== undefined) && (
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-12 h-12 rounded-full overflow-hidden bg-gradient-to-br from-purple-100 to-purple-200 flex items-center justify-center text-purple-700 font-semibold flex-shrink-0">
                        {ad.ownerPicture ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={ad.ownerPicture}
                            alt={ad.ownerFullName || "Owner"}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <span className="text-lg">
                            {(ad.ownerFullName || "?").charAt(0).toUpperCase()}
                          </span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-gray-900 truncate">
                          {ad.ownerFullName || "—"}
                        </div>
                        {ad.ownerMemberSince && (
                          <div className="text-xs text-gray-400">
                            {t("ad.joined")}{" "}
                            {new Date(ad.ownerMemberSince).toLocaleDateString(
                              undefined,
                              { year: "numeric", month: "short" }
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Skills Preview */}
                  {ad.skills && ad.skills.length > 0 && (
                    <div className="mb-4 flex-1">
                      <div className="flex flex-wrap gap-1">
                        {ad.skills.slice(0, 3).map((skill, index) => (
                          <span
                            key={index}
                            className="bg-purple-50 text-purple-700 text-xs px-2 py-1 rounded-md font-medium"
                          >
                            {getTranslatedSkill(skill, language)}
                          </span>
                        ))}
                        {ad.skills.length > 3 && (
                          <span className="bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded-md">
                            +{ad.skills.length - 3}{" "}
                            {t("ad.moreSkills", {
                              count: ad.skills.length - 3,
                            })}
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Experience Preview */}
                  {ad.experience && (
                    <div className="mb-4">
                      <p className="text-sm text-gray-600 line-clamp-2">
                        {ad.experience}
                      </p>
                    </div>
                  )}

                  {/* Availability - Dates and Times */}
                  {ad.adType === "short-term" && ad.availabilitySlots && ad.availabilitySlots.length > 0 && (
                    <div className="mb-4">
                      <div className="text-xs font-medium text-gray-700 mb-2">
                        {t("ad.availability")}
                      </div>
                      <div className="space-y-1.5">
                        {(() => {
                          // Group slots by date
                          const grouped = new Map<string, typeof ad.availabilitySlots>();
                          ad.availabilitySlots.forEach((slot) => {
                            if (!grouped.has(slot.available_date)) {
                              grouped.set(slot.available_date, []);
                            }
                            grouped.get(slot.available_date)!.push(slot);
                          });
                          // Get first 3 dates
                          const dates = Array.from(grouped.keys())
                            .sort()
                            .slice(0, 3);
                          return dates.map((date) => {
                            const slots = grouped.get(date)!;
                            return (
                              <div
                                key={date}
                                className="flex items-center justify-between text-xs bg-gray-50 border border-gray-200 rounded px-2 py-1.5"
                              >
                                <span className="font-medium text-gray-900">
                                  {formatDateDDMMYYYY(new Date(date + "T00:00:00Z"))}
                                </span>
                                <div className="flex gap-1.5 flex-wrap">
                                  {slots.slice(0, 2).map((slot, idx) => (
                                    <span
                                      key={idx}
                                      className="text-gray-600 font-mono"
                                    >
                                      {slot.start_time}-{slot.end_time}
                                    </span>
                                  ))}
                                  {slots.length > 2 && (
                                    <span className="text-gray-500">
                                      +{slots.length - 2}
                                    </span>
                                  )}
                                </div>
                              </div>
                            );
                          });
                        })()}
                        {ad.availabilitySlots.length > 3 && (
                          <div className="text-xs text-gray-500 text-center pt-1">
                            +{ad.availabilitySlots.length - 3} {t("ad.moreDates")}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                  {ad.adType === "long-term" && ad.availability && (
                    <div className="mb-4">
                      <div className="text-xs font-medium text-gray-700 mb-1">
                        {t("ad.availability")}
                      </div>
                      <div className="text-xs text-gray-600">
                        ⏰ {ad.availability}
                      </div>
                    </div>
                  )}

                    {/* Action Button */}
                    <div className="mt-auto pt-4">
                      <div className="w-full bg-purple-600 text-white py-3 px-4 rounded-xl font-medium text-center group-hover:bg-purple-700 transition-colors duration-200 flex items-center justify-center gap-2">
                        <span>{t("ad.viewDetails")}</span>
                        <svg
                          className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-200"
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
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            </div>
          ))}
        </div>

        {/* No Results */}
        {results.length === 0 && (
          <div className="text-center py-16">
            <div className="text-6xl mb-4">👶</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              {t("search.noResultsTitle")}
            </h3>
            <p className="text-gray-600 mb-6">{t("search.noResultsDesc")}</p>
            <button
              onClick={onBackToSearch}
              className="bg-purple-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-purple-700 transition-colors duration-200"
            >
              {t("search.modifySearch")}
            </button>
          </div>
        )}
      </div>
    </main>
  );
}
