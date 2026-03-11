"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getRecentAds, saveRecentAdsFiltered, RecentAd } from "../lib/recentlyViewed";
import { supabase } from "../lib/supabase";
import { useTranslation } from "./LanguageProvider";
import { useSupabaseUser } from "../lib/useSupabaseUser";

export default function RecentlyViewed() {
  const { t } = useTranslation();
  const { user } = useSupabaseUser();
  const [ads, setAds] = useState<RecentAd[]>([]);

  useEffect(() => {
    const local = getRecentAds();
    if (local.length === 0) return;
    const ids = local.map((a) => a.id);
    supabase
      .from("advertisements")
      .select("id")
      .in("id", ids)
      .eq("is_active", true)
      .then(({ data }) => {
        const activeIds = new Set((data || []).map((r: { id: string }) => r.id));
        const active = local.filter((a) => activeIds.has(a.id));
        saveRecentAdsFiltered(active);
        setAds(active);
      });
  }, []);

  if (ads.length === 0) return null;

  return (
    <section className="max-w-6xl mx-auto px-4 sm:px-8 py-8">
      <h2 className="text-xl font-bold text-gray-900 mb-4">
        {t("search.recentlyViewed")}
      </h2>
      <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
        {ads.map((ad) => (
          <Link
            key={ad.id}
            href={user ? `/advertisement/${ad.id}` : "/login"}
            className="flex-shrink-0 w-52 bg-white rounded-xl border border-gray-200 hover:border-purple-300 hover:shadow-md transition-all duration-200 overflow-hidden"
          >
            {/* Owner avatar */}
            <div className="h-24 bg-gradient-to-br from-purple-100 to-purple-50 flex items-center justify-center">
              {ad.ownerPicture ? (
                <img
                  src={ad.ownerPicture}
                  alt={ad.ownerFullName || ""}
                  className="w-14 h-14 rounded-full object-cover border-2 border-white shadow"
                />
              ) : (
                <div className="w-14 h-14 rounded-full bg-purple-200 flex items-center justify-center text-purple-700 text-xl font-bold">
                  {(ad.ownerFullName || ad.title || "?")[0].toUpperCase()}
                </div>
              )}
            </div>
            <div className="p-3">
              <p className="text-sm font-semibold text-gray-900 truncate">{ad.title}</p>
              {ad.location && (
                <p className="text-xs text-gray-500 truncate mt-0.5">{ad.location}</p>
              )}
              {ad.hourlyRate > 0 && (
                <p className="text-xs font-medium text-purple-600 mt-1">
                  €{ad.hourlyRate}/h
                </p>
              )}
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
