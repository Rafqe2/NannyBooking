-- Fix: Users RLS, Reviews advertisement_id nullable, Reviews insert policy
--
-- Issues fixed:
-- 1. Users table RLS blocks messaging counterparty lookups (shows "Unknown")
-- 2. Reviews advertisement_id is NOT NULL but bookings can have null advertisement_id
-- 3. Reviews INSERT RLS policy references old nannies table (broken after migration)

-- 1) Allow authenticated users to view other users' basic profile info
-- This is needed for messaging (counterparty names), reviews (reviewer names), etc.
CREATE POLICY "users_select_authenticated" ON public.users
  FOR SELECT TO authenticated
  USING (true);

-- 2) Make advertisement_id nullable in reviews table
-- Bookings can have null advertisement_id (e.g., ad was deleted, ON DELETE SET NULL)
ALTER TABLE public.reviews ALTER COLUMN advertisement_id DROP NOT NULL;

-- 3) Fix reviews INSERT RLS policy - remove nannies table reference
-- The old policy referenced public.nannies table which is no longer used.
-- bookings.nanny_id now stores the user ID directly.
DROP POLICY IF EXISTS "reviews_insert_own" ON public.reviews;
CREATE POLICY "reviews_insert_own" ON public.reviews
  FOR INSERT WITH CHECK (
    (SELECT auth.uid()) = reviewer_id
    AND EXISTS (
      SELECT 1 FROM public.bookings b
      WHERE b.id = booking_id
      AND b.status = 'completed'
      AND (
        b.parent_id = (SELECT auth.uid())
        OR b.nanny_id = (SELECT auth.uid())
      )
    )
  );
