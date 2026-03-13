-- Auto-expiry for pending bookings whose date has passed.
--
-- The profile page already calls auto_cancel_expired_pending_bookings() on load,
-- but the function never existed — it was silently failing.
-- This migration:
--  1. Adds 'expired' as a valid booking status
--  2. Creates auto_cancel_expired_pending_bookings() to set status = 'expired'
--  3. Fixes get_pending_booking_count_for_me to exclude expired bookings

-- ── 1. Extend status check constraint ────────────────────────────────────────
ALTER TABLE public.bookings
  DROP CONSTRAINT IF EXISTS bookings_status_check;

ALTER TABLE public.bookings
  ADD CONSTRAINT bookings_status_check
  CHECK (status::text = ANY (ARRAY[
    'pending', 'confirmed', 'cancelled', 'completed', 'expired'
  ]));

-- ── 2. Create the auto-expire function ───────────────────────────────────────
-- Marks any pending booking whose start_date < today as 'expired'.
-- Called from the client on profile load (no pg_cron needed).
CREATE OR REPLACE FUNCTION public.auto_cancel_expired_pending_bookings()
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
DECLARE
  v_uid uuid := (SELECT auth.uid());
BEGIN
  IF v_uid IS NULL THEN RETURN; END IF;

  UPDATE public.bookings
  SET status = 'expired', updated_at = now()
  WHERE status = 'pending'
    AND start_date < CURRENT_DATE
    AND (parent_id = v_uid OR nanny_id = v_uid);
END; $$;

REVOKE ALL ON FUNCTION public.auto_cancel_expired_pending_bookings() FROM public;
GRANT EXECUTE ON FUNCTION public.auto_cancel_expired_pending_bookings() TO authenticated;

-- ── 3. Fix pending count — exclude expired (and past-date pending) ───────────
CREATE OR REPLACE FUNCTION public.get_pending_booking_count_for_me()
RETURNS integer
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
DECLARE
  v_uid  uuid := (SELECT auth.uid());
  v_count integer;
BEGIN
  IF v_uid IS NULL THEN RETURN 0; END IF;

  SELECT COUNT(*) INTO v_count
  FROM public.bookings b
  WHERE b.status = 'pending'
    AND b.start_date >= CURRENT_DATE   -- only future/today bookings
    AND (b.parent_id = v_uid OR b.nanny_id = v_uid);

  RETURN COALESCE(v_count, 0);
END; $$;

REVOKE ALL ON FUNCTION public.get_pending_booking_count_for_me() FROM public;
GRANT EXECUTE ON FUNCTION public.get_pending_booking_count_for_me() TO authenticated;

DO $$
BEGIN
  RAISE NOTICE 'Booking expiry system created ✅';
END $$;
