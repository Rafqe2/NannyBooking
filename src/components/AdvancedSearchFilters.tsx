"use client";

import { useState, useEffect } from "react";
import { NANNY_SKILLS, getTranslatedSkill } from "../lib/constants/skills";
import { useTranslation } from "./LanguageProvider";

export interface AdvancedFilters {
  priceMin: number | null;
  priceMax: number | null;
  skills: string[];
  minRating: number | null;
  experienceYears: number | null;
  hasReviews: boolean;
  verifiedOnly: boolean;
}

interface AdvancedSearchFiltersProps {
  filters: AdvancedFilters;
  onChange: (filters: AdvancedFilters) => void;
  onApply: () => void;
  onReset: () => void;
}

export const DEFAULT_FILTERS: AdvancedFilters = {
  priceMin: null,
  priceMax: null,
  skills: [],
  minRating: null,
  experienceYears: null,
  hasReviews: false,
  verifiedOnly: false,
};

export default function AdvancedSearchFilters({
  filters,
  onChange,
  onApply,
  onReset,
}: AdvancedSearchFiltersProps) {
  const { t, language } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [localFilters, setLocalFilters] = useState<AdvancedFilters>(filters);

  useEffect(() => {
    setLocalFilters(filters);
  }, [filters]);

  const handleLocalChange = (key: keyof AdvancedFilters, value: any) => {
    setLocalFilters((prev) => ({ ...prev, [key]: value }));
  };

  const handleSkillToggle = (skill: string) => {
    setLocalFilters((prev) => ({
      ...prev,
      skills: prev.skills.includes(skill)
        ? prev.skills.filter((s) => s !== skill)
        : [...prev.skills, skill],
    }));
  };

  const handleApply = () => {
    onChange(localFilters);
    onApply();
    setIsOpen(false);
  };

  const handleReset = () => {
    setLocalFilters(DEFAULT_FILTERS);
    onChange(DEFAULT_FILTERS);
    onReset();
  };

  const activeFiltersCount = () => {
    let count = 0;
    if (filters.priceMin !== null || filters.priceMax !== null) count++;
    if (filters.skills.length > 0) count++;
    if (filters.minRating !== null) count++;
    if (filters.experienceYears !== null) count++;
    if (filters.hasReviews) count++;
    if (filters.verifiedOnly) count++;
    return count;
  };

  const count = activeFiltersCount();

  return (
    <div className="relative">
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors shadow-sm relative"
      >
        <svg
          className="w-5 h-5 text-gray-600"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"
          />
        </svg>
        <span className="font-medium text-gray-700">{t("search.filters")}</span>
        {count > 0 && (
          <span className="absolute -top-2 -right-2 bg-purple-600 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center">
            {count}
          </span>
        )}
      </button>

      {/* Filters Panel */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/20 z-40"
            onClick={() => setIsOpen(false)}
          />

          {/* Panel */}
          <div className="absolute top-full right-0 mt-2 w-96 bg-white rounded-2xl shadow-2xl border border-gray-200 z-50 max-h-[80vh] overflow-hidden flex flex-col">
            {/* Header */}
            <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-purple-50 to-purple-100">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-gray-900">
                  {t("search.advancedFilters")}
                </h3>
                <button
                  onClick={() => setIsOpen(false)}
                  className="text-gray-500 hover:text-gray-700 transition-colors"
                >
                  <svg
                    className="w-5 h-5"
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
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-5">
              {/* Price Range - Stacked */}
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-3">
                  💰 {t("search.priceRange")}
                </label>
                <div className="space-y-2">
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">
                      {t("search.min")}
                    </label>
                    <input
                      type="number"
                      value={localFilters.priceMin ?? ""}
                      onChange={(e) =>
                        handleLocalChange(
                          "priceMin",
                          e.target.value ? Number(e.target.value) : null
                        )
                      }
                      placeholder="0"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      min="0"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">
                      {t("search.max")}
                    </label>
                    <input
                      type="number"
                      value={localFilters.priceMax ?? ""}
                      onChange={(e) =>
                        handleLocalChange(
                          "priceMax",
                          e.target.value ? Number(e.target.value) : null
                        )
                      }
                      placeholder="100"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      min="0"
                    />
                  </div>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  {t("search.perHour")}
                </p>
              </div>

              {/* Minimum Rating */}
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-3">
                  ⭐ {t("search.minimumRating")}
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {[0, 3, 4, 5].map((rating) => (
                    <button
                      key={rating}
                      onClick={() =>
                        handleLocalChange(
                          "minRating",
                          localFilters.minRating === rating ? null : rating
                        )
                      }
                      className={`px-3 py-2 rounded-lg border-2 transition-all text-sm whitespace-nowrap ${
                        localFilters.minRating === rating
                          ? "border-purple-600 bg-purple-50 text-purple-700 font-semibold"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      {rating === 0 ? t("search.any") : `${rating}+★`}
                    </button>
                  ))}
                </div>
              </div>

              {/* Skills */}
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-3">
                  🎯 {t("search.skills")}
                </label>
                <div className="flex flex-wrap gap-2">
                  {NANNY_SKILLS.map((skill) => (
                    <button
                      key={skill}
                      onClick={() => handleSkillToggle(skill)}
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
                        localFilters.skills.includes(skill)
                          ? "bg-purple-600 text-white shadow-md"
                          : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                      }`}
                    >
                      {getTranslatedSkill(skill, language)}
                    </button>
                  ))}
                </div>
                {localFilters.skills.length > 0 && (
                  <p className="text-xs text-purple-600 mt-2 font-medium">
                    {t("search.skillsSelected", {
                      count: localFilters.skills.length,
                    })}
                  </p>
                )}
              </div>

              {/* Experience Years */}
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-3">
                  📚 {t("search.minimumExperience")}
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {[null, 1, 3, 5].map((years) => (
                    <button
                      key={years ?? "any"}
                      onClick={() =>
                        handleLocalChange("experienceYears", years)
                      }
                      className={`px-3 py-2 rounded-lg border-2 transition-all text-sm whitespace-nowrap ${
                        localFilters.experienceYears === years
                          ? "border-purple-600 bg-purple-50 text-purple-700 font-semibold"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      {years === null
                        ? t("search.any")
                        : `${years}+ ${t("search.years")}`}
                    </button>
                  ))}
                </div>
              </div>

              {/* Boolean Filters */}
              <div className="space-y-3 pb-2">
                <label className="flex items-center gap-3 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={localFilters.hasReviews}
                    onChange={(e) =>
                      handleLocalChange("hasReviews", e.target.checked)
                    }
                    className="w-5 h-5 text-purple-600 border-gray-300 rounded focus:ring-2 focus:ring-purple-500"
                  />
                  <span className="text-sm font-medium text-gray-700 group-hover:text-gray-900">
                    {t("search.hasReviews")}
                  </span>
                </label>

                <label className="flex items-center gap-3 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={localFilters.verifiedOnly}
                    onChange={(e) =>
                      handleLocalChange("verifiedOnly", e.target.checked)
                    }
                    className="w-5 h-5 text-purple-600 border-gray-300 rounded focus:ring-2 focus:ring-purple-500"
                  />
                  <span className="text-sm font-medium text-gray-700 group-hover:text-gray-900">
                    ✓ {t("search.verifiedOnly")}
                  </span>
                </label>
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex gap-3">
              <button
                onClick={handleReset}
                className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-white transition-colors"
              >
                {t("search.resetFilters")}
              </button>
              <button
                onClick={handleApply}
                className="flex-1 px-4 py-2.5 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 transition-colors shadow-md"
              >
                {t("search.applyFilters")}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
