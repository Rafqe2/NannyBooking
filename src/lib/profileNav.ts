// Shared contract for navigating between profile tabs.
//
// The profile page (src/app/profile/page.tsx) renders its tabs client-side and
// listens for a custom event so that switching tabs while already on /profile
// updates in place (no route change). Several places need to trigger a tab
// switch — the header menu, the mobile bottom nav, and deep links from other
// tabs — so the mechanism lives here in one place instead of being re-hand-rolled
// at each call site (which previously let the event name, tab whitelist, and
// URL param drift apart).

export type ProfileTab =
  | "job-ads"
  | "bookings"
  | "messages"
  | "profile"
  | "wallet";

export const PROFILE_TABS: readonly ProfileTab[] = [
  "job-ads",
  "bookings",
  "messages",
  "profile",
  "wallet",
];

// Event the profile page listens for to switch tabs without a route change.
export const PROFILE_TAB_EVENT = "profileTabChange";

// sessionStorage key: a conversation id to auto-open once the Messages tab
// mounts (set by BookingsTab, read by MessagesTab).
export const OPEN_CONVERSATION_KEY = "nannybooking:openConversation";

export function isProfileTab(value: unknown): value is ProfileTab {
  return (
    typeof value === "string" && PROFILE_TABS.includes(value as ProfileTab)
  );
}

// Switch to a profile tab. If already on the profile page, update the URL and
// dispatch the in-place switch event; otherwise navigate there with the tab in
// the query string.
export function navigateToProfileTab(
  tab: ProfileTab,
  router: { push: (href: string) => void }
): void {
  if (
    typeof window !== "undefined" &&
    window.location.pathname.startsWith("/profile")
  ) {
    const url = new URL(window.location.href);
    url.searchParams.set("tab", tab);
    window.history.pushState({}, "", url.toString());
    window.dispatchEvent(
      new CustomEvent(PROFILE_TAB_EVENT, { detail: { tab } })
    );
  } else {
    router.push(`/profile?tab=${tab}`);
  }
}
