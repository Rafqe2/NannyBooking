-- Create nannies table
CREATE TABLE nannies (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    location VARCHAR(255) NOT NULL,
    hourly_rate DECIMAL(8,2) NOT NULL CHECK (hourly_rate >= 0),
    experience_years INTEGER NOT NULL CHECK (experience_years >= 0),
    languages TEXT[] NOT NULL DEFAULT '{}',
    availability VARCHAR(255) NOT NULL,
    verified BOOLEAN DEFAULT FALSE,
    rating DECIMAL(3,2) DEFAULT 0 CHECK (rating >= 0 AND rating <= 5),
    reviews_count INTEGER DEFAULT 0 CHECK (reviews_count >= 0),
    bio TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_nannies_location ON nannies(location);
CREATE INDEX idx_nannies_user_id ON nannies(user_id);
CREATE INDEX idx_nannies_verified ON nannies(verified);
CREATE INDEX idx_nannies_rating ON nannies(rating);

-- Enable Row Level Security
ALTER TABLE nannies ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Anyone can view nannies" ON nannies
    FOR SELECT USING (true);

CREATE POLICY "Nannies can update their own profile" ON nannies
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own nanny profile" ON nannies
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Create trigger for updated_at
CREATE TRIGGER update_nannies_updated_at 
    BEFORE UPDATE ON nannies 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column(); 