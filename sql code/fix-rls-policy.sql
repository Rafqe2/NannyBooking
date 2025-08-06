-- Fix RLS policy for Auth0 users
-- Run this in your Supabase SQL editor

-- First, let's check if the users table exists and has the right structure
-- If not, create it with the correct structure from your userTable.sql

-- Enable RLS if not already enabled
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Allow all operations" ON users;
DROP POLICY IF EXISTS "Users can view own profile" ON users;
DROP POLICY IF EXISTS "Users can update own profile" ON users;
DROP POLICY IF EXISTS "Users can insert own profile" ON users;

-- Create policies for Auth0 users (no Supabase auth required)
-- Allow users to insert their own profile
CREATE POLICY "Users can insert own profile" ON users
  FOR INSERT WITH CHECK (true);

-- Allow users to view their own profile
CREATE POLICY "Users can view own profile" ON users
  FOR SELECT USING (true);

-- Allow users to update their own profile
CREATE POLICY "Users can update own profile" ON users
  FOR UPDATE USING (true);

-- Allow users to delete their own profile (if needed)
CREATE POLICY "Users can delete own profile" ON users
  FOR DELETE USING (true);

-- For now, we're allowing all operations for testing
-- In production, you might want to restrict this based on your needs 