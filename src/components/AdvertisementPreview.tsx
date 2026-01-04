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
        const advertisement = await AdvertisementService.getAdvertisementById(
          advertisementId
        );
        if (!advertisement) throw new Error("Advertisement not found");
        setAd(advertisement);
        const s = await AdvertisementService.getFilteredAvailabilitySlots(
          advertisementId
        );
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
    return Array.from(map.entries())
      .sort(([a], [b]) => (a < b ? -1 : 1))
      .map(([date, items]) => ({ date, items }));
  }, [slots]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white w-full max-w-3xl rounded-2xl shadow-2xl border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">
            {t("ad.preview")}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            ✕
          </button>
        </div>
        <div className="p-6 max-h-[80vh] overflow-auto">
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-purple-600 mx-auto mb-3" />
              <p className="text-gray-600">{t("ad.loading")}</p>
            </div>
          ) : error || !ad ? (
            <div className="text-center py-8 text-gray-700">
              {error || t("ad.notFound")}
            </div>
          ) : (
            <div className="space-y-6">
              <div className="bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-xl p-5">
                <div className="flex items-center justify-between">
                  <h1 className="text-xl font-bold">{ad.title}</h1>
                  <span className="px-3 py-1 bg-white/20 rounded-full text-xs">
                    {ad.type === "short-term"
                      ? t("profile.shortTerm")
                      : t("profile.longTerm")}
                  </span>
                </div>
                <div className="mt-2 text-purple-100 text-sm flex flex-wrap gap-3">
                  <span>📍 {ad.location_city}</span>
                  <span>
                    💰 €{Number(ad.price_per_hour)}
                    {t("ad.perHour")}
                  </span>
                  {ad.type === "long-term" && ad.availability_start_time && ad.availability_end_time && (
                    <span>
                      ⏰ {ad.availability_start_time} -{" "}
                      {ad.availability_end_time}
                    </span>
                  )}
                  <span
                    className={
                      ad.is_active ? "text-green-100" : "text-gray-200"
                    }
                  >
                    ● {ad.is_active ? t("ad.active") : t("ad.inactive")}
                  </span>
                </div>
              </div>

              <div>
                <h2 className="text-sm font-semibold text-gray-900 mb-2">
                  {t("ad.description")}
                </h2>
                <p className="text-gray-700 whitespace-pre-wrap">
                  {ad.description || "—"}
                </p>
              </div>

              <div>
                <h2 className="text-sm font-semibold text-gray-900 mb-2">
                  {t("ad.skills")}
                </h2>
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

              <div>
                <h2 className="text-sm font-semibold text-gray-900 mb-2">
                  {t("ad.locations")}
                </h2>
                <p className="text-gray-700">{ad.location_city}</p>
                {locations.length > 0 && (
                  <p className="text-sm text-gray-500 mt-1">
                    {t("ad.alsoServes", {
                      locations:
                        locations.slice(0, 5).join(", ") +
                        (locations.length > 5
                          ? ` +${locations.length - 5}`
                          : ""),
                    })}
                  </p>
                )}
              </div>

              <div>
                <h2 className="text-sm font-semibold text-gray-900 mb-2">
                  {t("ad.availability")}
                </h2>
                {groupedSlots.length > 0 ? (
                  <div className="space-y-2">
                    {groupedSlots.map(({ date, items }) => (
                      <div
                        key={date}
                        className="flex items-center justify-between border border-gray-200 rounded-lg p-3"
                      >
                        <span className="text-gray-900 font-medium">
                          {formatDateDDMMYYYY(new Date(date + "T00:00:00Z"))}
                        </span>
                        <div className="flex flex-wrap gap-2">
                          {items.map((s, idx) => (
                            <span
                              key={idx}
                              className="px-2 py-1 rounded-full bg-green-50 text-green-700 text-xs border border-green-200"
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
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
