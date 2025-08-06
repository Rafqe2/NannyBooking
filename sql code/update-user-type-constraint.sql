-- Update user_type constraint to allow "pending" value
-- Run this in your Supabase SQL editor

-- First, drop the existing constraint
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_user_type_check;

-- Create new constraint that includes "pending"
ALTER TABLE users ADD CONSTRAINT users_user_type_check CHECK (
  (user_type)::text = any (
    (
      array[
        'parent'::character varying,
        'nanny'::character varying,
        'admin'::character varying,
        'pending'::character varying
      ]
    )::text[]
  )
);

-- Update any existing users with null user_type to "pending"
UPDATE users SET user_type = 'pending' WHERE user_type IS NULL; 