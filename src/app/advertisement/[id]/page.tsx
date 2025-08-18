"use client";

import { use as useUnwrap, useEffect, useMemo, useState } from "react";
import Header from "../../../components/Header";
import Footer from "../../../components/Footer";
import BlockingLoader from "../../../components/BlockingLoader";
import { AdvertisementService } from "../../../lib/advertisementService";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useSupabaseUser } from "../../../lib/useSupabaseUser";

interface Slot {
  available_date: string;
  start_time: string;
  end_time: string;
}

export default function AdvertisementDetails({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const router = useRouter();
  const { id } = useUnwrap(params);
  const { user } = useSupabaseUser();
  const [viewerType, setViewerType] = useState<"parent" | "nanny" | null>(null);
  const [ad, setAd] = useState<any | null>(null);
  const [slots, setSlots] = useState<Slot[]>([]);
  const [owner, setOwner] = useState<{
    fullName: string;
    memberSince: string | null;
    picture: string | null;
  } | null>(null);
  const [locations, setLocations] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const run = async () => {
      setLoading(true);
      setError(null);
      try {
        // Load viewer type to hide own ads when browsing
        if (user?.id) {
          const prof = await fetch(`/api/auth/me`)
            .then((r) => r.json())
            .catch(() => null);
          // We don't have a user_type endpoint; fallback not critical for view-only
        }
        const advertisement = await AdvertisementService.getAdvertisementById(
          id
        );
        if (!advertisement) {
          setError("Advertisement not found");
          setLoading(false);
          return;
        }
        setAd(advertisement);
        setOwner({
          fullName:
            [advertisement.name, advertisement.surname]
              .filter(Boolean)
              .join(" ") || "",
          memberSince: advertisement.created_at || null,
          picture: advertisement.picture || null,
        } as any);
        const s = await AdvertisementService.getAvailabilitySlots(id);
        setSlots(s);
        // Load extra locations (best-effort)
        try {
          const res = await fetch(`/api/ads/${id}/locations`).then((r) =>
            r.json()
          );
          if (Array.isArray(res)) setLocations(res.map((x: any) => x.label));
        } catch {}
      } catch (e: any) {
        setError(e?.message || "Failed to load advertisement");
      } finally {
        setLoading(false);
      }
    };
    run();
  }, [id]);

  const groupedSlots = useMemo(() => {
    const map = new Map<string, Slot[]>();
    for (const s of slots) {
      const key = s.available_date;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(s);
    }
    return Array.from(map.entries())
      .sort(([a], [b]) => (a < b ? -1 : 1))
      .map(([date, items]) => ({ date, items }));
  }, [slots]);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-white">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <BlockingLoader message="Loading advertisement…" />
        </main>
        <Footer />
      </div>
    );
  }

  if (error || !ad) {
    return (
      <div className="min-h-screen flex flex-col bg-gradient-to-br from-gray-50 to-gray-100">
        <Header />
        <main className="flex-1 flex items-center justify-center px-4">
          <div className="bg-white border border-gray-200 rounded-2xl p-8 max-w-md text-center shadow-sm">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              {error || "Advertisement not found"}
            </h2>
            <p className="text-gray-600 mb-6">
              The advertisement you are looking for may have been removed or is
              not available.
            </p>
            <button
              onClick={() => router.back()}
              className="px-6 py-3 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700"
            >
              Go Back
            </button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-gray-50 to-gray-100">
      <Header />
      <main className="flex-1 px-4 py-8">
        <div className="max-w-5xl mx-auto">
          <div className="mb-4">
            <button
              type="button"
              onClick={() => {
                if (
                  typeof window !== "undefined" &&
                  window.history.length > 1
                ) {
                  window.history.back();
                } else {
                  router.push("/");
                }
              }}
              className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50"
            >
              <span>←</span>
              <span>Back to results</span>
            </button>
          </div>
          {/* Title and key facts */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="px-8 py-6 bg-gradient-to-r from-purple-600 to-purple-700 text-white">
              <div className="flex items-center justify-between">
                <h1 className="text-2xl sm:text-3xl font-bold">{ad.title}</h1>
                <div className="flex items-center gap-3">
                  <span className="px-4 py-2 bg-white/20 rounded-full text-sm">
                    {ad.type === "short-term" ? "Short-term" : "Long-term"}
                  </span>
                  <Link
                    href={`/user/${ad.user_id}`}
                    className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-full text-sm font-medium border border-white/30 hover:border-white/50"
                  >
                    View profile
                  </Link>
                </div>
              </div>
              <div className="mt-3 flex flex-wrap gap-3 text-sm text-purple-100">
                <span className="inline-flex items-center gap-1">
                  <span>📍</span>
                  <span>{ad.location_city}</span>
                </span>
                <span className="inline-flex items-center gap-1">
                  <span>💰</span>
                  <span>€{Number(ad.price_per_hour)}/hour</span>
                </span>
                {ad.availability_start_time && ad.availability_end_time && (
                  <span className="inline-flex items-center gap-1">
                    <span>⏰</span>
                    <span>
                      {ad.availability_start_time} - {ad.availability_end_time}
                    </span>
                  </span>
                )}
                <span
                  className={
                    "inline-flex items-center gap-1 " +
                    (ad.is_active ? "text-green-100" : "text-gray-200")
                  }
                >
                  <span>●</span>
                  <span>{ad.is_active ? "Active" : "Inactive"}</span>
                </span>
              </div>
            </div>

            <div className="p-6 sm:p-8">
              {/* Description */}
              <div className="mb-8">
                <h2 className="text-xl font-semibold text-gray-900 mb-3">
                  Description
                </h2>
                <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                  {ad.description}
                </p>
              </div>

              {/* Experience / Skills */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <div className="bg-gray-50 rounded-xl p-5 border border-gray-200">
                  <h3 className="font-semibold text-gray-900 mb-2">
                    {ad.type === "short-term"
                      ? "Requirements & Preferences"
                      : "Experience & Background"}
                  </h3>
                  <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                    {ad.experience || "—"}
                  </p>
                </div>
                <div className="bg-gray-50 rounded-xl p-5 border border-gray-200">
                  <h3 className="font-semibold text-gray-900 mb-2">Skills</h3>
                  {ad.skills && ad.skills.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {ad.skills.map((s: string) => (
                        <span
                          key={s}
                          className="px-3 py-1 bg-purple-100 text-purple-700 text-xs rounded-full"
                        >
                          {s}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500">—</p>
                  )}
                </div>
              </div>

              {/* Availability calendar-like list */}
              <div className="mb-8">
                <h3 className="text-xl font-semibold text-gray-900 mb-3">
                  Availability
                </h3>
                {groupedSlots.length > 0 ? (
                  <div className="space-y-3">
                    {groupedSlots.map(({ date, items }) => (
                      <div
                        key={date}
                        className="flex items-start justify-between bg-white rounded-xl border border-gray-200 p-4"
                      >
                        <div className="text-gray-900 font-medium">
                          {new Date(date + "T00:00:00Z").toLocaleDateString()}
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {items.map((s, idx) => (
                            <span
                              key={idx}
                              className="px-3 py-1 rounded-full bg-green-50 text-green-700 text-xs border border-green-200"
                            >
                              {s.start_time} - {s.end_time}
                            </span>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-600">No specific dates provided.</p>
                )}
              </div>

              {/* Location & extra */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white rounded-xl border border-gray-200 p-5">
                  <h3 className="font-semibold text-gray-900 mb-2">Location</h3>
                  <p className="text-gray-700">
                    {ad.location_address ? (
                      <>
                        {ad.location_address}
                        <br />
                      </>
                    ) : null}
                    {ad.location_zip_code ? (
                      <>
                        {ad.location_zip_code}
                        <br />
                      </>
                    ) : null}
                    {ad.location_city}
                  </p>
                  {locations.length > 0 && (
                    <p className="text-sm text-gray-500 mt-2">
                      Also serves: {locations.slice(0, 5).join(", ")}
                      {locations.length > 5 ? ` +${locations.length - 5}` : ""}
                    </p>
                  )}
                </div>
                {ad.additional_info && (
                  <div className="bg-white rounded-xl border border-gray-200 p-5">
                    <h3 className="font-semibold text-gray-900 mb-2">Notes</h3>
                    <p className="text-gray-700 whitespace-pre-wrap">
                      {ad.additional_info}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
