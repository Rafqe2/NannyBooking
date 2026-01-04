"use client";

import { useEffect, useMemo, useRef, useState } from "react";

interface LocationAutocompleteProps {
  value: string;
  onChange: (next: { label: string }) => void;
  placeholder?: string;
  variant?: "default" | "borderless";
}

interface Suggestion {
  id: string;
  label: string;
  type: string | null;
}

export default function LocationAutocomplete({
  value,
  onChange,
  placeholder,
  variant = "default",
}: LocationAutocompleteProps) {
  const [query, setQuery] = useState<string>(value || "");
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [highlight, setHighlight] = useState<number>(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const controllerRef = useRef<AbortController | null>(null);
  const debounceRef = useRef<number | null>(null);

  const search = useMemo(() => query.trim(), [query]);
  const lastSuccessRef = useRef<string>("");

  useEffect(() => {
    setQuery(value || "");
  }, [value]);

  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  useEffect(() => {
    let active = true;
    const schedule = () => {
      if (debounceRef.current) window.clearTimeout(debounceRef.current);
      debounceRef.current = window.setTimeout(async () => {
        if (!active) return;
        if (search.length < 2) {
          setSuggestions([]);
          setOpen(false);
          return;
        }
        setLoading(true);
        try {
          if (controllerRef.current) controllerRef.current.abort();
          controllerRef.current = new AbortController();
          const signal = controllerRef.current.signal;
          const url = new URL("https://nominatim.openstreetmap.org/search");
          url.searchParams.set("format", "jsonv2");
          url.searchParams.set("q", search);
          url.searchParams.set("addressdetails", "1");
          url.searchParams.set("limit", "8");
          const res = await fetch(url.toString(), {
            headers: {
              "Accept-Language": "en",
              // Respectful User-Agent per Nominatim policy
              "User-Agent": "NannyBooking/1.0 (support@nannybooking.example)",
            },
            signal,
          });
          const data = (await res.json()) as any[];
          if (!active) return;
          const mapped: Suggestion[] = data.map((d) => ({
            id: String(d.place_id),
            label: String(d.display_name || ""),
            type: d.type ? String(d.type) : null,
          }));
          // If suggestions are identical to last success, avoid re-render jank
          const nextKey = mapped.map((m) => m.id).join(",");
          if (nextKey !== lastSuccessRef.current) {
            setSuggestions(mapped);
            lastSuccessRef.current = nextKey;
          }
          setOpen(true);
          setHighlight(-1);
        } catch (err: any) {
          if (err?.name === "AbortError") return;
          if (!active) return;
          setSuggestions([]);
        } finally {
          if (active) setLoading(false);
        }
      }, 150);
    };
    schedule();
    return () => {
      active = false;
      if (debounceRef.current) window.clearTimeout(debounceRef.current);
      if (controllerRef.current) controllerRef.current.abort();
    };
  }, [search]);

  const handleSelect = (s: Suggestion) => {
    onChange({ label: s.label });
    setQuery(s.label);
    setSuggestions([]);
    setOpen(false);
  };

  const iconFor = (type: string | null) => {
    switch (type) {
      case "city":
      case "town":
      case "village":
        return "🏙️";
      case "country":
        return "🌍";
      case "road":
      case "street":
      case "residential":
        return "🛣️";
      default:
        return "📍";
    }
  };

  return (
    <div className="relative" ref={containerRef}>
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onFocus={() => setOpen(suggestions.length > 0)}
        placeholder={placeholder || "Search city, country, street"}
        className={
          variant === "borderless"
            ? "w-full px-0 lg:px-0 py-3 lg:py-4 bg-transparent border-0 outline-none focus:outline-none focus:ring-0"
            : "w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
        }
        aria-autocomplete="list"
        aria-expanded={open}
        aria-controls="location-suggestions"
      />
      {open && (
        <div
          id="location-suggestions"
          className="absolute z-50 mt-2 w-full bg-white border border-gray-200 rounded-xl shadow-2xl max-h-72 overflow-auto"
          role="listbox"
        >
          {loading && (
            <div className="px-4 py-3 text-sm text-gray-500">Searching…</div>
          )}
          {!loading && suggestions.length === 0 && (
            <div className="px-4 py-3 text-sm text-gray-500">No matches</div>
          )}
          {!loading &&
            suggestions.map((s, idx) => (
              <button
                key={s.id}
                role="option"
                aria-selected={highlight === idx}
                onMouseEnter={() => setHighlight(idx)}
                onClick={() => handleSelect(s)}
                className={
                  "w-full px-4 py-3 text-left flex items-start gap-2 hover:bg-gray-50 " +
                  (highlight === idx ? "bg-gray-50" : "")
                }
              >
                <span className="text-lg leading-5">{iconFor(s.type)}</span>
                <span className="text-sm text-gray-800">{s.label}</span>
              </button>
            ))}
        </div>
      )}
    </div>
  );
}
