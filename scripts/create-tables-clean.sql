-- Drop existing policies first to avoid conflicts
DROP POLICY IF EXISTS "Users can view own data" ON users;
DROP POLICY IF EXISTS "Users can update own data" ON users;
DROP POLICY IF EXISTS "Users can insert during registration" ON users;
DROP POLICY IF EXISTS "Users can insert own data" ON users;
DROP POLICY IF EXISTS "Service providers are viewable by everyone" ON service_providers;
DROP POLICY IF EXISTS "Service providers can update own data" ON service_providers;
DROP POLICY IF EXISTS "Service providers can insert own data" ON service_providers;
DROP POLICY IF EXISTS "Requests viewable by involved parties" ON requests;
DROP POLICY IF EXISTS "Clients can create requests" ON requests;
DROP POLICY IF EXISTS "Involved parties can update requests" ON requests;
DROP POLICY IF EXISTS "Messages viewable by sender and receiver" ON messages;
DROP POLICY IF EXISTS "Users can send messages" ON messages;
DROP POLICY IF EXISTS "Users can update own messages" ON messages;

-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  user_type VARCHAR(20) NOT NULL CHECK (user_type IN ('client', 'provider')),
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  location JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create service_providers table
CREATE TABLE IF NOT EXISTS service_providers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  brand_name VARCHAR(255) NOT NULL,
  business_type VARCHAR(20) NOT NULL CHECK (business_type IN ('individual', 'group')),
  description TEXT NOT NULL,
  phone VARCHAR(50) NOT NULL,
  website VARCHAR(255),
  city VARCHAR(100) NOT NULL,
  street_name VARCHAR(255),
  zip_code VARCHAR(20),
  country VARCHAR(100) NOT NULL,
  services TEXT[] NOT NULL,
  years_experience VARCHAR(20) NOT NULL,
  hourly_rate DECIMAL(10,2) NOT NULL,
  portfolio_links TEXT[],
  certifications TEXT,
  languages TEXT[],
  availability VARCHAR(50),
  location JSONB NOT NULL,
  rating DECIMAL(3,2) DEFAULT 0,
  total_reviews INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create requests table
CREATE TABLE IF NOT EXISTS requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES users(id) ON DELETE CASCADE,
  provider_id UUID REFERENCES service_providers(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  budget DECIMAL(10,2) NOT NULL,
  deadline DATE,
  status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'in_progress', 'client_completed', 'completed')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create messages table
CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id UUID REFERENCES users(id) ON DELETE CASCADE,
  receiver_id UUID REFERENCES users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_user_type ON users(user_type);
CREATE INDEX IF NOT EXISTS idx_service_providers_user_id ON service_providers(user_id);
CREATE INDEX IF NOT EXISTS idx_service_providers_services ON service_providers USING GIN(services);
CREATE INDEX IF NOT EXISTS idx_service_providers_location ON service_providers USING GIN(location);
CREATE INDEX IF NOT EXISTS idx_requests_client_id ON requests(client_id);
CREATE INDEX IF NOT EXISTS idx_requests_provider_id ON requests(provider_id);
CREATE INDEX IF NOT EXISTS idx_requests_status ON requests(status);
CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_receiver_id ON messages(receiver_id);

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_providers ENABLE ROW LEVEL SECURITY;
ALTER TABLE requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for users table
CREATE POLICY "Users can view own data" ON users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own data" ON users FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own data" ON users FOR INSERT WITH CHECK (auth.uid() = id);

-- Create RLS policies for service_providers table
CREATE POLICY "Service providers are viewable by everyone" ON service_providers FOR SELECT TO authenticated USING (true);
CREATE POLICY "Service providers can update own data" ON service_providers FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Service providers can insert own data" ON service_providers FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Create RLS policies for requests table
CREATE POLICY "Requests viewable by involved parties" ON requests FOR SELECT USING (
  auth.uid() = client_id OR 
  auth.uid() = (SELECT user_id FROM service_providers WHERE id = provider_id)
);
CREATE POLICY "Clients can create requests" ON requests FOR INSERT WITH CHECK (auth.uid() = client_id);
CREATE POLICY "Involved parties can update requests" ON requests FOR UPDATE USING (
  auth.uid() = client_id OR 
  auth.uid() = (SELECT user_id FROM service_providers WHERE id = provider_id)
);

-- Create RLS policies for messages table
CREATE POLICY "Messages viewable by sender and receiver" ON messages FOR SELECT USING (
  auth.uid() = sender_id OR auth.uid() = receiver_id
);
CREATE POLICY "Users can send messages" ON messages FOR INSERT WITH CHECK (auth.uid() = sender_id);
CREATE POLICY "Users can update own messages" ON messages FOR UPDATE USING (auth.uid() = sender_id OR auth.uid() = receiver_id);
