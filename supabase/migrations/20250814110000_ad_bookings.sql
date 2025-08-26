-- Ad bookings: generic both ways (nanny ↔ parent) via advertisements

-- Table
create table if not exists public.ad_bookings (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  advertisement_id uuid not null references public.advertisements(id) on delete cascade,
  requester_id uuid not null references public.users(id) on delete cascade,
  receiver_id uuid not null references public.users(id) on delete cascade,
  booking_date date not null,
  start_time time not null,
  end_time time not null,
  message text,
  status text not null default 'pending' check (status in ('pending','accepted','declined','cancelled','expired'))
);

alter table public.ad_bookings enable row level security;

-- Updated timestamp
create or replace function public.tg_ad_bookings_set_updated()
returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end; $$;

drop trigger if exists trg_ad_bookings_set_updated on public.ad_bookings;
create trigger trg_ad_bookings_set_updated before update on public.ad_bookings
for each row execute function public.tg_ad_bookings_set_updated();

-- Policies
drop policy if exists ad_bookings_insert_requester on public.ad_bookings;
create policy ad_bookings_insert_requester on public.ad_bookings
  for insert with check (
    requester_id = (select auth.uid())
    and requester_id <> receiver_id
  );

drop policy if exists ad_bookings_select_participants on public.ad_bookings;
create policy ad_bookings_select_participants on public.ad_bookings
  for select using (
    (select auth.uid()) in (requester_id, receiver_id)
  );

drop policy if exists ad_bookings_update_receiver_or_requester on public.ad_bookings;
create policy ad_bookings_update_receiver_or_requester on public.ad_bookings
  for update using (
    (select auth.uid()) = receiver_id or (select auth.uid()) = requester_id
  ) with check (
    (select auth.uid()) = receiver_id or (select auth.uid()) = requester_id
  );

-- RPCs
-- Create booking safely (ensures ad is active and requester is not the owner)
create or replace function public.create_ad_booking(
  p_ad_id uuid,
  p_booking_date date,
  p_start time,
  p_end time,
  p_message text default null
)
returns uuid
language plpgsql security definer set search_path = public, pg_temp as $$
declare
  v_requester uuid := (select auth.uid());
  v_receiver uuid;
  v_booking_id uuid;
begin
  if v_requester is null then
    raise exception 'not authenticated';
  end if;

  select user_id into v_receiver from public.advertisements where id = p_ad_id and is_active = true;
  if v_receiver is null then
    raise exception 'advertisement not found or inactive';
  end if;
  if v_receiver = v_requester then
    raise exception 'cannot book own advertisement';
  end if;

  insert into public.ad_bookings (
    advertisement_id, requester_id, receiver_id, booking_date, start_time, end_time, message
  ) values (
    p_ad_id, v_requester, v_receiver, p_booking_date, p_start, p_end, p_message
  ) returning id into v_booking_id;

  return v_booking_id;
end; $$;

revoke all on function public.create_ad_booking(uuid, date, time, time, text) from public;
grant execute on function public.create_ad_booking(uuid, date, time, time, text) to authenticated;

-- Respond to booking (accept/decline/cancel). Only receiver can accept/decline; requester can cancel.
create or replace function public.respond_ad_booking(
  p_booking_id uuid,
  p_action text
) returns void
language plpgsql security definer set search_path = public, pg_temp as $$
declare
  v_uid uuid := (select auth.uid());
  v_req uuid; v_rec uuid; v_status text;
begin
  if v_uid is null then raise exception 'not authenticated'; end if;
  select requester_id, receiver_id, status into v_req, v_rec, v_status from public.ad_bookings where id = p_booking_id;
  if not found then raise exception 'booking not found'; end if;
  if v_status <> 'pending' then raise exception 'booking not pending'; end if;

  if p_action = 'accept' then
    if v_uid <> v_rec then raise exception 'only receiver can accept'; end if;
    update public.ad_bookings set status = 'accepted' where id = p_booking_id;
  elsif p_action = 'decline' then
    if v_uid <> v_rec then raise exception 'only receiver can decline'; end if;
    update public.ad_bookings set status = 'declined' where id = p_booking_id;
  elsif p_action = 'cancel' then
    if v_uid <> v_req then raise exception 'only requester can cancel'; end if;
    update public.ad_bookings set status = 'cancelled' where id = p_booking_id;
  else
    raise exception 'invalid action';
  end if;
end; $$;

revoke all on function public.respond_ad_booking(uuid, text) from public;
grant execute on function public.respond_ad_booking(uuid, text) to authenticated;


