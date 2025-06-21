-- Drop all existing policies for users table
DROP POLICY IF EXISTS "Users can view own data" ON users;
DROP POLICY IF EXISTS "Users can update own data" ON users;
DROP POLICY IF EXISTS "Users can insert during registration" ON users;

-- Create new policies that allow registration and proper access
CREATE POLICY "Users can view own data" ON users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own data" ON users FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own data" ON users FOR INSERT WITH CHECK (auth.uid() = id);

-- Also fix service providers policies
DROP POLICY IF EXISTS "Service providers can insert own data" ON service_providers;
CREATE POLICY "Service providers can insert own data" ON service_providers FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Make sure requests policies allow proper access
DROP POLICY IF EXISTS "Clients can create requests" ON requests;
CREATE POLICY "Clients can create requests" ON requests FOR INSERT WITH CHECK (auth.uid() = client_id);

-- Ensure messages policies work correctly
DROP POLICY IF EXISTS "Users can send messages" ON messages;
CREATE POLICY "Users can send messages" ON messages FOR INSERT WITH CHECK (auth.uid() = sender_id);
