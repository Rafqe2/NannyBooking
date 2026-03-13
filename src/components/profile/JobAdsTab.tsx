"use client";

import { useState } from "react";
import { useTranslation } from "../LanguageProvider";
import { supabase } from "../../lib/supabase";
import { AdvertisementService, } from "../../lib/advertisementService";
import AdvertisementPreview from "../AdvertisementPreview";
import { getTranslatedSkill } from "../../lib/constants/skills";
import { formatMonthYear } from "../../lib/date";
import { Database } from "../../types/database";
import { UserProfile } from "../../lib/userService";

type Advertisement = Database["public"]["Tables"]["advertisements"]["Row"];

interface JobAdsTabProps {
  userProfile: UserProfile | null;
  advertisements: Advertisement[];
  adSlotsMap: Record<string, { available_date: string }[]>;
  setAdvertisements: React.Dispatch<React.SetStateAction<Advertisement[]>>;
  setToast: (toast: { message: string; type: "error" | "success" } | null) => void;
}

export default function JobAdsTab({
  userProfile,
  advertisements,
  adSlotsMap,
  setAdvertisements,
  setToast,
}: JobAdsTabProps) {
  const { t, language } = useTranslation();
  const [previewAdId, setPreviewAdId] = useState<string | null>(null);

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
        {/* Header */}
        <div className="px-8 py-6 border-b border-gray-100 bg-gray-50">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-semibold text-gray-900">
                {t("profile.yourAdvertisement")}
              </h2>
              <p className="text-gray-600 mt-1">
                {userProfile?.user_type === "parent"
                  ? t("profile.manageChildcareJob")
                  : userProfile?.user_type === "nanny"
                  ? t("profile.manageChildcareServices")
                  : t("profile.completeProfileToStart")}
              </p>
            </div>
            {(() => {
              const hasActive = advertisements.some((a) => a.is_active);
              const inactiveCount = advertisements.filter(
                (a) => !a.is_active
              ).length;
              return (
                <button
                  onClick={() => {
                    if (hasActive || inactiveCount >= 3) return;
                    window.location.href = "/create-advertisement";
                  }}
                  disabled={hasActive || inactiveCount >= 3}
                  className={`px-6 py-3 rounded-lg font-medium transition-colors duration-200 shadow-sm ${
                    hasActive || inactiveCount >= 3
                      ? "bg-gray-300 text-gray-600 cursor-not-allowed"
                      : "bg-purple-600 text-white hover:bg-purple-700"
                  }`}
                  title={
                    hasActive
                      ? "You already have an active ad"
                      : inactiveCount >= 3
                      ? "You already have 3 inactive ads"
                      : ""
                  }
                >
                  {userProfile?.user_type === "parent"
                    ? t("profile.createNewAd")
                    : userProfile?.user_type === "nanny"
                    ? t("profile.addService")
                    : t("profile.getStarted")}
                </button>
              );
            })()}
          </div>
        </div>

        {/* Content */}
        <div className="p-6 sm:p-8">
          {advertisements.length > 0 ? (
            <div className="space-y-6">
              {advertisements.map((ad) => (
                <div
                  key={ad.id}
                  className={`border rounded-2xl p-6 transition-all duration-200 cursor-pointer ${
                    ad.is_active
                      ? "bg-white border-purple-100 shadow-sm hover:shadow-md hover:border-purple-200"
                      : "bg-gray-50/70 border-gray-200 hover:bg-gray-50"
                  }`}
                  onClick={(e) => {
                    const target = e.target as HTMLElement;
                    // Prevent opening preview when clicking action controls inside the card
                    if (target.closest("a,button,input,select,textarea"))
                      return;
                    setPreviewAdId(ad.id);
                  }}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-xl font-semibold text-gray-900 mb-2">
                        {ad.title}
                      </h3>
                      <div className="flex items-center space-x-4 text-sm text-gray-600">
                        <span className="flex items-center">
                          <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                          {ad.type === "short-term"
                            ? t("profile.shortTerm")
                            : t("profile.longTerm")}
                        </span>
                        <span className="flex items-center">
                          <span className="mr-1">💰</span>${ad.price_per_hour}
                          {t("ad.perHour")}
                        </span>
                        <span className="flex items-center">
                          <span className="mr-1">📍</span>
                          {ad.location_city}
                        </span>
                      </div>
                      {ad.type === "long-term" && ad.is_active && ad.updated_at && (() => {
                        const daysLeft = Math.max(0, 7 - (Date.now() - new Date(ad.updated_at).getTime()) / (1000 * 60 * 60 * 24));
                        return (
                          <div className="mt-1 text-xs text-amber-600">
                            ⏳ {Math.ceil(daysLeft)}d {t("common.remaining")}
                          </div>
                        );
                      })()}
                    </div>
                    <div className="flex items-center space-x-2">
                      {ad.is_active ? (
                        <span
                          className="inline-flex items-center px-3 py-1.5 rounded-lg border border-gray-300 bg-gray-100 text-gray-400 text-sm font-medium cursor-not-allowed"
                          title={t("ad.deactivateToEdit")}
                        >
                          {t("ad.edit")}
                        </span>
                      ) : (
                        <a
                          className="inline-flex items-center px-3 py-1.5 rounded-lg border border-purple-600 text-purple-600 text-sm font-medium hover:bg-purple-50"
                          href={`/edit-advertisement/${ad.id}`}
                          title={t("ad.edit")}
                        >
                          {t("ad.edit")}
                        </a>
                      )}
                      {ad.is_active ? (
                        <button
                          onClick={async () => {
                            const { error } = await supabase.rpc("ad_toggle", {
                              p_ad_id: ad.id,
                              p_active: false,
                            });
                            if (error) {
                              setToast({ message: t("common.error"), type: "error" });
                              return;
                            }
                            const userAds =
                              await AdvertisementService.getUserAdvertisements(
                                userProfile!.id
                              );
                            setAdvertisements(userAds);
                          }}
                          className="inline-flex items-center px-3 py-1.5 rounded-lg border border-gray-300 text-gray-700 text-sm font-medium hover:bg-gray-100"
                        >
                          {t("ad.deactivate")}
                        </button>
                      ) : (() => {
                        const anotherActive = advertisements.some((a) => a.is_active);
                        const slots = adSlotsMap[ad.id] || [];
                        const today = new Date();
                        today.setHours(0, 0, 0, 0);
                        const allExpired = ad.type === "short-term" && slots.length > 0 && slots.every(
                          (s) => new Date(s.available_date + "T00:00:00") < today
                        );
                        const noSlots = ad.type === "short-term" && slots.length === 0;
                        const blocked = anotherActive || allExpired || noSlots;
                        return (
                            <button
                              onClick={async () => {
                                if (blocked) return;
                                const { error } = await supabase.rpc("ad_toggle", {
                                  p_ad_id: ad.id,
                                  p_active: true,
                                });
                                if (error) {
                                  setToast({ message: t("common.error"), type: "error" });
                                  return;
                                }
                                const userAds =
                                  await AdvertisementService.getUserAdvertisements(
                                    userProfile!.id
                                  );
                                setAdvertisements(userAds);
                              }}
                              disabled={blocked}
                              title={
                                anotherActive
                                  ? t("ad.anotherActive")
                                  : allExpired || noSlots
                                  ? t("ad.expiredDates")
                                  : ""
                              }
                              className={
                                `inline-flex items-center px-3 py-1.5 rounded-lg border text-sm font-medium ` +
                                (blocked
                                  ? "text-gray-400 border-gray-300 cursor-not-allowed"
                                  : "text-green-700 border-green-600 hover:bg-green-50")
                              }
                            >
                              {t("ad.activate")}
                            </button>
                        );
                      })()}
                      {!ad.is_active && (
                        <button
                          onClick={async () => {
                            if (!confirm(t("ad.deleteConfirm"))) {
                              return;
                            }
                            const ok =
                              await AdvertisementService.deleteAdvertisement(
                                ad.id
                              );
                            if (!ok) {
                              console.error(
                                "Failed to delete advertisement",
                                ad.id
                              );
                              return;
                            }
                            const userAds =
                              await AdvertisementService.getUserAdvertisements(
                                userProfile!.id
                              );
                            setAdvertisements(userAds);
                          }}
                          className="inline-flex items-center px-3 py-1.5 rounded-lg border border-red-600 text-red-700 text-sm font-medium hover:bg-red-50"
                        >
                          {t("ad.delete")}
                        </button>
                      )}
                    </div>
                  </div>
                  {!ad.is_active && (() => {
                    const slots = adSlotsMap[ad.id] || [];
                    const today = new Date();
                    today.setHours(0, 0, 0, 0);
                    const allExpired = ad.type === "short-term" && slots.length > 0 && slots.every(
                      (s) => new Date(s.available_date + "T00:00:00") < today
                    );
                    const noSlots = ad.type === "short-term" && slots.length === 0;
                    if (allExpired || noSlots) {
                      return (
                        <div className="text-xs text-amber-600 mt-1 text-right">
                          {t("ad.expiredDates")}
                        </div>
                      );
                    }
                    if (ad.type === "long-term" && ad.updated_at) {
                      const daysSince = (Date.now() - new Date(ad.updated_at).getTime()) / (1000 * 60 * 60 * 24);
                      if (daysSince >= 7) {
                        return (
                          <div className="text-xs text-blue-600 mt-1 text-right">
                            {t("ad.longTermReactivate")}
                          </div>
                        );
                      }
                    }
                    return null;
                  })()}

                  <p
                    className={`mb-4 line-clamp-3 ${
                      ad.is_active ? "text-gray-700" : "text-gray-500"
                    }`}
                  >
                    {ad.description}
                  </p>

                  {ad.skills && ad.skills.length > 0 && (
                    <div className="mb-4">
                      <div className="flex flex-wrap gap-2">
                        {ad.skills.slice(0, 5).map((skill) => (
                          <span
                            key={skill}
                            className="px-3 py-1 bg-purple-100 text-purple-700 text-xs rounded-full"
                          >
                            {getTranslatedSkill(skill, language)}
                          </span>
                        ))}
                        {ad.skills.length > 5 && (
                          <span className="px-3 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                            {t("ad.moreSkills", {
                              count: ad.skills.length - 5,
                            })}
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                  <div
                    className={`flex items-center justify-between text-sm ${
                      ad.is_active ? "text-gray-500" : "text-gray-500"
                    }`}
                  >
                    <span>
                      {t("ad.created", { date: formatMonthYear(ad.created_at, language) })}
                    </span>
                    <span
                      className={
                        ad.is_active
                          ? "text-green-600 font-medium"
                          : "text-gray-500"
                      }
                    >
                      {ad.is_active ? t("ad.active") : t("ad.inactive")}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            /* Empty State */
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg
                  className="w-8 h-8 text-purple-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                {userProfile?.user_type === "parent"
                  ? "No Job Ads Yet"
                  : userProfile?.user_type === "nanny"
                  ? "No Services Listed Yet"
                  : "Complete your profile to get started"}
              </h3>
              <p className="text-gray-600 mb-6 max-w-md mx-auto">
                {userProfile?.user_type === "parent"
                  ? "Create your first job ad to find the perfect childcare provider for your family."
                  : userProfile?.user_type === "nanny"
                  ? "List your childcare services to start receiving booking requests from families."
                  : "Complete your profile to get started"}
              </p>
            </div>
          )}
        </div>
      </div>

      {previewAdId && (
        <AdvertisementPreview
          advertisementId={previewAdId}
          onClose={() => setPreviewAdId(null)}
        />
      )}
    </div>
  );
}
