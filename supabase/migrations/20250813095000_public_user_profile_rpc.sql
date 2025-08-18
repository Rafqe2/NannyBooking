-- Public user profile RPC to expose minimal safe fields for viewing profiles
-- Works for both nannies and parents; includes rating/reviews for nannies when available

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


