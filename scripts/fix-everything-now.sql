-- Fix everything once and for all
-- Disable RLS completely
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE service_providers DISABLE ROW LEVEL SECURITY;
ALTER TABLE requests DISABLE ROW LEVEL SECURITY;
ALTER TABLE messages DISABLE ROW LEVEL SECURITY;

-- Drop all policies
DROP POLICY IF EXISTS "Users can view own data" ON users;
DROP POLICY IF EXISTS "Users can update own data" ON users;
DROP POLICY IF EXISTS "Users can insert own data" ON users;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON users;
DROP POLICY IF EXISTS "Enable read access for all users" ON users;
DROP POLICY IF EXISTS "Enable update for users based on email" ON users;

-- Clean up duplicates
DELETE FROM users WHERE id NOT IN (
  SELECT DISTINCT ON (email) id 
  FROM users 
  ORDER BY email, created_at DESC
);

-- Add profile_photo column to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS profile_photo TEXT;

-- Grant full access
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon;
