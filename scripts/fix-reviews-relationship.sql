-- Drop existing reviews table if it exists
DROP TABLE IF EXISTS public.reviews CASCADE;

-- Recreate reviews table with proper foreign key relationships
CREATE TABLE public.reviews (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    client_id UUID NOT NULL,
    request_id UUID NOT NULL,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Add foreign key constraints
    CONSTRAINT fk_reviews_client_id FOREIGN KEY (client_id) REFERENCES auth.users(id) ON DELETE CASCADE,
    CONSTRAINT fk_reviews_request_id FOREIGN KEY (request_id) REFERENCES public.service_requests(id) ON DELETE CASCADE
);

-- Enable RLS
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

-- Create RLS policy
CREATE POLICY "Allow all on reviews" ON public.reviews FOR ALL USING (true);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_reviews_client_id ON public.reviews(client_id);
CREATE INDEX IF NOT EXISTS idx_reviews_request_id ON public.reviews(request_id);

-- Add some sample reviews for testing
INSERT INTO public.reviews (client_id, request_id, rating, comment)
SELECT 
    sr.client_id,
    sr.id,
    5,
    'Excellent work! Very professional and delivered on time. Highly recommended!'
FROM public.service_requests sr
WHERE sr.status = 'completed'
LIMIT 1;

INSERT INTO public.reviews (client_id, request_id, rating, comment)
SELECT 
    sr.client_id,
    sr.id,
    4,
    'Good quality work, would hire again.'
FROM public.service_requests sr
WHERE sr.status = 'completed'
LIMIT 1;
