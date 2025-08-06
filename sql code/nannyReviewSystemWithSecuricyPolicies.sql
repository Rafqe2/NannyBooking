-- Create reviews table
CREATE TABLE reviews (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    nanny_id UUID NOT NULL REFERENCES nannies(id) ON DELETE CASCADE,
    parent_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(nanny_id, parent_id)
);

-- Create indexes for better performance
CREATE INDEX idx_reviews_nanny_id ON reviews(nanny_id);
CREATE INDEX idx_reviews_parent_id ON reviews(parent_id);
CREATE INDEX idx_reviews_rating ON reviews(rating);

-- Enable Row Level Security
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Anyone can view reviews" ON reviews
    FOR SELECT USING (true);

CREATE POLICY "Parents can create reviews" ON reviews
    FOR INSERT WITH CHECK (auth.uid() = parent_id);

CREATE POLICY "Parents can update their own reviews" ON reviews
    FOR UPDATE USING (auth.uid() = parent_id);

CREATE POLICY "Parents can delete their own reviews" ON reviews
    FOR DELETE USING (auth.uid() = parent_id); 