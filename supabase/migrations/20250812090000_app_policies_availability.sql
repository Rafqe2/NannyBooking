-- App policies and availability schema
-- Safe to run multiple times (IF EXISTS/IF NOT EXISTS used where possible)

-- 1) Users table conveniences
alter table if exists public.users
  alter column user_type set default 'pending';

alter table if exists public.users
  add column if not exists phone text,
  add column if not exists location text;

-- 2) Advertisements RLS: replace duplicates with a clear set
-- Drop any older/duplicate policies if present
drop policy if exists "Users can view all active advertisements" on public.advertisements;
drop policy if exists "Users can insert their own advertisements" on public.advertisements;
drop policy if exists "Users can update their own advertisements" on public.advertisements;
drop policy if exists "Users can delete their own advertisements" on public.advertisements;

drop policy if exists "ads_select_active" on public.advertisements;
drop policy if exists "ads_insert_own" on public.advertisements;
drop policy if exists "ads_update_own" on public.advertisements;
drop policy if exists "ads_delete_own" on public.advertisements;

-- Recreate consolidated policies
create policy "ads_select_active" on public.advertisements
  for select
  using (is_active = true or auth.uid() = user_id);

create policy "ads_insert_own" on public.advertisements
  for insert
  with check (auth.uid() = user_id);

create policy "ads_update_own" on public.advertisements
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "ads_delete_own" on public.advertisements
  for delete
  using (auth.uid() = user_id);

-- 3) Only one active ad per user (DB-level)
drop index if exists ux_advertisements_user;
create unique index if not exists ux_one_active_ad_per_user
on public.advertisements(user_id)
where is_active = true;

-- 4) Availability slots for short-term ads (date + time ranges)
create table if not exists public.advertisement_availability (
  id uuid primary key default gen_random_uuid(),
  advertisement_id uuid not null references public.advertisements(id) on delete cascade,
  available_date date not null,
  start_time time not null,
  end_time time not null
);

alter table public.advertisement_availability enable row level security;

drop policy if exists "own_ad_slots" on public.advertisement_availability;
create policy "own_ad_slots" on public.advertisement_availability
  for all
  using (
    exists (
      select 1 from public.advertisements a
      where a.id = advertisement_id and a.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.advertisements a
      where a.id = advertisement_id and a.user_id = auth.uid()
    )
  );

-- 5) RPC to safely toggle is_active with ownership check
create or replace function public.ad_toggle(p_ad_id uuid, p_active boolean)
returns boolean
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  owner uuid;
begin
  if auth.role() <> 'authenticated' then
    raise exception 'Not authenticated' using errcode = '42501';
  end if;

  select user_id into owner from public.advertisements where id = p_ad_id;
  if owner is null then
    return false;
  end if;
  if owner <> auth.uid() then
    raise exception 'Forbidden' using errcode = '42501';
  end if;

  update public.advertisements
  set is_active = p_active,
      updated_at = now()
  where id = p_ad_id;

  return found;
end;
$$;

revoke all on function public.ad_toggle(uuid, boolean) from public;
grant execute on function public.ad_toggle(uuid, boolean) to authenticated;


