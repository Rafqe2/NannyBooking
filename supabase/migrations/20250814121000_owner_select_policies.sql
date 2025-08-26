-- Consolidate SELECT policies to allow:
-- 1) Public read for active ads
-- 2) Owner read for their own ads (even when inactive)

-- advertisement_availability
drop policy if exists ad_slots_select_public_active on public.advertisement_availability;
drop policy if exists ad_slots_select_owner on public.advertisement_availability;

create policy ad_slots_select_public_or_owner on public.advertisement_availability
  for select using (
    exists (
      select 1 from public.advertisements a
      where a.id = advertisement_id
        and (
          a.is_active = true or a.user_id = (select auth.uid())
        )
    )
  );

-- advertisement_locations
drop policy if exists ad_locs_select_public_active on public.advertisement_locations;
drop policy if exists ad_locs_select_owner on public.advertisement_locations;

create policy ad_locs_select_public_or_owner on public.advertisement_locations
  for select using (
    exists (
      select 1 from public.advertisements a
      where a.id = advertisement_id
        and (
          a.is_active = true or a.user_id = (select auth.uid())
        )
    )
  );


