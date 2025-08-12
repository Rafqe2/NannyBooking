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


