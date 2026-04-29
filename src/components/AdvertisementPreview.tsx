"use client";

import { useEffect, useMemo, useState } from "react";
import { AdvertisementService } from "../lib/advertisementService";
import { useTranslation } from "./LanguageProvider";
import { getTranslatedSkill } from "../lib/constants/skills";
import { formatDateDDMMYYYY } from "../lib/date";

interface Slot {
  available_date: string;
  start_time: string;
  end_time: string;
}

export default function AdvertisementPreview({
  advertisementId,
  onClose,
}: {
  advertisementId: string;
  onClose: () => void;
}) {
  const { t, language } = useTranslation();
  const [ad, setAd] = useState<any | null>(null);
  const [slots, setSlots] = useState<Slot[]>([]);
  const [locations, setLocations] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const run = async () => {
      setLoading(true);
      setError(null);
      try {
        const advertisement = await AdvertisementService.getAdvertisementById(advertisementId);
        if (!advertisement) throw new Error("Advertisement not found");
        setAd(advertisement);
        const s = await AdvertisementService.getFilteredAvailabilitySlots(advertisementId);
        setSlots(s);
        const locs = await AdvertisementService.getLocations(advertisementId);
        setLocations((locs || []).map((x: any) => x.label));
      } catch (e: any) {
        setError(e?.message || "Failed to load");
      } finally {
        setLoading(false);
      }
    };
    run();
  }, [advertisementId]);

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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-gray-50 w-full max-w-3xl rounded-2xl shadow-2xl overflow-hidden flex flex-col" style={{ maxHeight: '90vh' }}>
        {/* Modal header */}
        <div className="flex items-center justify-between px-5 py-3.5 bg-white border-b border-gray-100 flex-shrink-0">
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4 text-brand-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></svg>
            <span className="text-sm font-semibold text-gray-900">{t("ad.preview")}</span>
          </div>
          <button onClick={onClose} className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-colors">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/></svg>
          </button>
        </div>

        <div className="overflow-y-auto p-4 space-y-4">
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-brand-600 mx-auto mb-3" />
              <p className="text-gray-600 text-sm">{t("ad.loading")}</p>
            </div>
          ) : error || !ad ? (
            <div className="text-center py-12 text-gray-700 text-sm">{error || t("ad.notFound")}</div>
          ) : (
            <>
              {/* Hero banner — matches actual ad page exactly */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="px-6 py-5 bg-gradient-to-r from-brand-600 via-brand-700 to-brand-600 text-white">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-xs px-2.5 py-0.5 bg-white/20 rounded-full font-medium">
                          {ad.type === "short-term" ? t("profile.shortTerm") : t("profile.longTerm")}
                        </span>
                        <span className={`text-xs px-2.5 py-0.5 rounded-full font-medium ${ad.is_active ? "bg-green-400/30 text-green-100" : "bg-gray-400/30 text-gray-200"}`}>
                          {ad.is_active ? t("ad.active") : t("ad.inactive")}
                        </span>
                      </div>
                      <h1 className="text-2xl font-bold">{ad.title}</h1>
                    </div>
                  </div>
                  <div className="mt-4 flex flex-wrap gap-4 text-sm text-brand-100">
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
                  </div>
                </div>
              </div>

              {/* Description */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
                <h2 className="text-base font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <svg className="w-4 h-4 text-brand-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>
                  {t("ad.description")}
                </h2>
                <p className="text-gray-700 leading-relaxed whitespace-pre-wrap text-sm">{ad.description || "—"}</p>
              </div>

              {/* Experience + Skills */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
                  <h3 className="text-base font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <svg className="w-4 h-4 text-brand-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/></svg>
                    {ad.type === "short-term" ? t("ad.requirements") : t("ad.experience")}
                  </h3>
                  <p className="text-gray-700 leading-relaxed whitespace-pre-wrap text-sm">{ad.experience || "—"}</p>
                </div>
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
                  <h3 className="text-base font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <svg className="w-4 h-4 text-brand-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"/></svg>
                    {t("ad.skills")}
                  </h3>
                  {ad.skills && ad.skills.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {ad.skills.map((s: string) => (
                        <span key={s} className="px-3 py-1 bg-brand-50 text-brand-700 text-xs rounded-full border border-brand-100 font-medium">
                          {getTranslatedSkill(s, language)}
                        </span>
                      ))}
                    </div>
                  ) : <p className="text-gray-500 text-sm">—</p>}
                </div>
              </div>

              {/* Availability */}
              {groupedSlots.length > 0 && (
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
                  <h3 className="text-base font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <svg className="w-4 h-4 text-brand-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
                    {t("search.availability")}
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
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
                <h3 className="text-base font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <svg className="w-4 h-4 text-brand-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
                  {t("adCreate.location")}
                </h3>
                <p className="text-gray-700 text-sm">
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
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
                  <h3 className="text-base font-semibold text-gray-900 mb-3">{t("ad.notes")}</h3>
                  <p className="text-gray-700 whitespace-pre-wrap text-sm leading-relaxed">{ad.additional_info}</p>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
