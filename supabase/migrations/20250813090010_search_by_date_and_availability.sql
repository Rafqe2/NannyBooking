-- =========================
-- 1) RLS PERFORMANCE CLEANUP
-- =========================

-- USERS
drop policy if exists "Allow profile creation during signup" on public.users;
drop policy if exists "Authenticated users can view their profile" on public.users;
drop policy if exists "Users can view own profile" on public.users;
drop policy if exists "Users can delete own profile" on public.users;
drop policy if exists "Users can insert own profile" on public.users;
drop policy if exists "Users can update own profile" on public.users;
drop policy if exists "users_insert_self" on public.users;
drop policy if exists "users_select_own" on public.users;
drop policy if exists "users_update_own" on public.users;
drop policy if exists "users_delete_own" on public.users;
drop policy if exists "nannies_insert_own" on public.nannies;
drop policy if exists "nannies_update_own" on public.nannies;
drop policy if exists "nanny_avail_select_public" on public.nanny_availability;
drop policy if exists "nanny_avail_insert_owner" on public.nanny_availability;
drop policy if exists "nanny_avail_update_owner" on public.nanny_availability;
drop policy if exists "nanny_avail_delete_owner" on public.nanny_availability;
drop policy if exists "ad_slots_select_public_active" on public.advertisement_availability;
drop policy if exists "ad_slots_insert_owner" on public.advertisement_availability;
drop policy if exists "ad_slots_update_owner" on public.advertisement_availability;
drop policy if exists "ad_slots_delete_owner" on public.advertisement_availability;
drop policy if exists "bookings_select_own" on public.bookings;
drop policy if exists "bookings_insert_parent" on public.bookings;
drop policy if exists "bookings_update_own" on public.bookings;
drop policy if exists "reviews_insert_parent" on public.reviews;
drop policy if exists "reviews_update_own" on public.reviews;
drop policy if exists "reviews_delete_own" on public.reviews;

create policy "users_select_own" on public.users
  for select using ((select auth.uid()) = id);

create policy "users_insert_self" on public.users
  for insert with check ((select auth.uid()) = id);

create policy "users_update_own" on public.users
  for update using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);

create policy "users_delete_own" on public.users
  for delete using ((select auth.uid()) = id);

-- NANNIES
drop policy if exists "Nannies can update their own profile" on public.nannies;
drop policy if exists "Users can insert their own nanny profile" on public.nannies;

create policy "nannies_insert_own" on public.nannies
  for insert with check ((select auth.uid()) = user_id);

create policy "nannies_update_own" on public.nannies
  for update using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

-- NANNY AVAILABILITY
drop policy if exists "Anyone can view availability" on public.nanny_availability;
drop policy if exists "Nannies can manage their own availability" on public.nanny_availability;

create policy "nanny_avail_select_public" on public.nanny_availability
  for select using (true);

create policy "nanny_avail_insert_owner" on public.nanny_availability
  for insert
  with check (
    (select auth.uid()) in (
      select n.user_id from public.nannies n where n.id = nanny_availability.nanny_id
    )
  );

create policy "nanny_avail_update_owner" on public.nanny_availability
  for update
  using (
    (select auth.uid()) in (
      select n.user_id from public.nannies n where n.id = nanny_availability.nanny_id
    )
  )
  with check (
    (select auth.uid()) in (
      select n.user_id from public.nannies n where n.id = nanny_availability.nanny_id
    )
  );

create policy "nanny_avail_delete_owner" on public.nanny_availability
  for delete
  using (
    (select auth.uid()) in (
      select n.user_id from public.nannies n where n.id = nanny_availability.nanny_id
    )
  );

-- ADVERTISEMENTS
drop policy if exists "ads_select_active" on public.advertisements;
drop policy if exists "ads_insert_own" on public.advertisements;
drop policy if exists "ads_update_own" on public.advertisements;
drop policy if exists "ads_delete_own" on public.advertisements;
drop policy if exists "Users can view all active advertisements" on public.advertisements;
drop policy if exists "Users can insert their own advertisements" on public.advertisements;
drop policy if exists "Users can update their own advertisements" on public.advertisements;
drop policy if exists "Users can delete their own advertisements" on public.advertisements;

create policy "ads_select_active" on public.advertisements
  for select using (is_active = true or (select auth.uid()) = user_id);

create policy "ads_insert_own" on public.advertisements
  for insert with check ((select auth.uid()) = user_id);

create policy "ads_update_own" on public.advertisements
  for update using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "ads_delete_own" on public.advertisements
  for delete using ((select auth.uid()) = user_id);

-- ADVERTISEMENT AVAILABILITY
drop policy if exists "own_ad_slots" on public.advertisement_availability;
drop policy if exists "public_can_read_active_slots" on public.advertisement_availability;

create policy "ad_slots_select_public_active" on public.advertisement_availability
  for select using (
    exists (
      select 1 from public.advertisements a
      where a.id = advertisement_id and a.is_active = true
    )
  );

create policy "ad_slots_insert_owner" on public.advertisement_availability
  for insert with check (
    exists (
      select 1 from public.advertisements a
      where a.id = advertisement_id and a.user_id = (select auth.uid())
    )
  );

create policy "ad_slots_update_owner" on public.advertisement_availability
  for update using (
    exists (
      select 1 from public.advertisements a
      where a.id = advertisement_id and a.user_id = (select auth.uid())
    )
  ) with check (
    exists (
      select 1 from public.advertisements a
      where a.id = advertisement_id and a.user_id = (select auth.uid())
    )
  );

create policy "ad_slots_delete_owner" on public.advertisement_availability
  for delete using (
    exists (
      select 1 from public.advertisements a
      where a.id = advertisement_id and a.user_id = (select auth.uid())
    )
  );

-- BOOKINGS
drop policy if exists "Users can view their own bookings" on public.bookings;
drop policy if exists "Parents can create bookings" on public.bookings;
drop policy if exists "Users can update their own bookings" on public.bookings;

create policy "bookings_select_own" on public.bookings
  for select using (
    (select auth.uid()) = parent_id
    or (select auth.uid()) in (
      select n.user_id from public.nannies n where n.id = bookings.nanny_id
    )
  );

create policy "bookings_insert_parent" on public.bookings
  for insert with check ((select auth.uid()) = parent_id);

create policy "bookings_update_own" on public.bookings
  for update using (
    (select auth.uid()) = parent_id
    or (select auth.uid()) in (
      select n.user_id from public.nannies n where n.id = bookings.nanny_id
    )
  );

-- REVIEWS
drop policy if exists "Parents can create reviews" on public.reviews;
drop policy if exists "Parents can update their own reviews" on public.reviews;
drop policy if exists "Parents can delete their own reviews" on public.reviews;

create policy "reviews_insert_parent" on public.reviews
  for insert with check ((select auth.uid()) = parent_id);

create policy "reviews_update_own" on public.reviews
  for update using ((select auth.uid()) = parent_id);

create policy "reviews_delete_own" on public.reviews
  for delete using ((select auth.uid()) = parent_id);


-- =========================
-- 2) AVAILABILITY TABLE & RLS
-- =========================

create table if not exists public.advertisement_availability (
  id uuid primary key default gen_random_uuid(),
  advertisement_id uuid not null references public.advertisements(id) on delete cascade,
  available_date date not null,
  start_time time not null,
  end_time time not null
);

alter table public.advertisement_availability enable row level security;


-- =========================
-- 3) FLEXIBLE SEARCH RPC (DROP + CREATE)
-- =========================

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
    p_end_date := p_start_date;
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
    where a.is_active = true
      and (p_location is null or a.location_city ilike '%' || p_location || '%')
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
      -- Flexible overlap: include ad if any availability day is within [p_start_date, p_end_date]
      select b.*
      from base b
      where exists (
        select 1 from public.advertisement_availability av
        where av.advertisement_id = b.id
          and av.available_date between p_start_date and p_end_date
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


-- =========================
-- 4) PUBLIC USER PROFILE RPC
-- =========================

create or replace function public.get_user_public_profile(p_user_id uuid)
returns table (
  user_id uuid,
  full_name text,
  picture text,
  member_since timestamptz,
  bio text,
  user_type text,
  rating numeric,
  reviews_count int
)
language sql
security definer
set search_path = public, pg_temp
as $$
  select
    u.id as user_id,
    trim(coalesce(u.name,'') || ' ' || coalesce(u.surname,'')) as full_name,
    u.picture,
    u.created_at as member_since,
    coalesce(n.bio, u.additional_info) as bio,
    u.user_type,
    coalesce(n.rating, 0) as rating,
    coalesce(n.reviews_count, 0) as reviews_count
  from public.users u
  left join public.nannies n on n.user_id = u.id
  where u.id = p_user_id;
$$;

revoke all on function public.get_user_public_profile(uuid) from public;
grant execute on function public.get_user_public_profile(uuid) to anon, authenticated;