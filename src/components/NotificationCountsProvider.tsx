"use client";

import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from "react";
import { useSupabaseUser } from "../lib/useSupabaseUser";
import { supabase } from "../lib/supabase";
import { MessageService } from "../lib/messageService";

interface NotificationCounts {
  pendingBookings: number;
  unreadMessages: number;
  refresh: () => void;
}

const Ctx = createContext<NotificationCounts>({
  pendingBookings: 0,
  unreadMessages: 0,
  refresh: () => {},
});

const POLL_INTERVAL_MS = 30000;

export function NotificationCountsProvider({ children }: { children: ReactNode }) {
  const { user } = useSupabaseUser();
  const [pendingBookings, setPendingBookings] = useState(0);
  const [unreadMessages, setUnreadMessages] = useState(0);

  const userId = user?.id;

  const load = useCallback(async () => {
    if (!userId) {
      setPendingBookings(0);
      setUnreadMessages(0);
      return;
    }
    try {
      const [bookingRes, msgCount] = await Promise.all([
        supabase.rpc("get_pending_booking_count_for_me"),
        MessageService.getUnreadCount(),
      ]);
      setPendingBookings(bookingRes.error ? 0 : Number(bookingRes.data || 0));
      setUnreadMessages(msgCount);
    } catch {
      setPendingBookings(0);
      setUnreadMessages(0);
    }
  }, [userId]);

  useEffect(() => {
    let active = true;
    const run = async () => {
      const result = load();
      if (!active) return;
      await result;
    };
    run();
    const id = setInterval(run, POLL_INTERVAL_MS);
    return () => {
      active = false;
      clearInterval(id);
    };
  }, [load]);

  return (
    <Ctx.Provider value={{ pendingBookings, unreadMessages, refresh: load }}>
      {children}
    </Ctx.Provider>
  );
}

export function useNotificationCounts() {
  return useContext(Ctx);
}
