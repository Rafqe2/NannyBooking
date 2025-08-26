-- Exclude expired ads from search, and auto-disable short-term ads with only past dates

-- 1) Update search_ads to hide expired short-term ads (those with no slots >= today)
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
      and (
        a.type = 'long-term' or exists (
          select 1
          from public.advertisement_availability av
          where av.advertisement_id = a.id
            and av.available_date >= current_date -- today counts
        )
      )
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
        and (
          a.type = 'long-term' or exists (
            select 1
            from public.advertisement_availability av
            where av.advertisement_id = a.id
              and av.available_date >= current_date -- today counts
          )
        )
        and (p_location is null or a.location_city ilike '%' || p_location || '%')
        and (
          viewer_type is null
          or (viewer_type = 'parent' and u.user_type = 'nanny')
          or (viewer_type = 'nanny' and u.user_type = 'parent')
        )
        and ((select auth.uid()) is null or a.user_id <> (select auth.uid()))
    ),
    eligible as (
      -- Flexible overlap within requested range
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


-- 2) Auto-disable short-term ads when all availability is in the past
create or replace function public.update_ad_active_status(p_ad_id uuid)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  update public.advertisements a
  set is_active = false
  where a.id = p_ad_id
    and a.type = 'short-term'
    and a.is_active = true
    and not exists (
      select 1
      from public.advertisement_availability av
      where av.advertisement_id = p_ad_id
        and av.available_date >= current_date -- today counts
    );
end;
$$;

-- Single trigger to react to insert/update/delete of slots
create or replace function public.tg_ad_availability_after_change()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_ad_id uuid;
begin
  v_ad_id := coalesce(NEW.advertisement_id, OLD.advertisement_id);
  if v_ad_id is not null then
    perform public.update_ad_active_status(v_ad_id);
  end if;
  return null;
end;
$$;

drop trigger if exists trg_ad_availability_after_change on public.advertisement_availability;
create trigger trg_ad_availability_after_change
after insert or update or delete on public.advertisement_availability
for each row execute function public.tg_ad_availability_after_change();


-- 3) Optional: job to expire past ads daily (safe to run anytime)
create or replace function public.expire_past_ads()
returns integer
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_updated integer;
begin
  update public.advertisements a
  set is_active = false
  where a.type = 'short-term'
    and a.is_active = true
    and not exists (
      select 1 from public.advertisement_availability av
      where av.advertisement_id = a.id
        and av.available_date >= current_date
    );
  GET DIAGNOSTICS v_updated = ROW_COUNT;
  return v_updated;
end;
$$;

-- To schedule daily with Supabase Scheduled Jobs, configure a daily call to:
-- select public.expire_past_ads();


