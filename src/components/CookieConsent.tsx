"use client";

import { useState, useEffect } from "react";
import { useTranslation } from "./LanguageProvider";

const COOKIE_KEY = "cookie_consent";

interface CookiePreferences {
  necessary: boolean;
  analytics: boolean;
  marketing: boolean;
}

export default function CookieConsent() {
  const { t } = useTranslation();
  const [visible, setVisible] = useState(false);
  const [showCustomize, setShowCustomize] = useState(false);
  const [preferences, setPreferences] = useState<CookiePreferences>({
    necessary: true,
    analytics: false,
    marketing: false,
  });

  useEffect(() => {
    try {
      const stored = localStorage.getItem(COOKIE_KEY);
      if (!stored) {
        setVisible(true);
      }
    } catch {
      setVisible(true);
    }
  }, []);

  const save = (prefs: CookiePreferences) => {
    try {
      localStorage.setItem(COOKIE_KEY, JSON.stringify(prefs));
    } catch {}
    setVisible(false);
  };

  const handleAllowAll = () => {
    save({ necessary: true, analytics: true, marketing: true });
  };

  const handleNecessaryOnly = () => {
    save({ necessary: true, analytics: false, marketing: false });
  };

  const handleSavePreferences = () => {
    save(preferences);
  };

  if (!visible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[9999] p-4 md:p-6">
      <div className="max-w-lg mx-auto bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden">
        {!showCustomize ? (
          <div className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {t("cookie.title")}
            </h3>
            <p className="text-sm text-gray-600 mb-5">
              {t("cookie.description")}
            </p>
            <div className="flex flex-col sm:flex-row gap-2">
              <button
                onClick={handleAllowAll}
                className="flex-1 px-4 py-2.5 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 transition-colors text-sm"
              >
                {t("cookie.allowAll")}
              </button>
              <button
                onClick={handleNecessaryOnly}
                className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors text-sm"
              >
                {t("cookie.necessaryOnly")}
              </button>
              <button
                onClick={() => setShowCustomize(true)}
                className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors text-sm"
              >
                {t("cookie.customize")}
              </button>
            </div>
          </div>
        ) : (
          <div className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              {t("cookie.customize")}
            </h3>
            <div className="space-y-4 mb-5">
              {/* Necessary - always on */}
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-sm font-medium text-gray-900">
                    {t("cookie.necessary")}
                  </div>
                  <div className="text-xs text-gray-500 mt-0.5">
                    {t("cookie.necessaryDesc")}
                  </div>
                </div>
                <div className="relative flex-shrink-0">
                  <div className="w-10 h-6 bg-purple-600 rounded-full opacity-60 cursor-not-allowed">
                    <div className="absolute top-1 right-1 w-4 h-4 bg-white rounded-full" />
                  </div>
                </div>
              </div>

              {/* Analytics */}
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-sm font-medium text-gray-900">
                    {t("cookie.analytics")}
                  </div>
                  <div className="text-xs text-gray-500 mt-0.5">
                    {t("cookie.analyticsDesc")}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    setPreferences((p) => ({ ...p, analytics: !p.analytics }))
                  }
                  className={`relative flex-shrink-0 w-10 h-6 rounded-full transition-colors ${
                    preferences.analytics ? "bg-purple-600" : "bg-gray-300"
                  }`}
                >
                  <div
                    className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
                      preferences.analytics ? "right-1" : "left-1"
                    }`}
                  />
                </button>
              </div>

              {/* Marketing */}
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-sm font-medium text-gray-900">
                    {t("cookie.marketing")}
                  </div>
                  <div className="text-xs text-gray-500 mt-0.5">
                    {t("cookie.marketingDesc")}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    setPreferences((p) => ({ ...p, marketing: !p.marketing }))
                  }
                  className={`relative flex-shrink-0 w-10 h-6 rounded-full transition-colors ${
                    preferences.marketing ? "bg-purple-600" : "bg-gray-300"
                  }`}
                >
                  <div
                    className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
                      preferences.marketing ? "right-1" : "left-1"
                    }`}
                  />
                </button>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setShowCustomize(false)}
                className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors text-sm"
              >
                {t("common.back")}
              </button>
              <button
                onClick={handleSavePreferences}
                className="flex-1 px-4 py-2.5 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 transition-colors text-sm"
              >
                {t("cookie.savePreferences")}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
