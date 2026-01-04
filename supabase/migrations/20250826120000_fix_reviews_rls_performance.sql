-- Fix RLS Performance Issues for Reviews System
-- Replaces auth.uid() with (select auth.uid()) for better query performance

-- Drop existing policies
DROP POLICY IF EXISTS "reviews_insert_own" ON public.reviews;
DROP POLICY IF EXISTS "reviews_update_own" ON public.reviews;
DROP POLICY IF EXISTS "reviews_update_response" ON public.reviews;
DROP POLICY IF EXISTS "reviews_update_combined" ON public.reviews;
DROP POLICY IF EXISTS "reviews_delete_own" ON public.reviews;
DROP POLICY IF EXISTS "helpfulness_insert_own" ON public.review_helpfulness;
DROP POLICY IF EXISTS "helpfulness_update_own" ON public.review_helpfulness;
DROP POLICY IF EXISTS "helpfulness_delete_own" ON public.review_helpfulness;
DROP POLICY IF EXISTS "reports_select_own" ON public.review_reports;
DROP POLICY IF EXISTS "reports_insert_own" ON public.review_reports;

-- Recreate reviews policies with optimized auth.uid() calls
CREATE POLICY "reviews_insert_own" ON public.reviews
  FOR INSERT WITH CHECK (
    (SELECT auth.uid()) = reviewer_id
    AND EXISTS (
      SELECT 1 FROM public.bookings b
      WHERE b.id = booking_id
      AND b.status = 'completed'
      AND (
        b.parent_id = (SELECT auth.uid())
        OR EXISTS (
          SELECT 1 FROM public.nannies n 
          WHERE n.id = b.nanny_id AND n.user_id = (SELECT auth.uid())
        )
      )
    )
  );

-- Combined UPDATE policy to avoid multiple permissive policies warning
CREATE POLICY "reviews_update_combined" ON public.reviews
  FOR UPDATE USING (
    -- Reviewer updating their own review (within 30 days)
    ((SELECT auth.uid()) = reviewer_id AND created_at > NOW() - INTERVAL '30 days')
    OR
    -- Reviewee adding a response (only if response is NULL)
    ((SELECT auth.uid()) = reviewee_id AND response IS NULL)
  )
  WITH CHECK (
    -- Reviewer: must still be the reviewer
    ((SELECT auth.uid()) = reviewer_id)
    OR
    -- Reviewee: must still be the reviewee
    ((SELECT auth.uid()) = reviewee_id)
  );

CREATE POLICY "reviews_delete_own" ON public.reviews
  FOR DELETE USING (
    (SELECT auth.uid()) = reviewer_id
    AND created_at > NOW() - INTERVAL '7 days'
  );

-- Recreate helpfulness policies with optimized auth.uid() calls
CREATE POLICY "helpfulness_insert_own" ON public.review_helpfulness
  FOR INSERT WITH CHECK ((SELECT auth.uid()) = user_id);

CREATE POLICY "helpfulness_update_own" ON public.review_helpfulness
  FOR UPDATE USING ((SELECT auth.uid()) = user_id);

CREATE POLICY "helpfulness_delete_own" ON public.review_helpfulness
  FOR DELETE USING ((SELECT auth.uid()) = user_id);

-- Recreate reports policies with optimized auth.uid() calls
CREATE POLICY "reports_select_own" ON public.review_reports
  FOR SELECT USING ((SELECT auth.uid()) = reporter_id);

CREATE POLICY "reports_insert_own" ON public.review_reports
  FOR INSERT WITH CHECK ((SELECT auth.uid()) = reporter_id);

-- Fix function search_path security issues
CREATE OR REPLACE FUNCTION public.update_review_helpful_count()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  UPDATE public.reviews
  SET helpful_count = (
    SELECT COUNT(*) 
    FROM public.review_helpfulness 
    WHERE review_id = COALESCE(NEW.review_id, OLD.review_id)
    AND is_helpful = true
  )
  WHERE id = COALESCE(NEW.review_id, OLD.review_id);
  RETURN COALESCE(NEW, OLD);
END;
$$;

CREATE OR REPLACE FUNCTION public.update_review_reported_count()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  UPDATE public.reviews
  SET reported_count = (
    SELECT COUNT(*) 
    FROM public.review_reports 
    WHERE review_id = COALESCE(NEW.review_id, OLD.review_id)
  )
  WHERE id = COALESCE(NEW.review_id, OLD.review_id);
  RETURN COALESCE(NEW, OLD);
END;
$$;

CREATE OR REPLACE FUNCTION public.get_user_rating_stats(p_user_id UUID)
RETURNS TABLE (
  average_rating NUMERIC,
  total_reviews BIGINT,
  rating_breakdown JSONB
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ROUND(AVG(r.rating)::NUMERIC, 2) as average_rating,
    COUNT(r.id) as total_reviews,
    jsonb_build_object(
      '5', COUNT(*) FILTER (WHERE r.rating = 5),
      '4', COUNT(*) FILTER (WHERE r.rating = 4),
      '3', COUNT(*) FILTER (WHERE r.rating = 3),
      '2', COUNT(*) FILTER (WHERE r.rating = 2),
      '1', COUNT(*) FILTER (WHERE r.rating = 1)
    ) as rating_breakdown
  FROM public.reviews r
  WHERE r.reviewee_id = p_user_id
  GROUP BY r.reviewee_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.can_user_review(p_booking_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_can_review BOOLEAN;
BEGIN
  SELECT 
    b.status = 'completed'
    AND (
      b.parent_id = (SELECT auth.uid())
      OR EXISTS (
        SELECT 1 FROM public.nannies n 
        WHERE n.id = b.nanny_id AND n.user_id = (SELECT auth.uid())
      )
    )
    AND NOT EXISTS (
      SELECT 1 FROM public.reviews
      WHERE booking_id = p_booking_id
      AND reviewer_id = (SELECT auth.uid())
    )
    INTO v_can_review
  FROM public.bookings b
  WHERE b.id = p_booking_id;
  
  RETURN COALESCE(v_can_review, false);
END;
$$;

CREATE OR REPLACE FUNCTION public.update_reviews_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public, pg_temp
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- Success message
DO $$
BEGIN
  RAISE NOTICE 'RLS policies optimized for performance! ✅';
  RAISE NOTICE 'All auth.uid() calls wrapped in (select auth.uid())';
  RAISE NOTICE 'Multiple UPDATE policies combined into single policy';
  RAISE NOTICE 'All function search_path security issues fixed';
  RAISE NOTICE 'Functions updated: update_review_helpful_count, update_review_reported_count, get_user_rating_stats, can_user_review, update_reviews_updated_at';
END $$;

