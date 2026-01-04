"use client";

import { useEffect, useMemo, useState } from "react";
import { AdvertisementService } from "../lib/advertisementService";
import LocationAutocomplete from "./LocationAutocomplete";
import MultiDatePicker from "./MultiDatePicker";
import { toLocalYYYYMMDD, formatDateDDMMYYYY } from "../lib/date";
import { NANNY_SKILLS } from "../lib/constants/skills";
import { useTranslation } from "./LanguageProvider";
import { getTranslatedSkill } from "../lib/constants/skills";

export default function EditAdvertisement({
  advertisementId,
}: {
  advertisementId: string;
}) {
  const { t, language } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [ad, setAd] = useState<any | null>(null);
  const [title, setTitle] = useState("");
  const [pricePerHour, setPricePerHour] = useState<number>(0);
  const [description, setDescription] = useState("");
  const [locationCity, setLocationCity] = useState("");
  const [skills, setSkills] = useState<string[]>([]);
  const [type, setType] = useState<"short-term" | "long-term">("short-term");
  const [defaultStart, setDefaultStart] = useState("09:00");
  const [defaultEnd, setDefaultEnd] = useState("17:00");
  const [extraLocations, setExtraLocations] = useState<string[]>([]);
  const [showLocationsEditor, setShowLocationsEditor] = useState(false);
  const [selectedDates, setSelectedDates] = useState<Date[]>([]);
  const [perDateTimes, setPerDateTimes] = useState<
    Record<string, { start: string; end: string }>
  >({});
  const [saving, setSaving] = useState(false);

  const availableSkills = useMemo(() => NANNY_SKILLS, []);

  useEffect(() => {
    const run = async () => {
      setLoading(true);
      setError(null);
      try {
        const adData = await AdvertisementService.getAdvertisementById(
          advertisementId
        );
        if (!adData) throw new Error(t("ad.notFound"));
        setAd(adData);
        setTitle(adData.title || "");
        setPricePerHour(Number(adData.price_per_hour) || 0);
        setDescription(adData.description || "");
        setLocationCity(adData.location_city || "");
        setSkills((adData.skills as any) || []);
        setType((adData.type as any) || "short-term");
        setDefaultStart(adData.availability_start_time || "09:00");
        setDefaultEnd(adData.availability_end_time || "17:00");
        // load dates
        const slots = await AdvertisementService.getAvailabilitySlots(
          advertisementId
        );
        const dates: Date[] = [];
        const per: Record<string, { start: string; end: string }> = {};
        for (const s of slots) {
          const d = new Date(s.available_date + "T00:00:00");
          dates.push(d);
          per[s.available_date] = { start: s.start_time, end: s.end_time };
        }
        setSelectedDates(dates);
        setPerDateTimes(per);
        // load extra locations
        const locs = await AdvertisementService.getLocations(advertisementId);
        setExtraLocations((locs || []).map((l: any) => l.label));
      } catch (e: any) {
        setError(e?.message || t("ad.errorLoadFailed"));
      } finally {
        setLoading(false);
      }
    };
    run();
  }, [advertisementId]);

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
          <p className="text-gray-600">Loading advertisement…</p>
        </div>
      </div>
    );
  }

  if (error || !ad) {
    return (
      <div className="text-center py-20">
        <p className="text-gray-700">{error || "Advertisement not found"}</p>
      </div>
    );
  }

  const isActive = !!ad.is_active;

  return (
    <div className="max-w-3xl mx-auto bg-white border border-gray-200 rounded-2xl shadow-sm p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">
          Edit Advertisement
        </h1>
        {isActive && (
          <span className="text-sm text-gray-500">
            Title, type, price, description and skills are locked while active.
            Availability and locations can be edited.
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {t("adCreate.serviceType")}
          </label>
          <select
            disabled={isActive}
            value={type}
            onChange={(e) => setType(e.target.value as any)}
            className="w-full px-3 py-2 border rounded-lg disabled:bg-gray-50"
          >
            <option value="short-term">{t("profile.shortTerm")}</option>
            <option value="long-term">{t("profile.longTerm")}</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {t("adCreate.pricePerHour")}
          </label>
          <input
            disabled={isActive}
            type="number"
            value={pricePerHour}
            onChange={(e) => setPricePerHour(Number(e.target.value))}
            className="w-full px-3 py-2 border rounded-lg disabled:bg-gray-50"
          />
        </div>
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {t("adCreate.adTitle")}
          </label>
          <input
            disabled={isActive}
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full px-3 py-2 border rounded-lg disabled:bg-gray-50"
          />
        </div>
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {t("ad.description")}
          </label>
          <textarea
            disabled={isActive}
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full px-3 py-2 border rounded-lg disabled:bg-gray-50"
          />
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
            Additional locations
          </label>
          <div className="text-sm text-gray-500">
            {extraLocations.filter((x) => (x || "").trim().length > 0).length >
            0
              ? `${
                  extraLocations.filter((x) => (x || "").trim().length > 0)
                    .length
                } added`
              : "None"}
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
              Add location
            </button>
          </div>
        ) : (
          <div className="mt-3 space-y-2">
            {extraLocations.map((val, idx) => (
              <div key={idx} className="flex gap-2">
                <input
                  disabled={isActive}
                  type="text"
                  value={val || ""}
                  onChange={(e) => {
                    const next = [...extraLocations];
                    next[idx] = e.target.value;
                    setExtraLocations(next);
                  }}
                  placeholder="City, country or street"
                  className="flex-1 px-3 py-2 border rounded-lg disabled:bg-gray-50"
                />
                <button
                  type="button"
                  disabled={isActive}
                  onClick={() => {
                    const next = extraLocations.filter((_, i) => i !== idx);
                    setExtraLocations(next);
                  }}
                  className="px-3 py-2 border rounded-lg text-sm hover:bg-gray-50 disabled:opacity-60"
                >
                  Remove
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
                Add another location
              </button>
            )}
            <div>
              <button
                type="button"
                onClick={() => setShowLocationsEditor(false)}
                className="mt-2 px-4 py-2 bg-gray-100 rounded-lg text-sm hover:bg-gray-200"
              >
                Done
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Availability */}
      {type === "short-term" && (
        <div className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Default start
              </label>
              <input
                disabled={false}
                type="time"
                value={defaultStart}
                onChange={(e) => setDefaultStart(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg disabled:bg-gray-50"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Default end
              </label>
              <input
                disabled={false}
                type="time"
                value={defaultEnd}
                onChange={(e) => setDefaultEnd(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg disabled:bg-gray-50"
              />
            </div>
          </div>
          <div className={"mt-4"}>
            <MultiDatePicker
              selectedDates={selectedDates}
              onChange={setSelectedDates}
              minDate={(() => {
                const d = new Date();
                d.setHours(0, 0, 0, 0);
                return d;
              })()}
              onSelectedDateClick={() => {}}
              perDateTimes={perDateTimes}
              defaultStartTime={defaultStart}
              defaultEndTime={defaultEnd}
              onUpdateDateTime={onUpdateDateTime}
              onRemoveDate={onRemoveDate}
              initialMonthDate={selectedDates[0] || new Date()}
            />
          </div>
          {selectedDates.length > 0 && (
            <div className="mt-4 p-4 border border-gray-200 rounded-xl bg-white">
              <div className="flex items-center justify-between mb-2">
                <div className="text-sm font-medium text-gray-900">
                  Selected dates
                </div>
                <button
                  type="button"
                  disabled={false}
                  onClick={clearAllDates}
                  className="text-red-600 hover:text-red-700 text-sm disabled:opacity-50"
                >
                  Clear all
                </button>
              </div>
              <ul className="space-y-1 text-sm text-gray-700">
                {selectedDates
                  .slice()
                  .sort((a, b) => a.getTime() - b.getTime())
                  .map((d) => {
                    const key = toLocalYYYYMMDD(d);
                    const ov = perDateTimes[key];
                    const start = ov?.start || defaultStart;
                    const end = ov?.end || defaultEnd;
                    return (
                      <li
                        key={key}
                        className="flex items-center justify-between"
                      >
                        <span>{formatDateDDMMYYYY(d)}</span>
                        <div className="flex items-center">
                          <span className="text-gray-600">
                            {start} - {end}
                          </span>
                          <button
                            type="button"
                            disabled={false}
                            onClick={() => removeDateCompletely(d)}
                            title="Remove this date"
                            aria-label="Remove date"
                            className="ml-3 inline-flex items-center justify-center w-6 h-6 rounded-full border border-red-300 text-red-600 hover:bg-red-50 hover:text-red-700 disabled:opacity-50"
                          >
                            ✕
                          </button>
                        </div>
                      </li>
                    );
                  })}
              </ul>
            </div>
          )}
        </div>
      )}

      <div className="mt-8 flex justify-end gap-3">
        <button
          type="button"
          disabled={saving}
          onClick={async () => {
            history.back();
          }}
          className="px-5 py-2 border rounded-lg"
        >
          Cancel
        </button>
        <button
          type="button"
          disabled={saving}
          onClick={async () => {
            setSaving(true);
            try {
              // update base ad
              await AdvertisementService.updateAdvertisement(advertisementId, {
                title,
                price_per_hour: pricePerHour as any,
                description: description as any,
                location_city: locationCity as any,
                skills: skills as any,
                availability_start_time: defaultStart as any,
                availability_end_time: defaultEnd as any,
                type: type as any,
              } as any);
              // replace locations
              const allLocs = [locationCity, ...extraLocations]
                .map((x) => (x || "").trim())
                .filter((x) => x.length > 0)
                .slice(0, 3);
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
                    start_time: (ov?.start || defaultStart) as any,
                    end_time: (ov?.end || defaultEnd) as any,
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
          className="px-5 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50"
        >
          {saving ? "Saving…" : "Save"}
        </button>
      </div>
    </div>
  );
}
