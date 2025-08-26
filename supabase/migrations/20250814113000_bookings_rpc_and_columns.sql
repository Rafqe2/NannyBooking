-- Extend existing bookings table to support time and message
alter table public.bookings
  add column if not exists start_time time not null default '09:00',
  add column if not exists end_time time not null default '17:00',
  add column if not exists message text;

-- Policies: allow both parent and nanny participants
drop policy if exists bookings_insert_parent on public.bookings;
drop policy if exists bookings_select_own on public.bookings;
drop policy if exists bookings_update_own on public.bookings;

create policy bookings_select_participants on public.bookings
  for select using (
    (select auth.uid()) = parent_id or (select auth.uid()) in (
      select n.user_id from public.nannies n where n.id = bookings.nanny_id
    )
  );

create policy bookings_insert_participants on public.bookings
  for insert with check (
    (select auth.uid()) = parent_id or (select auth.uid()) in (
      select n.user_id from public.nannies n where n.id = bookings.nanny_id
    )
  );

create policy bookings_update_participants on public.bookings
  for update using (
    (select auth.uid()) = parent_id or (select auth.uid()) in (
      select n.user_id from public.nannies n where n.id = bookings.nanny_id
    )
  ) with check (
    (select auth.uid()) = parent_id or (select auth.uid()) in (
      select n.user_id from public.nannies n where n.id = bookings.nanny_id
    )
  );

-- RPC to create a booking from an advertisement id
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

  insert into public.bookings (
    nanny_id, parent_id, start_date, end_date, start_time, end_time, message, total_amount, status
  ) values (
    v_nanny, v_parent, p_date, p_date, p_start, p_end, p_message, v_amount, 'pending'
  ) returning id into v_booking_id;

  return v_booking_id;
end; $$;

revoke all on function public.create_booking_from_ad(uuid, date, time, time, text) from public;
grant execute on function public.create_booking_from_ad(uuid, date, time, time, text) to authenticated;

-- RPC to respond: confirm or cancel
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
  select b.parent_id, n.user_id, b.status
  into v_parent, v_nanny_user, v_status
  from public.bookings b
  join public.nannies n on n.id = b.nanny_id
  where b.id = p_booking_id;
  if not found then raise exception 'booking not found'; end if;
  if v_status <> 'pending' then raise exception 'booking not pending'; end if;

  if p_action = 'confirm' then
    if v_uid <> v_nanny_user and v_uid <> v_parent then raise exception 'not a participant'; end if;
    if v_uid = v_nanny_user then
      update public.bookings set status = 'confirmed' where id = p_booking_id;
    else
      raise exception 'only nanny can confirm';
    end if;
  elsif p_action = 'cancel' then
    if v_uid <> v_nanny_user and v_uid <> v_parent then raise exception 'not a participant'; end if;
    update public.bookings set status = 'cancelled' where id = p_booking_id;
  else
    raise exception 'invalid action';
  end if;
end; $$;

revoke all on function public.respond_booking(uuid, text) from public;
grant execute on function public.respond_booking(uuid, text) to authenticated;


