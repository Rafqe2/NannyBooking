-- Create RPC to toggle advertisement active status with ownership checks
create or replace function public.ad_toggle(
  p_ad_id uuid,
  p_active boolean
)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_uid uuid := (select auth.uid());
  v_owner uuid;
begin
  if v_uid is null then
    raise exception 'not authenticated';
  end if;

  select user_id into v_owner from public.advertisements where id = p_ad_id;
  if not found then
    raise exception 'advertisement not found';
  end if;
  if v_owner <> v_uid then
    raise exception 'not allowed';
  end if;

  if p_active then
    -- Enforce at most one active advertisement per user by deactivating others
    update public.advertisements
    set is_active = false
    where user_id = v_owner
      and id <> p_ad_id
      and is_active = true;
  end if;

  update public.advertisements
  set is_active = p_active
  where id = p_ad_id;
end;
$$;

revoke all on function public.ad_toggle(uuid, boolean) from public;
grant execute on function public.ad_toggle(uuid, boolean) to authenticated;

-- Remove unused ad_bookings RPCs and optional table if standardizing on public.bookings
drop function if exists public.create_ad_booking(uuid, date, time, time, text);
drop function if exists public.respond_ad_booking(uuid, text);

-- Optionally drop table if not used anywhere else
do $$
begin
  if exists (
    select 1 from information_schema.tables
    where table_schema = 'public' and table_name = 'ad_bookings'
  ) then
    execute 'drop table public.ad_bookings cascade';
  end if;
end $$;

-- RLS policy cleanup: drop extra permissive SELECT policies to avoid multiple evaluation
-- advertisement_availability
drop policy if exists ad_slots_select_owner on public.advertisement_availability;
-- Keep the single public-active select policy defined in prior migrations

-- advertisement_locations
drop policy if exists ad_locs_select_owner on public.advertisement_locations;
-- Keep the single public-active select policy defined in prior migrations


