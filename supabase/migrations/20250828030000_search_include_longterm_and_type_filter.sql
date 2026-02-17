-- Update search_ads to:
-- 1. Include long-term ads even when date filters are active
-- 2. Add p_ad_type filter parameter for filtering by short-term/long-term

DROP FUNCTION IF EXISTS public.search_ads(text, date, date, text, numeric, numeric, text[], numeric, boolean, boolean, text[]);

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
  p_verified_only boolean DEFAULT FALSE,
  p_nearby_locations text[] DEFAULT NULL,
  p_ad_type text DEFAULT NULL
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
  nearby_patterns text[];
BEGIN
  -- Normalize date range
  IF p_start_date IS NOT NULL AND p_end_date IS NULL THEN
    p_end_date := p_start_date;
  END IF;

  -- Pre-compute nearby ILIKE patterns
  IF p_nearby_locations IS NOT NULL THEN
    SELECT array_agg('%' || loc || '%')
    INTO nearby_patterns
    FROM unnest(p_nearby_locations) AS loc;
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
        u.user_type as owner_user_type,
        CASE
          WHEN p_location IS NULL THEN 0
          WHEN a.location_city ILIKE '%' || p_location || '%' THEN 0
          WHEN EXISTS (
            SELECT 1 FROM public.advertisement_locations al
            WHERE al.advertisement_id = a.id
              AND al.label ILIKE '%' || p_location || '%'
          ) THEN 0
          ELSE 1
        END as match_rank
      FROM public.advertisements a
      JOIN public.users u ON u.id = a.user_id
      WHERE a.is_active = TRUE
        AND (
          p_location IS NULL
          OR a.location_city ILIKE '%' || p_location || '%'
          OR EXISTS (
            SELECT 1 FROM public.advertisement_locations al
            WHERE al.advertisement_id = a.id
              AND al.label ILIKE '%' || p_location || '%'
          )
          OR (nearby_patterns IS NOT NULL AND (
            a.location_city ILIKE ANY(nearby_patterns)
            OR EXISTS (
              SELECT 1 FROM public.advertisement_locations al
              WHERE al.advertisement_id = a.id
                AND al.label ILIKE ANY(nearby_patterns)
            )
          ))
        )
        AND (p_price_min IS NULL OR a.price_per_hour >= p_price_min)
        AND (p_price_max IS NULL OR a.price_per_hour <= p_price_max)
        AND (p_skills IS NULL OR p_skills <@ a.skills)
        AND (
          viewer_type IS NULL
          OR (viewer_type = 'parent' AND u.user_type = 'nanny')
          OR (viewer_type = 'nanny' AND u.user_type = 'parent')
        )
        AND ((SELECT auth.uid()) IS NULL OR a.user_id <> (SELECT auth.uid()))
        -- Ad type filter
        AND (p_ad_type IS NULL OR a.type = p_ad_type)
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
      (p_min_rating IS NULL OR wr.calculated_rating >= p_min_rating)
      AND (p_has_reviews = FALSE OR wr.calculated_reviews_count > 0)
      AND (p_verified_only = FALSE OR wr.calculated_reviews_count > 0)
    ORDER BY wr.match_rank, wr.created_at DESC;

  -- Case 2: With date filters - also include long-term ads
  ELSE
    RETURN QUERY
    WITH base AS (
      SELECT
        a.*,
        u.id as owner_id,
        TRIM(COALESCE(u.name,'') || ' ' || COALESCE(u.surname,'')) as owner_full_name,
        u.created_at as owner_member_since,
        u.picture as owner_picture,
        u.user_type as owner_user_type,
        CASE
          WHEN p_location IS NULL THEN 0
          WHEN a.location_city ILIKE '%' || p_location || '%' THEN 0
          WHEN EXISTS (
            SELECT 1 FROM public.advertisement_locations al
            WHERE al.advertisement_id = a.id
              AND al.label ILIKE '%' || p_location || '%'
          ) THEN 0
          ELSE 1
        END as match_rank
      FROM public.advertisements a
      JOIN public.users u ON u.id = a.user_id
      WHERE a.is_active = TRUE
        AND (
          p_location IS NULL
          OR a.location_city ILIKE '%' || p_location || '%'
          OR EXISTS (
            SELECT 1 FROM public.advertisement_locations al
            WHERE al.advertisement_id = a.id
              AND al.label ILIKE '%' || p_location || '%'
          )
          OR (nearby_patterns IS NOT NULL AND (
            a.location_city ILIKE ANY(nearby_patterns)
            OR EXISTS (
              SELECT 1 FROM public.advertisement_locations al
              WHERE al.advertisement_id = a.id
                AND al.label ILIKE ANY(nearby_patterns)
            )
          ))
        )
        AND (p_price_min IS NULL OR a.price_per_hour >= p_price_min)
        AND (p_price_max IS NULL OR a.price_per_hour <= p_price_max)
        AND (p_skills IS NULL OR p_skills <@ a.skills)
        AND (
          viewer_type IS NULL
          OR (viewer_type = 'parent' AND u.user_type = 'nanny')
          OR (viewer_type = 'nanny' AND u.user_type = 'parent')
        )
        AND ((SELECT auth.uid()) IS NULL OR a.user_id <> (SELECT auth.uid()))
        -- Ad type filter
        AND (p_ad_type IS NULL OR a.type = p_ad_type)
    ),
    eligible AS (
      SELECT b.*
      FROM base b
      WHERE
        -- Long-term ads are always eligible (they don't have date slots)
        b.type = 'long-term'
        OR EXISTS (
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
    ORDER BY wr.match_rank, wr.created_at DESC;

  END IF;
END;
$$;

GRANT EXECUTE ON FUNCTION public.search_ads(
  text, date, date, text, numeric, numeric, text[], numeric, boolean, boolean, text[], text
) TO anon, authenticated;
