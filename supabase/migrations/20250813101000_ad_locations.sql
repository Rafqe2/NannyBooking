-- Optional: multiple locations per advertisement
create table if not exists public.advertisement_locations (
  id uuid primary key default gen_random_uuid(),
  advertisement_id uuid not null references public.advertisements(id) on delete cascade,
  label text not null,
  order_index int not null default 0,
  created_at timestamptz not null default now()
);

alter table public.advertisement_locations enable row level security;

drop policy if exists "ad_locs_select_public_active" on public.advertisement_locations;
drop policy if exists "ad_locs_write_owner" on public.advertisement_locations;

create policy "ad_locs_select_public_active" on public.advertisement_locations
  for select using (
    exists (
      select 1 from public.advertisements a
      where a.id = advertisement_id and a.is_active = true
    )
  );

create policy "ad_locs_write_owner" on public.advertisement_locations
  for all using (
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


