"use client";

import { useState, useEffect } from "react";
import { Review, ReviewService, RatingStats } from "../lib/reviewService";
import { useTranslation } from "./LanguageProvider";
import { useSupabaseUser } from "../lib/useSupabaseUser";

interface ReviewsListProps {
  userId: string;
  showStats?: boolean;
}

export default function ReviewsList({
  userId,
  showStats = true,
}: ReviewsListProps) {
  const { t, language } = useTranslation();
  const { user } = useSupabaseUser();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [stats, setStats] = useState<RatingStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [helpfulStatus, setHelpfulStatus] = useState<
    Record<string, boolean | null>
  >({});
  const [respondingTo, setRespondingTo] = useState<string | null>(null);
  const [responseText, setResponseText] = useState("");
  const [reportingReview, setReportingReview] = useState<string | null>(null);
  const reviewsPerPage = 10;

  useEffect(() => {
    loadReviews();
    if (showStats) {
      loadStats();
    }
  }, [userId, page]);

  const loadReviews = async () => {
    setLoading(true);
    const data = await ReviewService.getUserReviews(userId, {
      limit: reviewsPerPage,
      offset: (page - 1) * reviewsPerPage,
    });
    setReviews(data);
    setHasMore(data.length === reviewsPerPage);

    // Load helpfulness status for each review
    if (user) {
      const statuses: Record<string, boolean | null> = {};
      for (const review of data) {
        const status = await ReviewService.getUserHelpfulnessStatus(review.id);
        statuses[review.id] = status;
      }
      setHelpfulStatus(statuses);
    }

    setLoading(false);
  };

  const loadStats = async () => {
    const data = await ReviewService.getUserRatingStats(userId);
    setStats(data);
  };

  const handleHelpful = async (reviewId: string, isHelpful: boolean) => {
    const success = await ReviewService.markReviewHelpful(reviewId, isHelpful);
    if (success) {
      // Reload reviews to get updated counts
      loadReviews();
    }
  };

  const handleRespond = async (reviewId: string) => {
    if (!responseText.trim()) return;

    const result = await ReviewService.respondToReview(
      reviewId,
      responseText.trim()
    );
    if (result.success) {
      setRespondingTo(null);
      setResponseText("");
      loadReviews();
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const locale =
      language === "lv" ? "lv-LV" : language === "ru" ? "ru-RU" : "en-US";
    return date.toLocaleDateString(locale, {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const renderStars = (rating: number) => {
    return (
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <svg
            key={star}
            className={`w-5 h-5 ${
              star <= rating
                ? "text-yellow-400 fill-yellow-400"
                : "text-gray-300"
            }`}
            fill={star <= rating ? "currentColor" : "none"}
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
            />
          </svg>
        ))}
      </div>
    );
  };

  if (loading && page === 1) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Rating Statistics */}
      {showStats && stats && stats.total_reviews > 0 && (
        <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-2xl p-6 border border-purple-200">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Average Rating */}
            <div className="text-center md:text-left">
              <div className="flex items-center justify-center md:justify-start gap-3 mb-2">
                <span className="text-5xl font-bold text-purple-900">
                  {stats.average_rating.toFixed(1)}
                </span>
                <div>
                  {renderStars(Math.round(stats.average_rating))}
                  <p className="text-sm text-purple-700 mt-1">
                    {t("review.basedOn", { count: stats.total_reviews })}
                  </p>
                </div>
              </div>
            </div>

            {/* Rating Breakdown */}
            <div className="space-y-2">
              {[5, 4, 3, 2, 1].map((rating) => {
                const count =
                  stats.rating_breakdown[
                    rating.toString() as keyof typeof stats.rating_breakdown
                  ];
                const percentage =
                  stats.total_reviews > 0
                    ? (count / stats.total_reviews) * 100
                    : 0;

                return (
                  <div key={rating} className="flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-700 w-8">
                      {rating}★
                    </span>
                    <div className="flex-1 bg-white rounded-full h-2 overflow-hidden">
                      <div
                        className="bg-purple-600 h-full transition-all duration-300"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                    <span className="text-sm text-gray-600 w-12 text-right">
                      {count}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Reviews List */}
      {reviews.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-2xl border border-gray-200">
          <div className="text-6xl mb-4">⭐</div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            {t("review.noReviews")}
          </h3>
          <p className="text-gray-600">{t("review.noReviewsDesc")}</p>
        </div>
      ) : (
        <div className="space-y-4">
          {reviews.map((review) => (
            <div
              key={review.id}
              className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg transition-shadow"
            >
              {/* Review Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-start gap-3">
                  {/* Avatar */}
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-400 to-purple-600 flex items-center justify-center text-white font-semibold flex-shrink-0">
                    {review.reviewer_picture ? (
                      <img
                        src={review.reviewer_picture}
                        alt={review.reviewer_name || "Reviewer"}
                        className="w-full h-full rounded-full object-cover"
                      />
                    ) : (
                      <span className="text-lg">
                        {(review.reviewer_name || "?").charAt(0).toUpperCase()}
                      </span>
                    )}
                  </div>

                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-semibold text-gray-900">
                        {review.reviewer_name || t("review.anonymous")}
                      </h4>
                      {review.is_verified && (
                        <span
                          className="bg-green-100 text-green-700 text-xs px-2 py-0.5 rounded-full font-medium"
                          title={t("review.verifiedBooking")}
                        >
                          ✓ {t("review.verified")}
                        </span>
                      )}
                    </div>
                    {renderStars(review.rating)}
                    <p className="text-sm text-gray-500 mt-1">
                      {formatDate(review.created_at)}
                    </p>
                  </div>
                </div>

                {/* Report Button */}
                {user && user.id !== review.reviewer_id && (
                  <button
                    onClick={() => setReportingReview(review.id)}
                    className="text-gray-400 hover:text-red-500 transition-colors"
                    title={t("review.report")}
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
                        d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9"
                      />
                    </svg>
                  </button>
                )}
              </div>

              {/* Review Title */}
              {review.title && (
                <h5 className="font-semibold text-gray-900 mb-2">
                  {review.title}
                </h5>
              )}

              {/* Review Content */}
              <p className="text-gray-700 leading-relaxed mb-4 whitespace-pre-wrap">
                {review.comment}
              </p>

              {/* Response */}
              {review.response && (
                <div className="bg-gray-50 border-l-4 border-purple-500 rounded-r-lg p-4 mt-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-sm font-semibold text-gray-900">
                      {t("review.responseFromOwner")}
                    </span>
                    <span className="text-xs text-gray-500">
                      {review.response_date && formatDate(review.response_date)}
                    </span>
                  </div>
                  <p className="text-gray-700 text-sm leading-relaxed whitespace-pre-wrap">
                    {review.response}
                  </p>
                </div>
              )}

              {/* Response Input (if reviewee) */}
              {user &&
                user.id === userId &&
                !review.response &&
                respondingTo === review.id && (
                  <div className="mt-4 space-y-2">
                    <textarea
                      value={responseText}
                      onChange={(e) => setResponseText(e.target.value)}
                      placeholder={t("review.responsePlaceholder")}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                    />
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => {
                          setRespondingTo(null);
                          setResponseText("");
                        }}
                        className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                      >
                        {t("common.cancel")}
                      </button>
                      <button
                        onClick={() => handleRespond(review.id)}
                        disabled={!responseText.trim()}
                        className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {t("review.postResponse")}
                      </button>
                    </div>
                  </div>
                )}

              {/* Footer Actions */}
              <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-200">
                {/* Helpful Buttons */}
                {user && user.id !== review.reviewer_id && (
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-gray-600">
                      {t("review.wasThisHelpful")}
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleHelpful(review.id, true)}
                        className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                          helpfulStatus[review.id] === true
                            ? "bg-green-100 text-green-700"
                            : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                        }`}
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
                            d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5"
                          />
                        </svg>
                        {review.helpful_count || 0}
                      </button>
                      <button
                        onClick={() => handleHelpful(review.id, false)}
                        className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                          helpfulStatus[review.id] === false
                            ? "bg-red-100 text-red-700"
                            : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                        }`}
                      >
                        <svg
                          className="w-4 h-4 transform rotate-180"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5"
                          />
                        </svg>
                      </button>
                    </div>
                  </div>
                )}

                {/* Respond Button (if reviewee) */}
                {user &&
                  user.id === userId &&
                  !review.response &&
                  respondingTo !== review.id && (
                    <button
                      onClick={() => setRespondingTo(review.id)}
                      className="text-sm text-purple-600 font-medium hover:text-purple-700 transition-colors"
                    >
                      {t("review.respond")}
                    </button>
                  )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {reviews.length > 0 && (
        <div className="flex justify-center gap-2 pt-4">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-4 py-2 border border-gray-300 rounded-lg font-medium hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {t("common.previous")}
          </button>
          <span className="px-4 py-2 text-gray-700">
            {t("common.page")} {page}
          </span>
          <button
            onClick={() => setPage((p) => p + 1)}
            disabled={!hasMore}
            className="px-4 py-2 border border-gray-300 rounded-lg font-medium hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {t("common.next")}
          </button>
        </div>
      )}
    </div>
  );
}
