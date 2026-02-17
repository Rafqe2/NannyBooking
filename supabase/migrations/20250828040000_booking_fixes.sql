-- 1. Add ad_type to get_my_bookings so UI can distinguish long-term bookings
-- 2. Enforce one active booking per user per advertisement

-- Update get_my_bookings to include ad_type
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
  ad_type text,
  has_review boolean,
  created_at timestamptz,
  updated_at timestamptz,
  cancellation_reason text,
  cancellation_note text,
  cancelled_at timestamptz,
  cancelled_by uuid,
  parent_id uuid,
  nanny_id uuid
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
    CASE
      WHEN b.parent_id = v_uid THEN
        COALESCE(
          (SELECT u.name || ' ' || COALESCE(u.surname, '')
           FROM users u
           WHERE u.id = b.nanny_id),
          'Unknown Nanny'
        )
      ELSE
        COALESCE(
          (SELECT u.name || ' ' || COALESCE(u.surname, '')
           FROM users u
           WHERE u.id = b.parent_id),
          'Unknown Parent'
        )
    END AS counterparty_full_name,
    CASE
      WHEN b.parent_id = v_uid THEN b.nanny_id
      ELSE b.parent_id
    END AS counterparty_id,
    b.advertisement_id,
    -- Get the ad type from the advertisement
    COALESCE(
      (SELECT a.type FROM advertisements a WHERE a.id = b.advertisement_id),
      'short-term'
    )::text AS ad_type,
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
    b.cancelled_by,
    b.parent_id,
    b.nanny_id
  FROM bookings b
  WHERE
    b.parent_id = v_uid
    OR
    b.nanny_id = v_uid
  ORDER BY b.created_at DESC;
END; $$;

REVOKE ALL ON FUNCTION public.get_my_bookings() FROM public;
GRANT EXECUTE ON FUNCTION public.get_my_bookings() TO authenticated;

-- Update create_booking_from_ad to enforce one active booking per user per ad
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
  v_parent_user_id uuid;
  v_nanny_user_id uuid;
  v_booking_id uuid;
  v_hours numeric;
  v_amount numeric(10,2);
begin
  if v_uid is null then raise exception 'not authenticated'; end if;
  if p_end <= p_start then raise exception 'end must be after start'; end if;

  -- Get advertisement owner info
  select a.user_id, u.user_type, a.price_per_hour::numeric
  into v_owner, v_owner_type, v_price
  from public.advertisements a
  join public.users u on u.id = a.user_id
  where a.id = p_ad_id and a.is_active = true;
  if not found then raise exception 'advertisement not found or inactive'; end if;
  if v_owner = v_uid then raise exception 'cannot book own advertisement'; end if;

  -- Determine parent and nanny user IDs based on advertisement owner type
  if v_owner_type = 'nanny' then
    declare
      v_requester_type text;
    begin
      select user_type into v_requester_type
      from public.users
      where id = v_uid;
      if not found then raise exception 'requester user not found'; end if;
      if v_requester_type <> 'parent' then
        raise exception 'only parents can book nanny advertisements';
      end if;
    end;
    v_parent_user_id := v_uid;
    v_nanny_user_id := v_owner;
  elsif v_owner_type = 'parent' then
    declare
      v_requester_type text;
    begin
      select user_type into v_requester_type
      from public.users
      where id = v_uid;
      if not found then raise exception 'requester user not found'; end if;
      if v_requester_type <> 'nanny' then
        raise exception 'only nannies can book parent advertisements';
      end if;
    end;
    v_parent_user_id := v_owner;
    v_nanny_user_id := v_uid;
  else
    raise exception 'invalid advertisement owner type';
  end if;

  -- Check for existing active booking for same user + same ad + same date
  if exists (
    select 1 from public.bookings b
    where b.advertisement_id = p_ad_id
      and b.start_date = p_date
      and b.status in ('pending', 'confirmed')
      and b.parent_id = v_parent_user_id
      and b.nanny_id = v_nanny_user_id
  ) then
    raise exception 'BOOKING_CONFLICT: You already have a pending or confirmed booking for this date.';
  end if;

  -- Limit to 5 active bookings per person
  if (
    select count(*) from public.bookings b
    where (b.parent_id = v_uid or b.nanny_id = v_uid)
      and b.status in ('pending', 'confirmed')
  ) >= 5 then
    raise exception 'BOOKING_LIMIT: You have reached the maximum of 5 active bookings. Please complete or cancel existing bookings first.';
  end if;

  v_hours := extract(epoch from (p_end - p_start)) / 3600.0;
  v_amount := round(coalesce(v_price,0) * v_hours, 2);

  -- Insert booking
  insert into public.bookings (
    nanny_id, parent_id, start_date, end_date, start_time, end_time, message, total_amount, status, advertisement_id
  ) values (
    v_nanny_user_id, v_parent_user_id, p_date, p_date, p_start, p_end, p_message, v_amount, 'pending', p_ad_id
  ) returning id into v_booking_id;

  return v_booking_id;
end; $$;

REVOKE ALL ON FUNCTION public.create_booking_from_ad(uuid, date, time, time, text) FROM public;
GRANT EXECUTE ON FUNCTION public.create_booking_from_ad(uuid, date, time, time, text) TO authenticated;
