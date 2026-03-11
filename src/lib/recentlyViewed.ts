const KEY = "nannybooking:recentlyViewed";
const MAX = 6;

export interface RecentAd {
  id: string;
  title: string;
  location: string;
  hourlyRate: number;
  ownerPicture?: string | null;
  ownerFullName?: string;
  adType?: string;
  viewedAt: number;
}

export function saveRecentAd(ad: Omit<RecentAd, "viewedAt">): void {
  try {
    const existing = getRecentAds();
    const filtered = existing.filter((a) => a.id !== ad.id);
    const updated = [{ ...ad, viewedAt: Date.now() }, ...filtered].slice(0, MAX);
    localStorage.setItem(KEY, JSON.stringify(updated));
  } catch {}
}

export function getRecentAds(): RecentAd[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveRecentAdsFiltered(ads: RecentAd[]): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(ads));
  } catch {}
}
