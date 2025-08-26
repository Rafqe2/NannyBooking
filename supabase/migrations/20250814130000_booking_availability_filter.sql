-- Update search_ads to filter out availability slots with less than 4 hours remaining after confirmed bookings

drop function if exists public.search_ads(text, date, date);
drop function if exists public.search_ads(text, date, date, text);

create or replace function public.search_ads(
  p_location text default null,
  p_start_date date default null,
  p_end_date date default null,
  p_viewer_type text default null
)
returns table (
  id uuid,
  title text,
  location_city text,
  price_per_hour numeric,
  experience text,
  skills text[],
  availability_start_time time,
  availability_end_time time,
  owner_id uuid,
  owner_full_name text,
  owner_member_since timestamptz,
  owner_picture text,
  owner_rating numeric,
  owner_reviews_count int,
  locations text[]
)
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  viewer_type text;
begin
  if p_start_date is not null and p_end_date is null then
    
  end if;

  begin
    if p_viewer_type is not null then
      viewer_type := p_viewer_type;
    else
      select user_type into viewer_type from public.users where id = auth.uid();
    end if;
  exception when others then
    viewer_type := null;
  end;

  if p_start_date is null and p_end_date is null then
    return query
    with available_ads as (
      select a.id as ad_id
      from public.advertisements a
      where a.is_active = true
        and (
          a.type = 'long-term' or exists (
            select 1
            from public.advertisement_availability av
            left join (
              -- Calculate total booked hours per ad per date for confirmed bookings
              -- Consider both nanny ads (when they have bookings) and parent ads (when they are clients)
              select 
                aa.id as advertisement_id,
                b.start_date as booking_date,
                sum(
                  extract(epoch from (b.end_time - b.start_time)) / 3600
                ) as total_booked_hours
              from public.bookings b
              join public.advertisements aa on (
                -- Case 1: Nanny ad owner has bookings
                (aa.user_id in (select n.user_id from public.nannies n where n.id = b.nanny_id))
                OR
                -- Case 2: Parent ad owner has confirmed bookings as client
                (aa.user_id = b.parent_id)
              )
              where b.status = 'confirmed'
              group by aa.id, b.start_date
            ) booked on booked.advertisement_id = av.advertisement_id 
              and booked.booking_date = av.available_date
            where av.advertisement_id = a.id
              and av.available_date >= current_date
              and (
                -- Calculate available hours for this slot
                extract(epoch from (av.end_time - av.start_time)) / 3600
                - coalesce(booked.total_booked_hours, 0)
              ) >= 4 -- At least 4 hours must remain available
          )
        )
    )
    select 
      a.id,
      a.title::text,
      a.location_city::text,
      a.price_per_hour,
      a.experience::text,
      a.skills::text[],
      a.availability_start_time,
      a.availability_end_time,
      u.id as owner_id,
      trim(coalesce(u.name,'') || ' ' || coalesce(u.surname,''))::text as owner_full_name,
      u.created_at as owner_member_since,
      u.picture::text as owner_picture,
      coalesce(n.rating, 0) as owner_rating,
      coalesce(n.reviews_count, 0) as owner_reviews_count,
      coalesce((
        select array_agg(al.label order by al.order_index)
        from public.advertisement_locations al
        where al.advertisement_id = a.id
      ), '{}'::text[]) as locations
    from public.advertisements a
    join public.users u on u.id = a.user_id
    left join public.nannies n on n.user_id = u.id
    join available_ads aa on aa.ad_id = a.id
    where (p_location is null or a.location_city ilike '%' || p_location || '%')
      and (
        viewer_type is null
        or (viewer_type = 'parent' and u.user_type = 'nanny')
        or (viewer_type = 'nanny' and u.user_type = 'parent')
      )
      and ((select auth.uid()) is null or a.user_id <> (select auth.uid()))
    order by a.created_at desc;
  else
    return query
    with base as (
      select 
        a.*,
        u.id as owner_id,
        trim(coalesce(u.name,'') || ' ' || coalesce(u.surname,'')) as owner_full_name,
        u.created_at as owner_member_since,
        u.picture as owner_picture,
        u.user_type as owner_user_type
      from public.advertisements a
      join public.users u on u.id = a.user_id
      where a.is_active = true
        and (p_location is null or a.location_city ilike '%' || p_location || '%')
        and (
          viewer_type is null
          or (viewer_type = 'parent' and u.user_type = 'nanny')
          or (viewer_type = 'nanny' and u.user_type = 'parent')
        )
        and ((select auth.uid()) is null or a.user_id <> (select auth.uid()))
    ),
    eligible as (
      -- Include ad if any availability day within date range has >= 4 hours remaining
      select b.*
      from base b
      where exists (
        select 1 
        from public.advertisement_availability av
        left join (
          -- Calculate total booked hours per ad per date for confirmed bookings
          -- Consider both nanny ads (when they have bookings) and parent ads (when they are clients)
          select 
            aa.id as advertisement_id,
            bb.start_date as booking_date,
            sum(
              extract(epoch from (bb.end_time - bb.start_time)) / 3600
            ) as total_booked_hours
          from public.bookings bb
          join public.advertisements aa on (
            -- Case 1: Nanny ad owner has bookings
            (aa.user_id in (select nn.user_id from public.nannies nn where nn.id = bb.nanny_id))
            OR
            -- Case 2: Parent ad owner has confirmed bookings as client
            (aa.user_id = bb.parent_id)
          )
          where bb.status = 'confirmed'
          group by aa.id, bb.start_date
        ) booked on booked.advertisement_id = av.advertisement_id 
          and booked.booking_date = av.available_date
        where av.advertisement_id = b.id
          and av.available_date between p_start_date and p_end_date
          and (
            -- Calculate remaining available hours for this slot
            extract(epoch from (av.end_time - av.start_time)) / 3600
            - coalesce(booked.total_booked_hours, 0)
          ) >= 4 -- At least 4 hours must remain available
      )
    )
    select
      e.id,
      e.title::text,
      e.location_city::text,
      e.price_per_hour,
      e.experience::text,
      e.skills::text[],
      e.availability_start_time,
      e.availability_end_time,
      e.owner_id,
      e.owner_full_name::text,
      e.owner_member_since,
      e.owner_picture::text,
      coalesce(n.rating, 0) as owner_rating,
      coalesce(n.reviews_count, 0) as owner_reviews_count,
      coalesce((
        select array_agg(al.label order by al.order_index)
        from public.advertisement_locations al
        where al.advertisement_id = e.id
      ), '{}'::text[]) as locations
    from eligible e
    left join public.nannies n on n.user_id = e.owner_id
    order by e.created_at desc;
  end if;
end;
$$;

grant execute on function public.search_ads(text, date, date, text) to anon, authenticated;

-- RPC to get filtered availability slots for a specific advertisement
-- Only returns slots with at least 4 hours remaining after confirmed bookings
create or replace function public.get_filtered_ad_availability(
  p_ad_id uuid
)
returns table (
  available_date date,
  start_time time,
  end_time time,
  remaining_hours numeric
)
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  return query
  select 
    av.available_date,
    av.start_time,
    av.end_time,
    (
      extract(epoch from (av.end_time - av.start_time)) / 3600
      - coalesce(booked.total_booked_hours, 0)
    ) as remaining_hours
  from public.advertisement_availability av
  left join (
    -- Calculate total booked hours per date for confirmed bookings
    -- Consider both nanny ads (when they have bookings) and parent ads (when they are clients)
    select 
      aa.id as advertisement_id,
      b.start_date as booking_date,
      sum(
        extract(epoch from (b.end_time - b.start_time)) / 3600
      ) as total_booked_hours
    from public.bookings b
    join public.advertisements aa on (
      -- Case 1: Nanny ad owner has bookings
      (aa.user_id in (select n.user_id from public.nannies n where n.id = b.nanny_id))
      OR
      -- Case 2: Parent ad owner has confirmed bookings as client
      (aa.user_id = b.parent_id)
    )
    where b.status = 'confirmed'
      and aa.id = p_ad_id
    group by aa.id, b.start_date
  ) booked on booked.advertisement_id = av.advertisement_id 
    and booked.booking_date = av.available_date
  where av.advertisement_id = p_ad_id
    and av.available_date >= current_date
    and (
      -- Only include slots with at least 4 hours remaining
      extract(epoch from (av.end_time - av.start_time)) / 3600
      - coalesce(booked.total_booked_hours, 0)
    ) >= 4
  order by av.available_date, av.start_time;
end;
$$;

grant execute on function public.get_filtered_ad_availability(uuid) to anon, authenticated;

-- RPC to auto-deactivate ads with no remaining availability
create or replace function public.auto_deactivate_fully_booked_ads()
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  -- Deactivate short-term ads that have no availability slots with >= 4 hours remaining
  update public.advertisements
  set is_active = false
  where is_active = true
    and type = 'short-term'
    and not exists (
      select 1
      from public.advertisement_availability av
      left join (
        -- Calculate total booked hours per date for confirmed bookings
        -- Consider both nanny ads (when they have bookings) and parent ads (when they are clients)
        select 
          aa.id as advertisement_id,
          b.start_date as booking_date,
          sum(
            extract(epoch from (b.end_time - b.start_time)) / 3600
          ) as total_booked_hours
        from public.bookings b
        join public.advertisements aa on (
          -- Case 1: Nanny ad owner has bookings
          (aa.user_id in (select n.user_id from public.nannies n where n.id = b.nanny_id))
          OR
          -- Case 2: Parent ad owner has confirmed bookings as client
          (aa.user_id = b.parent_id)
        )
        where b.status = 'confirmed'
        group by aa.id, b.start_date
      ) booked on booked.advertisement_id = av.advertisement_id 
        and booked.booking_date = av.available_date
      where av.advertisement_id = advertisements.id
        and av.available_date >= current_date
        and (
          -- Check if at least 4 hours remain available
          extract(epoch from (av.end_time - av.start_time)) / 3600
          - coalesce(booked.total_booked_hours, 0)
        ) >= 4
    );
end;
$$;

grant execute on function public.auto_deactivate_fully_booked_ads() to authenticated;

-- Trigger to auto-deactivate ads when bookings are confirmed
create or replace function public.trigger_auto_deactivate_on_booking()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  -- Only run when a booking is confirmed
  if NEW.status = 'confirmed' and (OLD.status is null or OLD.status != 'confirmed') then
    -- Auto-deactivate ads that are now fully booked
    perform public.auto_deactivate_fully_booked_ads();
  end if;
  
  return NEW;
end;
$$;

-- Create trigger on bookings table
drop trigger if exists auto_deactivate_on_booking_confirmed on public.bookings;
create trigger auto_deactivate_on_booking_confirmed
  after insert or update on public.bookings
  for each row
  execute function public.trigger_auto_deactivate_on_booking();

-- Update create_booking_from_ad to check for conflicts
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
  v_conflict_count int;
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

  if v_owner_type = 'nanny' then
    v_parent := v_uid;
    select id into v_nanny from public.nannies where user_id = v_owner;
    if v_nanny is null then 
      perform public.ensure_nanny_profile(v_owner);
      select id into v_nanny from public.nannies where user_id = v_owner;
    end if;
  elsif v_owner_type = 'parent' then
    v_parent := v_owner;
    select id into v_nanny from public.nannies where user_id = v_uid;
    if v_nanny is null then 
      perform public.ensure_nanny_profile(v_uid);
      select id into v_nanny from public.nannies where user_id = v_uid;
    end if;
  else
    raise exception 'invalid advertisement owner type';
  end if;

  -- Check for booking conflicts (overlapping times on same date)
  select count(*)
  into v_conflict_count
  from public.bookings b
  where b.parent_id = v_parent
    and b.start_date = p_date
    and b.status in ('pending', 'confirmed')
    and (
      -- Check for time overlap
      (p_start < b.end_time and p_end > b.start_time)
    );

  if v_conflict_count > 0 then
    raise exception 'You already have an active booking on those dates';
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

revoke all on function public.create_booking_from_ad(uuid, date, time, time, text) from public;
grant execute on function public.create_booking_from_ad(uuid, date, time, time, text) to authenticated;

-- Add cancellation tracking columns to bookings table
alter table public.bookings 
  add column if not exists cancellation_reason text,
  add column if not exists cancellation_note text,
  add column if not exists cancelled_at timestamptz,
  add column if not exists cancelled_by uuid references public.users(id);

-- RPC to cancel booking with reason (for confirmed bookings)
create or replace function public.cancel_booking_with_reason(
  p_booking_id uuid,
  p_reason text,
  p_note text
) returns void
language plpgsql security definer set search_path = public, pg_temp as $$
declare
  v_uid uuid := (select auth.uid());
  v_parent uuid;
  v_nanny_user uuid;
  v_status text;
begin
  if v_uid is null then raise exception 'not authenticated'; end if;
  if trim(p_reason) = '' then raise exception 'cancellation reason is required'; end if;
  if length(trim(p_note)) < 10 then raise exception 'cancellation note must be at least 10 characters'; end if;

  -- Get booking details and verify user has permission
  select b.parent_id, n.user_id, b.status
  into v_parent, v_nanny_user, v_status
  from public.bookings b
  join public.nannies n on n.id = b.nanny_id
  where b.id = p_booking_id;

  if not found then
    raise exception 'booking not found';
  end if;

  -- Only allow parent or nanny to cancel
  if v_uid != v_parent and v_uid != v_nanny_user then
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

-- Update respond_booking to permanently delete pending bookings when cancelled/declined
create or replace function public.respond_booking(
  p_booking_id uuid,
  p_action text
) returns void
language plpgsql security definer set search_path = public, pg_temp as $$
declare
  v_uid uuid := (select auth.uid());
  v_parent uuid;
  v_nanny_user uuid;
  v_status text;
begin
  if v_uid is null then raise exception 'not authenticated'; end if;
  if p_action not in ('confirm', 'cancel') then raise exception 'invalid action'; end if;

  -- Get booking details and verify user has permission
  select b.parent_id, n.user_id, b.status
  into v_parent, v_nanny_user, v_status
  from public.bookings b
  join public.nannies n on n.id = b.nanny_id
  where b.id = p_booking_id;

  if not found then
    raise exception 'booking not found';
  end if;

  -- Only allow parent or nanny to respond
  if v_uid != v_parent and v_uid != v_nanny_user then
    raise exception 'not authorized to respond to this booking';
  end if;

  -- Only allow response to pending bookings
  if v_status != 'pending' then
    raise exception 'can only respond to pending bookings';
  end if;

  if p_action = 'confirm' then
    -- Only nanny can confirm
    if v_uid != v_nanny_user then
      raise exception 'only nanny can confirm booking';
    end if;
    -- Update status to confirmed
    update public.bookings
    set status = 'confirmed', updated_at = now()
    where id = p_booking_id;
  elsif p_action = 'cancel' then
    -- For pending bookings, permanently delete instead of marking as cancelled
    delete from public.bookings where id = p_booking_id;
  end if;
end; $$;

-- RPC to delete pending booking (no reason needed) - kept for manual deletion if needed
create or replace function public.delete_pending_booking(
  p_booking_id uuid
) returns void
language plpgsql security definer set search_path = public, pg_temp as $$
declare
  v_uid uuid := (select auth.uid());
  v_parent uuid;
  v_nanny_user uuid;
  v_status text;
begin
  if v_uid is null then raise exception 'not authenticated'; end if;

  -- Get booking details and verify user has permission
  select b.parent_id, n.user_id, b.status
  into v_parent, v_nanny_user, v_status
  from public.bookings b
  join public.nannies n on n.id = b.nanny_id
  where b.id = p_booking_id;

  if not found then
    raise exception 'booking not found';
  end if;

  -- Only allow parent or nanny to delete
  if v_uid != v_parent and v_uid != v_nanny_user then
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

revoke all on function public.cancel_booking_with_reason(uuid, text, text) from public;
grant execute on function public.cancel_booking_with_reason(uuid, text, text) to authenticated;

revoke all on function public.respond_booking(uuid, text) from public;
grant execute on function public.respond_booking(uuid, text) to authenticated;

revoke all on function public.delete_pending_booking(uuid) from public;
grant execute on function public.delete_pending_booking(uuid) to authenticated;

-- RPC to get user's bookings with all details including cancellation info
drop function if exists public.get_my_bookings();
create or replace function public.get_my_bookings()
returns table (
  id uuid,
  booking_date date,
  start_time time,
  end_time time,
  status character varying(20),
  message text,
  total_amount numeric,
  counterparty_full_name text,
  created_at timestamptz,
  updated_at timestamptz,
  cancellation_reason text,
  cancellation_note text,
  cancelled_at timestamptz,
  cancelled_by uuid
)
language plpgsql security definer set search_path = public, pg_temp as $$
declare
  v_uid uuid := (select auth.uid());
begin
  if v_uid is null then raise exception 'not authenticated'; end if;

  return query
  select 
    b.id,
    b.start_date as booking_date,
    b.start_time,
    b.end_time,
    b.status,
    b.message,
    b.total_amount,
    -- Get counterparty name (parent or nanny depending on user's role)
    case 
      when b.parent_id = v_uid then 
        -- Current user is parent, get nanny name
        coalesce(
          (select u.name || ' ' || coalesce(u.surname, '') 
           from users u 
           join nannies n on n.user_id = u.id 
           where n.id = b.nanny_id),
          'Unknown Nanny'
        )
      else 
        -- Current user is nanny, get parent name  
        coalesce(
          (select u.name || ' ' || coalesce(u.surname, '') 
           from users u 
           where u.id = b.parent_id),
          'Unknown Parent'
        )
    end as counterparty_full_name,
    b.created_at,
    b.updated_at,
    b.cancellation_reason,
    b.cancellation_note,
    b.cancelled_at,
    b.cancelled_by
  from bookings b
  where 
    b.parent_id = v_uid 
    or 
    b.nanny_id in (select n.id from nannies n where n.user_id = v_uid)
  order by b.created_at desc;
end; $$;

revoke all on function public.get_my_bookings() from public;
grant execute on function public.get_my_bookings() to authenticated;
