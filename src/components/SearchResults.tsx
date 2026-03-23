"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import Link from "next/link";
import { Baby } from "lucide-react";
import { supabase } from "../lib/supabase";
import { toLocalYYYYMMDD, formatDateDDMMYYYY, stripLatvianGada } from "../lib/date";
import { useSupabaseUser } from "../lib/useSupabaseUser";
import { useTranslation } from "./LanguageProvider";
import { getTranslatedSkill } from "../lib/constants/skills";
import { AdvertisementService } from "../lib/advertisementService";
import AdvancedSearchFilters, {
  AdvancedFilters,
  DEFAULT_FILTERS,
} from "./AdvancedSearchFilters";
import { getNearbyCities } from "../lib/constants/nearbyLocations";
import ErrorBoundary from "./ErrorBoundary";

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
  const [sortBy, setSortBy] = useState<"newest" | "price_asc" | "price_desc" | "rating">("newest");

  const sortedResults = useMemo(() => {
    const arr = [...results];
    switch (sortBy) {
      case "price_asc":
        return arr.sort((a, b) => (a.hourlyRate || 0) - (b.hourlyRate || 0));
      case "price_desc":
        return arr.sort((a, b) => (b.hourlyRate || 0) - (a.hourlyRate || 0));
      case "rating":
        return arr.sort((a, b) => (b.ownerRating || 0) - (a.ownerRating || 0));
      case "newest":
      default:
        return arr; // already ordered by created_at desc from the server
    }
  }, [results, sortBy]);

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

        const rawLocation =
          searchParams.location && searchParams.location !== "Location"
            ? searchParams.location
            : null;
        // Strip to city/town name only (before first comma) for broader ILIKE matching
        const locationParam = rawLocation
          ? rawLocation.split(",")[0].trim()
          : null;
        const startDateParam = searchParams.startDate
          ? new Date(searchParams.startDate)
          : null;
        const endDateParam = searchParams.endDate
          ? new Date(searchParams.endDate)
          : startDateParam;

        // Look up nearby cities for expanded search
        const nearbyCities = locationParam
          ? getNearbyCities(locationParam)
          : [];

        let mapped: ResultItem[] = [];
        try {
          const rpcParams: Record<string, any> = {
            p_location: locationParam,
            p_start_date: startDateParam
              ? toLocalYYYYMMDD(startDateParam)
              : null,
            p_end_date: endDateParam ? toLocalYYYYMMDD(endDateParam) : null,
            p_skills: filters.skills.length > 0 ? filters.skills : null,
            p_has_reviews: filters.hasReviews,
            p_verified_only: filters.verifiedOnly,
            p_ad_type: filters.adType || null,
          };
          if (viewerType) {
            rpcParams.p_viewer_type = viewerType;
          }
          if (nearbyCities.length > 0) {
            rpcParams.p_nearby_locations = nearbyCities;
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
            availabilitySlots: [] as AvailabilitySlot[], // Will be loaded separately
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
              ad.availabilitySlots = availabilityMap.get(ad.id) || ([] as AvailabilitySlot[]);
            });
          }
          
          if (runId !== runIdRef.current) return;
          mapped = mappedLocal;
        } catch (_rpcErr) {
          mapped = [];
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
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-600 mx-auto mb-4"></div>
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
                count: sortedResults.length,
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
          <div className="flex items-center gap-2">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
              className="text-sm border border-gray-200 rounded-xl px-3 py-2.5 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-brand-500 shadow-sm h-[42px]"
              aria-label={t("search.sortBy")}
            >
              <option value="newest">{t("search.sortNewest")}</option>
              <option value="price_asc">{t("search.sortPriceAsc")}</option>
              <option value="price_desc">{t("search.sortPriceDesc")}</option>
              <option value="rating">{t("search.sortRating")}</option>
            </select>
            <AdvancedSearchFilters
              filters={filters}
              onChange={setFilters}
              onApply={() => {}}
              onReset={() => setFilters(DEFAULT_FILTERS)}
            />
          </div>
        </div>

        {/* Result Cards */}
        <ErrorBoundary>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sortedResults.map((ad) => {
            return (
            <div
              key={ad.id}
              className="group bg-white rounded-2xl shadow-sm border border-gray-100 hover:border-brand-200 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 overflow-hidden cursor-pointer"
            >
              <Link
                href={user ? `/advertisement/${ad.id}` : "/login"}
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
                <div className="h-full flex flex-col p-5">
                  {/* Top row: avatar + name + rating + type badge */}
                  <div className="flex items-start gap-3 mb-4">
                    <div className="w-12 h-12 rounded-full overflow-hidden flex items-center justify-center font-bold text-lg flex-shrink-0 border-2 border-white shadow-sm bg-brand-100 text-brand-700">
                      {ad.ownerPicture ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={ad.ownerPicture} alt={ad.ownerFullName || ""} className="w-full h-full object-cover" />
                      ) : (
                        <span>{(ad.ownerFullName || "?").charAt(0).toUpperCase()}</span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <p className="font-semibold text-gray-900 truncate text-sm leading-tight">
                          {ad.ownerFullName || "—"}
                        </p>
                        <span className={`flex-shrink-0 text-xs px-2 py-0.5 rounded-full font-medium ${ad.adType === "long-term" ? "bg-brand-50 text-brand-600" : "bg-emerald-50 text-emerald-600"}`}>
                          {ad.adType === "long-term" ? t("ad.longTerm") : t("ad.shortTerm")}
                        </span>
                      </div>
                      {/* Rating */}
                      {Number(ad.ownerRating) > 0 ? (
                        <div className="flex items-center gap-1 mt-0.5">
                          <svg className="w-3.5 h-3.5 text-accent fill-current" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/></svg>
                          <span className="text-xs font-semibold text-gray-800">{Number(ad.ownerRating).toFixed(1)}</span>
                          <span className="text-xs text-gray-400">({ad.ownerReviewsCount || 0})</span>
                        </div>
                      ) : (
                        <p className="text-xs text-gray-400 mt-0.5">{t("ad.noReviews")}</p>
                      )}
                    </div>
                  </div>

                  {/* Title */}
                  <h3 className="text-base font-semibold text-gray-900 mb-1 line-clamp-2 group-hover:text-brand-600 transition-colors leading-snug">
                    {ad.title}
                  </h3>

                  {/* Location */}
                  <div className="flex items-center gap-1 text-xs text-gray-500 mb-3">
                    <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
                    <span className="truncate">{ad.location}{ad.locations && ad.locations.length > 0 && <span className="text-gray-400"> +{ad.locations.length}</span>}</span>
                  </div>

                  {/* Skills */}
                  {ad.skills && ad.skills.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-3">
                      {ad.skills.slice(0, 3).map((skill, i) => (
                        <span key={i} className="bg-brand-50 text-brand-700 text-xs px-2 py-0.5 rounded-md font-medium border border-brand-100">
                          {getTranslatedSkill(skill, language)}
                        </span>
                      ))}
                      {ad.skills.length > 3 && (
                        <span className="bg-gray-100 text-gray-500 text-xs px-2 py-0.5 rounded-md">+{ad.skills.length - 3}</span>
                      )}
                    </div>
                  )}

                  {/* Availability dates (short-term) */}
                  {ad.adType === "short-term" && ad.availabilitySlots && ad.availabilitySlots.length > 0 && (
                    <div className="mb-3">
                      <div className="flex flex-wrap gap-1">
                        {Array.from(new Set(ad.availabilitySlots.map(s => s.available_date))).sort().slice(0, 3).map((date) => (
                          <span key={date} className="text-xs bg-emerald-50 text-emerald-700 border border-emerald-100 px-2 py-0.5 rounded-md font-medium">
                            {formatDateDDMMYYYY(new Date(date + "T00:00:00Z"))}
                          </span>
                        ))}
                        {new Set(ad.availabilitySlots.map(s => s.available_date)).size > 3 && (
                          <span className="text-xs text-gray-400 px-1 py-0.5">+{new Set(ad.availabilitySlots.map(s => s.available_date)).size - 3} {t("ad.moreDates")}</span>
                        )}
                      </div>
                    </div>
                  )}
                  {ad.adType === "long-term" && ad.availability && (
                    <div className="mb-3 text-xs text-gray-500 flex items-center gap-1">
                      <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                      {ad.availability}
                    </div>
                  )}

                  {/* Footer: price + CTA */}
                  <div className="mt-auto pt-3 border-t border-gray-100 flex items-center justify-between">
                    <div className="flex items-baseline gap-1">
                      <span className="text-xl font-bold text-accent-dark">€{ad.hourlyRate}</span>
                      <span className="text-xs text-gray-400">{t("ad.perHour")}</span>
                    </div>
                    <div className="flex items-center gap-1 text-sm font-semibold group-hover:gap-2 transition-all text-brand-600">
                      {t("ad.viewDetails")}
                      <svg className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7"/></svg>
                    </div>
                  </div>
                </div>
              </Link>
            </div>
          );
          })}
        </div>
        </ErrorBoundary>

        {/* No Results */}
        {results.length === 0 && (
          <div className="text-center py-16">
            <div className="flex justify-center mb-4"><Baby className="w-14 h-14 text-brand-300" /></div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              {t("search.noResultsTitle")}
            </h3>
            <p className="text-gray-600 mb-6">{t("search.noResultsDesc")}</p>
            <button
              onClick={onBackToSearch}
              className="bg-brand-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-brand-700 transition-colors duration-200"
            >
              {t("search.modifySearch")}
            </button>
          </div>
        )}
      </div>
    </main>
  );
}
