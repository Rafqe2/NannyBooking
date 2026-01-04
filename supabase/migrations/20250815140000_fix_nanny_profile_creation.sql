-- Fix nanny profile creation issue in booking system
-- This migration updates the create_booking_from_ad function to auto-create
-- basic nanny profiles when needed

-- Update the create_booking_from_ad function to handle missing nanny profiles
create or replace function public.create_booking_from_ad(
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
    
    -- If nanny profile doesn't exist for the ad owner, create a basic one
    if v_nanny is null then
      -- Get ad owner's location from users table, or use a default
      select coalesce(location, 'Location not set')
      into v_user_location
      from public.users 
      where id = v_owner;
      
      -- Create basic nanny profile with minimal required fields
      insert into public.nannies (
        user_id,
        location,
        hourly_rate,
        experience_years,
        availability
      ) values (
        v_owner,
        v_user_location,
        0.00, -- Default rate
        0,    -- Default experience
        'Available' -- Default availability
      ) returning id into v_nanny;
      
      if v_nanny is null then
        raise exception 'failed to create nanny profile for ad owner';
      end if;
    end if;
  elsif v_owner_type = 'parent' then
    v_parent := v_owner;
    select id into v_nanny from public.nannies where user_id = v_uid;
    
    -- If nanny profile doesn't exist, create a basic one
    if v_nanny is null then
      -- Get user's location from users table, or use a default
      select coalesce(location, 'Location not set')
      into v_user_location
      from public.users 
      where id = v_uid;
      
      -- Create basic nanny profile with minimal required fields
      insert into public.nannies (
        user_id,
        location,
        hourly_rate,
        experience_years,
        availability
      ) values (
        v_uid,
        v_user_location,
        0.00, -- Default rate
        0,    -- Default experience
        'Available' -- Default availability
      ) returning id into v_nanny;
      
      if v_nanny is null then
        raise exception 'failed to create nanny profile';
      end if;
    end if;
  else
    raise exception 'invalid advertisement owner type';
  end if;

  v_hours := extract(epoch from (p_end - p_start)) / 3600.0;
  v_amount := round(coalesce(v_price,0) * v_hours, 2);

  insert into public.bookings (
    nanny_id, parent_id, start_date, end_date, start_time, end_time, message, total_amount, status
  ) values (
    v_nanny, v_parent, p_date, p_date, p_start, p_end, p_message, v_amount, 'pending'
  ) returning id into v_booking_id;

  return v_booking_id;
end; $$;

-- Grant permissions
revoke all on function public.create_booking_from_ad(uuid, date, time, time, text) from public;
grant execute on function public.create_booking_from_ad(uuid, date, time, time, text) to authenticated;
