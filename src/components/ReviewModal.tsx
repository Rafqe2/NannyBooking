"use client";

import { useState } from "react";
import { ReviewService } from "../lib/reviewService";
import { useTranslation } from "./LanguageProvider";

interface ReviewModalProps {
  bookingId: string;
  advertisementId: string;
  revieweeId: string;
  revieweeName: string;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function ReviewModal({
  bookingId,
  advertisementId,
  revieweeId,
  revieweeName,
  onClose,
  onSuccess,
}: ReviewModalProps) {
  const { t } = useTranslation();
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [title, setTitle] = useState("");
  const [comment, setComment] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (rating === 0) {
      setError(t("review.errorSelectRating"));
      return;
    }

    if (comment.trim().length < 10) {
      setError(t("review.errorCommentTooShort"));
      return;
    }

    setSaving(true);
    setError(null);

    const result = await ReviewService.createReview({
      bookingId,
      advertisementId,
      revieweeId,
      rating,
      title: title.trim() || undefined,
      comment: comment.trim(),
    });

    setSaving(false);

    if (result.success) {
      onSuccess?.();
      onClose();
    } else {
      setError(result.error || t("review.errorCreateFailed"));
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white w-full max-w-2xl rounded-2xl shadow-2xl border border-gray-200 overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between bg-gradient-to-r from-purple-50 to-purple-100">
          <div>
            <h3 className="text-xl font-bold text-gray-900">
              {t("review.writeReview")}
            </h3>
            <p className="text-sm text-gray-600 mt-1">
              {t("review.reviewFor")}{" "}
              <span className="font-medium">{revieweeName}</span>
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 transition-colors"
          >
            <svg
              className="w-6 h-6"
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

        {/* Content */}
        <div className="px-6 py-6 space-y-6 max-h-[70vh] overflow-y-auto">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          {/* Rating Section */}
          <div className="space-y-3">
            <label className="block text-sm font-semibold text-gray-900">
              {t("review.rating")} <span className="text-red-500">*</span>
            </label>
            <div className="flex items-center gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoveredRating(star)}
                  onMouseLeave={() => setHoveredRating(0)}
                  className="transition-transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 rounded"
                >
                  <svg
                    className={`w-10 h-10 transition-colors ${
                      star <= (hoveredRating || rating)
                        ? "text-yellow-400 fill-yellow-400"
                        : "text-gray-300"
                    }`}
                    fill={
                      star <= (hoveredRating || rating)
                        ? "currentColor"
                        : "none"
                    }
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
                </button>
              ))}
              {rating > 0 && (
                <span className="ml-3 text-lg font-semibold text-gray-700">
                  {rating === 5 && "⭐ " + t("review.excellent")}
                  {rating === 4 && "😊 " + t("review.veryGood")}
                  {rating === 3 && "🙂 " + t("review.good")}
                  {rating === 2 && "😕 " + t("review.fair")}
                  {rating === 1 && "😞 " + t("review.poor")}
                </span>
              )}
            </div>
          </div>

          {/* Title (Optional) */}
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-gray-900">
              {t("review.title")}{" "}
              <span className="text-gray-500 font-normal">
                ({t("common.optional")})
              </span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={t("review.titlePlaceholder")}
              maxLength={100}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-shadow"
            />
            <p className="text-xs text-gray-500">{title.length}/100</p>
          </div>

          {/* Comment */}
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-gray-900">
              {t("review.comment")} <span className="text-red-500">*</span>
            </label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder={t("review.commentPlaceholder")}
              rows={6}
              maxLength={1000}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-shadow resize-none"
            />
            <div className="flex justify-between items-center">
              <p className="text-xs text-gray-500">
                {t("review.minCharacters", { min: 10 })}
              </p>
              <p className="text-xs text-gray-500">{comment.length}/1000</p>
            </div>
          </div>

          {/* Tips */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="text-sm font-semibold text-blue-900 mb-2">
              💡 {t("review.tips")}
            </h4>
            <ul className="text-xs text-blue-800 space-y-1">
              <li>• {t("review.tip1")}</li>
              <li>• {t("review.tip2")}</li>
              <li>• {t("review.tip3")}</li>
            </ul>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-3 bg-gray-50">
          <button
            onClick={onClose}
            disabled={saving}
            className="px-6 py-2.5 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {t("common.cancel")}
          </button>
          <button
            onClick={handleSubmit}
            disabled={saving || rating === 0 || comment.trim().length < 10}
            className="px-6 py-2.5 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {saving ? (
              <>
                <svg
                  className="animate-spin h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                {t("review.submitting")}
              </>
            ) : (
              t("review.submitReview")
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
