-- First, let's check if we have the right table names and fix any inconsistencies

-- Drop existing tables if they exist with wrong names
DROP TABLE IF EXISTS public.service_requests CASCADE;
DROP TABLE IF EXISTS public.requests CASCADE;
DROP TABLE IF EXISTS public.reviews CASCADE;

-- Create the correct service_requests table
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

-- Create indexes for better performance
CREATE INDEX idx_service_requests_client_id ON public.service_requests(client_id);
CREATE INDEX idx_service_requests_provider_id ON public.service_requests(provider_id);
CREATE INDEX idx_service_requests_status ON public.service_requests(status);
CREATE INDEX idx_reviews_request_id ON public.reviews(request_id);

-- Enable RLS
ALTER TABLE public.service_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for service_requests
CREATE POLICY "Users can view their own requests as client" ON public.service_requests
    FOR SELECT USING (auth.uid() = client_id);

CREATE POLICY "Providers can view requests sent to them" ON public.service_requests
    FOR SELECT USING (
        provider_id IN (
            SELECT id FROM public.service_providers WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Clients can create requests" ON public.service_requests
    FOR INSERT WITH CHECK (auth.uid() = client_id);

CREATE POLICY "Providers can update their requests" ON public.service_requests
    FOR UPDATE USING (
        provider_id IN (
            SELECT id FROM public.service_providers WHERE user_id = auth.uid()
        )
    );

-- Create RLS policies for reviews
CREATE POLICY "Anyone can view reviews" ON public.reviews
    FOR SELECT USING (true);

CREATE POLICY "Clients can create reviews for their completed requests" ON public.reviews
    FOR INSERT WITH CHECK (
        auth.uid() = client_id AND
        EXISTS (
            SELECT 1 FROM public.service_requests 
            WHERE id = request_id 
            AND client_id = auth.uid() 
            AND status = 'completed'
        )
    );

-- Create function to update provider ratings
CREATE OR REPLACE FUNCTION update_provider_rating()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE public.service_providers 
    SET 
        rating = (
            SELECT COALESCE(AVG(r.rating), 0)
            FROM public.reviews r
            JOIN public.service_requests sr ON r.request_id = sr.id
            WHERE sr.provider_id = (
                SELECT provider_id FROM public.service_requests WHERE id = NEW.request_id
            )
        ),
        total_reviews = (
            SELECT COUNT(*)
            FROM public.reviews r
            JOIN public.service_requests sr ON r.request_id = sr.id
            WHERE sr.provider_id = (
                SELECT provider_id FROM public.service_requests WHERE id = NEW.request_id
            )
        )
    WHERE id = (
        SELECT provider_id FROM public.service_requests WHERE id = NEW.request_id
    );
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to update ratings when reviews are added
CREATE TRIGGER update_provider_rating_trigger
    AFTER INSERT ON public.reviews
    FOR EACH ROW
    EXECUTE FUNCTION update_provider_rating();
