"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
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
  const router = useRouter();
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

  const [heroHover, setHeroHover] = useState<'parents' | 'nannies' | null>(null);
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
    <div className="relative overflow-x-hidden">
      {/* Unified page-level background bubbles */}
      <div className="absolute -top-20 -right-28 w-[560px] h-[560px] rounded-full bg-brand-200 opacity-[0.07] pointer-events-none" />
      <div className="absolute top-[5%] left-[20%] w-48 h-48 rounded-full bg-brand-300 opacity-[0.04] pointer-events-none" />
      <div className="absolute top-[12%] -left-28 w-[420px] h-[420px] rounded-full bg-brand-300 opacity-[0.05] pointer-events-none" />
      <div className="absolute top-[20%] right-[15%] w-36 h-36 rounded-full bg-brand-200 opacity-[0.06] pointer-events-none" />
      <div className="absolute top-[30%] left-[45%] w-56 h-56 rounded-full bg-brand-200 opacity-[0.04] pointer-events-none" />
      <div className="absolute top-[38%] -right-20 w-80 h-80 rounded-full bg-brand-200 opacity-[0.06] pointer-events-none" />
      <div className="absolute top-[47%] left-[5%] w-44 h-44 rounded-full bg-brand-300 opacity-[0.05] pointer-events-none" />
      <div className="absolute top-[55%] left-[10%] w-72 h-72 rounded-full bg-brand-300 opacity-[0.04] pointer-events-none" />
      <div className="absolute top-[60%] right-[25%] w-52 h-52 rounded-full bg-brand-200 opacity-[0.05] pointer-events-none" />
      <div className="absolute top-[68%] left-[55%] w-40 h-40 rounded-full bg-brand-300 opacity-[0.04] pointer-events-none" />
      <div className="absolute top-[72%] -right-16 w-96 h-96 rounded-full bg-brand-200 opacity-[0.05] pointer-events-none" />
      <div className="absolute top-[80%] left-[15%] w-60 h-60 rounded-full bg-brand-200 opacity-[0.04] pointer-events-none" />
      <div className="absolute top-[85%] left-[30%] w-64 h-64 rounded-full bg-brand-300 opacity-[0.04] pointer-events-none" />
      <div className="absolute top-[92%] right-[10%] w-48 h-48 rounded-full bg-brand-200 opacity-[0.05] pointer-events-none" />

      <style>{`
        @keyframes heroFloat {
          0%, 100% { transform: translateY(0px); }
          50%       { transform: translateY(-16px); }
        }
        @keyframes heroDrift {
          0%, 100% { transform: translate(0px, 0px); }
          33%       { transform: translate(10px, -12px); }
          66%       { transform: translate(-7px, -8px); }
        }
      `}</style>

      {/* Search Bar - At Top */}
      <div className="border-b border-gray-100/60">
        <SearchBar onSearch={handleSearch} />
      </div>
      {/* Main Content */}
      {!showResults ? (
        <main className="flex-1">
          {/* Hero — split panel, guests only */}
          {!authLoading && !user && (
            <section
              className="relative overflow-hidden flex flex-col md:flex-row mx-4 md:mx-8 mt-6 mb-2 rounded-3xl shadow-sm md:h-[420px]"
              onMouseLeave={() => setHeroHover(null)}
            >
              {/* ── PARENTS PANEL ── */}
              <div
                onMouseEnter={() => setHeroHover('parents')}
                onClick={() => router.push('/for-parents')}
                className="relative flex flex-col justify-center px-8 sm:px-12 py-14 bg-brand-600 overflow-hidden cursor-pointer w-full"
                style={{
                  flexGrow: heroHover === 'parents' ? 1.55 : heroHover === 'nannies' ? 0.45 : 1,
                  flexShrink: 1,
                  flexBasis: '0%',
                  minWidth: 0,
                  transition: 'flex-grow 0.6s cubic-bezier(0.4, 0, 0.2, 1)',
                }}
              >
                {/* Decorative blobs */}
                <div className="absolute inset-0 pointer-events-none overflow-hidden" aria-hidden>
                  <div
                    className="absolute -bottom-16 -right-16 rounded-full bg-brand-500"
                    style={{
                      width: heroHover === 'parents' ? '320px' : '220px',
                      height: heroHover === 'parents' ? '320px' : '220px',
                      opacity: heroHover === 'parents' ? 0.45 : 0.2,
                      transition: 'width 0.7s ease, height 0.7s ease, opacity 0.7s ease',
                    }}
                  />
                  <div
                    className="absolute -top-10 -left-10 rounded-full bg-brand-700"
                    style={{
                      width: heroHover === 'parents' ? '200px' : '140px',
                      height: heroHover === 'parents' ? '200px' : '140px',
                      opacity: heroHover === 'parents' ? 0.35 : 0.15,
                      transition: 'width 0.7s ease, height 0.7s ease, opacity 0.7s ease',
                    }}
                  />
                  {/* Hazy orbs — left side */}
                  {[
                    { l:'8%',  t:'20%', w:80,  blur:1, dur:'4.2s', delay:'0s'   },
                    { l:'21%', t:'52%', w:52,  blur:1, dur:'5.5s', delay:'1.2s' },
                    { l:'4%',  t:'64%', w:100, blur:2, dur:'6s',   delay:'0.6s' },
                    { l:'26%', t:'13%', w:40,  blur:1, dur:'3.8s', delay:'2s'   },
                    { l:'13%', t:'38%', w:28,  blur:1, dur:'4.8s', delay:'0.4s' },
                    { l:'30%', t:'71%', w:64,  blur:1, dur:'5.2s', delay:'1s'   },
                  ].map((b, i) => (
                    <div key={i} style={{
                      position: 'absolute',
                      left: b.l, top: b.t,
                      width: b.w, height: b.w,
                      borderRadius: '50%',
                      background: 'rgba(255,255,255,0.18)',
                      filter: `blur(${b.blur}px)`,
                      opacity: heroHover === 'parents' ? 0.85 : 0.15,
                      transition: 'opacity 0.8s ease',
                      animation: `heroFloat ${b.dur} ease-in-out infinite`,
                      animationDelay: b.delay,
                    }} />
                  ))}
                </div>

                {/* Content */}
                <div
                  className="relative z-10 max-w-sm ml-auto"
                  style={{
                    opacity: heroHover === 'nannies' ? 0.45 : 1,
                    transition: 'opacity 0.5s ease',
                  }}
                >
                  {/* Label */}
                  <div className="inline-flex items-center gap-2 mb-5">
                    <span
                      className="h-1.5 w-1.5 rounded-full bg-brand-300"
                      style={{ animation: 'pulse 2s cubic-bezier(0.4,0,0.6,1) infinite' }}
                    />
                    <span className="text-brand-200 text-[10px] font-bold tracking-[0.22em] uppercase">
                      {t("home.forParents")}
                    </span>
                  </div>

                  {/* Heading */}
                  <h2
                    className="font-extrabold text-white leading-[1.15] mb-4"
                    style={{
                      fontSize: 'clamp(1.6rem, 3.5vw, 2.8rem)',
                    }}
                  >
                    {t("home.heroTitle")}
                  </h2>

                  {/* Description */}
                  <p
                    className="text-brand-200 text-sm leading-relaxed mb-7"
                    style={{
                      opacity: heroHover === 'nannies' ? 0 : heroHover === 'parents' ? 1 : 0.75,
                      transform: heroHover === 'nannies' ? 'translateY(6px)' : 'translateY(0)',
                      transition: 'opacity 0.45s ease, transform 0.45s ease',
                    }}
                  >
                    {t("home.heroParentsDesc")}
                  </p>

                  {/* CTA */}
                  <Link
                    href="/for-parents"
                    onClick={(e) => e.stopPropagation()}
                    className="inline-flex items-center gap-2 bg-white text-brand-700 font-bold px-5 py-2.5 rounded-xl text-sm hover:bg-brand-50"
                    style={{
                      boxShadow: heroHover === 'parents'
                        ? '0 20px 40px rgba(0,0,0,0.22)'
                        : '0 4px 12px rgba(0,0,0,0.14)',
                      opacity: heroHover === 'nannies' ? 0 : heroHover === 'parents' ? 1 : 0.85,
                      transform: heroHover === 'parents' ? 'translateY(-2px)' : 'translateY(0)',
                      transition: 'box-shadow 0.4s ease, opacity 0.4s ease, transform 0.4s ease',
                      pointerEvents: heroHover === 'nannies' ? 'none' : 'auto',
                    }}
                  >
                    {t("home.heroParentsBtn")}
                    <svg
                      className="w-4 h-4"
                      fill="none" stroke="currentColor" viewBox="0 0 24 24"
                      style={{
                        transform: heroHover === 'parents' ? 'translateX(3px)' : 'translateX(0)',
                        transition: 'transform 0.3s ease',
                      }}
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </Link>
                </div>
              </div>

              {/* ── VERTICAL DIVIDER (desktop only) ── */}
              <div
                className="hidden md:block flex-shrink-0 w-px self-stretch"
                style={{
                  background: 'linear-gradient(to bottom, transparent, rgba(255,255,255,0.18) 25%, rgba(255,255,255,0.18) 75%, transparent)',
                }}
              />

              {/* ── NANNIES PANEL ── */}
              <div
                onMouseEnter={() => setHeroHover('nannies')}
                onClick={() => router.push('/for-nannies')}
                className="relative flex flex-col justify-center px-8 sm:px-12 py-14 overflow-hidden cursor-pointer w-full"
                style={{
                  flexGrow: heroHover === 'nannies' ? 1.55 : heroHover === 'parents' ? 0.45 : 1,
                  flexShrink: 1,
                  flexBasis: '0%',
                  minWidth: 0,
                  backgroundColor: '#E9E5DD',
                  transition: 'flex-grow 0.6s cubic-bezier(0.4, 0, 0.2, 1)',
                }}
              >
                {/* Decorative blobs */}
                <div className="absolute inset-0 pointer-events-none overflow-hidden" aria-hidden>
                  <div
                    className="absolute -bottom-16 -left-16 rounded-full bg-brand-200"
                    style={{
                      width: heroHover === 'nannies' ? '320px' : '220px',
                      height: heroHover === 'nannies' ? '320px' : '220px',
                      opacity: heroHover === 'nannies' ? 0.55 : 0.3,
                      transition: 'width 0.7s ease, height 0.7s ease, opacity 0.7s ease',
                    }}
                  />
                  <div
                    className="absolute -top-10 -right-10 rounded-full bg-brand-100"
                    style={{
                      width: heroHover === 'nannies' ? '200px' : '140px',
                      height: heroHover === 'nannies' ? '200px' : '140px',
                      opacity: heroHover === 'nannies' ? 0.7 : 0.4,
                      transition: 'width 0.7s ease, height 0.7s ease, opacity 0.7s ease',
                    }}
                  />
                  {/* Hazy orbs — right side */}
                  {[
                    { r:'7%',  t:'25%', w:76,  blur:1, dur:'4.5s', delay:'0.5s' },
                    { r:'22%', t:'55%', w:48,  blur:1, dur:'5.8s', delay:'1.5s' },
                    { r:'4%',  t:'65%', w:96,  blur:2, dur:'6.2s', delay:'0s'   },
                    { r:'27%', t:'17%', w:36,  blur:1, dur:'4s',   delay:'2.2s' },
                    { r:'15%', t:'42%', w:24,  blur:1, dur:'5s',   delay:'1.1s' },
                    { r:'31%', t:'73%', w:60,  blur:1, dur:'5.5s', delay:'0.9s' },
                  ].map((b, i) => (
                    <div key={i} style={{
                      position: 'absolute',
                      right: b.r, top: b.t,
                      width: b.w, height: b.w,
                      borderRadius: '50%',
                      background: 'rgba(15,61,46,0.12)',
                      filter: `blur(${b.blur}px)`,
                      opacity: heroHover === 'nannies' ? 0.85 : 0.15,
                      transition: 'opacity 0.8s ease',
                      animation: `heroDrift ${b.dur} ease-in-out infinite`,
                      animationDelay: b.delay,
                    }} />
                  ))}
                </div>

                {/* Content */}
                <div
                  className="relative z-10 max-w-sm mr-auto"
                  style={{
                    opacity: heroHover === 'parents' ? 0.45 : 1,
                    transition: 'opacity 0.5s ease',
                  }}
                >
                  {/* Label */}
                  <div className="inline-flex items-center gap-2 mb-5">
                    <span
                      className="h-1.5 w-1.5 rounded-full bg-brand-400"
                      style={{ animation: 'pulse 2s cubic-bezier(0.4,0,0.6,1) infinite' }}
                    />
                    <span className="text-brand-500 text-[10px] font-bold tracking-[0.22em] uppercase">
                      {t("home.forNannies")}
                    </span>
                  </div>

                  {/* Heading */}
                  <h2
                    className="font-extrabold text-brand-800 leading-[1.15] mb-4"
                    style={{
                      fontSize: 'clamp(1.6rem, 3.5vw, 2.8rem)',
                    }}
                  >
                    {t("home.heroSubtitle")}
                  </h2>

                  {/* Description */}
                  <p
                    className="text-brand-600 text-sm leading-relaxed mb-7"
                    style={{
                      opacity: heroHover === 'parents' ? 0 : heroHover === 'nannies' ? 1 : 0.75,
                      transform: heroHover === 'parents' ? 'translateY(6px)' : 'translateY(0)',
                      transition: 'opacity 0.45s ease, transform 0.45s ease',
                    }}
                  >
                    {t("home.heroNanniesDesc")}
                  </p>

                  {/* CTA */}
                  <Link
                    href="/for-nannies"
                    onClick={(e) => e.stopPropagation()}
                    className="inline-flex items-center gap-2 bg-brand-600 text-white font-bold px-5 py-2.5 rounded-xl text-sm hover:bg-brand-700"
                    style={{
                      boxShadow: heroHover === 'nannies'
                        ? '0 20px 40px rgba(15,61,46,0.28)'
                        : '0 4px 12px rgba(15,61,46,0.15)',
                      opacity: heroHover === 'parents' ? 0 : heroHover === 'nannies' ? 1 : 0.85,
                      transform: heroHover === 'nannies' ? 'translateY(-2px)' : 'translateY(0)',
                      transition: 'box-shadow 0.4s ease, opacity 0.4s ease, transform 0.4s ease',
                      pointerEvents: heroHover === 'parents' ? 'none' : 'auto',
                    }}
                  >
                    {t("home.heroNanniesBtn")}
                    <svg
                      className="w-4 h-4"
                      fill="none" stroke="currentColor" viewBox="0 0 24 24"
                      style={{
                        transform: heroHover === 'nannies' ? 'translateX(3px)' : 'translateX(0)',
                        transition: 'transform 0.3s ease',
                      }}
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </Link>
                </div>
              </div>
            </section>
          )}

          {/* Nannies Near You — shown only to parents with a location set */}
          {isParent && nearbyNannies.length > 0 && (
            <section className="px-4 sm:px-6 md:px-8 py-10">
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
                    className="text-sm text-brand-600 font-medium hover:underline flex items-center gap-1"
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
                      className="flex-shrink-0 w-52 bg-white border border-gray-100 rounded-2xl p-4 shadow-sm hover:shadow-md hover:border-brand-200 hover:-translate-y-0.5 transition-all duration-200"
                    >
                      {/* Avatar */}
                      <div className="w-14 h-14 rounded-full overflow-hidden bg-brand-100 flex items-center justify-center mb-3 mx-auto">
                        {nanny.owner_picture ? (
                          <img src={nanny.owner_picture} alt={nanny.owner_full_name || ""} className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-brand-600 font-bold text-xl">
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
                        <p className="text-sm font-bold text-brand-600 mt-1">€{nanny.price_per_hour}<span className="text-xs font-normal text-gray-400">/h</span></p>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            </section>
          )}

          {/* Parent Job Posts Near Nannies */}
          {isNanny && nearbyParentAds.length > 0 && (
            <section className="px-4 sm:px-6 md:px-8 py-10">
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
                    className="text-sm text-brand-600 font-medium hover:underline flex items-center gap-1"
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
                      className="flex-shrink-0 w-52 bg-white border border-gray-100 rounded-2xl p-4 shadow-sm hover:shadow-md hover:border-brand-200 hover:-translate-y-0.5 transition-all duration-200"
                    >
                      <div className="w-14 h-14 rounded-full overflow-hidden bg-brand-100 flex items-center justify-center mb-3 mx-auto">
                        {ad.owner_picture ? (
                          <img src={ad.owner_picture} alt={ad.owner_full_name || ""} className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-brand-600 font-bold text-xl">
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
                        <p className="text-sm font-bold text-brand-600 mt-1">€{ad.price_per_hour}<span className="text-xs font-normal text-gray-400">/h</span></p>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            </section>
          )}

          {/* Feature Cards — "Kā tas darbojas" */}
          <section className="px-4 md:px-8 py-10">
            <div className="max-w-6xl mx-auto relative">
              {/* Section label */}
              <p className="text-center text-[10px] font-bold tracking-[0.22em] uppercase text-brand-400 mb-3">
                {t("home.howItWorks")}
              </p>
              <div className="grid md:grid-cols-3 gap-4">

                {/* Card 1 — Parents · cream */}
                <Link
                  href="/for-parents"
                  className="group relative flex flex-col justify-between rounded-3xl p-9 overflow-hidden transition-all duration-300 hover:shadow-xl hover:shadow-brand-200/40"
                  style={{ backgroundColor: '#E9E5DD' }}
                >
                  <div className="w-12 h-12 rounded-2xl bg-brand-200/60 flex items-center justify-center mb-12 group-hover:bg-brand-200/90 transition-colors relative">
                    <svg className="w-5 h-5 text-brand-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"/>
                    </svg>
                  </div>

                  <div className="relative">
                    <h3 className="text-2xl font-bold text-brand-800 mb-3">{t("home.forParents")}</h3>
                    <p className="text-brand-600 text-sm leading-relaxed mb-7">{t("home.forParentsDesc")}</p>
                    <span className="inline-flex items-center gap-1.5 text-brand-600 text-xs font-semibold group-hover:gap-3 transition-all duration-300">
                      {t("common.learnMore")}
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7"/></svg>
                    </span>
                  </div>
                </Link>

                {/* Card 2 — Nannies · frosted white */}
                <Link
                  href="/for-nannies"
                  className="group relative flex flex-col justify-between rounded-3xl p-9 overflow-hidden bg-white/55 backdrop-blur-sm border border-white/70 transition-all duration-300 hover:shadow-xl hover:shadow-brand-200/30 hover:bg-white/65"
                >
                  <div className="w-12 h-12 rounded-2xl bg-brand-50 flex items-center justify-center mb-12 group-hover:bg-brand-100 transition-colors relative">
                    <svg className="w-5 h-5 text-brand-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"/>
                    </svg>
                  </div>

                  <div className="relative">
                    <h3 className="text-2xl font-bold text-gray-900 mb-3">{t("home.forNannies")}</h3>
                    <p className="text-gray-500 text-sm leading-relaxed mb-7">{t("home.forNanniesDesc")}</p>
                    <span className="inline-flex items-center gap-1.5 text-brand-600 text-xs font-semibold group-hover:gap-3 transition-all duration-300">
                      {t("common.learnMore")}
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7"/></svg>
                    </span>
                  </div>
                </Link>

                {/* Card 3 — Safe & Secure · dark green */}
                <Link
                  href="/support"
                  className="group relative flex flex-col justify-between rounded-3xl p-9 overflow-hidden bg-brand-600 transition-all duration-300 hover:shadow-2xl hover:shadow-brand-900/25"
                >
                  {/* Dark card ghost circles */}
                  <div className="absolute -top-12 -left-6 w-52 h-52 rounded-full bg-brand-500 opacity-[0.3] pointer-events-none" />
                  <div className="absolute -bottom-6 -right-6 w-44 h-44 rounded-full bg-brand-700 opacity-[0.25] pointer-events-none" />
                  <div className="absolute bottom-1/3 -left-4 w-20 h-20 rounded-full bg-brand-400 opacity-[0.2] pointer-events-none" />

                  <div className="w-12 h-12 rounded-2xl bg-brand-500/50 flex items-center justify-center mb-12 group-hover:bg-brand-500/80 transition-colors relative">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/>
                    </svg>
                  </div>

                  <div className="relative">
                    <h3 className="text-2xl font-bold text-white mb-3">{t("home.safeSecure")}</h3>
                    <p className="text-brand-200 text-sm leading-relaxed mb-7">{t("home.safeSecureDesc")}</p>
                    <span className="inline-flex items-center gap-1.5 text-brand-200 text-xs font-semibold group-hover:gap-3 transition-all duration-300">
                      {t("common.learnMore")}
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7"/></svg>
                    </span>
                  </div>
                </Link>

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
    </div>
  );
}
