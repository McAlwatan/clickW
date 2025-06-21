-- Temporarily disable RLS for users table to allow registration
ALTER TABLE users DISABLE ROW LEVEL SECURITY;

-- Re-enable RLS after a moment (you can run this separately after testing)
-- ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Alternative: Create a very permissive policy for registration
-- DROP POLICY IF EXISTS "Allow user registration" ON users;
-- CREATE POLICY "Allow user registration" ON users FOR INSERT TO authenticated WITH CHECK (true);
