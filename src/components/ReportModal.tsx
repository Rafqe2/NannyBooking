"use client";

import { useState } from "react";
import { supabase } from "../lib/supabase";
import { useTranslation } from "./LanguageProvider";

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
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white w-full max-w-sm rounded-2xl shadow-2xl border border-gray-200 overflow-hidden">
        <div className="px-5 py-3 border-b border-gray-100 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-gray-900">
            {reportedType === "user" ? t("report.reportUser") : t("report.reportAd")}
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-5">
          {done ? (
            <div className="text-center py-3">
              <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-3">
                <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <p className="text-sm text-gray-700">{t("report.success")}</p>
              <button onClick={onClose} className="mt-4 text-xs text-purple-600 hover:underline">
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
                <label className="block text-xs font-medium text-gray-700 mb-1.5">
                  {t("report.reasonLabel")}
                </label>
                <select
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="w-full text-sm px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                >
                  <option value="">{t("report.reasonPlaceholder")}</option>
                  {reasons.map((r) => (
                    <option key={r} value={r}>
                      {t(`report.reasons.${r}`)}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1.5">
                  {t("report.noteLabel")}
                </label>
                <textarea
                  rows={3}
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder={t("report.notePlaceholder")}
                  className="w-full text-sm px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-1">
                <button
                  onClick={onClose}
                  className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  {t("common.cancel")}
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={submitting || !reason}
                  className="px-3 py-1.5 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
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
