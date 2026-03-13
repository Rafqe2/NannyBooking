-- Database cleanup: remove legacy nannies table and all orphaned functions/tables
-- that were part of the original schema but replaced by the users-based architecture.
--
-- Safe to run because:
--  • bookings.nanny_id FK now points to users(id) (20250827010000)
--  • All RPC functions were updated to not reference nannies (20250827000000+)
--  • reviews table was updated to use reviewee_id/reviewer_id (20250826100000+)
--  • auto_deactivate trigger was fixed (20250830020000)

-- ── Drop legacy trigger that fired before the schema was updated ───────────────
DROP TRIGGER IF EXISTS update_nanny_rating ON public.reviews;
DROP FUNCTION IF EXISTS public.update_nanny_rating_on_review() CASCADE;

-- ── Drop old nanny-centric RPC functions replaced by the new architecture ─────
DROP FUNCTION IF EXISTS public.check_nanny_availability(uuid, date, date);
DROP FUNCTION IF EXISTS public.get_available_nannies(varchar, date, date);
DROP FUNCTION IF EXISTS public.ensure_nanny_profile(uuid);
DROP FUNCTION IF EXISTS public.get_nanny_profile(uuid);

-- ── Drop legacy tables ────────────────────────────────────────────────────────
-- nanny_availability was replaced by advertisement_availability
DROP TABLE IF EXISTS public.nanny_availability CASCADE;

-- nannies table is fully replaced by users.user_type = 'nanny'
-- All FK references have been migrated away; safe to drop.
DROP TABLE IF EXISTS public.nannies CASCADE;

-- ── Verify bookings FK still points to users ─────────────────────────────────
-- (idempotent: no-op if already correct)
ALTER TABLE public.bookings
  DROP CONSTRAINT IF EXISTS bookings_nanny_id_fkey;

ALTER TABLE public.bookings
  ADD CONSTRAINT bookings_nanny_id_fkey
  FOREIGN KEY (nanny_id)
  REFERENCES public.users(id)
  ON DELETE CASCADE;

DO $$
BEGIN
  RAISE NOTICE 'Legacy nannies table and related objects dropped ✅';
END $$;
