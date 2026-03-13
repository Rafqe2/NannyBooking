"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import SearchBar from "./SearchBar";
import Footer from "./Footer";
import SearchResults from "./SearchResults";
import RecentlyViewed from "./RecentlyViewed";
import { useTranslation } from "./LanguageProvider";
import { useSupabaseUser } from "../lib/useSupabaseUser";
import { supabase } from "../lib/supabase";
import { getNearbyCities } from "../lib/constants/nearbyLocations";

interface NearbyNanny {
  id: string;
  title: string;
  location_city: string;
  price_per_hour: number;
  owner_id: string;
  owner_full_name: string | null;
  owner_picture: string | null;
  owner_rating: number;
  owner_reviews_count: number;
}

export default function HomeClient({
  initialLocation,
  initialStartDate,
  initialEndDate,
  initialShowResults,
}: {
  initialLocation?: string;
  initialStartDate?: Date | null;
  initialEndDate?: Date | null;
  initialShowResults?: boolean;
}) {
  const { t } = useTranslation();
  const { user, isLoading: authLoading } = useSupabaseUser();
  const [searchParams, setSearchParams] = useState({
    location: initialLocation || "Location",
    startDate: (initialStartDate as Date | null) || null,
    endDate: (initialEndDate as Date | null) || null,
  });
  const [showResults, setShowResults] = useState(() => {
    if (typeof window !== "undefined") {
      try {
        const forceHome = sessionStorage.getItem("nannybooking:forceHome");
        if (forceHome) return false;
      } catch {}
    }
    return !!initialShowResults;
  });

  const [nearbyNannies, setNearbyNannies] = useState<NearbyNanny[]>([]);
  const [nearbyParentAds, setNearbyParentAds] = useState<NearbyNanny[]>([]);
  const [userCity, setUserCity] = useState<string | null>(null);
  const [isParent, setIsParent] = useState(false);
  const [isNanny, setIsNanny] = useState(false);

  useEffect(() => {
    try {
      if (typeof window !== "undefined") {
        const forceHome = sessionStorage.getItem("nannybooking:forceHome");
        if (forceHome) {
          setSearchParams({ location: "Location", startDate: null, endDate: null });
          setShowResults(false);
          sessionStorage.removeItem("nannybooking:forceHome");
          window.dispatchEvent(new CustomEvent("resetSearch"));
        }
      }
    } catch {}
  }, []);

  // Reset results when header logo is clicked
  useEffect(() => {
    const handler = () => setShowResults(false);
    if (typeof window !== "undefined") {
      window.addEventListener("resetSearch", handler);
    }
    return () => {
      if (typeof window !== "undefined") {
        window.removeEventListener("resetSearch", handler);
      }
    };
  }, []);

  // Load nearby ads based on user type
  useEffect(() => {
    if (!user?.id) return;
    const load = async () => {
      const { data: profile } = await supabase
        .from("users")
        .select("user_type, location")
        .eq("id", user.id)
        .single();
      const city = profile?.location?.split(",")[0].trim() || null;
      setUserCity(city);
      const nearbyCities = city ? [city, ...getNearbyCities(city)] : [];

      if (profile?.user_type === "parent") {
        setIsParent(true);
        // Parents see nearby nanny ads
        const { data } = await supabase.rpc("search_ads", {
          p_location: city,
          p_start_date: null,
          p_end_date: null,
          p_skills: null,
          p_has_reviews: false,
          p_verified_only: false,
          p_ad_type: null,
          p_viewer_type: "parent",
          p_nearby_locations: nearbyCities.length > 1 ? nearbyCities : null,
        });
        if (data && Array.isArray(data)) {
          setNearbyNannies(
            data.slice(0, 8).map((ad: any) => ({
              id: ad.id,
              title: ad.title,
              location_city: ad.location_city,
              price_per_hour: Number(ad.price_per_hour) || 0,
              owner_id: ad.owner_id,
              owner_full_name: ad.owner_full_name || null,
              owner_picture: ad.owner_picture || null,
              owner_rating: Number(ad.owner_rating) || 0,
              owner_reviews_count: Number(ad.owner_reviews_count) || 0,
            }))
          );
        }
      } else if (profile?.user_type === "nanny") {
        setIsNanny(true);
        // Nannies see nearby parent job posts
        const { data } = await supabase.rpc("search_ads", {
          p_location: city,
          p_start_date: null,
          p_end_date: null,
          p_skills: null,
          p_has_reviews: false,
          p_verified_only: false,
          p_ad_type: null,
          p_viewer_type: "nanny",
          p_nearby_locations: nearbyCities.length > 1 ? nearbyCities : null,
        });
        if (data && Array.isArray(data)) {
          setNearbyParentAds(
            data.slice(0, 8).map((ad: any) => ({
              id: ad.id,
              title: ad.title,
              location_city: ad.location_city,
              price_per_hour: Number(ad.price_per_hour) || 0,
              owner_id: ad.owner_id,
              owner_full_name: ad.owner_full_name || null,
              owner_picture: ad.owner_picture || null,
              owner_rating: Number(ad.owner_rating) || 0,
              owner_reviews_count: Number(ad.owner_reviews_count) || 0,
            }))
          );
        }
      }
    };
    load();
  }, [user?.id]);

  const handleSearch = (
    location: string,
    startDate: Date | null,
    endDate: Date | null
  ) => {
    setSearchParams({ location, startDate, endDate });
    setShowResults(true);
  };

  return (
    <>
      {/* Search Bar - At Top */}
      <div className="bg-white border-b border-gray-200 shadow-lg">
        <SearchBar onSearch={handleSearch} />
      </div>
      {/* Main Content */}
      {!showResults ? (
        <main className="flex-1">
          {/* Hero — only shown to guests; hidden while auth resolves to prevent flash */}
          {!authLoading && !user && (
            <section className="px-4 sm:px-6 md:px-8 pt-14 pb-16 bg-gradient-to-b from-purple-50/70 via-purple-50/20 to-white">
              <div className="text-center max-w-5xl mx-auto">
                <h1 className="text-4xl sm:text-5xl md:text-7xl font-extrabold mb-6 leading-tight tracking-tight">
                  <span className="text-gray-900">{t("home.heroTitle")}</span>
                  <span className="block bg-gradient-to-r from-purple-600 to-indigo-500 bg-clip-text text-transparent">
                    {t("home.heroSubtitle")}
                  </span>
                </h1>
                <p className="text-lg md:text-xl text-gray-500 max-w-3xl mx-auto leading-relaxed mb-10">
                  {t("home.heroDescription")}
                </p>
                <div className="flex flex-wrap justify-center gap-4 mb-10">
                  <Link
                    href="/for-parents"
                    className="inline-flex items-center gap-2 px-7 py-3 bg-purple-600 text-white font-semibold rounded-xl hover:bg-purple-700 shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 text-sm"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
                    {t("home.forParents")}
                  </Link>
                  <Link
                    href="/for-nannies"
                    className="inline-flex items-center gap-2 px-7 py-3 bg-white text-purple-700 font-semibold rounded-xl hover:bg-purple-50 border border-purple-200 hover:border-purple-400 shadow-sm hover:-translate-y-0.5 transition-all duration-200 text-sm"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4"/></svg>
                    {t("home.forNannies")}
                  </Link>
                </div>
              </div>
            </section>
          )}

          {/* Nannies Near You — shown only to parents with a location set */}
          {isParent && nearbyNannies.length > 0 && (
            <section className="px-4 sm:px-6 md:px-8 py-10 bg-white">
              <div className="max-w-6xl mx-auto">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">
                      {userCity ? t("home.nanniesNear", { city: userCity }) : t("home.nanniesNearYou")}
                    </h2>
                    <p className="text-sm text-gray-500 mt-0.5">{t("home.availableChildcare")}</p>
                  </div>
                  <button
                    onClick={() => {
                      setSearchParams({ location: userCity || "Location", startDate: null, endDate: null });
                      setShowResults(true);
                    }}
                    className="text-sm text-purple-600 font-medium hover:underline flex items-center gap-1"
                  >
                    {t("common.seeAll")}
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7"/></svg>
                  </button>
                </div>
                <div className="flex gap-4 overflow-x-auto pb-2 -mx-1 px-1 scrollbar-hide">
                  {nearbyNannies.map((nanny) => (
                    <Link
                      key={nanny.id}
                      href={`/advertisement/${nanny.id}`}
                      className="flex-shrink-0 w-52 bg-white border border-gray-100 rounded-2xl p-4 shadow-sm hover:shadow-md hover:border-purple-200 hover:-translate-y-0.5 transition-all duration-200"
                    >
                      {/* Avatar */}
                      <div className="w-14 h-14 rounded-full overflow-hidden bg-purple-100 flex items-center justify-center mb-3 mx-auto">
                        {nanny.owner_picture ? (
                          <img src={nanny.owner_picture} alt={nanny.owner_full_name || ""} className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-purple-600 font-bold text-xl">
                            {(nanny.owner_full_name || "?").charAt(0).toUpperCase()}
                          </span>
                        )}
                      </div>
                      {/* Name */}
                      <p className="font-semibold text-gray-900 text-sm text-center truncate">{nanny.owner_full_name || "—"}</p>
                      {/* Rating */}
                      {nanny.owner_rating > 0 && (
                        <div className="flex items-center justify-center gap-1 mt-1">
                          <svg className="w-3.5 h-3.5 text-yellow-400 fill-current" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/></svg>
                          <span className="text-xs text-gray-600 font-medium">{nanny.owner_rating.toFixed(1)}</span>
                          <span className="text-xs text-gray-400">({nanny.owner_reviews_count})</span>
                        </div>
                      )}
                      {/* Location & Price */}
                      <div className="mt-2 text-center">
                        <p className="text-xs text-gray-500 truncate">{nanny.location_city}</p>
                        <p className="text-sm font-bold text-purple-600 mt-1">€{nanny.price_per_hour}<span className="text-xs font-normal text-gray-400">/h</span></p>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            </section>
          )}

          {/* Parent Job Posts Near Nannies */}
          {isNanny && nearbyParentAds.length > 0 && (
            <section className="px-4 sm:px-6 md:px-8 py-10 bg-white">
              <div className="max-w-6xl mx-auto">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">
                      {userCity ? t("home.jobsNear", { city: userCity }) : t("home.jobsNearYou")}
                    </h2>
                    <p className="text-sm text-gray-500 mt-0.5">{t("home.parentJobPosts")}</p>
                  </div>
                  <button
                    onClick={() => {
                      setSearchParams({ location: userCity || "Location", startDate: null, endDate: null });
                      setShowResults(true);
                    }}
                    className="text-sm text-purple-600 font-medium hover:underline flex items-center gap-1"
                  >
                    {t("common.seeAll")}
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7"/></svg>
                  </button>
                </div>
                <div className="flex gap-4 overflow-x-auto pb-2 -mx-1 px-1 scrollbar-hide">
                  {nearbyParentAds.map((ad) => (
                    <Link
                      key={ad.id}
                      href={`/advertisement/${ad.id}`}
                      className="flex-shrink-0 w-52 bg-white border border-gray-100 rounded-2xl p-4 shadow-sm hover:shadow-md hover:border-purple-200 hover:-translate-y-0.5 transition-all duration-200"
                    >
                      <div className="w-14 h-14 rounded-full overflow-hidden bg-purple-100 flex items-center justify-center mb-3 mx-auto">
                        {ad.owner_picture ? (
                          <img src={ad.owner_picture} alt={ad.owner_full_name || ""} className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-purple-600 font-bold text-xl">
                            {(ad.owner_full_name || "?").charAt(0).toUpperCase()}
                          </span>
                        )}
                      </div>
                      <p className="font-semibold text-gray-900 text-sm text-center truncate">{ad.owner_full_name || "—"}</p>
                      {ad.owner_rating > 0 && (
                        <div className="flex items-center justify-center gap-1 mt-1">
                          <svg className="w-3.5 h-3.5 text-yellow-400 fill-current" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/></svg>
                          <span className="text-xs text-gray-600 font-medium">{ad.owner_rating.toFixed(1)}</span>
                          <span className="text-xs text-gray-400">({ad.owner_reviews_count})</span>
                        </div>
                      )}
                      <div className="mt-2 text-center">
                        <p className="text-xs text-gray-500 truncate">{ad.location_city}</p>
                        <p className="text-sm font-bold text-purple-600 mt-1">€{ad.price_per_hour}<span className="text-xs font-normal text-gray-400">/h</span></p>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            </section>
          )}

          {/* Feature Cards */}
          <section className="px-4 sm:px-6 md:px-8 py-12">
            <div className="max-w-6xl mx-auto">
              <h2 className="text-center text-2xl font-bold text-gray-900 mb-8">{t("home.howItWorks")}</h2>
              <div className="grid md:grid-cols-3 gap-6">
                {[
                  {
                    href: "/for-parents",
                    icon: (
                      <svg className="w-7 h-7 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
                    ),
                    title: t("home.forParents"),
                    desc: t("home.forParentsDesc"),
                  },
                  {
                    href: "/for-nannies",
                    icon: (
                      <svg className="w-7 h-7 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"/></svg>
                    ),
                    title: t("home.forNannies"),
                    desc: t("home.forNanniesDesc"),
                  },
                  {
                    href: "/support",
                    icon: (
                      <svg className="w-7 h-7 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/></svg>
                    ),
                    title: t("home.safeSecure"),
                    desc: t("home.safeSecureDesc"),
                  },
                ].map((card) => (
                  <Link
                    key={card.title}
                    href={card.href}
                    className="group bg-white rounded-2xl p-7 shadow-sm border border-gray-100 hover:shadow-md hover:border-purple-200 hover:-translate-y-0.5 transition-all duration-200 block"
                  >
                    <div className="w-12 h-12 rounded-xl bg-purple-50 flex items-center justify-center mb-4 group-hover:bg-purple-100 transition-colors">
                      {card.icon}
                    </div>
                    <h3 className="text-lg font-semibold mb-2 text-gray-900 group-hover:text-purple-700 transition-colors">
                      {card.title}
                    </h3>
                    <p className="text-gray-500 text-sm leading-relaxed">
                      {card.desc}
                    </p>
                    <span className="inline-flex items-center gap-1 text-purple-600 text-xs font-medium mt-4 group-hover:gap-2 transition-all">
                      {t("common.learnMore")}
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7"/></svg>
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          </section>

          <RecentlyViewed />
        </main>
      ) : (
        <SearchResults
          searchParams={searchParams}
          onBackToSearch={() => setShowResults(false)}
        />
      )}
      <Footer />
    </>
  );
}
