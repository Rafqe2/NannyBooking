-- Fix bookings table foreign key constraint
-- Drop the old foreign key that references nannies table
-- Add new foreign key that references users table instead

-- Step 1: Drop the old foreign key constraint
ALTER TABLE public.bookings
  DROP CONSTRAINT IF EXISTS bookings_nanny_id_fkey;

-- Step 2: Add new foreign key constraint to users table
-- This ensures data integrity while using the users table
ALTER TABLE public.bookings
  ADD CONSTRAINT bookings_nanny_id_fkey 
  FOREIGN KEY (nanny_id) 
  REFERENCES public.users(id) 
  ON DELETE CASCADE;

-- Success message
DO $$
BEGIN
  RAISE NOTICE 'Updated bookings.nanny_id foreign key to reference users table! ✅';
END $$;

