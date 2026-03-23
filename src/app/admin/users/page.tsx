"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "../../../lib/supabase";
import Header from "../../../components/Header";
import Footer from "../../../components/Footer";

interface AdminUser {
  id: string;
  name: string | null;
  surname: string | null;
  email: string | null;
  user_type: "parent" | "nanny" | "admin" | "pending";
  created_at: string | null;
  location: string | null;
}

const TYPE_COLORS: Record<string, string> = {
  parent: "bg-brand-100 text-brand-700",
  nanny: "bg-brand-100 text-brand-700",
  admin: "bg-red-100 text-red-700",
  pending: "bg-gray-100 text-gray-700",
};

export default function AdminUsersPage() {
  const router = useRouter();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState<string>("all");
  const [acting, setActing] = useState<string | null>(null);
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { router.replace("/login"); return; }
      setToken(session.access_token);

      const res = await fetch("/api/admin/users", {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      if (res.status === 403 || res.status === 401) { router.replace("/"); return; }
      if (!res.ok) { setError("Failed to load users"); setLoading(false); return; }
      const data = await res.json();
      setUsers(data.users ?? []);
      setLoading(false);
    };
    load();
  }, [router]);

  const handleAction = async (userId: string, action: "suspend" | "delete") => {
    const label = action === "delete" ? "delete this user" : "suspend this user";
    if (!confirm(`Are you sure you want to ${label}?`)) return;
    setActing(userId);
    try {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ userId, action }),
      });
      if (!res.ok) {
        const d = await res.json();
        alert(d.error || "Action failed");
        return;
      }
      if (action === "delete") {
        setUsers((prev) => prev.filter((u) => u.id !== userId));
      } else {
        setUsers((prev) =>
          prev.map((u) => (u.id === userId ? { ...u, user_type: "pending" } : u))
        );
      }
    } finally {
      setActing(null);
    }
  };

  const filtered = users.filter((u) => {
    const q = search.toLowerCase();
    const matchesSearch =
      !q ||
      u.name?.toLowerCase().includes(q) ||
      u.surname?.toLowerCase().includes(q) ||
      u.email?.toLowerCase().includes(q) ||
      u.location?.toLowerCase().includes(q);
    const matchesType = filterType === "all" || u.user_type === filterType;
    return matchesSearch && matchesType;
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
            <h1 className="text-2xl font-bold text-gray-900">Users ({users.length})</h1>
          </div>

          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-3 mb-6">
            <input
              type="text"
              placeholder="Search by name, email, location…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="flex-1 border border-gray-200 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-brand-500"
            >
              <option value="all">All types</option>
              <option value="parent">Parents</option>
              <option value="nanny">Nannies</option>
              <option value="pending">Pending</option>
              <option value="admin">Admins</option>
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
                    <th className="text-left px-4 py-3 text-gray-600 font-medium">Name</th>
                    <th className="text-left px-4 py-3 text-gray-600 font-medium">Email</th>
                    <th className="text-left px-4 py-3 text-gray-600 font-medium">Type</th>
                    <th className="text-left px-4 py-3 text-gray-600 font-medium hidden md:table-cell">Location</th>
                    <th className="text-left px-4 py-3 text-gray-600 font-medium hidden lg:table-cell">Joined</th>
                    <th className="text-right px-4 py-3 text-gray-600 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filtered.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center py-10 text-gray-400">
                        No users found
                      </td>
                    </tr>
                  ) : (
                    filtered.map((user) => (
                      <tr key={user.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 font-medium text-gray-900">
                          {[user.name, user.surname].filter(Boolean).join(" ") || "—"}
                        </td>
                        <td className="px-4 py-3 text-gray-600">{user.email || "—"}</td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${TYPE_COLORS[user.user_type] ?? ""}`}>
                            {user.user_type}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-gray-500 hidden md:table-cell">
                          {user.location || "—"}
                        </td>
                        <td className="px-4 py-3 text-gray-400 hidden lg:table-cell">
                          {user.created_at
                            ? new Date(user.created_at).toLocaleDateString("en-GB")
                            : "—"}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex justify-end gap-2">
                            {user.user_type !== "admin" && (
                              <>
                                {user.user_type !== "pending" && (
                                  <button
                                    onClick={() => handleAction(user.id, "suspend")}
                                    disabled={acting === user.id}
                                    className="text-xs px-2 py-1 border border-yellow-300 text-yellow-700 rounded hover:bg-yellow-50 disabled:opacity-50"
                                  >
                                    Suspend
                                  </button>
                                )}
                                <button
                                  onClick={() => handleAction(user.id, "delete")}
                                  disabled={acting === user.id}
                                  className="text-xs px-2 py-1 border border-red-300 text-red-700 rounded hover:bg-red-50 disabled:opacity-50"
                                >
                                  Delete
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
              <div className="px-4 py-3 border-t border-gray-100 text-xs text-gray-400">
                Showing {filtered.length} of {users.length} users
              </div>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
