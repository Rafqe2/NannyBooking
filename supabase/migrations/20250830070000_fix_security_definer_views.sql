-- Fix Supabase advisor warning: views with SECURITY DEFINER.
--
-- Both views were flagged because they run as the view owner (bypassing RLS)
-- rather than as the querying user. The fix is to switch them to
-- SECURITY INVOKER and add the RLS policies they now need to function.

-- ── 1. user_public_info ───────────────────────────────────────────────────
-- This view exposes only non-sensitive user columns to authenticated users.
-- With SECURITY INVOKER it now relies on users table RLS — so we add a
-- permissive SELECT policy that allows authenticated users to read any row
-- (the view itself restricts which columns are visible).

CREATE POLICY "users_public_read_authenticated"
  ON public.users
  FOR SELECT
  TO authenticated
  USING (true);

-- Recreate the view with security_invoker = on
CREATE OR REPLACE VIEW public.user_public_info
  WITH (security_invoker = on)
AS
  SELECT
    id,
    name,
    surname,
    picture,
    user_type,
    location,
    additional_info,
    average_rating,
    total_reviews,
    created_at
  FROM public.users;

GRANT SELECT ON public.user_public_info TO authenticated;

-- ── 2. advertisement_owner_types ─────────────────────────────────────────
-- Not referenced in application code — likely auto-created by Supabase.
-- Switch to SECURITY INVOKER so it respects the caller's RLS.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_views
    WHERE schemaname = 'public'
      AND viewname = 'advertisement_owner_types'
  ) THEN
    EXECUTE 'ALTER VIEW public.advertisement_owner_types SET (security_invoker = on)';
  END IF;
END $$;

DO $$
BEGIN
  RAISE NOTICE 'Security definer views fixed ✅';
END $$;
