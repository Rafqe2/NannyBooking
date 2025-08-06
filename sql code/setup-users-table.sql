-- Minimal users table setup for Auth0 integration
-- Run this in your Supabase SQL editor

-- Drop the table if it exists (be careful with this in production!)
-- DROP TABLE IF EXISTS users;

-- Create the users table with minimal required columns
CREATE TABLE IF NOT EXISTS users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  user_type TEXT CHECK (user_type IN ('parent', 'nanny')),
  profile_completed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add index on email for better performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- Enable RLS (Row Level Security)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Create a simple policy that allows all operations (for testing)
-- In production, you should use more restrictive policies
CREATE POLICY "Allow all operations" ON users
  FOR ALL USING (true) WITH CHECK (true);

-- Alternative: If you want to use Supabase Auth instead of Auth0
-- CREATE POLICY "Users can view own profile" ON users
--   FOR SELECT USING (auth.email() = email);
-- CREATE POLICY "Users can update own profile" ON users
--   FOR UPDATE USING (auth.email() = email);
-- CREATE POLICY "Users can insert own profile" ON users
--   FOR INSERT WITH CHECK (auth.email() = email); 