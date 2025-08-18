export function formatDateRange(start: Date | null, end: Date | null): string {
  if (!start) return "Date";
  if (!end)
    return start.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  return `${start.toLocaleDateString("en-US", { month: "short", day: "numeric" })} - ${end.toLocaleDateString("en-US", { month: "short", day: "numeric" })}`;
}

export function toISODate(d: Date): string {
  const dt = new Date(d);
  dt.setHours(0, 0, 0, 0);
  return dt.toISOString().slice(0, 10);
}

// Formats using local timezone, avoiding UTC day-shift
export function toLocalYYYYMMDD(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}


