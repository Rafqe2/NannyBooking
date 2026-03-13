import { Language } from './i18n';

// Strip Latvian ". g." (gada) suffix from locale-formatted date strings
export function stripLatvianGada(formatted: string): string {
  return formatted.replace(/\.\s*g\.\s*/g, ". ");
}

export function formatDateRange(start: Date | null, end: Date | null, language: Language = 'en'): string {
  if (!start) {
    const dateTranslations = {
      en: "Date",
      lv: "Datums",
      ru: "Дата"
    };
    return dateTranslations[language];
  }

  const locale = language === 'lv' ? 'lv-LV' : language === 'ru' ? 'ru-RU' : 'en-US';

  if (!end)
    return stripLatvianGada(start.toLocaleDateString(locale, { month: "short", day: "numeric" }));
  return `${stripLatvianGada(start.toLocaleDateString(locale, { month: "short", day: "numeric" }))} - ${stripLatvianGada(end.toLocaleDateString(locale, { month: "short", day: "numeric" }))}`;
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

// Format date as DD/MM/YYYY
export function formatDateDDMMYYYY(d: Date): string {
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
}

export function formatMonthYear(dateString: string, language: string): string {
  const date = new Date(dateString);
  const monthNames =
    language === "lv"
      ? ["Janvāris","Februāris","Marts","Aprīlis","Maijs","Jūnijs","Jūlijs","Augusts","Septembris","Oktobris","Novembris","Decembris"]
      : language === "ru"
      ? ["Январь","Февраль","Март","Апрель","Май","Июнь","Июль","Август","Сентябрь","Октябрь","Ноябрь","Декабрь"]
      : ["January","February","March","April","May","June","July","August","September","October","November","December"];
  return `${monthNames[date.getMonth()]} ${date.getFullYear()}`;
}
