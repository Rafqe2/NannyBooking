-- Enhanced Search with Advanced Filters
-- Extends the existing search_ads function with price, rating, skills, and experience filters

-- Drop existing function to recreate with new parameters
DROP FUNCTION IF EXISTS public.search_ads(text, date, date, text);

-- Create enhanced search function with advanced filters
CREATE OR REPLACE FUNCTION public.search_ads(
  p_location text DEFAULT NULL,
  p_start_date date DEFAULT NULL,
  p_end_date date DEFAULT NULL,
  p_viewer_type text DEFAULT NULL,
  p_price_min numeric DEFAULT NULL,
  p_price_max numeric DEFAULT NULL,
  p_skills text[] DEFAULT NULL,
  p_min_rating numeric DEFAULT NULL,
  p_has_reviews boolean DEFAULT FALSE,
  p_verified_only boolean DEFAULT FALSE
)
RETURNS TABLE (
  id UUID,
  title text,
  location_city text,
  price_per_hour numeric,
  experience text,
  skills text[],
  availability_start_time time,
  availability_end_time time,
  owner_id UUID,
  owner_full_name text,
  owner_member_since timestamptz,
  owner_picture text,
  owner_rating numeric,
  owner_reviews_count int,
  locations text[]
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  viewer_type text;
BEGIN
  -- Normalize date range
  IF p_start_date IS NOT NULL AND p_end_date IS NULL THEN
    p_end_date := p_start_date;
  END IF;

  -- Determine viewer type
  BEGIN
    IF p_viewer_type IS NOT NULL THEN
      viewer_type := p_viewer_type;
    ELSE
      SELECT user_type INTO viewer_type FROM public.users WHERE id = auth.uid();
    END IF;
  EXCEPTION WHEN OTHERS THEN
    viewer_type := NULL;
  END;

  -- Case 1: No date filters
  IF p_start_date IS NULL AND p_end_date IS NULL THEN
    RETURN QUERY
    WITH filtered_ads AS (
      SELECT 
        a.*,
        u.id as owner_id,
        TRIM(COALESCE(u.name,'') || ' ' || COALESCE(u.surname,''))::text as owner_full_name,
        u.created_at as owner_member_since,
        u.picture::text as owner_picture,
        u.user_type as owner_user_type
      FROM public.advertisements a
      JOIN public.users u ON u.id = a.user_id
      WHERE a.is_active = TRUE
        -- Location filter
        AND (p_location IS NULL OR a.location_city ILIKE '%' || p_location || '%')
        -- Price filters
        AND (p_price_min IS NULL OR a.price_per_hour >= p_price_min)
        AND (p_price_max IS NULL OR a.price_per_hour <= p_price_max)
        -- Skills filter (ad must have ALL specified skills)
        AND (p_skills IS NULL OR p_skills <@ a.skills)
        -- Role-based filtering
        AND (
          viewer_type IS NULL
          OR (viewer_type = 'parent' AND u.user_type = 'nanny')
          OR (viewer_type = 'nanny' AND u.user_type = 'parent')
        )
        -- Exclude own ads
        AND ((SELECT auth.uid()) IS NULL OR a.user_id <> (SELECT auth.uid()))
        -- Long-term ads or short-term with future dates
        AND (
          a.type = 'long-term' OR EXISTS (
            SELECT 1
            FROM public.advertisement_availability av
            WHERE av.advertisement_id = a.id
              AND av.available_date >= CURRENT_DATE
          )
        )
    ),
    with_ratings AS (
      SELECT 
        fa.*,
        COALESCE(
          (SELECT AVG(r.rating) FROM public.reviews r WHERE r.reviewee_id = fa.owner_id),
          0
        ) as calculated_rating,
        COALESCE(
          (SELECT COUNT(*) FROM public.reviews r WHERE r.reviewee_id = fa.owner_id),
          0
        ) as calculated_reviews_count
      FROM filtered_ads fa
    )
    SELECT
      wr.id,
      wr.title::text,
      wr.location_city::text,
      wr.price_per_hour,
      wr.experience::text,
      wr.skills::text[],
      wr.availability_start_time,
      wr.availability_end_time,
      wr.owner_id,
      wr.owner_full_name,
      wr.owner_member_since,
      wr.owner_picture,
      wr.calculated_rating,
      wr.calculated_reviews_count::int,
      COALESCE((
        SELECT array_agg(al.label ORDER BY al.order_index)
        FROM public.advertisement_locations al
        WHERE al.advertisement_id = wr.id
      ), '{}'::text[]) as locations
    FROM with_ratings wr
    WHERE 
      -- Rating filter
      (p_min_rating IS NULL OR wr.calculated_rating >= p_min_rating)
      -- Has reviews filter
      AND (p_has_reviews = FALSE OR wr.calculated_reviews_count > 0)
      -- Verified filter (for now, just check if has reviews)
      AND (p_verified_only = FALSE OR wr.calculated_reviews_count > 0)
    ORDER BY wr.created_at DESC;

  -- Case 2: With date filters
  ELSE
    RETURN QUERY
    WITH base AS (
      SELECT 
        a.*,
        u.id as owner_id,
        TRIM(COALESCE(u.name,'') || ' ' || COALESCE(u.surname,'')) as owner_full_name,
        u.created_at as owner_member_since,
        u.picture as owner_picture,
        u.user_type as owner_user_type
      FROM public.advertisements a
      JOIN public.users u ON u.id = a.user_id
      WHERE a.is_active = TRUE
        AND (p_location IS NULL OR a.location_city ILIKE '%' || p_location || '%')
        AND (p_price_min IS NULL OR a.price_per_hour >= p_price_min)
        AND (p_price_max IS NULL OR a.price_per_hour <= p_price_max)
        AND (p_skills IS NULL OR p_skills <@ a.skills)
        AND (
          viewer_type IS NULL
          OR (viewer_type = 'parent' AND u.user_type = 'nanny')
          OR (viewer_type = 'nanny' AND u.user_type = 'parent')
        )
        AND ((SELECT auth.uid()) IS NULL OR a.user_id <> (SELECT auth.uid()))
    ),
    eligible AS (
      SELECT b.*
      FROM base b
      WHERE EXISTS (
        SELECT 1 FROM public.advertisement_availability av
        WHERE av.advertisement_id = b.id
          AND av.available_date BETWEEN p_start_date AND p_end_date
      )
    ),
    with_ratings AS (
      SELECT 
        e.*,
        COALESCE(
          (SELECT AVG(r.rating) FROM public.reviews r WHERE r.reviewee_id = e.owner_id),
          0
        ) as calculated_rating,
        COALESCE(
          (SELECT COUNT(*) FROM public.reviews r WHERE r.reviewee_id = e.owner_id),
          0
        ) as calculated_reviews_count
      FROM eligible e
    )
    SELECT
      wr.id,
      wr.title::text,
      wr.location_city::text,
      wr.price_per_hour,
      wr.experience::text,
      wr.skills::text[],
      wr.availability_start_time,
      wr.availability_end_time,
      wr.owner_id,
      wr.owner_full_name::text,
      wr.owner_member_since,
      wr.owner_picture::text,
      wr.calculated_rating,
      wr.calculated_reviews_count::int,
      COALESCE((
        SELECT array_agg(al.label ORDER BY al.order_index)
        FROM public.advertisement_locations al
        WHERE al.advertisement_id = wr.id
      ), '{}'::text[]) as locations
    FROM with_ratings wr
    WHERE 
      (p_min_rating IS NULL OR wr.calculated_rating >= p_min_rating)
      AND (p_has_reviews = FALSE OR wr.calculated_reviews_count > 0)
      AND (p_verified_only = FALSE OR wr.calculated_reviews_count > 0)
    ORDER BY wr.created_at DESC;
  END IF;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.search_ads(
  text, date, date, text, numeric, numeric, text[], numeric, boolean, boolean
) TO anon, authenticated;

-- Create index on price for better performance
CREATE INDEX IF NOT EXISTS idx_advertisements_price ON public.advertisements(price_per_hour);

-- Create GIN index on skills array for better performance
CREATE INDEX IF NOT EXISTS idx_advertisements_skills ON public.advertisements USING GIN(skills);

