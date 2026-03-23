"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "../../../lib/supabase";
import Header from "../../../components/Header";
import Footer from "../../../components/Footer";

interface Report {
  id: string;
  reported_type: "user" | "ad";
  reported_id: string;
  reason: string;
  note: string;
  status: "pending" | "reviewed" | "dismissed";
  created_at: string;
  reporter_name: string;
  reporter_email: string;
  target_name: string;
}

const REASON_LABELS: Record<string, string> = {
  inappropriate_behavior: "Inappropriate behavior",
  harassment: "Harassment",
  fake_profile: "Fake profile",
  inappropriate_content: "Inappropriate content",
  misleading_info: "Misleading information",
  fake_listing: "Fake listing",
  spam: "Spam",
  other: "Other",
};

export default function AdminReports() {
  const router = useRouter();
  const [reports, setReports] = useState<Report[]>([]);
  const [total, setTotal] = useState(0);
  const [status, setStatus] = useState<"pending" | "reviewed" | "dismissed">("pending");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updating, setUpdating] = useState<string | null>(null);

  const load = async (filterStatus: string) => {
    setLoading(true);
    setError(null);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { router.replace("/login"); return; }

      const res = await fetch(`/api/admin/reports?status=${filterStatus}`, {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      if (res.status === 403 || res.status === 401) { router.replace("/"); return; }
      if (!res.ok) throw new Error("Failed to load reports");
      const data = await res.json();
      setReports(data.reports || []);
      setTotal(data.total || 0);
    } catch {
      setError("Failed to load reports");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(status); }, [status]); // eslint-disable-line react-hooks/exhaustive-deps

  const updateStatus = async (id: string, newStatus: "reviewed" | "dismissed") => {
    setUpdating(id);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      await fetch("/api/admin/reports", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ id, status: newStatus }),
      });
      setReports((prev) => prev.filter((r) => r.id !== id));
      setTotal((t) => t - 1);
    } finally {
      setUpdating(null);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header />
      <main className="flex-1 px-4 sm:px-8 py-10">
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Reports</h1>
              <p className="text-gray-500 text-sm mt-0.5">{total} {status} report{total !== 1 ? "s" : ""}</p>
            </div>
            <Link href="/admin" className="text-sm text-gray-500 hover:text-brand-600 transition-colors">
              ← Back to Admin
            </Link>
          </div>

          {/* Status tabs */}
          <div className="flex gap-1 mb-6 bg-white border border-gray-200 rounded-xl p-1 w-fit">
            {(["pending", "reviewed", "dismissed"] as const).map((s) => (
              <button
                key={s}
                onClick={() => setStatus(s)}
                className={`px-4 py-1.5 rounded-lg text-sm font-medium capitalize transition-colors ${
                  status === s
                    ? "bg-brand-600 text-white shadow-sm"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                {s}
              </button>
            ))}
          </div>

          {loading ? (
            <div className="flex justify-center py-16">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-600" />
            </div>
          ) : error ? (
            <p className="text-red-600 text-center py-8">{error}</p>
          ) : reports.length === 0 ? (
            <div className="bg-white border border-gray-200 rounded-2xl p-12 text-center">
              <p className="text-gray-400 text-sm">No {status} reports.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {reports.map((r) => (
                <div key={r.id} className="bg-white border border-gray-200 rounded-xl p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2 flex-wrap">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium border ${
                          r.reported_type === "user"
                            ? "bg-brand-50 text-brand-700 border-brand-200"
                            : "bg-orange-50 text-orange-700 border-orange-200"
                        }`}>
                          {r.reported_type === "user" ? "User" : "Ad"}
                        </span>
                        <span className="text-sm font-semibold text-gray-900 truncate">
                          {r.target_name || r.reported_id}
                        </span>
                        {r.reported_type === "user" ? (
                          <Link
                            href={`/user/${r.reported_id}`}
                            target="_blank"
                            className="text-xs text-brand-600 hover:underline flex-shrink-0"
                          >
                            View profile →
                          </Link>
                        ) : (
                          <Link
                            href={`/advertisement/${r.reported_id}`}
                            target="_blank"
                            className="text-xs text-brand-600 hover:underline flex-shrink-0"
                          >
                            View listing →
                          </Link>
                        )}
                      </div>
                      <div className="text-sm text-gray-700 mb-1">
                        <span className="font-medium">Reason:</span>{" "}
                        {REASON_LABELS[r.reason] || r.reason}
                      </div>
                      {r.note && (
                        <p className="text-sm text-gray-600 bg-gray-50 rounded-lg px-3 py-2 mt-2 italic">
                          &ldquo;{r.note}&rdquo;
                        </p>
                      )}
                      <div className="mt-2 text-xs text-gray-400">
                        Reported by {r.reporter_name || r.reporter_email} ·{" "}
                        {new Date(r.created_at).toLocaleDateString("en-GB", {
                          day: "numeric", month: "short", year: "numeric"
                        })}
                      </div>
                    </div>
                    {status === "pending" && (
                      <div className="flex gap-2 flex-shrink-0">
                        <button
                          onClick={() => updateStatus(r.id, "reviewed")}
                          disabled={updating === r.id}
                          className="px-3 py-1.5 text-xs bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                        >
                          Reviewed
                        </button>
                        <button
                          onClick={() => updateStatus(r.id, "dismissed")}
                          disabled={updating === r.id}
                          className="px-3 py-1.5 text-xs border border-gray-300 text-gray-600 rounded-lg hover:bg-gray-50 disabled:opacity-50"
                        >
                          Dismiss
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
