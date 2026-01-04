-- Reviews System Migration (FIXED)
-- Comprehensive rating and review system for nannies and parents

-- Drop existing tables if they exist (for clean reinstall)
DROP TABLE IF EXISTS public.review_reports CASCADE;
DROP TABLE IF EXISTS public.review_helpfulness CASCADE;
DROP TABLE IF EXISTS public.reviews CASCADE;

-- Drop existing functions if they exist
DROP FUNCTION IF EXISTS public.update_review_helpful_count() CASCADE;
DROP FUNCTION IF EXISTS public.update_review_reported_count() CASCADE;
DROP FUNCTION IF EXISTS public.get_user_rating_stats(UUID) CASCADE;
DROP FUNCTION IF EXISTS public.can_user_review(UUID) CASCADE;
DROP FUNCTION IF EXISTS public.update_reviews_updated_at() CASCADE;

-- 1) Create reviews table
CREATE TABLE public.reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  advertisement_id UUID NOT NULL REFERENCES public.advertisements(id) ON DELETE CASCADE,
  reviewer_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  reviewee_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  booking_id UUID REFERENCES public.bookings(id) ON DELETE SET NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  title TEXT,
  comment TEXT NOT NULL,
  response TEXT,
  response_date TIMESTAMPTZ,
  helpful_count INTEGER DEFAULT 0,
  reported_count INTEGER DEFAULT 0,
  is_verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(booking_id, reviewer_id)
);

-- 2) Create review helpfulness tracking
CREATE TABLE public.review_helpfulness (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  review_id UUID NOT NULL REFERENCES public.reviews(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  is_helpful BOOLEAN NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(review_id, user_id)
);

-- 3) Create review reports table
CREATE TABLE public.review_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  review_id UUID NOT NULL REFERENCES public.reviews(id) ON DELETE CASCADE,
  reporter_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  reason TEXT NOT NULL CHECK (reason IN ('spam', 'offensive', 'inappropriate', 'fake', 'other')),
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(review_id, reporter_id)
);

-- 4) Create indexes for performance
CREATE INDEX idx_reviews_reviewee ON public.reviews(reviewee_id);
CREATE INDEX idx_reviews_reviewer ON public.reviews(reviewer_id);
CREATE INDEX idx_reviews_advertisement ON public.reviews(advertisement_id);
CREATE INDEX idx_reviews_booking ON public.reviews(booking_id);
CREATE INDEX idx_reviews_rating ON public.reviews(rating);
CREATE INDEX idx_reviews_created ON public.reviews(created_at DESC);
CREATE INDEX idx_review_helpfulness_review ON public.review_helpfulness(review_id);
CREATE INDEX idx_review_reports_review ON public.review_reports(review_id);

-- 5) Enable Row Level Security
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.review_helpfulness ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.review_reports ENABLE ROW LEVEL SECURITY;

-- 6) RLS Policies for reviews
CREATE POLICY "reviews_select_all" ON public.reviews
  FOR SELECT USING (true);

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

-- Combined UPDATE policy: reviewers can update their own reviews (within 30 days), 
-- or reviewees can add responses (only if response is currently NULL)
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

-- 7) RLS Policies for helpfulness
CREATE POLICY "helpfulness_select_all" ON public.review_helpfulness
  FOR SELECT USING (true);

CREATE POLICY "helpfulness_insert_own" ON public.review_helpfulness
  FOR INSERT WITH CHECK ((SELECT auth.uid()) = user_id);

CREATE POLICY "helpfulness_update_own" ON public.review_helpfulness
  FOR UPDATE USING ((SELECT auth.uid()) = user_id);

CREATE POLICY "helpfulness_delete_own" ON public.review_helpfulness
  FOR DELETE USING ((SELECT auth.uid()) = user_id);

-- 8) RLS Policies for reports
CREATE POLICY "reports_select_own" ON public.review_reports
  FOR SELECT USING ((SELECT auth.uid()) = reporter_id);

CREATE POLICY "reports_insert_own" ON public.review_reports
  FOR INSERT WITH CHECK ((SELECT auth.uid()) = reporter_id);

-- 9) Function to update review helpful count
CREATE FUNCTION public.update_review_helpful_count()
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

-- 10) Trigger for helpful count
CREATE TRIGGER trigger_update_helpful_count
  AFTER INSERT OR UPDATE OR DELETE ON public.review_helpfulness
  FOR EACH ROW
  EXECUTE FUNCTION public.update_review_helpful_count();

-- 11) Function to update review reported count
CREATE FUNCTION public.update_review_reported_count()
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

-- 12) Trigger for reported count
CREATE TRIGGER trigger_update_reported_count
  AFTER INSERT OR DELETE ON public.review_reports
  FOR EACH ROW
  EXECUTE FUNCTION public.update_review_reported_count();

-- 13) Function to get user's average rating and review count
CREATE FUNCTION public.get_user_rating_stats(p_user_id UUID)
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

GRANT EXECUTE ON FUNCTION public.get_user_rating_stats(UUID) TO anon, authenticated;

-- 14) Function to check if user can review
CREATE FUNCTION public.can_user_review(p_booking_id UUID)
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
      b.parent_id = auth.uid()
      OR EXISTS (
        SELECT 1 FROM public.nannies n 
        WHERE n.id = b.nanny_id AND n.user_id = auth.uid()
      )
    )
    AND NOT EXISTS (
      SELECT 1 FROM public.reviews
      WHERE booking_id = p_booking_id
      AND reviewer_id = auth.uid()
    )
    INTO v_can_review
  FROM public.bookings b
  WHERE b.id = p_booking_id;
  
  RETURN COALESCE(v_can_review, false);
END;
$$;

GRANT EXECUTE ON FUNCTION public.can_user_review(UUID) TO authenticated;

-- 15) Update updated_at timestamp
CREATE FUNCTION public.update_reviews_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public, pg_temp
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_reviews_updated_at
  BEFORE UPDATE ON public.reviews
  FOR EACH ROW
  EXECUTE FUNCTION public.update_reviews_updated_at();

-- Success message
DO $$
BEGIN
  RAISE NOTICE 'Reviews system installed successfully! ✅';
  RAISE NOTICE 'Tables created: reviews, review_helpfulness, review_reports';
  RAISE NOTICE 'Functions created: get_user_rating_stats, can_user_review';
  RAISE NOTICE 'RLS policies: Enabled and configured';
END $$;

