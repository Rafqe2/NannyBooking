"use client";

import { useEffect, useState } from "react";
import { supabase } from "./supabase";
import type { User } from "@supabase/supabase-js";

export function useSupabaseUser() {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const init = async () => {
      try {
        const { data } = await supabase.auth.getUser();
        if (!isMounted) return;
        setUser(data.user ?? null);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    const { data: subscription } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!isMounted) return;
        
        try {
          setUser(session?.user ?? null);
          
          // Handle logout specifically
          if (event === 'SIGNED_OUT') {
            // Clear any cached data and ensure we're in a clean state
            setUser(null);
          }
        } catch (error) {
          console.error("Auth state change error:", error);
          // Still update the user state even if there's an error
          setUser(session?.user ?? null);
        }
      }
    );

    init();

    return () => {
      isMounted = false;
      subscription.subscription.unsubscribe();
    };
  }, []);

  return { user, isLoading };
}


