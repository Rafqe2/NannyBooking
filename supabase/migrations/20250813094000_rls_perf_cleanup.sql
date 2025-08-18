-- RLS performance cleanup: wrap auth.* calls in SELECT and remove multiple permissive SELECT policies
-- Safe to run multiple times

-- USERS: consolidate policies and use (select auth.uid())
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

create policy "users_select_own" on public.users
  for select using ((select auth.uid()) = id);

create policy "users_insert_self" on public.users
  for insert with check ((select auth.uid()) = id);

create policy "users_update_own" on public.users
  for update using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);

create policy "users_delete_own" on public.users
  for delete using ((select auth.uid()) = id);

-- NANNIES: wrap auth.uid and split policies
drop policy if exists "Nannies can update their own profile" on public.nannies;
drop policy if exists "Users can insert their own nanny profile" on public.nannies;

create policy "nannies_insert_own" on public.nannies
  for insert with check ((select auth.uid()) = user_id);

create policy "nannies_update_own" on public.nannies
  for update using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

-- NANNY AVAILABILITY: remove ALL policy; create one SELECT and separate write policies
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

-- ADVERTISEMENTS: wrap auth.uid
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

-- ADVERTISEMENT AVAILABILITY: remove multiple SELECT policies; split write policies
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

-- BOOKINGS: wrap auth.uid and split
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

-- REVIEWS: wrap auth.uid
drop policy if exists "Parents can create reviews" on public.reviews;
drop policy if exists "Parents can update their own reviews" on public.reviews;
drop policy if exists "Parents can delete their own reviews" on public.reviews;

create policy "reviews_insert_parent" on public.reviews
  for insert with check ((select auth.uid()) = parent_id);

create policy "reviews_update_own" on public.reviews
  for update using ((select auth.uid()) = parent_id);

create policy "reviews_delete_own" on public.reviews
  for delete using ((select auth.uid()) = parent_id);


