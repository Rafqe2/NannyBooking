"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { AdvertisementService } from "../lib/advertisementService";
import LocationAutocomplete from "./LocationAutocomplete";
import MultiDatePicker from "./MultiDatePicker";
import { toLocalYYYYMMDD, formatDateDDMMYYYY } from "../lib/date";
import { NANNY_SKILLS, PARENT_SKILLS } from "../lib/constants/skills";
import { useTranslation } from "./LanguageProvider";
import { getTranslatedSkill } from "../lib/constants/skills";
import { useSupabaseUser } from "../lib/useSupabaseUser";
import { UserService } from "../lib/userService";

export default function EditAdvertisement({
  advertisementId,
}: {
  advertisementId: string;
}) {
  const { t, language } = useTranslation();
  const { user, isLoading: authLoading } = useSupabaseUser();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [ad, setAd] = useState<any | null>(null);
  const [title, setTitle] = useState("");
  const [pricePerHour, setPricePerHour] = useState<number>(0);
  const [description, setDescription] = useState("");
  const [experience, setExperience] = useState("");
  const [additionalInfo, setAdditionalInfo] = useState("");
  const [locationCity, setLocationCity] = useState("");
  const [skills, setSkills] = useState<string[]>([]);
  const [type, setType] = useState<"short-term" | "long-term">("short-term");
  const [extraLocations, setExtraLocations] = useState<string[]>([]);
  const [showLocationsEditor, setShowLocationsEditor] = useState(false);
  const [selectedDates, setSelectedDates] = useState<Date[]>([]);
  const [perDateTimes, setPerDateTimes] = useState<
    Record<string, { start: string; end: string }>
  >({});
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [userType, setUserType] = useState<"parent" | "nanny" | null>(null);

  const isParent = userType === "parent";
  const availableSkills = useMemo(() => (isParent ? PARENT_SKILLS : NANNY_SKILLS), [isParent]);

  // Redirect unauthenticated users
  useEffect(() => {
    if (!authLoading && !user) router.push("/login");
  }, [authLoading, user, router]);

  useEffect(() => {
    if (!user?.id) return;
    const run = async () => {
      setLoading(true);
      setError(null);
      try {
        const adData = await AdvertisementService.getAdvertisementById(
          advertisementId
        );
        if (!adData) throw new Error(t("ad.notFound"));
        // Ownership check — only the ad's owner may edit it
        if (adData.user_id !== user.id) {
          router.push("/");
          return;
        }
        setAd(adData);
        // Load user type to show correct skills list
        if (user.email) {
          const profile = await UserService.getUserByEmail(user.email);
          if (profile?.user_type === "parent" || profile?.user_type === "nanny") {
            setUserType(profile.user_type);
          }
        }
        setTitle(adData.title || "");
        setPricePerHour(Number(adData.price_per_hour) || 0);
        setDescription(adData.description || "");
        setExperience(adData.experience || "");
        setAdditionalInfo(adData.additional_info || "");
        setLocationCity(adData.location_city || "");
        setSkills((adData.skills as any) || []);
        setType((adData.type as any) || "short-term");
        // load dates, filtering out expired ones
        const slots = await AdvertisementService.getAvailabilitySlots(
          advertisementId
        );
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const dates: Date[] = [];
        const per: Record<string, { start: string; end: string }> = {};
        for (const s of slots) {
          const d = new Date(s.available_date + "T00:00:00");
          if (d < today) continue; // skip expired dates
          dates.push(d);
          per[s.available_date] = { start: s.start_time, end: s.end_time };
        }
        setSelectedDates(dates);
        setPerDateTimes(per);
        // load extra locations (filter out primary location to avoid duplicates)
        const locs = await AdvertisementService.getLocations(advertisementId);
        const primary = adData.location_city || "";
        const extras = (locs || [])
          .map((l: any) => l.label)
          .filter((label: string) => label !== primary);
        setExtraLocations(extras);
      } catch (e: any) {
        setError(e?.message || t("ad.errorLoadFailed"));
      } finally {
        setLoading(false);
      }
    };
    run();
  }, [advertisementId, user?.id]);

  const handleSkillToggle = (skill: string) => {
    setSkills((prev) =>
      prev.includes(skill) ? prev.filter((s) => s !== skill) : [...prev, skill]
    );
  };

  const onUpdateDateTime = (date: Date, start: string, end: string) => {
    const key = toLocalYYYYMMDD(date);
    setPerDateTimes((prev) => ({ ...prev, [key]: { start, end } }));
  };

  const onRemoveDate = (date: Date) => {
    const key = toLocalYYYYMMDD(date);
    setPerDateTimes((prev) => {
      const next = { ...prev } as any;
      delete next[key];
      return next;
    });
  };

  const removeDateCompletely = (date: Date) => {
    const key = toLocalYYYYMMDD(date);
    setSelectedDates((prev) => prev.filter((d) => toLocalYYYYMMDD(d) !== key));
    onRemoveDate(date);
  };

  const clearAllDates = () => {
    setSelectedDates([]);
    setPerDateTimes({});
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4" />
          <p className="text-gray-600">{t("adEdit.loading")}</p>
        </div>
      </div>
    );
  }

  if (error || !ad) {
    return (
      <div className="text-center py-20">
        <p className="text-gray-700">{error || t("ad.notFound")}</p>
      </div>
    );
  }

  const isActive = !!ad.is_active;

  return (
    <div className="max-w-3xl mx-auto bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
      <div className="px-6 py-5 border-b border-gray-100 bg-gradient-to-r from-purple-50 to-indigo-50/40">
        <h1 className="text-xl font-bold text-gray-900">
          {t("createAd.editTitle")}
        </h1>
        <p className="text-sm text-gray-500 mt-0.5">
          {isParent ? t("adCreate.titlePlaceholderParent") : t("adCreate.subtitle")}
        </p>
      </div>
      {isActive && (
        <div className="flex items-center gap-3 px-6 py-3 bg-amber-50 border-b border-amber-200 text-sm text-amber-800">
          <svg className="w-4 h-4 flex-shrink-0 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/></svg>
          {t("adEdit.lockedWhileActive")}
        </div>
      )}
      <div className="p-6">

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {isParent ? t("adCreate.careNeeded") : t("adCreate.serviceType")}
          </label>
          <select
            disabled={isActive}
            value={type}
            onChange={(e) => setType(e.target.value as any)}
            className="w-full h-[42px] px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent disabled:bg-gray-50 disabled:cursor-not-allowed"
          >
            <option value="short-term">{isParent ? t("adCreate.shortTermNeed") : t("adCreate.shortTermCare")}</option>
            <option value="long-term">{isParent ? t("adCreate.longTermNeed") : t("adCreate.longTermCare")}</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {t("adCreate.pricePerHour")}
          </label>
          <input
            disabled={isActive}
            type="text"
            inputMode="decimal"
            value={pricePerHour === 0 ? "" : pricePerHour}
            onChange={(e) => {
              const value = e.target.value;
              if (value === "" || /^\d*\.?\d*$/.test(value)) {
                const numValue = value === "" ? 0 : parseFloat(value);
                if (value === "" || (numValue >= 0 && numValue <= 10000)) {
                  setPricePerHour(numValue);
                }
              }
            }}
            className="w-full px-3 py-2 border rounded-lg disabled:bg-gray-50"
          />
          <p className="text-xs text-gray-500 mt-1">
            {pricePerHour > 0 ? `€${pricePerHour.toFixed(2)}` : t("adCreate.enterPrice")}
          </p>
        </div>
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {t("adCreate.adTitle")}
          </label>
          <input
            disabled={isActive}
            type="text"
            value={title}
            onChange={(e) => {
              const value = e.target.value;
              if (value.length <= 100) {
                setTitle(value);
              }
            }}
            maxLength={100}
            className="w-full px-3 py-2 border rounded-lg disabled:bg-gray-50"
          />
          <p className="text-xs text-gray-500 mt-1">
            {title.length}/100 {title.length < 6 && (
              <span className="text-red-500">({t("adCreate.minCharacters")})</span>
            )}
          </p>
        </div>
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {t("ad.description")}
          </label>
          <textarea
            disabled={isActive}
            rows={3}
            value={description}
            onChange={(e) => {
              const value = e.target.value;
              if (value.length <= 2000) {
                setDescription(value);
              }
            }}
            maxLength={2000}
            className="w-full px-3 py-2 border rounded-lg disabled:bg-gray-50"
          />
          <p className="text-xs text-gray-500 mt-1">
            {description.length}/2000 {t("adCreate.characters")}
          </p>
        </div>
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {isParent ? t("adCreate.requirementsPreferences") : t("adCreate.experienceBackground")}
          </label>
          <textarea
            disabled={isActive}
            rows={3}
            value={experience}
            onChange={(e) => {
              const value = e.target.value;
              if (value.length <= 1000) {
                setExperience(value);
              }
            }}
            maxLength={1000}
            className="w-full px-3 py-2 border rounded-lg disabled:bg-gray-50"
          />
          <p className="text-xs text-gray-500 mt-1">
            {experience.length}/1000 {t("adCreate.characters")}
          </p>
        </div>
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {t("adCreate.additionalInfo")}
          </label>
          <textarea
            disabled={isActive}
            rows={2}
            value={additionalInfo}
            onChange={(e) => {
              const value = e.target.value;
              if (value.length <= 500) {
                setAdditionalInfo(value);
              }
            }}
            maxLength={500}
            className="w-full px-3 py-2 border rounded-lg disabled:bg-gray-50"
          />
          <p className="text-xs text-gray-500 mt-1">
            {additionalInfo.length}/500 {t("adCreate.characters")}
          </p>
        </div>
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {t("adCreate.location")}
          </label>
          <LocationAutocomplete
            value={locationCity}
            onChange={(v) => setLocationCity(v.label)}
            placeholder={t("adCreate.placeholderSearch")}
          />
        </div>
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {t("ad.skills")}
          </label>
          <div className="flex flex-wrap gap-2">
            {availableSkills.map((s) => (
              <button
                key={s}
                type="button"
                disabled={isActive}
                onClick={() => handleSkillToggle(s)}
                className={
                  "px-3 py-1 rounded-full text-xs border " +
                  (skills.includes(s)
                    ? "bg-purple-100 text-purple-700 border-purple-200"
                    : "bg-white text-gray-700 border-gray-300") +
                  (isActive ? " opacity-60 cursor-not-allowed" : "")
                }
              >
                {getTranslatedSkill(s, language)}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Extra locations (collapsed, add button) */}
      <div className="mt-6">
        <div className="flex items-center justify-between">
          <label className="block text-sm font-medium text-gray-700">
            {t("adEdit.additionalLocations")}
          </label>
          <div className="text-sm text-gray-500">
            {extraLocations.filter((x) => (x || "").trim().length > 0).length >
            0
              ? t("adEdit.locationsAdded", {
                  count: extraLocations.filter((x) => (x || "").trim().length > 0).length,
                })
              : t("adEdit.none")}
          </div>
        </div>
        {!showLocationsEditor ? (
          <div className="mt-2">
            <button
              type="button"
              disabled={isActive}
              onClick={() => {
                setShowLocationsEditor(true);
                if (extraLocations.length === 0) setExtraLocations([""]);
              }}
              className="px-4 py-2 border rounded-lg text-sm hover:bg-gray-50 disabled:opacity-60"
            >
              {t("adEdit.addLocation")}
            </button>
          </div>
        ) : (
          <div className="mt-3 space-y-2">
            {extraLocations.map((val, idx) => (
              <div key={idx} className="flex gap-2">
                <div className="flex-1">
                  <LocationAutocomplete
                    value={val || ""}
                    onChange={(next) => {
                      const updated = [...extraLocations];
                      updated[idx] = next.label;
                      setExtraLocations(updated);
                    }}
                    placeholder={t("adEdit.locationPlaceholder")}
                  />
                </div>
                <button
                  type="button"
                  disabled={isActive}
                  onClick={() => {
                    const next = extraLocations.filter((_, i) => i !== idx);
                    setExtraLocations(next);
                  }}
                  className="px-3 py-2 border rounded-lg text-sm hover:bg-gray-50 disabled:opacity-60"
                >
                  {t("adEdit.remove")}
                </button>
              </div>
            ))}
            {extraLocations.length < 3 && (
              <button
                type="button"
                disabled={isActive}
                onClick={() => setExtraLocations([...extraLocations, ""])}
                className="px-4 py-2 border rounded-lg text-sm hover:bg-gray-50 disabled:opacity-60"
              >
                {t("adEdit.addAnotherLocation")}
              </button>
            )}
            <div>
              <button
                type="button"
                onClick={() => setShowLocationsEditor(false)}
                className="mt-2 px-4 py-2 bg-gray-100 rounded-lg text-sm hover:bg-gray-200"
              >
                {t("adEdit.done")}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Availability */}
      {type === "short-term" && (
        <div className="mt-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            {t("adCreate.availabilitySchedule")}
          </h2>
          <p className="text-sm text-gray-600 mb-4">
            {t("adCreate.selectDatesAndTimes")} ({t("adCreate.max5Dates")})
          </p>
          <div className={"mt-4"}>
            <MultiDatePicker
              selectedDates={selectedDates}
              onChange={(dates) => {
                // Limit to 5 dates
                const limitedDates = dates.slice(0, 5);
                setSelectedDates(limitedDates);
                // Remove times for dates that were removed
                if (limitedDates.length < dates.length) {
                  const limitedKeys = new Set(
                    limitedDates.map((d) => toLocalYYYYMMDD(d))
                  );
                  setPerDateTimes((prev) => {
                    const n = { ...prev };
                    Object.keys(n).forEach((key) => {
                      if (!limitedKeys.has(key)) {
                        delete n[key];
                      }
                    });
                    return n;
                  });
                }
              }}
              minDate={(() => {
                const d = new Date();
                d.setHours(0, 0, 0, 0);
                return d;
              })()}
              onSelectedDateClick={() => {}}
              perDateTimes={perDateTimes}
              defaultStartTime="09:00"
              defaultEndTime="17:00"
              onUpdateDateTime={onUpdateDateTime}
              onRemoveDate={onRemoveDate}
              initialMonthDate={selectedDates[0] || new Date()}
              hideTip
            />
          </div>
          {selectedDates.length > 0 && (
            <div className="mt-4 p-4 border border-gray-200 rounded-xl bg-white">
              <div className="flex items-center justify-between mb-2">
                <div className="text-sm font-medium text-gray-900">
                  {t("adCreate.selectedDates")} ({selectedDates.length}/5)
                </div>
                <button
                  type="button"
                  onClick={clearAllDates}
                  className="text-red-600 hover:text-red-700 text-sm"
                >
                  {t("adEdit.clearAll")}
                </button>
              </div>
              <ul className="space-y-1.5">
                {selectedDates
                  .slice()
                  .sort((a, b) => a.getTime() - b.getTime())
                  .map((d) => {
                    const key = toLocalYYYYMMDD(d);
                    const ov = perDateTimes[key];
                    const start = ov?.start || "09:00";
                    const end = ov?.end || "17:00";
                    return (
                      <li
                        key={key}
                        className="flex items-center justify-between bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 hover:bg-gray-100 transition-colors"
                      >
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <div className="text-sm font-medium text-gray-900 whitespace-nowrap">
                            {formatDateDDMMYYYY(d)}
                          </div>
                          <div className="flex items-center gap-1">
                            <input
                              type="time"
                              value={start}
                              onChange={(e) => {
                                setPerDateTimes((prev) => ({
                                  ...prev,
                                  [key]: { start: e.target.value, end },
                                }));
                              }}
                              className="px-1.5 py-0.5 border border-gray-300 rounded text-xs font-mono bg-white focus:ring-1 focus:ring-purple-500 focus:border-purple-500"
                            />
                            <span className="text-xs text-gray-400">-</span>
                            <input
                              type="time"
                              value={end}
                              onChange={(e) => {
                                setPerDateTimes((prev) => ({
                                  ...prev,
                                  [key]: { start, end: e.target.value },
                                }));
                              }}
                              className="px-1.5 py-0.5 border border-gray-300 rounded text-xs font-mono bg-white focus:ring-1 focus:ring-purple-500 focus:border-purple-500"
                            />
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeDateCompletely(d)}
                          title={t("adCreate.removeDate")}
                          aria-label={t("adCreate.removeDate")}
                          className="ml-2 text-gray-400 hover:text-red-600 transition-colors p-1 rounded"
                        >
                          <svg
                            className="w-4 h-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M6 18L18 6M6 6l12 12"
                            />
                          </svg>
                        </button>
                      </li>
                    );
                  })}
              </ul>
              {selectedDates.length >= 5 && (
                <div className="text-xs text-amber-600 mt-2">
                  {t("adCreate.maxReached")}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {saveError && (
        <div className="mt-6 flex items-start gap-3 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
          <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
          </svg>
          {saveError}
        </div>
      )}

      <div className="mt-8 flex items-center justify-between gap-3 pt-4 border-t border-gray-100">
        <button
          type="button"
          disabled={saving}
          onClick={async () => {
            history.back();
          }}
          className="px-5 py-2.5 border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors disabled:opacity-50"
        >
          {t("adEdit.cancel")}
        </button>
        <button
          type="button"
          disabled={saving}
          onClick={async () => {
            setSaveError(null);
            if (type === "short-term" && selectedDates.length === 0) {
              setSaveError(t("adEdit.errorNoDates"));
              return;
            }
            setSaving(true);
            try {
              // update base ad
              await AdvertisementService.updateAdvertisement(advertisementId, {
                title,
                price_per_hour: pricePerHour as any,
                description: description as any,
                experience: experience as any,
                additional_info: additionalInfo || null,
                location_city: locationCity as any,
                skills: skills as any,
                availability_start_time: "09:00" as any,
                availability_end_time: "17:00" as any,
                type: type as any,
              } as any);
              // replace locations (deduplicate)
              const allLocs = Array.from(new Set(
                [locationCity, ...extraLocations]
                  .map((x) => (x || "").trim())
                  .filter((x) => x.length > 0)
              )).slice(0, 3);
              await AdvertisementService.replaceLocations(
                advertisementId,
                allLocs
              );
              // replace availability
              if (type === "short-term") {
                const slots = selectedDates.map((d) => {
                  const key = toLocalYYYYMMDD(d);
                  const ov = perDateTimes[key];
                  return {
                    available_date: key,
                    start_time: (ov?.start || "09:00") as any,
                    end_time: (ov?.end || "17:00") as any,
                  };
                });
                await AdvertisementService.replaceAvailabilitySlots(
                  advertisementId,
                  slots
                );
              } else {
                // long-term: clear any slots
                await AdvertisementService.deleteAvailabilitySlots(
                  advertisementId
                );
              }
              history.back();
            } catch (e) {
              // eslint-disable-next-line no-console
              console.error(e);
            } finally {
              setSaving(false);
            }
          }}
          className="inline-flex items-center gap-2 px-6 py-2.5 bg-purple-600 text-white text-sm font-medium rounded-lg hover:bg-purple-700 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {saving && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
          {saving ? t("adEdit.saving") : t("adEdit.save")}
        </button>
      </div>
      </div>
    </div>
  );
}
