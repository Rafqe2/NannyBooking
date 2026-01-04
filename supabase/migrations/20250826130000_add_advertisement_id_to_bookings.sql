-- Add advertisement_id to bookings table for review system integration
-- This allows linking bookings back to the advertisement they were created from

-- Add advertisement_id column to bookings table
ALTER TABLE public.bookings
  ADD COLUMN IF NOT EXISTS advertisement_id UUID REFERENCES public.advertisements(id) ON DELETE SET NULL;

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_bookings_advertisement_id ON public.bookings(advertisement_id);

-- Update create_booking_from_ad to store advertisement_id
CREATE OR REPLACE FUNCTION public.create_booking_from_ad(
  p_ad_id uuid,
  p_date date,
  p_start time,
  p_end time,
  p_message text default null
) returns uuid
language plpgsql security definer set search_path = public, pg_temp as $$
declare
  v_uid uuid := (select auth.uid());
  v_owner uuid;
  v_owner_type text;
  v_price numeric;
  v_parent uuid;
  v_nanny uuid;
  v_booking_id uuid;
  v_hours numeric;
  v_amount numeric(10,2);
  v_user_location text;
begin
  if v_uid is null then raise exception 'not authenticated'; end if;
  if p_end <= p_start then raise exception 'end must be after start'; end if;

  select a.user_id, u.user_type, a.price_per_hour::numeric
  into v_owner, v_owner_type, v_price
  from public.advertisements a
  join public.users u on u.id = a.user_id
  where a.id = p_ad_id and a.is_active = true;
  if not found then raise exception 'advertisement not found or inactive'; end if;
  if v_owner = v_uid then raise exception 'cannot book own advertisement'; end if;

  -- Check for existing booking conflicts for the same user on the same date/time range
  if exists (
    select 1 from public.bookings b
    join public.nannies n on n.id = b.nanny_id
    where b.status = 'confirmed'
      and b.start_date = p_date
      and (
        (v_owner_type = 'nanny' and b.parent_id = v_uid) or
        (v_owner_type = 'parent' and n.user_id = v_uid)
      )
      and (
        (p_start >= b.start_time and p_start < b.end_time) or
        (p_end > b.start_time and p_end <= b.end_time) or
        (p_start <= b.start_time and p_end >= b.end_time)
      )
  ) then
    raise exception 'BOOKING_CONFLICT: You already have a booking for this time slot. Please check your existing bookings.';
  end if;

  if v_owner_type = 'nanny' then
    v_parent := v_uid;
    select id into v_nanny from public.nannies where user_id = v_owner;
    if v_nanny is null then raise exception 'nanny profile not found'; end if;
  elsif v_owner_type = 'parent' then
    v_parent := v_owner;
    select id into v_nanny from public.nannies where user_id = v_uid;
    if v_nanny is null then raise exception 'nanny profile not found for requester'; end if;
  else
    raise exception 'invalid advertisement owner type';
  end if;

  v_hours := extract(epoch from (p_end - p_start)) / 3600.0;
  v_amount := round(coalesce(v_price,0) * v_hours, 2);

  -- Now include advertisement_id in the insert
  insert into public.bookings (
    nanny_id, parent_id, start_date, end_date, start_time, end_time, message, total_amount, status, advertisement_id
  ) values (
    v_nanny, v_parent, p_date, p_date, p_start, p_end, p_message, v_amount, 'pending', p_ad_id
  ) returning id into v_booking_id;

  return v_booking_id;
end; $$;

-- Update get_my_bookings to include advertisement_id, counterparty_id, and has_review
DROP FUNCTION IF EXISTS public.get_my_bookings();
CREATE OR REPLACE FUNCTION public.get_my_bookings()
RETURNS TABLE (
  id uuid,
  booking_date date,
  start_time time,
  end_time time,
  status character varying(20),
  message text,
  total_amount numeric,
  counterparty_full_name text,
  counterparty_id uuid,
  advertisement_id uuid,
  has_review boolean,
  created_at timestamptz,
  updated_at timestamptz,
  cancellation_reason text,
  cancellation_note text,
  cancelled_at timestamptz,
  cancelled_by uuid
)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
DECLARE
  v_uid uuid := (SELECT auth.uid());
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'not authenticated'; END IF;

  RETURN QUERY
  SELECT 
    b.id,
    b.start_date AS booking_date,
    b.start_time,
    b.end_time,
    b.status,
    b.message,
    b.total_amount,
    -- Get counterparty name (parent or nanny depending on user's role)
    CASE 
      WHEN b.parent_id = v_uid THEN 
        -- Current user is parent, get nanny name
        COALESCE(
          (SELECT u.name || ' ' || COALESCE(u.surname, '') 
           FROM users u 
           JOIN nannies n ON n.user_id = u.id 
           WHERE n.id = b.nanny_id),
          'Unknown Nanny'
        )
      ELSE 
        -- Current user is nanny, get parent name  
        COALESCE(
          (SELECT u.name || ' ' || COALESCE(u.surname, '') 
           FROM users u 
           WHERE u.id = b.parent_id),
          'Unknown Parent'
        )
    END AS counterparty_full_name,
    -- Get counterparty_id (the user being reviewed)
    CASE 
      WHEN b.parent_id = v_uid THEN 
        -- Current user is parent, counterparty is nanny
        (SELECT n.user_id FROM nannies n WHERE n.id = b.nanny_id)
      ELSE 
        -- Current user is nanny, counterparty is parent
        b.parent_id
    END AS counterparty_id,
    -- Get advertisement_id
    b.advertisement_id,
    -- Check if review already exists for this booking
    EXISTS (
      SELECT 1 FROM public.reviews r
      WHERE r.booking_id = b.id
      AND r.reviewer_id = v_uid
    ) AS has_review,
    b.created_at,
    b.updated_at,
    b.cancellation_reason,
    b.cancellation_note,
    b.cancelled_at,
    b.cancelled_by
  FROM bookings b
  WHERE 
    b.parent_id = v_uid 
    OR 
    b.nanny_id IN (SELECT n.id FROM nannies n WHERE n.user_id = v_uid)
  ORDER BY b.created_at DESC;
END; $$;

REVOKE ALL ON FUNCTION public.get_my_bookings() FROM public;
GRANT EXECUTE ON FUNCTION public.get_my_bookings() TO authenticated;

-- Success message
DO $$
BEGIN
  RAISE NOTICE 'Bookings table extended with advertisement_id! ✅';
  RAISE NOTICE 'get_my_bookings now returns: advertisement_id, counterparty_id, has_review';
END $$;

