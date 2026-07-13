"use client";

import { useState } from "react";
import { supabase } from "../lib/supabase";
import { useTranslation } from "./LanguageProvider";
import { useEscapeKey } from "../lib/useEscapeKey";

interface ReportModalProps {
  reportedType: "user" | "ad";
  reportedId: string;
  onClose: () => void;
}

const USER_REASONS = [
  "inappropriate_behavior",
  "harassment",
  "fake_profile",
  "spam",
  "other",
] as const;

const AD_REASONS = [
  "inappropriate_content",
  "misleading_info",
  "fake_listing",
  "spam",
  "other",
] as const;

export default function ReportModal({ reportedType, reportedId, onClose }: ReportModalProps) {
  const { t } = useTranslation();
  useEscapeKey(onClose);
  const [reason, setReason] = useState("");
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reasons = reportedType === "user" ? USER_REASONS : AD_REASONS;

  const handleSubmit = async () => {
    if (!reason) { setError(t("report.selectReason")); return; }
    setSubmitting(true);
    setError(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { setError(t("report.notLoggedIn")); return; }

      const res = await fetch("/api/report", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ reported_type: reportedType, reported_id: reportedId, reason, note }),
      });

      if (res.status === 409) { setDone(true); return; } // already reported — treat as success
      if (!res.ok) throw new Error("Failed");
      setDone(true);
    } catch {
      setError(t("report.failed"));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white w-full max-w-md rounded-2xl shadow-2xl border border-gray-200 overflow-hidden">
        {/* Header */}
        <div className="relative px-5 pt-5 pb-4 bg-gradient-to-br from-red-50 to-white border-b border-gray-100">
          <button
            onClick={onClose}
            aria-label={t("common.close")}
            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          <div className="flex items-start gap-3 pr-8">
            <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center flex-shrink-0">
              <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 2H21l-3 6 3 6h-8.5l-1-2H5a2 2 0 00-2 2z" />
              </svg>
            </div>
            <div>
              <h3 className="text-base font-bold text-gray-900">
                {reportedType === "user" ? t("report.reportUser") : t("report.reportAd")}
              </h3>
              <p className="text-xs text-gray-500 mt-0.5">{t("report.subtitle")}</p>
            </div>
          </div>
        </div>

        <div className="p-5">
          {done ? (
            <div className="text-center py-4">
              <div className="w-14 h-14 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
                <svg className="w-7 h-7 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <p className="text-sm font-medium text-gray-800">{t("report.success")}</p>
              <button
                onClick={onClose}
                className="mt-5 px-5 py-2 text-sm font-semibold bg-brand-600 text-white rounded-xl hover:bg-brand-700 transition-colors"
              >
                {t("common.close")}
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {error && (
                <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                  {error}
                </p>
              )}

              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wide mb-2">
                  {t("report.reasonLabel")}
                </label>
                <div className="space-y-2">
                  {reasons.map((r) => {
                    const active = reason === r;
                    return (
                      <button
                        key={r}
                        type="button"
                        onClick={() => { setReason(r); setError(null); }}
                        className={`w-full flex items-center gap-3 text-left px-3.5 py-2.5 rounded-xl border-2 transition-all ${
                          active
                            ? "border-red-500 bg-red-50"
                            : "border-gray-200 hover:border-gray-300 bg-white"
                        }`}
                      >
                        <span
                          className={`w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                            active ? "border-red-500" : "border-gray-300"
                          }`}
                        >
                          {active && <span className="w-2 h-2 rounded-full bg-red-500" />}
                        </span>
                        <span className={`text-sm ${active ? "font-medium text-gray-900" : "text-gray-700"}`}>
                          {t(`report.reasons.${r}`)}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wide mb-2">
                  {t("report.noteOptional")}
                </label>
                <textarea
                  rows={3}
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder={t("report.notePlaceholder")}
                  className="w-full text-sm px-3 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-brand-500 focus:border-transparent resize-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-1">
                <button
                  onClick={onClose}
                  className="px-4 py-2 text-sm font-medium border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors"
                >
                  {t("common.cancel")}
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={submitting || !reason}
                  className="px-4 py-2 text-sm font-semibold bg-red-600 text-white rounded-xl hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {submitting ? t("report.submitting") : t("report.submit")}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
