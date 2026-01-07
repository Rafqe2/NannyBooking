-- Remove dependency on nannies table - use users table with user_type instead
-- This migration updates all booking functions to work directly with users table

-- Step 1: Update create_booking_from_ad to use user_id directly instead of nannies table
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

  -- Verify requester user exists and get type
  declare
    v_requester_type text;
  begin
    select user_type into v_requester_type
    from public.users
    where id = v_uid;
    if not found then raise exception 'requester user not found'; end if;
  end;

  -- Determine parent and nanny user IDs based on advertisement owner type
  if v_owner_type = 'nanny' then
    -- Owner is nanny, requester must be parent
    declare
      v_requester_type text;
    begin
      select user_type into v_requester_type
      from public.users
      where id = v_uid;
      if v_requester_type <> 'parent' then
        raise exception 'only parents can book nanny advertisements';
      end if;
    end;
    v_parent_user_id := v_uid;
    v_nanny_user_id := v_owner;
  elsif v_owner_type = 'parent' then
    -- Owner is parent, requester must be nanny
    declare
      v_requester_type text;
    begin
      select user_type into v_requester_type
      from public.users
      where id = v_uid;
      if v_requester_type <> 'nanny' then
        raise exception 'only nannies can book parent advertisements';
      end if;
    end;
    v_parent_user_id := v_owner;
    v_nanny_user_id := v_uid;
  else
    raise exception 'invalid advertisement owner type';
  end if;

  -- Check for existing booking conflicts for the same user on the same date/time range
  if exists (
    select 1 from public.bookings b
    where b.status = 'confirmed'
      and b.start_date = p_date
      and (
        -- If owner is nanny: check if parent already has a booking with this nanny
        (v_owner_type = 'nanny' and b.parent_id = v_uid and b.nanny_id = v_nanny_user_id) or
        -- If owner is parent: check if nanny already has a booking with this parent
        (v_owner_type = 'parent' and b.nanny_id = v_uid and b.parent_id = v_parent_user_id)
      )
      and (
        (p_start >= b.start_time and p_start < b.end_time) or
        (p_end > b.start_time and p_end <= b.end_time) or
        (p_start <= b.start_time and p_end >= b.end_time)
      )
  ) then
    raise exception 'BOOKING_CONFLICT: You already have a booking for this time slot. Please check your existing bookings.';
  end if;

  v_hours := extract(epoch from (p_end - p_start)) / 3600.0;
  v_amount := round(coalesce(v_price,0) * v_hours, 2);

  -- Insert booking with nanny_id storing user_id directly
  insert into public.bookings (
    nanny_id, parent_id, start_date, end_date, start_time, end_time, message, total_amount, status, advertisement_id
  ) values (
    v_nanny_user_id, v_parent_user_id, p_date, p_date, p_start, p_end, p_message, v_amount, 'pending', p_ad_id
  ) returning id into v_booking_id;

  return v_booking_id;
end; $$;

-- Step 2: Update get_my_bookings to work with user_id directly
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
           WHERE u.id = b.nanny_id),
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
        b.nanny_id
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
    b.nanny_id = v_uid
  ORDER BY b.created_at DESC;
END; $$;

REVOKE ALL ON FUNCTION public.get_my_bookings() FROM public;
GRANT EXECUTE ON FUNCTION public.get_my_bookings() TO authenticated;

-- Step 3: Update respond_booking function
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
begin
  if v_uid is null then raise exception 'not authenticated'; end if;
  
  select b.parent_id, b.nanny_id, b.status
  into v_parent_user_id, v_nanny_user_id, v_status
  from public.bookings b
  where b.id = p_booking_id;
  
  if not found then raise exception 'booking not found'; end if;
  if v_status <> 'pending' then raise exception 'booking not pending'; end if;

  if p_action = 'confirm' then
    if v_uid <> v_nanny_user_id and v_uid <> v_parent_user_id then 
      raise exception 'not a participant'; 
    end if;
    if v_uid = v_nanny_user_id then
      update public.bookings set status = 'confirmed' where id = p_booking_id;
    else
      raise exception 'only nanny can confirm';
    end if;
  elsif p_action = 'cancel' then
    if v_uid <> v_nanny_user_id and v_uid <> v_parent_user_id then 
      raise exception 'not a participant'; 
    end if;
    update public.bookings set status = 'cancelled' where id = p_booking_id;
  else
    raise exception 'invalid action';
  end if;
end; $$;

REVOKE ALL ON FUNCTION public.respond_booking(uuid, text) FROM public;
GRANT EXECUTE ON FUNCTION public.respond_booking(uuid, text) TO authenticated;

-- Step 4: Update RLS policies to use user_id directly instead of nannies table
DROP POLICY IF EXISTS bookings_select_participants ON public.bookings;
DROP POLICY IF EXISTS bookings_insert_participants ON public.bookings;
DROP POLICY IF EXISTS bookings_update_participants ON public.bookings;

CREATE POLICY bookings_select_participants ON public.bookings
  FOR SELECT USING (
    (SELECT auth.uid()) = parent_id 
    OR 
    (SELECT auth.uid()) = nanny_id
  );

CREATE POLICY bookings_insert_participants ON public.bookings
  FOR INSERT WITH CHECK (
    (SELECT auth.uid()) = parent_id 
    OR 
    (SELECT auth.uid()) = nanny_id
  );

CREATE POLICY bookings_update_participants ON public.bookings
  FOR UPDATE USING (
    (SELECT auth.uid()) = parent_id 
    OR 
    (SELECT auth.uid()) = nanny_id
  ) WITH CHECK (
    (SELECT auth.uid()) = parent_id 
    OR 
    (SELECT auth.uid()) = nanny_id
  );

-- Step 5: Update get_pending_booking_count_for_me function
DROP FUNCTION IF EXISTS public.get_pending_booking_count_for_me();
CREATE OR REPLACE FUNCTION public.get_pending_booking_count_for_me()
RETURNS integer
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
DECLARE
  v_uid uuid := (SELECT auth.uid());
  v_count integer;
BEGIN
  IF v_uid IS NULL THEN RETURN 0; END IF;
  
  SELECT COUNT(*) INTO v_count
  FROM public.bookings b
  WHERE b.status = 'pending'
    AND (
      b.parent_id = v_uid 
      OR 
      b.nanny_id = v_uid
    );
  
  RETURN COALESCE(v_count, 0);
END; $$;

REVOKE ALL ON FUNCTION public.get_pending_booking_count_for_me() FROM public;
GRANT EXECUTE ON FUNCTION public.get_pending_booking_count_for_me() TO authenticated;

-- Step 6: Update cancel_booking_with_reason function
CREATE OR REPLACE FUNCTION public.cancel_booking_with_reason(
  p_booking_id uuid,
  p_reason text,
  p_note text
) returns void
language plpgsql security definer set search_path = public, pg_temp as $$
declare
  v_uid uuid := (select auth.uid());
  v_parent_user_id uuid;
  v_nanny_user_id uuid;
  v_status text;
begin
  if v_uid is null then raise exception 'not authenticated'; end if;
  if trim(p_reason) = '' then raise exception 'cancellation reason is required'; end if;
  if length(trim(p_note)) < 10 then raise exception 'cancellation note must be at least 10 characters'; end if;

  -- Get booking details and verify user has permission
  select b.parent_id, b.nanny_id, b.status
  into v_parent_user_id, v_nanny_user_id, v_status
  from public.bookings b
  where b.id = p_booking_id;

  if not found then
    raise exception 'booking not found';
  end if;

  -- Only allow parent or nanny to cancel
  if v_uid != v_parent_user_id and v_uid != v_nanny_user_id then
    raise exception 'not authorized to cancel this booking';
  end if;

  -- Only allow cancellation of confirmed bookings (pending should be deleted permanently)
  if v_status != 'confirmed' then
    raise exception 'can only cancel confirmed bookings with reason. Pending bookings should be deleted.';
  end if;

  -- Update booking with cancellation details
  update public.bookings
  set 
    status = 'cancelled',
    cancellation_reason = trim(p_reason),
    cancellation_note = trim(p_note),
    cancelled_at = now(),
    cancelled_by = v_uid,
    updated_at = now()
  where id = p_booking_id;

  if not found then
    raise exception 'failed to cancel booking';
  end if;
end; $$;

REVOKE ALL ON FUNCTION public.cancel_booking_with_reason(uuid, text, text) FROM public;
GRANT EXECUTE ON FUNCTION public.cancel_booking_with_reason(uuid, text, text) TO authenticated;

-- Step 7: Update delete_pending_booking function
CREATE OR REPLACE FUNCTION public.delete_pending_booking(
  p_booking_id uuid
) returns void
language plpgsql security definer set search_path = public, pg_temp as $$
declare
  v_uid uuid := (select auth.uid());
  v_parent_user_id uuid;
  v_nanny_user_id uuid;
  v_status text;
begin
  if v_uid is null then raise exception 'not authenticated'; end if;

  -- Get booking details and verify user has permission
  select b.parent_id, b.nanny_id, b.status
  into v_parent_user_id, v_nanny_user_id, v_status
  from public.bookings b
  where b.id = p_booking_id;

  if not found then
    raise exception 'booking not found';
  end if;

  -- Only allow parent or nanny to delete
  if v_uid != v_parent_user_id and v_uid != v_nanny_user_id then
    raise exception 'not authorized to delete this booking';
  end if;

  -- Only allow deletion of pending bookings
  if v_status != 'pending' then
    raise exception 'can only delete pending bookings. Confirmed bookings must be cancelled with reason.';
  end if;

  -- Permanently delete the booking
  delete from public.bookings where id = p_booking_id;

  if not found then
    raise exception 'failed to delete booking';
  end if;
end; $$;

REVOKE ALL ON FUNCTION public.delete_pending_booking(uuid) FROM public;
GRANT EXECUTE ON FUNCTION public.delete_pending_booking(uuid) TO authenticated;

-- Step 8: Update reviews RLS policies to use user_id directly instead of nannies table
DROP POLICY IF EXISTS "reviews_insert_own" ON public.reviews;
CREATE POLICY "reviews_insert_own" ON public.reviews
  FOR INSERT WITH CHECK (
    (SELECT auth.uid()) = reviewer_id
    AND EXISTS (
      SELECT 1 FROM public.bookings b
      WHERE b.id = booking_id
      AND b.status = 'completed'
      AND (
        b.parent_id = (SELECT auth.uid())
        OR b.nanny_id = (SELECT auth.uid())
      )
    )
  );

-- Step 9: Update can_user_review function if it exists
DROP FUNCTION IF EXISTS public.can_user_review(UUID);
CREATE OR REPLACE FUNCTION public.can_user_review(p_booking_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
DECLARE
  v_uid uuid := (SELECT auth.uid());
  v_booking_parent_id uuid;
  v_booking_nanny_id uuid;
  v_booking_status text;
BEGIN
  IF v_uid IS NULL THEN RETURN FALSE; END IF;

  -- Get booking details
  SELECT b.parent_id, b.nanny_id, b.status
  INTO v_booking_parent_id, v_booking_nanny_id, v_booking_status
  FROM public.bookings b
  WHERE b.id = p_booking_id;

  IF NOT FOUND THEN RETURN FALSE; END IF;

  -- Booking must be completed
  IF v_booking_status <> 'completed' THEN RETURN FALSE; END IF;

  -- User must be a participant (parent or nanny)
  IF v_uid <> v_booking_parent_id AND v_uid <> v_booking_nanny_id THEN
    RETURN FALSE;
  END IF;

  -- Check if review already exists
  IF EXISTS (
    SELECT 1 FROM public.reviews r
    WHERE r.booking_id = p_booking_id
    AND r.reviewer_id = v_uid
  ) THEN
    RETURN FALSE;
  END IF;

  RETURN TRUE;
END; $$;

REVOKE ALL ON FUNCTION public.can_user_review(UUID) FROM public;
GRANT EXECUTE ON FUNCTION public.can_user_review(UUID) TO authenticated;

-- Success message
DO $$
BEGIN
  RAISE NOTICE 'Updated booking functions to use users table instead of nannies table! ✅';
END $$;

