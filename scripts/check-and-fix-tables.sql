-- First, let's see what tables actually exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_type = 'BASE TABLE';

-- Drop any existing tables that might have wrong names
DROP TABLE IF EXISTS public.reviews CASCADE;
DROP TABLE IF EXISTS public.service_requests CASCADE;
DROP TABLE IF EXISTS public.requests CASCADE;

-- Create service_requests table (the one we need)
CREATE TABLE public.service_requests (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    client_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    provider_id UUID REFERENCES public.service_providers(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    budget DECIMAL(10,2) NOT NULL,
    location TEXT,
    deadline DATE NOT NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'in_progress', 'completed')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create reviews table
CREATE TABLE public.reviews (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    client_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    request_id UUID REFERENCES public.service_requests(id) ON DELETE CASCADE,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add some sample data for testing
INSERT INTO public.service_requests (client_id, provider_id, title, description, budget, location, deadline, status)
SELECT 
    u.id as client_id,
    sp.id as provider_id,
    'Sample Web Development Project' as title,
    'Need a professional website built with modern technologies' as description,
    1500.00 as budget,
    'New York, NY' as location,
    CURRENT_DATE + INTERVAL '30 days' as deadline,
    'completed' as status
FROM auth.users u
CROSS JOIN public.service_providers sp
LIMIT 1;

-- Add a sample review
INSERT INTO public.reviews (client_id, request_id, rating, comment)
SELECT 
    sr.client_id,
    sr.id,
    5,
    'Excellent work! Very professional and delivered on time. Highly recommended!'
FROM public.service_requests sr
WHERE sr.status = 'completed'
LIMIT 1;

-- Enable RLS
ALTER TABLE public.service_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

-- Create simple RLS policies (allow all for now to test)
CREATE POLICY "Allow all on service_requests" ON public.service_requests FOR ALL USING (true);
CREATE POLICY "Allow all on reviews" ON public.reviews FOR ALL USING (true);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_service_requests_provider_id ON public.service_requests(provider_id);
CREATE INDEX IF NOT EXISTS idx_reviews_request_id ON public.reviews(request_id);
