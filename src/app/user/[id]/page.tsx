"use client";

import { use as useUnwrap, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Header from "../../../components/Header";
import Footer from "../../../components/Footer";
import BlockingLoader from "../../../components/BlockingLoader";
import ReviewsList from "../../../components/ReviewsList";
import { useTranslation } from "../../../components/LanguageProvider";
import { stripLatvianGada } from "../../../lib/date";

export default function UserProfile({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = useUnwrap(params);
  const router = useRouter();
  const { t, language } = useTranslation();
  const [profile, setProfile] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const run = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/user/${id}`).then((r) => r.json());
        if (!res || res.error) throw new Error(res?.error || "Failed to load");
        setProfile(res);
      } catch (e: any) {
        setError(e?.message || "Failed to load profile");
      } finally {
        setLoading(false);
      }
    };
    run();
  }, [id]);

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-gray-50 to-gray-100">
      <Header />
      <main className="flex-1 px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <button
            onClick={() => router.back()}
            className="mb-4 inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            {t("common.goBack")}
          </button>
          {loading ? (
            <BlockingLoader message={t("profile.loadingProfile")} />
          ) : error || !profile ? (
            <div className="bg-white border border-gray-200 p-8 rounded-2xl text-center">
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                {t("profile.notFound")}
              </h2>
              <p className="text-gray-600">
                {error || t("profile.userDoesNotExist")}
              </p>
            </div>
          ) : (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="px-8 py-8 bg-gradient-to-r from-purple-600 to-purple-700 text-white flex items-center gap-6">
                <div className="w-20 h-20 rounded-full overflow-hidden bg-white/20 flex items-center justify-center text-2xl font-bold">
                  {profile.picture ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={profile.picture}
                      alt={profile.full_name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    (profile.full_name || "?").charAt(0).toUpperCase()
                  )}
                </div>
                <div>
                  <h1 className="text-3xl font-bold">{profile.full_name}</h1>
                  <div className="mt-2 text-purple-100 text-sm flex items-center gap-4">
                    <span>
                      👤{" "}
                      {profile.user_type === "nanny"
                        ? t("common.nanny")
                        : profile.user_type === "parent"
                        ? t("common.parent")
                        : t("common.user")}
                    </span>
                    {profile.member_since && (
                      <span>
                        {t("ad.joined")}{" "}
                        {stripLatvianGada(new Date(profile.member_since).toLocaleDateString(
                          language === "lv" ? "lv-LV" : language === "ru" ? "ru-RU" : "en-US",
                          { year: "numeric", month: "short" }
                        ))}
                      </span>
                    )}
                    {typeof profile.rating === "number" && (
                      <span>
                        ⭐ {Number(profile.rating).toFixed(1)} (
                        {profile.reviews_count || 0})
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="p-8">
                <h2 className="text-xl font-semibold text-gray-900 mb-3">
                  {t("profile.about")}
                </h2>
                <p className="text-gray-700 whitespace-pre-wrap">
                  {profile.bio || t("profile.noBioProvided")}
                </p>
              </div>

              {/* Reviews Section */}
              <div className="px-8 pb-8 border-t border-gray-200 pt-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">
                  {t("review.reviews")}
                </h2>
                <ReviewsList userId={id} showStats={true} />
              </div>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
