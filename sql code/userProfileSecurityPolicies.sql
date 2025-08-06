-- Drop existing RLS policies for users table
DROP POLICY IF EXISTS "Users can view their own profile" ON users;
DROP POLICY IF EXISTS "Users can update their own profile" ON users;
DROP POLICY IF EXISTS "Users can insert their own profile" ON users;

-- Create new RLS policies that allow user creation during signup
CREATE POLICY "Users can view their own profile" ON users
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON users
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile" ON users
    FOR INSERT WITH CHECK (auth.uid() = id);

-- Add a policy to allow authenticated users to view their own profile
CREATE POLICY "Authenticated users can view their profile" ON users
    FOR SELECT USING (auth.role() = 'authenticated' AND auth.uid() = id);

-- Add a policy to allow profile creation during signup
CREATE POLICY "Allow profile creation during signup" ON users
    FOR INSERT WITH CHECK (auth.uid() = id OR auth.role() = 'authenticated'); 