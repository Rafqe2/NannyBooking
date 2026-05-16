import { useEffect } from "react";

/**
 * Subscribe to the Escape key while a modal/dropdown is open.
 * Pass `enabled=false` (or omit when closed) to skip the listener.
 */
export function useEscapeKey(handler: () => void, enabled: boolean = true) {
  useEffect(() => {
    if (!enabled) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") handler();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [handler, enabled]);
}
