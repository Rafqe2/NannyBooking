-- Allow owners to read their own availability slots and extra locations even when ads are inactive
-- This fixes edit/preview flows which need to display data for inactive ads

-- AVAILABILITY SLOTS: owner select
drop policy if exists ad_slots_select_owner on public.advertisement_availability;
create policy ad_slots_select_owner on public.advertisement_availability
  for select using (
    exists (
      select 1
      from public.advertisements a
      where a.id = advertisement_id
        and a.user_id = (select auth.uid())
    )
  );

-- LOCATIONS: owner select
drop policy if exists ad_locs_select_owner on public.advertisement_locations;
create policy ad_locs_select_owner on public.advertisement_locations
  for select using (
    exists (
      select 1
      from public.advertisements a
      where a.id = advertisement_id
        and a.user_id = (select auth.uid())
    )
  );


