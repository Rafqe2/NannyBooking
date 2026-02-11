-- Auto-complete past bookings + Denormalized rating columns on users table
-- This migration:
-- 1. Creates an RPC to auto-complete confirmed bookings with past dates
-- 2. Adds average_rating and total_reviews columns to users table
-- 3. Creates a trigger to keep these columns in sync when reviews change
-- 4. Backfills existing data
-- 5. Updates get_user_public_profile to use denormalized columns

-- 1) Auto-complete past bookings RPC
CREATE OR REPLACE FUNCTION public.auto_complete_past_bookings()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := (SELECT auth.uid());
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'not authenticated';
  END IF;

  UPDATE public.bookings
  SET status = 'completed', updated_at = NOW()
  WHERE status = 'confirmed'
    AND start_date < CURRENT_DATE
    AND (parent_id = v_uid OR nanny_id = v_uid);
END;
$$;

GRANT EXECUTE ON FUNCTION public.auto_complete_past_bookings() TO authenticated;

-- 2) Add denormalized rating columns to users table
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS average_rating NUMERIC(3,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS total_reviews INT DEFAULT 0;

-- 3) Trigger function to recalculate rating when reviews change
CREATE OR REPLACE FUNCTION public.update_user_rating_stats()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_reviewee_id uuid;
BEGIN
  -- Determine which user's stats to update
  IF TG_OP = 'DELETE' THEN
    v_reviewee_id := OLD.reviewee_id;
  ELSE
    v_reviewee_id := NEW.reviewee_id;
  END IF;

  -- Recalculate and update
  UPDATE public.users
  SET
    average_rating = COALESCE(
      (SELECT ROUND(AVG(r.rating)::NUMERIC, 2) FROM public.reviews r WHERE r.reviewee_id = v_reviewee_id),
      0
    ),
    total_reviews = COALESCE(
      (SELECT COUNT(*)::INT FROM public.reviews r WHERE r.reviewee_id = v_reviewee_id),
      0
    )
  WHERE id = v_reviewee_id;

  -- If UPDATE changed the reviewee_id, update old reviewee too
  IF TG_OP = 'UPDATE' AND OLD.reviewee_id <> NEW.reviewee_id THEN
    UPDATE public.users
    SET
      average_rating = COALESCE(
        (SELECT ROUND(AVG(r.rating)::NUMERIC, 2) FROM public.reviews r WHERE r.reviewee_id = OLD.reviewee_id),
        0
      ),
      total_reviews = COALESCE(
        (SELECT COUNT(*)::INT FROM public.reviews r WHERE r.reviewee_id = OLD.reviewee_id),
        0
      )
    WHERE id = OLD.reviewee_id;
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$$;

-- 4) Create trigger on reviews table
DROP TRIGGER IF EXISTS trigger_update_user_rating ON public.reviews;
CREATE TRIGGER trigger_update_user_rating
  AFTER INSERT OR UPDATE OR DELETE ON public.reviews
  FOR EACH ROW
  EXECUTE FUNCTION public.update_user_rating_stats();

-- 5) Backfill existing data from reviews
UPDATE public.users u
SET
  average_rating = COALESCE(sub.avg_rating, 0),
  total_reviews = COALESCE(sub.cnt, 0)
FROM (
  SELECT
    reviewee_id,
    ROUND(AVG(rating)::NUMERIC, 2) as avg_rating,
    COUNT(*)::INT as cnt
  FROM public.reviews
  GROUP BY reviewee_id
) sub
WHERE u.id = sub.reviewee_id;

-- 6) Update get_user_public_profile to use denormalized columns
DROP FUNCTION IF EXISTS public.get_user_public_profile(uuid);
CREATE OR REPLACE FUNCTION public.get_user_public_profile(p_user_id uuid)
RETURNS TABLE (
  user_id uuid,
  full_name text,
  picture text,
  member_since timestamptz,
  bio text,
  user_type text,
  rating numeric,
  reviews_count int
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    u.id as user_id,
    TRIM(COALESCE(u.name,'') || ' ' || COALESCE(u.surname,'')) as full_name,
    u.picture,
    u.created_at as member_since,
    COALESCE(u.additional_info, '') as bio,
    u.user_type,
    COALESCE(u.average_rating, 0) as rating,
    COALESCE(u.total_reviews, 0) as reviews_count
  FROM public.users u
  WHERE u.id = p_user_id;
$$;

GRANT EXECUTE ON FUNCTION public.get_user_public_profile(uuid) TO anon, authenticated;
