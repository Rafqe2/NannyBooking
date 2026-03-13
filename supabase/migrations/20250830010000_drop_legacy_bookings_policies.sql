-- Drop legacy RLS policies on bookings that still reference the deleted nannies table.
-- These were created in the initial schema and not removed by the remove_nannies_table_dependency migration.
-- Without this, UPDATE on bookings fails with "relation public.nannies does not exist".

DROP POLICY IF EXISTS "Users can update their own bookings" ON public.bookings;
DROP POLICY IF EXISTS "Users can view their own bookings" ON public.bookings;
DROP POLICY IF EXISTS "Users can insert their own bookings" ON public.bookings;
DROP POLICY IF EXISTS "Users can delete their own bookings" ON public.bookings;

-- Ensure the correct replacement policies exist (idempotent)
DROP POLICY IF EXISTS bookings_select_participants ON public.bookings;
DROP POLICY IF EXISTS bookings_insert_participants ON public.bookings;
DROP POLICY IF EXISTS bookings_update_participants ON public.bookings;

CREATE POLICY bookings_select_participants ON public.bookings
  FOR SELECT USING (
    (SELECT auth.uid()) = parent_id
    OR
    (SELECT auth.uid()) = nanny_id
  );

CREATE POLICY bookings_insert_participants ON public.bookings
  FOR INSERT WITH CHECK (
    (SELECT auth.uid()) = parent_id
    OR
    (SELECT auth.uid()) = nanny_id
  );

CREATE POLICY bookings_update_participants ON public.bookings
  FOR UPDATE USING (
    (SELECT auth.uid()) = parent_id
    OR
    (SELECT auth.uid()) = nanny_id
  ) WITH CHECK (
    (SELECT auth.uid()) = parent_id
    OR
    (SELECT auth.uid()) = nanny_id
  );
