"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Building2 } from "lucide-react";
import { useTranslation } from "./LanguageProvider";
import { LV_LOCATIONS } from "../lib/constants/cities";

interface LocationAutocompleteProps {
  value: string;
  onChange: (next: { label: string }) => void;
  onQueryChange?: (query: string) => void;
  placeholder?: string;
  variant?: "default" | "borderless";
}

interface Suggestion {
  id: string;
  label: string;
  context?: string;
  isLocal: boolean;
}

// Strip diacritics and lowercase for prefix matching
function norm(s: string) {
  return s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
}

// Build a clean label from a Nominatim result object.
// Latvian places → just the place name.
// Foreign places → "City, Country".
function buildLabel(d: any): string {
  const addr = d.address || {};
  const place =
    addr.city ||
    addr.town ||
    addr.village ||
    addr.suburb ||
    addr.neighbourhood ||
    addr.hamlet ||
    "";
  if (!place) {
    // Fallback: first two non-postal-code parts of display_name
    const parts = String(d.display_name || "")
      .split(",")
      .map((p: string) => p.trim())
      .filter((p: string) => p && !/^\d/.test(p));
    return parts.slice(0, 2).join(", ");
  }
  if (addr.country_code === "lv") return place;
  const country = addr.country || "";
  return country ? `${place}, ${country}` : place;
}

export default function LocationAutocomplete({
  value,
  onChange,
  onQueryChange,
  placeholder,
  variant = "default",
}: LocationAutocompleteProps) {
  const { t } = useTranslation();
  const [query, setQuery] = useState<string>(value || "");
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [remoteSuggestions, setRemoteSuggestions] = useState<Suggestion[]>([]);
  const [highlight, setHighlight] = useState<number>(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const controllerRef = useRef<AbortController | null>(null);
  const debounceRef = useRef<number | null>(null);

  const search = useMemo(() => query.trim(), [query]);
  const searchNorm = useMemo(() => norm(search), [search]);

  useEffect(() => {
    setQuery(value || "");
  }, [value]);

  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  // ── Local prefix search (instant, no network) ──────────────────────────
  const localSuggestions = useMemo<Suggestion[]>(() => {
    if (searchNorm.length < 1) return [];
    return LV_LOCATIONS.filter((loc) => loc.norm.startsWith(searchNorm))
      .slice(0, 6)
      .map((loc) => ({
        id: `local-${loc.label}`,
        label: loc.label,
        context: loc.context,
        isLocal: true,
      }));
  }, [searchNorm]);

  // ── Nominatim fallback (only when local results are sparse) ────────────
  useEffect(() => {
    let active = true;
    if (debounceRef.current) window.clearTimeout(debounceRef.current);

    if (search.length < 2 || localSuggestions.length >= 5) {
      setRemoteSuggestions([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    debounceRef.current = window.setTimeout(async () => {
      if (!active) return;
      try {
        if (controllerRef.current) controllerRef.current.abort();
        controllerRef.current = new AbortController();
        const signal = controllerRef.current.signal;

        const url = new URL("https://nominatim.openstreetmap.org/search");
        url.searchParams.set("format", "jsonv2");
        url.searchParams.set("q", search);
        url.searchParams.set("addressdetails", "1");
        url.searchParams.set("limit", "6");

        const res = await fetch(url.toString(), {
          headers: {
            "Accept-Language": "lv,en",
            "User-Agent": "NannyBooking/1.0 (support@nannybooking.example)",
          },
          signal,
        });
        const data = (await res.json()) as any[];
        if (!active) return;

        // Filter out streets/roads and deduplicate against local results
        const localLabelsNorm = new Set(localSuggestions.map((s) => norm(s.label)));
        const remote: Suggestion[] = data
          .filter((d) => d.category !== "highway")
          .map((d) => ({
            id: String(d.place_id),
            label: buildLabel(d),
            isLocal: false,
          }))
          .filter((s) => s.label && !localLabelsNorm.has(norm(s.label)));

        if (active) setRemoteSuggestions(remote);
      } catch (err: unknown) {
        if (err instanceof DOMException && err.name === "AbortError") return;
        if (active) setRemoteSuggestions([]);
      } finally {
        if (active) setLoading(false);
      }
    }, 300);

    return () => {
      active = false;
      if (debounceRef.current) window.clearTimeout(debounceRef.current);
      if (controllerRef.current) controllerRef.current.abort();
    };
  }, [search, localSuggestions]);

  // Merge: local first, then remote, cap at 8 total
  const suggestions = useMemo<Suggestion[]>(() => {
    return [...localSuggestions, ...remoteSuggestions].slice(0, 8);
  }, [localSuggestions, remoteSuggestions]);

  const isOpen = open && search.length >= 1 && (suggestions.length > 0 || loading);

  useEffect(() => {
    if (search.length >= 1) setOpen(true);
  }, [suggestions, search]);

  const handleSelect = (s: Suggestion) => {
    onChange({ label: s.label });
    setQuery(s.label);
    onQueryChange?.(s.label);
    setOpen(false);
  };

  return (
    <div className="relative" ref={containerRef}>
      <input
        type="text"
        value={query}
        onChange={(e) => {
          const newQuery = e.target.value;
          setQuery(newQuery);
          onQueryChange?.(newQuery);
        }}
        onFocus={() => { if (search.length >= 1) setOpen(true); }}
        placeholder={placeholder || t("location.searchPlaceholder")}
        className={
          variant === "borderless"
            ? "w-full px-0 lg:px-0 py-3 lg:py-4 bg-transparent border-0 outline-none focus:outline-none focus:ring-0"
            : "w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
        }
        aria-autocomplete="list"
        aria-expanded={isOpen}
        aria-controls="location-suggestions"
      />
      {isOpen && (
        <div
          id="location-suggestions"
          className="absolute z-50 mt-2 w-full bg-white border border-gray-200 rounded-xl shadow-2xl max-h-72 overflow-auto"
          role="listbox"
        >
          {loading && suggestions.length === 0 && (
            <div className="px-4 py-3 text-sm text-gray-500">{t("location.searching")}</div>
          )}
          {!loading && suggestions.length === 0 && (
            <div className="px-4 py-3 text-sm text-gray-500">{t("location.noMatches")}</div>
          )}
          {suggestions.map((s, idx) => (
            <button
              key={s.id}
              role="option"
              aria-selected={highlight === idx}
              onMouseEnter={() => setHighlight(idx)}
              onClick={() => handleSelect(s)}
              className={
                "w-full px-4 py-3 text-left flex items-center gap-2 hover:bg-gray-50 " +
                (highlight === idx ? "bg-gray-50" : "")
              }
            >
              <Building2 className="w-4 h-4 text-brand-400 flex-shrink-0" />
              <span className="text-sm text-gray-800 flex-1">{s.label}</span>
              {s.context && (
                <span className="text-xs text-gray-400 flex-shrink-0">{s.context}</span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
