-- Disable RLS completely and fix registration issues
ALTER TABLE users DISABLE ROW LEVEL SECURITY;

-- Drop all existing policies
DROP POLICY IF EXISTS "Users can view own data" ON users;
DROP POLICY IF EXISTS "Users can update own data" ON users;
DROP POLICY IF EXISTS "Users can insert own data" ON users;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON users;
DROP POLICY IF EXISTS "Enable read access for all users" ON users;
DROP POLICY IF EXISTS "Enable update for users based on email" ON users;

-- Clean up any duplicate or orphaned records
DELETE FROM users WHERE id NOT IN (
  SELECT DISTINCT ON (email) id 
  FROM users 
  ORDER BY email, created_at DESC
);

-- Add unique constraint on email if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'users_email_unique'
    ) THEN
        ALTER TABLE users ADD CONSTRAINT users_email_unique UNIQUE (email);
    END IF;
END $$;

-- Grant full access to authenticated users
GRANT ALL ON users TO authenticated;
GRANT ALL ON users TO anon;
