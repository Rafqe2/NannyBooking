-- Fix auto_deactivate_fully_booked_ads and get_filtered_ad_availability to not reference
-- the removed nannies table. Since bookings.nanny_id now stores the nanny's user_id directly
-- (changed in 20250827000000_remove_nannies_table_dependency), the join simplifies to:
--   aa.user_id = b.nanny_id OR aa.user_id = b.parent_id

CREATE OR REPLACE FUNCTION public.auto_deactivate_fully_booked_ads()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  -- Deactivate short-term ads that have no availability slots with >= 4 hours remaining
  UPDATE public.advertisements
  SET is_active = false
  WHERE is_active = true
    AND type = 'short-term'
    AND NOT EXISTS (
      SELECT 1
      FROM public.advertisement_availability av
      LEFT JOIN (
        SELECT
          aa.id AS advertisement_id,
          b.start_date AS booking_date,
          SUM(
            EXTRACT(epoch FROM (b.end_time - b.start_time)) / 3600
          ) AS total_booked_hours
        FROM public.bookings b
        JOIN public.advertisements aa ON (
          aa.user_id = b.nanny_id
          OR
          aa.user_id = b.parent_id
        )
        WHERE b.status = 'confirmed'
        GROUP BY aa.id, b.start_date
      ) booked ON booked.advertisement_id = av.advertisement_id
        AND booked.booking_date = av.available_date
      WHERE av.advertisement_id = advertisements.id
        AND av.available_date >= CURRENT_DATE
        AND (
          EXTRACT(epoch FROM (av.end_time - av.start_time)) / 3600
          - COALESCE(booked.total_booked_hours, 0)
        ) >= 4
    );
END;
$$;

GRANT EXECUTE ON FUNCTION public.auto_deactivate_fully_booked_ads() TO authenticated;

-- Also fix get_filtered_ad_availability which has the same nannies reference
DROP FUNCTION IF EXISTS public.get_filtered_ad_availability(uuid);
CREATE OR REPLACE FUNCTION public.get_filtered_ad_availability(
  p_ad_id uuid
)
RETURNS TABLE (
  available_date date,
  start_time time,
  end_time time,
  remaining_hours numeric
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  RETURN QUERY
  SELECT
    av.available_date,
    av.start_time,
    av.end_time,
    (
      EXTRACT(epoch FROM (av.end_time - av.start_time)) / 3600
      - COALESCE(booked.total_booked_hours, 0)
    ) AS remaining_hours
  FROM public.advertisement_availability av
  LEFT JOIN (
    SELECT
      aa.id AS advertisement_id,
      b.start_date AS booking_date,
      SUM(
        EXTRACT(epoch FROM (b.end_time - b.start_time)) / 3600
      ) AS total_booked_hours
    FROM public.bookings b
    JOIN public.advertisements aa ON (
      aa.user_id = b.nanny_id
      OR
      aa.user_id = b.parent_id
    )
    WHERE b.status = 'confirmed'
      AND aa.id = p_ad_id
    GROUP BY aa.id, b.start_date
  ) booked ON booked.advertisement_id = av.advertisement_id
    AND booked.booking_date = av.available_date
  WHERE av.advertisement_id = p_ad_id
    AND av.available_date >= CURRENT_DATE
    AND (
      EXTRACT(epoch FROM (av.end_time - av.start_time)) / 3600
      - COALESCE(booked.total_booked_hours, 0)
    ) >= 4
  ORDER BY av.available_date, av.start_time;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_filtered_ad_availability(uuid) TO anon, authenticated;

DO $$
BEGIN
  RAISE NOTICE 'Fixed auto_deactivate_fully_booked_ads and get_filtered_ad_availability to not reference nannies table ✅';
END $$;
