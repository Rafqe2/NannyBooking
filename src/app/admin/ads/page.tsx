"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "../../../lib/supabase";
import Header from "../../../components/Header";
import Footer from "../../../components/Footer";

interface AdminAd {
  id: string;
  title: string | null;
  type: string | null;
  is_active: boolean | null;
  price_per_hour: number | null;
  location_city: string | null;
  created_at: string | null;
  user_id: string | null;
  users: {
    name: string | null;
    surname: string | null;
    email: string | null;
  } | null;
}

export default function AdminAdsPage() {
  const router = useRouter();
  const [ads, setAds] = useState<AdminAd[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<"all" | "active" | "inactive">("all");
  const [filterType, setFilterType] = useState<"all" | "short-term" | "long-term">("all");
  const [acting, setActing] = useState<string | null>(null);
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { router.replace("/login"); return; }
      setToken(session.access_token);

      const res = await fetch("/api/admin/ads", {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      if (res.status === 403 || res.status === 401) { router.replace("/"); return; }
      if (!res.ok) { setError("Failed to load ads"); setLoading(false); return; }
      const data = await res.json();
      setAds(data.ads ?? []);
      setLoading(false);
    };
    load();
  }, [router]);

  const handleDelete = async (adId: string) => {
    if (!confirm("Are you sure you want to delete this advertisement?")) return;
    setActing(adId);
    try {
      const res = await fetch("/api/admin/ads", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ adId }),
      });
      if (!res.ok) {
        const d = await res.json();
        alert(d.error || "Delete failed");
        return;
      }
      setAds((prev) => prev.filter((a) => a.id !== adId));
    } finally {
      setActing(null);
    }
  };

  const filtered = ads.filter((ad) => {
    const q = search.toLowerCase();
    const matchesSearch =
      !q ||
      ad.title?.toLowerCase().includes(q) ||
      ad.location_city?.toLowerCase().includes(q) ||
      ad.users?.name?.toLowerCase().includes(q) ||
      ad.users?.surname?.toLowerCase().includes(q) ||
      ad.users?.email?.toLowerCase().includes(q);
    const matchesStatus =
      filterStatus === "all" ||
      (filterStatus === "active" && ad.is_active) ||
      (filterStatus === "inactive" && !ad.is_active);
    const matchesType = filterType === "all" || ad.type === filterType;
    return matchesSearch && matchesStatus && matchesType;
  });

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header />
      <main className="flex-1 px-4 sm:px-8 py-10">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="flex items-center gap-4 mb-6">
            <Link href="/admin" className="text-gray-500 hover:text-gray-700 text-sm">
              ← Dashboard
            </Link>
            <h1 className="text-2xl font-bold text-gray-900">Advertisements ({ads.length})</h1>
          </div>

          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-3 mb-6">
            <input
              type="text"
              placeholder="Search by title, location, owner…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="flex-1 border border-gray-200 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as typeof filterStatus)}
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-brand-500"
            >
              <option value="all">All status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value as typeof filterType)}
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-brand-500"
            >
              <option value="all">All types</option>
              <option value="short-term">Short-term</option>
              <option value="long-term">Long-term</option>
            </select>
          </div>

          {loading ? (
            <div className="flex justify-center py-20">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-brand-600" />
            </div>
          ) : error ? (
            <p className="text-red-600 text-center py-10">{error}</p>
          ) : (
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="text-left px-4 py-3 text-gray-600 font-medium">Title</th>
                    <th className="text-left px-4 py-3 text-gray-600 font-medium hidden md:table-cell">Owner</th>
                    <th className="text-left px-4 py-3 text-gray-600 font-medium">Type</th>
                    <th className="text-left px-4 py-3 text-gray-600 font-medium">Status</th>
                    <th className="text-left px-4 py-3 text-gray-600 font-medium hidden sm:table-cell">City</th>
                    <th className="text-left px-4 py-3 text-gray-600 font-medium hidden lg:table-cell">Price</th>
                    <th className="text-left px-4 py-3 text-gray-600 font-medium hidden lg:table-cell">Created</th>
                    <th className="text-right px-4 py-3 text-gray-600 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filtered.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="text-center py-10 text-gray-400">
                        No ads found
                      </td>
                    </tr>
                  ) : (
                    filtered.map((ad) => (
                      <tr key={ad.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3">
                          <Link
                            href={`/advertisement/${ad.id}`}
                            target="_blank"
                            className="font-medium text-gray-900 hover:text-brand-600 hover:underline line-clamp-1"
                          >
                            {ad.title || "Untitled"}
                          </Link>
                        </td>
                        <td className="px-4 py-3 text-gray-500 hidden md:table-cell">
                          {[ad.users?.name, ad.users?.surname].filter(Boolean).join(" ") || ad.users?.email || "—"}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                            ad.type === "short-term"
                              ? "bg-brand-100 text-brand-700"
                              : "bg-green-100 text-green-700"
                          }`}>
                            {ad.type || "—"}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                            ad.is_active
                              ? "bg-emerald-100 text-emerald-700"
                              : "bg-gray-100 text-gray-500"
                          }`}>
                            {ad.is_active ? "Active" : "Inactive"}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-gray-500 hidden sm:table-cell">
                          {ad.location_city || "—"}
                        </td>
                        <td className="px-4 py-3 text-gray-500 hidden lg:table-cell">
                          {ad.price_per_hour ? `€${ad.price_per_hour}/h` : "—"}
                        </td>
                        <td className="px-4 py-3 text-gray-400 hidden lg:table-cell">
                          {ad.created_at
                            ? new Date(ad.created_at).toLocaleDateString("en-GB")
                            : "—"}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <button
                            onClick={() => handleDelete(ad.id)}
                            disabled={acting === ad.id}
                            className="text-xs px-2 py-1 border border-red-300 text-red-700 rounded hover:bg-red-50 disabled:opacity-50"
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
              <div className="px-4 py-3 border-t border-gray-100 text-xs text-gray-400">
                Showing {filtered.length} of {ads.length} ads
              </div>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
