"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "../../lib/supabase";
import Header from "../../components/Header";
import Footer from "../../components/Footer";

interface Stats {
  users: {
    total: number;
    parents: number;
    nannies: number;
    pending: number;
    admins: number;
    newLast7Days: number;
  };
  ads: {
    total: number;
    active: number;
    inactive: number;
    shortTerm: number;
    longTerm: number;
  };
  bookings: {
    total: number;
    pending: number;
    confirmed: number;
    completed: number;
    cancelled: number;
  };
}

export default function AdminDashboard() {
  const router = useRouter();
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { router.replace("/login"); return; }

      const res = await fetch("/api/admin/stats", {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      if (res.status === 403 || res.status === 401) {
        router.replace("/");
        return;
      }
      if (!res.ok) { setError("Failed to load stats"); setLoading(false); return; }
      const data = await res.json();
      setStats(data);
      setLoading(false);
    };
    load();
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-gray-50">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600" />
        </main>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col bg-gray-50">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <p className="text-red-600">{error}</p>
        </main>
      </div>
    );
  }

  const statCards = [
    { label: "Total Users", value: stats?.users.total ?? 0, sub: `+${stats?.users.newLast7Days ?? 0} this week`, color: "bg-blue-50 border-blue-200", textColor: "text-blue-700" },
    { label: "Parents", value: stats?.users.parents ?? 0, sub: "registered parents", color: "bg-green-50 border-green-200", textColor: "text-green-700" },
    { label: "Nannies", value: stats?.users.nannies ?? 0, sub: "registered nannies", color: "bg-purple-50 border-purple-200", textColor: "text-purple-700" },
    { label: "Active Ads", value: stats?.ads.active ?? 0, sub: `${stats?.ads.total ?? 0} total ads`, color: "bg-yellow-50 border-yellow-200", textColor: "text-yellow-700" },
    { label: "Bookings", value: stats?.bookings.total ?? 0, sub: `${stats?.bookings.confirmed ?? 0} confirmed`, color: "bg-orange-50 border-orange-200", textColor: "text-orange-700" },
    { label: "Completed", value: stats?.bookings.completed ?? 0, sub: `${stats?.bookings.cancelled ?? 0} cancelled`, color: "bg-emerald-50 border-emerald-200", textColor: "text-emerald-700" },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header />
      <main className="flex-1 px-4 sm:px-8 py-10">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Admin Panel</h1>
              <p className="text-gray-500 mt-1">Platform overview</p>
            </div>
            <div className="flex gap-3">
              <Link
                href="/admin/users"
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm font-medium"
              >
                Manage Users
              </Link>
              <Link
                href="/admin/ads"
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium"
              >
                Manage Ads
              </Link>
              <Link
                href="/admin/reports"
                className="px-4 py-2 border border-red-200 text-red-700 rounded-lg hover:bg-red-50 transition-colors text-sm font-medium"
              >
                Reports
              </Link>
            </div>
          </div>

          {/* Stat Cards */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-10">
            {statCards.map((card) => (
              <div key={card.label} className={`rounded-xl border p-5 ${card.color}`}>
                <p className="text-sm text-gray-500 mb-1">{card.label}</p>
                <p className={`text-3xl font-bold ${card.textColor}`}>{card.value}</p>
                <p className="text-xs text-gray-400 mt-1">{card.sub}</p>
              </div>
            ))}
          </div>

          {/* Detailed breakdown */}
          <div className="grid md:grid-cols-3 gap-6">
            {/* Users breakdown */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Users</h2>
              <div className="space-y-3">
                {[
                  { label: "Parents", value: stats?.users.parents ?? 0 },
                  { label: "Nannies", value: stats?.users.nannies ?? 0 },
                  { label: "Pending", value: stats?.users.pending ?? 0 },
                  { label: "Admins", value: stats?.users.admins ?? 0 },
                ].map((row) => (
                  <div key={row.label} className="flex justify-between text-sm">
                    <span className="text-gray-600">{row.label}</span>
                    <span className="font-semibold text-gray-900">{row.value}</span>
                  </div>
                ))}
              </div>
              <Link href="/admin/users" className="mt-4 block text-sm text-purple-600 hover:underline">
                View all users →
              </Link>
            </div>

            {/* Ads breakdown */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Advertisements</h2>
              <div className="space-y-3">
                {[
                  { label: "Active", value: stats?.ads.active ?? 0 },
                  { label: "Inactive", value: stats?.ads.inactive ?? 0 },
                  { label: "Short-term", value: stats?.ads.shortTerm ?? 0 },
                  { label: "Long-term", value: stats?.ads.longTerm ?? 0 },
                ].map((row) => (
                  <div key={row.label} className="flex justify-between text-sm">
                    <span className="text-gray-600">{row.label}</span>
                    <span className="font-semibold text-gray-900">{row.value}</span>
                  </div>
                ))}
              </div>
              <Link href="/admin/ads" className="mt-4 block text-sm text-purple-600 hover:underline">
                View all ads →
              </Link>
            </div>

            {/* Bookings breakdown */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Bookings</h2>
              <div className="space-y-3">
                {[
                  { label: "Pending", value: stats?.bookings.pending ?? 0 },
                  { label: "Confirmed", value: stats?.bookings.confirmed ?? 0 },
                  { label: "Completed", value: stats?.bookings.completed ?? 0 },
                  { label: "Cancelled", value: stats?.bookings.cancelled ?? 0 },
                ].map((row) => (
                  <div key={row.label} className="flex justify-between text-sm">
                    <span className="text-gray-600">{row.label}</span>
                    <span className="font-semibold text-gray-900">{row.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
