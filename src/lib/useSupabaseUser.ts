"use client";

import { useEffect, useState } from "react";
import { supabase } from "./supabase";
import type { User } from "@supabase/supabase-js";

export function useSupabaseUser() {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    // onAuthStateChange fires INITIAL_SESSION synchronously from the localStorage
    // cache — much faster than getUser() which makes a network request.
    // We use it to clear isLoading immediately without waiting for the network.
    const { data: subscription } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (!isMounted) return;
        setUser(session?.user ?? null);
        // INITIAL_SESSION fires on every page load from the cached session.
        // Clear loading state as soon as we know the auth status.
        if (isLoading) setIsLoading(false);
      }
    );

    return () => {
      isMounted = false;
      subscription.subscription.unsubscribe();
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return { user, isLoading };
}


