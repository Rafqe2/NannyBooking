-- Security fix: restrict users table RLS so authenticated users can only
-- read their own full row. Cross-user lookups (e.g. messaging counterparty
-- names) go through the user_public_info view which exposes only safe columns.

-- 1) Drop the overly broad policy that allowed any authenticated user to
--    read any row (including email, phone) from the users table.
DROP POLICY IF EXISTS "users_select_authenticated" ON public.users;

-- 2) Create a view exposing only non-sensitive columns.
--    Runs as the view owner (security definer) so it bypasses the table's
--    RLS and can return rows for any user — but only safe fields.
CREATE OR REPLACE VIEW public.user_public_info AS
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

-- 3) Grant read access to authenticated users.
GRANT SELECT ON public.user_public_info TO authenticated;
