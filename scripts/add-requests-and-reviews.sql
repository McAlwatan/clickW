-- Add service requests table
CREATE TABLE IF NOT EXISTS service_requests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID REFERENCES users(id) ON DELETE CASCADE,
  provider_id UUID REFERENCES service_providers(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  budget DECIMAL(10,2) NOT NULL,
  deadline DATE NOT NULL,
  location TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'in_progress', 'completed', 'cancelled')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add reviews table
CREATE TABLE IF NOT EXISTS reviews (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID REFERENCES users(id) ON DELETE CASCADE,
  provider_id UUID REFERENCES service_providers(id) ON DELETE CASCADE,
  request_id UUID REFERENCES service_requests(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add user status tracking
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_seen TIMESTAMP WITH TIME ZONE DEFAULT NOW();
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_online BOOLEAN DEFAULT false;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_service_requests_provider ON service_requests(provider_id);
CREATE INDEX IF NOT EXISTS idx_service_requests_client ON service_requests(client_id);
CREATE INDEX IF NOT EXISTS idx_service_requests_status ON service_requests(status);
CREATE INDEX IF NOT EXISTS idx_reviews_provider ON reviews(provider_id);
CREATE INDEX IF NOT EXISTS idx_reviews_client ON reviews(client_id);
CREATE INDEX IF NOT EXISTS idx_users_online ON users(is_online);

-- Update provider ratings based on reviews
CREATE OR REPLACE FUNCTION update_provider_rating()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE service_providers 
  SET 
    rating = COALESCE((
      SELECT AVG(rating)::DECIMAL(3,2) 
      FROM reviews r 
      JOIN service_requests sr ON r.request_id = sr.id 
      WHERE sr.provider_id = (
        SELECT sr2.provider_id 
        FROM service_requests sr2 
        WHERE sr2.id = NEW.request_id
      )
    ), 0),
    total_reviews = COALESCE((
      SELECT COUNT(*) 
      FROM reviews r 
      JOIN service_requests sr ON r.request_id = sr.id 
      WHERE sr.provider_id = (
        SELECT sr2.provider_id 
        FROM service_requests sr2 
        WHERE sr2.id = NEW.request_id
      )
    ), 0)
  WHERE id = (
    SELECT sr.provider_id 
    FROM service_requests sr 
    WHERE sr.id = NEW.request_id
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic rating updates
DROP TRIGGER IF EXISTS trigger_update_provider_rating ON reviews;
CREATE TRIGGER trigger_update_provider_rating
  AFTER INSERT OR UPDATE OR DELETE ON reviews
  FOR EACH ROW
  EXECUTE FUNCTION update_provider_rating();

-- Grant permissions
GRANT ALL ON service_requests TO authenticated;
GRANT ALL ON reviews TO authenticated;
