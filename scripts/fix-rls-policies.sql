-- Drop existing policies
DROP POLICY IF EXISTS "Users can view own data" ON users;
DROP POLICY IF EXISTS "Users can update own data" ON users;

-- Create new policies that allow registration
CREATE POLICY "Users can view own data" ON users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own data" ON users FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert during registration" ON users FOR INSERT WITH CHECK (true);

-- Also fix service providers policy
DROP POLICY IF EXISTS "Service providers can insert own data" ON service_providers;
CREATE POLICY "Service providers can insert own data" ON service_providers FOR INSERT WITH CHECK (true);
