"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSupabaseUser } from "../lib/useSupabaseUser";
import { LV_CITIES } from "../lib/constants/cities";
import { NANNY_SKILLS, PARENT_SKILLS } from "../lib/constants/skills";
import { AdvertisementService } from "../lib/advertisementService";
import { UserService } from "../lib/userService";
import LocationAutocomplete from "./LocationAutocomplete";
import MultiDatePicker from "./MultiDatePicker";
import { useTranslation } from "./LanguageProvider";
import { getTranslatedSkill } from "../lib/constants/skills";
import { formatDateDDMMYYYY } from "../lib/date";

interface AdvertisementForm {
  type: "short-term" | "long-term";
  title: string;
  description: string;
  experience: string;
  skills: string[];
  availability: {
    dates: Date[];
    startTime: string;
    endTime: string;
  };
  location: {
    city: string;
    address: string;
    zipCode: string;
  };
  pricePerHour: number;
  additionalInfo: string;
}

export default function CreateAdvertisement() {
  const { user, isLoading } = useSupabaseUser();
  const router = useRouter();
  const { t, language } = useTranslation();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [locationError, setLocationError] = useState(false);
  const [userType, setUserType] = useState<
    "parent" | "nanny" | "pending" | null
  >(null);
  const [formData, setFormData] = useState<AdvertisementForm>({
    type: "short-term",
    title: "",
    description: "",
    experience: "",
    skills: [],
    availability: {
      dates: [],
      startTime: "09:00",
      endTime: "17:00",
    },
    location: {
      city: "",
      address: "",
      zipCode: "",
    },
    pricePerHour: 0,
    additionalInfo: "",
  });
  const [extraLocations, setExtraLocations] = useState<string[]>([]);
  const [perDateTimes, setPerDateTimes] = useState<
    Record<string, { start: string; end: string }>
  >({});
  const [showAdditionalInfo, setShowAdditionalInfo] = useState(false);

  const cities = LV_CITIES;

  // Redirect unauthenticated users to login
  useEffect(() => {
    if (!isLoading && !user) {
      router.push("/login");
    }
  }, [isLoading, user, router]);

  // Load user profile to determine user type for conditional form copy
  useEffect(() => {
    const load = async () => {
      if (!user?.email) return;
      const profile = await UserService.getUserByEmail(user.email);
      setUserType((profile?.user_type as any) || null);
    };
    load();
  }, [user?.email]);

  const isParent = userType === "parent";
  const isNanny = userType === "nanny";
  const availableSkills = isParent ? PARENT_SKILLS : NANNY_SKILLS;

  const handleSkillToggle = (skill: string) => {
    setFormData((prev) => ({
      ...prev,
      skills: prev.skills.includes(skill)
        ? prev.skills.filter((s) => s !== skill)
        : [...prev.skills, skill],
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    if (!user?.id || !user?.email) {
      setError(t("adCreate.errorNotAuthenticated"));
      setIsSubmitting(false);
      return;
    }

    // Client-side validation with user-facing messages
    if (formData.title.trim().length < 6) {
      setError(t("adCreate.errorTitleTooShort"));
      setIsSubmitting(false);
      return;
    }
    if (!formData.location.city || formData.location.city.trim().length < 2) {
      setError(t("adCreate.errorSelectLocation"));
      setLocationError(true);
      setIsSubmitting(false);
      return;
    }
    if (formData.pricePerHour <= 0) {
      setError(t("adCreate.errorPriceGreaterThanZero"));
      setIsSubmitting(false);
      return;
    }
    if (formData.type === "short-term" && formData.availability.dates.length === 0) {
      setError(t("adCreate.errorNoDates"));
      setIsSubmitting(false);
      return;
    }
    if (
      formData.type === "short-term" &&
      formData.availability.startTime &&
      formData.availability.endTime &&
      formData.availability.startTime >= formData.availability.endTime
    ) {
      setError(t("adCreate.errorStartTimeBeforeEnd"));
      setIsSubmitting(false);
      return;
    }

    try {
      // Prepare advertisement data for database
      const advertisementData = {
        type: formData.type,
        title: formData.title,
        description: formData.description,
        experience: formData.experience,
        skills: formData.skills,
        availability_start_time: formData.availability.startTime,
        availability_end_time: formData.availability.endTime,
        location_city: formData.location.city,
        location_address: formData.location.address || null,
        location_zip_code: formData.location.zipCode || null,
        price_per_hour: formData.pricePerHour,
        additional_info: formData.additionalInfo || null,
      };

      // Enforce limits: one active, up to three inactive
      const hasActive = await AdvertisementService.hasActiveAd(user.id);
      if (hasActive) {
        setError(t("adCreate.errorActiveAd"));
        setIsSubmitting(false);
        return;
      }
      const inactiveCount = await AdvertisementService.getInactiveCount(
        user.id
      );
      if (inactiveCount >= 3) {
        setError(t("adCreate.errorInactiveLimit"));
        setIsSubmitting(false);
        return;
      }

      // Create advertisement as inactive by default
      const createdAdvertisement =
        await AdvertisementService.createAdvertisement(
          user.id,
          advertisementData
        );

      if (!createdAdvertisement) {
        setError(t("adCreate.errorCreateFailed"));
        setIsSubmitting(false);
        return;
      }
      // Save availability slots if any dates are selected
      if (formData.availability.dates.length > 0) {
        const slots = formData.availability.dates.map((d) => {
          const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(
            2,
            "0"
          )}-${String(d.getDate()).padStart(2, "0")}`;
          const ov = perDateTimes[key];
          return {
            available_date: key,
            start_time: ov?.start || formData.availability.startTime,
            end_time: ov?.end || formData.availability.endTime,
          };
        });
        await AdvertisementService.addAvailabilitySlots(
          createdAdvertisement.id,
          slots
        );
      }

      // Save up to 3 locations (primary + up to 2 extras)
      const allLocations = [formData.location.city, ...extraLocations]
        .map((x) => x.trim())
        .filter((x) => x.length > 0)
        .slice(0, 3);
      if (allLocations.length > 0) {
        await AdvertisementService.addLocations(
          createdAdvertisement.id,
          allLocations
        );
      }

      window.location.href = "/profile";
    } catch (error) {
      console.error("Error creating advertisement:", error);
      setError(t("adCreate.errorGeneral"));
    } finally {
      setIsSubmitting(false);
    }
  };

  const titlePlaceholder = isParent
    ? t("adCreate.titlePlaceholderParent")
    : t("adCreate.titlePlaceholderNanny");
  const priceLabel = isParent
    ? t("adCreate.budgetPerHour")
    : t("adCreate.pricePerHour");
  const experienceLabel = isParent
    ? t("adCreate.requirementsPreferences")
    : t("adCreate.experienceBackground");
  const descriptionLabel = isParent
    ? t("adCreate.jobDescription")
    : t("adCreate.serviceDescription");


  // Prevent flash of form for unauthenticated users — show nothing until auth resolves
  if (isLoading || !user) return null;

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {/* Header */}
        <div className="px-8 py-7 border-b border-gray-100 bg-gradient-to-r from-purple-50 to-indigo-50/50">
          <h1 className="text-2xl font-bold text-gray-900">
            {t("adCreate.title")}
          </h1>
          <p className="text-gray-500 mt-1 text-sm">{t("adCreate.subtitle")}</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-8 space-y-8">
          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {isParent ? t("adCreate.careNeeded") : t("adCreate.serviceType")}
              </label>
              <select
                value={formData.type}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    type: e.target.value as "short-term" | "long-term",
                  }))
                }
                className="w-full h-[50px] px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white"
              >
                <option value="short-term">
                  {isParent ? t("adCreate.shortTermNeed") : t("adCreate.shortTermCare")}
                </option>
                <option value="long-term">
                  {isParent ? t("adCreate.longTermNeed") : t("adCreate.longTermCare")}
                </option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t("adCreate.adTitle")}
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => {
                  const value = e.target.value;
                  if (value.length <= 100) {
                    setFormData((prev) => ({ ...prev, title: value }));
                  }
                }}
                placeholder={titlePlaceholder}
                minLength={6}
                maxLength={100}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                required
              />
              <p className="text-xs text-gray-500 mt-1">
                {formData.title.length}/100 {formData.title.length < 6 && (
                  <span className="text-red-500">
                    ({t("adCreate.minCharacters")})
                  </span>
                )}
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {priceLabel}
              </label>
              <input
                type="text"
                inputMode="decimal"
                value={formData.pricePerHour === 0 ? "" : formData.pricePerHour}
                onChange={(e) => {
                  const value = e.target.value;
                  // Only allow numbers and one decimal point
                  if (value === "" || /^\d*\.?\d*$/.test(value)) {
                    const numValue = value === "" ? 0 : parseFloat(value);
                    if (value === "" || (numValue >= 0 && numValue <= 10000)) {
                      setFormData((prev) => ({
                        ...prev,
                        pricePerHour: numValue,
                      }));
                    }
                  }
                }}
                placeholder="25"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                required
              />
              <p className="text-xs text-gray-500 mt-1">
                {formData.pricePerHour > 0 ? `€${formData.pricePerHour.toFixed(2)}` : t("adCreate.enterPrice")}
              </p>
            </div>
          </div>

          {/* Availability (hidden for long-term) */}
          {formData.type === "short-term" && (
            <div>
              <h2 className="text-base font-semibold text-gray-900 mb-4 flex items-center gap-2 after:flex-1 after:h-px after:bg-gray-100">
                {t("adCreate.availabilitySchedule")}
              </h2>
              <p className="text-sm text-gray-600 mb-4">
                {t("adCreate.selectDatesAndTimes")} ({t("adCreate.max5Dates")})
              </p>
              <div className="mt-4">
                <MultiDatePicker
                  selectedDates={formData.availability.dates}
                  onChange={(dates) => {
                    // Limit to 5 dates
                    const limitedDates = dates.slice(0, 5);
                    setFormData((prev) => ({
                      ...prev,
                      availability: { ...prev.availability, dates: limitedDates },
                    }));
                    // Remove times for dates that were removed
                    if (limitedDates.length < dates.length) {
                      const limitedKeys = new Set(
                        limitedDates.map((d) => {
                          const key = `${d.getFullYear()}-${String(
                            d.getMonth() + 1
                          ).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
                          return key;
                        })
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
                  perDateTimes={perDateTimes}
                  defaultStartTime={formData.availability.startTime}
                  defaultEndTime={formData.availability.endTime}
                  onUpdateDateTime={(date, start, end) => {
                    const key = `${date.getFullYear()}-${String(
                      date.getMonth() + 1
                    ).padStart(2, "0")}-${String(date.getDate()).padStart(
                      2,
                      "0"
                    )}`;
                    setPerDateTimes((prev) => ({
                      ...prev,
                      [key]: { start, end },
                    }));
                  }}
                  onRemoveDate={(date) => {
                    const key = `${date.getFullYear()}-${String(
                      date.getMonth() + 1
                    ).padStart(2, "0")}-${String(date.getDate()).padStart(
                      2,
                      "0"
                    )}`;
                    setPerDateTimes((prev) => {
                      const n = { ...prev } as any;
                      delete n[key];
                      return n;
                    });
                  }}
                  hideTip
                />

                {/* Selected Dates with Editable Times */}
                {formData.availability.dates.length > 0 && (
                  <div className="mt-4 space-y-1.5">
                    <div className="text-xs font-medium text-gray-700 mb-2">
                      {t("adCreate.selectedDates")} ({formData.availability.dates.length}/5)
                    </div>
                    {formData.availability.dates
                      .sort((a, b) => a.getTime() - b.getTime())
                      .map((date) => {
                        const key = `${date.getFullYear()}-${String(
                          date.getMonth() + 1
                        ).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
                        const times = perDateTimes[key] || {
                          start: formData.availability.startTime,
                          end: formData.availability.endTime,
                        };
                        return (
                          <div
                            key={key}
                            className="flex items-center justify-between bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 hover:bg-gray-100 transition-colors"
                          >
                            <div className="flex items-center gap-3 flex-1 min-w-0">
                              <div className="text-sm font-medium text-gray-900 whitespace-nowrap">
                                {formatDateDDMMYYYY(date)}
                              </div>
                              <div className="flex items-center gap-1">
                                <input
                                  type="time"
                                  value={times.start}
                                  onChange={(e) => {
                                    setPerDateTimes((prev) => ({
                                      ...prev,
                                      [key]: { ...times, start: e.target.value },
                                    }));
                                  }}
                                  className="px-1.5 py-0.5 border border-gray-300 rounded text-xs font-mono bg-white focus:ring-1 focus:ring-purple-500 focus:border-purple-500"
                                />
                                <span className="text-xs text-gray-400">-</span>
                                <input
                                  type="time"
                                  value={times.end}
                                  onChange={(e) => {
                                    setPerDateTimes((prev) => ({
                                      ...prev,
                                      [key]: { ...times, end: e.target.value },
                                    }));
                                  }}
                                  className="px-1.5 py-0.5 border border-gray-300 rounded text-xs font-mono bg-white focus:ring-1 focus:ring-purple-500 focus:border-purple-500"
                                />
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => {
                                // Remove this date
                                const newDates = formData.availability.dates.filter(
                                  (d) => {
                                    const dKey = `${d.getFullYear()}-${String(
                                      d.getMonth() + 1
                                    ).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
                                    return dKey !== key;
                                  }
                                );
                                setFormData((prev) => ({
                                  ...prev,
                                  availability: { ...prev.availability, dates: newDates },
                                }));
                                // Remove from perDateTimes
                                setPerDateTimes((prev) => {
                                  const n = { ...prev };
                                  delete n[key];
                                  return n;
                                });
                              }}
                              className="ml-2 text-gray-400 hover:text-red-600 transition-colors p-1 rounded"
                              title={t("adCreate.removeDate")}
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
                          </div>
                        );
                      })}
                    {formData.availability.dates.length >= 5 && (
                      <div className="text-xs text-amber-600 mt-2">
                        {t("adCreate.maxReached")}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Location */}
          <div>
            <h2 className="text-base font-semibold text-gray-900 mb-4 flex items-center gap-2 after:flex-1 after:h-px after:bg-gray-100">
              {t("adCreate.location")}
            </h2>
            <div className="grid grid-cols-1 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t("adCreate.primaryLocation")} <span className="text-red-500">*</span>
                </label>
                <div className={locationError ? "ring-2 ring-red-400 rounded-lg" : ""}>
                  <LocationAutocomplete
                    value={formData.location.city}
                    onChange={(next) => {
                      setLocationError(false);
                      setFormData((prev) => ({
                        ...prev,
                        location: {
                          ...prev.location,
                          city: next.label,
                          address: "",
                          zipCode: "",
                        },
                      }));
                    }}
                    placeholder={t("adCreate.placeholderSearch")}
                  />
                </div>
                {locationError && (
                  <p className="text-xs text-red-500 mt-1">{t("adCreate.errorSelectLocation")}</p>
                )}
              </div>
              {/* Extra locations (up to 2) */}
              {extraLocations.map((loc, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <div className="flex-1">
                    <LocationAutocomplete
                      value={loc}
                      onChange={(next) =>
                        setExtraLocations((prev) => {
                          const n = [...prev];
                          n[idx] = next.label;
                          return n;
                        })
                      }
                      placeholder={t("adCreate.additionalLocation")}
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      setExtraLocations((prev) =>
                        prev.filter((_, i) => i !== idx)
                      )
                    }
                    className="px-3 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50"
                    aria-label="Remove location"
                  >
                    {t("adCreate.remove")}
                  </button>
                </div>
              ))}
              {extraLocations.length < 2 && (
                <button
                  type="button"
                  onClick={() => setExtraLocations((prev) => [...prev, ""])}
                  className="mt-2 px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 text-sm"
                >
                  {t("adCreate.addAnotherLocation")}
                </button>
              )}
            </div>
          </div>

          {/* Skills */}
          <div>
            <h2 className="text-base font-semibold text-gray-900 mb-4 flex items-center gap-2 after:flex-1 after:h-px after:bg-gray-100">
              {isParent ? t("adCreate.requiredSkills") : t("adCreate.skills")}
            </h2>
            <p className="text-sm text-gray-600 mb-4">
              {isParent
                ? t("adCreate.selectRequiredSkills")
                : t("adCreate.selectYourSkills")}
            </p>
            <div className="flex flex-wrap gap-2">
              {availableSkills.map((skill) => {
                const selected = formData.skills.includes(skill);
                return (
                  <button
                    key={skill}
                    type="button"
                    onClick={() => handleSkillToggle(skill)}
                    className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-all duration-150 ${
                      selected
                        ? "bg-purple-600 text-white border-purple-600 shadow-sm"
                        : "bg-white text-gray-600 border-gray-200 hover:border-purple-300 hover:text-purple-700"
                    }`}
                  >
                    {getTranslatedSkill(skill, language)}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {descriptionLabel} <span className="text-red-500">*</span>
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => {
                const value = e.target.value;
                if (value.length <= 2000) {
                  setFormData((prev) => ({
                    ...prev,
                    description: value,
                  }));
                }
              }}
              rows={4}
              maxLength={2000}
              placeholder={
                isParent
                  ? t("adCreate.descriptionPlaceholderParent")
                  : t("adCreate.descriptionPlaceholderNanny")
              }
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              {formData.description.length}/2000 {t("adCreate.characters")}
            </p>
          </div>

          {/* Experience / Requirements (optional) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {experienceLabel}{" "}
              <span className="text-gray-400 font-normal">({t("common.optional")})</span>
            </label>
            <textarea
              value={formData.experience}
              onChange={(e) => {
                const value = e.target.value;
                if (value.length <= 1000) {
                  setFormData((prev) => ({ ...prev, experience: value }));
                }
              }}
              rows={4}
              maxLength={1000}
              placeholder={
                isParent
                  ? t("adCreate.experiencePlaceholderParent")
                  : t("adCreate.experiencePlaceholderNanny")
              }
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
            />
            <p className="text-xs text-gray-500 mt-1">
              {formData.experience.length}/1000 {t("adCreate.characters")}
            </p>
          </div>

          {/* Additional Information */}
          <div>
            {!showAdditionalInfo ? (
              <button
                type="button"
                onClick={() => setShowAdditionalInfo(true)}
                className="flex items-center gap-2 px-4 py-2 border border-dashed border-gray-300 rounded-lg text-sm text-gray-600 hover:bg-gray-50 hover:border-gray-400 transition-colors"
              >
                <span className="text-lg leading-none">+</span>
                {t("adCreate.additionalInfo")}
              </button>
            ) : (
              <>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t("adCreate.additionalInfo")}
                </label>
                <textarea
                  value={formData.additionalInfo}
                  onChange={(e) => {
                    const value = e.target.value;
                    if (value.length <= 500) {
                      setFormData((prev) => ({
                        ...prev,
                        additionalInfo: value,
                      }));
                    }
                  }}
                  rows={3}
                  maxLength={500}
                  placeholder={t("adCreate.additionalInfoPlaceholder")}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                  autoFocus
                />
                <p className="text-xs text-gray-500 mt-1">
                  {formData.additionalInfo.length}/500 {t("adCreate.characters")}
                </p>
              </>
            )}
          </div>

          {/* Error Message */}
          {error && (
            <div className="flex items-start gap-3 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
              <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
              </svg>
              {error}
            </div>
          )}

          {/* Submit Button */}
          <div className="flex justify-end space-x-4 pt-6">
            <button
              type="button"
              onClick={() => {
                if (window.history.length > 1) window.history.back();
                else window.location.href = "/profile";
              }}
              className="px-6 py-3 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50 transition-colors duration-200"
            >
              {t("adCreate.cancel")}
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-8 py-3 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 transition-colors duration-200 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>{t("adCreate.submitting")}</span>
                </>
              ) : (
                t("adCreate.submitAd")
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
