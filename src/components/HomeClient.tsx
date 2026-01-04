"use client";
import { useState, useEffect } from "react";
import SearchBar from "./SearchBar";
import Footer from "./Footer";
import SearchResults from "./SearchResults";
import { useTranslation } from "./LanguageProvider";

export default function HomeClient({
  initialLocation,
  initialStartDate,
  initialEndDate,
  initialShowResults,
}: {
  initialLocation?: string;
  initialStartDate?: Date | null;
  initialEndDate?: Date | null;
  initialShowResults?: boolean;
}) {
  const { t } = useTranslation();
  const [searchParams, setSearchParams] = useState({
    location: initialLocation || "Location",
    startDate: (initialStartDate as Date | null) || null,
    endDate: (initialEndDate as Date | null) || null,
  });
  const [showResults, setShowResults] = useState(() => {
    if (typeof window !== "undefined") {
      try {
        const forceHome = sessionStorage.getItem("nannybooking:forceHome");
        if (forceHome) return false;
      } catch {}
    }
    return !!initialShowResults;
  });

  useEffect(() => {
    try {
      if (typeof window !== "undefined") {
        const forceHome = sessionStorage.getItem("nannybooking:forceHome");
        if (forceHome) {
          // Reset search inputs and hide results when home is forced
          setSearchParams({
            location: "Location",
            startDate: null,
            endDate: null,
          });
          setShowResults(false);
          sessionStorage.removeItem("nannybooking:forceHome");
          // Explicitly broadcast the reset so nested components clear their own local state
          window.dispatchEvent(new CustomEvent("resetSearch"));
        }
      }
    } catch {}
  }, []);

  // Reset results when header logo is clicked
  useEffect(() => {
    const handler = () => setShowResults(false);
    if (typeof window !== "undefined") {
      window.addEventListener("resetSearch", handler);
    }
    return () => {
      if (typeof window !== "undefined") {
        window.removeEventListener("resetSearch", handler);
      }
    };
  }, []);

  const handleSearch = (
    location: string,
    startDate: Date | null,
    endDate: Date | null
  ) => {
    setSearchParams({ location, startDate, endDate });
    setShowResults(true);
  };

  return (
    <>
      {/* Search Bar - At Top */}
      <div className="bg-white border-b border-gray-200 shadow-lg">
        <SearchBar onSearch={handleSearch} />
      </div>
      {/* Main Content */}
      {!showResults ? (
        <main className="flex-1 px-4 sm:px-6 md:px-8 py-10 md:py-16">
          <div className="text-center max-w-6xl mx-auto">
            <h1 className="text-5xl md:text-7xl font-bold mb-8 text-gray-900 leading-tight">
              {t("home.heroTitle")}
              <span className="block text-purple-600">
                {t("home.heroSubtitle")}
              </span>
            </h1>
            <p className="text-xl md:text-2xl text-gray-600 max-w-4xl mx-auto leading-relaxed mb-12">
              {t("home.heroDescription")}
            </p>
            {/* Feature Cards */}
            <div className="grid md:grid-cols-3 gap-8 mb-16">
              <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300">
                <h3 className="text-xl font-semibold mb-4 text-gray-900">
                  {t("home.forParents")}
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  {t("home.forParentsDesc")}
                </p>
              </div>
              <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300">
                <h3 className="text-xl font-semibold mb-4 text-gray-900">
                  {t("home.forNannies")}
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  {t("home.forNanniesDesc")}
                </p>
              </div>
              <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300">
                <h3 className="text-xl font-semibold mb-4 text-gray-900">
                  {t("home.safeSecure")}
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  {t("home.safeSecureDesc")}
                </p>
              </div>
            </div>
            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
              <div className="text-center">
                <div className="text-3xl font-bold text-purple-600 mb-2">
                  500+
                </div>
                <div className="text-gray-600">{t("home.trustedNannies")}</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-purple-600 mb-2">
                  1,200+
                </div>
                <div className="text-gray-600">{t("home.happyFamilies")}</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-purple-600 mb-2">
                  98%
                </div>
                <div className="text-gray-600">{t("home.successRate")}</div>
              </div>
            </div>
          </div>
        </main>
      ) : (
        <SearchResults
          searchParams={searchParams}
          onBackToSearch={() => setShowResults(false)}
        />
      )}
      <Footer />
    </>
  );
}
