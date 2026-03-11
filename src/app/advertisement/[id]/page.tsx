"use client";

import { use as useUnwrap } from "react";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Header from "../../../components/Header";
import Footer from "../../../components/Footer";
import BlockingLoader from "../../../components/BlockingLoader";
import { AdvertisementService } from "../../../lib/advertisementService";
import { UserService } from "../../../lib/userService";
import BookingModal from "../../../components/BookingModal";
import { useSupabaseUser } from "../../../lib/useSupabaseUser";
import { useTranslation } from "../../../components/LanguageProvider";
import { getTranslatedSkill } from "../../../lib/constants/skills";
import { formatDateDDMMYYYY } from "../../../lib/date";
import { saveRecentAd } from "../../../lib/recentlyViewed";

interface Slot {
  available_date: string;
  start_time: string;
  end_time: string;
}

interface Owner {
  fullName: string;
  memberSince: string | null;
  picture: string | null;
  userType: "parent" | "nanny" | "pending" | null;
  rating: number;
  reviewsCount: number;
}

export default function AdvertisementDetails({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = useUnwrap(params);
  const router = useRouter();
  const { user } = useSupabaseUser();
  const { t, language } = useTranslation();
  const [ad, setAd] = useState<any | null>(null);
  const [owner, setOwner] = useState<Owner | null>(null);
  const [slots, setSlots] = useState<Slot[]>([]);
  const [locations, setLocations] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showBooking, setShowBooking] = useState(false);
  const [showOwnerPhoto, setShowOwnerPhoto] = useState(false);
  const [viewerType, setViewerType] = useState<null | "parent" | "nanny">(null);

  useEffect(() => {
    const run = async () => {
      setLoading(true);
      setError(null);
      try {
        const advertisement = await AdvertisementService.getAdvertisementById(
          id
        );
        if (!advertisement) {
          setError(t("ad.notFound"));
          setLoading(false);
          return;
        }
        setAd(advertisement);

        // Track in recently viewed (best-effort)
        try {
          saveRecentAd({
            id: advertisement.id,
            title: advertisement.title || "",
            location: advertisement.location_city || "",
            hourlyRate: Number(advertisement.price_per_hour || 0),
            adType: advertisement.type || "long-term",
          });
        } catch {}

        // Fetch owner data
        const ownerData = await UserService.getPublicProfileById(
          advertisement.user_id
        );
        if (ownerData) {
          setOwner({
            fullName: ownerData.full_name || "",
            memberSince: ownerData.member_since || null,
            picture: ownerData.picture || null,
            userType: (ownerData.user_type as any) ?? null,
            rating: Number(ownerData.rating || 0),
            reviewsCount: Number(ownerData.reviews_count || 0),
          });
          // Update recently viewed with owner info
          try {
            saveRecentAd({
              id: advertisement.id,
              title: advertisement.title || "",
              location: advertisement.location_city || "",
              hourlyRate: Number(advertisement.price_per_hour || 0),
              adType: advertisement.type || "long-term",
              ownerPicture: ownerData.picture || null,
              ownerFullName: ownerData.full_name || "",
            });
          } catch {}
        } else {
          setOwner({
            fullName: "",
            memberSince: null,
            picture: null,
            userType: null,
            rating: 0,
            reviewsCount: 0,
          });
        }

        const s = await AdvertisementService.getFilteredAvailabilitySlots(id);
        setSlots(s);
        // Load extra locations (best-effort)
        try {
          const res = await fetch(`/api/ads/${id}/locations`).then((r) =>
            r.json()
          );
          if (Array.isArray(res)) setLocations(res.map((x: any) => x.label));
        } catch {}
      } catch (e: any) {
        setError(e?.message || t("ad.errorLoadFailed"));
      } finally {
        setLoading(false);
      }
    };
    run();
  }, [id]);

  // Determine viewer type for CTA rules
  useEffect(() => {
    const checkViewer = async () => {
      try {
        if (!user?.id) {
          setViewerType(null);
          return;
        }
        const { data } = await (await import("@/lib/supabase")).supabase
          .from("users")
          .select("user_type")
          .eq("id", user.id)
          .maybeSingle();
        if (data?.user_type === "parent" || data?.user_type === "nanny") {
          setViewerType(data.user_type as any);
        } else {
          setViewerType(null);
        }
      } catch (error) {
        console.error("Error checking viewer type:", error);
        setViewerType(null);
      }
    };
    checkViewer();
  }, [user?.id]);

  const groupedSlots = useMemo(() => {
    const map = new Map<string, Slot[]>();
    for (const s of slots) {
      const key = s.available_date;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(s);
    }
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayKey = today.toISOString().slice(0, 10);
    return Array.from(map.entries())
      .sort(([a], [b]) => (a < b ? -1 : 1))
      .filter(([date]) => date >= todayKey)
      .map(([date, items]) => ({ date, items }));
  }, [slots]);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-white">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <BlockingLoader message={t("ad.loading")} />
        </main>
        <Footer />
      </div>
    );
  }

  if (error || !ad) {
    return (
      <div className="min-h-screen flex flex-col bg-gradient-to-br from-gray-50 to-gray-100">
        <Header />
        <main className="flex-1 flex items-center justify-center px-4">
          <div className="bg-white border border-gray-200 rounded-2xl p-8 max-w-md text-center shadow-sm">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              {error || t("ad.notFound")}
            </h2>
            <p className="text-gray-600 mb-6">{t("ad.notAvailable")}</p>
            <button
              onClick={() => router.back()}
              className="px-6 py-3 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700"
            >
              {t("common.goBack")}
            </button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const ownerIsNanny = owner?.userType === "nanny";
  const canBook = !!user && ownerIsNanny && viewerType === "parent";

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-gray-50 to-gray-100">
      <Header />
      <main className="flex-1 px-4 py-8">
        <div className="max-w-6xl mx-auto">
          {/* Back button */}
          <button
            type="button"
            onClick={() => {
              if (typeof window !== "undefined" && window.history.length > 1) {
                window.history.back();
              } else {
                router.push("/");
              }
            }}
            className="inline-flex items-center gap-2 mb-6 text-sm text-gray-600 hover:text-purple-600 transition-colors group"
          >
            <svg className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7"/></svg>
            {t("ad.backToResults")}
          </button>

          {/* Two-column layout */}
          <div className="flex flex-col lg:flex-row gap-6 items-start">
            {/* ── Left: main content ── */}
            <div className="flex-1 min-w-0 space-y-5">
              {/* Hero banner */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="px-7 py-6 bg-gradient-to-r from-purple-600 via-purple-700 to-indigo-600 text-white">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-xs px-2.5 py-0.5 bg-white/20 rounded-full font-medium">
                          {ad.type === "short-term" ? t("profile.shortTerm") : t("profile.longTerm")}
                        </span>
                        {user?.id === ad.user_id && (
                          <span className={`text-xs px-2.5 py-0.5 rounded-full font-medium ${ad.is_active ? "bg-green-400/30 text-green-100" : "bg-gray-400/30 text-gray-200"}`}>
                            {ad.is_active ? t("ad.active") : t("ad.inactive")}
                          </span>
                        )}
                      </div>
                      <h1 className="text-2xl sm:text-3xl font-bold">{ad.title}</h1>
                    </div>
                    {user && (
                      <Link href={`/user/${ad.user_id}`} className="text-xs px-3 py-1.5 bg-white/20 hover:bg-white/30 rounded-lg border border-white/25 transition-colors flex-shrink-0">
                        {t("ad.viewProfile")}
                      </Link>
                    )}
                  </div>
                  <div className="mt-4 flex flex-wrap gap-4 text-sm text-purple-100">
                    <span className="flex items-center gap-1.5">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
                      {ad.location_city}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                      €{Number(ad.price_per_hour)}{t("ad.perHour")}
                    </span>
                    {ad.type === "long-term" && ad.availability_start_time && ad.availability_end_time && (
                      <span className="flex items-center gap-1.5">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                        {ad.availability_start_time} – {ad.availability_end_time}
                      </span>
                    )}
                    {owner && owner.rating > 0 && (
                      <span className="flex items-center gap-1.5">
                        <svg className="w-4 h-4 fill-yellow-300 text-yellow-300" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/></svg>
                        {owner.rating.toFixed(1)} ({owner.reviewsCount})
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Description */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                <h2 className="text-base font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <svg className="w-4 h-4 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
                  {t("ad.description")}
                </h2>
                <p className="text-gray-700 leading-relaxed whitespace-pre-wrap text-sm">{ad.description}</p>
              </div>

              {/* Experience + Skills */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                  <h3 className="text-base font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <svg className="w-4 h-4 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/></svg>
                    {ad.type === "short-term" ? t("ad.requirements") : t("ad.experience")}
                  </h3>
                  <p className="text-gray-700 leading-relaxed whitespace-pre-wrap text-sm">{ad.experience || "—"}</p>
                </div>
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                  <h3 className="text-base font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <svg className="w-4 h-4 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"/></svg>
                    {t("ad.skills")}
                  </h3>
                  {ad.skills && ad.skills.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {ad.skills.map((s: string) => (
                        <span key={s} className="px-3 py-1 bg-purple-50 text-purple-700 text-xs rounded-full border border-purple-100 font-medium">
                          {getTranslatedSkill(s, language)}
                        </span>
                      ))}
                    </div>
                  ) : <p className="text-gray-500 text-sm">—</p>}
                </div>
              </div>

              {/* Availability */}
              {groupedSlots.length > 0 && (
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                  <h3 className="text-base font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <svg className="w-4 h-4 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
                    {owner?.userType === "parent" ? t("ad.requiredDates") : t("search.availability")}
                  </h3>
                  <div className="space-y-2">
                    {groupedSlots.map(({ date, items }) => (
                      <div key={date} className="flex items-center justify-between bg-gray-50 rounded-xl border border-gray-100 px-4 py-3">
                        <span className="text-sm font-medium text-gray-900">{formatDateDDMMYYYY(new Date(date + "T00:00:00Z"))}</span>
                        <div className="flex flex-wrap gap-1.5 justify-end">
                          {items.map((s, idx) => (
                            <span key={idx} className="px-2.5 py-0.5 rounded-full bg-green-50 text-green-700 text-xs border border-green-200 font-medium">
                              {s.start_time}–{s.end_time}
                            </span>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Location */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                <h3 className="text-base font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <svg className="w-4 h-4 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
                  {t("adCreate.location")}
                </h3>
                <p className="text-gray-700 text-sm leading-relaxed">
                  {[ad.location_address, ad.location_zip_code, ad.location_city].filter(Boolean).join(", ")}
                </p>
                {locations.length > 0 && (
                  <p className="text-xs text-gray-500 mt-2">
                    {t("ad.alsoServes", { locations: locations.slice(0, 5).join(", ") })}
                    {locations.length > 5 ? ` +${locations.length - 5}` : ""}
                  </p>
                )}
              </div>

              {/* Notes */}
              {ad.additional_info && (
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                  <h3 className="text-base font-semibold text-gray-900 mb-3">{t("ad.notes")}</h3>
                  <p className="text-gray-700 whitespace-pre-wrap text-sm leading-relaxed">{ad.additional_info}</p>
                </div>
              )}
            </div>

            {/* ── Right: sticky owner card ── */}
            <div className="w-full lg:w-80 flex-shrink-0 lg:sticky lg:top-6 space-y-4">
              {/* Owner card */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="bg-gradient-to-br from-purple-50 to-indigo-50 px-6 py-5 text-center border-b border-gray-100">
                  <div
                    className={`w-20 h-20 rounded-full mx-auto mb-3 border-4 border-white shadow-md overflow-hidden bg-purple-100 flex items-center justify-center relative group/owneravatar ${owner?.picture ? "cursor-pointer" : ""}`}
                    onClick={() => owner?.picture && setShowOwnerPhoto(true)}
                  >
                    {owner?.picture ? (
                      <>
                        <img src={owner.picture} alt={owner.fullName} className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover/owneravatar:opacity-100 transition-opacity rounded-full">
                          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
                        </div>
                      </>
                    ) : (
                      <svg className="w-10 h-10 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/></svg>
                    )}
                  </div>
                  <Link href={`/user/${ad.user_id}`} className="font-bold text-gray-900 text-lg hover:text-purple-600 transition-colors">
                    {owner?.fullName || "—"}
                  </Link>
                  {owner && owner.rating > 0 && (
                    <div className="flex items-center justify-center gap-1 mt-1">
                      {[1,2,3,4,5].map((star) => {
                        const rounded = Math.round(owner.rating * 2) / 2;
                        return (
                          <svg key={star} className={`w-4 h-4 ${rounded >= star ? "text-yellow-400 fill-current" : rounded >= star - 0.5 ? "text-yellow-400 fill-current opacity-50" : "text-gray-300 fill-current"}`} viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/></svg>
                        );
                      })}
                      <span className="text-sm text-gray-600 ml-1">{owner.rating.toFixed(1)} <span className="text-gray-400">({owner.reviewsCount})</span></span>
                    </div>
                  )}
                  {owner?.memberSince && (
                    <p className="text-xs text-gray-500 mt-1">
                      {t("profile.memberSince")}{" "}
                      {new Date(owner.memberSince).toLocaleDateString("en-US", { month: "long", year: "numeric" })}
                    </p>
                  )}
                </div>
                <div className="p-5 space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500">{t("ad.perHour")}</span>
                    <span className="font-bold text-purple-600 text-lg">€{Number(ad.price_per_hour)}</span>
                  </div>
                  {(() => {
                    if (canBook) {
                      return (
                        <button
                          type="button"
                          onClick={() => setShowBooking(true)}
                          className="w-full py-3 bg-purple-600 text-white font-semibold rounded-xl hover:bg-purple-700 shadow-sm hover:shadow-md transition-all"
                        >
                          {t("ad.book")}
                        </button>
                      );
                    }
                    if (user && !canBook) {
                      return (
                        <Link
                          href={`/user/${ad.user_id}`}
                          className="w-full py-3 border border-purple-300 text-purple-700 font-semibold rounded-xl hover:bg-purple-50 transition-colors block text-center"
                        >
                          {t("ad.viewProfile")}
                        </Link>
                      );
                    }
                    return (
                      <Link
                        href="/login"
                        className="w-full py-3 bg-purple-600 text-white font-semibold rounded-xl hover:bg-purple-700 transition-colors block text-center"
                      >
                        {t("ad.contact")}
                      </Link>
                    );
                  })()}
                  {!user && (
                    <p className="text-xs text-gray-500 text-center">{t("ad.needToRegister")}</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
        {showBooking && user && (
          <BookingModal
            adId={ad.id}
            onClose={() => setShowBooking(false)}
            ownerType={
              owner?.userType === "nanny"
                ? "nanny"
                : owner?.userType === "parent"
                ? "parent"
                : undefined
            }
            availableSlots={slots as any}
            adType={ad.type === "long-term" ? "long-term" : "short-term"}
          />
        )}
      </main>
      <Footer />

      {showOwnerPhoto && owner?.picture && (
        <div
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
          onClick={() => setShowOwnerPhoto(false)}
        >
          <div className="relative max-w-sm w-full" onClick={(e) => e.stopPropagation()}>
            <img src={owner.picture} alt={owner.fullName} className="w-full rounded-2xl object-cover shadow-2xl" />
            <button
              onClick={() => setShowOwnerPhoto(false)}
              className="absolute -top-3 -right-3 w-8 h-8 bg-white rounded-full shadow-lg flex items-center justify-center text-gray-600 hover:text-gray-900"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/></svg>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
