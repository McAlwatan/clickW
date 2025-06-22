-- First, let's check what data we have
SELECT 'Users' as table_name, count(*) as count FROM users
UNION ALL
SELECT 'Service Providers' as table_name, count(*) as count FROM service_providers
UNION ALL
SELECT 'Service Requests' as table_name, count(*) as count FROM service_requests;

-- Check the actual requests data
SELECT 
  sr.id,
  sr.title,
  sr.status,
  sr.client_id,
  sr.provider_id,
  u.first_name as client_name,
  sp.brand_name as provider_name
FROM service_requests sr
LEFT JOIN users u ON sr.client_id = u.id
LEFT JOIN service_providers sp ON sr.provider_id = sp.id
ORDER BY sr.created_at DESC;

-- Make sure we have proper foreign key relationships
ALTER TABLE service_requests 
DROP CONSTRAINT IF EXISTS service_requests_client_id_fkey;

ALTER TABLE service_requests 
ADD CONSTRAINT service_requests_client_id_fkey 
FOREIGN KEY (client_id) REFERENCES users(id) ON DELETE CASCADE;

ALTER TABLE service_requests 
DROP CONSTRAINT IF EXISTS service_requests_provider_id_fkey;

ALTER TABLE service_requests 
ADD CONSTRAINT service_requests_provider_id_fkey 
FOREIGN KEY (provider_id) REFERENCES service_providers(id) ON DELETE CASCADE;

-- Update RLS policies to be more permissive for debugging
DROP POLICY IF EXISTS "service_requests_select_policy" ON service_requests;
CREATE POLICY "service_requests_select_policy" ON service_requests
FOR SELECT USING (true);

DROP POLICY IF EXISTS "service_requests_insert_policy" ON service_requests;
CREATE POLICY "service_requests_insert_policy" ON service_requests
FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "service_requests_update_policy" ON service_requests;
CREATE POLICY "service_requests_update_policy" ON service_requests
FOR UPDATE USING (true);

-- Make sure the table structure is correct
ALTER TABLE service_requests 
ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_service_requests_updated_at ON service_requests;
CREATE TRIGGER update_service_requests_updated_at
    BEFORE UPDATE ON service_requests
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
