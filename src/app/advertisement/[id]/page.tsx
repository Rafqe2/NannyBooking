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
          });
        } else {
          setOwner({
            fullName: "",
            memberSince: null,
            picture: null,
            userType: null,
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

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-gray-50 to-gray-100">
      <Header />
      <main className="flex-1 px-4 py-8">
        <div className="max-w-5xl mx-auto">
          <div className="mb-4">
            <button
              type="button"
              onClick={() => {
                if (
                  typeof window !== "undefined" &&
                  window.history.length > 1
                ) {
                  window.history.back();
                } else {
                  router.push("/");
                }
              }}
              className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50"
            >
              <span>←</span>
              <span>{t("ad.backToResults")}</span>
            </button>
          </div>
          {/* Title and key facts */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="px-8 py-6 bg-gradient-to-r from-purple-600 to-purple-700 text-white">
              <div className="flex items-center justify-between">
                <h1 className="text-2xl sm:text-3xl font-bold">{ad.title}</h1>
                <div className="flex items-center gap-3">
                  <span className="px-4 py-2 bg-white/20 rounded-full text-sm">
                    {ad.type === "short-term"
                      ? t("profile.shortTerm")
                      : t("profile.longTerm")}
                  </span>
                  {user && (
                    <Link
                      href={`/user/${ad.user_id}`}
                      className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-full text-sm font-medium border border-white/30 hover:border-white/50"
                    >
                      {t("ad.viewProfile")}
                    </Link>
                  )}
                </div>
              </div>
              <div className="mt-3 flex flex-wrap gap-3 text-sm text-purple-100">
                <span className="inline-flex items-center gap-1">
                  <span>📍</span>
                  <span>{ad.location_city}</span>
                </span>
                <span className="inline-flex items-center gap-1">
                  <span>💰</span>
                  <span>
                    €{Number(ad.price_per_hour)}
                    {t("ad.perHour")}
                  </span>
                </span>
                {ad.type === "long-term" &&
                  ad.availability_start_time &&
                  ad.availability_end_time && (
                    <span className="inline-flex items-center gap-1">
                      <span>⏰</span>
                      <span>
                        {ad.availability_start_time} -{" "}
                        {ad.availability_end_time}
                      </span>
                    </span>
                  )}
                {user?.id === ad.user_id && (
                  <span
                    className={
                      "inline-flex items-center gap-1 " +
                      (ad.is_active ? "text-green-100" : "text-gray-200")
                    }
                  >
                    <span>●</span>
                    <span>
                      {ad.is_active ? t("ad.active") : t("ad.inactive")}
                    </span>
                  </span>
                )}
              </div>
            </div>

            <div className="p-6 sm:p-8">
              {/* Description */}
              <div className="mb-8">
                <h2 className="text-xl font-semibold text-gray-900 mb-3">
                  {t("ad.description")}
                </h2>
                <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                  {ad.description}
                </p>
              </div>

              {/* Experience / Skills */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <div className="bg-gray-50 rounded-xl p-5 border border-gray-200">
                  <h3 className="font-semibold text-gray-900 mb-2">
                    {ad.type === "short-term"
                      ? t("ad.requirements")
                      : t("ad.experience")}
                  </h3>
                  <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                    {ad.experience || "—"}
                  </p>
                </div>
                <div className="bg-gray-50 rounded-xl p-5 border border-gray-200">
                  <h3 className="font-semibold text-gray-900 mb-2">
                    {t("ad.skills")}
                  </h3>
                  {ad.skills && ad.skills.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {ad.skills.map((s: string) => (
                        <span
                          key={s}
                          className="px-3 py-1 bg-purple-100 text-purple-700 text-xs rounded-full"
                        >
                          {getTranslatedSkill(s, language)}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500">—</p>
                  )}
                </div>
              </div>

              {/* Availability calendar-like list */}
              <div className="mb-8">
                <h3 className="text-xl font-semibold text-gray-900 mb-3">
                  {t("search.availability")}
                </h3>
                {groupedSlots.length > 0 ? (
                  <div className="space-y-3">
                    {groupedSlots.map(({ date, items }) => (
                      <div
                        key={date}
                        className="flex items-start justify-between bg-white rounded-xl border border-gray-200 p-4"
                      >
                        <div className="text-gray-900 font-medium">
                          {formatDateDDMMYYYY(new Date(date + "T00:00:00Z"))}
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {items.map((s, idx) => (
                            <span
                              key={idx}
                              className="px-3 py-1 rounded-full bg-green-50 text-green-700 text-xs border border-green-200"
                            >
                              {s.start_time} - {s.end_time}
                            </span>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-600">{t("ad.noAvailability")}</p>
                )}
              </div>

              {/* Location & extra */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white rounded-xl border border-gray-200 p-5">
                  <h3 className="font-semibold text-gray-900 mb-2">
                    {t("adCreate.location")}
                  </h3>
                  <p className="text-gray-700">
                    {ad.location_address ? (
                      <>
                        {ad.location_address}
                        <br />
                      </>
                    ) : null}
                    {ad.location_zip_code ? (
                      <>
                        {ad.location_zip_code}
                        <br />
                      </>
                    ) : null}
                    {ad.location_city}
                  </p>
                  {locations.length > 0 && (
                    <p className="text-sm text-gray-500 mt-2">
                      {t("ad.alsoServes", {
                        locations: locations.slice(0, 5).join(", "),
                      })}
                      {locations.length > 5 ? ` +${locations.length - 5}` : ""}
                    </p>
                  )}
                </div>
                {ad.additional_info && (
                  <div className="bg-white rounded-xl border border-gray-200 p-5">
                    <h3 className="font-semibold text-gray-900 mb-2">
                      {t("ad.notes")}
                    </h3>
                    <p className="text-gray-700 whitespace-pre-wrap">
                      {ad.additional_info}
                    </p>
                  </div>
                )}
              </div>

              {/* Call to action */}
              <div className="mt-8 bg-white rounded-2xl border border-gray-200 p-6">
                <div className="mb-3 text-gray-800">
                  {owner?.userType === "parent"
                    ? t("ad.lookingGoodParent")
                    : user
                    ? t("ad.lookingGood", {
                        providerType: owner
                          ? owner.fullName ||
                            (ad.type === "short-term"
                              ? t("common.nanny")
                              : t("common.parent"))
                          : ad.type === "short-term"
                          ? t("common.nanny")
                          : t("common.parent"),
                      })
                    : t("ad.lookingGood", {
                        providerType:
                          ad.type === "short-term"
                            ? t("common.nanny")
                            : t("common.parent"),
                      })}
                </div>
                <div className="flex flex-wrap gap-3">
                  {(() => {
                    const ownerIsNanny = owner?.userType === "nanny";
                    const ownerIsParent = owner?.userType === "parent";
                    const canBook =
                      !!user && ownerIsNanny && viewerType === "parent";
                    // Nannies should not be able to book parents: if ownerIsParent, hide Book.
                    return canBook ? (
                      <button
                        type="button"
                        onClick={() => setShowBooking(true)}
                        className="px-5 py-2 rounded-lg font-medium bg-purple-600 text-white hover:bg-purple-700"
                        title="Book this ad"
                      >
                        {t("ad.book")}
                      </button>
                    ) : null;
                  })()}
                  <a
                    href={user ? `/user/${ad.user_id}` : undefined}
                    onClick={(e) => {
                      if (!user) e.preventDefault();
                    }}
                    className={
                      "px-5 py-2 rounded-lg font-medium border " +
                      (!user
                        ? "bg-gray-50 text-gray-500 border-gray-200 cursor-not-allowed"
                        : "border-purple-600 text-purple-700 hover:bg-purple-50")
                    }
                    title={
                      !user
                        ? "Create an account or sign in to contact"
                        : "Go to profile to contact"
                    }
                  >
                    {t("ad.contact")}
                  </a>
                </div>
                {!user && (
                  <div className="mt-2 text-sm text-gray-600">
                    {t("ad.needToRegister")}
                  </div>
                )}
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
          />
        )}
      </main>
      <Footer />
    </div>
  );
}
