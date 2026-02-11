-- Prevent duplicate booking requests for the same date/time and advertisement
-- Update create_booking_from_ad to check for pending bookings as well

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

  -- Check for existing booking conflicts (both pending and confirmed)
  -- Check for same advertisement, same date, and overlapping time slots
  if exists (
    select 1 from public.bookings b
    where b.advertisement_id = p_ad_id
      and b.start_date = p_date
      and b.status in ('pending', 'confirmed')
      and (
        -- Check if parent and nanny match
        (b.parent_id = v_parent_user_id and b.nanny_id = v_nanny_user_id)
      )
      and (
        -- Check for time overlap
        (p_start >= b.start_time and p_start < b.end_time) or
        (p_end > b.start_time and p_end <= b.end_time) or
        (p_start <= b.start_time and p_end >= b.end_time)
      )
  ) then
    raise exception 'BOOKING_CONFLICT: You already have a pending or confirmed booking for this date and time slot. Please check your existing bookings.';
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

REVOKE ALL ON FUNCTION public.create_booking_from_ad(uuid, date, time, time, text) FROM public;
GRANT EXECUTE ON FUNCTION public.create_booking_from_ad(uuid, date, time, time, text) TO authenticated;

-- Success message
DO $$
BEGIN
  RAISE NOTICE 'Updated create_booking_from_ad to prevent duplicate bookings (pending and confirmed)! ✅';
END $$;


