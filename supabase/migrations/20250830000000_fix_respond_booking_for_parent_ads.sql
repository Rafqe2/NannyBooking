-- Fix respond_booking to allow the ad owner (parent or nanny) to confirm bookings.
-- Previously, only the user stored in nanny_id could confirm. This broke parent ads
-- where the parent is the ad owner and should confirm nanny applicants.
--
-- Also updates get_my_bookings to return ad_owner_id so the UI knows who can confirm.

-- 1. Fix respond_booking: allow ad owner to confirm regardless of parent/nanny role
CREATE OR REPLACE FUNCTION public.respond_booking(
  p_booking_id uuid,
  p_action text
) returns void
language plpgsql security definer set search_path = public, pg_temp as $$
declare
  v_uid uuid := (select auth.uid());
  v_parent_user_id uuid;
  v_nanny_user_id uuid;
  v_status text;
  v_advertisement_id uuid;
  v_ad_owner uuid;
begin
  if v_uid is null then raise exception 'not authenticated'; end if;

  select b.parent_id, b.nanny_id, b.status, b.advertisement_id
  into v_parent_user_id, v_nanny_user_id, v_status, v_advertisement_id
  from public.bookings b
  where b.id = p_booking_id;

  if not found then raise exception 'booking not found'; end if;
  if v_status <> 'pending' then raise exception 'booking not pending'; end if;

  -- Verify caller is a participant
  if v_uid <> v_nanny_user_id and v_uid <> v_parent_user_id then
    raise exception 'not a participant';
  end if;

  -- Look up the ad owner (the user who created the advertisement)
  if v_advertisement_id is not null then
    select user_id into v_ad_owner
    from public.advertisements
    where id = v_advertisement_id;
  end if;

  -- Fallback: if ad is gone, treat nanny_id as owner (backwards compat)
  if v_ad_owner is null then
    v_ad_owner := v_nanny_user_id;
  end if;

  if p_action = 'confirm' then
    -- Only the ad owner can confirm/accept a booking
    if v_uid <> v_ad_owner then
      raise exception 'only the ad owner can confirm this booking';
    end if;
    update public.bookings set status = 'confirmed', updated_at = now() where id = p_booking_id;
  elsif p_action = 'cancel' then
    -- Both participants can cancel/decline a pending booking
    update public.bookings set status = 'cancelled', updated_at = now() where id = p_booking_id;
  else
    raise exception 'invalid action';
  end if;
end; $$;

REVOKE ALL ON FUNCTION public.respond_booking(uuid, text) FROM public;
GRANT EXECUTE ON FUNCTION public.respond_booking(uuid, text) TO authenticated;

-- 2. Update get_my_bookings to include ad_owner_id so UI knows who can confirm
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
  ad_owner_id uuid,
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
          'Unknown'
        )
      ELSE
        COALESCE(
          (SELECT u.name || ' ' || COALESCE(u.surname, '')
           FROM users u
           WHERE u.id = b.parent_id),
          'Unknown'
        )
    END AS counterparty_full_name,
    CASE
      WHEN b.parent_id = v_uid THEN b.nanny_id
      ELSE b.parent_id
    END AS counterparty_id,
    b.advertisement_id,
    COALESCE(
      (SELECT a.type FROM advertisements a WHERE a.id = b.advertisement_id),
      'short-term'
    )::text AS ad_type,
    -- The user who created the advertisement (can confirm bookings)
    COALESCE(
      (SELECT a.user_id FROM advertisements a WHERE a.id = b.advertisement_id),
      b.nanny_id -- fallback for old bookings without advertisement
    ) AS ad_owner_id,
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
